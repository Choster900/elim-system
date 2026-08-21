<script setup lang="ts">
import {
    ArrowLeft,
    CalendarDays,
    Check,
    Info,
    LocateFixed,
    MapPin,
    MapPinned,
    Pipette,
    Save,
    Settings2,
    Trash2,
    Users,
} from '@lucide/vue'
import { useAppToast } from '~/presentation/shared/composables/useAppToast'
import {
    useMeetingLeadersQuery,
    useMeetingMembersQuery,
    useMeetingSectorsQuery,
    useMeetingTypesQuery,
} from '~/presentation/meetings/composables/useMeetingCatalogQueries'
import {
    useCreateMeetingMutation,
    useUpdateMeetingMutation,
} from '~/presentation/meetings/composables/useMeetingMutations'
import { useMeetingQuery } from '~/presentation/meetings/composables/useMeetingQuery'
import {
    frequencyOptions,
    meetingColorPalette,
    monthlyModeOptions,
    weekdayOptions,
    weekOrdinalOptions,
} from '~/presentation/meetings/constants/meeting.constants'
import type {
    MeetingFrequency,
    MeetingInput,
    MonthlyMode,
} from '~/presentation/meetings/interfaces/meeting.interface'
import { formatMeetingRecurrence } from '~/presentation/meetings/utils/meeting-format.util'
import { EL_SALVADOR_CENTER } from '~/presentation/territories/constants/territory.constants'
import { resolveHttpErrorMessage } from '~/utils/http/resolve-http-error-message.util'

type LatLng = [number, number]

defineOptions({ name: 'MeetingFormView' })

const route = useRoute()
const toast = useAppToast()

const meetingId = computed(() => {
    const raw = route.params.id as string | undefined
    return raw ? Number(raw) : null
})
const isEditing = computed(() => meetingId.value !== null)

useHead({
    title: () => (isEditing.value ? 'Editar reunión · Sistema' : 'Nueva reunión · Sistema'),
})

const meetingQuery = useMeetingQuery(meetingId)
const meetingTypesQuery = useMeetingTypesQuery()
const sectorsQuery = useMeetingSectorsQuery()
const membersQuery = useMeetingMembersQuery()
const leadersQuery = useMeetingLeadersQuery()
const createMeetingMutation = useCreateMeetingMutation()
const updateMeetingMutation = useUpdateMeetingMutation()

const meetingTypes = computed(() => meetingTypesQuery.data.value ?? [])
const sectors = computed(() => sectorsQuery.data.value ?? [])
const members = computed(() => membersQuery.data.value ?? [])
const leaders = computed(() => leadersQuery.data.value ?? [])
const isLoading = computed(
    () =>
        meetingTypesQuery.isPending.value ||
        sectorsQuery.isPending.value ||
        membersQuery.isPending.value ||
        leadersQuery.isPending.value ||
        (isEditing.value && meetingQuery.isPending.value),
)
const loadError = computed(
    () =>
        meetingTypesQuery.error.value ??
        sectorsQuery.error.value ??
        membersQuery.error.value ??
        leadersQuery.error.value ??
        meetingQuery.error.value,
)
const notFound = computed(() => isEditing.value && meetingQuery.isError.value)

if (import.meta.server) {
    onServerPrefetch(() =>
        Promise.allSettled([
            meetingTypesQuery.suspense(),
            sectorsQuery.suspense(),
            membersQuery.suspense(),
            leadersQuery.suspense(),
            ...(isEditing.value ? [meetingQuery.suspense()] : []),
        ]),
    )
}

interface MeetingForm {
    title: string
    description: string
    typeId: number
    sectorId: number
    leaderId: number
    supervisorId: number
    coSupervisorIds: number[]
    date: string
    recurrenceEndDate: string | null
    startTime: string
    endTime: string
    location: string
    frequency: MeetingFrequency
    monthlyMode: MonthlyMode
    weekOrdinal: number
    weekday: number
    expectedAttendees: number
    isActive: boolean
    isPublic: boolean
    notes: string
    color: string
    position: LatLng | null
}

function emptyForm(): MeetingForm {
    return {
        title: '',
        description: '',
        typeId: 0,
        sectorId: 0,
        leaderId: 0,
        supervisorId: 0,
        coSupervisorIds: [],
        date: new Date().toISOString().slice(0, 10),
        recurrenceEndDate: null,
        startTime: '19:00',
        endTime: '20:30',
        location: '',
        frequency: 'unica',
        monthlyMode: 'dia_fijo',
        weekOrdinal: 1,
        weekday: new Date().getDay(),
        expectedAttendees: 0,
        isActive: true,
        isPublic: false,
        notes: '',
        color: meetingColorPalette[0]!,
        position: null,
    }
}

const form = reactive(emptyForm())
const customColor = ref(form.color.toUpperCase())
const colorError = ref('')
const formInitialized = ref(false)
const isClientReady = ref(false)

function normalizeHexColor(value: string) {
    const trimmed = value.trim()
    const candidate = trimmed.startsWith('#') ? trimmed : `#${trimmed}`
    return /^#[0-9a-f]{6}$/i.test(candidate) ? candidate.toLowerCase() : null
}

function contrastColor(color: string) {
    const normalized = normalizeHexColor(color)
    if (!normalized) return '#FFFFFF'
    const red = Number.parseInt(normalized.slice(1, 3), 16)
    const green = Number.parseInt(normalized.slice(3, 5), 16)
    const blue = Number.parseInt(normalized.slice(5, 7), 16)
    return (red * 299 + green * 587 + blue * 114) / 1000 > 155 ? '#211A16' : '#FFFFFF'
}

function applyCustomColor() {
    const color = normalizeHexColor(customColor.value)
    if (!color) {
        colorError.value = 'Usa un hexadecimal de 6 caracteres, por ejemplo #E9C176.'
        return
    }
    colorError.value = ''
    form.color = color
}

