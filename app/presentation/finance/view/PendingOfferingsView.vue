<script setup lang="ts">
import {
    AlertTriangle,
    CalendarClock,
    CheckCircle2,
    ChevronDown,
    ClipboardList,
    History,
} from '@lucide/vue'
import { useAuthStore } from '~/presentation/auth/stores/auth.store'
import { routePermissionCodes } from '~/presentation/auth/constants/permission.constants'
import { formatShortIsoDate } from '~/utils/date/date-format.util'
import { usePendingOccurrencesQuery } from '../composables/useOccurrenceQueries'
import type { OccurrenceRecord, PendingGroup } from '../interfaces/occurrence.interface'

defineOptions({ name: 'PendingOfferingsView' })

/// La vista del líder es la misma bandeja sin los filtros de sector.
const props = withDefaults(defineProps<{ personalScope?: boolean }>(), { personalScope: false })

useHead({
    title: computed(() =>
        props.personalScope ? 'Mis reuniones · Sistema' : 'Pendientes de ofrenda · Sistema',
    ),
})

const authStore = useAuthStore()
const pendingQuery = usePendingOccurrencesQuery()

const canRecord = computed(() => authStore.hasPermission(routePermissionCodes.financeRecord))

const selectedZone = ref<string>('')
const selectedSector = ref<string>('')

const MS_PER_DAY = 86_400_000

function daysSince(isoDate: string) {
    const then = new Date(`${isoDate}T00:00:00Z`).getTime()
    const now = new Date()
    const today = Date.UTC(now.getFullYear(), now.getMonth(), now.getDate())
    return Math.max(0, Math.round((today - then) / MS_PER_DAY))
}

const occurrences = computed(() => pendingQuery.data.value ?? [])

const zoneOptions = computed(() =>
    [...new Set(occurrences.value.map((item) => item.zoneName))].sort((a, b) =>
        a.localeCompare(b, 'es'),
    ),
)

const sectorOptions = computed(() =>
    [
        ...new Set(
            occurrences.value
                .filter((item) => !selectedZone.value || item.zoneName === selectedZone.value)
                .map((item) => item.sectorName),
        ),
    ].sort((a, b) => a.localeCompare(b, 'es')),
)

const filtered = computed(() =>
    occurrences.value.filter(
        (item) =>
            (!selectedZone.value || item.zoneName === selectedZone.value) &&
            (!selectedSector.value || item.sectorName === selectedSector.value),
    ),
)

/// Agrupadas por reunión y ordenadas por antigüedad: lo más atrasado primero.
const groups = computed<PendingGroup[]>(() => {
    const byMeeting = new Map<number, OccurrenceRecord[]>()

    for (const occurrence of filtered.value) {
        const list = byMeeting.get(occurrence.meetingId) ?? []
        list.push(occurrence)
        byMeeting.set(occurrence.meetingId, list)
    }

    return [...byMeeting.values()]
        .map((list) => {
            const sorted = [...list].sort((left, right) => left.date.localeCompare(right.date))
            const first = sorted[0]!

            return {
                meetingId: first.meetingId,
                meetingTitle: first.meetingTitle,
                meetingCode: first.meetingCode,
                meetingColor: first.meetingColor,
                meetingTypeName: first.meetingTypeName,
                sectorName: first.sectorName,
                zoneName: first.zoneName,
                districtName: first.districtName,
                leaderName: first.leaderName,
                startTime: first.startTime,
                occurrences: sorted,
                oldestDate: first.date,
                daysBehind: daysSince(first.date),
            }
        })
        .sort((left, right) => right.daysBehind - left.daysBehind)
})

const stats = computed(() => ({
    total: filtered.value.length,
    meetings: groups.value.length,
    oldest: groups.value.length > 0 ? groups.value[0]!.daysBehind : 0,
}))

/// El tono comunica el atraso antes que el número.
function toneFor(daysBehind: number) {
    if (daysBehind >= 30) return 'text-destructive'
    if (daysBehind >= 14) return 'text-primary'
    return 'text-on-surface-variant'
}

function behindLabel(daysBehind: number) {
    if (daysBehind === 0) return 'hoy'
    if (daysBehind === 1) return 'hace 1 día'
    return `hace ${daysBehind} días`
}

function openCapture(group: PendingGroup) {
    return navigateTo(`/finanzas/ofrendas/registrar/${group.meetingId}`)
}

