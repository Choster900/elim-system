<script setup lang="ts">
import {
    AlertTriangle,
    ChevronDown,
    ChevronRight,
    Layers,
    Map as MapIcon,
    MapPin,
    Pencil,
    Plus,
    Save,
    Sparkles,
    Trash2,
    Undo2,
    X,
} from '@lucide/vue'
import {
    DialogClose,
    DialogContent,
    DialogDescription,
    DialogOverlay,
    DialogPortal,
    DialogRoot,
    DialogTitle,
} from 'radix-vue'
import { useAppToast } from '~/presentation/shared/composables/useAppToast'
import {
    DEFAULT_MAP_ZOOM,
    ELSALVADOR_CENTER,
    type LatLng,
    type MockDistrict,
    type MockTerritorySector,
    type MockZone,
    type Polygon,
    districtPalette,
    mockDistricts,
    mockTerritorySectors,
    mockZones,
    sectorPalette,
    zonePalette,
} from '~/mock/territories.mock'

defineOptions({ name: 'TerritoriesView' })

useHead({
    title: 'Distritos · Sistema',
})

type Kind = 'district' | 'zone' | 'sector'
type AnyTerritory = MockDistrict | MockZone | MockTerritorySector

const STORAGE_KEY = 'territories-catalog-v1'

const districts = ref<MockDistrict[]>(structuredClone(mockDistricts))
const zones = ref<MockZone[]>(structuredClone(mockZones))
const sectors = ref<MockTerritorySector[]>(structuredClone(mockTerritorySectors))

const layers = reactive({ districts: true, zones: true, sectors: true })
const expandedDistricts = ref<Set<string>>(new Set([mockDistricts[0]!.id]))
const expandedZones = ref<Set<string>>(new Set())

const selectedId = ref<string | null>(null)
const selectedKind = ref<Kind | null>(null)
const editingPolygon = ref(false)
const tempPolygon = ref<Polygon>([])

const formOpen = ref(false)
const formMode = ref<'create' | 'edit'>('create')
const formKind = ref<Kind>('district')
const formParentId = ref<string | null>(null)
const formData = reactive({
    id: '',
    name: '',
    code: '',
    description: '',
    leaderName: '',
    color: '#e9c176',
})

const deleteDialogOpen = ref(false)
const deleteTarget = ref<{ kind: Kind; id: string } | null>(null)

const toast = useAppToast()

function loadFromStorage() {
    if (!import.meta.client) return
    try {
        const raw = localStorage.getItem(STORAGE_KEY)
        if (!raw) return
        const parsed = JSON.parse(raw)
        if (parsed.districts) districts.value = parsed.districts
        if (parsed.zones) zones.value = parsed.zones
        if (parsed.sectors) sectors.value = parsed.sectors
    } catch {
        // ignore
    }
}

function persist() {
    if (!import.meta.client) return
    localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ districts: districts.value, zones: zones.value, sectors: sectors.value }),
    )
}

function zonesOf(districtId: string) {
    return zones.value.filter((z) => z.districtId === districtId)
}
function sectorsOf(zoneId: string) {
    return sectors.value.filter((s) => s.zoneId === zoneId)
}
function findById(kind: Kind, id: string): AnyTerritory | undefined {
    if (kind === 'district') return districts.value.find((d) => d.id === id)
    if (kind === 'zone') return zones.value.find((z) => z.id === id)
    return sectors.value.find((s) => s.id === id)
}

const selectedItem = computed<AnyTerritory | null>(() => {
    if (!selectedId.value || !selectedKind.value) return null
    return findById(selectedKind.value, selectedId.value) ?? null
})

const selectedKindLabel = computed(() => {
    if (selectedKind.value === 'district') return 'Distrito'
    if (selectedKind.value === 'zone') return 'Zona'
    if (selectedKind.value === 'sector') return 'Sector'
    return ''
})

const selectedParentInfo = computed(() => {
    if (!selectedItem.value || !selectedKind.value) return null
    if (selectedKind.value === 'zone') {
        const d = districts.value.find((x) => x.id === (selectedItem.value as MockZone).districtId)
        return d ? { label: 'Distrito', name: d.name } : null
    }
    if (selectedKind.value === 'sector') {
        const z = zones.value.find((x) => x.id === (selectedItem.value as MockTerritorySector).zoneId)
        if (!z) return null
        const d = districts.value.find((x) => x.id === z.districtId)
        return { label: 'Zona', name: `${z.name}${d ? ` · ${d.name}` : ''}` }
    }
    return null
})

