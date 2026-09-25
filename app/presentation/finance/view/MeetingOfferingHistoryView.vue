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
import {
    DialogClose,
    DialogContent,
    DialogDescription,
    DialogOverlay,
    DialogPortal,
    DialogRoot,
    DialogTitle,
} from 'radix-vue'
import RankedBarList from '~/presentation/shared/components/charts/RankedBarList.vue'
import TrendChart from '~/presentation/shared/components/charts/TrendChart.vue'
import type { DatePickerRange } from '~/components/ui/DatePicker.vue'
import { formatShortIsoDate } from '~/utils/date/date-format.util'
import { useMeetingHistoryQuery } from '../composables/useOccurrenceQueries'
import type { OccurrenceRecord } from '../interfaces/occurrence.interface'
import { useAuthStore } from '~/presentation/auth/stores/auth.store'
import { routePermissionCodes } from '~/presentation/auth/constants/permission.constants'

defineOptions({ name: 'MeetingOfferingHistoryView' })

const route = useRoute()
const authStore = useAuthStore()
const meetingId = computed(() => {
    const raw = Number(route.params.id)
    return Number.isSafeInteger(raw) && raw > 0 ? raw : null
})

const historyQuery = useMeetingHistoryQuery(meetingId)

const occurrences = computed(() => historyQuery.data.value ?? [])
type PeriodPreset = 'month' | 'quarter' | 'year' | 'custom'

const periodPreset = ref<PeriodPreset>('quarter')
const customRange = ref<DatePickerRange>({ start: null, end: null })
const periodOptions: { value: PeriodPreset; label: string }[] = [
    { value: 'month', label: 'Mes actual' },
    { value: 'quarter', label: 'Trimestre actual' },
    { value: 'year', label: 'Año actual' },
    { value: 'custom', label: 'Personalizado' },
]

function currentBusinessDate() {
    const parts = Object.fromEntries(
        new Intl.DateTimeFormat('en-CA', {
            timeZone: 'America/El_Salvador',
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
        })
            .formatToParts(new Date())
            .filter((part) => part.type !== 'literal')
            .map((part) => [part.type, part.value]),
    )
    return {
        year: Number(parts.year),
        month: Number(parts.month),
        date: `${parts.year}-${parts.month}-${parts.day}`,
    }
}

const activeRange = computed(() => {
    if (periodPreset.value === 'custom') {
        return { from: customRange.value.start, to: customRange.value.end }
    }

    const today = currentBusinessDate()
    if (periodPreset.value === 'month') {
        return { from: `${today.year}-${String(today.month).padStart(2, '0')}-01`, to: today.date }
    }
    if (periodPreset.value === 'year') return { from: `${today.year}-01-01`, to: today.date }

    const quarterMonth = Math.floor((today.month - 1) / 3) * 3 + 1
    return { from: `${today.year}-${String(quarterMonth).padStart(2, '0')}-01`, to: today.date }
})

const visibleOccurrences = computed(() =>
    occurrences.value.filter(
        (item) =>
            (!activeRange.value.from || item.date >= activeRange.value.from) &&
            (!activeRange.value.to || item.date <= activeRange.value.to),
    ),
)
const recorded = computed(() =>
    visibleOccurrences.value.filter((item) => item.status === 'registrada'),
)
const meeting = computed(() => occurrences.value[0] ?? null)
const meetingTitle = computed(() => meeting.value?.meetingTitle ?? 'Reunión')
const selectedOccurrence = ref<OccurrenceRecord | null>(null)
const occurrenceDetailOpen = computed({
    get: () => selectedOccurrence.value !== null,
    set: (open: boolean) => {
        if (!open) selectedOccurrence.value = null
    },
})

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
        pending: visibleOccurrences.value.length - count,
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

function formatRecordedAt(value: string | null) {
    if (!value) return null

    const date = new Date(value)
    if (Number.isNaN(date.getTime())) return null

    return date.toLocaleString('es-SV', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    })
}

function userAccountLabel(item: (typeof occurrences.value)[number], type: 'recorded' | 'updated') {
    const username = type === 'recorded' ? item.recordedByUsername : item.updatedByUsername
    const email = type === 'recorded' ? item.recordedByEmail : item.updatedByEmail
    return username ? `@${username}` : email
}

