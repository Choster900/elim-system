<script setup lang="ts">
import type { Map as LeafletMap, Marker } from 'leaflet'
import { addLeafletRasterLayer } from '@presentation/shared/maps/leaflet-raster.adapter'
import type { MapCoordinate, MapProviderConfig } from '@presentation/shared/maps/map-provider.types'

interface MapAdapterApi {
    map: LeafletMap
    leaflet: typeof import('leaflet')
}

const props = withDefaults(
    defineProps<{
        center: MapCoordinate
        zoom?: number
        markers?: MapCoordinate[]
        polygons?: MapCoordinate[][]
        provider?: MapProviderConfig
        scrollWheelZoom?: boolean
        interactive?: boolean
    }>(),
    {
        zoom: 13,
        markers: () => [],
        polygons: () => [],
        provider: undefined,
        scrollWheelZoom: false,
        interactive: true,
    },
)

const emit = defineEmits<{
    ready: [api: MapAdapterApi]
    click: [coordinates: MapCoordinate]
    error: [error: Error]
}>()

const mapElement = ref<HTMLElement | null>(null)
const { provider: configuredProvider } = useMapProvider()
let map: LeafletMap | null = null
let leaflet: typeof import('leaflet') | null = null
let markers: Marker[] = []
let polygonLayers: import('leaflet').Polygon[] = []

function clearOverlays() {
    if (!map) return
    markers.forEach((marker) => marker.removeFrom(map!))
    polygonLayers.forEach((polygon) => polygon.removeFrom(map!))
    markers = []
    polygonLayers = []
}

function renderOverlays() {
    if (!map || !leaflet) return
    clearOverlays()
    markers = props.markers.map((coordinates) => leaflet!.marker(coordinates).addTo(map!))
    polygonLayers = props.polygons.map((coordinates) => leaflet!.polygon(coordinates).addTo(map!))
}

async function initializeMap() {
    if (!mapElement.value || map) return

    try {
        const module = await import('leaflet')
        leaflet = module.default ?? module
        const activeProvider = props.provider ?? configuredProvider.value
        map = leaflet.map(mapElement.value, {
            zoomControl: true,
            scrollWheelZoom: props.scrollWheelZoom,
            dragging: props.interactive,
            touchZoom: props.interactive,
            doubleClickZoom: props.interactive,
            boxZoom: props.interactive,
            keyboard: props.interactive,
        })
        map.zoomControl.setPosition('topright')
        addLeafletRasterLayer(leaflet, map, activeProvider)
        map.setView(props.center, props.zoom)
        map.on('click', (event) => emit('click', [event.latlng.lat, event.latlng.lng]))
        renderOverlays()
        emit('ready', { map, leaflet })
    } catch (error) {
        emit('error', error instanceof Error ? error : new Error('No fue posible cargar el mapa.'))
    }
}

watch(
    () => props.center,
    (center) => map?.setView(center, map.getZoom()),
    { deep: true },
)
watch(() => [props.markers, props.polygons], renderOverlays, { deep: true })

onMounted(() => void initializeMap())
onBeforeUnmount(() => {
    clearOverlays()
    map?.remove()
    map = null
})
</script>

<template>
    <div ref="mapElement" class="map-adapter" aria-label="Mapa">
        <slot />
    </div>
</template>

<style scoped>
.map-adapter {
    height: 100%;
    min-height: 12rem;
    width: 100%;
}
</style>
