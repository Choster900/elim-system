<script setup lang="ts">
import {
    ArrowLeft,
    CalendarClock,
    ChevronRight,
    FilterX,
    History,
    MapPin,
    Search,
    TrendingUp,
    UserRound,
    Users,
} from '@lucide/vue'
import type { DatePickerRange } from '~/components/ui/DatePicker.vue'
import RankedBarList from '~/presentation/shared/components/charts/RankedBarList.vue'
import TrendChart from '~/presentation/shared/components/charts/TrendChart.vue'
import { formatLocalIsoDate, formatShortIsoDate } from '~/utils/date/date-format.util'
import { useOccurrencesQuery } from '../composables/useOccurrenceQueries'
import type { OccurrenceFilters, OccurrenceRecord } from '../interfaces/occurrence.interface'

defineOptions({ name: 'OfferingHistoryView' })

useHead({ title: 'Historial de ofrendas · Sistema' })

const search = ref('')
const dateRange = ref<DatePickerRange>({ start: null, end: null })
const selectedDistrict = ref<number | null>(null)
const selectedZone = ref<number | null>(null)
const selectedSector = ref<number | null>(null)

// El rango de fechas viaja al servidor, que ya sabe acotar por fecha; el territorio
// se filtra sobre lo recibido, que es justo el alcance del usuario.
const filters = computed<OccurrenceFilters>(() => ({
    status: 'registrada',
    ...(dateRange.value.start ? { from: dateRange.value.start } : {}),
    ...(dateRange.value.end ? { to: dateRange.value.end } : {}),
}))

const historyQuery = useOccurrencesQuery(filters)

const occurrences = computed(() => historyQuery.data.value ?? [])

/// Opciones únicas, ordenadas y derivadas de lo que realmente hay.
function optionsOf(
    list: OccurrenceRecord[],
    id: keyof OccurrenceRecord,
    name: keyof OccurrenceRecord,
) {
    const map = new Map<number, string>()
    for (const item of list) map.set(item[id] as number, item[name] as string)
    return [...map.entries()]
        .map(([value, label]) => ({ value, label }))
        .sort((left, right) => left.label.localeCompare(right.label, 'es'))
}

const districtOptions = computed(() => optionsOf(occurrences.value, 'districtId', 'districtName'))

const zoneOptions = computed(() =>
    optionsOf(
        occurrences.value.filter(
            (item) => !selectedDistrict.value || item.districtId === selectedDistrict.value,
        ),
        'zoneId',
        'zoneName',
    ),
)

const sectorOptions = computed(() =>
    optionsOf(
        occurrences.value.filter(
            (item) =>
                (!selectedDistrict.value || item.districtId === selectedDistrict.value) &&
                (!selectedZone.value || item.zoneId === selectedZone.value),
        ),
        'sectorId',
        'sectorName',
    ),
)

// Cambiar un nivel invalida los de abajo: dejar un sector de otra zona no filtra nada.
watch(selectedDistrict, () => {
    selectedZone.value = null
    selectedSector.value = null
})
watch(selectedZone, () => {
    selectedSector.value = null
})

const hasFilters = computed(
    () =>
        !!search.value ||
        !!dateRange.value.start ||
        !!dateRange.value.end ||
        selectedDistrict.value !== null ||
        selectedZone.value !== null ||
        selectedSector.value !== null,
)

function clearFilters() {
    search.value = ''
    dateRange.value = { start: null, end: null }
    selectedDistrict.value = null
    selectedZone.value = null
    selectedSector.value = null
}

const visible = computed(() => {
    const term = search.value.trim().toLocaleLowerCase('es')

    return occurrences.value.filter((item) => {
        if (selectedDistrict.value && item.districtId !== selectedDistrict.value) return false
        if (selectedZone.value && item.zoneId !== selectedZone.value) return false
        if (selectedSector.value && item.sectorId !== selectedSector.value) return false
        if (!term) return true

        return [item.meetingCode, item.meetingTitle, item.sectorName, item.recordedByName ?? '']
            .join(' ')
            .toLocaleLowerCase('es')
            .includes(term)
    })
})

