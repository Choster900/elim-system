<script setup lang="ts">
import { ArrowLeft, CalendarClock, HandCoins, TrendingUp, UserCheck, Users } from '@lucide/vue'
import { formatShortIsoDate } from '~/utils/date/date-format.util'
import { useMeetingHistoryQuery } from '../composables/useOccurrenceQueries'

defineOptions({ name: 'MeetingOfferingHistoryView' })

const route = useRoute()
const meetingId = computed(() => {
    const raw = Number(route.params.id)
    return Number.isSafeInteger(raw) && raw > 0 ? raw : null
})

const historyQuery = useMeetingHistoryQuery(meetingId)

const occurrences = computed(() => historyQuery.data.value ?? [])
const recorded = computed(() => occurrences.value.filter((item) => item.status === 'registrada'))
const meetingTitle = computed(() => occurrences.value[0]?.meetingTitle ?? 'Reunión')

useHead({ title: computed(() => `${meetingTitle.value} · Historial · Sistema`) })

const stats = computed(() => {
    const total = recorded.value.reduce((sum, item) => sum + (item.totalAmount ?? 0), 0)
    const attendance = recorded.value.reduce((sum, item) => sum + (item.attendance ?? 0), 0)
    const count = recorded.value.length

    return {
        total,
        attendance,
        count,
        pending: occurrences.value.length - count,
        averageOffering: count > 0 ? total / count : 0,
        averageAttendance: count > 0 ? Math.round(attendance / count) : 0,
    }
})

/// Serie en orden cronológico para que la tendencia se lea de izquierda a derecha.
const series = computed(() =>
    [...recorded.value].sort((left, right) => left.date.localeCompare(right.date)),
)

const maxAmount = computed(() =>
    series.value.reduce((max, item) => Math.max(max, item.totalAmount ?? 0), 0),
)

function barHeight(amount: number | null) {
    if (maxAmount.value <= 0) return 2
    return Math.max(2, Math.round(((amount ?? 0) / maxAmount.value) * 100))
}