function openOccurrenceDetail(occurrence: OccurrenceRecord) {
    selectedOccurrence.value = occurrence
}

function recordOccurrence(occurrence: OccurrenceRecord) {
    if (occurrence.isRecordable === false) return
    return navigateTo({
        path: `/finanzas/ofrendas/registrar/${occurrence.meetingId}`,
        query: { occurrence: String(occurrence.id) },
    })
}

function isOccurrenceRecordable(occurrence: OccurrenceRecord) {
    return occurrence.isRecordable !== false
}

function availableAfter(occurrence: OccurrenceRecord) {
    return `Disponible después de las ${occurrence.endTime}`
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

            <section
                class="mt-6 rounded-xl border border-outline-variant bg-surface-container-low p-4"
            >
                <div class="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                    <div>
                        <p
                            class="text-[11px] font-semibold uppercase tracking-wider text-on-surface-variant"
                        >
                            Período del historial
                        </p>
                        <p class="mt-1 text-sm text-on-surface-variant">
                            Filtra los indicadores, gráficos y registros de esta reunión.
                        </p>
                    </div>
                    <div class="flex flex-wrap items-center gap-2">
                        <button
                            v-for="option in periodOptions"
                            :key="option.value"
                            type="button"
                            class="rounded-lg border px-3 py-2 text-xs font-semibold transition-colors"
                            :class="
                                periodPreset === option.value
                                    ? 'border-primary bg-primary/10 text-primary'
                                    : 'border-outline-variant text-on-surface-variant hover:border-primary/50 hover:text-on-surface'
                            "
                            @click="periodPreset = option.value"
                        >
                            {{ option.label }}
                        </button>
                    </div>
                </div>
                <div v-if="periodPreset === 'custom'" class="mt-4 max-w-sm">
                    <label
                        class="mb-1.5 block text-[10px] font-semibold uppercase tracking-wider text-on-surface-variant"
                    >
                        Rango personalizado
                    </label>
                    <UiDatePicker
                        v-model="customRange"
                        mode="range"
                        placeholder="Selecciona un rango"
                    />
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
                <div class="mb-4 flex flex-wrap items-end justify-between gap-2">
                    <div>
                        <h2 class="font-display text-xl font-semibold text-on-surface">
                            Registro por fecha
                        </h2>
                        <p class="mt-1 text-xs text-on-surface-variant">
                            {{ visibleOccurrences.length }}
                            {{
                                visibleOccurrences.length === 1
                                    ? 'fecha en el período'
                                    : 'fechas en el período'
                            }}
                        </p>
                    </div>
                </div>
                <div class="overflow-x-auto rounded-xl border border-outline-variant">
                    <table class="w-full min-w-[840px] border-collapse text-sm">
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
                                <th class="w-28 px-4 py-3">
                                    <span class="sr-only">Ver detalle de la fecha</span>
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr
                                v-for="item in visibleOccurrences"
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
                                    <div
                                        v-if="item.recordedByName"
                                        class="flex min-w-[210px] items-start gap-2.5"
                                    >
                                        <span
                                            class="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary"
                                        >
                                            <UserCheck class="size-3.5" />
                                        </span>
                                        <span class="min-w-0">
                                            <span class="block font-medium text-on-surface">
                                                {{ item.recordedByName }}
                                            </span>
                                            <span
                                                v-if="userAccountLabel(item, 'recorded')"
                                                class="mt-0.5 block truncate text-[11px] text-on-surface-variant"
                                            >
                                                {{ userAccountLabel(item, 'recorded') }}
                                            </span>
                                            <span
                                                v-if="formatRecordedAt(item.recordedAt)"
                                                class="mt-0.5 block text-[10px] tabular-nums text-on-surface-variant/80"
                                            >
                                                Registró el {{ formatRecordedAt(item.recordedAt) }}
                                            </span>
                                            <span
                                                v-if="item.updatedByName"
                                                class="mt-1 block text-[10px] text-on-surface-variant"
                                            >
                                                Corregido por {{ item.updatedByName
                                                }}<template
                                                    v-if="userAccountLabel(item, 'updated')"
                                                >
                                                    · {{ userAccountLabel(item, 'updated') }}
                                                </template>
                                            </span>
                                        </span>
                                    </div>
                                    <span v-else>—</span>
                                </td>
                                <td class="px-4 py-3 text-right">
                                    <UiButton
                                        type="button"
                                        size="sm"
                                        variant="outline"
                                        class="h-8 px-3 text-xs"
                                        @click="openOccurrenceDetail(item)"
                                    >
                                        Ver detalle
                                    </UiButton>
                                </td>
                            </tr>
                            <tr v-if="visibleOccurrences.length === 0">
                                <td
                                    colspan="6"
                                    class="px-4 py-12 text-center text-sm text-on-surface-variant"
                                >
                                    No hay registros para el período seleccionado.
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </section>
        </template>

        <DialogRoot v-model:open="occurrenceDetailOpen">
            <DialogPortal>
                <DialogOverlay class="fixed inset-0 z-[70] bg-black/60 backdrop-blur-sm" />
                <DialogContent
                    class="fixed left-1/2 top-1/2 z-[71] max-h-[calc(100vh-2rem)] w-[calc(100%-2rem)] max-w-3xl -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-xl border border-outline-variant bg-surface p-5 shadow-xl outline-none sm:p-6"
                >
                    <template v-if="selectedOccurrence">
                        <div class="flex items-start justify-between gap-4">
                            <div>
                                <p
                                    class="text-xs font-semibold uppercase tracking-[0.2em] text-primary"
                                >
                                    Detalle del registro
                                </p>
                                <DialogTitle
                                    class="mt-2 font-display text-2xl font-semibold text-on-surface"
                                >
                                    {{ formatShortIsoDate(selectedOccurrence.date) }}
                                </DialogTitle>
                                <DialogDescription class="mt-1 text-sm text-on-surface-variant">
                                    {{ selectedOccurrence.meetingCode }} ·
                                    {{ selectedOccurrence.meetingTitle }}
                                </DialogDescription>
                            </div>
                            <span
                                class="rounded-full px-2.5 py-1 text-xs font-semibold"
                                :class="
                                    selectedOccurrence.status === 'registrada'
                                        ? 'bg-primary/15 text-primary'
                                        : 'bg-destructive/15 text-destructive'
                                "
                            >
                                {{
                                    selectedOccurrence.status === 'registrada'
                                        ? 'Registrada'
                                        : 'Pendiente'
                                }}
                            </span>
                        </div>

                        <section class="mt-6 grid gap-3 sm:grid-cols-2">
                            <div class="rounded-lg bg-surface-container-low p-4">
                                <p
                                    class="text-[10px] font-semibold uppercase tracking-wider text-on-surface-variant"
                                >
                                    Asistencia total
                                </p>
                                <p class="mt-1 text-2xl font-semibold tabular-nums text-on-surface">
                                    {{ selectedOccurrence.attendance ?? '—' }}
                                </p>
                            </div>
                            <div class="rounded-lg bg-surface-container-low p-4">
                                <p
                                    class="text-[10px] font-semibold uppercase tracking-wider text-on-surface-variant"
                                >
                                    Ofrenda total
                                </p>
                                <p class="mt-1 text-2xl font-semibold tabular-nums text-on-surface">
                                    {{
                                        selectedOccurrence.totalAmount === null
                                            ? '—'
                                            : `$${formatMoney(selectedOccurrence.totalAmount)}`
                                    }}
                                </p>
                            </div>
                        </section>

                        <section class="mt-5 grid gap-5 md:grid-cols-2">
                            <div>
                                <h3 class="text-sm font-semibold text-on-surface">
                                    Detalle de asistencia
                                </h3>
                                <div
                                    v-if="selectedOccurrence.attendanceDetails.length"
                                    class="mt-2 divide-y divide-outline-variant rounded-lg border border-outline-variant"
                                >
                                    <div
                                        v-for="detail in selectedOccurrence.attendanceDetails"
                                        :key="detail.id"
                                        class="flex items-center justify-between gap-4 px-3 py-2 text-sm"
                                    >
                                        <span class="text-on-surface-variant">{{
                                            detail.typeName ?? 'Sin tipo'
                                        }}</span>
                                        <strong class="tabular-nums text-on-surface">{{
                                            detail.quantity
                                        }}</strong>
                                    </div>
                                </div>
                                <p v-else class="mt-2 text-sm text-on-surface-variant">
                                    Se registró el total sin desglose por tipo.
                                </p>
                            </div>
                            <div>
                                <h3 class="text-sm font-semibold text-on-surface">
                                    Detalle de ofrenda
                                </h3>
                                <div
                                    v-if="selectedOccurrence.details.length"
                                    class="mt-2 divide-y divide-outline-variant rounded-lg border border-outline-variant"
                                >
                                    <div
                                        v-for="detail in selectedOccurrence.details"
                                        :key="detail.id"
                                        class="px-3 py-2 text-sm"
                                    >
                                        <div class="flex items-center justify-between gap-4">
                                            <span class="text-on-surface-variant">{{
                                                detail.categoryName ?? 'Sin categoría'
                                            }}</span>
                                            <strong class="tabular-nums text-on-surface"
                                                >${{ formatMoney(detail.amount) }}</strong
                                            >
                                        </div>
                                        <p
                                            v-if="detail.notes"
                                            class="mt-1 text-xs text-on-surface-variant"
                                        >
                                            {{ detail.notes }}
                                        </p>
                                    </div>
                                </div>
                                <p v-else class="mt-2 text-sm text-on-surface-variant">
                                    Se registró una ofrenda general sin desglose por categoría.
                                </p>
                            </div>
                        </section>

                        <section
                            v-if="selectedOccurrence.notes"
                            class="mt-5 rounded-lg border border-outline-variant bg-surface-container-low p-4"
                        >
                            <h3 class="text-sm font-semibold text-on-surface">Observaciones</h3>
                            <p class="mt-1 whitespace-pre-wrap text-sm text-on-surface-variant">
                                {{ selectedOccurrence.notes }}
                            </p>
                        </section>

                        <section class="mt-5 rounded-lg border border-outline-variant p-4">
                            <h3 class="text-sm font-semibold text-on-surface">
                                Auditoría del registro
                            </h3>
                            <p class="mt-2 text-sm text-on-surface">
                                Registró:
                                {{ selectedOccurrence.recordedByName ?? 'Sin registro de usuario' }}
                                <template v-if="userAccountLabel(selectedOccurrence, 'recorded')">
                                    · {{ userAccountLabel(selectedOccurrence, 'recorded') }}
                                </template>
                            </p>
                            <p
                                v-if="formatRecordedAt(selectedOccurrence.recordedAt)"
                                class="mt-1 text-xs text-on-surface-variant"
                            >
                                {{ formatRecordedAt(selectedOccurrence.recordedAt) }}
                            </p>
                            <p
                                v-if="selectedOccurrence.updatedByName"
                                class="mt-3 text-sm text-on-surface"
                            >
                                Corregido por {{ selectedOccurrence.updatedByName
                                }}<template v-if="userAccountLabel(selectedOccurrence, 'updated')">
                                    · {{ userAccountLabel(selectedOccurrence, 'updated') }}
                                </template>
                            </p>
                        </section>

                        <div class="mt-6 flex justify-end">
                            <UiButton
                                v-if="
                                    selectedOccurrence.status === 'pendiente' &&
                                    authStore.hasPermission(routePermissionCodes.financeRecord)
                                "
                                type="button"
                                class="mr-auto"
                                :disabled="!isOccurrenceRecordable(selectedOccurrence)"
                                @click="recordOccurrence(selectedOccurrence)"
                            >
                                {{
                                    isOccurrenceRecordable(selectedOccurrence)
                                        ? 'Agregar asistencia y ofrenda'
                                        : availableAfter(selectedOccurrence)
                                }}
                            </UiButton>
                            <p
                                v-if="
                                    selectedOccurrence.status === 'pendiente' &&
                                    !isOccurrenceRecordable(selectedOccurrence)
                                "
                                class="mr-auto flex items-center gap-1.5 text-xs text-on-surface-variant"
                            >
                                <CalendarClock class="size-3.5 text-secondary" />
                                La asistencia y la ofrenda se habilitan al finalizar la reunión.
                            </p>
                            <DialogClose as-child>
                                <UiButton type="button" variant="outline">Cerrar</UiButton>
                            </DialogClose>
                        </div>
                    </template>
                </DialogContent>
            </DialogPortal>
        </DialogRoot>
    </main>
</template>
