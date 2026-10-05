<script setup lang="ts">
import { ArrowUpRight } from '@lucide/vue'
import { useMapProvider } from '~/presentation/shared/composables/useMapProvider'
import { addLeafletRasterLayer } from '~/presentation/shared/maps/leaflet-raster.adapter'
import type { MapProviderConfig } from '~/presentation/shared/maps/map-provider.types'
import { landingContact } from '../constants/landing.constants'

/**
 * Mapa real de la ubicación con estilo oscuro y minimalista. Leaflet y las teselas solo
 * se cargan cuando la sección está por entrar en pantalla; mientras tanto (y si no hay
 * red) se ve la ilustración de calles como fondo.
 */
const mapElement = ref<HTMLElement | null>(null)
const isMapReady = ref(false)
const { provider } = useMapProvider()

let map: import('leaflet').Map | null = null
let observer: IntersectionObserver | null = null
let isUnmounted = false

// La landing siempre usa el mapa oscuro, aunque el resto del sistema use el claro.
function darkProvider(): MapProviderConfig {
    const current = provider.value
    return current.name === 'carto-light'
        ? {
              ...current,
              name: 'carto-dark',
              tileUrl: current.tileUrl.replace('/light_all/', '/dark_all/'),
          }
        : current
}

// Ícono `Church` de Lucide (mismo trazo que el resto del sistema) dentro de una gota dorada.
const CHURCH_ICON = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M10 9h4"/><path d="M12 7v5"/><path d="M14 21v-3a2 2 0 0 0-4 0v3"/><path d="m18 9 3.52 2.147a1 1 0 0 1 .48.854V19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2v-6.999a1 1 0 0 1 .48-.854L6 9"/><path d="M6 21V7a1 1 0 0 1 .376-.782l5-3.999a1 1 0 0 1 1.249.001l5 4A1 1 0 0 1 18 7v14"/></svg>`

const PIN_HTML = `
<span class="landing-map-pin__pulse"></span>
<span class="landing-map-pin__shadow"></span>
<span class="landing-map-pin__body">
    <span class="landing-map-pin__drop"></span>
    <span class="landing-map-pin__icon">${CHURCH_ICON}</span>
    <span class="landing-map-pin__label">Elim</span>
</span>`

async function initMap() {
    if (!mapElement.value || map) return
    const leaflet = await import('leaflet')
    if (isUnmounted || !mapElement.value) return

    const center = landingContact.coordinates
    map = leaflet.map(mapElement.value, {
        center,
        zoom: 15,
        zoomControl: false,
        // No secuestra el scroll de la página ni el arrastre con un dedo en el celular.
        scrollWheelZoom: false,
        dragging: !leaflet.Browser.mobile,
        attributionControl: false,
    })
    leaflet.control.zoom({ position: 'topright' }).addTo(map)
    // Arriba a la izquierda para no chocar con la tarjeta y el botón de abajo.
    leaflet.control.attribution({ position: 'topleft', prefix: false }).addTo(map)

    // Se muestra el mapa en cuanto llega la primera tesela, de CARTO o del respaldo de
    // OpenStreetMap que agrega el adaptador; hasta entonces queda la ilustración.
    const showWhenTilesArrive = (tileLayer: import('leaflet').Layer) => {
        if (tileLayer instanceof leaflet.TileLayer) {
            tileLayer.once('tileload', () => (isMapReady.value = true))
        }
    }
    map.on('layeradd', (event) => showWhenTilesArrive(event.layer))
    addLeafletRasterLayer(leaflet, map, darkProvider())

    leaflet
        .marker(center, {
            icon: leaflet.divIcon({
                className: 'landing-map-pin',
                html: PIN_HTML,
                iconSize: [0, 0],
            }),
            keyboard: false,
            interactive: false,
        })
        .addTo(map)
}

onMounted(() => {
    if (!mapElement.value) return
    observer = new IntersectionObserver(
        (entries) => {
            if (!entries.some((entry) => entry.isIntersecting)) return
            observer?.disconnect()
            observer = null
            void initMap()
        },
        { rootMargin: '300px 0px' },
    )
    observer.observe(mapElement.value)
})

onBeforeUnmount(() => {
    isUnmounted = true
    observer?.disconnect()
    map?.remove()
    map = null
})

