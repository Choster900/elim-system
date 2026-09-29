<script setup lang="ts">
import {
    AlertTriangle,
    Eraser,
    Expand,
    LoaderCircle,
    LocateFixed,
    Minimize,
    RefreshCw,
    Undo2,
    X,
} from '@lucide/vue'
import { useMapProvider } from '~/presentation/shared/composables/useMapProvider'
import { addLeafletRasterLayer } from '~/presentation/shared/maps/leaflet-raster.adapter'
import type {
    LatLng,
    Polygon,
    TerritoryInput,
    TerritoryLeaderOption,
    TerritorySupervisorOption,
} from '~/presentation/territories/interfaces/territory.interface'

type Level = 'distrito' | 'zona' | 'sector'

const props = defineProps<{
    open: boolean
    level: Level
    mode: 'create' | 'edit'
    entity: TerritoryInput | null
    parentCentroid: LatLng | null
    parentLabel: string | null
    palette: string[]
    accent: string
    levelLabel: string
    leaderLabel: string
    leaderOptions: TerritoryLeaderOption[]
    leadersLoading?: boolean
    leadersError?: string
    supervisorOptions: TerritorySupervisorOption[]
    supervisorsLoading?: boolean
    supervisorsError?: string
    saving?: boolean
}>()

const emit = defineEmits<{
    (e: 'close' | 'retry-leaders' | 'retry-supervisors'): void
    (e: 'save', payload: TerritoryInput): void
}>()

const DEFAULT_CENTER: LatLng = [13.8, -89.4]
const { provider: mapProvider } = useMapProvider()

const form = reactive({
    name: '',
    code: '',
    leaderId: null as number | null,
    leaderName: '',
    description: '',
    color: '',
    isActive: true,
    supervisorId: null as number | null,
})
const tempPolygon = ref<LatLng[]>([])
const nameError = ref(false)
const supervisorError = ref(false)
const polygonError = ref(false)
const leaderTouched = ref(false)
const isLocating = ref(false)
const locationError = ref('')
const mapError = ref('')
const mapReady = ref(false)
const isMapExpanded = ref(false)

const mapEl = ref<HTMLElement | null>(null)
const mapPanelEl = ref<HTMLElement | null>(null)
const expandMapButton = ref<HTMLButtonElement | null>(null)
const collapseMapButton = ref<HTMLButtonElement | null>(null)
let map: import('leaflet').Map | null = null
let L: typeof import('leaflet') | null = null
let polygonLayer: import('leaflet').Polyline | import('leaflet').Polygon | null = null
let vertexMarkers: import('leaflet').CircleMarker[] = []
let userLocationMarker: import('leaflet').CircleMarker | null = null
let mapGeneration = 0
let isUnmounted = false
let mapResizeObserver: ResizeObserver | null = null
let resizeFrame: number | null = null

function resetForm() {
    nameError.value = false
    supervisorError.value = false
    polygonError.value = false
    leaderTouched.value = false
    isLocating.value = false
    locationError.value = ''
    mapError.value = ''
    if (props.mode === 'edit' && props.entity) {
        form.name = props.entity.name
        form.code = props.entity.code
        form.leaderId = props.entity.leaderId ?? null
        form.leaderName = props.entity.leaderName
        form.description = props.entity.description
        form.color = props.entity.color
        form.isActive = props.entity.isActive
        form.supervisorId = props.entity.supervisorId
        tempPolygon.value = props.entity.polygon.map((p) => [...p] as LatLng)
    } else {
        form.name = ''
        form.code = ''
        form.leaderId = null
        form.leaderName = ''
        form.description = ''
        form.color = props.palette[0] ?? '#e9c176'
        form.isActive = true
        form.supervisorId = null
        tempPolygon.value = []
    }
}

function removeMap() {
    mapReady.value = false
    mapResizeObserver?.disconnect()
    mapResizeObserver = null
    if (resizeFrame !== null) cancelAnimationFrame(resizeFrame)
    resizeFrame = null
    const current = map
    map = null
    polygonLayer = null
    vertexMarkers = []
    userLocationMarker = null
    current?.remove()
}

function destroyMap() {
    mapGeneration += 1
    isLocating.value = false
    removeMap()
}

function closeDrawer() {
    if (props.saving) return
    emit('close')
}