/// El detalle siempre se lee de lo más reciente a lo más antiguo.
const tableRows = computed(() =>
    [...visible.value].sort(
        (left, right) =>
            right.date.localeCompare(left.date) ||
            left.meetingTitle.localeCompare(right.meetingTitle, 'es'),
    ),
)

const isSingleSectorScope = computed(() => selectedSector.value !== null)
const selectedSectorRecord = computed(() =>
    occurrences.value.find((item) => item.sectorId === selectedSector.value),
)
const visibleSectorCount = computed(() => new Set(visible.value.map((item) => item.sectorId)).size)
const sectorScopeName = computed(() =>
    isSingleSectorScope.value
        ? (selectedSectorRecord.value?.sectorName ?? 'Sector seleccionado')
        : 'Todos los sectores',
)
const sectorScopeDescription = computed(() => {
    if (isSingleSectorScope.value && selectedSectorRecord.value) {
        return `${selectedSectorRecord.value.zoneName} · ${selectedSectorRecord.value.districtName}`
    }

    return `${visibleSectorCount.value} ${visibleSectorCount.value === 1 ? 'sector visible' : 'sectores visibles'}`
})

const stats = computed(() => {
    const total = visible.value.reduce((sum, item) => sum + (item.totalAmount ?? 0), 0)
    const attendance = visible.value.reduce((sum, item) => sum + (item.attendance ?? 0), 0)
    const count = visible.value.length

    return {
        count,
        total,
        attendance,
        average: count > 0 ? total / count : 0,
        perAttendee: attendance > 0 ? total / attendance : 0,
    }
})

/// Una fecha del eje puede tener varias reuniones: se suman.
const trendByDate = computed(() => {
    const byDate = new Map<string, number>()
    for (const item of visible.value) {
        byDate.set(item.date, (byDate.get(item.date) ?? 0) + (item.totalAmount ?? 0))
    }

    return [...byDate.entries()]
        .sort(([left], [right]) => left.localeCompare(right))
        .slice(-12)
        .map(([date, value]) => ({ label: date.slice(5).replace('-', '/'), value }))
})

const attendanceByDate = computed(() => {
    const byDate = new Map<string, number>()
    for (const item of visible.value) {
        byDate.set(item.date, (byDate.get(item.date) ?? 0) + (item.attendance ?? 0))
    }

    return [...byDate.entries()]
        .sort(([left], [right]) => left.localeCompare(right))
        .slice(-12)
        .map(([date, value]) => ({ label: date.slice(5).replace('-', '/'), value }))
})

const byMeeting = computed(() => {
    const map = new Map<number, { label: string; value: number; dates: number }>()

    for (const item of visible.value) {
        const current = map.get(item.meetingId) ?? {
            label: `${item.meetingCode} · ${item.meetingTitle}`,
            value: 0,
            dates: 0,
        }
        current.value += item.totalAmount ?? 0
        current.dates += 1
        map.set(item.meetingId, current)
    }

    return [...map.entries()].map(([id, entry]) => ({
        id,
        label: entry.label,
        value: entry.value,
        meta: `${entry.dates} ${entry.dates === 1 ? 'fecha' : 'fechas'}`,
    }))
})

const bySector = computed(() => {
    const map = new Map<string, number>()
    for (const item of visible.value) {
        map.set(item.sectorName, (map.get(item.sectorName) ?? 0) + (item.totalAmount ?? 0))
    }

    return [...map.entries()].map(([label, value]) => ({ id: label, label, value }))
})

