<script setup lang="ts">
import {
    CalendarClock,
    Globe2,
    MapPin,
    MapPinned,
    MessageSquareText,
    Navigation,
    Users,
    UserRound,
    X,
} from '@lucide/vue'
import {
    DialogContent,
    DialogDescription,
    DialogOverlay,
    DialogPortal,
    DialogRoot,
    DialogTitle,
} from 'radix-vue'
import type { MeetingRecord } from '../interfaces/meeting.interface'
import {
    formatMeetingPreviewDate,
    formatMeetingRecurrence,
    getMeetingFrequencyLabel,
} from '../utils/meeting-format.util'

defineOptions({ name: 'MeetingDetailDrawer' })

const props = defineProps<{
    open: boolean
    meeting: MeetingRecord | null
    loading?: boolean
    error?: string
}>()

const emit = defineEmits<{ (event: 'close'): void }>()

const mapEl = ref<HTMLElement | null>(null)
let map: import('leaflet').Map | null = null
let L: typeof import('leaflet') | null = null

const hasCoordinates = computed(
    () =>
        typeof props.meeting?.latitude === 'number' && typeof props.meeting?.longitude === 'number',
)
const directionsUrl = computed(() => {
    if (!hasCoordinates.value || !props.meeting) return null
    return `https://www.google.com/maps/dir/?api=1&destination=${props.meeting.latitude},${props.meeting.longitude}`
})

function statusLabel(meeting: MeetingRecord) {
    return meeting.isActive ? 'Activa' : 'Inactiva'
}

function destroyMap() {
    map?.remove()
    map = null
}

async function initializeMap() {
    if (!import.meta.client || !hasCoordinates.value || !props.meeting) return

    await nextTick()
    const container = mapEl.value
    if (!container || !props.meeting || !hasCoordinates.value) return

    if (!L) {
        const leafletModule = await import('leaflet')
        L = leafletModule.default ?? leafletModule
    }

    destroyMap()
    const coordinates: [number, number] = [props.meeting.latitude!, props.meeting.longitude!]
    map = L.map(container, { zoomControl: true, attributionControl: false, scrollWheelZoom: false })
    map.zoomControl.setPosition('topright')
    L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
        subdomains: 'abcd',
        maxZoom: 20,
    }).addTo(map)
    L.marker(coordinates).addTo(map)
    map.setView(coordinates, 15)
}

watch(
    () => [props.open, props.meeting?.id, props.meeting?.latitude, props.meeting?.longitude],
    ([open]) => {
        if (open && hasCoordinates.value) void initializeMap()
        else destroyMap()
    },
)

onBeforeUnmount(destroyMap)
</script>