function handleKeydown(event: KeyboardEvent) {
    if (event.defaultPrevented || !props.open) return
    if (isMapExpanded.value && event.key === 'Tab') {
        const controls = mapPanelEl.value?.querySelectorAll<HTMLElement>(
            'button:not(:disabled), a[href], [tabindex="0"]',
        )
        const first = controls?.[0]
        const last = controls?.[controls.length - 1]
        if (event.shiftKey && document.activeElement === first) {
            event.preventDefault()
            last?.focus()
        } else if (!event.shiftKey && document.activeElement === last) {
            event.preventDefault()
            first?.focus()
        }
        return
    }
    if (event.key !== 'Escape') return
    if (document.querySelector('[role="listbox"], [role="menu"], [role="alertdialog"]')) return
    if (isMapExpanded.value) {
        isMapExpanded.value = false
        return
    }
    closeDrawer()
}

function toggleMapExpanded() {
    isMapExpanded.value = !isMapExpanded.value
}

function scheduleMapResize() {
    if (resizeFrame !== null) cancelAnimationFrame(resizeFrame)
    const current = map
    resizeFrame = requestAnimationFrame(() => {
        resizeFrame = null
        if (!isUnmounted && props.open && current && map === current && mapEl.value?.isConnected) {
            current.invalidateSize({ animate: false, debounceMoveend: true })
        }
    })
}

function renderPolygon(fit: boolean) {
    if (!map || !L) return
    const pts = tempPolygon.value
    if (fit && pts.length >= 2) {
        map.fitBounds(L.latLngBounds(pts), { padding: [26, 26], maxZoom: 16, animate: false })
    }

    const closed = pts.length >= 3
    if (polygonLayer && (pts.length < 2 || closed !== polygonLayer instanceof L.Polygon)) {
        polygonLayer.remove()
        polygonLayer = null
    }
    if (pts.length >= 2) {
        const style = {
            color: form.color,
            weight: 3,
            fillColor: form.color,
            fillOpacity: 0.16,
            dashArray: '5 5',
            interactive: false,
        }
        if (polygonLayer) {
            polygonLayer.setLatLngs(pts).setStyle(style)
        } else {
            polygonLayer = (closed ? L.polygon(pts, style) : L.polyline(pts, style)).addTo(map)
        }
    }
    while (vertexMarkers.length > pts.length) vertexMarkers.pop()?.remove()
    pts.forEach((pt, index) => {
        const marker = vertexMarkers[index]
        if (marker) {
            marker.setLatLng(pt).setStyle({ fillColor: form.color })
        } else {
            vertexMarkers.push(
                L!
                    .circleMarker(pt, {
                        radius: 7,
                        color: '#1d1b18',
                        weight: 3,
                        fillColor: form.color,
                        fillOpacity: 1,
                        interactive: false,
                        className: 'territory-vertex',
                    })
                    .addTo(map!),
            )
        }
        vertexMarkers[index]?.bringToFront()
    })
}

function addVertex(pt: LatLng) {
    if (!props.open || !mapReady.value) return
    polygonError.value = false
    tempPolygon.value = [...tempPolygon.value, pt]
    renderPolygon(false)
}
function undoVertex() {
    tempPolygon.value = tempPolygon.value.slice(0, -1)
    polygonError.value = false
    renderPolygon(false)
}
function clearPolygon() {
    tempPolygon.value = []
    polygonError.value = false
    renderPolygon(false)
}

function locateCurrentPosition() {
    if (!mapReady.value || isLocating.value) return
    locationError.value = ''

    if (!import.meta.client || !navigator.geolocation) {
        locationError.value = 'Tu navegador no permite obtener la ubicación actual.'
        return
    }

    isLocating.value = true
    const generation = mapGeneration
    navigator.geolocation.getCurrentPosition(
        ({ coords }) => {
            if (isUnmounted || !props.open || generation !== mapGeneration) return
            isLocating.value = false
            if (!map || !L) return

            const currentPosition: LatLng = [coords.latitude, coords.longitude]
            userLocationMarker?.remove()
            userLocationMarker = L.circleMarker(currentPosition, {
                radius: 8,
                color: '#fff',
                weight: 3,
                fillColor: '#2563eb',
                fillOpacity: 1,
                bubblingMouseEvents: false,
            }).addTo(map)
            userLocationMarker.bindTooltip('Tu ubicación actual', {
                direction: 'top',
                offset: [0, -7],
            })
            map.setView(currentPosition, Math.max(map.getZoom(), 16))
        },
        (error) => {
            if (isUnmounted || !props.open || generation !== mapGeneration) return
            isLocating.value = false
            locationError.value =
                error.code === error.PERMISSION_DENIED
                    ? 'No se concedió permiso para acceder a tu ubicación.'
                    : 'No pudimos obtener tu ubicación. Inténtalo de nuevo.'
        },
        {
            enableHighAccuracy: true,
            timeout: 12_000,
            maximumAge: 60_000,
        },
    )
}