const summary = computed(() => ({
    districts: districts.value.length,
    zones: zones.value.length,
    sectors: sectors.value.length,
}))

function toggleDistrict(id: string) {
    if (expandedDistricts.value.has(id)) expandedDistricts.value.delete(id)
    else expandedDistricts.value.add(id)
    expandedDistricts.value = new Set(expandedDistricts.value)
}
function toggleZone(id: string) {
    if (expandedZones.value.has(id)) expandedZones.value.delete(id)
    else expandedZones.value.add(id)
    expandedZones.value = new Set(expandedZones.value)
}

function selectItem(kind: Kind, id: string) {
    selectedKind.value = kind
    selectedId.value = id
    if (editingPolygon.value) cancelPolygonEdit()
    if (kind === 'zone') {
        const z = zones.value.find((x) => x.id === id)
        if (z) expandedDistricts.value = new Set([...expandedDistricts.value, z.districtId])
    } else if (kind === 'sector') {
        const s = sectors.value.find((x) => x.id === id)
        if (s) {
            const z = zones.value.find((x) => x.id === s.zoneId)
            if (z) {
                expandedDistricts.value = new Set([...expandedDistricts.value, z.districtId])
                expandedZones.value = new Set([...expandedZones.value, z.id])
            }
        }
    }
    centerOnPolygon((findById(kind, id) as AnyTerritory).polygon)
}

function paletteFor(kind: Kind): string[] {
    if (kind === 'district') return districtPalette
    if (kind === 'zone') return zonePalette
    return sectorPalette
}

function openCreate(kind: Kind, parentId?: string) {
    formMode.value = 'create'
    formKind.value = kind
    formParentId.value = parentId ?? null
    const palette = paletteFor(kind)
    formData.id = ''
    formData.name = ''
    formData.code = ''
    formData.description = ''
    formData.leaderName = ''
    formData.color = palette[Math.floor(Math.random() * palette.length)] || palette[0]!
    formOpen.value = true
}

function openEdit(kind: Kind, id: string) {
    const item = findById(kind, id)
    if (!item) return
    formMode.value = 'edit'
    formKind.value = kind
    formParentId.value =
        kind === 'zone' ? (item as MockZone).districtId : kind === 'sector' ? (item as MockTerritorySector).zoneId : null
    formData.id = item.id
    formData.name = item.name
    formData.code = item.code
    formData.description = item.description
    formData.leaderName = item.leaderName
    formData.color = item.color
    formOpen.value = true
}

function defaultPolygonNear(center: LatLng): Polygon {
    const [lat, lng] = center
    const d = 0.015
    return [
        [lat + d, lng - d],
        [lat + d, lng + d],
        [lat - d, lng + d],
        [lat - d, lng - d],
    ]
}

function saveForm() {
    if (!formData.name.trim()) {
        toast.error('El nombre es obligatorio')
        return
    }
    if (!formData.code.trim()) {
        toast.error('El código es obligatorio')
        return
    }

    if (formMode.value === 'create') {
        const newId = `${formKind.value}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`
        const polygon = defaultPolygonNear(ELSALVADOR_CENTER)
        const base = {
            id: newId,
            name: formData.name,
            code: formData.code,
            description: formData.description,
            leaderName: formData.leaderName,
            color: formData.color,
            polygon,
            createdAt: new Date().toISOString(),
        }
        if (formKind.value === 'district') {
            districts.value.push({ ...base })
        } else if (formKind.value === 'zone') {
            if (!formParentId.value) {
                toast.error('Selecciona un distrito padre')
                return
            }
            zones.value.push({ ...base, districtId: formParentId.value })
        } else {
            if (!formParentId.value) {
                toast.error('Selecciona una zona padre')
                return
            }
            sectors.value.push({ ...base, zoneId: formParentId.value })
        }
        toast.success(`${selectedKindLabelFor(formKind.value)} creado`)
        selectItem(formKind.value, newId)
    } else {
        const item = findById(formKind.value, formData.id)
        if (!item) return
        item.name = formData.name
        item.code = formData.code
        item.description = formData.description
        item.leaderName = formData.leaderName
        item.color = formData.color
        toast.success('Cambios guardados')
    }

    persist()
    formOpen.value = false
}

function selectedKindLabelFor(kind: Kind) {
    if (kind === 'district') return 'Distrito'
    if (kind === 'zone') return 'Zona'
    return 'Sector'
}

function askDelete(kind: Kind, id: string) {
    deleteTarget.value = { kind, id }
    deleteDialogOpen.value = true
}

