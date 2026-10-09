<script setup lang="ts">
import {
    ArrowLeft,
    AlertTriangle,
    CalendarDays,
    Info,
    LocateFixed,
    MapPin,
    MapPinned,
    Save,
    Settings2,
    Trash2,
    Users,
} from '@lucide/vue'
import {
    DialogContent,
    DialogDescription,
    DialogOverlay,
    DialogPortal,
    DialogRoot,
    DialogTitle,
} from 'radix-vue'
import { meetingAutoTitle } from '#shared/utils/territory-name.util'
import { useAppToast } from '~/presentation/shared/composables/useAppToast'
import { useMapProvider } from '~/presentation/shared/composables/useMapProvider'
import { addLeafletRasterLayer } from '~/presentation/shared/maps/leaflet-raster.adapter'
import {
    useMeetingLeadersQuery,
    useMeetingHostsQuery,
    useMeetingSectorsQuery,
    useMeetingSupervisorsQuery,
    useMeetingTypesQuery,
} from '~/presentation/meetings/composables/useMeetingCatalogQueries'
import {
    useCreateMeetingMutation,
    useUpdateMeetingMutation,
} from '~/presentation/meetings/composables/useMeetingMutations'
import { useMeetingQuery } from '~/presentation/meetings/composables/useMeetingQuery'
import { useMeetingsQuery } from '~/presentation/meetings/composables/useMeetingsQuery'
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
    MeetingRecord,
    MonthlyMode,
} from '~/presentation/meetings/interfaces/meeting.interface'
import {
    formatMeetingRecurrence,
    formatMeetingTimeRange,
    GENERAL_MEETING_SCOPE_LABEL,
    UNASSIGNED_MEETING_SCOPE_LABEL,
} from '~/presentation/meetings/utils/meeting-format.util'
import { EL_SALVADOR_CENTER } from '~/presentation/territories/constants/territory.constants'
import { resolveHttpErrorMessage } from '~/utils/http/resolve-http-error-message.util'

type LatLng = [number, number]

defineOptions({ name: 'MeetingFormView' })

const route = useRoute()
const toast = useAppToast()
const { provider: mapProvider } = useMapProvider()

const meetingId = computed(() => {
    const raw = route.params.id as string | undefined
    return raw ? Number(raw) : null
})
const isEditing = computed(() => meetingId.value !== null)

useHead({
    title: () => (isEditing.value ? 'Editar reunión · Sistema' : 'Nueva reunión · Sistema'),
})

const meetingQuery = useMeetingQuery(meetingId)
const meetingsQuery = useMeetingsQuery()
const meetingTypesQuery = useMeetingTypesQuery()
const sectorsQuery = useMeetingSectorsQuery()
const leadersQuery = useMeetingLeadersQuery()
const hostsQuery = useMeetingHostsQuery()
const supervisorsQuery = useMeetingSupervisorsQuery()
const createMeetingMutation = useCreateMeetingMutation()
const updateMeetingMutation = useUpdateMeetingMutation()

const meetingTypes = computed(() => meetingTypesQuery.data.value ?? [])
const sectors = computed(() => sectorsQuery.data.value ?? [])
const leaders = computed(() => leadersQuery.data.value ?? [])
const hosts = computed(() => hostsQuery.data.value ?? [])
const supervisors = computed(() => supervisorsQuery.data.value ?? [])
const existingMeetings = computed(() => meetingsQuery.data.value ?? [])
const isLoading = computed(
    () =>
        meetingTypesQuery.isPending.value ||
        sectorsQuery.isPending.value ||
        leadersQuery.isPending.value ||
        hostsQuery.isPending.value ||
        supervisorsQuery.isPending.value ||
        meetingsQuery.isPending.value ||
        (isEditing.value && meetingQuery.isPending.value),
)
const loadError = computed(
    () =>
        meetingTypesQuery.error.value ??
        sectorsQuery.error.value ??
        leadersQuery.error.value ??
        hostsQuery.error.value ??
        supervisorsQuery.error.value ??
        meetingQuery.error.value,
)
const notFound = computed(() => isEditing.value && meetingQuery.isError.value)