async function initMap() {
    if (!import.meta.client || isUnmounted || !props.open) return
    destroyMap()
    mapError.value = ''
    const generation = ++mapGeneration
    try {
        if (!L) {
            const leafletModule = await import('leaflet')
            L = leafletModule.default ?? leafletModule
        }

        await nextTick()
        const container = mapEl.value
        if (
            isUnmounted ||
            generation !== mapGeneration ||
            !props.open ||
            !container?.isConnected ||
            !L
        ) {
            return
        }

        map = L.map(container, {
            zoomControl: true,
            scrollWheelZoom: false,
            doubleClickZoom: false,
        })
        // Initialize the viewport before adding raster or vector layers.
        map.setView(props.parentCentroid ?? DEFAULT_CENTER, 11)
        map.zoomControl.setPosition('topright')
        addLeafletRasterLayer(L, map, mapProvider.value)
        map.on('click', (e) => addVertex([e.latlng.lat, e.latlng.lng]))
        renderPolygon(true)
        mapReady.value = true
        mapResizeObserver = new ResizeObserver(scheduleMapResize)
        mapResizeObserver.observe(container)
    } catch (error) {
        if (isUnmounted || !props.open || generation !== mapGeneration) return
        mapError.value = 'No fue posible cargar el mapa. Intenta cargarlo de nuevo.'
        console.error('No fue posible inicializar el mapa de cobertura.', error)
        destroyMap()
    }
}

watch(
    () => form.color,
    () => renderPolygon(false),
)

watch(
    isMapExpanded,
    async (expanded) => {
        await nextTick()
        if (isUnmounted || !props.open) return
        scheduleMapResize()
        const button = expanded ? collapseMapButton.value : expandMapButton.value
        button?.focus({ preventScroll: true })
    },
    { flush: 'post' },
)

watch(
    () => props.open,
    (isOpen) => {
        if (isOpen) {
            resetForm()
            void initMap()
        } else {
            isMapExpanded.value = false
            destroyMap()
        }
    },
    { flush: 'post' },
)

onBeforeUnmount(() => {
    isUnmounted = true
    window.removeEventListener('keydown', handleKeydown)
    destroyMap()
})

onMounted(() => {
    window.addEventListener('keydown', handleKeydown)
    if (props.open) {
        resetForm()
        void initMap()
    }
})

function save() {
    if (!form.name.trim()) {
        nameError.value = true
        return
    }
    if (tempPolygon.value.length < 3) {
        polygonError.value = true
        return
    }
    const polygon: Polygon = tempPolygon.value.map((p) => [...p] as LatLng)
    const leaderId = props.level === 'sector' || !leaderTouched.value ? undefined : form.leaderId
    emit('save', {
        name: form.name.trim(),
        code: form.code,
        leaderName: form.leaderName.trim(),
        leaderId,
        description: form.description.trim(),
        color: form.color,
        polygon,
        isActive: form.isActive,
        supervisorId: form.supervisorId,
    })
}

const inputClass =
    'w-full rounded-lg border border-outline-variant bg-surface px-3 py-2.5 text-sm text-on-surface outline-none placeholder:text-on-surface-variant/60 focus:border-primary'
const codePrefix = computed(() => {
    if (props.level === 'distrito') return 'DIS-###'
    if (props.level === 'zona') return 'ZON-###'
    return 'SEC-###'
})
const formTitle = computed(() => {
    if (props.mode === 'edit') return `Editar ${props.levelLabel}`
    return `${props.level === 'zona' ? 'Nueva' : 'Nuevo'} ${props.levelLabel}`
})
const nameLabel = computed(
    () => `Nombre ${props.level === 'zona' ? 'de la' : 'del'} ${props.levelLabel}`,
)
const labelClass =
    'mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-on-surface-variant'

const leaderSelectLabel = computed(() =>
    props.level === 'zona' ? `${props.leaderLabel} (opcional)` : props.leaderLabel,
)