function selectPaletteColor(color: string) {
    colorError.value = ''
    form.color = color
}

// ===== Map location picker (Leaflet) =====
const mapEl = ref<HTMLElement | null>(null)
let map: import('leaflet').Map | null = null
let marker: import('leaflet').Marker | null = null
let L: typeof import('leaflet') | null = null
let mapInitialization: Promise<void> | null = null
let mapGeneration = 0
let isUnmounted = false
const isLocating = ref(false)
const locationError = ref('')

function sectorCentroid(sectorId: number): LatLng | null {
    const polygon = sectors.value.find((s) => s.id === sectorId)?.polygon
    if (!polygon || polygon.length === 0) return null
    const sum = polygon.reduce((acc, [lat, lng]) => [acc[0] + lat, acc[1] + lng], [0, 0])
    return [sum[0]! / polygon.length, sum[1]! / polygon.length]
}

function markerIcon() {
    return L!.divIcon({
        className: 'meeting-pin',
        html: `<span style="display:block;width:20px;height:20px;border-radius:50%;background:${form.color};border:2px solid #fff;box-shadow:0 0 0 4px rgba(0,0,0,.28)"></span>`,
        iconSize: [20, 20],
        iconAnchor: [10, 10],
    })
}

function syncMarkerFromForm() {
    if (!map || !L) return
    if (!form.position) {
        if (marker) {
            marker.remove()
            marker = null
        }
        return
    }
    const latlng = form.position
    if (marker) {
        marker.setLatLng(latlng)
        marker.setIcon(markerIcon())
    } else {
        marker = L.marker(latlng, { draggable: true, icon: markerIcon() }).addTo(map)
        marker.on('dragend', () => {
            const ll = marker!.getLatLng()
            form.position = [Number(ll.lat.toFixed(6)), Number(ll.lng.toFixed(6))]
        })
    }
}

function setPosition(lat: number, lng: number) {
    form.position = [Number(lat.toFixed(6)), Number(lng.toFixed(6))]
    syncMarkerFromForm()
}

function clearPosition() {
    form.position = null
    locationError.value = ''
    syncMarkerFromForm()
}

function useCurrentLocation() {
    locationError.value = ''

    if (!import.meta.client || !navigator.geolocation) {
        locationError.value = 'Tu navegador no permite obtener la ubicación actual.'
        return
    }

    isLocating.value = true
    navigator.geolocation.getCurrentPosition(
        ({ coords }) => {
            if (isUnmounted) return
            setPosition(coords.latitude, coords.longitude)
            map?.setView([coords.latitude, coords.longitude], 17)
            isLocating.value = false
            toast.success('Ubicación actual colocada en el mapa')
        },
        (error) => {
            if (isUnmounted) return
            if (error.code === error.PERMISSION_DENIED) {
                locationError.value = 'No se concedió permiso para acceder a tu ubicación.'
            } else if (error.code === error.TIMEOUT) {
                locationError.value =
                    'La búsqueda de tu ubicación tardó demasiado. Inténtalo de nuevo.'
            } else {
                locationError.value = 'No pudimos obtener tu ubicación. Inténtalo de nuevo.'
            }
            isLocating.value = false
        },
        {
            enableHighAccuracy: true,
            timeout: 12_000,
            maximumAge: 30_000,
        },
    )
}

function centerOnSector() {
    if (!map) return
    const c = sectorCentroid(form.sectorId)
    if (c) map.setView(c, 13)
}

async function createMap(generation: number) {
    if (!L) {
        const leafletModule = await import('leaflet')
        L = leafletModule.default ?? leafletModule
    }
    if (isUnmounted || generation !== mapGeneration) return

    await nextTick()
    const container = mapEl.value
    if (isUnmounted || generation !== mapGeneration || !container?.isConnected || !L || map) {
        return
    }

    map = L.map(container, {
        zoomControl: true,
        attributionControl: false,
        scrollWheelZoom: false,
    })
    map.zoomControl.setPosition('topright')
    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
        subdomains: 'abcd',
        maxZoom: 20,
    }).addTo(map)
    map.on('click', (e) => setPosition(e.latlng.lat, e.latlng.lng))
    if (form.position) map.setView(form.position, 15)
    else {
        const center = sectorCentroid(form.sectorId) ?? EL_SALVADOR_CENTER
        map.setView(center, sectorCentroid(form.sectorId) ? 13 : 9)
    }
    syncMarkerFromForm()
    const current = map
    setTimeout(() => {
        if (!isUnmounted && map === current && container.isConnected) {
            current.invalidateSize()
        }
    }, 80)
}

async function initMap() {
    if (!import.meta.client || map || notFound.value || isLoading.value || loadError.value) {
        return
    }
    if (mapInitialization) return mapInitialization

    const generation = mapGeneration
    mapInitialization = createMap(generation)
    try {
        await mapInitialization
    } finally {
        mapInitialization = null
    }
}

// Re-center to the chosen sector while no explicit pin has been dropped yet.
watch(
    () => form.sectorId,
    (sectorId) => {
        if (!form.position) centerOnSector()
        const sector = sectors.value.find((item) => item.id === sectorId)
        form.supervisorId = sector?.supervisorId ?? 0
        form.coSupervisorIds = form.coSupervisorIds.filter(
            (memberId) => memberId !== form.supervisorId,
        )
        formErrors.supervisorId = null
    },
)
// Keep the pin colour in sync with the selected label colour.
watch(
    () => form.color,
    (color) => {
        customColor.value = color.toUpperCase()
        colorError.value = ''
        if (marker) marker.setIcon(markerIcon())
    },
)

watch(
    () => form.frequency,
    (frequency) => {
        if (frequency === 'unica') form.recurrenceEndDate = null
    },
)