const minorStreets = [
    'M-40 150 L 1240 205',
    'M-40 420 L 1240 395',
    'M-40 495 L 1240 470',
    'M120 -20 L 175 560',
    'M330 -20 L 365 560',
    'M790 -20 L 830 560',
    'M1010 -20 L 1050 560',
    'M455 -20 L 470 140 L 520 560',
    'M-40 290 C 120 300, 220 250, 300 230',
    'M660 330 L 1240 300',
]
const avenue = 'M-40 360 C 300 340, 450 290, 600 260 S 950 200, 1240 165'
</script>

<template>
    <div
        class="landing-map relative h-[clamp(380px,44vw,540px)] overflow-hidden rounded-[20px] border border-[rgba(78,70,57,0.7)] bg-[#0f1212]"
    >
        <!-- Fondo mientras carga el mapa real -->
        <svg
            viewBox="0 0 1200 520"
            preserveAspectRatio="xMidYMid slice"
            aria-hidden="true"
            class="absolute inset-0 block size-full transition-opacity duration-700"
            :class="isMapReady ? 'opacity-0' : 'opacity-100'"
        >
            <path
                d="M-40 70 C 140 40, 260 90, 380 60 S 560 20, 700 50 L 700 -40 L -40 -40 Z"
                fill="#121a1f"
            />
            <path
                d="M820 360 C 880 330, 980 340, 1020 380 S 1060 470, 980 500 S 840 480, 820 440 S 790 380, 820 360 Z"
                fill="#141c16"
            />
            <path
                v-for="street in minorStreets"
                :key="street"
                :d="street"
                stroke="#1c1f1e"
                stroke-width="2"
                fill="none"
            />
            <path
                :d="avenue"
                stroke="#2c2a25"
                stroke-width="16"
                stroke-linecap="round"
                fill="none"
            />
            <path
                d="M565 -20 C 580 120, 592 200, 600 260 S 640 420, 618 560"
                stroke="#2a2824"
                stroke-width="11"
                stroke-linecap="round"
                fill="none"
            />
        </svg>

        <!-- El fundido va en el contenedor: si Vue cambiara clases en el div de Leaflet,
             borraría `leaflet-container` y las teselas quedarían con ancho 0. -->
        <div
            class="absolute inset-0 transition-opacity duration-700"
            :class="isMapReady ? 'opacity-100' : 'opacity-0'"
        >
            <div
                ref="mapElement"
                role="region"
                aria-label="Mapa con la ubicación de Elim"
                class="size-full"
            />
        </div>

        <!-- Viñeta: centra la mirada en el punto y suaviza los bordes -->
        <div
            aria-hidden="true"
            class="pointer-events-none absolute inset-0 z-[450] bg-[radial-gradient(ellipse_60%_65%_at_50%_50%,rgba(15,18,18,0)_0%,rgba(15,18,18,0.12)_65%,rgba(12,15,15,0.7)_100%)]"
        />

        <div
            class="pointer-events-none absolute inset-x-4 bottom-4 z-[500] flex flex-wrap items-end justify-between gap-3 sm:inset-x-7 sm:bottom-7"
        >
            <div
                class="pointer-events-auto max-w-[360px] rounded-[14px] border border-[rgba(78,70,57,0.8)] bg-[rgba(18,20,20,0.82)] px-[18px] py-4 backdrop-blur-md"
            >
                <span class="block text-[10px] font-bold uppercase tracking-[0.22em] text-primary">
                    Ubicación
                </span>
                <span class="mt-1.5 block text-[15px] leading-normal text-on-surface">
                    {{ landingContact.address }}
                </span>
                <span class="mt-0.5 block text-[13px] text-on-surface-variant">
                    {{ landingContact.serviceSchedule }}
                </span>
            </div>
            <a
                :href="landingContact.mapsUrl"
                target="_blank"
                rel="noopener noreferrer"
                class="landing-btn-gold pointer-events-auto inline-flex h-[46px] items-center gap-2 rounded-full bg-primary px-5 text-xs font-bold uppercase tracking-[0.12em] text-primary-foreground"
            >
                Cómo llegar
                <ArrowUpRight class="size-4" />
            </a>
        </div>
    </div>
</template>
