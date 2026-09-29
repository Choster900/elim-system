import type { MapProviderConfig } from './map-provider.types'

const OPEN_STREET_MAP_TILE_URL = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'
const OPEN_STREET_MAP_ATTRIBUTION =
    '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
const INITIAL_TILE_TIMEOUT_MS = 8_000

/**
 * Adaptador para cualquier proveedor que publique teselas raster compatibles
 * con Leaflet. Cambiar de proveedor solo requiere cambiar su configuración.
 */
export function addLeafletRasterLayer(
    leaflet: typeof import('leaflet'),
    map: import('leaflet').Map,
    provider: MapProviderConfig,
) {
    const layer = leaflet.tileLayer(provider.tileUrl, {
        attribution: provider.attribution,
        maxZoom: provider.maxZoom,
        // Leaflet resolves a subdomain even when the URL does not contain {s}.
        // Passing undefined overrides its default and prevents every tile from loading.
        ...(provider.subdomains !== undefined ? { subdomains: provider.subdomains } : {}),
    })

    if (!provider.name.startsWith('carto-')) return layer.addTo(map)

    let hasLoadedTile = false
    let hasTileErrors = false
    let stopped = false
    let fallbackTimer: ReturnType<typeof setTimeout> | undefined

    function stopMonitoring() {
        stopped = true
        clearTimeout(fallbackTimer)
        fallbackTimer = undefined
        layer.off('tileload', onTileLoad)
        layer.off('tileerror', onTileError)
        layer.off('load', onLoad)
        layer.off('remove', stopMonitoring)
        map.off('unload', stopMonitoring)
    }

    function useOpenStreetMapFallback() {
        if (stopped || hasLoadedTile || !map.hasLayer(layer)) return
        stopMonitoring()
        layer.remove()
        leaflet
            .tileLayer(OPEN_STREET_MAP_TILE_URL, {
                attribution: OPEN_STREET_MAP_ATTRIBUTION,
                maxZoom: 19,
                subdomains: 'abc',
            })
            .addTo(map)
    }

    function onTileLoad() {
        hasLoadedTile = true
        stopMonitoring()
    }

    function onTileError() {
        hasTileErrors = true
    }

    function onLoad() {
        // "load" also fires when all tiles failed. A single failed tile must not
        // replace a working provider, so only switch when none succeeded.
        if (stopped || hasLoadedTile || !hasTileErrors) return
        clearTimeout(fallbackTimer)
        // Leaflet still accesses the layer's map after dispatching tile events.
        // Wait until that callback completes before removing the failed layer.
        fallbackTimer = setTimeout(useOpenStreetMapFallback, 0)
    }

    layer.on('tileload', onTileLoad)
    layer.on('tileerror', onTileError)
    layer.on('load', onLoad)
    layer.once('remove', stopMonitoring)
    map.once('unload', stopMonitoring)
    fallbackTimer = setTimeout(useOpenStreetMapFallback, INITIAL_TILE_TIMEOUT_MS)

    try {
        layer.addTo(map)
    } catch (error) {
        stopMonitoring()
        throw error
    }

    return layer
}