/// Composición de la asistencia: cuántas personas de cada tipo hay tras el total.
const byAttendanceType = computed(() => {
    const map = new Map<number, { label: string; value: number }>()

    for (const item of visible.value) {
        for (const detail of item.attendanceDetails) {
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

function formatDateDay(date: string) {
    return formatLocalIsoDate(date, { day: '2-digit' })
}

function formatDateMonth(date: string) {
    return formatLocalIsoDate(date, { month: 'short' }).replace('.', '')
}

function formatDateContext(date: string) {
    return formatLocalIsoDate(date, { weekday: 'long' })
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

function offeringPerAttendee(item: OccurrenceRecord) {
    if (!item.attendance || item.totalAmount === null) return null
    return item.totalAmount / item.attendance
}

function openMeeting(meetingId: number) {
    return navigateTo(`/finanzas/ofrendas/reunion/${meetingId}`)
}

// Solo lo usa el buscador de texto; los selectores de territorio son UiSearchSelect.
const controlClass =
    'rounded-md border border-outline-variant bg-surface px-3 py-2 text-sm text-on-surface outline-none transition-colors focus:border-primary'
const filterLabelClass =
    'mb-1.5 block text-[10px] font-semibold uppercase tracking-wider text-on-surface-variant'
</script>

<template>
    <main class="mx-auto w-full max-w-[1600px] px-4 pb-24 pt-24 sm:px-6 lg:px-8">
        <button
            type="button"
            class="mb-6 inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-on-surface-variant transition-colors hover:text-on-surface"
            @click="navigateTo('/finanzas/ofrendas')"
        >
            <ArrowLeft class="size-4" /> Volver a pendientes
        </button>

        <section class="border-b border-outline-variant pb-8">
            <p class="text-xs font-semibold uppercase tracking-[0.4em] text-on-surface-variant">
                Finanzas · Historial
            </p>
            <h1 class="mt-4 font-display text-4xl font-semibold text-on-surface md:text-5xl">
                Ofrendas registradas
            </h1>
            <p class="mt-3 max-w-xl text-sm leading-relaxed text-on-surface-variant">
                Todo lo que ya fue capturado, con su tendencia en el tiempo y de dónde viene.
            </p>
        </section>

        <!-- Filtros: territorio en cascada, rango de fechas y búsqueda -->
        <section class="mt-8 rounded-xl border border-outline-variant bg-surface-container-low p-4">
            <div class="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                <div>
                    <span :class="filterLabelClass">Distrito</span>
                    <UiSearchSelect
                        v-model="selectedDistrict"
                        :options="districtOptions"
                        clearable
                        placeholder="Todos los distritos"
                        search-placeholder="Buscar distrito..."
                    />
                </div>
                <div>
                    <span :class="filterLabelClass">Zona</span>
                    <UiSearchSelect
                        v-model="selectedZone"
                        :options="zoneOptions"
                        clearable
                        :disabled="zoneOptions.length === 0"
                        placeholder="Todas las zonas"
                        search-placeholder="Buscar zona..."
                    />
                </div>
                <div>
                    <span :class="filterLabelClass">Sector</span>
                    <UiSearchSelect
                        v-model="selectedSector"
                        :options="sectorOptions"
                        clearable
                        :disabled="sectorOptions.length === 0"
                        placeholder="Todos los sectores"
                        search-placeholder="Buscar sector..."
                    />
                </div>
                <div>
                    <span :class="filterLabelClass">Entre fechas</span>
                    <UiDatePicker
                        v-model="dateRange"
                        mode="range"
                        placeholder="Todo el historial"
                    />
                </div>
            </div>

            <div class="mt-3 flex flex-wrap items-center gap-3">
                <div class="relative min-w-[240px] flex-1">
                    <Search
                        class="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-on-surface-variant"
                    />
                    <input
                        v-model="search"
                        type="search"
                        placeholder="Buscar por código, reunión, sector o quién registró"
                        aria-label="Buscar por código, reunión, sector o quién registró"
                        :class="[controlClass, 'w-full py-2 pl-9 pr-3']"
                    />
                </div>
                <button
                    v-if="hasFilters"
                    type="button"
                    class="inline-flex items-center gap-2 rounded-md border border-outline-variant px-3 py-2 text-xs font-semibold uppercase tracking-wider text-on-surface-variant transition-colors hover:border-primary hover:text-primary"
                    @click="clearFilters"
                >
                    <FilterX class="size-3.5" /> Limpiar
                </button>
            </div>
        </section>

        <div
            v-if="historyQuery.isPending.value"
            class="mt-8 rounded-xl border border-outline-variant bg-surface-container-low px-6 py-16 text-center text-sm text-on-surface-variant"
        >
            Cargando historial…
        </div>

        <div
            v-else-if="visible.length === 0"
            class="mt-8 rounded-xl border border-outline-variant bg-surface-container-low px-6 py-16 text-center"
        >
            <History class="mx-auto size-10 text-primary" />
            <h2 class="mt-3 font-display text-2xl font-semibold text-on-surface">Sin registros</h2>
            <p class="mt-2 text-sm text-on-surface-variant">
                {{
                    hasFilters
                        ? 'Ningún registro coincide con los filtros aplicados.'
                        : 'Todavía no hay fechas registradas en tu alcance.'
                }}
            </p>
            <UiButton
                v-if="hasFilters"
                variant="outline"
                type="button"
                class="mt-4 h-10 rounded px-5 text-xs uppercase tracking-wider"
                @click="clearFilters"
            >
                Limpiar filtros
            </UiButton>
        </div>

        <template v-else>
            <!-- Cifras de cabecera -->
            <section class="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <UiCard class="p-5">
                    <p
                        class="text-[11px] font-semibold uppercase tracking-wider text-on-surface-variant"
                    >
                        Total recolectado
                    </p>
                    <p
                        class="mt-2 font-display text-3xl font-semibold tabular-nums text-on-surface"
                    >
                        ${{ formatMoney(stats.total) }}
                    </p>
                    <p class="mt-1 text-xs text-on-surface-variant">
                        en {{ stats.count }} {{ stats.count === 1 ? 'fecha' : 'fechas' }}
                    </p>
                </UiCard>
                <UiCard class="p-5">
                    <p
                        class="text-[11px] font-semibold uppercase tracking-wider text-on-surface-variant"
                    >
                        Ofrenda promedio
                    </p>
                    <p
                        class="mt-2 font-display text-3xl font-semibold tabular-nums text-on-surface"
                    >
                        ${{ formatMoney(stats.average) }}
                    </p>
                    <p class="mt-1 text-xs text-on-surface-variant">por reunión registrada</p>
                </UiCard>
                <UiCard class="p-5">
                    <p
                        class="text-[11px] font-semibold uppercase tracking-wider text-on-surface-variant"
                    >
                        Asistencia acumulada
                    </p>
                    <p
                        class="mt-2 font-display text-3xl font-semibold tabular-nums text-on-surface"
                    >
                        {{ stats.attendance }}
                    </p>
                    <p class="mt-1 text-xs text-on-surface-variant">personas contadas</p>
                </UiCard>
                <UiCard class="p-5">
                    <p
                        class="text-[11px] font-semibold uppercase tracking-wider text-on-surface-variant"
                    >
                        Ofrenda por persona
                    </p>
                    <p
                        class="mt-2 font-display text-3xl font-semibold tabular-nums text-on-surface"
                    >
                        ${{ formatMoney(stats.perAttendee) }}
                    </p>
                    <p class="mt-1 text-xs text-on-surface-variant">promedio general</p>
                </UiCard>
            </section>

            <!-- Tendencia: dos medidas de escala distinta, dos gráficos -->
            <section class="mt-6 grid gap-4 xl:grid-cols-2">
                <UiCard class="p-6">
                    <div class="mb-5 flex items-center gap-2">
                        <TrendingUp class="size-4 text-primary" />
                        <h2 class="text-sm font-semibold text-on-surface">Ofrenda por fecha</h2>
                        <span class="ml-auto text-[11px] text-on-surface-variant">
                            últimas {{ trendByDate.length }}
                        </span>
                    </div>
                    <TrendChart
                        :values="trendByDate"
                        format="currency"
                        label="Ofrenda recolectada por fecha"
                    />
                </UiCard>

                <UiCard class="p-6">
                    <div class="mb-5 flex items-center gap-2">
                        <Users class="size-4 text-primary" />
                        <h2 class="text-sm font-semibold text-on-surface">Asistencia por fecha</h2>
                        <span class="ml-auto text-[11px] text-on-surface-variant">
                            últimas {{ attendanceByDate.length }}
                        </span>
                    </div>
                    <TrendChart
                        :values="attendanceByDate"
                        color="var(--chart-2)"
                        label="Asistencia por fecha"
                    />
                </UiCard>
            </section>

            <!-- De dónde viene -->
            <section class="mt-4 grid gap-4 xl:grid-cols-2">
                <UiCard class="p-6">
                    <h2 class="mb-5 text-sm font-semibold text-on-surface">Por reunión</h2>
                    <RankedBarList
                        :items="byMeeting"
                        label="Ofrenda acumulada por reunión"
                        empty-message="Sin reuniones registradas."
                    />
                </UiCard>
                <UiCard class="p-6">
                    <h2 class="mb-5 text-sm font-semibold text-on-surface">Por sector</h2>
                    <RankedBarList
                        :items="bySector"
                        label="Ofrenda acumulada por sector"
                        empty-message="Sin sectores registrados."
                    />
                </UiCard>
            </section>

            <!-- Quiénes son los que asisten -->
            <section v-if="byAttendanceType.length > 0" class="mt-4">
                <UiCard class="p-6">
                    <h2 class="mb-5 text-sm font-semibold text-on-surface">
                        Composición de la asistencia
                    </h2>
                    <RankedBarList
                        :items="byAttendanceType"
                        format="number"
                        label="Asistencia acumulada por tipo"
                        empty-message="Las fechas visibles no tienen desglose de asistencia."
                    />
                </UiCard>
            </section>

            <!-- Detalle -->
            <section class="mt-8">
                <div class="mb-4 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                    <div>
                        <h2 class="font-display text-2xl font-semibold text-on-surface">
                            Movimientos registrados
                        </h2>
                        <p class="mt-1 text-sm text-on-surface-variant">
                            Cada fila reúne el contexto completo de una fecha capturada.
                        </p>
                    </div>
                    <span
                        class="inline-flex self-start items-center gap-2 rounded-full border border-outline-variant bg-surface-container-low px-3 py-1.5 text-xs font-semibold text-on-surface sm:self-auto"
                    >
                        <MapPin class="size-3.5 text-primary" />
                        {{ sectorScopeName }}
                    </span>
                </div>

                <div
                    class="overflow-hidden rounded-xl border border-outline-variant bg-surface shadow-sm"
                >
                    <div
                        class="flex flex-col gap-4 border-b border-outline-variant bg-surface-container-low px-5 py-4 sm:flex-row sm:items-center sm:justify-between"
                    >
                        <div class="flex min-w-0 items-center gap-3">
                            <span
                                class="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary"
                            >
                                <MapPin class="size-4" />
                            </span>
                            <div class="min-w-0">
                                <p class="truncate text-sm font-semibold text-on-surface">
                                    {{ sectorScopeName }}
                                </p>
                                <p class="truncate text-xs text-on-surface-variant">
                                    {{ sectorScopeDescription }}
                                </p>
                            </div>
                        </div>

                        <div class="flex items-center gap-6 text-right">
                            <div>
                                <p class="text-lg font-semibold tabular-nums text-on-surface">
                                    {{ stats.count }}
                                </p>
                                <p
                                    class="text-[9px] font-semibold uppercase tracking-wider text-on-surface-variant"
                                >
                                    registros
                                </p>
                            </div>
                            <span class="h-9 w-px bg-outline-variant" />
                            <div>
                                <p class="text-lg font-semibold tabular-nums text-primary">
                                    ${{ formatMoney(stats.total) }}
                                </p>
                                <p
                                    class="text-[9px] font-semibold uppercase tracking-wider text-on-surface-variant"
                                >
                                    acumulado
                                </p>
                            </div>
                        </div>
                    </div>

                    <div class="max-h-[72vh] overflow-auto overscroll-contain">
                        <table
                            data-testid="offering-history-table"
                            class="w-full border-separate border-spacing-0 text-sm"
                            :class="isSingleSectorScope ? 'min-w-[1040px]' : 'min-w-[1240px]'"
                        >
                            <caption class="sr-only">
                                Historial de ofrendas registradas para
                                {{
                                    sectorScopeName
                                }}
                            </caption>
                            <thead class="sticky top-0 z-20 bg-surface-container-high shadow-sm">
                                <tr class="text-on-surface-variant">
                                    <th
                                        scope="col"
                                        class="w-[170px] border-b border-outline-variant px-5 py-3 text-left text-[10px] font-bold uppercase tracking-[0.16em]"
                                    >
                                        Fecha
                                    </th>
                                    <th
                                        scope="col"
                                        class="min-w-[260px] border-b border-outline-variant px-5 py-3 text-left text-[10px] font-bold uppercase tracking-[0.16em]"
                                    >
                                        Reunión
                                    </th>
                                    <th
                                        v-if="!isSingleSectorScope"
                                        scope="col"
                                        class="min-w-[210px] border-b border-outline-variant px-5 py-3 text-left text-[10px] font-bold uppercase tracking-[0.16em]"
                                    >
                                        Territorio
                                    </th>
                                    <th
                                        scope="col"
                                        class="w-[150px] border-b border-outline-variant px-5 py-3 text-right text-[10px] font-bold uppercase tracking-[0.16em]"
                                    >
                                        Asistencia
                                    </th>
                                    <th
                                        scope="col"
                                        class="w-[220px] border-b border-outline-variant px-5 py-3 text-right text-[10px] font-bold uppercase tracking-[0.16em]"
                                    >
                                        Ofrenda
                                    </th>
                                    <th
                                        scope="col"
                                        class="min-w-[210px] border-b border-outline-variant px-5 py-3 text-left text-[10px] font-bold uppercase tracking-[0.16em]"
                                    >
                                        Captura
                                    </th>
                                    <th
                                        scope="col"
                                        class="w-12 border-b border-outline-variant px-3 py-3"
                                    >
                                        <span class="sr-only">Abrir historial de la reunión</span>
                                    </th>
                                </tr>
                            </thead>

                            <tbody>
                                <tr
                                    v-for="item in tableRows"
                                    :key="item.id"
                                    class="group cursor-pointer transition-colors hover:bg-primary/[0.035]"
                                    @click="openMeeting(item.meetingId)"
                                >
                                    <td class="border-b border-outline-variant px-5 py-4 align-top">
                                        <div class="flex items-center gap-3">
                                            <div
                                                class="w-11 shrink-0 overflow-hidden rounded-lg border border-outline-variant bg-surface text-center"
                                            >
                                                <p
                                                    class="py-1.5 font-display text-lg font-semibold leading-none tabular-nums text-on-surface"
                                                >
                                                    {{ formatDateDay(item.date) }}
                                                </p>
                                                <p
                                                    class="bg-surface-container-high py-1 text-[9px] font-bold uppercase tracking-wider text-on-surface-variant"
                                                >
                                                    {{ formatDateMonth(item.date) }}
                                                </p>
                                            </div>
                                            <div class="min-w-0">
                                                <p
                                                    class="capitalize text-xs font-semibold text-on-surface"
                                                >
                                                    {{ formatDateContext(item.date) }}
                                                </p>
                                                <p
                                                    class="mt-0.5 whitespace-nowrap text-[11px] tabular-nums text-on-surface-variant"
                                                >
                                                    {{ formatShortIsoDate(item.date) }}
                                                </p>
                                            </div>
                                        </div>
                                    </td>

                                    <td class="border-b border-outline-variant px-5 py-4 align-top">
                                        <div class="flex gap-3">
                                            <span
                                                class="mt-0.5 h-10 w-1 shrink-0 rounded-full"
                                                :style="{ backgroundColor: item.meetingColor }"
                                            />
                                            <div class="min-w-0">
                                                <p
                                                    class="font-semibold leading-snug text-on-surface transition-colors group-hover:text-primary"
                                                >
                                                    {{ item.meetingTitle }}
                                                </p>
                                                <p
                                                    class="mt-1 font-mono text-[10px] uppercase tracking-wider text-on-surface-variant"
                                                >
                                                    {{ item.meetingCode }}
                                                </p>
                                                <div
                                                    class="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-on-surface-variant"
                                                >
                                                    <span
                                                        v-if="item.meetingTypeName"
                                                        class="font-medium"
                                                    >
                                                        {{ item.meetingTypeName }}
                                                    </span>
                                                    <span class="inline-flex items-center gap-1">
                                                        <CalendarClock class="size-3" />
                                                        {{ item.startTime }}–{{ item.endTime }}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    </td>

                                    <td
                                        v-if="!isSingleSectorScope"
                                        class="border-b border-outline-variant px-5 py-4 align-top"
                                    >
                                        <div class="flex gap-2.5">
                                            <MapPin class="mt-0.5 size-3.5 shrink-0 text-primary" />
                                            <div>
                                                <p class="font-semibold text-on-surface">
                                                    {{ item.sectorName }}
                                                </p>
                                                <p
                                                    class="mt-1 text-[11px] leading-relaxed text-on-surface-variant"
                                                >
                                                    {{ item.zoneName }} · {{ item.districtName }}
                                                </p>
                                            </div>
                                        </div>
                                    </td>

                                    <td
                                        class="border-b border-outline-variant px-5 py-4 text-right align-top"
                                    >
                                        <p
                                            class="text-lg font-semibold tabular-nums text-on-surface"
                                        >
                                            {{ item.attendance ?? '—' }}
                                        </p>
                                        <p class="text-[10px] text-on-surface-variant">personas</p>
                                        <div
                                            v-if="item.attendanceDetails.length > 0"
                                            class="mt-2 space-y-0.5 text-[10px] tabular-nums text-on-surface-variant"
                                        >
                                            <p
                                                v-for="detail in item.attendanceDetails.slice(0, 2)"
                                                :key="detail.id"
                                            >
                                                {{ detail.quantity }}
                                                {{ detail.typeName ?? 'sin tipo' }}
                                            </p>
                                            <p v-if="item.attendanceDetails.length > 2">
                                                +{{ item.attendanceDetails.length - 2 }} tipos
                                            </p>
                                        </div>
                                    </td>

                                    <td
                                        class="border-b border-outline-variant px-5 py-4 text-right align-top"
                                    >
                                        <p class="text-lg font-bold tabular-nums text-primary">
                                            ${{ formatMoney(item.totalAmount ?? 0) }}
                                        </p>
                                        <p
                                            v-if="offeringPerAttendee(item) !== null"
                                            class="text-[10px] tabular-nums text-on-surface-variant"
                                        >
                                            ${{ formatMoney(offeringPerAttendee(item) ?? 0) }} por
                                            persona
                                        </p>
                                        <div
                                            v-if="item.details.length > 0"
                                            class="mt-2 flex flex-wrap justify-end gap-1"
                                        >
                                            <span
                                                v-for="detail in item.details.slice(0, 2)"
                                                :key="detail.id"
                                                class="rounded bg-primary/[0.07] px-1.5 py-0.5 text-[9px] font-medium tabular-nums text-on-surface-variant"
                                            >
                                                {{ detail.categoryName ?? 'Sin categoría' }} · ${{
                                                    formatMoney(detail.amount)
                                                }}
                                            </span>
                                            <span
                                                v-if="item.details.length > 2"
                                                class="rounded bg-surface-container-high px-1.5 py-0.5 text-[9px] font-medium text-on-surface-variant"
                                            >
                                                +{{ item.details.length - 2 }}
                                            </span>
                                        </div>
                                    </td>

                                    <td class="border-b border-outline-variant px-5 py-4 align-top">
                                        <div v-if="item.recordedByName" class="flex gap-2.5">
                                            <span
                                                class="flex size-7 shrink-0 items-center justify-center rounded-full bg-surface-container-high text-on-surface-variant"
                                            >
                                                <UserRound class="size-3.5" />
                                            </span>
                                            <div class="min-w-0">
                                                <p class="font-medium text-on-surface">
                                                    {{ item.recordedByName }}
                                                </p>
                                                <p
                                                    v-if="formatRecordedAt(item.recordedAt)"
                                                    class="mt-0.5 text-[10px] tabular-nums text-on-surface-variant"
                                                >
                                                    {{ formatRecordedAt(item.recordedAt) }}
                                                </p>
                                                <p
                                                    v-if="item.updatedByName"
                                                    class="mt-1 text-[10px] text-on-surface-variant"
                                                >
                                                    Corregido por {{ item.updatedByName }}
                                                </p>
                                            </div>
                                        </div>
                                        <span v-else class="text-on-surface-variant">—</span>
                                    </td>

                                    <td
                                        class="border-b border-outline-variant px-3 py-4 text-center align-middle"
                                    >
                                        <button
                                            type="button"
                                            class="mx-auto flex size-8 items-center justify-center rounded-full text-on-surface-variant outline-none transition-colors hover:bg-primary/10 hover:text-primary focus-visible:ring-2 focus-visible:ring-primary"
                                            :aria-label="`Abrir historial de ${item.meetingTitle}`"
                                            @click.stop="openMeeting(item.meetingId)"
                                        >
                                            <ChevronRight
                                                class="size-4 transition-transform group-hover:translate-x-0.5"
                                            />
                                        </button>
                                    </td>
                                </tr>
                            </tbody>

                            <tfoot class="sticky bottom-0 z-10 bg-surface-container-high shadow-sm">
                                <tr>
                                    <th
                                        :colspan="isSingleSectorScope ? 2 : 3"
                                        scope="row"
                                        class="border-t border-outline-variant px-5 py-3 text-left text-[10px] font-bold uppercase tracking-[0.16em] text-on-surface"
                                    >
                                        Totales del resultado
                                    </th>
                                    <td
                                        class="border-t border-outline-variant px-5 py-3 text-right text-sm font-bold tabular-nums text-on-surface"
                                    >
                                        {{ stats.attendance }}
                                    </td>
                                    <td
                                        class="border-t border-outline-variant px-5 py-3 text-right text-sm font-bold tabular-nums text-primary"
                                    >
                                        ${{ formatMoney(stats.total) }}
                                    </td>
                                    <td
                                        class="border-t border-outline-variant px-5 py-3 text-left text-xs font-medium tabular-nums text-on-surface-variant"
                                    >
                                        {{ stats.count }}
                                        {{ stats.count === 1 ? 'registro' : 'registros' }}
                                    </td>
                                    <td class="border-t border-outline-variant" />
                                </tr>
                            </tfoot>
                        </table>
                    </div>
                </div>
            </section>
        </template>
    </main>
</template>