watch(
    [isLoading, loadError, () => meetingQuery.data.value, meetingTypes, sectors, members, leaders],
    async () => {
        if (formInitialized.value || isLoading.value || loadError.value) return

        if (isEditing.value) {
            const existing = meetingQuery.data.value
            if (!existing) return

            Object.assign(form, {
                title: existing.title,
                description: existing.description ?? '',
                typeId: existing.typeId,
                sectorId: existing.sectorId,
                leaderId: existing.leaderId,
                supervisorId: existing.supervisorId,
                coSupervisorIds: [...existing.coSupervisorIds],
                date: existing.date,
                recurrenceEndDate: existing.recurrenceEndDate,
                startTime: existing.startTime,
                endTime: existing.endTime,
                location: existing.location,
                frequency: existing.frequency,
                monthlyMode: existing.monthlyMode ?? 'dia_fijo',
                weekOrdinal: existing.weekOrdinal ?? 1,
                weekday: existing.weekday ?? new Date(`${existing.date}T00:00:00Z`).getUTCDay(),
                expectedAttendees: existing.expectedAttendees,
                isActive: existing.isActive,
                isPublic: existing.isPublic,
                notes: existing.notes ?? '',
                color: existing.color,
                position:
                    existing.latitude !== null && existing.longitude !== null
                        ? [existing.latitude, existing.longitude]
                        : null,
            })
        } else {
            form.typeId = meetingTypes.value[0]?.id ?? 0
            form.sectorId = sectors.value[0]?.id ?? 0
            form.leaderId = leaders.value[0]?.id ?? 0
            form.supervisorId = sectors.value[0]?.supervisorId ?? 0
        }

        formInitialized.value = true
        if (import.meta.client) {
            await nextTick()
            await initMap()
        }
    },
    { immediate: true },
)

if (import.meta.client) {
    watch(
        loadError,
        (error) => {
            if (error) {
                toast.error(resolveHttpErrorMessage(error, 'No fue posible cargar la reunión'))
            }
        },
        { immediate: true },
    )
}

onMounted(async () => {
    isClientReady.value = true
    await nextTick()
    await initMap()
})

onBeforeUnmount(() => {
    isUnmounted = true
    mapGeneration += 1
    if (map) {
        map.remove()
        map = null
    }
    marker = null
})

const formErrors = reactive<Record<string, string | null>>({
    title: null,
    date: null,
    recurrenceEndDate: null,
    startTime: null,
    endTime: null,
    sectorId: null,
    leaderId: null,
    supervisorId: null,
})

function clearFormErrors() {
    for (const key of Object.keys(formErrors)) formErrors[key] = null
}

function validateForm() {
    clearFormErrors()
    let ok = true
    if (!form.title.trim()) {
        formErrors.title = 'El título es obligatorio'
        ok = false
    }
    if (!form.date) {
        formErrors.date = 'Selecciona una fecha'
        ok = false
    }
    if (
        form.frequency !== 'unica' &&
        form.recurrenceEndDate &&
        form.recurrenceEndDate < form.date
    ) {
        formErrors.recurrenceEndDate = 'Debe ser igual o posterior a la fecha de inicio'
        ok = false
    }
    if (!form.startTime) {
        formErrors.startTime = 'Hora de inicio obligatoria'
        ok = false
    }
    if (!form.endTime) {
        formErrors.endTime = 'Hora de fin obligatoria'
        ok = false
    }
    if (form.startTime && form.endTime && form.startTime >= form.endTime) {
        formErrors.endTime = 'Debe ser posterior al inicio'
        ok = false
    }
    if (!form.sectorId) {
        formErrors.sectorId = 'Asigna un sector'
        ok = false
    }
    if (!form.leaderId) {
        formErrors.leaderId = 'Asigna un líder con rol Líder'
        ok = false
    }
    if (!form.supervisorId) {
        formErrors.supervisorId = 'El sector seleccionado no tiene un supervisor asignado'
        ok = false
    }
    return ok
}

const isSaving = computed(
    () => createMeetingMutation.isPending.value || updateMeetingMutation.isPending.value,
)

function buildInput(): MeetingInput {
    return {
        typeId: form.typeId,
        sectorId: form.sectorId,
        leaderId: form.leaderId,
        supervisorId: form.supervisorId,
        coSupervisorIds: [...form.coSupervisorIds],
        title: form.title.trim(),
        description: form.description.trim() || null,
        date: form.date,
        recurrenceEndDate: form.frequency === 'unica' ? null : form.recurrenceEndDate,
        startTime: form.startTime,
        endTime: form.endTime,
        location: form.location.trim(),
        latitude: form.position ? form.position[0] : null,
        longitude: form.position ? form.position[1] : null,
        frequency: form.frequency,
        // Los campos del ordinal solo viajan cuando la recurrencia los usa.
        monthlyMode: form.frequency === 'mensual' ? form.monthlyMode : null,
        weekOrdinal:
            form.frequency === 'mensual' && form.monthlyMode === 'ordinal'
                ? form.weekOrdinal
                : null,
        weekday:
            form.frequency === 'mensual' && form.monthlyMode === 'ordinal' ? form.weekday : null,
        expectedAttendees: form.expectedAttendees,
        isActive: form.isActive,
        isPublic: form.isPublic,
        notes: form.notes.trim() || null,
        color: form.color,
    }
}

async function saveMeeting() {
    if (!validateForm()) {
        toast.error('Revisa los campos marcados en rojo')
        return
    }

    try {
        if (isEditing.value && meetingId.value !== null) {
            await updateMeetingMutation.mutateAsync({
                id: meetingId.value,
                input: buildInput(),
            })
            toast.success('Reunión actualizada')
        } else {
            await createMeetingMutation.mutateAsync(buildInput())
            toast.success('Reunión creada')
        }
        await navigateTo('/catalogos/reuniones')
    } catch (error) {
        toast.error(resolveHttpErrorMessage(error, 'No fue posible guardar la reunión'))
    }
}