watch(selectedZone, () => {
    selectedSector.value = ''
})

const selectClass =
    'rounded border border-outline-variant bg-surface px-3 py-2 text-sm text-on-surface outline-none focus:border-primary'
</script>

<template>
    <main class="mx-auto w-full max-w-system px-6 pb-20 pt-24 lg:px-10">
        <section
            class="flex flex-col gap-6 border-b border-outline-variant pb-10 md:flex-row md:items-end md:justify-between"
        >
            <div>
                <p class="text-xs font-semibold uppercase tracking-[0.4em] text-on-surface-variant">
                    Finanzas · Ofrendas
                </p>
                <h1 class="mt-4 font-display text-4xl font-semibold text-on-surface md:text-5xl">
                    {{ personalScope ? 'Mis reuniones' : 'Pendientes de registro' }}
                </h1>
                <p class="mt-3 max-w-xl text-sm leading-relaxed text-on-surface-variant">
                    {{
                        personalScope
                            ? 'Las fechas de tus reuniones que todavía no tienen asistencia ni ofrenda registradas.'
                            : 'Cada fecha en que una reunión se realizó y nadie capturó los datos. Registra las que tengas; el resto sigue esperando.'
                    }}
                </p>
            </div>

            <div v-if="!personalScope" class="flex flex-wrap gap-2">
                <UiButton
                    variant="outline"
                    type="button"
                    class="h-11 rounded px-5 text-xs uppercase tracking-wider"
                    @click="navigateTo('/finanzas/ofrendas/historial')"
                >
                    <History class="mr-2 size-4" /> Historial
                </UiButton>
            </div>
        </section>

        <section class="mt-10 grid gap-4 md:grid-cols-3">
            <UiCard class="p-6">
                <CalendarClock class="mb-4 size-6 text-primary" />
                <p
                    class="text-[11px] font-semibold uppercase tracking-wider text-on-surface-variant"
                >
                    Fechas pendientes
                </p>
                <h3 class="mt-1 font-display text-3xl font-semibold tabular-nums text-on-surface">
                    {{ stats.total }}
                </h3>
                <p class="mt-2 text-xs text-on-surface-variant">Sin asistencia ni ofrenda</p>
            </UiCard>
            <UiCard class="p-6">
                <ClipboardList class="mb-4 size-6 text-primary" />
                <p
                    class="text-[11px] font-semibold uppercase tracking-wider text-on-surface-variant"
                >
                    Reuniones afectadas
                </p>
                <h3 class="mt-1 font-display text-3xl font-semibold tabular-nums text-on-surface">
                    {{ stats.meetings }}
                </h3>
                <p class="mt-2 text-xs text-on-surface-variant">Con al menos una fecha abierta</p>
            </UiCard>
            <UiCard class="p-6">
                <AlertTriangle class="mb-4 size-6" :class="toneFor(stats.oldest)" />
                <p
                    class="text-[11px] font-semibold uppercase tracking-wider text-on-surface-variant"
                >
                    Atraso máximo
                </p>
                <h3
                    class="mt-1 font-display text-3xl font-semibold tabular-nums"
                    :class="stats.oldest >= 30 ? 'text-destructive' : 'text-on-surface'"
                >
                    {{ stats.oldest }}<span class="ml-1 text-base font-normal">días</span>
                </h3>
                <p class="mt-2 text-xs text-on-surface-variant">
                    La fecha más antigua sin registrar
                </p>
            </UiCard>
        </section>

        <section
            v-if="!personalScope && zoneOptions.length > 1"
            class="mt-8 flex flex-wrap items-end gap-3"
        >
            <div>
                <label
                    class="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-on-surface-variant"
                    for="filtro-zona"
                >
                    Zona
                </label>
                <select id="filtro-zona" v-model="selectedZone" :class="selectClass">
                    <option value="">Todas</option>
                    <option v-for="zone in zoneOptions" :key="zone" :value="zone">
                        {{ zone }}
                    </option>
                </select>
            </div>
            <div>
                <label
                    class="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-on-surface-variant"
                    for="filtro-sector"
                >
                    Sector
                </label>
                <select id="filtro-sector" v-model="selectedSector" :class="selectClass">
                    <option value="">Todos</option>
                    <option v-for="sector in sectorOptions" :key="sector" :value="sector">
                        {{ sector }}
                    </option>
                </select>
            </div>
        </section>

        <section class="mt-8">
            <div
                v-if="pendingQuery.isPending.value"
                class="rounded-lg border border-outline-variant bg-surface-container-low px-6 py-12 text-center text-sm text-on-surface-variant"
            >
                Buscando fechas pendientes…
            </div>

            <div
                v-else-if="pendingQuery.error.value"
                class="rounded-lg border border-destructive/40 bg-destructive/10 px-6 py-8 text-center text-sm text-destructive"
            >
                No fue posible cargar los pendientes.
            </div>

            <div
                v-else-if="groups.length === 0"
                class="flex flex-col items-center gap-3 rounded-lg border border-outline-variant bg-surface-container-low px-6 py-16 text-center"
            >
                <CheckCircle2 class="size-10 text-primary" />
                <h3 class="font-display text-2xl font-semibold text-on-surface">Todo al día</h3>
                <p class="max-w-md text-sm text-on-surface-variant">
                    {{
                        personalScope
                            ? 'No tienes fechas pendientes de registrar.'
                            : 'Todas las reuniones que ya ocurrieron tienen su asistencia y ofrenda registradas.'
                    }}
                </p>
            </div>

            <div v-else class="flex flex-col gap-3">
                <article
                    v-for="group in groups"
                    :key="group.meetingId"
                    class="overflow-hidden rounded-lg border border-outline-variant bg-surface-container-low"
                >
                    <div class="flex flex-col gap-4 px-5 py-4 sm:flex-row sm:items-center">
                        <span
                            class="hidden h-12 w-1 shrink-0 rounded-full sm:block"
                            :style="{ backgroundColor: group.meetingColor }"
                        />
                        <div class="min-w-0 flex-1">
                            <p
                                class="truncate font-mono text-[10px] uppercase tracking-wider text-on-surface-variant/70"
                            >
                                {{ group.meetingCode }}
                            </p>
                            <h3 class="truncate text-base font-semibold text-on-surface">
                                {{ group.meetingTitle }}
                            </h3>
                            <p class="mt-0.5 truncate text-xs text-on-surface-variant">
                                {{ group.sectorName }} · {{ group.zoneName }}
                                <template v-if="group.leaderName">
                                    · Líder: {{ group.leaderName }}
                                </template>
                            </p>
                        </div>

                        <div class="flex items-center gap-5 sm:justify-end">
                            <div class="text-right">
                                <p
                                    class="font-display text-2xl font-semibold tabular-nums text-on-surface"
                                >
                                    {{ group.occurrences.length }}
                                </p>
                                <p
                                    class="text-[10px] font-semibold uppercase tracking-wider text-on-surface-variant"
                                >
                                    {{ group.occurrences.length === 1 ? 'fecha' : 'fechas' }}
                                </p>
                            </div>
                            <div class="text-right">
                                <p
                                    class="text-sm font-semibold tabular-nums"
                                    :class="toneFor(group.daysBehind)"
                                >
                                    {{ behindLabel(group.daysBehind) }}
                                </p>
                                <p
                                    class="text-[10px] font-semibold uppercase tracking-wider text-on-surface-variant"
                                >
                                    la más antigua
                                </p>
                            </div>
                            <UiButton
                                v-if="canRecord"
                                type="button"
                                class="h-10 rounded px-4 text-xs uppercase tracking-wider"
                                @click="openCapture(group)"
                            >
                                Registrar
                            </UiButton>
                        </div>
                    </div>

                    <div
                        class="flex flex-wrap items-center gap-2 border-t border-outline-variant bg-surface px-5 py-3"
                    >
                        <ChevronDown class="size-3.5 shrink-0 text-on-surface-variant" />
                        <span
                            v-for="occurrence in group.occurrences"
                            :key="occurrence.id"
                            class="rounded bg-surface-container-high px-2 py-0.5 text-[11px] font-medium tabular-nums text-on-surface-variant"
                        >
                            {{ formatShortIsoDate(occurrence.date) }}
                        </span>
                        <button
                            type="button"
                            class="ml-auto text-[11px] font-semibold uppercase tracking-wider text-primary hover:underline"
                            @click="navigateTo(`/finanzas/ofrendas/reunion/${group.meetingId}`)"
                        >
                            Ver historial
                        </button>
                    </div>
                </article>
            </div>
        </section>
    </main>
</template>