function confirmDelete() {
    if (!deleteTarget.value) return
    const { kind, id } = deleteTarget.value
    if (kind === 'district') {
        const childZones = zones.value.filter((z) => z.districtId === id).map((z) => z.id)
        sectors.value = sectors.value.filter((s) => !childZones.includes(s.zoneId))
        zones.value = zones.value.filter((z) => z.districtId !== id)
        districts.value = districts.value.filter((d) => d.id !== id)
    } else if (kind === 'zone') {
        sectors.value = sectors.value.filter((s) => s.zoneId !== id)
        zones.value = zones.value.filter((z) => z.id !== id)
    } else {
        sectors.value = sectors.value.filter((s) => s.id !== id)
    }
    if (selectedId.value === id) {
        selectedId.value = null
        selectedKind.value = null
    }
    persist()
    deleteDialogOpen.value = false
    deleteTarget.value = null
    toast.success('Eliminado')
}

function startPolygonEdit() {
    if (!selectedItem.value) return
    tempPolygon.value = []
    editingPolygon.value = true
    toast.info('Click en el mapa para definir vértices. Doble click para finalizar.')
}

function cancelPolygonEdit() {
    editingPolygon.value = false
    tempPolygon.value = []
}

function savePolygonEdit() {
    if (!selectedItem.value || tempPolygon.value.length < 3) {
        toast.error('Necesitas al menos 3 puntos')
        return
    }
    selectedItem.value.polygon = [...tempPolygon.value]
    persist()
    editingPolygon.value = false
    tempPolygon.value = []
    toast.success('Polígono actualizado')
}

function addTempPoint(latlng: LatLng) {
    if (!editingPolygon.value) return
    tempPolygon.value = [...tempPolygon.value, latlng]
}

function undoTempPoint() {
    if (tempPolygon.value.length === 0) return
    tempPolygon.value = tempPolygon.value.slice(0, -1)
}

// ===== Leaflet integration =====
const mapContainer = ref<HTMLElement | null>(null)
let map: import('leaflet').Map | null = null
let polygonLayers = new Map<string, import('leaflet').Polygon>()
let tempPolygonLayer: import('leaflet').Polygon | null = null
let tempMarkers: import('leaflet').CircleMarker[] = []
let L: typeof import('leaflet') | null = null

async function initMap() {
    if (!import.meta.client || !mapContainer.value) return
    L = (await import('leaflet')).default ?? (await import('leaflet'))
    if (!L || !mapContainer.value) return

    map = L.map(mapContainer.value, {
        center: ELSALVADOR_CENTER,
        zoom: DEFAULT_MAP_ZOOM,
        zoomControl: true,
        attributionControl: true,
    })

    L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
        attribution: '© OpenStreetMap · © CARTO',
        subdomains: 'abcd',
        maxZoom: 20,
    }).addTo(map)

    map.on('click', (e: any) => {
        if (editingPolygon.value) {
            addTempPoint([e.latlng.lat, e.latlng.lng])
        }
    })
    map.on('dblclick', (e: any) => {
        if (editingPolygon.value) {
            e.originalEvent.preventDefault()
            savePolygonEdit()
        }
    })

    renderPolygons()
}

function clearPolygons() {
    polygonLayers.forEach((layer) => layer.remove())
    polygonLayers.clear()
}

function renderPolygons() {
    if (!map || !L) return
    clearPolygons()

    const drawForKind = (
        items: AnyTerritory[],
        kind: Kind,
        weight: number,
        fillOpacity: number,
    ) => {
        for (const item of items) {
            if (kind === 'district' && !layers.districts) continue
            if (kind === 'zone' && !layers.zones) continue
            if (kind === 'sector' && !layers.sectors) continue
            const isSelected = selectedId.value === item.id && selectedKind.value === kind
            const polygon = L!
                .polygon(item.polygon, {
                    color: item.color,
                    weight: isSelected ? weight + 2 : weight,
                    fillColor: item.color,
                    fillOpacity: isSelected ? fillOpacity + 0.15 : fillOpacity,
                    dashArray: kind === 'district' ? undefined : kind === 'zone' ? '6,4' : '2,3',
                })
                .addTo(map!)
            polygon.bindTooltip(`<strong>${item.name}</strong><br><span style="font-size:10px;opacity:0.7">${selectedKindLabelFor(kind).toUpperCase()} · ${item.code}</span>`, {
                sticky: true,
                direction: 'top',
                className: 'territory-tooltip',
            })
            polygon.on('click', (e: any) => {
                e.originalEvent.stopPropagation()
                if (editingPolygon.value) return
                selectItem(kind, item.id)
            })
            polygonLayers.set(`${kind}-${item.id}`, polygon)
        }
    }

    drawForKind(districts.value, 'district', 3, 0.08)
    drawForKind(zones.value, 'zone', 2.5, 0.1)
    drawForKind(sectors.value, 'sector', 2, 0.18)

    renderTempPolygon()
}