onServerPrefetch(() =>
    Promise.allSettled([
        meetingTypesQuery.suspense(),
        sectorsQuery.suspense(),
        leadersQuery.suspense(),
        hostsQuery.suspense(),
        supervisorsQuery.suspense(),
        meetingsQuery.suspense(),
        ...(isEditing.value ? [meetingQuery.suspense()] : []),
    ]),
)

interface MeetingForm {
    title: string
    description: string
    typeId: number
    sectorId: number
    leaderId: number
    supervisorId: number
    hostId: number
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
        hostId: 0,
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
const manualTitle = ref(false)
const formInitialized = ref(false)
const isClientReady = ref(false)

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
        scrollWheelZoom: false,
    })
    map.zoomControl.setPosition('topright')
    addLeafletRasterLayer(L, map, mapProvider.value)
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
watch(
    () => form.color,
    () => {
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
    [
        isLoading,
        loadError,
        () => meetingQuery.data.value,
        meetingTypes,
        sectors,
        leaders,
        hosts,
        supervisors,
    ],
    async () => {
        if (formInitialized.value || isLoading.value || loadError.value) return

        if (isEditing.value) {
            const existing = meetingQuery.data.value
            if (!existing) return

            manualTitle.value =
                existing.title !== meetingAutoTitle(existing.code, existing.sectorName)
            Object.assign(form, {
                title: manualTitle.value ? existing.title : '',
                description: existing.description ?? '',
                typeId: existing.typeId,
                sectorId: existing.sectorId ?? 0,
                leaderId: existing.leaderId ?? 0,
                supervisorId: existing.supervisorId ?? 0,
                hostId: existing.hostId ?? 0,
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
                isActive: true,
                isPublic: existing.isPublic,
                notes: existing.notes ?? '',
                color: existing.color,
                position:
                    existing.latitude !== null && existing.longitude !== null
                        ? [existing.latitude, existing.longitude]
                        : null,
            })
        } else {
            form.typeId = meetingTypes.value.find((type) => type.isActive)?.id ?? 0
            form.sectorId = 0
            form.leaderId = leaders.value[0]?.id ?? 0
            form.hostId = hosts.value[0]?.id ?? 0
            form.supervisorId = 0
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
    typeId: null,
    date: null,
    recurrenceEndDate: null,
    startTime: null,
    endTime: null,
    sectorId: null,
    leaderId: null,
    supervisorId: null,
    hostId: null,
})

function clearFormErrors() {
    for (const key of Object.keys(formErrors)) formErrors[key] = null
}

function validateForm() {
    clearFormErrors()
    let ok = true
    if (manualTitle.value && form.title.trim().length < 2) {
        formErrors.title = 'Escribe al menos 2 caracteres o desmarca «Titular manualmente»'
        ok = false
    }
    if (!form.typeId) {
        formErrors.typeId = 'Selecciona un tipo de reunión activo'
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
    if (isGeneralType.value) return ok

    if (!form.leaderId) {
        formErrors.leaderId = 'Asigna un líder con rol Líder'
        ok = false
    }
    if (form.sectorId && !form.supervisorId) {
        formErrors.supervisorId = 'El sector seleccionado no tiene un supervisor asignado'
        ok = false
    }
    if (!form.hostId) {
        formErrors.hostId = 'Asigna un anfitrión con rol Anfitrión'
        ok = false
    }
    return ok
}

const isSaving = computed(
    () => createMeetingMutation.isPending.value || updateMeetingMutation.isPending.value,
)
const leaderScheduleConflict = ref<MeetingRecord | null>(null)

type MeetingSchedule = Pick<
    MeetingRecord,
    | 'date'
    | 'recurrenceEndDate'
    | 'startTime'
    | 'endTime'
    | 'frequency'
    | 'monthlyMode'
    | 'weekOrdinal'
    | 'weekday'
>

function dateFromIso(value: string) {
    return new Date(`${value}T00:00:00Z`)
}

function isoDate(value: Date) {
    return value.toISOString().slice(0, 10)
}

function addDays(value: Date, days: number) {
    const copy = new Date(value)
    copy.setUTCDate(copy.getUTCDate() + days)
    return copy
}

function minutesOf(time: string) {
    const [hours = '0', minutes = '0'] = time.split(':')
    return Number(hours) * 60 + Number(minutes)
}

function timeRangesOverlap(first: MeetingSchedule, second: MeetingSchedule) {
    return (
        minutesOf(first.startTime) < minutesOf(second.endTime) &&
        minutesOf(second.startTime) < minutesOf(first.endTime)
    )
}

function occursOn(schedule: MeetingSchedule, date: Date) {
    const occurrence = isoDate(date)
    if (
        occurrence < schedule.date ||
        (schedule.recurrenceEndDate && occurrence > schedule.recurrenceEndDate)
    ) {
        return false
    }

    const start = dateFromIso(schedule.date)
    const daysSinceStart = Math.floor((date.getTime() - start.getTime()) / 86_400_000)
    if (schedule.frequency === 'unica') return daysSinceStart === 0
    if (schedule.frequency === 'diaria') return true
    if (schedule.frequency === 'semanal') return daysSinceStart % 7 === 0
    if (schedule.frequency === 'quincenal') return daysSinceStart % 14 === 0

    if (schedule.monthlyMode !== 'ordinal') return date.getUTCDate() === start.getUTCDate()

    const weekday = schedule.weekday ?? start.getUTCDay()
    const ordinal = schedule.weekOrdinal ?? 1
    return date.getUTCDay() === weekday && Math.ceil(date.getUTCDate() / 7) === ordinal
}

function schedulesOverlap(first: MeetingSchedule, second: MeetingSchedule) {
    if (!timeRangesOverlap(first, second)) return false

    const firstStart = dateFromIso(first.date)
    const secondStart = dateFromIso(second.date)
    const start = firstStart > secondStart ? firstStart : secondStart
    const fallbackEnd = addDays(start, 730)
    const firstEnd = first.recurrenceEndDate ? dateFromIso(first.recurrenceEndDate) : fallbackEnd
    const secondEnd = second.recurrenceEndDate ? dateFromIso(second.recurrenceEndDate) : fallbackEnd
    const end = firstEnd < secondEnd ? firstEnd : secondEnd

    for (let date = start; date <= end; date = addDays(date, 1)) {
        if (occursOn(first, date) && occursOn(second, date)) return true
    }
    return false
}

function buildInput(): MeetingInput {
    const isGeneral = isGeneralType.value
    const isUnassigned = isGeneral || !form.sectorId
    return {
        typeId: form.typeId,
        sectorId: isUnassigned ? null : form.sectorId,
        leaderId: isGeneral ? null : form.leaderId,
        supervisorId: isUnassigned ? null : form.supervisorId,
        hostId: isGeneral ? null : form.hostId,
        coSupervisorIds: isGeneral ? [] : [...form.coSupervisorIds],
        title: manualTitle.value ? form.title.trim() : '',
        description: form.description.trim() || null,
        date: form.date,
        recurrenceEndDate: form.frequency === 'unica' ? null : form.recurrenceEndDate,
        startTime: form.startTime,
        endTime: form.endTime,
        location: form.location.trim(),
        latitude: form.position ? form.position[0] : null,
        longitude: form.position ? form.position[1] : null,
        frequency: form.frequency,
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

function findLeaderScheduleConflict(input: MeetingInput) {
    if (input.leaderId === null) return null
    return (
        existingMeetings.value.find(
            (meeting) =>
                meeting.isActive &&
                meeting.leaderId === input.leaderId &&
                meeting.id !== meetingId.value &&
                schedulesOverlap(meeting, input),
        ) ?? null
    )
}

async function persistMeeting() {
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

async function saveMeeting() {
    if (!validateForm()) {
        toast.error('Revisa los campos marcados en rojo')
        return
    }

    const conflict = findLeaderScheduleConflict(buildInput())
    if (conflict) {
        leaderScheduleConflict.value = conflict
        return
    }
    await persistMeeting()
}

function cancelLeaderScheduleConflict() {
    leaderScheduleConflict.value = null
}

function confirmLeaderScheduleConflict() {
    cancelLeaderScheduleConflict()
    void persistMeeting()
}

function cancel() {
    navigateTo('/catalogos/reuniones')
}

const selectedType = computed(() => meetingTypes.value.find((t) => t.id === form.typeId))
const isGeneralType = computed(() => selectedType.value?.isGeneral ?? false)
const availableMeetingTypes = computed(() =>
    meetingTypes.value.filter((type) => type.isActive || type.id === form.typeId),
)
const selectedSector = computed(() =>
    isGeneralType.value ? undefined : sectors.value.find((s) => s.id === form.sectorId),
)
const nextCodePreview = computed(() => {
    if (isGeneralType.value && selectedType.value) {
        return `IGL${selectedType.value.codeSegment}#`
    }
    if (!selectedType.value) return null
    if (!selectedSector.value) return `${selectedType.value.codeSegment}#`
    return `${selectedSector.value.pathCode}${selectedType.value.codeSegment}#`
})
const autoTitlePreview = computed(() => {
    const existing = isEditing.value ? meetingQuery.data.value : null
    const sectorId = isGeneralType.value || !form.sectorId ? null : form.sectorId
    if (existing && existing.typeId === form.typeId && existing.sectorId === sectorId) {
        return meetingAutoTitle(existing.code, existing.sectorName)
    }
    if (!selectedType.value) return null
    if (isGeneralType.value) return `IGL${selectedType.value.codeSegment}#`
    return meetingAutoTitle(
        `${selectedType.value.codeSegment}#`,
        selectedSector.value?.name ?? null,
    )
})
const sectorOptions = computed(() => [
    {
        id: 0,
        name: 'Sin asignar',
        zoneName: '',
        districtName: '',
        code: 'Se asigna después desde Territorios',
        displayName: 'Sin asignar',
    },
    ...sectors.value.map((sector) => ({
        ...sector,
        displayName: `${sector.name} · ${sector.zoneName} · ${sector.districtName}`,
    })),
])
const selectedLeader = computed(() =>
    isGeneralType.value ? undefined : leaders.value.find((member) => member.id === form.leaderId),
)
const memberOptions = (members: typeof leaders.value) =>
    members.map((member) => ({
        ...member,
        displayName: member.documentNumber
            ? `${member.fullName} · ${member.documentNumber}`
            : member.fullName,
    }))
const leaderOptions = computed(() => memberOptions(leaders.value))
const hostOptions = computed(() => memberOptions(hosts.value))
const selectedSupervisor = computed(() =>
    isGeneralType.value ? null : { fullName: selectedSector.value?.supervisorName ?? '' },
)
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
    memberOptions(supervisors.value.filter((member) => member.id !== form.supervisorId)),
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

                        <label
                            class="mb-4 flex cursor-pointer items-center justify-between gap-3 rounded border border-outline-variant bg-surface-container px-3 py-2.5"
                        >
                            <span class="min-w-0">
                                <span class="block text-sm font-semibold text-on-surface">
                                    Titular manualmente
                                </span>
                                <span class="block truncate text-xs text-on-surface-variant">
                                    {{
                                        manualTitle
                                            ? 'Escribe el título que prefieras.'
                                            : autoTitlePreview
                                              ? `Se titulará «${autoTitlePreview}».`
                                              : 'Se titulará automáticamente al elegir tipo y sector.'
                                    }}
                                </span>
                            </span>
                            <input
                                v-model="manualTitle"
                                type="checkbox"
                                class="size-4 shrink-0 accent-primary"
                                @change="formErrors.title = null"
                            />
                        </label>

                        <div
                            class="grid gap-4"
                            :class="manualTitle ? 'md:grid-cols-[1fr_240px]' : ''"
                        >
                            <div v-if="manualTitle">
                                <label :class="labelClass" for="meeting-title">Título *</label>
                                <input
                                    id="meeting-title"
                                    v-model="form.title"
                                    type="text"
                                    :placeholder="autoTitlePreview ? `Ej. ${autoTitlePreview}` : ''"
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
                                <label :class="labelClass">Tipo *</label>
                                <div class="mt-1">
                                    <UiSearchSelect
                                        v-model="form.typeId"
                                        :options="availableMeetingTypes"
                                        option-value="id"
                                        option-label="name"
                                    />
                                </div>
                                <p v-if="formErrors.typeId" class="mt-1 text-xs text-destructive">
                                    {{ formErrors.typeId }}
                                </p>
                                <p
                                    v-if="nextCodePreview"
                                    class="mt-1 text-xs text-on-surface-variant"
                                >
                                    Código al crear:
                                    <span class="font-mono font-semibold">{{
                                        nextCodePreview
                                    }}</span>
                                </p>
                            </div>
                        </div>

                        <div class="mt-4">
                            <label :class="labelClass" for="meeting-desc">Descripción</label>
                            <textarea
                                id="meeting-desc"
                                v-model="form.description"
                                rows="3"
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
                                        :invalid="!!formErrors.date"
                                    />
                                </div>
                                <p v-if="formErrors.date" class="mt-1 text-xs text-destructive">
                                    {{ formErrors.date }}
                                </p>
                            </div>
                            <div>
                                <label :class="labelClass" for="meeting-start">Inicio *</label>
                                <UiTimePicker
                                    id="meeting-start"
                                    v-model="form.startTime"
                                    class="mt-1"
                                    :invalid="!!formErrors.startTime"
                                    aria-label="Hora de inicio"
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
                                <UiTimePicker
                                    id="meeting-end"
                                    v-model="form.endTime"
                                    class="mt-1"
                                    :invalid="!!formErrors.endTime"
                                    aria-label="Hora de finalización"
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

                        <p
                            v-if="isGeneralType"
                            class="rounded-xl border border-primary/25 bg-primary/5 p-4 text-xs leading-relaxed text-on-surface-variant"
                        >
                            <strong class="text-on-surface">{{ selectedType?.name }}</strong> es una
                            reunión de toda la iglesia: no tiene sector, supervisor, líder,
                            anfitrión ni co-supervisores.
                        </p>
                        <div v-else class="grid gap-4 md:grid-cols-2">
                            <div>
                                <label :class="labelClass">Sector</label>
                                <div class="mt-1">
                                    <UiSearchSelect
                                        v-model="form.sectorId"
                                        :options="sectorOptions"
                                        option-value="id"
                                        option-label="displayName"
                                        option-description="code"
                                        :search-fields="['name', 'zoneName', 'districtName']"
                                        search-placeholder="Buscar por sector, zona o distrito..."
                                        :invalid="!!formErrors.sectorId"
                                    />
                                </div>
                                <p v-if="formErrors.sectorId" class="mt-1 text-xs text-destructive">
                                    {{ formErrors.sectorId }}
                                </p>
                                <p
                                    v-else-if="!form.sectorId"
                                    class="mt-1 text-xs text-on-surface-variant"
                                >
                                    Sin sector no genera fechas pendientes hasta que la asignes.
                                </p>
                            </div>
                            <div>
                                <label :class="labelClass">Supervisor *</label>
                                <div class="mt-1">
                                    <div
                                        aria-disabled="true"
                                        title="Se asigna automáticamente desde el sector"
                                        class="flex min-h-11 cursor-not-allowed items-center rounded border bg-surface-container-high px-3 text-sm"
                                        :class="
                                            formErrors.supervisorId
                                                ? 'border-destructive text-destructive'
                                                : 'border-outline-variant text-on-surface'
                                        "
                                    >
                                        {{
                                            selectedSupervisor?.fullName ||
                                            (form.sectorId
                                                ? 'Selecciona un sector con supervisor'
                                                : 'Se asignará con el sector')
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
                                <label :class="labelClass">Líder *</label>
                                <div class="mt-1">
                                    <UiSearchSelect
                                        v-model="form.leaderId"
                                        :options="leaderOptions"
                                        option-value="id"
                                        option-label="displayName"
                                        :search-fields="['code', 'email', 'phone']"
                                        search-placeholder="Buscar por nombre o DUI..."
                                        :invalid="!!formErrors.leaderId"
                                    />
                                </div>
                                <p v-if="formErrors.leaderId" class="mt-1 text-xs text-destructive">
                                    {{ formErrors.leaderId }}
                                </p>
                            </div>
                            <div>
                                <label :class="labelClass">Anfitrión *</label>
                                <div class="mt-1">
                                    <UiSearchSelect
                                        v-model="form.hostId"
                                        :options="hostOptions"
                                        option-value="id"
                                        option-label="displayName"
                                        :search-fields="['code', 'email', 'phone']"
                                        search-placeholder="Buscar por nombre o DUI..."
                                        :invalid="!!formErrors.hostId"
                                    />
                                </div>
                                <p v-if="formErrors.hostId" class="mt-1 text-xs text-destructive">
                                    {{ formErrors.hostId }}
                                </p>
                            </div>
                            <div>
                                <label :class="labelClass">Co-supervisores</label>
                                <div class="mt-1">
                                    <UiSearchSelect
                                        v-model="form.coSupervisorIds"
                                        :options="coSupervisorOptions"
                                        option-value="id"
                                        option-label="displayName"
                                        :search-fields="['code', 'email', 'phone']"
                                        search-placeholder="Buscar por nombre o DUI..."
                                        multiple
                                        clearable
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
                                    Asistencia y configuración.
                                </p>
                            </div>
                        </div>

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

                        <div class="mt-5">
                            <span :class="labelClass">Color de etiqueta</span>
                            <UiColorPicker
                                id="meeting-color"
                                v-model="form.color"
                                class="mt-2"
                                :palette="meetingColorPalette"
                            >
                                <template #preview="{ color, textColor }">
                                    <span
                                        class="inline-flex min-h-9 items-center rounded-full px-4 text-xs font-bold uppercase tracking-wider shadow-sm"
                                        :style="{ backgroundColor: color, color: textColor }"
                                    >
                                        Etiqueta de reunión
                                    </span>
                                </template>
                            </UiColorPicker>
                        </div>

                        <div class="mt-4">
                            <label :class="labelClass" for="meeting-notes">Notas internas</label>
                            <textarea
                                id="meeting-notes"
                                v-model="form.notes"
                                rows="2"
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
                                {{
                                    (manualTitle && form.title) ||
                                    autoTitlePreview ||
                                    'Título de la reunión'
                                }}
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
                                <div class="flex items-start gap-2">
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
                                            {{
                                                selectedSector?.name ??
                                                (isGeneralType
                                                    ? GENERAL_MEETING_SCOPE_LABEL
                                                    : UNASSIGNED_MEETING_SCOPE_LABEL)
                                            }}
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
                                    v-if="!isGeneralType && form.coSupervisorIds.length > 0"
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
                                                            supervisors.find((s) => s.id === id)
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

        <DialogRoot
            :open="!!leaderScheduleConflict"
            @update:open="(open) => !open && cancelLeaderScheduleConflict()"
        >
            <DialogPortal>
                <DialogOverlay class="fixed inset-0 z-[70] bg-black/60 backdrop-blur-sm" />
                <DialogContent
                    class="fixed left-1/2 top-1/2 z-[71] w-[calc(100%-2rem)] max-w-md -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-warning/40 bg-surface-container p-6 shadow-2xl outline-none"
                >
                    <div class="flex gap-3">
                        <div
                            class="flex size-10 shrink-0 items-center justify-center rounded-full bg-warning/15 text-warning"
                        >
                            <AlertTriangle class="size-5" />
                        </div>
                        <div>
                            <DialogTitle class="font-display text-lg font-semibold text-on-surface">
                                Horario en conflicto
                            </DialogTitle>
                            <DialogDescription
                                class="mt-2 text-sm leading-6 text-on-surface-variant"
                            >
                                Este líder ya está asignado a
                                <strong class="font-semibold text-on-surface">{{
                                    leaderScheduleConflict?.title
                                }}</strong>
                                en un horario que se traslapa con esta reunión. Puedes guardar de
                                todas formas si otra persona cubrirá uno de los dos encuentros.
                            </DialogDescription>
                            <p
                                class="mt-3 rounded-lg bg-surface-container-high px-3 py-2 text-xs text-on-surface-variant"
                            >
                                {{ leaderScheduleConflict?.date }} ·
                                {{
                                    formatMeetingTimeRange(
                                        leaderScheduleConflict?.startTime ?? '',
                                        leaderScheduleConflict?.endTime ?? '',
                                    )
                                }}
                            </p>
                        </div>
                    </div>
                    <div class="mt-6 flex flex-wrap justify-end gap-3">
                        <UiButton variant="outline" @click="cancelLeaderScheduleConflict">
                            Revisar programación
                        </UiButton>
                        <UiButton :loading="isSaving" @click="confirmLeaderScheduleConflict">
                            Guardar de todas formas
                        </UiButton>
                    </div>
                </DialogContent>
            </DialogPortal>
        </DialogRoot>
    </div>
</template>

<style scoped>
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