function cancel() {
    navigateTo('/catalogos/reuniones')
}

const selectedType = computed(() => meetingTypes.value.find((t) => t.id === form.typeId))
const selectedSector = computed(() => sectors.value.find((s) => s.id === form.sectorId))
const selectedLeader = computed(() => leaders.value.find((member) => member.id === form.leaderId))
const selectedSupervisor = computed(() => ({
    fullName: selectedSector.value?.supervisorName ?? '',
}))
const isRecurring = computed(() => form.frequency !== 'unica')
const recurrenceSummary = computed(() =>
    formatMeetingRecurrence(
        form.date,
        form.startTime,
        form.endTime,
        form.frequency,
        form.recurrenceEndDate,
    ),
)
const coSupervisorOptions = computed(() =>
    members.value.filter((member) => member.id !== form.supervisorId),
)

const inputClass =
    'h-11 w-full rounded border border-outline-variant bg-surface-container px-3 text-sm text-on-surface placeholder:text-on-surface-variant/60 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary'
const labelClass = 'text-[11px] font-semibold uppercase tracking-wider text-on-surface-variant'
</script>

<template>
    <div class="pb-24 pt-20">
        <div
            class="sticky top-16 z-30 border-b border-outline-variant bg-surface/80 backdrop-blur-md"
        >
            <div
                class="mx-auto flex w-full max-w-system items-center justify-between gap-4 px-6 py-4 lg:px-10"
            >
                <div class="flex items-center gap-4">
                    <NuxtLink
                        to="/catalogos/reuniones"
                        class="flex size-9 items-center justify-center rounded-full border border-outline-variant text-on-surface-variant transition-colors hover:border-primary hover:text-primary"
                        aria-label="Volver"
                    >
                        <ArrowLeft class="size-4" />
                    </NuxtLink>
                    <div>
                        <p
                            class="text-[11px] font-semibold uppercase tracking-[0.3em] text-on-surface-variant"
                        >
                            Catálogos · Reuniones
                        </p>
                        <h1 class="font-display text-2xl font-semibold text-on-surface md:text-3xl">
                            {{ isEditing ? 'Editar reunión' : 'Nueva reunión' }}
                        </h1>
                    </div>
                </div>
                <div class="flex items-center gap-2">
                    <UiButton
                        variant="outline"
                        type="button"
                        class="h-10 rounded px-4 text-xs uppercase tracking-wider"
                        @click="cancel"
                    >
                        Cancelar
                    </UiButton>
                    <UiButton
                        type="button"
                        class="h-10 rounded px-5 text-xs uppercase tracking-wider"
                        :loading="isSaving"
                        :disabled="isSaving || isLoading || !!loadError"
                        @click="saveMeeting"
                    >
                        <Save class="mr-2 size-4" />
                        {{ isEditing ? 'Guardar cambios' : 'Crear reunión' }}
                    </UiButton>
                </div>
            </div>
        </div>

        <main class="mx-auto w-full max-w-system px-6 py-8 lg:px-10">
            <div
                v-if="isLoading || !formInitialized || !isClientReady"
                class="rounded-lg border border-outline-variant bg-surface-container p-8 text-center text-sm text-on-surface-variant"
            >
                Cargando información de la reunión…
            </div>

            <div
                v-else-if="notFound"
                class="mx-auto max-w-md rounded-lg border border-destructive/30 bg-destructive/10 p-6 text-center"
            >
                <p class="font-display text-lg font-semibold text-destructive">
                    Reunión no encontrada
                </p>
                <p class="mt-2 text-sm text-on-surface-variant">
                    La reunión que intentas editar ya no existe en el catálogo.
                </p>
                <NuxtLink
                    to="/catalogos/reuniones"
                    class="mt-4 inline-block text-xs font-semibold uppercase tracking-wider text-primary hover:underline"
                >
                    Volver al listado
                </NuxtLink>
            </div>

            <div
                v-else-if="loadError"
                class="mx-auto max-w-md rounded-lg border border-destructive/30 bg-destructive/10 p-6 text-center"
            >
                <p class="font-display text-lg font-semibold text-destructive">
                    No fue posible cargar el formulario
                </p>
                <p class="mt-2 text-sm text-on-surface-variant">
                    Regresa al listado e inténtalo nuevamente.
                </p>
            </div>

            <form
                v-else
                class="grid gap-6 lg:grid-cols-[1fr_320px]"
                novalidate
                @submit.prevent="saveMeeting"
            >
                <div class="space-y-6">
                    <UiCard class="p-6">
                        <div class="mb-5 flex items-center gap-3">
                            <Info class="size-5 text-primary" />
                            <div>
                                <h2 class="font-display text-lg font-semibold text-on-surface">
                                    Información general
                                </h2>
                                <p class="text-xs text-on-surface-variant">
                                    Identifica la reunión y su propósito.
                                </p>
                            </div>
                        </div>

                        <div class="grid gap-4 md:grid-cols-[1fr_240px]">
                            <div>
                                <label :class="labelClass" for="meeting-title">Título *</label>
                                <input
                                    id="meeting-title"
                                    v-model="form.title"
                                    type="text"
                                    placeholder="Ej. Reunión de líderes de jóvenes"
                                    :class="[
                                        inputClass,
                                        'mt-1',
                                        formErrors.title
                                            ? 'border-destructive focus:border-destructive focus:ring-destructive'
                                            : '',
                                    ]"
                                />
                                <p v-if="formErrors.title" class="mt-1 text-xs text-destructive">
                                    {{ formErrors.title }}
                                </p>
                            </div>
                            <div>
                                <label :class="labelClass">Tipo</label>
                                <div class="mt-1">
                                    <UiSearchSelect
                                        v-model="form.typeId"
                                        :options="meetingTypes"
                                        option-value="id"
                                        option-label="name"
                                        placeholder="Selecciona un tipo"
                                        search-placeholder="Buscar tipo..."
                                    />
                                </div>
                            </div>
                        </div>

                        <div class="mt-4">
                            <label :class="labelClass" for="meeting-desc">Descripción</label>
                            <textarea
                                id="meeting-desc"
                                v-model="form.description"
                                rows="3"
                                placeholder="Propósito, agenda principal, o cualquier contexto relevante."
                                :class="[
                                    'mt-1',
                                    inputClass,
                                    'h-auto resize-none py-2 leading-relaxed',
                                ]"
                            />
                        </div>
                    </UiCard>

                    <UiCard class="p-6">
                        <div class="mb-5 flex items-center gap-3">
                            <CalendarDays class="size-5 text-primary" />
                            <div>
                                <h2 class="font-display text-lg font-semibold text-on-surface">
                                    Programación
                                </h2>
                                <p class="text-xs text-on-surface-variant">
                                    Fecha, horario y recurrencia.
                                </p>
                            </div>
                        </div>

                        <div class="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                            <div>
                                <label :class="labelClass">Fecha de inicio *</label>
                                <div class="mt-1">
                                    <UiDatePicker
                                        v-model="form.date"
                                        mode="single"
                                        placeholder="Selecciona fecha"
                                        :invalid="!!formErrors.date"
                                    />
                                </div>
                                <p v-if="formErrors.date" class="mt-1 text-xs text-destructive">
                                    {{ formErrors.date }}
                                </p>
                            </div>
                            <div>
                                <label :class="labelClass" for="meeting-start">Inicio *</label>
                                <input
                                    id="meeting-start"
                                    v-model="form.startTime"
                                    type="time"
                                    :class="[
                                        inputClass,
                                        'mt-1',
                                        formErrors.startTime ? 'border-destructive' : '',
                                    ]"
                                />
                                <p
                                    v-if="formErrors.startTime"
                                    class="mt-1 text-xs text-destructive"
                                >
                                    {{ formErrors.startTime }}
                                </p>
                            </div>
                            <div>
                                <label :class="labelClass" for="meeting-end">Fin *</label>
                                <input
                                    id="meeting-end"
                                    v-model="form.endTime"
                                    type="time"
                                    :class="[
                                        inputClass,
                                        'mt-1',
                                        formErrors.endTime ? 'border-destructive' : '',
                                    ]"
                                />
                                <p v-if="formErrors.endTime" class="mt-1 text-xs text-destructive">
                                    {{ formErrors.endTime }}
                                </p>
                            </div>
                            <div>
                                <label :class="labelClass">Frecuencia</label>
                                <div class="mt-1">
                                    <UiSearchSelect
                                        v-model="form.frequency"
                                        :options="frequencyOptions"
                                        placeholder="Selecciona frecuencia"
                                        :searchable="false"
                                    />
                                </div>
                            </div>
                        </div>

                        <div
                            v-if="form.frequency === 'mensual'"
                            class="mt-4 grid gap-4 md:grid-cols-2"
                        >
                            <div>
                                <label :class="labelClass">¿Cómo cae cada mes?</label>
                                <div class="mt-1">
                                    <UiSearchSelect
                                        v-model="form.monthlyMode"
                                        :options="monthlyModeOptions"
                                        placeholder="Selecciona el modo"
                                        :searchable="false"
                                    />
                                </div>
                                <p class="mt-1 text-[11px] text-on-surface-variant">
                                    {{
                                        form.monthlyMode === 'ordinal'
                                            ? 'Por ejemplo, el tercer sábado de cada mes.'
                                            : 'Se repite el mismo número de día de la fecha de inicio.'
                                    }}
                                </p>
                            </div>
                            <div
                                v-if="form.monthlyMode === 'ordinal'"
                                class="grid grid-cols-2 gap-3"
                            >
                                <div>
                                    <label :class="labelClass">Posición</label>
                                    <div class="mt-1">
                                        <UiSearchSelect
                                            v-model="form.weekOrdinal"
                                            :options="weekOrdinalOptions"
                                            placeholder="Posición"
                                            :searchable="false"
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label :class="labelClass">Día</label>
                                    <div class="mt-1">
                                        <UiSearchSelect
                                            v-model="form.weekday"
                                            :options="weekdayOptions"
                                            placeholder="Día"
                                            :searchable="false"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div class="mt-4 grid gap-4 md:grid-cols-2">
                            <div>
                                <label :class="labelClass" for="meeting-location">Ubicación</label>
                                <div class="relative mt-1">
                                    <MapPinned
                                        class="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-on-surface-variant"
                                    />
                                    <input
                                        id="meeting-location"
                                        v-model="form.location"
                                        type="text"
                                        placeholder="Salón principal, casa de familia, dirección..."
                                        :class="[inputClass, 'pl-9']"
                                    />
                                </div>
                            </div>
                            <div v-if="isRecurring">
                                <label :class="labelClass">Finaliza</label>
                                <div class="mt-1">
                                    <UiDatePicker
                                        v-model="form.recurrenceEndDate"
                                        mode="single"
                                        placeholder="Sin fecha de finalización"
                                        :invalid="!!formErrors.recurrenceEndDate"
                                    />
                                </div>
                                <p
                                    v-if="formErrors.recurrenceEndDate"
                                    class="mt-1 text-xs text-destructive"
                                >
                                    {{ formErrors.recurrenceEndDate }}
                                </p>
                                <p v-else class="mt-1 text-xs text-on-surface-variant">
                                    Déjala vacía para repetir indefinidamente.
                                </p>
                            </div>
                        </div>

                        <div
                            class="mt-4 flex items-start gap-3 rounded-lg border border-primary/20 bg-primary/5 px-4 py-3"
                        >
                            <CalendarDays class="mt-0.5 size-4 shrink-0 text-primary" />
                            <div>
                                <p
                                    class="text-xs font-semibold uppercase tracking-wider text-primary"
                                >
                                    Resumen de programación
                                </p>
                                <p class="mt-1 text-sm text-on-surface">
                                    {{ recurrenceSummary }}
                                </p>
                            </div>
                        </div>
                    </UiCard>

                    <UiCard class="p-6">
                        <div class="mb-5 flex flex-wrap items-center justify-between gap-3">
                            <div class="flex items-center gap-3">
                                <MapPin class="size-5 text-primary" />
                                <div>
                                    <h2 class="font-display text-lg font-semibold text-on-surface">
                                        Ubicación en el mapa
                                    </h2>
                                    <p class="text-xs text-on-surface-variant">
                                        Marca el punto exacto donde se realiza la reunión.
                                    </p>
                                </div>
                            </div>
                            <button
                                type="button"
                                class="inline-flex items-center gap-2 rounded bg-primary px-3 py-2 text-xs font-semibold uppercase tracking-wider text-on-primary shadow-sm transition-colors hover:bg-primary/90 disabled:cursor-wait disabled:opacity-60"
                                :disabled="isLocating"
                                @click="useCurrentLocation"
                            >
                                <LocateFixed
                                    :class="['size-4', isLocating ? 'animate-pulse' : '']"
                                />
                                {{
                                    isLocating ? 'Buscando ubicación…' : 'Usar mi ubicación actual'
                                }}
                            </button>
                        </div>

                        <p
                            v-if="locationError"
                            class="mb-3 rounded border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs text-destructive"
                            role="alert"
                        >
                            {{ locationError }}
                        </p>

                        <div
                            ref="mapEl"
                            class="meeting-map h-72 w-full overflow-hidden rounded border border-outline-variant bg-surface-container"
                        />

                        <div class="mt-3 flex flex-wrap items-center justify-between gap-3">
                            <p v-if="form.position" class="text-xs text-on-surface">
                                <span class="font-semibold text-on-surface-variant"
                                    >Coordenadas:</span
                                >
                                {{ form.position[0].toFixed(5) }}, {{ form.position[1].toFixed(5) }}
                            </p>
                            <p v-else class="text-xs text-on-surface-variant">
                                Esta reunión no tiene un punto guardado. Haz clic en el mapa para
                                colocar su ubicación exacta; se mostrará como un único marcador.
                            </p>
                            <button
                                v-if="form.position"
                                type="button"
                                class="inline-flex items-center gap-1.5 rounded border border-outline-variant px-3 py-1.5 text-xs font-semibold uppercase tracking-wider text-on-surface-variant transition-colors hover:border-destructive hover:text-destructive"
                                @click="clearPosition"
                            >
                                <Trash2 class="size-3.5" />
                                Quitar
                            </button>
                        </div>
                    </UiCard>

                    <UiCard class="p-6">
                        <div class="mb-5 flex items-center gap-3">
                            <Users class="size-5 text-primary" />
                            <div>
                                <h2 class="font-display text-lg font-semibold text-on-surface">
                                    Asignación
                                </h2>
                                <p class="text-xs text-on-surface-variant">
                                    Responsables y sector ministerial.
                                </p>
                            </div>
                        </div>

                        <div class="grid gap-4 md:grid-cols-3">
                            <div>
                                <label :class="labelClass">Sector *</label>
                                <div class="mt-1">
                                    <UiSearchSelect
                                        v-model="form.sectorId"
                                        :options="sectors"
                                        option-value="id"
                                        option-label="name"
                                        placeholder="Selecciona un sector"
                                        search-placeholder="Buscar sector..."
                                        :invalid="!!formErrors.sectorId"
                                    />
                                </div>
                                <p v-if="formErrors.sectorId" class="mt-1 text-xs text-destructive">
                                    {{ formErrors.sectorId }}
                                </p>
                            </div>
                            <div>
                                <label :class="labelClass">Líder *</label>
                                <div class="mt-1">
                                    <UiSearchSelect
                                        v-model="form.leaderId"
                                        :options="leaders"
                                        option-value="id"
                                        option-label="fullName"
                                        placeholder="Selecciona un líder"
                                        search-placeholder="Buscar líder..."
                                        :invalid="!!formErrors.leaderId"
                                    />
                                </div>
                                <p v-if="formErrors.leaderId" class="mt-1 text-xs text-destructive">
                                    {{ formErrors.leaderId }}
                                </p>
                            </div>
                            <div>
                                <label :class="labelClass">Supervisor *</label>
                                <div class="mt-1">
                                    <div
                                        class="flex min-h-11 items-center rounded border bg-surface-container px-3 text-sm"
                                        :class="
                                            formErrors.supervisorId
                                                ? 'border-destructive text-destructive'
                                                : 'border-outline-variant text-on-surface'
                                        "
                                    >
                                        {{
                                            selectedSupervisor.fullName ||
                                            'Selecciona un sector con supervisor'
                                        }}
                                    </div>
                                </div>
                                <p
                                    v-if="formErrors.supervisorId"
                                    class="mt-1 text-xs text-destructive"
                                >
                                    {{ formErrors.supervisorId }}
                                </p>
                                <p v-else class="mt-1 text-xs text-on-surface-variant">
                                    Se hereda automáticamente del sector.
                                </p>
                            </div>
                            <div>
                                <label :class="labelClass">Co-supervisores</label>
                                <div class="mt-1">
                                    <UiSearchSelect
                                        v-model="form.coSupervisorIds"
                                        :options="coSupervisorOptions"
                                        option-value="id"
                                        option-label="fullName"
                                        multiple
                                        clearable
                                        placeholder="Añade uno o varios"
                                        search-placeholder="Buscar co-supervisor..."
                                    />
                                </div>
                            </div>
                        </div>
                    </UiCard>

                    <UiCard class="p-6">
                        <div class="mb-5 flex items-center gap-3">
                            <Settings2 class="size-5 text-primary" />
                            <div>
                                <h2 class="font-display text-lg font-semibold text-on-surface">
                                    Detalles
                                </h2>
                                <p class="text-xs text-on-surface-variant">
                                    Estado, asistencia y configuración.
                                </p>
                            </div>
                        </div>

                        <div class="grid gap-4 md:grid-cols-2">
                            <div>
                                <label :class="labelClass" for="meeting-attendees"
                                    >Asistentes esperados</label
                                >
                                <input
                                    id="meeting-attendees"
                                    v-model.number="form.expectedAttendees"
                                    type="number"
                                    min="0"
                                    :class="[inputClass, 'mt-1']"
                                />
                            </div>
                            <div>
                                <label :class="labelClass">Estado</label>
                                <label
                                    class="mt-3 flex cursor-pointer items-center gap-2.5 text-sm text-on-surface"
                                >
                                    <input
                                        v-model="form.isActive"
                                        type="checkbox"
                                        class="size-4 accent-primary"
                                    />
                                    Activa
                                </label>
                                <p class="mt-1 text-[11px] text-on-surface-variant">
                                    Una reunión inactiva deja de generar fechas pendientes.
                                </p>
                            </div>
                        </div>

                        <div class="mt-5">
                            <span :class="labelClass">Color de etiqueta</span>
                            <div
                                class="mt-2 rounded-xl border border-outline-variant bg-surface-container p-4"
                            >
                                <div class="flex flex-wrap items-center gap-4">
                                    <label
                                        for="meeting-color-picker"
                                        class="group relative flex size-14 shrink-0 cursor-pointer items-center justify-center overflow-hidden rounded-xl border border-outline-variant shadow-sm transition-transform hover:scale-[1.03] focus-within:ring-2 focus-within:ring-primary"
                                        title="Abrir selector de color"
                                    >
                                        <input
                                            id="meeting-color-picker"
                                            v-model="form.color"
                                            type="color"
                                            class="absolute inset-0 size-full cursor-pointer opacity-0"
                                            aria-label="Seleccionar un color personalizado"
                                        />
                                        <span
                                            class="absolute inset-0"
                                            :style="{ backgroundColor: form.color }"
                                        />
                                        <Pipette
                                            class="relative size-5 drop-shadow-sm"
                                            :style="{ color: contrastColor(form.color) }"
                                        />
                                    </label>

                                    <div class="min-w-0 flex-1">
                                        <p class="text-sm font-semibold text-on-surface">
                                            Color personalizado
                                        </p>
                                        <p class="mt-0.5 text-xs text-on-surface-variant">
                                            Haz clic en la muestra para abrir el selector completo.
                                        </p>
                                    </div>

                                    <span
                                        class="inline-flex min-h-9 items-center rounded-full px-4 text-xs font-bold uppercase tracking-wider shadow-sm"
                                        :style="{
                                            backgroundColor: form.color,
                                            color: contrastColor(form.color),
                                        }"
                                    >
                                        Etiqueta de reunión
                                    </span>
                                </div>

                                <div class="mt-4 grid gap-4 lg:grid-cols-[1fr_230px]">
                                    <div>
                                        <p
                                            class="text-[10px] font-semibold uppercase tracking-wider text-on-surface-variant"
                                        >
                                            Paleta sugerida
                                        </p>
                                        <div class="mt-2 flex flex-wrap items-center gap-2.5">
                                            <button
                                                v-for="color in meetingColorPalette"
                                                :key="color"
                                                type="button"
                                                class="flex size-9 items-center justify-center rounded-full border border-black/10 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-surface-container"
                                                :class="
                                                    form.color.toLowerCase() === color.toLowerCase()
                                                        ? 'ring-2 ring-primary ring-offset-2 ring-offset-surface-container'
                                                        : ''
                                                "
                                                :style="{ backgroundColor: color }"
                                                :aria-label="`Usar color ${color}`"
                                                :aria-pressed="
                                                    form.color.toLowerCase() === color.toLowerCase()
                                                "
                                                @click="selectPaletteColor(color)"
                                            >
                                                <Check
                                                    v-if="
                                                        form.color.toLowerCase() ===
                                                        color.toLowerCase()
                                                    "
                                                    class="size-4"
                                                    :style="{ color: contrastColor(color) }"
                                                />
                                            </button>
                                        </div>
                                    </div>

                                    <div>
                                        <label
                                            for="meeting-color-hex"
                                            class="text-[10px] font-semibold uppercase tracking-wider text-on-surface-variant"
                                        >
                                            Código hexadecimal
                                        </label>
                                        <div class="mt-2 flex gap-2">
                                            <input
                                                id="meeting-color-hex"
                                                v-model="customColor"
                                                type="text"
                                                maxlength="7"
                                                spellcheck="false"
                                                autocomplete="off"
                                                placeholder="#E9C176"
                                                class="h-10 min-w-0 flex-1 rounded border border-outline-variant bg-surface px-3 font-mono text-sm uppercase text-on-surface focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                                                :aria-invalid="!!colorError"
                                                @keydown.enter.prevent="applyCustomColor"
                                            />
                                            <button
                                                type="button"
                                                class="h-10 rounded border border-outline-variant bg-surface px-3 text-xs font-semibold text-on-surface transition-colors hover:border-primary hover:text-primary"
                                                @click="applyCustomColor"
                                            >
                                                Aplicar
                                            </button>
                                        </div>
                                        <p
                                            v-if="colorError"
                                            class="mt-1.5 text-xs text-destructive"
                                        >
                                            {{ colorError }}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div class="mt-4">
                            <label :class="labelClass" for="meeting-notes">Notas internas</label>
                            <textarea
                                id="meeting-notes"
                                v-model="form.notes"
                                rows="2"
                                placeholder="Detalles operativos, recordatorios, requisitos especiales..."
                                :class="[
                                    'mt-1',
                                    inputClass,
                                    'h-auto resize-none py-2 leading-relaxed',
                                ]"
                            />
                        </div>
                    </UiCard>
                </div>

                <aside class="lg:sticky lg:top-40 lg:self-start">
                    <UiCard class="overflow-hidden">
                        <div class="h-2" :style="{ backgroundColor: form.color }" />
                        <div class="p-5">
                            <p
                                class="text-[10px] font-semibold uppercase tracking-[0.3em] text-on-surface-variant"
                            >
                                Vista previa
                            </p>
                            <h3 class="mt-3 font-display text-lg font-semibold text-on-surface">
                                {{ form.title || 'Título de la reunión' }}
                            </h3>
                            <p
                                v-if="selectedType"
                                class="mt-1 text-xs"
                                :style="{ color: selectedType.color }"
                            >
                                {{ selectedType.name }}
                            </p>

                            <div
                                class="mt-5 space-y-3 border-t border-outline-variant pt-4 text-xs"
                            >
                                <div class="flex items-start gap-2">
                                    <CalendarDays
                                        class="mt-0.5 size-3.5 shrink-0 text-on-surface-variant"
                                    />
                                    <p class="text-on-surface">{{ recurrenceSummary }}</p>
                                </div>
                                <div v-if="form.location" class="flex items-start gap-2">
                                    <MapPinned
                                        class="mt-0.5 size-3.5 shrink-0 text-on-surface-variant"
                                    />
                                    <p class="text-on-surface">
                                        {{ form.location }}
                                    </p>
                                </div>
                                <div v-if="form.position" class="flex items-start gap-2">
                                    <MapPin
                                        class="mt-0.5 size-3.5 shrink-0 text-on-surface-variant"
                                    />
                                    <div>
                                        <p
                                            class="text-[10px] font-semibold uppercase tracking-wider text-on-surface-variant"
                                        >
                                            Punto en el mapa
                                        </p>
                                        <p class="text-on-surface">
                                            {{ form.position[0].toFixed(4) }},
                                            {{ form.position[1].toFixed(4) }}
                                        </p>
                                    </div>
                                </div>
                                <div v-if="selectedSector" class="flex items-start gap-2">
                                    <span
                                        class="mt-0.5 flex size-3.5 shrink-0 items-center justify-center text-on-surface-variant"
                                        >·</span
                                    >
                                    <div>
                                        <p
                                            class="text-[10px] font-semibold uppercase tracking-wider text-on-surface-variant"
                                        >
                                            Sector
                                        </p>
                                        <p class="text-on-surface">
                                            {{ selectedSector.name }}
                                        </p>
                                    </div>
                                </div>
                                <div v-if="selectedLeader" class="flex items-start gap-2">
                                    <Users
                                        class="mt-0.5 size-3.5 shrink-0 text-on-surface-variant"
                                    />
                                    <div>
                                        <p
                                            class="text-[10px] font-semibold uppercase tracking-wider text-on-surface-variant"
                                        >
                                            Líder
                                        </p>
                                        <p class="text-on-surface">
                                            {{ selectedLeader.fullName }}
                                        </p>
                                    </div>
                                </div>
                                <div v-if="selectedSupervisor" class="flex items-start gap-2">
                                    <Users
                                        class="mt-0.5 size-3.5 shrink-0 text-on-surface-variant"
                                    />
                                    <div>
                                        <p
                                            class="text-[10px] font-semibold uppercase tracking-wider text-on-surface-variant"
                                        >
                                            Supervisor
                                        </p>
                                        <p class="text-on-surface">
                                            {{ selectedSupervisor.fullName }}
                                        </p>
                                    </div>
                                </div>
                                <div
                                    v-if="form.coSupervisorIds.length > 0"
                                    class="flex items-start gap-2"
                                >
                                    <span
                                        class="mt-0.5 flex size-3.5 shrink-0 items-center justify-center text-on-surface-variant"
                                        >+</span
                                    >
                                    <div>
                                        <p
                                            class="text-[10px] font-semibold uppercase tracking-wider text-on-surface-variant"
                                        >
                                            Co-supervisores ({{ form.coSupervisorIds.length }})
                                        </p>
                                        <p class="text-on-surface">
                                            {{
                                                form.coSupervisorIds
                                                    .map(
                                                        (id) =>
                                                            members.find((s) => s.id === id)
                                                                ?.fullName,
                                                    )
                                                    .filter(Boolean)
                                                    .join(', ')
                                            }}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div class="mt-5 border-t border-outline-variant pt-4">
                                <p
                                    class="text-[10px] font-semibold uppercase tracking-wider text-on-surface-variant"
                                >
                                    Los campos con * son obligatorios
                                </p>
                            </div>
                        </div>
                    </UiCard>
                </aside>
            </form>
        </main>
    </div>
</template>

<style scoped>
/* Contain Leaflet's high z-index panes/controls in their own stacking context
   so they don't render over the sticky header while scrolling. */
.meeting-map {
    position: relative;
    z-index: 0;
    isolation: isolate;
}
.meeting-map :deep(.leaflet-container) {
    cursor: crosshair;
}
.meeting-map :deep(.leaflet-control-zoom) {
    margin: 10px;
    border: 1px solid var(--outline-variant);
    border-radius: 10px;
    overflow: hidden;
    box-shadow: 0 4px 12px rgb(0 0 0 / 35%);
}
.meeting-map :deep(.leaflet-control-zoom a) {
    width: 30px;
    height: 30px;
    line-height: 30px;
    background: var(--surface-container);
    color: var(--on-surface);
    border-bottom-color: var(--outline-variant);
}
.meeting-map :deep(.leaflet-control-zoom a:hover) {
    background: var(--surface-container-high);
    color: var(--primary);
}
</style>
