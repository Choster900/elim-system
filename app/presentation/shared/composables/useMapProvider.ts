import type { MapProviderConfig, MapProviderName } from '../maps/map-provider.types'

const OPEN_STREET_MAP_ATTRIBUTION =
    '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'

const providers: Record<Exclude<MapProviderName, 'custom'>, MapProviderConfig> = {
    'carto-dark': {
        name: 'carto-dark',
        tileUrl: 'https://basemaps.cartocdn.com/rastertiles/dark_all/{z}/{x}/{y}.png',
        attribution: `${OPEN_STREET_MAP_ATTRIBUTION} &copy; <a href="https://carto.com/attributions">CARTO</a>`,
        maxZoom: 20,
    },
    'carto-light': {
        name: 'carto-light',
        tileUrl: 'https://basemaps.cartocdn.com/rastertiles/light_all/{z}/{x}/{y}.png',
        attribution: `${OPEN_STREET_MAP_ATTRIBUTION} &copy; <a href="https://carto.com/attributions">CARTO</a>`,
        maxZoom: 20,
    },
    openstreetmap: {
        name: 'openstreetmap',
        tileUrl: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
        attribution: OPEN_STREET_MAP_ATTRIBUTION,
        maxZoom: 19,
        subdomains: 'abc',
    },
}

function replaceApiKey(template: string, apiKey: string) {
    return template
        .replaceAll('{apiKey}', apiKey)
        .replaceAll('{key}', apiKey)
        .replaceAll('{accessToken}', apiKey)
}

function appendCartoApiKey(tileUrl: string, apiKey: string) {
    if (!apiKey) return tileUrl
    const separator = tileUrl.includes('?') ? '&' : '?'
    return `${tileUrl}${separator}key=${encodeURIComponent(apiKey)}`
}

/** Returns the selected raster-map provider from the public runtime configuration. */
export function useMapProvider() {
    const config = useRuntimeConfig()
    const providerName = config.public.mapProvider as MapProviderName

    const provider = computed<MapProviderConfig>(() => {
        if (providerName !== 'custom') {
            const provider = providers[providerName]
            return provider.name.startsWith('carto-')
                ? {
                      ...provider,
                      tileUrl: appendCartoApiKey(provider.tileUrl, config.public.mapApiKey),
                  }
                : provider
        }

        const tileUrl = replaceApiKey(config.public.mapTileUrl, config.public.mapApiKey)
        if (!tileUrl) {
            throw new Error(
                'NUXT_PUBLIC_MAP_TILE_URL es obligatoria cuando NUXT_PUBLIC_MAP_PROVIDER=custom.',
            )
        }

        return {
            name: 'custom',
            tileUrl,
            attribution: config.public.mapAttribution || OPEN_STREET_MAP_ATTRIBUTION,
            maxZoom: 20,
        }
    })

    return { provider }
}
