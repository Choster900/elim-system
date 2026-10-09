<script setup lang="ts">
import {
    ArrowLeft,
    CalendarClock,
    ChevronRight,
    Compass,
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
import DataTable, {
    type DataTableColumn,
} from '~/presentation/shared/components/DataTable/DataTable.vue'
import TrendChart from '~/presentation/shared/components/charts/TrendChart.vue'
import AppTour from '~/presentation/shared/components/AppTour.vue'
import { useTourProgress } from '~/presentation/shared/composables/useTourProgress'
import type { TourStep } from '~/presentation/shared/interfaces/tour.interface'
import { useAuthStore } from '~/presentation/auth/stores/auth.store'
import {
    formatLocalIsoDate,
    formatShortIsoDate,
    formatTimeRange,
} from '~/utils/date/date-format.util'
import { useOccurrencesQuery } from '../composables/useOccurrenceQueries'
import { GENERAL_MEETING_SCOPE_LABEL } from '~/presentation/meetings/utils/meeting-format.util'
import type {
    OccurrenceDateField,
    OccurrenceFilters,
    OccurrenceRecord,
} from '../interfaces/occurrence.interface'

defineOptions({ name: 'OfferingHistoryView' })

useHead({ title: 'Historial de ofrendas · Sistema' })

const search = ref('')
const dateRange = ref<DatePickerRange>({ start: null, end: null })
const DEFAULT_DATE_FIELD: OccurrenceDateField = 'registro'
const dateField = ref<OccurrenceDateField>(DEFAULT_DATE_FIELD)
const dateFieldOptions: { value: OccurrenceDateField; label: string; description: string }[] = [
    {
        value: 'registro',
        label: 'Fecha de registro',
        description: 'El día en que el líder ingresó la ofrenda',
    },
    {
        value: 'reunion',
        label: 'Fecha de la reunión',
        description: 'El día en que se realizó la reunión',
    },
]
const selectedDistrict = ref<number | null>(null)
const selectedZone = ref<number | null>(null)
const selectedSector = ref<number | null>(null)
const selectedMeeting = ref<number | null>(null)

const filters = computed<OccurrenceFilters>(() => ({
    status: 'registrada',
    ...(dateRange.value.start ? { from: dateRange.value.start } : {}),
    ...(dateRange.value.end ? { to: dateRange.value.end } : {}),
    ...(dateField.value === 'registro' ? { dateField: 'registro' as const } : {}),
}))

const historyQuery = useOccurrencesQuery(filters)
const authStore = useAuthStore()
const isTourOpen = ref(false)
const isClientReady = ref(false)
const { hasSeen, markSeen } = useTourProgress('offering-history', 1)

const tourSteps: TourStep[] = [
    {
        id: 'history-heading',
        target: '[data-tour="offerings-history-heading"]',
        title: 'Historial de ofrendas',
        description:
            'Aquí consultas todas las fechas ya registradas y sus resultados dentro de tu alcance.',
    },
    {
        id: 'history-filters',
        target: '[data-tour="offerings-history-filters"]',
        title: 'Filtra lo que quieres analizar',
        description:
            'Combina territorio, reunión, fechas y búsqueda de texto para acotar el historial.',
    },
    {
        id: 'history-stats',
        target: '[data-tour="offerings-history-stats"]',
        title: 'Métricas del resultado',
        description:
            'Los indicadores se recalculan con los filtros activos para mostrar recaudación, promedio y asistencia.',
    },
    {
        id: 'history-trends',
        target: '[data-tour="offerings-history-trends"]',
        title: 'Tendencias por fecha',
        description:
            'Compara cómo evolucionan las ofrendas y la asistencia en las últimas fechas visibles.',
    },
    {
        id: 'history-breakdowns',
        target: '[data-tour="offerings-history-breakdowns"]',
        title: 'Origen de las ofrendas',
        description:
            'Identifica qué reuniones y sectores acumulan más ofrendas en el período seleccionado.',
    },
    {
        id: 'history-detail',
        target: '[data-tour="offerings-history-detail"]',
        title: 'Detalle de cada captura',
        description:
            'La tabla reúne fecha, reunión, territorio, asistencia, ofrenda y quién realizó la captura. Haz clic en una fila para abrir su historial.',
    },
]

function startTour() {
    isTourOpen.value = true
}

function endTour() {
    isTourOpen.value = false
    if (authStore.user?.id) markSeen(authStore.user.id)
}

function startFirstVisitTour() {
    const userId = authStore.user?.id
    if (isClientReady.value && !historyQuery.isPending.value && userId && !hasSeen(userId)) {
        startTour()
    }
}

const occurrences = computed(() => historyQuery.data.value ?? [])

function optionsOf(
    list: OccurrenceRecord[],
    id: keyof OccurrenceRecord,
    name: keyof OccurrenceRecord,
) {
    const map = new Map<number, string>()
    for (const item of list) {
        if (item[id] === null || !item[name]) continue
        map.set(item[id] as number, item[name] as string)
    }
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

const meetingOptions = computed(() =>
    [
        ...new Map(
            occurrences.value.map((item) => [
                item.meetingId,
                `${item.meetingCode} · ${item.meetingTitle}`,
            ]),
        ),
    ]
        .map(([value, label]) => ({ value, label }))
        .sort((left, right) => left.label.localeCompare(right.label, 'es')),
)

watch(selectedDistrict, () => {
    selectedZone.value = null
    selectedSector.value = null
})
watch(selectedZone, () => {
    selectedSector.value = null
})

onMounted(() => {
    isClientReady.value = true
    startFirstVisitTour()
})

watch([() => authStore.user?.id, () => historyQuery.isPending.value], startFirstVisitTour)

const hasFilters = computed(
    () =>
        !!search.value ||
        !!dateRange.value.start ||
        !!dateRange.value.end ||
        dateField.value !== DEFAULT_DATE_FIELD ||
        selectedDistrict.value !== null ||
        selectedZone.value !== null ||
        selectedSector.value !== null ||
        selectedMeeting.value !== null,
)

function clearFilters() {
    search.value = ''
    dateRange.value = { start: null, end: null }
    dateField.value = DEFAULT_DATE_FIELD
    selectedDistrict.value = null
    selectedZone.value = null
    selectedSector.value = null
    selectedMeeting.value = null
}

const visible = computed(() => {
    const term = search.value.trim().toLocaleLowerCase('es')

    return occurrences.value.filter((item) => {
        if (selectedDistrict.value && item.districtId !== selectedDistrict.value) return false
        if (selectedZone.value && item.zoneId !== selectedZone.value) return false
        if (selectedSector.value && item.sectorId !== selectedSector.value) return false
        if (selectedMeeting.value && item.meetingId !== selectedMeeting.value) return false
        if (!term) return true

        return [item.meetingCode, item.meetingTitle, item.sectorName, item.recordedByName ?? '']
            .join(' ')
            .toLocaleLowerCase('es')
            .includes(term)
    })
})

const tableRows = computed(() =>
    [...visible.value].sort((left, right) => {
        if (dateField.value === 'registro') {
            const byRecorded = (right.recordedAt ?? '').localeCompare(left.recordedAt ?? '')
            if (byRecorded !== 0) return byRecorded
        }
        return (
            right.date.localeCompare(left.date) ||
            left.meetingTitle.localeCompare(right.meetingTitle, 'es')
        )
    }),
)

const isSingleSectorScope = computed(() => selectedSector.value !== null)

const historyColumns = computed<DataTableColumn<OccurrenceRecord>[]>(() => [
    { key: 'date', label: 'Fecha', sortable: true, accessor: (row) => row.date, width: '150px' },
    {
        key: 'meeting',
        label: 'Reunión',
        sortable: true,
        accessor: (row) => `${row.meetingTitle} ${row.meetingCode}`,
    },
    ...(isSingleSectorScope.value
        ? []
        : [
              {
                  key: 'territory',
                  label: 'Territorio',
                  sortable: true,
                  accessor: (row: OccurrenceRecord) =>
                      row.sectorName ?? GENERAL_MEETING_SCOPE_LABEL,
              },
          ]),
    {
        key: 'attendance',
        label: 'Asistencia',
        sortable: true,
        align: 'right',
        accessor: (row) => row.attendance ?? 0,
        width: '130px',
    },
    {
        key: 'offering',
        label: 'Ofrenda',
        sortable: true,
        align: 'right',
        accessor: (row) => row.totalAmount ?? 0,
        width: '200px',
    },
    {
        key: 'recorded',
        label: 'Captura',
        sortable: true,
        accessor: (row) => row.recordedAt ?? '',
        width: '200px',
    },
    { key: 'actions', label: '', align: 'center', width: '56px' },
])
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
        const label = item.sectorName ?? GENERAL_MEETING_SCOPE_LABEL
        map.set(label, (map.get(label) ?? 0) + (item.totalAmount ?? 0))
    }

    return [...map.entries()].map(([label, value]) => ({ id: label, label, value }))
})

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

