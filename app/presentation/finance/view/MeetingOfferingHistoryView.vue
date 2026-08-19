<script setup lang="ts">
import {
    ArrowLeft,
    CalendarClock,
    HandCoins,
    MapPin,
    TrendingUp,
    UserCheck,
    UserRound,
    Users,
} from '@lucide/vue'
import RankedBarList from '~/presentation/shared/components/charts/RankedBarList.vue'
import TrendChart from '~/presentation/shared/components/charts/TrendChart.vue'
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
const meeting = computed(() => occurrences.value[0] ?? null)
const meetingTitle = computed(() => meeting.value?.meetingTitle ?? 'Reunión')

useHead({ title: computed(() => `${meetingTitle.value} · Historial · Sistema`) })

/// Serie cronológica: la tendencia se lee de izquierda a derecha.
const series = computed(() =>
    [...recorded.value].sort((left, right) => left.date.localeCompare(right.date)),
)

const stats = computed(() => {
    const total = recorded.value.reduce((sum, item) => sum + (item.totalAmount ?? 0), 0)
    const attendance = recorded.value.reduce((sum, item) => sum + (item.attendance ?? 0), 0)
    const count = recorded.value.length

    // Comparar la mitad reciente contra la anterior dice más que un promedio suelto.
    const half = Math.floor(series.value.length / 2)
    const earlier = series.value.slice(0, half)
    const later = series.value.slice(half)
    const averageOf = (list: typeof series.value) =>
        list.length > 0
            ? list.reduce((sum, item) => sum + (item.totalAmount ?? 0), 0) / list.length
            : 0
    const earlierAverage = averageOf(earlier)
    const laterAverage = averageOf(later)

    return {
        total,
        attendance,
        count,
        pending: occurrences.value.length - count,
        averageOffering: count > 0 ? total / count : 0,
        averageAttendance: count > 0 ? Math.round(attendance / count) : 0,
        trend:
            earlier.length > 0 && earlierAverage > 0
                ? ((laterAverage - earlierAverage) / earlierAverage) * 100
                : null,
    }
})

const offeringSeries = computed(() =>
    series.value.slice(-12).map((item) => ({
        label: item.date.slice(5).replace('-', '/'),
        value: item.totalAmount ?? 0,
    })),
)

const attendanceSeries = computed(() =>
    series.value.slice(-12).map((item) => ({
        label: item.date.slice(5).replace('-', '/'),
        value: item.attendance ?? 0,
    })),
)

/// Reparto acumulado por categoría en toda la historia de la reunión.
const byCategory = computed(() => {
    const map = new Map<number, { label: string; value: number }>()

    for (const occurrence of recorded.value) {
        for (const detail of occurrence.details) {
            const current = map.get(detail.categoryId) ?? {
                label: detail.categoryName ?? 'Sin categoría',
                value: 0,
            }
            current.value += detail.amount
            map.set(detail.categoryId, current)
        }
    }

    return [...map.entries()].map(([id, entry]) => ({ id, ...entry }))
})

/// Quiénes llenan la reunión: acumulado por tipo de asistencia en toda su historia.
const byAttendanceType = computed(() => {
    const map = new Map<number, { label: string; value: number }>()

    for (const occurrence of recorded.value) {
        for (const detail of occurrence.attendanceDetails) {
            const current = map.get(detail.typeId) ?? {
                label: detail.typeName ?? 'Sin tipo',
                value: 0,
            }
            current.value += detail.quantity
            map.set(detail.typeId, current)
        }
    }

    return [...map.entries()].map(([id, entry]) => ({ id, ...entry }))
})