const leaderSelectOptions = computed(() => {
    if (!form.leaderId || props.leaderOptions.some((leader) => leader.id === form.leaderId)) {
        return props.leaderOptions
    }
    return [
        ...props.leaderOptions,
        {
            id: form.leaderId,
            code: 'Actual',
            fullName: form.leaderName,
            email: null,
            phone: null,
        },
    ]
})

function onLeaderUpdate(value: string | number | (string | number)[] | null) {
    leaderTouched.value = true
    const leaderId = typeof value === 'number' ? value : null
    const leader = props.leaderOptions.find((option) => option.id === leaderId)
    form.leaderName = leader?.fullName ?? ''
}
</script>

<template>
    <template v-if="open">
        <div class="fixed inset-0 z-[60] bg-black/50" @click="closeDrawer" />
        <aside
            class="territory-form-drawer fixed inset-y-0 right-0 z-[61] flex w-[980px] max-w-[98vw] flex-col bg-surface-container-low shadow-2xl"
            :inert="isMapExpanded"
            role="dialog"
            aria-modal="true"
            aria-labelledby="territory-form-title"
        >
            <div class="flex-none border-b border-outline-variant px-6 py-5 lg:px-7">
                <div class="flex items-center justify-between">
                    <span
                        id="territory-form-title"
                        class="text-[11px] font-bold uppercase tracking-[0.2em]"
                        :style="{ color: accent }"
                    >
                        {{ formTitle }}
                    </span>
                    <button
                        type="button"
                        class="text-on-surface-variant hover:text-on-surface"
                        aria-label="Cerrar"
                        :disabled="saving"
                        @click.stop="closeDrawer"
                    >
                        <X class="size-4" />
                    </button>
                </div>
                <p
                    v-if="mode === 'create' && parentLabel"
                    class="mt-2 text-sm text-on-surface-variant"
                >
                    En <strong class="font-semibold text-on-surface">{{ parentLabel }}</strong>
                </p>
            </div>

            <div class="min-h-0 flex-1 overflow-y-auto px-6 py-5 lg:px-7">
                <div class="grid gap-6 xl:grid-cols-[360px_minmax(0,1fr)]">
                    <section class="space-y-4">
                        <div>
                            <label :class="labelClass" for="tf-name">{{ nameLabel }} *</label>
                            <input
                                id="tf-name"
                                v-model="form.name"
                                type="text"
                                :placeholder="`Ej. ${levelLabel === 'distrito' ? 'Distrito Central' : levelLabel === 'zona' ? 'Zona Norte' : 'Sector Centro'}`"
                                :class="[
                                    inputClass,
                                    nameError ? 'border-destructive focus:border-destructive' : '',
                                ]"
                                @input="nameError = false"
                            />
                            <p v-if="nameError" class="mt-1 text-xs text-destructive">
                                El nombre es obligatorio.
                            </p>
                        </div>

                        <div>
                            <span :class="labelClass">Código</span>
                            <div
                                class="rounded-lg border border-outline-variant bg-surface-container px-3 py-2.5 text-sm text-on-surface"
                            >
                                {{
                                    mode === 'edit' && form.code
                                        ? form.code
                                        : `Se generará automáticamente (${codePrefix})`
                                }}
                            </div>
                        </div>

                        <div v-if="level !== 'sector'">
                            <label :class="labelClass">{{ leaderSelectLabel }}</label>
                            <UiSearchSelect
                                v-model="form.leaderId"
                                :options="leaderSelectOptions"
                                option-value="id"
                                option-label="fullName"
                                option-description="code"
                                :placeholder="
                                    leadersLoading
                                        ? 'Cargando líderes…'
                                        : leadersError
                                          ? 'Catálogo no disponible'
                                          : `Selecciona ${leaderLabel === 'Pastor' ? 'un pastor' : 'un coordinador'}`
                                "
                                search-placeholder="Buscar por nombre o código…"
                                :empty-message="`No hay ${leaderLabel.toLowerCase()}es activos disponibles`"
                                :disabled="leadersLoading || !!leadersError"
                                clearable
                                :aria-label="leaderLabel"
                                @update:model-value="onLeaderUpdate"
                            />
                            <div
                                v-if="leadersError"
                                class="mt-2 flex items-start gap-2 rounded-lg border border-destructive/25 bg-destructive/5 px-3 py-2.5"
                                role="alert"
                            >
                                <AlertTriangle class="mt-0.5 size-4 shrink-0 text-destructive" />
                                <div class="min-w-0 flex-1">
                                    <p class="text-xs leading-relaxed text-destructive">
                                        {{ leadersError }}
                                    </p>
                                    <button
                                        type="button"
                                        class="mt-1.5 inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline"
                                        @click="emit('retry-leaders')"
                                    >
                                        <RefreshCw class="size-3" /> Reintentar
                                    </button>
                                </div>
                            </div>
                        </div>

                        <div v-else>
                            <label :class="labelClass">Supervisor (opcional)</label>
                            <UiSearchSelect
                                v-model="form.supervisorId"
                                :options="supervisorOptions"
                                option-value="id"
                                option-label="fullName"
                                option-description="code"
                                :placeholder="
                                    supervisorsLoading
                                        ? 'Cargando supervisores…'
                                        : supervisorsError
                                          ? 'Catálogo no disponible'
                                          : 'Selecciona un supervisor'
                                "
                                search-placeholder="Buscar por nombre o código…"
                                empty-message="No hay supervisores activos disponibles"
                                :disabled="supervisorsLoading || !!supervisorsError"
                                clearable
                                :invalid="supervisorError"
                                @update:model-value="supervisorError = false"
                            />
                            <div
                                v-if="supervisorsError"
                                class="mt-2 flex items-start gap-2 rounded-lg border border-destructive/25 bg-destructive/5 px-3 py-2.5"
                                role="alert"
                            >
                                <AlertTriangle class="mt-0.5 size-4 shrink-0 text-destructive" />
                                <div class="min-w-0 flex-1">
                                    <p class="text-xs leading-relaxed text-destructive">
                                        {{ supervisorsError }}
                                    </p>
                                    <button
                                        type="button"
                                        class="mt-1.5 inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline"
                                        @click="emit('retry-supervisors')"
                                    >
                                        <RefreshCw class="size-3" /> Reintentar
                                    </button>
                                </div>
                            </div>
                            <p class="mt-1.5 text-xs leading-relaxed text-on-surface-variant">
                                Puedes asignarlo después cuando el catálogo de supervisores esté
                                definido.
                            </p>
                        </div>

                        <div>
                            <label :class="labelClass" for="tf-desc">Descripción</label>
                            <textarea
                                id="tf-desc"
                                v-model="form.description"
                                rows="4"
                                placeholder="Cobertura, observaciones…"
                                :class="[inputClass, 'resize-none leading-relaxed']"
                            />
                        </div>

                        <div>
                            <label
                                class="flex cursor-pointer items-center justify-between rounded-lg border border-outline-variant bg-surface px-3 py-2.5"
                            >
                                <span>
                                    <span class="block text-sm font-semibold text-on-surface">
                                        Activo
                                    </span>
                                    <span class="block text-xs text-on-surface-variant">
                                        Disponible para asignaciones y consultas.
                                    </span>
                                </span>
                                <input
                                    v-model="form.isActive"
                                    type="checkbox"
                                    class="size-4 accent-primary"
                                />
                            </label>
                        </div>

                        <div>
                            <span :class="labelClass">Color</span>
                            <div class="flex flex-wrap items-center gap-2.5">
                                <button
                                    v-for="c in palette"
                                    :key="c"
                                    type="button"
                                    class="size-8 rounded-full transition-transform hover:scale-110"
                                    :style="{
                                        backgroundColor: c,
                                        boxShadow:
                                            form.color === c
                                                ? '0 0 0 2px var(--surface-container-low), 0 0 0 4px var(--primary)'
                                                : 'inset 0 0 0 1px rgba(0,0,0,.2)',
                                    }"
                                    :aria-label="`Color ${c}`"
                                    @click="form.color = c"
                                />
                            </div>
                        </div>
                    </section>

                    <section class="min-w-0">
                        <div class="mb-3 flex flex-wrap items-center justify-between gap-3">
                            <div>
                                <span :class="labelClass">Área que cubre</span>
                                <p class="text-xs text-on-surface-variant">
                                    {{ tempPolygon.length }} punto(s) seleccionados · mínimo 3
                                </p>
                            </div>
                            <div class="flex items-center gap-1.5">
                                <button
                                    type="button"
                                    class="inline-flex items-center gap-1 rounded-md border border-outline-variant bg-surface px-2.5 py-1.5 text-[11px] font-semibold text-on-surface-variant transition-colors hover:border-primary hover:text-primary disabled:opacity-40"
                                    :disabled="tempPolygon.length === 0"
                                    @click="undoVertex"
                                >
                                    <Undo2 class="size-3" /> Deshacer
                                </button>
                                <button
                                    type="button"
                                    class="inline-flex items-center gap-1 rounded-md border border-outline-variant bg-surface px-2.5 py-1.5 text-[11px] font-semibold text-on-surface-variant transition-colors hover:border-destructive hover:text-destructive disabled:opacity-40"
                                    :disabled="tempPolygon.length === 0"
                                    @click="clearPolygon"
                                >
                                    <Eraser class="size-3" /> Limpiar
                                </button>
                            </div>
                        </div>
                        <button
                            ref="expandMapButton"
                            type="button"
                            class="mb-3 inline-flex w-full items-center justify-center gap-2 rounded-lg border border-outline-variant bg-surface px-3 py-2 text-xs font-semibold text-on-surface-variant transition-colors hover:border-primary hover:text-primary"
                            :aria-label="
                                isMapExpanded ? 'Reducir mapa' : 'Ampliar mapa a pantalla completa'
                            "
                            @click="toggleMapExpanded"
                        >
                            <Minimize v-if="isMapExpanded" class="size-4" />
                            <Expand v-else class="size-4" />
                            {{ isMapExpanded ? 'Volver al formulario' : 'Ampliar mapa' }}
                        </button>
                        <button
                            type="button"
                            class="mb-3 inline-flex w-full items-center justify-center gap-2 rounded-lg border border-primary/40 bg-primary/10 px-3 py-2.5 text-xs font-semibold text-primary transition-colors hover:border-primary hover:bg-primary/15 disabled:cursor-wait disabled:opacity-60"
                            :disabled="isLocating || !mapReady"
                            @click="locateCurrentPosition"
                        >
                            <LoaderCircle v-if="isLocating" class="size-4 animate-spin" />
                            <LocateFixed v-else class="size-4" />
                            {{ isLocating ? 'Buscando tu ubicación…' : 'Usar mi ubicación actual' }}
                        </button>
                        <p v-if="locationError" class="mb-2 text-xs text-destructive" role="alert">
                            {{ locationError }}
                        </p>
                        <Teleport to="body" :disabled="!isMapExpanded">
                            <div
                                ref="mapPanelEl"
                                class="territory-map-panel flex flex-col overflow-hidden border border-outline-variant bg-surface"
                                :class="
                                    isMapExpanded
                                        ? 'territory-map-panel-expanded'
                                        : 'h-[420px] min-h-[420px] rounded-lg xl:h-[min(58vh,560px)]'
                                "
                                :role="isMapExpanded ? 'dialog' : undefined"
                                :aria-modal="isMapExpanded ? true : undefined"
                                :aria-labelledby="isMapExpanded ? 'territory-map-title' : undefined"
                            >
                                <div
                                    v-if="isMapExpanded"
                                    class="flex shrink-0 flex-wrap items-center justify-between gap-3 border-b border-outline-variant bg-surface px-4 py-3 sm:px-6"
                                >
                                    <div>
                                        <p
                                            id="territory-map-title"
                                            class="text-sm font-semibold text-on-surface"
                                        >
                                            Selecciona el área que cubre
                                        </p>
                                        <p class="text-xs text-on-surface-variant">
                                            {{ tempPolygon.length }} punto(s) seleccionados · mínimo
                                            3
                                        </p>
                                    </div>
                                    <div class="flex flex-wrap items-center gap-2">
                                        <button
                                            type="button"
                                            class="inline-flex items-center gap-1.5 rounded-md border border-outline-variant bg-surface px-3 py-2 text-xs font-semibold text-on-surface-variant disabled:opacity-40"
                                            :disabled="tempPolygon.length === 0"
                                            @click="undoVertex"
                                        >
                                            <Undo2 class="size-3.5" /> Deshacer
                                        </button>
                                        <button
                                            type="button"
                                            class="inline-flex items-center gap-1.5 rounded-md border border-outline-variant bg-surface px-3 py-2 text-xs font-semibold text-on-surface-variant disabled:opacity-40"
                                            :disabled="tempPolygon.length === 0"
                                            @click="clearPolygon"
                                        >
                                            <Eraser class="size-3.5" /> Limpiar
                                        </button>
                                        <button
                                            type="button"
                                            class="inline-flex items-center gap-1.5 rounded-md border border-primary/40 bg-primary/10 px-3 py-2 text-xs font-semibold text-primary disabled:opacity-40"
                                            :disabled="isLocating || !mapReady"
                                            @click="locateCurrentPosition"
                                        >
                                            <LocateFixed class="size-3.5" /> Mi ubicación
                                        </button>
                                        <button
                                            ref="collapseMapButton"
                                            type="button"
                                            class="inline-flex items-center gap-1.5 rounded-md bg-primary px-3 py-2 text-xs font-semibold text-primary-foreground"
                                            @click="toggleMapExpanded"
                                        >
                                            <Minimize class="size-3.5" /> Volver al formulario
                                        </button>
                                    </div>
                                </div>
                                <!-- Leaflet owns this node's classes; resize only its parent. -->
                                <div
                                    ref="mapEl"
                                    class="territory-form-map min-h-0 w-full flex-1"
                                    aria-label="Mapa del área de cobertura"
                                />
                                <div
                                    v-if="isMapExpanded"
                                    class="shrink-0 border-t border-outline-variant bg-surface px-4 py-2 text-center text-xs text-on-surface-variant"
                                >
                                    <p v-if="locationError" class="text-destructive" role="alert">
                                        {{ locationError }}
                                    </p>
                                    <p>
                                        Haz clic en el mapa para agregar puntos. Presiona Esc para
                                        volver al formulario.
                                    </p>
                                </div>
                            </div>
                        </Teleport>
                        <div v-if="mapError" class="mt-2 text-xs text-destructive" role="alert">
                            <p>{{ mapError }}</p>
                            <button
                                type="button"
                                class="mt-1 font-semibold underline"
                                @click="initMap"
                            >
                                Volver a cargar el mapa
                            </button>
                        </div>
                        <p class="mt-2 text-xs text-on-surface-variant">
                            Haz clic en el mapa para trazar el área. Usa Deshacer si necesitas
                            corregir el último punto.
                        </p>
                        <p v-if="polygonError" class="mt-1 text-xs text-destructive" role="alert">
                            Debes definir al menos tres puntos para el área de cobertura.
                        </p>
                    </section>
                </div>
            </div>

            <div class="flex-none border-t border-outline-variant px-6 py-4 lg:px-7">
                <div class="flex gap-2.5">
                    <button
                        type="button"
                        class="flex-1 rounded-lg border border-outline-variant px-4 py-2.5 text-sm font-medium text-on-surface-variant transition-colors hover:bg-surface-container-high"
                        :disabled="saving"
                        @click.stop="closeDrawer"
                    >
                        Cancelar
                    </button>
                    <button
                        type="button"
                        class="flex-[2] rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90 disabled:cursor-wait disabled:opacity-60"
                        :disabled="saving"
                        @click="save"
                    >
                        {{
                            saving ? 'Guardando…' : mode === 'create' ? 'Crear' : 'Guardar cambios'
                        }}
                    </button>
                </div>
            </div>
        </aside>
    </template>
</template>

<style scoped>
.territory-form-drawer {
    animation: territory-form-in 0.28s ease;
}
@keyframes territory-form-in {
    from {
        transform: translateX(26px);
        opacity: 0;
    }
    to {
        transform: translateX(0);
        opacity: 1;
    }
}
/* Keep Leaflet panes/controls contained within the map box. */
.territory-form-map {
    position: relative;
    z-index: 0;
    isolation: isolate;
    cursor: crosshair;
}
.territory-map-panel-expanded {
    position: fixed;
    z-index: 100;
    inset: 0;
    height: 100dvh;
    border: 0;
    border-radius: 0;
}
.territory-form-map :deep(.leaflet-control-zoom) {
    margin: 8px;
    border: 1px solid var(--outline-variant);
    border-radius: 9px;
    overflow: hidden;
}
.territory-form-map :deep(.leaflet-control-zoom a) {
    width: 28px;
    height: 28px;
    line-height: 28px;
    background: var(--surface-container);
    color: var(--on-surface);
    border-bottom-color: var(--outline-variant);
}
.territory-form-map :deep(.leaflet-control-zoom a:hover) {
    background: var(--surface-container-high);
    color: var(--primary);
}
</style>