function renderTempPolygon() {
    if (!map || !L) return
    tempPolygonLayer?.remove()
    tempPolygonLayer = null
    tempMarkers.forEach((m) => m.remove())
    tempMarkers = []
    if (!editingPolygon.value || tempPolygon.value.length === 0) return
    if (tempPolygon.value.length >= 2) {
        tempPolygonLayer = L.polygon(tempPolygon.value, {
            color: '#e9c176',
            weight: 3,
            fillColor: '#e9c176',
            fillOpacity: 0.2,
            dashArray: '4,4',
        }).addTo(map)
    }
    tempPolygon.value.forEach((pt, i) => {
        const marker = L!
            .circleMarker(pt, {
                radius: 6,
                color: '#fff',
                weight: 2,
                fillColor: '#e9c176',
                fillOpacity: 1,
            })
            .addTo(map!)
        marker.bindTooltip(String(i + 1), { permanent: true, direction: 'center', className: 'territory-vertex' })
        tempMarkers.push(marker)
    })
}

function centerOnPolygon(polygon: Polygon) {
    if (!map || !L || polygon.length === 0) return
    const bounds = L.latLngBounds(polygon as any)
    map.fitBounds(bounds, { padding: [40, 40], maxZoom: 14 })
}

onMounted(async () => {
    loadFromStorage()
    await nextTick()
    await initMap()
})

onBeforeUnmount(() => {
    if (map) {
        map.remove()
        map = null
    }
})

watch(
    () => [layers.districts, layers.zones, layers.sectors, selectedId.value, selectedKind.value, districts.value.length, zones.value.length, sectors.value.length],
    () => renderPolygons(),
    { deep: true },
)
watch(tempPolygon, () => renderTempPolygon(), { deep: true })

const districtOptions = computed(() => districts.value.map((d) => ({ value: d.id, label: d.name })))
const zoneOptions = computed(() => zones.value.map((z) => ({ value: z.id, label: z.name })))
const formCurrentPalette = computed(() => paletteFor(formKind.value))
</script>