function formatMoney(value: number) {
    return value.toLocaleString('es-SV', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}
</script>

<template>
    <main class="mx-auto w-full max-w-system px-6 pb-24 pt-24 lg:px-10">
        <button
            type="button"
            class="mb-6 inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-on-surface-variant transition-colors hover:text-on-surface"
            @click="navigateTo('/finanzas/ofrendas')"
        >
            <ArrowLeft class="size-4" /> Volver a pendientes
        </button>

        <div
            v-if="historyQuery.isPending.value"
            class="rounded-xl border border-outline-variant bg-surface-container-low px-6 py-16 text-center text-sm text-on-surface-variant"
        >
            Cargando historial…
        </div>

        <div
            v-else-if="occurrences.length === 0"
            class="rounded-xl border border-outline-variant bg-surface-container-low px-6 py-16 text-center"
        >
            <CalendarClock class="mx-auto size-10 text-primary" />
            <h2 class="mt-3 font-display text-2xl font-semibold text-on-surface">Sin historial</h2>
            <p class="mt-2 text-sm text-on-surface-variant">
                Esta reunión todavía no tiene fechas registradas.
            </p>
        </div>

        <template v-else>
            <section class="border-b border-outline-variant pb-8">
                <div class="flex gap-4">
                    <span
                        class="mt-1 h-14 w-1.5 shrink-0 rounded-full"
                        :style="{ backgroundColor: meeting?.meetingColor }"
                    />
                    <div class="min-w-0">
                        <p
                            class="text-xs font-semibold uppercase tracking-[0.4em] text-on-surface-variant"
                        >
                            Finanzas · Historial
                        </p>
                        <h1
                            class="mt-3 font-display text-3xl font-semibold text-on-surface md:text-4xl"
                        >
                            {{ meetingTitle }}
                        </h1>
                        <p
                            v-if="meeting?.meetingCode"
                            class="mt-1.5 font-mono text-xs uppercase tracking-wider text-on-surface-variant"
                        >
                            {{ meeting?.meetingCode }}
                        </p>
                        <div
                            class="mt-3 flex flex-wrap items-center gap-x-5 gap-y-1.5 text-xs text-on-surface-variant"
                        >
                            <span class="inline-flex items-center gap-1.5">
                                <MapPin class="size-3.5" />
                                {{ meeting?.sectorName }} · {{ meeting?.zoneName }}
                            </span>
                            <span
                                v-if="meeting?.leaderName"
                                class="inline-flex items-center gap-1.5"
                            >
                                <UserRound class="size-3.5" />
                                {{ meeting?.leaderName }}
                            </span>
                        </div>
                    </div>
                </div>
            </section>

            <!-- Cifras de cabecera -->
            <section class="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <UiCard class="p-5">
                    <HandCoins class="mb-3 size-5 text-primary" />
                    <p
                        class="text-[11px] font-semibold uppercase tracking-wider text-on-surface-variant"
                    >
                        Total recolectado
                    </p>
                    <p
                        class="mt-1.5 font-display text-3xl font-semibold tabular-nums text-on-surface"
                    >
                        ${{ formatMoney(stats.total) }}
                    </p>
                    <p class="mt-1 text-xs text-on-surface-variant">
                        en {{ stats.count }} {{ stats.count === 1 ? 'fecha' : 'fechas' }}
                    </p>
                </UiCard>
                <UiCard class="p-5">
                    <TrendingUp class="mb-3 size-5 text-primary" />
                    <p
                        class="text-[11px] font-semibold uppercase tracking-wider text-on-surface-variant"
                    >
                        Ofrenda promedio
                    </p>
                    <p
                        class="mt-1.5 font-display text-3xl font-semibold tabular-nums text-on-surface"
                    >
                        ${{ formatMoney(stats.averageOffering) }}
                    </p>
                    <p
                        v-if="stats.trend !== null"
                        class="mt-1 text-xs tabular-nums"
                        :class="stats.trend >= 0 ? 'text-primary' : 'text-destructive'"
                    >
                        {{ stats.trend >= 0 ? '↑' : '↓' }}
                        {{ Math.abs(stats.trend).toFixed(0) }}% vs. el periodo anterior
                    </p>
                    <p v-else class="mt-1 text-xs text-on-surface-variant">por fecha registrada</p>
                </UiCard>
                <UiCard class="p-5">
                    <Users class="mb-3 size-5 text-primary" />
                    <p
                        class="text-[11px] font-semibold uppercase tracking-wider text-on-surface-variant"
                    >
                        Asistencia promedio
                    </p>
                    <p
                        class="mt-1.5 font-display text-3xl font-semibold tabular-nums text-on-surface"
                    >
                        {{ stats.averageAttendance }}
                    </p>
                    <p class="mt-1 text-xs text-on-surface-variant">personas por reunión</p>
                </UiCard>
                <UiCard class="p-5">
                    <CalendarClock
                        class="mb-3 size-5"
                        :class="stats.pending > 0 ? 'text-destructive' : 'text-primary'"
                    />
                    <p
                        class="text-[11px] font-semibold uppercase tracking-wider text-on-surface-variant"
                    >
                        Fechas pendientes
                    </p>
                    <p
                        class="mt-1.5 font-display text-3xl font-semibold tabular-nums"
                        :class="stats.pending > 0 ? 'text-destructive' : 'text-on-surface'"
                    >
                        {{ stats.pending }}
                    </p>
                    <p class="mt-1 text-xs text-on-surface-variant">todavía sin capturar</p>
                </UiCard>
            </section>

            <!-- Dos medidas de escala distinta: dos gráficos, un eje cada uno -->
            <section v-if="series.length > 1" class="mt-6 grid gap-4 xl:grid-cols-2">
                <UiCard class="p-6">
                    <div class="mb-5 flex items-center gap-2">
                        <HandCoins class="size-4 text-primary" />
                        <h2 class="text-sm font-semibold text-on-surface">Ofrenda por fecha</h2>
                    </div>
                    <TrendChart
                        :values="offeringSeries"
                        format="currency"
                        :label="`Ofrenda por fecha de ${meetingTitle}`"
                    />
                </UiCard>
                <UiCard class="p-6">
                    <div class="mb-5 flex items-center gap-2">
                        <Users class="size-4 text-primary" />
                        <h2 class="text-sm font-semibold text-on-surface">Asistencia por fecha</h2>
                    </div>
                    <TrendChart
                        :values="attendanceSeries"
                        color="var(--chart-2)"
                        :label="`Asistencia por fecha de ${meetingTitle}`"
                    />
                </UiCard>
            </section>

            <!-- Con un solo registro no hay tendencia que dibujar: se dice, no se esconde. -->
            <section v-else-if="series.length === 1" class="mt-6">
                <UiCard
                    class="flex items-center gap-3 border-dashed p-6 text-sm text-on-surface-variant"
                >
                    <TrendingUp class="size-5 shrink-0 text-on-surface-variant" />
                    <span>
                        La tendencia aparece cuando esta reunión tenga al menos dos fechas
                        registradas. Por ahora solo hay una.
                    </span>
                </UiCard>
            </section>

            <section
                v-if="byCategory.length > 0 || byAttendanceType.length > 0"
                class="mt-4 grid gap-4 xl:grid-cols-2"
            >
                <UiCard v-if="byCategory.length > 0" class="p-6">
                    <h2 class="mb-5 text-sm font-semibold text-on-surface">
                        Reparto por categoría
                    </h2>
                    <RankedBarList
                        :items="byCategory"
                        label="Ofrenda acumulada por categoría"
                        empty-message="Esta reunión no tiene desglose por categoría."
                    />
                </UiCard>
                <UiCard v-if="byAttendanceType.length > 0" class="p-6">
                    <h2 class="mb-5 text-sm font-semibold text-on-surface">Asistencia por tipo</h2>
                    <RankedBarList
                        :items="byAttendanceType"
                        format="number"
                        label="Asistencia acumulada por tipo"
                        empty-message="Esta reunión no tiene desglose de asistencia."
                    />
                </UiCard>
            </section>

            <!-- Detalle -->
            <section class="mt-8">
                <h2 class="mb-4 font-display text-xl font-semibold text-on-surface">
                    Registro por fecha
                </h2>
                <div class="overflow-x-auto rounded-xl border border-outline-variant">
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
