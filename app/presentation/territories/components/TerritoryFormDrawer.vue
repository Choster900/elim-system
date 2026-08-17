<script setup lang="ts">
import { Eraser, LoaderCircle, LocateFixed, Undo2, X } from '@lucide/vue'
import type {
    LatLng,
    Polygon,
    TerritoryInput,
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
    supervisorOptions: TerritorySupervisorOption[]
    supervisorsLoading?: boolean
    saving?: boolean
}>()

const emit = defineEmits<{
    (e: 'close'): void
    (e: 'save', payload: TerritoryInput): void
}>()

const DEFAULT_CENTER: LatLng = [13.8, -89.4]

const form = reactive({
    name: '',
    code: '',
    leaderName: '',
    description: '',
    color: '',
    isActive: true,
    supervisorId: null as number | null,
})
const tempPolygon = ref<LatLng[]>([])
const nameError = ref(false)
const codeError = ref(false)
const supervisorError = ref(false)
const polygonError = ref(false)
const isLocating = ref(false)
const locationError = ref('')

const mapEl = ref<HTMLElement | null>(null)
let map: import('leaflet').Map | null = null
let L: typeof import('leaflet') | null = null
let polygonLayer: import('leaflet').Polygon | null = null
let vertexMarkers: import('leaflet').CircleMarker[] = []
let userLocationMarker: import('leaflet').CircleMarker | null = null
let mapGeneration = 0
let isUnmounted = false

function defaultBox(center: LatLng): LatLng[] {
    const [lat, lng] = center
    const d = 0.02
    return [
        [lat + d, lng - d],
        [lat + d, lng + d],
        [lat - d, lng + d],
        [lat - d, lng - d],
    ]
}

function resetForm() {
    nameError.value = false
    codeError.value = false
    supervisorError.value = false
    polygonError.value = false
    isLocating.value = false
    locationError.value = ''
    if (props.mode === 'edit' && props.entity) {
        form.name = props.entity.name
        form.code = props.entity.code
        form.leaderName = props.entity.leaderName
        form.description = props.entity.description
        form.color = props.entity.color
        form.isActive = props.entity.isActive
        form.supervisorId = props.entity.supervisorId
        tempPolygon.value = props.entity.polygon.map((p) => [...p] as LatLng)
    } else {
        form.name = ''
        form.code = ''
        form.leaderName = ''
        form.description = ''
        form.color = props.palette[0] ?? '#e9c176'
        form.isActive = true
        form.supervisorId = null
        tempPolygon.value = defaultBox(props.parentCentroid ?? DEFAULT_CENTER)
    }
}

function removeMap() {
    if (map) {
        map.remove()
        map = null
    }
    polygonLayer = null
    vertexMarkers = []
    userLocationMarker = null
}

function destroyMap() {
    mapGeneration += 1
    removeMap()
}

function renderPolygon(fit: boolean) {
    if (!map || !L) return
    if (polygonLayer) {
        polygonLayer.remove()
        polygonLayer = null
    }
    vertexMarkers.forEach((m) => m.remove())
    vertexMarkers = []

    const pts = tempPolygon.value
    if (pts.length >= 2) {
        polygonLayer = L.polygon(pts, {
            color: form.color,
            weight: 2,
            fillColor: form.color,
            fillOpacity: 0.16,
            dashArray: '5 5',
        }).addTo(map)
    }
    pts.forEach((pt) => {
        vertexMarkers.push(
            L!
                .circleMarker(pt, {
                    radius: 5,
                    color: '#fff',
                    weight: 2,
                    fillColor: form.color,
                    fillOpacity: 1,
                })
                .addTo(map!),
        )
    })

    if (fit && pts.length >= 2) map.fitBounds(L.latLngBounds(pts), { padding: [26, 26] })
    else if (fit) map.setView(props.parentCentroid ?? DEFAULT_CENTER, 11)
}

function addVertex(pt: LatLng) {
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
    renderPolygon(false)
}

