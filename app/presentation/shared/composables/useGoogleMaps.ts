interface GoogleMapsWindow extends Window {
    google?: { maps?: unknown }
}

interface GoogleMapsLoadOptions {
    libraries?: string[]
    language?: string
    region?: string
}

let scriptPromise: Promise<void> | null = null

/**
 * Punto único para cargar Google Maps JavaScript API desde cualquier pantalla.
 * La clave es pública por diseño: Google la valida mediante las restricciones
 * configuradas en Cloud Console, no ocultándola en el bundle del navegador.
 */
export function useGoogleMaps() {
    const runtimeConfig = useRuntimeConfig()
    const apiKey = runtimeConfig.public.googleMapsApiKey
    const mapId = runtimeConfig.public.googleMapsMapId
    const isConfigured = computed(() => Boolean(apiKey))

    function load(options: GoogleMapsLoadOptions = {}) {
        if (import.meta.server) {
            return Promise.reject(new Error('Google Maps solo puede cargarse en el navegador.'))
        }

        if (!apiKey) {
            return Promise.reject(
                new Error(
                    'Falta configurar NUXT_PUBLIC_GOOGLE_MAPS_API_KEY para usar Google Maps.',
                ),
            )
        }

        const windowWithGoogle = window as GoogleMapsWindow
        if (windowWithGoogle.google?.maps) return Promise.resolve()
        if (scriptPromise) return scriptPromise

        scriptPromise = new Promise<void>((resolve, reject) => {
            const script = document.createElement('script')
            const params = new URLSearchParams({
                key: apiKey,
                v: 'weekly',
                loading: 'async',
                language: options.language ?? 'es',
                region: options.region ?? 'SV',
            })

            if (options.libraries?.length) params.set('libraries', options.libraries.join(','))
            if (mapId) params.set('map_ids', mapId)

            script.id = 'google-maps-javascript-api'
            script.src = `https://maps.googleapis.com/maps/api/js?${params.toString()}`
            script.async = true
            script.onerror = () => {
                scriptPromise = null
                reject(
                    new Error(
                        'No fue posible cargar Google Maps. Revisa la clave y sus restricciones.',
                    ),
                )
            }
            script.onload = () => resolve()
            document.head.appendChild(script)
        })

        return scriptPromise
    }

    return { apiKey, mapId, isConfigured, load }
}