<template>
    <div class="flex h-[calc(100vh-4rem)] flex-col">
        <header class="border-b border-outline-variant bg-surface px-6 py-4 lg:px-10">
            <div class="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
                <div>
                    <p class="text-[11px] font-semibold uppercase tracking-[0.3em] text-on-surface-variant">
                        Catálogos · Geografía Ministerial
                    </p>
                    <h1 class="mt-2 font-display text-2xl font-semibold text-on-surface md:text-3xl">
                        Distritos, Zonas y Sectores
                    </h1>
                </div>
                <div class="flex items-center gap-5 text-xs text-on-surface-variant">
                    <div class="flex items-center gap-1.5">
                        <span class="size-2 rounded-full bg-[#e9c176]" />
                        <span>{{ summary.districts }} distritos</span>
                    </div>
                    <div class="flex items-center gap-1.5">
                        <span class="size-2 rounded-full bg-[#9bc1bc]" />
                        <span>{{ summary.zones }} zonas</span>
                    </div>
                    <div class="flex items-center gap-1.5">
                        <span class="size-2 rounded-full bg-[#a3b18a]" />
                        <span>{{ summary.sectors }} sectores</span>
                    </div>
                </div>
            </div>
        </header>

        <div class="flex flex-1 overflow-hidden">
            <aside class="hidden w-80 shrink-0 flex-col border-r border-outline-variant bg-surface-container md:flex">
                <div class="flex items-center justify-between border-b border-outline-variant px-4 py-3">
                    <h2 class="text-xs font-semibold uppercase tracking-wider text-on-surface-variant">Jerarquía</h2>
                    <button
                        type="button"
                        class="inline-flex items-center gap-1 rounded bg-primary px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-primary-foreground hover:bg-primary/90"
                        @click="openCreate('district')"
                    >
                        <Plus class="size-3" /> Distrito
                    </button>
                </div>

                <div class="flex items-center gap-3 border-b border-outline-variant px-4 py-2.5 text-[11px]">
                    <Layers class="size-3.5 text-on-surface-variant" />
                    <label class="flex items-center gap-1.5 text-on-surface-variant">
                        <input v-model="layers.districts" type="checkbox" class="size-3 accent-primary" />
                        Distritos
                    </label>
                    <label class="flex items-center gap-1.5 text-on-surface-variant">
                        <input v-model="layers.zones" type="checkbox" class="size-3 accent-primary" />
                        Zonas
                    </label>
                    <label class="flex items-center gap-1.5 text-on-surface-variant">
                        <input v-model="layers.sectors" type="checkbox" class="size-3 accent-primary" />
                        Sectores
                    </label>
                </div>

                <div class="flex-1 overflow-y-auto px-2 py-2">
                    <div v-if="districts.length === 0" class="px-3 py-8 text-center text-xs text-on-surface-variant">
                        Aún no hay distritos. Crea el primero arriba.
                    </div>
                    <ul class="space-y-0.5">
                        <li v-for="d in districts" :key="d.id">
                            <div
                                class="group flex items-center gap-1 rounded px-2 py-1.5 transition-colors hover:bg-surface-container-high"
                                :class="selectedKind === 'district' && selectedId === d.id ? 'bg-primary/10' : ''"
                            >
                                <button type="button" class="text-on-surface-variant" @click="toggleDistrict(d.id)">
                                    <ChevronDown v-if="expandedDistricts.has(d.id)" class="size-3.5" />
                                    <ChevronRight v-else class="size-3.5" />
                                </button>
                                <button type="button" class="flex flex-1 items-center gap-2 truncate text-left" @click="selectItem('district', d.id)">
                                    <span class="size-3 shrink-0 rounded" :style="{ backgroundColor: d.color }" />
                                    <span class="truncate text-xs font-semibold text-on-surface">{{ d.name }}</span>
                                    <span class="text-[10px] text-on-surface-variant">{{ zonesOf(d.id).length }}</span>
                                </button>
                                <div class="hidden gap-0.5 group-hover:flex">
                                    <button type="button" class="rounded p-1 text-on-surface-variant hover:bg-surface hover:text-primary" :aria-label="`Editar ${d.name}`" @click="openEdit('district', d.id)">
                                        <Pencil class="size-3" />
                                    </button>
                                    <button type="button" class="rounded p-1 text-on-surface-variant hover:bg-surface hover:text-primary" :aria-label="`Añadir zona en ${d.name}`" @click="openCreate('zone', d.id)">
                                        <Plus class="size-3" />
                                    </button>
                                    <button type="button" class="rounded p-1 text-on-surface-variant hover:bg-surface hover:text-destructive" :aria-label="`Eliminar ${d.name}`" @click="askDelete('district', d.id)">
                                        <Trash2 class="size-3" />
                                    </button>
                                </div>
                            </div>

                            <ul v-if="expandedDistricts.has(d.id)" class="ml-5 space-y-0.5 border-l border-outline-variant pl-2">
                                <li v-for="z in zonesOf(d.id)" :key="z.id">
                                    <div
                                        class="group flex items-center gap-1 rounded px-2 py-1.5 transition-colors hover:bg-surface-container-high"
                                        :class="selectedKind === 'zone' && selectedId === z.id ? 'bg-primary/10' : ''"
                                    >
                                        <button type="button" class="text-on-surface-variant" @click="toggleZone(z.id)">
                                            <ChevronDown v-if="expandedZones.has(z.id)" class="size-3.5" />
                                            <ChevronRight v-else class="size-3.5" />
                                        </button>
                                        <button type="button" class="flex flex-1 items-center gap-2 truncate text-left" @click="selectItem('zone', z.id)">
                                            <span class="size-2.5 shrink-0 rounded" :style="{ backgroundColor: z.color }" />
                                            <span class="truncate text-xs text-on-surface">{{ z.name }}</span>
                                            <span class="text-[10px] text-on-surface-variant">{{ sectorsOf(z.id).length }}</span>
                                        </button>
                                        <div class="hidden gap-0.5 group-hover:flex">
                                            <button type="button" class="rounded p-1 text-on-surface-variant hover:bg-surface hover:text-primary" @click="openEdit('zone', z.id)">
                                                <Pencil class="size-3" />
                                            </button>
                                            <button type="button" class="rounded p-1 text-on-surface-variant hover:bg-surface hover:text-primary" @click="openCreate('sector', z.id)">
                                                <Plus class="size-3" />
                                            </button>
                                            <button type="button" class="rounded p-1 text-on-surface-variant hover:bg-surface hover:text-destructive" @click="askDelete('zone', z.id)">
                                                <Trash2 class="size-3" />
                                            </button>
                                        </div>
                                    </div>

                                    <ul v-if="expandedZones.has(z.id)" class="ml-5 space-y-0.5 border-l border-outline-variant pl-2">
                                        <li
                                            v-for="s in sectorsOf(z.id)"
                                            :key="s.id"
                                            class="group flex items-center gap-1 rounded px-2 py-1.5 transition-colors hover:bg-surface-container-high"
                                            :class="selectedKind === 'sector' && selectedId === s.id ? 'bg-primary/10' : ''"
                                        >
                                            <button type="button" class="flex flex-1 items-center gap-2 truncate text-left" @click="selectItem('sector', s.id)">
                                                <span class="size-2 shrink-0 rounded-full" :style="{ backgroundColor: s.color }" />
                                                <span class="truncate text-xs text-on-surface">{{ s.name }}</span>
                                            </button>
                                            <div class="hidden gap-0.5 group-hover:flex">
                                                <button type="button" class="rounded p-1 text-on-surface-variant hover:bg-surface hover:text-primary" @click="openEdit('sector', s.id)">
                                                    <Pencil class="size-3" />
                                                </button>
                                                <button type="button" class="rounded p-1 text-on-surface-variant hover:bg-surface hover:text-destructive" @click="askDelete('sector', s.id)">
                                                    <Trash2 class="size-3" />
                                                </button>
                                            </div>
                                        </li>
                                    </ul>
                                </li>
                            </ul>
                        </li>
                    </ul>
                </div>
            </aside>

            <main class="relative flex-1">
                <div ref="mapContainer" class="absolute inset-0 z-0 bg-surface-container-low" />

                <div
                    v-if="editingPolygon"
                    class="absolute left-1/2 top-4 z-20 flex -translate-x-1/2 items-center gap-2 rounded-lg border border-primary/40 bg-surface/95 px-4 py-2 shadow-lg backdrop-blur"
                >
                    <Sparkles class="size-4 text-primary" />
                    <div class="text-xs text-on-surface">
                        <p class="font-semibold">Editando polígono</p>
                        <p class="text-on-surface-variant">{{ tempPolygon.length }} puntos · click para añadir, doble click para guardar</p>
                    </div>
                    <button type="button" class="rounded border border-outline-variant px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-on-surface-variant hover:border-primary hover:text-primary" @click="undoTempPoint">
                        <Undo2 class="inline size-3" /> Deshacer
                    </button>
                    <button type="button" class="rounded bg-primary px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-primary-foreground hover:bg-primary/90" @click="savePolygonEdit">
                        Guardar
                    </button>
                    <button type="button" class="rounded px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-destructive hover:bg-destructive/10" @click="cancelPolygonEdit">
                        Cancelar
                    </button>
                </div>

                <aside
                    v-if="selectedItem && !editingPolygon"
                    class="absolute right-4 top-4 z-10 w-80 max-w-[calc(100%-2rem)] rounded-lg border border-outline-variant bg-surface/95 shadow-xl backdrop-blur"
                >
                    <div class="h-1.5" :style="{ backgroundColor: selectedItem.color }" />
                    <div class="px-4 py-4">
                        <div class="flex items-start justify-between gap-3">
                            <div class="min-w-0">
                                <p class="text-[10px] font-semibold uppercase tracking-[0.3em] text-on-surface-variant">
                                    {{ selectedKindLabel }} · {{ selectedItem.code }}
                                </p>
                                <h3 class="mt-1 font-display text-lg font-semibold text-on-surface">
                                    {{ selectedItem.name }}
                                </h3>
                            </div>
                            <button
                                type="button"
                                class="flex size-7 shrink-0 items-center justify-center rounded-full text-on-surface-variant hover:bg-surface-container hover:text-on-surface"
                                @click="selectedId = null; selectedKind = null"
                            >
                                <X class="size-3.5" />
                            </button>
                        </div>

                        <p v-if="selectedItem.description" class="mt-3 text-xs text-on-surface-variant">
                            {{ selectedItem.description }}
                        </p>

                        <div v-if="selectedParentInfo" class="mt-3 flex items-center gap-2 rounded border border-outline-variant bg-surface-container px-3 py-2 text-xs">
                            <MapPin class="size-3.5 text-on-surface-variant" />
                            <div class="min-w-0">
                                <p class="text-[10px] font-semibold uppercase tracking-wider text-on-surface-variant">{{ selectedParentInfo.label }}</p>
                                <p class="truncate text-on-surface">{{ selectedParentInfo.name }}</p>
                            </div>
                        </div>

                        <div class="mt-3 grid gap-2 text-xs">
                            <div class="flex justify-between">
                                <span class="text-on-surface-variant">Líder</span>
                                <span class="font-medium text-on-surface">{{ selectedItem.leaderName || '—' }}</span>
                            </div>
                            <div class="flex justify-between">
                                <span class="text-on-surface-variant">Vértices</span>
                                <span class="font-medium text-on-surface">{{ selectedItem.polygon.length }}</span>
                            </div>
                        </div>

                        <div class="mt-4 grid grid-cols-2 gap-2">
                            <button
                                type="button"
                                class="flex items-center justify-center gap-1.5 rounded border border-outline-variant px-3 py-2 text-[11px] font-semibold uppercase tracking-wider text-on-surface-variant hover:border-primary hover:text-primary"
                                @click="openEdit(selectedKind!, selectedItem.id)"
                            >
                                <Pencil class="size-3" /> Editar datos
                            </button>
                            <button
                                type="button"
                                class="flex items-center justify-center gap-1.5 rounded bg-primary px-3 py-2 text-[11px] font-semibold uppercase tracking-wider text-primary-foreground hover:bg-primary/90"
                                @click="startPolygonEdit"
                            >
                                <MapIcon class="size-3" /> Redibujar
                            </button>
                        </div>
                    </div>
                </aside>

                <div
                    v-if="!selectedItem && !editingPolygon"
                    class="pointer-events-none absolute bottom-4 left-1/2 z-10 -translate-x-1/2 rounded-full border border-outline-variant bg-surface/95 px-4 py-2 text-xs text-on-surface-variant shadow backdrop-blur"
                >
                    Selecciona un territorio en el árbol o el mapa para ver detalles
                </div>
            </main>
        </div>

        <DialogRoot v-model:open="formOpen">
            <DialogPortal>
                <DialogOverlay class="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm" />
                <DialogContent class="fixed left-1/2 top-1/2 z-50 w-[95vw] max-w-lg -translate-x-1/2 -translate-y-1/2 rounded-lg border border-outline-variant bg-surface p-6 shadow-2xl focus:outline-none">
                    <div class="mb-4 flex items-start justify-between">
                        <div>
                            <DialogTitle class="font-display text-xl font-semibold text-on-surface">
                                {{ formMode === 'create' ? `Nuevo ${selectedKindLabelFor(formKind).toLowerCase()}` : `Editar ${selectedKindLabelFor(formKind).toLowerCase()}` }}
                            </DialogTitle>
                            <DialogDescription class="mt-1 text-sm text-on-surface-variant">
                                {{ formMode === 'create' ? 'Tras crearlo, podrás dibujar su polígono en el mapa.' : 'Actualiza los datos. Para cambiar el polígono usa el botón "Redibujar".' }}
                            </DialogDescription>
                        </div>
                        <DialogClose class="flex size-8 items-center justify-center rounded-full text-on-surface-variant hover:bg-surface-container hover:text-on-surface">
                            <X class="size-4" />
                        </DialogClose>
                    </div>

                    <div class="space-y-4">
                        <div v-if="formMode === 'create' && formKind === 'zone'">
                            <label class="text-[11px] font-semibold uppercase tracking-wider text-on-surface-variant">Distrito padre</label>
                            <div class="mt-1">
                                <UiSearchSelect v-model="formParentId" :options="districtOptions" placeholder="Selecciona un distrito" />
                            </div>
                        </div>
                        <div v-if="formMode === 'create' && formKind === 'sector'">
                            <label class="text-[11px] font-semibold uppercase tracking-wider text-on-surface-variant">Zona padre</label>
                            <div class="mt-1">
                                <UiSearchSelect v-model="formParentId" :options="zoneOptions" placeholder="Selecciona una zona" />
                            </div>
                        </div>

                        <div class="grid gap-3 md:grid-cols-[1fr_120px]">
                            <div>
                                <label class="text-[11px] font-semibold uppercase tracking-wider text-on-surface-variant">Nombre *</label>
                                <input v-model="formData.name" type="text" class="mt-1 h-10 w-full rounded border border-outline-variant bg-surface-container px-3 text-sm text-on-surface focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary" placeholder="Nombre del territorio" />
                            </div>
                            <div>
                                <label class="text-[11px] font-semibold uppercase tracking-wider text-on-surface-variant">Código *</label>
                                <input v-model="formData.code" type="text" class="mt-1 h-10 w-full rounded border border-outline-variant bg-surface-container px-3 text-sm uppercase text-on-surface focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary" placeholder="DM" />
                            </div>
                        </div>
                        <div>
                            <label class="text-[11px] font-semibold uppercase tracking-wider text-on-surface-variant">Descripción</label>
                            <textarea v-model="formData.description" rows="2" class="mt-1 w-full rounded border border-outline-variant bg-surface-container px-3 py-2 text-sm text-on-surface focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary" placeholder="Cobertura geográfica y observaciones" />
                        </div>
                        <div>
                            <label class="text-[11px] font-semibold uppercase tracking-wider text-on-surface-variant">Líder responsable</label>
                            <input v-model="formData.leaderName" type="text" class="mt-1 h-10 w-full rounded border border-outline-variant bg-surface-container px-3 text-sm text-on-surface focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary" placeholder="Nombre del responsable" />
                        </div>
                        <div>
                            <span class="text-[11px] font-semibold uppercase tracking-wider text-on-surface-variant">Color de identificación</span>
                            <div class="mt-2 flex flex-wrap items-center gap-2">
                                <button v-for="c in formCurrentPalette" :key="c" type="button" class="size-7 rounded-full border-2 transition-transform hover:scale-110" :style="{ backgroundColor: c, borderColor: formData.color === c ? '#fff' : 'transparent' }" :aria-label="`Color ${c}`" @click="formData.color = c" />
                            </div>
                        </div>
                    </div>

                    <div class="mt-6 flex justify-end gap-2">
                        <DialogClose as-child>
                            <UiButton variant="outline" type="button" class="h-10 rounded px-4 text-xs uppercase tracking-wider">Cancelar</UiButton>
                        </DialogClose>
                        <UiButton type="button" class="h-10 rounded px-5 text-xs uppercase tracking-wider" @click="saveForm">
                            <Save class="mr-2 size-4" />
                            {{ formMode === 'create' ? 'Crear' : 'Guardar' }}
                        </UiButton>
                    </div>
                </DialogContent>
            </DialogPortal>
        </DialogRoot>

        <DialogRoot v-model:open="deleteDialogOpen">
            <DialogPortal>
                <DialogOverlay class="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm" />
                <DialogContent class="fixed left-1/2 top-1/2 z-50 w-[90vw] max-w-md -translate-x-1/2 -translate-y-1/2 rounded-lg border border-outline-variant bg-surface p-6 shadow-2xl focus:outline-none">
                    <div class="flex items-start gap-4">
                        <div class="flex size-11 shrink-0 items-center justify-center rounded-full bg-destructive/10 text-destructive">
                            <AlertTriangle class="size-5" />
                        </div>
                        <div>
                            <DialogTitle class="font-display text-xl font-semibold text-on-surface">Eliminar territorio</DialogTitle>
                            <DialogDescription class="mt-2 text-sm text-on-surface-variant">
                                Esta acción es permanente. Si tiene hijos (zonas o sectores), también serán eliminados.
                            </DialogDescription>
                        </div>
                    </div>
                    <div class="mt-6 flex justify-end gap-2">
                        <DialogClose as-child>
                            <UiButton variant="outline" type="button" class="h-10 rounded px-4 text-xs uppercase tracking-wider">Cancelar</UiButton>
                        </DialogClose>
                        <UiButton type="button" class="h-10 rounded bg-destructive px-4 text-xs uppercase tracking-wider text-white hover:bg-destructive/90" @click="confirmDelete">
                            <Trash2 class="mr-2 size-4" /> Eliminar
                        </UiButton>
                    </div>
                </DialogContent>
            </DialogPortal>
        </DialogRoot>
    </div>
</template>

<style>
.territory-tooltip {
    background: rgba(0, 0, 0, 0.85);
    color: #fff;
    border: none;
    border-radius: 6px;
    padding: 6px 10px;
    font-size: 12px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
}
.territory-tooltip::before {
    border-top-color: rgba(0, 0, 0, 0.85);
}
.territory-vertex {
    background: transparent !important;
    color: #fff !important;
    border: none !important;
    box-shadow: none !important;
    font-size: 10px !important;
    font-weight: 700 !important;
    pointer-events: none !important;
}
.leaflet-container {
    background: var(--surface-container-low, #f5f5f5);
    font-family: inherit;
}
</style>