const controlClass =
    'rounded-md border border-outline-variant bg-surface px-3 py-2 text-sm text-on-surface outline-none transition-colors focus:border-primary'
const filterLabelClass =
    'mb-1.5 block text-[10px] font-semibold uppercase tracking-wider text-on-surface-variant'
</script>

<template>
    <main class="mx-auto w-full max-w-[1600px] px-4 pb-24 pt-24 sm:px-6 lg:px-8">
        <div class="mb-6 flex items-center gap-3">
            <button
                type="button"
                class="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-on-surface-variant transition-colors hover:text-on-surface"
                @click="navigateTo('/finanzas/ofrendas')"
            >
                <ArrowLeft class="size-4" /> Volver a pendientes
            </button>
            <div class="group relative">
                <button
                    type="button"
                    class="flex size-8 items-center justify-center rounded-full border border-primary/30 bg-surface text-primary transition-all hover:-translate-y-0.5 hover:border-primary hover:bg-primary hover:text-primary-foreground hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 active:translate-y-0"
                    aria-label="Iniciar recorrido guiado del historial de ofrendas"
                    aria-describedby="offerings-history-tour-hint"
                    @click="startTour"
                >
                    <Compass class="size-3.5" />
                </button>
                <div
                    id="offerings-history-tour-hint"
                    role="tooltip"
                    class="pointer-events-none absolute left-0 top-full z-50 mt-2 w-60 translate-y-1 rounded-xl border border-outline-variant bg-surface p-3 text-left opacity-0 shadow-xl transition-all duration-200 group-hover:translate-y-0 group-hover:opacity-100 group-focus-within:translate-y-0 group-focus-within:opacity-100"
                >
                    <span
                        class="absolute -top-1 left-3 size-2 rotate-45 border-l border-t border-outline-variant bg-surface"
                    />
                    <p class="text-xs font-semibold text-on-surface">Recorrido guiado</p>
                    <p class="mt-1 text-xs leading-5 text-on-surface-variant">
                        Aprende a filtrar y analizar las ofrendas ya registradas.
                    </p>
                </div>
            </div>
        </div>

        <section data-tour="offerings-history-heading" class="border-b border-outline-variant pb-8">
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

        <section
            data-tour="offerings-history-filters"
            class="mt-8 rounded-xl border border-outline-variant bg-surface-container-low p-4"
        >
            <div class="grid gap-3 sm:grid-cols-2 xl:grid-cols-6">
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
                    <span :class="filterLabelClass">Reunión</span>
                    <UiSearchSelect
                        v-model="selectedMeeting"
                        :options="meetingOptions"
                        clearable
                        :disabled="meetingOptions.length === 0"
                        placeholder="Todas las reuniones"
                        search-placeholder="Buscar código o nombre..."
                    />
                </div>
                <div>
                    <span :class="filterLabelClass">Buscar por</span>
                    <UiSearchSelect
                        v-model="dateField"
                        :options="dateFieldOptions"
                        option-description="description"
                        :searchable="false"
                        aria-label="Qué fecha usar en el filtro"
                    />
                </div>
                <div>
                    <span :class="filterLabelClass">
                        {{ dateField === 'registro' ? 'Registradas entre' : 'Reuniones entre' }}
                    </span>
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
                        placeholder="Buscar por código o nombre de reunión, sector o quién registró"
                        aria-label="Buscar por código o nombre de reunión, sector o quién registró"
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
            <section
                data-tour="offerings-history-stats"
                class="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4"
            >
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

            <section data-tour="offerings-history-trends" class="mt-6 grid gap-4 xl:grid-cols-2">
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

            <section
                data-tour="offerings-history-breakdowns"
                class="mt-4 grid gap-4 xl:grid-cols-2"
            >
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

            <section data-tour="offerings-history-detail" class="mt-8">
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
                    class="mb-3 flex flex-col gap-4 rounded-xl border border-outline-variant bg-surface-container-low px-5 py-4 sm:flex-row sm:items-center sm:justify-between"
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
                            <p class="text-lg font-semibold tabular-nums text-on-surface">
                                {{ stats.attendance }}
                            </p>
                            <p
                                class="text-[9px] font-semibold uppercase tracking-wider text-on-surface-variant"
                            >
                                asistencia
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

                <div data-testid="offering-history-table">
                    <DataTable
                        :rows="tableRows"
                        :columns="historyColumns"
                        row-key="id"
                        :page-size="10"
                        dense
                        empty-title="Sin movimientos"
                        empty-message="No hay fechas registradas con estos filtros."
                    >
                        <template #cell-date="{ row }">
                            <div class="flex items-center gap-2.5">
                                <div
                                    class="w-9 shrink-0 overflow-hidden rounded-md border border-outline-variant bg-surface text-center"
                                >
                                    <p
                                        class="py-1 font-display text-sm font-semibold leading-none tabular-nums text-on-surface"
                                    >
                                        {{ formatDateDay(row.date) }}
                                    </p>
                                    <p
                                        class="bg-surface-container-high py-0.5 text-[8px] font-bold uppercase tracking-wider text-on-surface-variant"
                                    >
                                        {{ formatDateMonth(row.date) }}
                                    </p>
                                </div>
                                <div class="min-w-0">
                                    <p class="text-xs font-semibold capitalize text-on-surface">
                                        {{ formatDateContext(row.date) }}
                                    </p>
                                    <p
                                        class="whitespace-nowrap text-[11px] tabular-nums text-on-surface-variant"
                                    >
                                        {{ formatShortIsoDate(row.date) }}
                                    </p>
                                </div>
                            </div>
                        </template>

                        <template #cell-meeting="{ row }">
                            <button
                                type="button"
                                class="group flex gap-2.5 text-left"
                                @click="openMeeting(row.meetingId)"
                            >
                                <span
                                    class="mt-0.5 h-9 w-1 shrink-0 rounded-full"
                                    :style="{ backgroundColor: row.meetingColor }"
                                />
                                <span class="min-w-0">
                                    <span
                                        class="block font-semibold leading-snug text-on-surface group-hover:text-primary group-hover:underline"
                                    >
                                        {{ row.meetingTitle }}
                                    </span>
                                    <span
                                        class="mt-0.5 block font-mono text-[10px] uppercase tracking-wider text-on-surface-variant"
                                    >
                                        {{ row.meetingCode }}
                                    </span>
                                    <span
                                        class="mt-1 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[11px] text-on-surface-variant"
                                    >
                                        <span v-if="row.meetingTypeName" class="font-medium">
                                            {{ row.meetingTypeName }}
                                        </span>
                                        <span class="inline-flex items-center gap-1">
                                            <CalendarClock class="size-3" />
                                            {{ formatTimeRange(row.startTime, row.endTime) }}
                                        </span>
                                    </span>
                                </span>
                            </button>
                        </template>

                        <template #cell-territory="{ row }">
                            <div class="flex gap-2">
                                <MapPin class="mt-0.5 size-3.5 shrink-0 text-primary" />
                                <div>
                                    <p class="font-semibold text-on-surface">
                                        {{ row.sectorName ?? GENERAL_MEETING_SCOPE_LABEL }}
                                    </p>
                                    <p
                                        v-if="row.sectorName"
                                        class="text-[11px] text-on-surface-variant"
                                    >
                                        {{ row.zoneName }} · {{ row.districtName }}
                                    </p>
                                </div>
                            </div>
                        </template>

                        <template #cell-attendance="{ row }">
                            <p class="font-semibold tabular-nums text-on-surface">
                                {{ row.attendance ?? '—' }}
                                <span class="text-[10px] font-normal text-on-surface-variant">
                                    personas
                                </span>
                            </p>
                            <p
                                v-if="row.attendanceDetails.length > 0"
                                class="text-[10px] tabular-nums text-on-surface-variant"
                            >
                                {{
                                    row.attendanceDetails
                                        .slice(0, 2)
                                        .map(
                                            (detail) =>
                                                `${detail.quantity} ${detail.typeName ?? 'sin tipo'}`,
                                        )
                                        .join(' · ')
                                }}
                                <template v-if="row.attendanceDetails.length > 2">
                                    · +{{ row.attendanceDetails.length - 2 }}
                                </template>
                            </p>
                        </template>

                        <template #cell-offering="{ row }">
                            <p class="font-bold tabular-nums text-primary">
                                ${{ formatMoney(row.totalAmount ?? 0) }}
                            </p>
                            <p
                                v-if="offeringPerAttendee(row) !== null"
                                class="text-[10px] tabular-nums text-on-surface-variant"
                            >
                                ${{ formatMoney(offeringPerAttendee(row) ?? 0) }} por persona
                            </p>
                            <div
                                v-if="row.details.length > 0"
                                class="mt-1 flex flex-wrap justify-end gap-1"
                            >
                                <span
                                    v-for="detail in row.details.slice(0, 2)"
                                    :key="detail.id"
                                    class="rounded bg-primary/[0.07] px-1.5 py-0.5 text-[9px] font-medium tabular-nums text-on-surface-variant"
                                >
                                    {{ detail.categoryName ?? 'Sin categoría' }} · ${{
                                        formatMoney(detail.amount)
                                    }}
                                </span>
                                <span
                                    v-if="row.details.length > 2"
                                    class="rounded bg-surface-container-high px-1.5 py-0.5 text-[9px] font-medium text-on-surface-variant"
                                >
                                    +{{ row.details.length - 2 }}
                                </span>
                            </div>
                        </template>

                        <template #cell-recorded="{ row }">
                            <div v-if="row.recordedByName" class="flex gap-2">
                                <span
                                    class="flex size-6 shrink-0 items-center justify-center rounded-full bg-surface-container-high text-on-surface-variant"
                                >
                                    <UserRound class="size-3" />
                                </span>
                                <div class="min-w-0">
                                    <p class="font-medium text-on-surface">
                                        {{ row.recordedByName }}
                                    </p>
                                    <p
                                        v-if="formatRecordedAt(row.recordedAt)"
                                        class="text-[10px] tabular-nums text-on-surface-variant"
                                    >
                                        {{ formatRecordedAt(row.recordedAt) }}
                                    </p>
                                    <p
                                        v-if="row.updatedByName"
                                        class="text-[10px] text-on-surface-variant"
                                    >
                                        Corregido por {{ row.updatedByName }}
                                    </p>
                                </div>
                            </div>
                            <span v-else class="text-on-surface-variant">—</span>
                        </template>

                        <template #cell-actions="{ row }">
                            <button
                                type="button"
                                class="mx-auto flex size-8 items-center justify-center rounded-full text-on-surface-variant outline-none transition-colors hover:bg-primary/10 hover:text-primary focus-visible:ring-2 focus-visible:ring-primary"
                                :aria-label="`Abrir historial de ${row.meetingTitle}`"
                                @click="openMeeting(row.meetingId)"
                            >
                                <ChevronRight class="size-4" />
                            </button>
                        </template>
                    </DataTable>
                </div>
            </section>
        </template>
        <AppTour :open="isTourOpen" :steps="tourSteps" @close="endTour" @complete="endTour" />
    </main>
</template>