function locateCurrentPosition() {
    locationError.value = ''

    if (!import.meta.client || !navigator.geolocation) {
        locationError.value = 'Tu navegador no permite obtener la ubicación actual.'
        return
    }

    isLocating.value = true
    navigator.geolocation.getCurrentPosition(
        ({ coords }) => {
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
    const generation = ++mapGeneration
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

    removeMap()
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
    map.on('click', (e) => addVertex([e.latlng.lat, e.latlng.lng]))
    renderPolygon(true)
    const current = map
    setTimeout(() => {
        if (
            !isUnmounted &&
            generation === mapGeneration &&
            map === current &&
            container.isConnected
        ) {
            current.invalidateSize()
        }
    }, 80)
}

watch(
    () => form.color,
    () => renderPolygon(false),
)

watch(
    () => props.open,
    (isOpen) => {
        if (isOpen) {
            resetForm()
            nextTick(() => initMap())
        } else {
            destroyMap()
        }
    },
)

onBeforeUnmount(() => {
    isUnmounted = true
    destroyMap()
})

function save() {
    if (!form.name.trim()) {
        nameError.value = true
        return
    }
    if (props.level !== 'sector' && !form.code.trim()) {
        codeError.value = true
        return
    }
    if (props.level === 'sector' && !form.supervisorId) {
        supervisorError.value = true
        return
    }
    if (tempPolygon.value.length < 3) {
        polygonError.value = true
        return
    }
    const polygon: Polygon = tempPolygon.value.map((p) => [...p] as LatLng)
    emit('save', {
        name: form.name.trim(),
        code: form.code.trim().toUpperCase(),
        leaderName: form.leaderName.trim(),
        description: form.description.trim(),
        color: form.color,
        polygon,
        isActive: form.isActive,
        supervisorId: form.supervisorId,
    })
}

const inputClass =
    'w-full rounded-lg border border-outline-variant bg-surface px-3 py-2.5 text-sm text-on-surface outline-none placeholder:text-on-surface-variant/60 focus:border-primary'
const labelClass =
    'mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-on-surface-variant'
</script>

<template>
    <template v-if="open">
        <div class="fixed inset-0 z-[60] bg-black/50" @click="emit('close')" />
        <aside
            class="territory-form-drawer fixed inset-y-0 right-0 z-[61] flex w-[460px] max-w-[94vw] flex-col bg-surface-container-low shadow-2xl"
        >
            <div class="flex-none border-b border-outline-variant px-6 py-5">
                <div class="flex items-center justify-between">
                    <span
                        class="text-[11px] font-bold uppercase tracking-[0.2em]"
                        :style="{ color: accent }"
                    >
                        {{ mode === 'create' ? `Nuevo ${levelLabel}` : `Editar ${levelLabel}` }}
                    </span>
                    <button
                        type="button"
                        class="text-on-surface-variant hover:text-on-surface"
                        aria-label="Cerrar"
                        @click="emit('close')"
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

            <div class="min-h-0 flex-1 overflow-y-auto px-6 py-5">
                <div class="mb-4">
                    <label
                        class="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-on-surface-variant"
                        for="tf-name"
                    >
                        Nombre del {{ levelLabel }} *
                    </label>
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

                <div v-if="level !== 'sector'" class="mb-4 grid grid-cols-2 gap-3">
                    <div>
                        <label
                            class="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-on-surface-variant"
                            for="tf-code"
                            >Código *</label
                        >
                        <input
                            id="tf-code"
                            v-model="form.code"
                            type="text"
                            placeholder="Ej. DM"
                            :class="[
                                inputClass,
                                codeError ? 'border-destructive focus:border-destructive' : '',
                            ]"
                            @input="codeError = false"
                        />
                        <p v-if="codeError" class="mt-1 text-xs text-destructive">
                            El código es obligatorio.
                        </p>
                    </div>
                    <div>
                        <label
                            class="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-on-surface-variant"
                            for="tf-leader"
                            >{{ leaderLabel }}</label
                        >
                        <input
                            id="tf-leader"
                            v-model="form.leaderName"
                            type="text"
                            :placeholder="`Ej. ${leaderLabel === 'Pastor' ? 'Pr. Manuel Cardona' : 'Ana Beltrán'}`"
                            :class="inputClass"
                        />
                    </div>
                </div>

                <div v-else class="mb-4 space-y-4">
                    <div>
                        <span :class="labelClass">Código</span>
                        <div
                            class="rounded-lg border border-outline-variant bg-surface-container px-3 py-2.5 text-sm text-on-surface"
                        >
                            {{
                                mode === 'edit' && form.code
                                    ? form.code
                                    : 'Se generará automáticamente al guardar (SEC-###)'
                            }}
                        </div>
                    </div>
                    <div>
                        <label :class="labelClass">Supervisor *</label>
                        <UiSearchSelect
                            v-model="form.supervisorId"
                            :options="supervisorOptions"
                            option-value="id"
                            option-label="fullName"
                            option-description="code"
                            :placeholder="
                                supervisorsLoading
                                    ? 'Cargando supervisores…'
                                    : 'Selecciona un supervisor'
                            "
                            search-placeholder="Buscar por nombre o código…"
                            empty-message="No hay supervisores activos disponibles"
                            :disabled="supervisorsLoading"
                            :invalid="supervisorError"
                            @update:model-value="supervisorError = false"
                        />
                        <p v-if="supervisorError" class="mt-1 text-xs text-destructive">
                            Debes asignar un supervisor del catálogo.
                        </p>
                        <p class="mt-1.5 text-xs leading-relaxed text-on-surface-variant">
                            Supervisará todas las reuniones del sector y su registro de asistencia y
                            ofrendas.
                        </p>
                    </div>
                </div>

                <div class="mb-4">
                    <label :class="labelClass" for="tf-desc">Descripción</label>
                    <textarea
                        id="tf-desc"
                        v-model="form.description"
                        rows="2"
                        placeholder="Cobertura, observaciones…"
                        :class="[inputClass, 'resize-none leading-relaxed']"
                    />
                </div>

                <div class="mb-5">
                    <label
                        class="flex cursor-pointer items-center justify-between rounded-lg border border-outline-variant bg-surface px-3 py-2.5"
                    >
                        <span>
                            <span class="block text-sm font-semibold text-on-surface">Activo</span>
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

                <div class="mb-5">
                    <span :class="labelClass">Color</span>
                    <div class="flex flex-wrap items-center gap-2.5">
                        <button
                            v-for="c in palette"
                            :key="c"
                            type="button"
                            class="size-7 rounded-full transition-transform hover:scale-110"
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

                <div>
                    <div class="mb-1.5 flex items-center justify-between">
                        <span
                            class="text-[11px] font-semibold uppercase tracking-wider text-on-surface-variant"
                            >Área que cubre</span
                        >
                        <div class="flex items-center gap-1.5">
                            <button
                                type="button"
                                class="inline-flex items-center gap-1 rounded-md border border-outline-variant px-2 py-1 text-[11px] font-semibold text-on-surface-variant transition-colors hover:border-primary hover:text-primary disabled:opacity-40"
                                :disabled="tempPolygon.length === 0"
                                @click="undoVertex"
                            >
                                <Undo2 class="size-3" /> Deshacer
                            </button>
                            <button
                                type="button"
                                class="inline-flex items-center gap-1 rounded-md border border-outline-variant px-2 py-1 text-[11px] font-semibold text-on-surface-variant transition-colors hover:border-destructive hover:text-destructive disabled:opacity-40"
                                :disabled="tempPolygon.length === 0"
                                @click="clearPolygon"
                            >
                                <Eraser class="size-3" /> Limpiar
                            </button>
                        </div>
                    </div>
                    <button
                        type="button"
                        class="mb-2 inline-flex w-full items-center justify-center gap-2 rounded-lg border border-primary/40 bg-primary/10 px-3 py-2 text-xs font-semibold text-primary transition-colors hover:border-primary hover:bg-primary/15 disabled:cursor-wait disabled:opacity-60"
                        :disabled="isLocating"
                        @click="locateCurrentPosition"
                    >
                        <LoaderCircle v-if="isLocating" class="size-4 animate-spin" />
                        <LocateFixed v-else class="size-4" />
                        {{ isLocating ? 'Buscando tu ubicación…' : 'Usar mi ubicación actual' }}
                    </button>
                    <p v-if="locationError" class="mb-2 text-xs text-destructive" role="alert">
                        {{ locationError }}
                    </p>
                    <div
                        ref="mapEl"
                        class="territory-form-map h-64 w-full overflow-hidden rounded-lg border border-outline-variant bg-surface-container"
                    />
                    <p class="mt-2 text-xs text-on-surface-variant">
                        Haz clic en el mapa para trazar el área.
                        <span class="text-on-surface">{{ tempPolygon.length }}</span> punto(s) ·
                        mínimo 3 para un área válida.
                    </p>
                    <p v-if="polygonError" class="mt-1 text-xs text-destructive" role="alert">
                        Debes definir al menos tres puntos para el área de cobertura.
                    </p>
                </div>
            </div>

            <div class="flex-none border-t border-outline-variant px-6 py-4">
                <div class="flex gap-2.5">
                    <button
                        type="button"
                        class="flex-1 rounded-lg border border-outline-variant px-4 py-2.5 text-sm font-medium text-on-surface-variant transition-colors hover:bg-surface-container-high"
                        :disabled="saving"
                        @click="emit('close')"
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
}
.territory-form-map :deep(.leaflet-container) {
    cursor: crosshair;
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