function formatMoney(value: number) {
    return value.toLocaleString('es-SV', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}
</script>

<template>
    <main class="mx-auto w-full max-w-system px-6 pb-20 pt-24 lg:px-10">
        <button
            type="button"
            class="mb-6 inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-on-surface-variant hover:text-on-surface"
            @click="navigateTo('/finanzas/ofrendas')"
        >
            <ArrowLeft class="size-4" /> Volver a pendientes
        </button>

        <section class="border-b border-outline-variant pb-8">
            <p class="text-xs font-semibold uppercase tracking-[0.4em] text-on-surface-variant">
                Finanzas · Historial
            </p>
            <h1 class="mt-4 font-display text-4xl font-semibold text-on-surface">
                {{ meetingTitle }}
            </h1>
            <p
                v-if="occurrences.length > 0"
                class="mt-3 text-sm leading-relaxed text-on-surface-variant"
            >
                {{ occurrences[0]?.sectorName }} · {{ occurrences[0]?.zoneName }}
                <template v-if="occurrences[0]?.leaderName">
                    · Líder: {{ occurrences[0]?.leaderName }}
                </template>
            </p>
        </section>

        <div
            v-if="historyQuery.isPending.value"
            class="mt-10 rounded-lg border border-outline-variant bg-surface-container-low px-6 py-12 text-center text-sm text-on-surface-variant"
        >
            Cargando historial…
        </div>

        <div
            v-else-if="occurrences.length === 0"
            class="mt-10 rounded-lg border border-outline-variant bg-surface-container-low px-6 py-16 text-center"
        >
            <CalendarClock class="mx-auto size-10 text-primary" />
            <h3 class="mt-3 font-display text-2xl font-semibold text-on-surface">Sin historial</h3>
            <p class="mt-2 text-sm text-on-surface-variant">
                Esta reunión todavía no tiene fechas registradas.
            </p>
        </div>

        <template v-else>
            <section class="mt-10 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                <UiCard class="p-6">
                    <HandCoins class="mb-4 size-6 text-primary" />
                    <p
                        class="text-[11px] font-semibold uppercase tracking-wider text-on-surface-variant"
                    >
                        Total recolectado
                    </p>
                    <h3
                        class="mt-1 font-display text-3xl font-semibold tabular-nums text-on-surface"
                    >
                        ${{ formatMoney(stats.total) }}
                    </h3>
                    <p class="mt-2 text-xs text-on-surface-variant">
                        En {{ stats.count }} {{ stats.count === 1 ? 'fecha' : 'fechas' }}
                    </p>
                </UiCard>
                <UiCard class="p-6">
                    <Users class="mb-4 size-6 text-primary" />
                    <p
                        class="text-[11px] font-semibold uppercase tracking-wider text-on-surface-variant"
                    >
                        Asistencia promedio
                    </p>
                    <h3
                        class="mt-1 font-display text-3xl font-semibold tabular-nums text-on-surface"
                    >
                        {{ stats.averageAttendance }}
                    </h3>
                    <p class="mt-2 text-xs text-on-surface-variant">Personas por reunión</p>
                </UiCard>
                <UiCard class="p-6">
                    <TrendingUp class="mb-4 size-6 text-primary" />
                    <p
                        class="text-[11px] font-semibold uppercase tracking-wider text-on-surface-variant"
                    >
                        Ofrenda promedio
                    </p>
                    <h3
                        class="mt-1 font-display text-3xl font-semibold tabular-nums text-on-surface"
                    >
                        ${{ formatMoney(stats.averageOffering) }}
                    </h3>
                    <p class="mt-2 text-xs text-on-surface-variant">Por fecha registrada</p>
                </UiCard>
                <UiCard class="p-6">
                    <CalendarClock
                        class="mb-4 size-6"
                        :class="stats.pending > 0 ? 'text-destructive' : 'text-primary'"
                    />
                    <p
                        class="text-[11px] font-semibold uppercase tracking-wider text-on-surface-variant"
                    >
                        Fechas pendientes
                    </p>
                    <h3
                        class="mt-1 font-display text-3xl font-semibold tabular-nums"
                        :class="stats.pending > 0 ? 'text-destructive' : 'text-on-surface'"
                    >
                        {{ stats.pending }}
                    </h3>
                    <p class="mt-2 text-xs text-on-surface-variant">Todavía sin capturar</p>
                </UiCard>
            </section>

            <section v-if="series.length > 1" class="mt-10">
                <h2 class="mb-4 font-display text-xl font-semibold text-on-surface">
                    Ofrenda por fecha
                </h2>
                <div
                    class="flex h-40 items-end gap-1.5 overflow-x-auto rounded-lg border border-outline-variant bg-surface-container-low px-4 py-4"
                >
                    <div
                        v-for="item in series"
                        :key="item.id"
                        class="flex min-w-[36px] flex-1 flex-col items-center gap-1.5"
                        :title="`${formatShortIsoDate(item.date)} · $${formatMoney(item.totalAmount ?? 0)}`"
                    >
                        <span
                            class="w-full rounded-t bg-primary/70 transition-all"
                            :style="{ height: `${barHeight(item.totalAmount)}%` }"
                        />
                        <span
                            class="whitespace-nowrap text-[9px] tabular-nums text-on-surface-variant"
                        >
                            {{ item.date.slice(5) }}
                        </span>
                    </div>
                </div>
            </section>

            <section class="mt-10">
                <h2 class="mb-4 font-display text-xl font-semibold text-on-surface">
                    Registro por fecha
                </h2>
                <div class="overflow-x-auto rounded-lg border border-outline-variant">
                    <table class="w-full min-w-[680px] border-collapse text-sm">
                        <thead>
                            <tr class="bg-surface-container-high text-on-surface-variant">
                                <th
                                    class="px-4 py-3 text-left text-[10px] font-semibold uppercase tracking-wider"
                                >
                                    Fecha
                                </th>
                                <th
                                    class="px-4 py-3 text-left text-[10px] font-semibold uppercase tracking-wider"
                                >
                                    Estado
                                </th>
                                <th
                                    class="px-4 py-3 text-right text-[10px] font-semibold uppercase tracking-wider"
                                >
                                    Asistencia
                                </th>
                                <th
                                    class="px-4 py-3 text-right text-[10px] font-semibold uppercase tracking-wider"
                                >
                                    Ofrenda
                                </th>
                                <th
                                    class="px-4 py-3 text-left text-[10px] font-semibold uppercase tracking-wider"
                                >
                                    Registró
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr
                                v-for="item in occurrences"
                                :key="item.id"
                                class="border-t border-outline-variant"
                            >
                                <td
                                    class="whitespace-nowrap px-4 py-3 tabular-nums text-on-surface"
                                >
                                    {{ formatShortIsoDate(item.date) }}
                                </td>
                                <td class="px-4 py-3">
                                    <span
                                        class="inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[11px] font-semibold"
                                        :class="
                                            item.status === 'registrada'
                                                ? 'bg-primary/15 text-primary'
                                                : 'bg-destructive/15 text-destructive'
                                        "
                                    >
                                        {{
                                            item.status === 'registrada'
                                                ? 'Registrada'
                                                : 'Pendiente'
                                        }}
                                    </span>
                                </td>
                                <td
                                    class="px-4 py-3 text-right tabular-nums text-on-surface-variant"
                                >
                                    {{ item.attendance ?? '—' }}
                                </td>
                                <td
                                    class="px-4 py-3 text-right font-semibold tabular-nums text-on-surface"
                                >
                                    {{
                                        item.totalAmount === null
                                            ? '—'
                                            : `$${formatMoney(item.totalAmount)}`
                                    }}
                                </td>
                                <td class="px-4 py-3 text-on-surface-variant">
                                    <span
                                        v-if="item.recordedByName"
                                        class="inline-flex items-center gap-1.5"
                                    >
                                        <UserCheck class="size-3.5 text-primary" />
                                        {{ item.recordedByName }}
                                        <span
                                            v-if="item.updatedByName"
                                            class="text-[11px] text-on-surface-variant/70"
                                        >
                                            (corregido por {{ item.updatedByName }})
                                        </span>
                                    </span>
                                    <span v-else>—</span>
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </section>
        </template>
    </main>
</template>