<template>
    <DialogRoot :open="open" @update:open="(value) => !value && emit('close')">
        <DialogPortal>
            <DialogOverlay class="fixed inset-0 z-[70] bg-black/55 backdrop-blur-sm" />
            <DialogContent
                class="fixed inset-y-0 right-0 z-[71] flex w-full flex-col border-l border-outline-variant bg-surface shadow-2xl outline-none md:w-1/2"
            >
                <div
                    class="flex items-start justify-between gap-4 border-b border-outline-variant p-5"
                >
                    <div class="min-w-0">
                        <p
                            class="text-[11px] font-semibold uppercase tracking-[0.24em] text-primary"
                        >
                            Detalle de reunión
                        </p>
                        <DialogTitle
                            class="mt-1 truncate font-display text-xl font-semibold text-on-surface"
                        >
                            {{ meeting?.title ?? 'Cargando reunión' }}
                        </DialogTitle>
                        <DialogDescription class="mt-1 font-mono text-xs text-on-surface-variant">
                            {{ meeting?.code ?? 'Información de programación y responsables' }}
                        </DialogDescription>
                    </div>
                    <button
                        type="button"
                        class="flex size-9 shrink-0 items-center justify-center rounded-full border border-outline-variant text-on-surface-variant transition-colors hover:border-primary hover:text-primary"
                        aria-label="Cerrar detalle"
                        @click="emit('close')"
                    >
                        <X class="size-4" />
                    </button>
                </div>

                <div class="min-h-0 flex-1 overflow-y-auto p-5">
                    <div v-if="loading" class="py-16 text-center text-sm text-on-surface-variant">
                        Cargando detalle de la reunión…
                    </div>
                    <div
                        v-else-if="error"
                        class="rounded-xl border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive"
                    >
                        {{ error }}
                    </div>
                    <template v-else-if="meeting">
                        <section
                            class="rounded-xl border border-outline-variant bg-surface-container-low p-4"
                        >
                            <div class="flex items-center justify-between gap-3">
                                <span
                                    class="rounded border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider"
                                    :style="{
                                        color: meeting.typeColor ?? meeting.color,
                                        borderColor: `${meeting.typeColor ?? meeting.color}66`,
                                    }"
                                >
                                    {{ meeting.typeName ?? 'Sin tipo' }}
                                </span>
                                <span
                                    class="rounded border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider"
                                    :class="
                                        meeting.isActive
                                            ? 'border-success/35 bg-success/10 text-success'
                                            : 'border-outline-variant text-on-surface-variant'
                                    "
                                >
                                    {{ statusLabel(meeting) }}
                                </span>
                            </div>
                            <p
                                v-if="meeting.description"
                                class="mt-3 text-sm leading-6 text-on-surface-variant"
                            >
                                {{ meeting.description }}
                            </p>
                        </section>

                        <section class="mt-5">
                            <h3
                                class="text-[11px] font-semibold uppercase tracking-wider text-on-surface-variant"
                            >
                                Programación
                            </h3>
                            <div class="mt-3 rounded-xl border border-outline-variant p-4">
                                <div class="flex gap-3">
                                    <CalendarClock class="mt-0.5 size-4 shrink-0 text-primary" />
                                    <div>
                                        <p class="text-sm font-semibold text-on-surface">
                                            {{ formatMeetingPreviewDate(meeting.date) }}
                                        </p>
                                        <p class="mt-1 text-xs leading-5 text-on-surface-variant">
                                            {{
                                                formatMeetingRecurrence(
                                                    meeting.date,
                                                    meeting.startTime,
                                                    meeting.endTime,
                                                    meeting.frequency,
                                                    meeting.recurrenceEndDate,
                                                )
                                            }}
                                        </p>
                                        <p class="mt-2 text-xs font-medium text-primary">
                                            {{ getMeetingFrequencyLabel(meeting.frequency) }}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </section>

                        <section class="mt-5">
                            <h3
                                class="text-[11px] font-semibold uppercase tracking-wider text-on-surface-variant"
                            >
                                Ubicación y territorio
                            </h3>
                            <div
                                class="mt-3 space-y-3 rounded-xl border border-outline-variant p-4 text-sm"
                            >
                                <div class="flex gap-3">
                                    <MapPin class="mt-0.5 size-4 shrink-0 text-primary" />
                                    <div>
                                        <p class="font-medium text-on-surface">
                                            {{ meeting.location || 'Ubicación sin especificar' }}
                                        </p>
                                        <p class="mt-1 text-xs text-on-surface-variant">
                                            {{ meeting.sectorName }} · {{ meeting.zoneName }} ·
                                            {{ meeting.districtName }}
                                        </p>
                                    </div>
                                </div>
                                <p
                                    v-if="meeting.latitude !== null && meeting.longitude !== null"
                                    class="border-t border-outline-variant pt-3 font-mono text-xs text-on-surface-variant"
                                >
                                    {{ meeting.latitude.toFixed(5) }},
                                    {{ meeting.longitude.toFixed(5) }}
                                </p>
                            </div>
                            <div
                                v-if="hasCoordinates"
                                class="mt-3 overflow-hidden rounded-xl border border-outline-variant"
                            >
                                <div
                                    ref="mapEl"
                                    class="meeting-detail-map h-64 w-full bg-surface-container"
                                />
                                <div
                                    class="flex flex-wrap items-center justify-between gap-3 border-t border-outline-variant bg-surface-container-low px-3 py-2.5"
                                >
                                    <span
                                        class="inline-flex items-center gap-1.5 text-xs text-on-surface-variant"
                                    >
                                        <MapPinned class="size-3.5 text-primary" /> Ubicación de la
                                        reunión
                                    </span>
                                    <a
                                        v-if="directionsUrl"
                                        :href="directionsUrl"
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        class="inline-flex items-center gap-1.5 rounded border border-primary/40 px-3 py-1.5 text-xs font-semibold text-primary transition-colors hover:bg-primary/10"
                                    >
                                        <Navigation class="size-3.5" /> Cómo llegar
                                    </a>
                                </div>
                            </div>
                        </section>

                        <section class="mt-5">
                            <h3
                                class="text-[11px] font-semibold uppercase tracking-wider text-on-surface-variant"
                            >
                                Responsables
                            </h3>
                            <div class="mt-3 grid gap-3 sm:grid-cols-2">
                                <div class="rounded-xl border border-outline-variant p-4">
                                    <UserRound class="size-4 text-primary" />
                                    <p
                                        class="mt-2 text-[10px] font-semibold uppercase tracking-wider text-on-surface-variant"
                                    >
                                        Líder
                                    </p>
                                    <p class="mt-1 text-sm font-medium text-on-surface">
                                        {{ meeting.leaderName ?? 'Sin líder asignado' }}
                                    </p>
                                </div>
                                <div class="rounded-xl border border-outline-variant p-4">
                                    <Users class="size-4 text-primary" />
                                    <p
                                        class="mt-2 text-[10px] font-semibold uppercase tracking-wider text-on-surface-variant"
                                    >
                                        Supervisor
                                    </p>
                                    <p class="mt-1 text-sm font-medium text-on-surface">
                                        {{ meeting.supervisorName ?? 'Sin supervisor asignado' }}
                                    </p>
                                </div>
                            </div>
                        </section>

                        <section class="mt-5 grid gap-3 sm:grid-cols-2">
                            <div class="rounded-xl border border-outline-variant p-4">
                                <Users class="size-4 text-primary" />
                                <p
                                    class="mt-2 text-[10px] font-semibold uppercase tracking-wider text-on-surface-variant"
                                >
                                    Asistencia esperada
                                </p>
                                <p class="mt-1 text-sm font-medium text-on-surface">
                                    {{ meeting.expectedAttendees || 'Sin estimación' }}
                                </p>
                            </div>
                            <div class="rounded-xl border border-outline-variant p-4">
                                <Globe2 class="size-4 text-primary" />
                                <p
                                    class="mt-2 text-[10px] font-semibold uppercase tracking-wider text-on-surface-variant"
                                >
                                    Visibilidad
                                </p>
                                <p class="mt-1 text-sm font-medium text-on-surface">
                                    {{ meeting.isPublic ? 'Pública' : 'Interna' }}
                                </p>
                            </div>
                        </section>

                        <section v-if="meeting.notes" class="mt-5">
                            <h3
                                class="text-[11px] font-semibold uppercase tracking-wider text-on-surface-variant"
                            >
                                Notas
                            </h3>
                            <div
                                class="mt-3 flex gap-3 rounded-xl border border-outline-variant p-4"
                            >
                                <MessageSquareText class="mt-0.5 size-4 shrink-0 text-primary" />
                                <p class="text-sm leading-6 text-on-surface-variant">
                                    {{ meeting.notes }}
                                </p>
                            </div>
                        </section>
                    </template>
                </div>
            </DialogContent>
        </DialogPortal>
    </DialogRoot>
</template>

<style scoped>
.meeting-detail-map {
    position: relative;
    z-index: 0;
    isolation: isolate;
}

.meeting-detail-map :deep(.leaflet-control-zoom) {
    margin: 10px;
    border: 1px solid var(--outline-variant);
    border-radius: 10px;
    overflow: hidden;
    box-shadow: 0 4px 12px rgb(0 0 0 / 25%);
}

.meeting-detail-map :deep(.leaflet-control-zoom a) {
    width: 30px;
    height: 30px;
    line-height: 30px;
    background: var(--surface-container);
    color: var(--on-surface);
    border-bottom-color: var(--outline-variant);
}
</style>
