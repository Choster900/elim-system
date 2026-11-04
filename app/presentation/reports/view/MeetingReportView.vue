<script setup lang="ts">
import {
    AlertTriangle,
    BarChart3,
    CalendarRange,
    ChevronDown,
    ClipboardCheck,
    Coins,
    Download,
    ExternalLink,
    FileSpreadsheet,
    FileText,
    FilterX,
    HandCoins,
    Inbox,
    ListChecks,
    Loader2,
    MapPinned,
    PieChart,
    RefreshCw,
    Scale,
    Sheet,
    TrendingUp,
    UsersRound,
} from '@lucide/vue'
import {
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuPortal,
    DropdownMenuRoot,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from 'radix-vue'
import type { Component } from 'vue'
import type { DatePickerRange } from '~/components/ui/DatePicker.vue'
import { routePermissionCodes } from '~/presentation/auth/constants/permission.constants'
import { useAuthStore } from '~/presentation/auth/stores/auth.store'
import ColumnChart from '~/presentation/shared/components/charts/ColumnChart.vue'
import RankedBarList from '~/presentation/shared/components/charts/RankedBarList.vue'
import DataTable, {
    type DataTableColumn,
} from '~/presentation/shared/components/DataTable/DataTable.vue'
import { useAppToast } from '~/presentation/shared/composables/useAppToast'
import { useMeetingReportQuery } from '../composables/useMeetingReportQuery'
import type {
    DistrictReportAggregate,
    MeetingReportAggregate,
    MeetingReportFilters,
    MeetingReportRow,
    ReportDateRange,
    ReportMeetingKind,
    ReportReceptionState,
    ReportStateFilter,
    TitherReportAggregate,
} from '../interfaces/meeting-report.interface'
import {
    exportMeetingReportCsv,
    exportMeetingReportExcel,
    exportMeetingReportPdf,
    type MeetingReportCsvKind,
    type MeetingReportExportContext,
} from '../services/meeting-report-export.service'
import {
    UNCATEGORIZED_LABEL,
    buildReportTrend,
    categoryTotals,
    createEmptyFilters,
    filterReportRows,
    fromCents,
    groupByDistrict,
    groupByMeeting,
    groupByTither,
    isTitheRow,
    rangeDays,
    receptionState,
    sumCategory,
    summarizeReport,
    sumReceived,
    sumTithes,
    sumUncategorized,
    toCents,
    usedCategories,
} from '../utils/meeting-report.util'
import {
    TITHE_COLOR,
    TITHES_LABEL,
    TITHES_TERRITORY_LABEL,
    formatReportDate,
    formatReportDateTime,
    formatReportMoney,
    formatReportPercent,
    formatReportRange,
    formatReportWeekday,
    reportRowCode,
    reportRowColor,
    reportRowTitle,
    reportRowType,
    reportStateLabel,
} from '../utils/report-format.util'
import {
    defaultReportRange,
    isIsoDay,
    matchReportRangePreset,
    reportRangePresets,
    resolveReportRangePreset,
    type ReportRangePresetKey,
} from '../utils/report-range.util'

defineOptions({ name: 'MeetingReportView' })

const REPORT_TITLE = 'Reporte de ofrendas y diezmos recibidos'
const REPORT_SUBTITLE = 'Sobres de reuniones y diezmos contados por el comité de apoyo'
const MAX_RANGE_DAYS = 366

useHead({ title: 'Reporte de ofrendas y diezmos recibidos · Sistema' })

type ReportTab = 'reuniones' | 'diezmadores' | 'detalle' | 'distritos'
type ExportFormat = 'excel' | 'pdf' | 'csv-reuniones' | 'csv-diezmadores' | 'csv-detalle'

interface KpiCard {
    key: string
    label: string
    value: string
    hint: string
    icon: Component
    highlight?: boolean
    warn?: boolean
}

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()
const toast = useAppToast()
const runtimeConfig = useRuntimeConfig()

const appName = computed(() => String(runtimeConfig.public.appName || 'Sistema'))
const canExport = computed(() => authStore.hasPermission(routePermissionCodes.reportsExport))
const canOpenMeetingHistory = computed(() =>
    authStore.hasPermission(routePermissionCodes.financeView),
)

function rangeFromQuery(): ReportDateRange {
    const from = route.query.desde
    const to = route.query.hasta
    if (isIsoDay(from) && isIsoDay(to) && from <= to) {
        const range = { from, to }
        if (rangeDays(range) <= MAX_RANGE_DAYS) return range
    }
    return defaultReportRange()
}

const appliedRange = ref<ReportDateRange>(rangeFromQuery())
const pickerRange = ref<DatePickerRange>({
    start: appliedRange.value.from,
    end: appliedRange.value.to,
})
const activePreset = computed(() => matchReportRangePreset(appliedRange.value))
const rangeLabel = computed(() => formatReportRange(appliedRange.value.from, appliedRange.value.to))
const rangeLength = computed(() => rangeDays(appliedRange.value))

function applyPreset(key: ReportRangePresetKey) {
    const range = resolveReportRangePreset(key)
    appliedRange.value = range
    pickerRange.value = { start: range.from, end: range.to }
}

watch(pickerRange, (value) => {
    if (!value.start || !value.end) return
    if (value.start === appliedRange.value.from && value.end === appliedRange.value.to) return

    const candidate = { from: value.start, to: value.end }
    if (rangeDays(candidate) > MAX_RANGE_DAYS) {
        toast.error(`El rango no puede superar ${MAX_RANGE_DAYS} días`)
        pickerRange.value = { start: appliedRange.value.from, end: appliedRange.value.to }
        return
    }
    appliedRange.value = candidate
})

watch(
    appliedRange,
    (range) => {
        if (route.query.desde === range.from && route.query.hasta === range.to) return
        router.replace({ query: { ...route.query, desde: range.from, hasta: range.to } })
    },
    { immediate: true },
)

const reportQuery = useMeetingReportQuery(appliedRange)
const report = computed(() => reportQuery.data.value ?? null)
const allRows = computed(() => report.value?.rows ?? [])
const isInitialLoading = computed(() => reportQuery.isPending.value && !report.value)
const isRefreshing = computed(() => reportQuery.isFetching.value && !!report.value)
const isStale = computed(
    () =>
        !!report.value &&
        (report.value.from !== appliedRange.value.from ||
            report.value.to !== appliedRange.value.to),
)

const filters = reactive<MeetingReportFilters>(createEmptyFilters())
const isTithesOnly = computed(() => filters.kind === 'diezmos')

const kindOptions: { value: ReportMeetingKind; label: string }[] = [
    { value: 'todas', label: 'Todas' },
    { value: 'celulas', label: 'Células y sectores' },
    { value: 'generales', label: 'Cultos generales' },
    { value: 'diezmos', label: 'Diezmos' },
]

const stateOptions: { value: ReportStateFilter; label: string }[] = [
    { value: 'todas', label: 'Todos los sobres' },
    { value: 'cuadra', label: 'Cuadran' },
    { value: 'diferencia_abierta', label: 'Con diferencia abierta' },
    { value: 'diferencia_cerrada', label: 'Diferencia cerrada' },
]

function distinctOptions(
    rows: MeetingReportRow[],
    pick: (row: MeetingReportRow) => { value: number | null; label: string | null },
) {
    const options = new Map<number, string>()
    for (const row of rows) {
        const { value, label } = pick(row)
        if (value !== null && label) options.set(value, label)
    }
    return [...options]
        .map(([value, label]) => ({ value, label }))
        .sort((left, right) => left.label.localeCompare(right.label, 'es'))
}

const meetingTypeOptions = computed(() =>
    distinctOptions(
        allRows.value.filter((row) => !isTitheRow(row)),
        (row) => ({ value: row.meetingTypeId, label: row.meetingTypeName }),
    ),
)
const districtOptions = computed(() =>
    distinctOptions(allRows.value, (row) => ({ value: row.districtId, label: row.districtName })),
)
const zoneOptions = computed(() =>
    distinctOptions(
        allRows.value.filter(
            (row) => filters.districtId === null || row.districtId === filters.districtId,
        ),
        (row) => ({ value: row.zoneId, label: row.zoneName }),
    ),
)
const sectorOptions = computed(() =>
    distinctOptions(
        allRows.value.filter(
            (row) =>
                (filters.districtId === null || row.districtId === filters.districtId) &&
                (filters.zoneId === null || row.zoneId === filters.zoneId),
        ),
        (row) => ({ value: row.sectorId, label: row.sectorName }),
    ),
)

watch(
    () => filters.districtId,
    () => {
        if (!zoneOptions.value.some((option) => option.value === filters.zoneId)) {
            filters.zoneId = null
        }
        if (!sectorOptions.value.some((option) => option.value === filters.sectorId)) {
            filters.sectorId = null
        }
    },
)

watch(
    () => filters.zoneId,
    () => {
        if (!sectorOptions.value.some((option) => option.value === filters.sectorId)) {
            filters.sectorId = null
        }
    },
)

watch(
    () => filters.kind,
    (kind) => {
        if (kind === 'generales') {
            filters.districtId = null
            filters.zoneId = null
            filters.sectorId = null
        }
        if (kind === 'diezmos') {
            filters.meetingTypeIds = []
            filters.state = 'todas'
        }
    },
)

const hasActiveFilters = computed(
    () =>
        filters.kind !== 'todas' ||
        filters.state !== 'todas' ||
        filters.meetingTypeIds.length > 0 ||
        filters.districtId !== null ||
        filters.zoneId !== null ||
        filters.sectorId !== null,
)

function clearFilters() {
    Object.assign(filters, createEmptyFilters())
}

function optionLabel(options: { value: number; label: string }[], value: number | null) {
    return options.find((option) => option.value === value)?.label ?? null
}

const filterLabels = computed(() => {
    const labels: string[] = []
    if (filters.kind !== 'todas') {
        labels.push(
            `Alcance: ${kindOptions.find((option) => option.value === filters.kind)?.label}`,
        )
    }
    if (filters.state !== 'todas') {
        labels.push(
            `Sobres: ${stateOptions.find((option) => option.value === filters.state)?.label}`,
        )
    }
    if (filters.meetingTypeIds.length > 0) {
        const names = filters.meetingTypeIds
            .map((id) => optionLabel(meetingTypeOptions.value, id))
            .filter(Boolean)
        labels.push(`Tipo: ${names.join(', ')}`)
    }
    const district = optionLabel(districtOptions.value, filters.districtId)
    if (district) labels.push(`Distrito: ${district}`)
    const zone = optionLabel(zoneOptions.value, filters.zoneId)
    if (zone) labels.push(`Zona: ${zone}`)
    const sector = optionLabel(sectorOptions.value, filters.sectorId)
    if (sector) labels.push(`Sector: ${sector}`)
    return labels
})

const filteredRows = computed(() =>
    filterReportRows(allRows.value, filters)
        .slice()
        .sort(
            (left, right) =>
                left.date.localeCompare(right.date) ||
                Number(isTitheRow(left)) - Number(isTitheRow(right)) ||
                reportRowCode(left).localeCompare(reportRowCode(right), 'es'),
        ),
)
const summary = computed(() => summarizeReport(filteredRows.value))
const hasMeetingRows = computed(() => summary.value.meetingEnvelopeCount > 0)
const hasTitheRows = computed(() => summary.value.titheCount > 0)
const reportCategories = computed(() =>
    usedCategories(allRows.value, report.value?.categories ?? []),
)
const visibleCategories = computed(() => (hasMeetingRows.value ? reportCategories.value : []))
const showUncategorized = computed(
    () => hasMeetingRows.value && allRows.value.some((row) => toCents(row.uncategorizedAmount) > 0),
)
const showTitheColumn = computed(() => hasMeetingRows.value && hasTitheRows.value)
const meetingAggregates = computed(() => groupByMeeting(filteredRows.value))
const titherAggregates = computed(() => groupByTither(filteredRows.value))
const districtAggregates = computed(() => groupByDistrict(filteredRows.value))
const categoryBreakdown = computed(() =>
    categoryTotals(filteredRows.value, visibleCategories.value),
)
const trend = computed(() => buildReportTrend(filteredRows.value, appliedRange.value))

const subjectLabel = computed(() => {
    if (!hasTitheRows.value) return 'Reunión'
    return hasMeetingRows.value ? 'Reunión o diezmador' : 'Diezmador'
})

const trendTitle = computed(() => {
    if (trend.value.granularity === 'day') return 'Recibido por día'
    if (trend.value.granularity === 'week') return 'Recibido por semana'
    return 'Recibido por mes'
})

const trendSubtitle = computed(() => {
    if (!hasTitheRows.value) return 'Suma de los sobres recibidos, según la fecha de la reunión'
    if (!hasMeetingRows.value) return 'Suma de los diezmos recibidos, según la fecha del diezmo'
    return 'Sobres de reunión y diezmos, según la fecha de la reunión o del diezmo'
})

const kpiCards = computed<KpiCard[]>(() => {
    const value = summary.value
    const total: KpiCard = {
        key: 'total',
        label: 'Total recibido',
        value: formatReportMoney(value.totalReceived),
        hint:
            hasMeetingRows.value && hasTitheRows.value
                ? `${formatReportMoney(value.meetingTotal)} de reuniones + ${formatReportMoney(value.titheTotal)} de diezmos`
                : 'contado por el comité en el período',
        icon: Coins,
        highlight: true,
    }
    const balanced: KpiCard = {
        key: 'balanced',
        label: 'Sobres que cuadran',
        value: formatReportPercent(value.balancedRate, 0),
        hint: `${value.balancedCount} de ${value.meetingEnvelopeCount} sobres de reunión`,
        icon: Scale,
    }
    const discrepancies: KpiCard = {
        key: 'discrepancies',
        label: 'Diferencias abiertas',
        value: String(value.openDiscrepancyCount),
        hint: `${value.closedDiscrepancyCount} ya cerradas por finanzas`,
        icon: AlertTriangle,
        warn: value.openDiscrepancyCount > 0,
    }

    if (!hasMeetingRows.value) {
        return [
            total,
            {
                key: 'tithe-envelopes',
                label: 'Sobres de diezmo',
                value: String(value.titheCount),
                hint: `${formatReportMoney(value.averagePerTithe)} por sobre`,
                icon: Inbox,
            },
            {
                key: 'tithers',
                label: 'Diezmadores',
                value: String(value.titherCount),
                hint: 'con al menos un diezmo en el período',
                icon: UsersRound,
            },
            {
                key: 'per-tither',
                label: 'Promedio por diezmador',
                value: formatReportMoney(value.averagePerTither),
                hint: 'en el período',
                icon: HandCoins,
            },
            {
                key: 'largest',
                label: 'Diezmo más alto',
                value: formatReportMoney(value.largestTithe),
                hint: 'en un solo sobre',
                icon: TrendingUp,
            },
        ]
    }

    if (!hasTitheRows.value) {
        return [
            total,
            {
                key: 'meetings',
                label: 'Reuniones',
                value: String(value.meetingCount),
                hint: 'con al menos un sobre recibido',
                icon: ListChecks,
            },
            {
                key: 'envelopes',
                label: 'Sobres recibidos',
                value: String(value.envelopeCount),
                hint: `${formatReportMoney(value.averagePerEnvelope)} por sobre`,
                icon: Inbox,
            },
            {
                key: 'per-meeting',
                label: 'Promedio por reunión',
                value: formatReportMoney(value.averagePerMeeting),
                hint: 'en el período',
                icon: HandCoins,
            },
            balanced,
            discrepancies,
        ]
    }

    return [
        total,
        {
            key: 'meetings',
            label: 'Reuniones',
            value: String(value.meetingCount),
            hint: `${value.meetingEnvelopeCount} sobres · ${formatReportMoney(value.averagePerMeeting)} por reunión`,
            icon: ListChecks,
        },
        {
            key: 'tithes',
            label: TITHES_LABEL,
            value: formatReportMoney(value.titheTotal),
            hint: `${envelopeCountLabel(value.titheCount)} de ${titherCountLabel(value.titherCount)}`,
            icon: HandCoins,
        },
        {
            key: 'envelopes',
            label: 'Sobres recibidos',
            value: String(value.envelopeCount),
            hint: `${formatReportMoney(value.averagePerEnvelope)} por sobre`,
            icon: Inbox,
        },
        balanced,
        discrepancies,
    ]
})

const kpiGridClass = computed(() =>
    kpiCards.value.length === 5 ? '2xl:grid-cols-5' : '2xl:grid-cols-6',
)

const categoryItems = computed(() =>
    categoryBreakdown.value
        .filter((item) => item.amount > 0)
        .map((item) => ({
            id: item.id,
            label: item.name,
            value: item.amount,
            meta: formatReportPercent(item.share),
        })),
)
const districtItems = computed(() =>
    districtAggregates.value
        .filter((item) => item.totalReceived > 0)
        .map((item) => ({
            id: item.key,
            label: item.districtName,
            value: item.totalReceived,
            meta: formatReportPercent(item.share),
        })),
)
const rankingTitle = computed(() =>
    hasMeetingRows.value ? 'Reuniones con más ofrenda recibida' : 'Diezmadores con mayor aporte',
)
const rankingItems = computed(() =>
    hasMeetingRows.value
        ? meetingAggregates.value
              .filter((item) => item.source === 'reunion' && item.totalReceived > 0)
              .map((item) => ({
                  id: item.key,
                  label: `${item.meetingCode} · ${item.meetingTitle}`,
                  value: item.totalReceived,
                  meta: formatReportPercent(item.share),
              }))
        : titherAggregates.value
              .filter((item) => item.totalReceived > 0)
              .map((item) => ({
                  id: item.key,
                  label: item.titherName,
                  value: item.totalReceived,
                  meta: formatReportPercent(item.titheShare),
              })),
)

const envelopeStateItems = computed(() => {
    const value = summary.value
    return [
        { label: 'Cuadran', count: value.balancedCount, tone: 'bg-emerald-500' },
        {
            label: 'Con diferencia abierta',
            count: value.openDiscrepancyCount,
            tone: 'bg-amber-500',
        },
        {
            label: 'Diferencia cerrada por finanzas',
            count: value.closedDiscrepancyCount,
            tone: 'bg-primary',
        },
        {
            label: 'Ingreso directo (cultos generales)',
            count: value.directEntryCount,
            tone: 'bg-on-surface-variant',
        },
    ]
})

function progressWidth(count: number, total: number) {
    return `${total > 0 ? Math.max(count > 0 ? 2 : 0, (count / total) * 100) : 0}%`
}

const activeTab = ref<ReportTab>('reuniones')
const tabs = computed<{ key: ReportTab; label: string; count: number }[]>(() => [
    ...(hasMeetingRows.value
        ? [
              {
                  key: 'reuniones' as const,
                  label: 'Por reunión',
                  count: meetingAggregates.value.length,
              },
          ]
        : []),
    ...(hasTitheRows.value
        ? [
              {
                  key: 'diezmadores' as const,
                  label: 'Por diezmador',
                  count: titherAggregates.value.length,
              },
          ]
        : []),
    { key: 'detalle', label: 'Detalle por sobre', count: filteredRows.value.length },
    { key: 'distritos', label: 'Por distrito', count: districtAggregates.value.length },
])
const currentTab = computed<ReportTab>(() =>
    tabs.value.some((tab) => tab.key === activeTab.value)
        ? activeTab.value
        : (tabs.value[0]?.key ?? 'detalle'),
)

function sumMoney<T>(rows: T[], pick: (row: T) => number) {
    return fromCents(rows.reduce((sum, row) => sum + toCents(pick(row)), 0))
}

function shareOf(amount: number) {
    return summary.value.totalReceived > 0 ? amount / summary.value.totalReceived : 0
}

function averagePer(total: number, count: number) {
    return count > 0 ? fromCents(Math.round(toCents(total) / count)) : 0
}

function stateBadgeClass(state: ReportReceptionState | null) {
    if (state === null) return 'border-primary text-primary'
    if (state === 'diferencia_abierta') {
        return 'border-amber-500 text-amber-700 dark:text-amber-300'
    }
    return 'border-emerald-500 text-emerald-700 dark:text-emerald-300'
}

interface TerritoryItem {
    isGeneral: boolean
    sectorName: string | null
    zoneName: string | null
    districtName: string | null
}

function territoryParts(item: TerritoryItem) {
    if (!item.sectorName) {
        return {
            primary: item.isGeneral ? 'Toda la iglesia' : 'Sin asignar',
            secondary: item.isGeneral ? 'Culto general' : null,
        }
    }
    return {
        primary: item.sectorName,
        secondary: [item.zoneName, item.districtName].filter(Boolean).join(' · ') || null,
    }
}

function aggregateTerritoryParts(item: MeetingReportAggregate) {
    if (item.source === 'diezmo') {
        return { primary: TITHES_TERRITORY_LABEL, secondary: null }
    }
    return territoryParts(item)
}

function territorySearchText(item: TerritoryItem) {
    return (
        [item.sectorName, item.zoneName, item.districtName].filter(Boolean).join(' ') ||
        (item.isGeneral ? 'Toda la iglesia' : 'Sin asignar')
    )
}

function titherCountLabel(count: number) {
    return `${count} ${count === 1 ? 'diezmador' : 'diezmadores'}`
}

function envelopeCountLabel(count: number) {
    return `${count} ${count === 1 ? 'sobre' : 'sobres'}`
}

const moneyCellClass = 'whitespace-nowrap tabular-nums'

function moneyColumn<T>(
    key: string,
    label: string,
    pick: (row: T) => number,
    total: (rows: T[]) => number,
): DataTableColumn<T> {
    return {
        key,
        label,
        sortable: true,
        align: 'right',
        accessor: pick,
        cellClass: moneyCellClass,
        footer: (rows) => formatReportMoney(total(rows)),
        footerClass: moneyCellClass,
    }
}

const meetingColumns = computed<DataTableColumn<MeetingReportAggregate>[]>(() => [
    {
        key: 'meeting',
        label: 'Reunión',
        sortable: true,
        accessor: (row) => `${row.meetingCode} ${row.meetingTitle}`,
        footer: () => 'Total general',
        cellClass: 'min-w-[240px]',
    },
    {
        key: 'territory',
        label: 'Territorio',
        sortable: true,
        accessor: (row) =>
            row.source === 'diezmo' ? TITHES_TERRITORY_LABEL : territorySearchText(row),
        cellClass: 'min-w-[180px]',
    },
    {
        key: 'leaderName',
        label: 'Líder',
        sortable: true,
        accessor: (row) => row.leaderName ?? '',
        cellClass: 'min-w-[160px]',
    },
    {
        key: 'envelopeCount',
        label: 'Sobres',
        sortable: true,
        align: 'center',
        cellClass: moneyCellClass,
        footer: (rows) => rows.reduce((sum, row) => sum + row.envelopeCount, 0),
    },
    ...visibleCategories.value.map((category) =>
        moneyColumn<MeetingReportAggregate>(
            `category-${category.id}`,
            category.name,
            (row) => row.categoryAmounts[category.id] ?? 0,
            (rows) => sumMoney(rows, (row) => row.categoryAmounts[category.id] ?? 0),
        ),
    ),
    ...(showUncategorized.value
        ? [
              moneyColumn<MeetingReportAggregate>(
                  'uncategorized',
                  UNCATEGORIZED_LABEL,
                  (row) => row.uncategorizedAmount,
                  (rows) => sumMoney(rows, (row) => row.uncategorizedAmount),
              ),
          ]
        : []),
    ...(showTitheColumn.value
        ? [
              moneyColumn<MeetingReportAggregate>(
                  'titheAmount',
                  TITHES_LABEL,
                  (row) => row.titheAmount,
                  (rows) => sumMoney(rows, (row) => row.titheAmount),
              ),
          ]
        : []),
    {
        key: 'totalReceived',
        label: 'Total recibido',
        sortable: true,
        align: 'right',
        cellClass: `${moneyCellClass} font-semibold`,
        footer: (rows) => formatReportMoney(sumMoney(rows, (row) => row.totalReceived)),
        footerClass: `${moneyCellClass} text-primary`,
    },
    {
        key: 'averagePerEnvelope',
        label: 'Prom. por sobre',
        sortable: true,
        align: 'right',
        cellClass: moneyCellClass,
        footer: (rows) =>
            formatReportMoney(
                averagePer(
                    sumMoney(rows, (row) => row.totalReceived),
                    rows.reduce((sum, row) => sum + row.envelopeCount, 0),
                ),
            ),
        footerClass: moneyCellClass,
    },
    {
        key: 'share',
        label: '% del total',
        sortable: true,
        align: 'right',
        cellClass: 'min-w-[130px]',
        footer: (rows) => formatReportPercent(shareOf(sumMoney(rows, (row) => row.totalReceived))),
        footerClass: moneyCellClass,
    },
    {
        key: 'openDiscrepancyCount',
        label: 'Dif. abiertas',
        sortable: true,
        align: 'center',
        cellClass: moneyCellClass,
        footer: (rows) => rows.reduce((sum, row) => sum + row.openDiscrepancyCount, 0),
    },
    {
        key: 'lastDate',
        label: 'Última fecha',
        sortable: true,
        cellClass: 'whitespace-nowrap',
    },
    ...(canOpenMeetingHistory.value
        ? [{ key: 'actions', label: '', align: 'center' as const, width: '56px' }]
        : []),
])

const titherColumns = computed<DataTableColumn<TitherReportAggregate>[]>(() => [
    {
        key: 'tither',
        label: 'Diezmador',
        sortable: true,
        accessor: (row) => `${row.titherCode} ${row.titherName}`,
        footer: () => 'Total de diezmos',
        cellClass: 'min-w-[240px]',
    },
    {
        key: 'territory',
        label: 'Territorio',
        sortable: true,
        accessor: territorySearchText,
        cellClass: 'min-w-[180px]',
    },
    {
        key: 'envelopeCount',
        label: 'Sobres',
        sortable: true,
        align: 'center',
        cellClass: moneyCellClass,
        footer: (rows) => rows.reduce((sum, row) => sum + row.envelopeCount, 0),
    },
    {
        key: 'totalReceived',
        label: 'Total recibido',
        sortable: true,
        align: 'right',
        cellClass: `${moneyCellClass} font-semibold`,
        footer: (rows) => formatReportMoney(sumMoney(rows, (row) => row.totalReceived)),
        footerClass: `${moneyCellClass} text-primary`,
    },
    {
        key: 'averagePerEnvelope',
        label: 'Prom. por sobre',
        sortable: true,
        align: 'right',
        cellClass: moneyCellClass,
        footer: (rows) =>
            formatReportMoney(
                averagePer(
                    sumMoney(rows, (row) => row.totalReceived),
                    rows.reduce((sum, row) => sum + row.envelopeCount, 0),
                ),
            ),
        footerClass: moneyCellClass,
    },
    {
        key: 'titheShare',
        label: '% de los diezmos',
        sortable: true,
        align: 'right',
        cellClass: 'min-w-[140px]',
        footer: (rows) =>
            formatReportPercent(
                summary.value.titheTotal > 0
                    ? sumMoney(rows, (row) => row.totalReceived) / summary.value.titheTotal
                    : 0,
            ),
        footerClass: moneyCellClass,
    },
    {
        key: 'lastDate',
        label: 'Último diezmo',
        sortable: true,
        cellClass: 'whitespace-nowrap',
    },
])

const detailColumns = computed<DataTableColumn<MeetingReportRow>[]>(() => [
    {
        key: 'date',
        label: 'Fecha',
        sortable: true,
        footer: () => 'Total general',
        cellClass: 'whitespace-nowrap',
    },
    {
        key: 'subject',
        label: subjectLabel.value,
        sortable: true,
        accessor: (row) => `${reportRowCode(row)} ${reportRowTitle(row)} ${row.notes ?? ''}`,
        cellClass: 'min-w-[240px]',
    },
    {
        key: 'territory',
        label: 'Territorio',
        sortable: true,
        accessor: territorySearchText,
        cellClass: 'min-w-[180px]',
    },
    ...(hasMeetingRows.value
        ? [
              {
                  key: 'leaderName',
                  label: 'Líder',
                  sortable: true,
                  accessor: (row: MeetingReportRow) => row.leaderName ?? '',
                  cellClass: 'min-w-[150px]',
              },
          ]
        : []),
    ...visibleCategories.value.map((category) =>
        moneyColumn<MeetingReportRow>(
            `category-${category.id}`,
            category.name,
            (row) => sumCategory([row], category.id),
            (rows) => sumCategory(rows, category.id),
        ),
    ),
    ...(showUncategorized.value
        ? [
              moneyColumn<MeetingReportRow>(
                  'uncategorized',
                  UNCATEGORIZED_LABEL,
                  (row) => row.uncategorizedAmount,
                  sumUncategorized,
              ),
          ]
        : []),
    ...(showTitheColumn.value
        ? [
              moneyColumn<MeetingReportRow>(
                  'titheAmount',
                  TITHES_LABEL,
                  (row) => (isTitheRow(row) ? row.receivedAmount : 0),
                  sumTithes,
              ),
          ]
        : []),
    {
        key: 'receivedAmount',
        label: 'Total recibido',
        sortable: true,
        align: 'right',
        cellClass: `${moneyCellClass} font-semibold`,
        footer: (rows) => formatReportMoney(sumReceived(rows)),
        footerClass: `${moneyCellClass} text-primary`,
    },
    {
        key: 'state',
        label: 'Estado del sobre',
        sortable: true,
        align: 'center',
        accessor: (row) => reportStateLabel(receptionState(row)),
    },
    {
        key: 'receivedBy',
        label: 'Recibido por',
        sortable: true,
        accessor: (row) => row.receivedByName ?? '',
        cellClass: 'min-w-[170px]',
    },
])

const districtColumns = computed<DataTableColumn<DistrictReportAggregate>[]>(() => [
    {
        key: 'districtName',
        label: 'Distrito',
        sortable: true,
        footer: () => 'Total general',
        cellClass: 'min-w-[200px] font-semibold',
    },
    ...(hasMeetingRows.value
        ? [
              {
                  key: 'meetingCount',
                  label: 'Reuniones',
                  sortable: true,
                  align: 'right' as const,
                  cellClass: moneyCellClass,
                  footer: (rows: DistrictReportAggregate[]) =>
                      rows.reduce((sum, row) => sum + row.meetingCount, 0),
              },
          ]
        : []),
    ...(hasTitheRows.value
        ? [
              {
                  key: 'titherCount',
                  label: 'Diezmadores',
                  sortable: true,
                  align: 'right' as const,
                  cellClass: moneyCellClass,
                  footer: (rows: DistrictReportAggregate[]) =>
                      rows.reduce((sum, row) => sum + row.titherCount, 0),
              },
          ]
        : []),
    {
        key: 'envelopeCount',
        label: 'Sobres',
        sortable: true,
        align: 'right',
        cellClass: moneyCellClass,
        footer: (rows) => rows.reduce((sum, row) => sum + row.envelopeCount, 0),
    },
    {
        key: 'totalReceived',
        label: 'Total recibido',
        sortable: true,
        align: 'right',
        cellClass: `${moneyCellClass} font-semibold`,
        footer: (rows) => formatReportMoney(sumMoney(rows, (row) => row.totalReceived)),
        footerClass: `${moneyCellClass} text-primary`,
    },
    {
        key: 'averagePerEnvelope',
        label: 'Prom. por sobre',
        sortable: true,
        align: 'right',
        cellClass: moneyCellClass,
        footer: (rows) =>
            formatReportMoney(
                averagePer(
                    sumMoney(rows, (row) => row.totalReceived),
                    rows.reduce((sum, row) => sum + row.envelopeCount, 0),
                ),
            ),
        footerClass: moneyCellClass,
    },
    {
        key: 'share',
        label: '% del total',
        sortable: true,
        align: 'right',
        cellClass: 'min-w-[130px]',
        footer: (rows) => formatReportPercent(shareOf(sumMoney(rows, (row) => row.totalReceived))),
        footerClass: moneyCellClass,
    },
])

const exportingFormat = ref<ExportFormat | null>(null)
const canDownload = computed(
    () => canExport.value && !!report.value && filteredRows.value.length > 0 && !isStale.value,
)

const exportContext = computed<MeetingReportExportContext>(() => ({
    appName: appName.value,
    title: REPORT_TITLE,
    subtitle: REPORT_SUBTITLE,
    range: appliedRange.value,
    generatedAt: report.value?.generatedAt ?? new Date().toISOString(),
    filterLabels: filterLabels.value,
    summary: summary.value,
    categories: visibleCategories.value,
    showUncategorized: showUncategorized.value,
    showTitheColumn: showTitheColumn.value,
    categoryTotals: categoryBreakdown.value,
    meetings: meetingAggregates.value,
    tithers: titherAggregates.value,
    districts: districtAggregates.value,
    rows: filteredRows.value,
}))

const exportLabels: Record<ExportFormat, string> = {
    excel: 'Excel',
    pdf: 'PDF',
    'csv-reuniones': 'CSV por reunión',
    'csv-diezmadores': 'CSV por diezmador',
    'csv-detalle': 'CSV de detalle',
}

async function runExport(format: ExportFormat) {
    if (!canDownload.value || exportingFormat.value) return
    exportingFormat.value = format
    try {
        const context = exportContext.value
        if (format === 'excel') await exportMeetingReportExcel(context)
        else if (format === 'pdf') await exportMeetingReportPdf(context)
        else exportMeetingReportCsv(context, format.replace('csv-', '') as MeetingReportCsvKind)
        toast.success(`Reporte exportado en ${exportLabels[format]}`)
    } catch {
        toast.error(`No fue posible exportar el reporte en ${exportLabels[format]}`)
    } finally {
        exportingFormat.value = null
    }
}

function openMeetingHistory(meetingId: number) {
    return navigateTo(`/finanzas/ofrendas/reunion/${meetingId}`)
}

function errorMessage(error: unknown) {
    return error instanceof Error && error.message
        ? error.message
        : 'No fue posible generar el reporte'
}

const filterLabelClass =
    'mb-1.5 block text-[10px] font-semibold uppercase tracking-wider text-on-surface-variant'
const kpiLabelClass = 'text-[11px] font-semibold uppercase tracking-wider text-on-surface-variant'
const menuItemClass =
    'flex cursor-pointer items-center gap-3 px-4 py-2.5 text-sm text-on-surface outline-none transition-colors data-[disabled]:cursor-not-allowed data-[disabled]:opacity-50 data-[highlighted]:bg-surface-container-high data-[highlighted]:text-primary'
</script>

<template>
    <main class="w-full px-4 pb-24 pt-24 sm:px-6 lg:px-8 2xl:px-12">
        <section
            class="flex flex-col gap-6 border-b border-outline-variant pb-8 lg:flex-row lg:items-end lg:justify-between"
        >
            <div class="min-w-0">
                <p class="text-xs font-semibold uppercase tracking-[0.4em] text-on-surface-variant">
                    Reportería · Ofrendas y diezmos
                </p>
                <h1 class="mt-4 font-display text-4xl font-semibold text-on-surface md:text-5xl">
                    {{ REPORT_TITLE }}
                </h1>
                <p class="mt-3 max-w-2xl text-sm leading-relaxed text-on-surface-variant">
                    Solo lo que el comité de apoyo recibió y contó: los sobres de las reuniones y
                    los diezmos, con su total del período y su desglose por categoría, territorio,
                    diezmador y fecha.
                </p>
            </div>

            <div class="flex flex-wrap items-center gap-3">
                <span
                    v-if="isRefreshing"
                    class="inline-flex items-center gap-2 text-xs text-on-surface-variant"
                >
                    <Loader2 class="size-3.5 animate-spin" /> Actualizando…
                </span>
                <UiButton
                    variant="outline"
                    type="button"
                    class="h-10 rounded px-4 text-xs uppercase tracking-wider"
                    :disabled="reportQuery.isFetching.value"
                    @click="reportQuery.refetch()"
                >
                    <RefreshCw class="size-4" /> Actualizar
                </UiButton>
                <DropdownMenuRoot v-if="canExport">
                    <DropdownMenuTrigger as-child>
                        <UiButton
                            type="button"
                            class="h-10 rounded px-5 text-xs uppercase tracking-wider"
                            :disabled="!canDownload || exportingFormat !== null"
                        >
                            <Loader2 v-if="exportingFormat" class="size-4 animate-spin" />
                            <Download v-else class="size-4" />
                            Exportar
                            <ChevronDown class="size-4" />
                        </UiButton>
                    </DropdownMenuTrigger>
                    <DropdownMenuPortal>
                        <DropdownMenuContent
                            :side-offset="8"
                            align="end"
                            class="z-50 w-72 overflow-hidden rounded-md border border-outline-variant bg-surface-container py-2 shadow-lg focus:outline-none"
                        >
                            <DropdownMenuLabel
                                class="px-4 pb-2 pt-1 text-[10px] font-semibold uppercase tracking-wider text-on-surface-variant"
                            >
                                {{ rangeLabel }}
                            </DropdownMenuLabel>
                            <DropdownMenuItem :class="menuItemClass" @select="runExport('excel')">
                                <FileSpreadsheet class="size-4 text-emerald-600" />
                                <span class="flex flex-col">
                                    <span class="font-semibold">Excel (.xlsx)</span>
                                    <span class="text-xs text-on-surface-variant">
                                        Resumen, totales y detalle por sobre
                                    </span>
                                </span>
                            </DropdownMenuItem>
                            <DropdownMenuItem :class="menuItemClass" @select="runExport('pdf')">
                                <FileText class="size-4 text-destructive" />
                                <span class="flex flex-col">
                                    <span class="font-semibold">PDF</span>
                                    <span class="text-xs text-on-surface-variant">
                                        Reporte listo para imprimir
                                    </span>
                                </span>
                            </DropdownMenuItem>
                            <DropdownMenuSeparator class="my-1 h-px bg-outline-variant" />
                            <DropdownMenuItem
                                v-if="hasMeetingRows"
                                :class="menuItemClass"
                                @select="runExport('csv-reuniones')"
                            >
                                <Sheet class="size-4 text-on-surface-variant" />
                                <span class="flex flex-col">
                                    <span class="font-semibold">CSV por reunión</span>
                                    <span class="text-xs text-on-surface-variant">
                                        Una fila por reunión con su total
                                    </span>
                                </span>
                            </DropdownMenuItem>
                            <DropdownMenuItem
                                v-if="hasTitheRows"
                                :class="menuItemClass"
                                @select="runExport('csv-diezmadores')"
                            >
                                <Sheet class="size-4 text-on-surface-variant" />
                                <span class="flex flex-col">
                                    <span class="font-semibold">CSV por diezmador</span>
                                    <span class="text-xs text-on-surface-variant">
                                        Una fila por diezmador con su total
                                    </span>
                                </span>
                            </DropdownMenuItem>
                            <DropdownMenuItem
                                :class="menuItemClass"
                                @select="runExport('csv-detalle')"
                            >
                                <Sheet class="size-4 text-on-surface-variant" />
                                <span class="flex flex-col">
                                    <span class="font-semibold">CSV de detalle</span>
                                    <span class="text-xs text-on-surface-variant">
                                        Una fila por sobre o diezmo recibido
                                    </span>
                                </span>
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenuPortal>
                </DropdownMenuRoot>
            </div>
        </section>

        <section class="mt-8 rounded-xl border border-outline-variant bg-surface-container-low p-4">
            <div class="flex flex-col gap-4 xl:flex-row xl:items-end">
                <div class="w-full xl:max-w-xs">
                    <span :class="filterLabelClass"
                        >Período (fecha de la reunión o del diezmo)</span
                    >
                    <UiDatePicker
                        v-model="pickerRange"
                        mode="range"
                        :clearable="false"
                        :max-year="new Date().getFullYear() + 1"
                        placeholder="Selecciona el rango"
                    />
                </div>
                <div class="flex flex-wrap gap-2">
                    <button
                        v-for="preset in reportRangePresets"
                        :key="preset.key"
                        type="button"
                        class="rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors"
                        :class="
                            activePreset === preset.key
                                ? 'border-primary bg-primary text-primary-foreground'
                                : 'border-outline-variant text-on-surface-variant hover:border-primary hover:text-primary'
                        "
                        @click="applyPreset(preset.key)"
                    >
                        {{ preset.label }}
                    </button>
                </div>
                <p
                    class="inline-flex items-center gap-2 text-xs text-on-surface-variant xl:ml-auto"
                >
                    <CalendarRange class="size-4 text-primary" />
                    {{ rangeLabel }} · {{ rangeLength }} {{ rangeLength === 1 ? 'día' : 'días' }}
                </p>
            </div>

            <div
                class="mt-4 grid gap-3 border-t border-outline-variant pt-4 sm:grid-cols-2 xl:grid-cols-6"
            >
                <div>
                    <span :class="filterLabelClass">Alcance</span>
                    <UiSearchSelect
                        v-model="filters.kind"
                        :options="kindOptions"
                        :searchable="false"
                        aria-label="Alcance del reporte"
                    />
                </div>
                <div>
                    <span :class="filterLabelClass">Tipo de reunión</span>
                    <UiSearchSelect
                        v-model="filters.meetingTypeIds"
                        :options="meetingTypeOptions"
                        multiple
                        clearable
                        :disabled="isTithesOnly || meetingTypeOptions.length === 0"
                        placeholder="Todos los tipos"
                        search-placeholder="Buscar tipo..."
                    />
                </div>
                <div>
                    <span :class="filterLabelClass">Distrito</span>
                    <UiSearchSelect
                        v-model="filters.districtId"
                        :options="districtOptions"
                        clearable
                        :disabled="filters.kind === 'generales' || districtOptions.length === 0"
                        placeholder="Todos los distritos"
                        search-placeholder="Buscar distrito..."
                    />
                </div>
                <div>
                    <span :class="filterLabelClass">Zona</span>
                    <UiSearchSelect
                        v-model="filters.zoneId"
                        :options="zoneOptions"
                        clearable
                        :disabled="filters.kind === 'generales' || zoneOptions.length === 0"
                        placeholder="Todas las zonas"
                        search-placeholder="Buscar zona..."
                    />
                </div>
                <div>
                    <span :class="filterLabelClass">Sector</span>
                    <UiSearchSelect
                        v-model="filters.sectorId"
                        :options="sectorOptions"
                        clearable
                        :disabled="filters.kind === 'generales' || sectorOptions.length === 0"
                        placeholder="Todos los sectores"
                        search-placeholder="Buscar sector..."
                    />
                </div>
                <div>
                    <span :class="filterLabelClass">Estado del sobre</span>
                    <UiSearchSelect
                        v-model="filters.state"
                        :options="stateOptions"
                        :searchable="false"
                        :disabled="isTithesOnly"
                        aria-label="Estado del sobre"
                    />
                </div>
            </div>

            <div
                v-if="hasActiveFilters"
                class="mt-3 flex flex-wrap items-center gap-2 border-t border-outline-variant pt-3"
            >
                <span
                    v-for="label in filterLabels"
                    :key="label"
                    class="rounded-full border border-outline-variant bg-surface px-2.5 py-1 text-[11px] text-on-surface-variant"
                >
                    {{ label }}
                </span>
                <button
                    type="button"
                    class="ml-auto inline-flex items-center gap-2 rounded-md border border-outline-variant px-3 py-1.5 text-xs font-semibold uppercase tracking-wider text-on-surface-variant transition-colors hover:border-primary hover:text-primary"
                    @click="clearFilters"
                >
                    <FilterX class="size-3.5" /> Limpiar filtros
                </button>
            </div>
        </section>

        <div
            v-if="isInitialLoading"
            class="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-6"
            aria-busy="true"
        >
            <div
                v-for="index in 6"
                :key="index"
                class="h-32 animate-pulse rounded-lg border border-outline-variant bg-surface-container"
            />
            <div
                class="h-96 animate-pulse rounded-lg border border-outline-variant bg-surface-container sm:col-span-2 lg:col-span-3 2xl:col-span-6"
            />
        </div>

        <div
            v-else-if="reportQuery.isError.value && !report"
            class="mt-8 rounded-xl border border-outline-variant bg-surface-container-low px-6 py-16 text-center"
        >
            <AlertTriangle class="mx-auto size-10 text-destructive" />
            <h2 class="mt-3 font-display text-2xl font-semibold text-on-surface">
                No se pudo generar el reporte
            </h2>
            <p class="mt-2 text-sm text-on-surface-variant">
                {{ errorMessage(reportQuery.error.value) }}
            </p>
            <UiButton
                variant="outline"
                type="button"
                class="mt-4 h-10 rounded px-5 text-xs uppercase tracking-wider"
                @click="reportQuery.refetch()"
            >
                <RefreshCw class="size-4" /> Reintentar
            </UiButton>
        </div>

        <div
            v-else-if="allRows.length === 0"
            class="mt-8 rounded-xl border border-outline-variant bg-surface-container-low px-6 py-16 text-center"
        >
            <Inbox class="mx-auto size-10 text-primary" />
            <h2 class="mt-3 font-display text-2xl font-semibold text-on-surface">
                Sin sobres ni diezmos recibidos en este período
            </h2>
            <p class="mt-2 text-sm text-on-surface-variant">
                El comité de apoyo no ha recibido sobres de reuniones ni diezmos entre
                {{ rangeLabel }} dentro de tu alcance. Prueba con otro rango.
            </p>
        </div>

        <template v-else>
            <div
                class="transition-opacity duration-200"
                :class="isStale ? 'pointer-events-none opacity-60' : ''"
            >
                <div
                    v-if="filteredRows.length === 0"
                    class="mt-8 rounded-xl border border-outline-variant bg-surface-container-low px-6 py-16 text-center"
                >
                    <FilterX class="mx-auto size-10 text-primary" />
                    <h2 class="mt-3 font-display text-2xl font-semibold text-on-surface">
                        Sin coincidencias
                    </h2>
                    <p class="mt-2 text-sm text-on-surface-variant">
                        {{
                            isTithesOnly
                                ? 'Ningún diezmo recibido coincide con los filtros aplicados.'
                                : 'Ningún sobre recibido coincide con los filtros aplicados.'
                        }}
                    </p>
                    <UiButton
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
                        class="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
                        :class="kpiGridClass"
                    >
                        <UiCard
                            v-for="card in kpiCards"
                            :key="card.key"
                            class="p-5"
                            :class="
                                card.highlight ? 'border-primary sm:col-span-2 lg:col-span-1' : ''
                            "
                        >
                            <div class="flex items-center justify-between">
                                <p :class="kpiLabelClass">{{ card.label }}</p>
                                <component
                                    :is="card.icon"
                                    class="size-4"
                                    :class="
                                        card.warn
                                            ? 'text-amber-600 dark:text-amber-300'
                                            : 'text-primary'
                                    "
                                />
                            </div>
                            <p
                                class="mt-2 font-display text-3xl font-semibold tabular-nums"
                                :class="card.highlight ? 'text-primary' : 'text-on-surface'"
                            >
                                {{ card.value }}
                            </p>
                            <p class="mt-1 text-xs text-on-surface-variant">{{ card.hint }}</p>
                        </UiCard>
                    </section>

                    <section class="mt-4 grid gap-4 xl:grid-cols-3">
                        <UiCard class="p-6 xl:col-span-2">
                            <div class="mb-5 flex items-start gap-2">
                                <TrendingUp class="mt-0.5 size-4 shrink-0 text-primary" />
                                <div class="min-w-0">
                                    <h2 class="text-sm font-semibold text-on-surface">
                                        {{ trendTitle }}
                                    </h2>
                                    <p class="mt-0.5 text-[11px] text-on-surface-variant">
                                        {{ trendSubtitle }}
                                    </p>
                                </div>
                                <span class="ml-auto shrink-0 text-[11px] text-on-surface-variant">
                                    {{ rangeLabel }}
                                </span>
                            </div>
                            <ColumnChart
                                :values="trend.received"
                                format="currency"
                                :label="trendTitle"
                                empty-message="No hay montos recibidos en el período."
                            />
                        </UiCard>

                        <UiCard class="p-6">
                            <div class="mb-5 flex items-start gap-2">
                                <PieChart class="mt-0.5 size-4 shrink-0 text-primary" />
                                <div class="min-w-0">
                                    <h2 class="text-sm font-semibold text-on-surface">
                                        Por categoría
                                    </h2>
                                    <p class="mt-0.5 text-[11px] text-on-surface-variant">
                                        Cómo se compone lo recibido
                                    </p>
                                </div>
                            </div>
                            <RankedBarList
                                :items="categoryItems"
                                label="Recibido por categoría"
                                :limit="8"
                                empty-message="Sin montos por categoría."
                            />
                        </UiCard>
                    </section>

                    <section class="mt-4 grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
                        <UiCard class="p-6">
                            <div class="mb-5 flex items-start gap-2">
                                <BarChart3 class="mt-0.5 size-4 shrink-0 text-primary" />
                                <div class="min-w-0">
                                    <h2 class="text-sm font-semibold text-on-surface">
                                        {{ rankingTitle }}
                                    </h2>
                                    <p class="mt-0.5 text-[11px] text-on-surface-variant">
                                        {{
                                            hasMeetingRows
                                                ? 'Participación sobre el total'
                                                : 'Participación sobre el total de diezmos'
                                        }}
                                    </p>
                                </div>
                            </div>
                            <RankedBarList
                                :items="rankingItems"
                                :label="rankingTitle"
                                :limit="6"
                                empty-message="Sin montos recibidos."
                            />
                        </UiCard>

                        <UiCard class="p-6">
                            <div class="mb-5 flex items-start gap-2">
                                <MapPinned class="mt-0.5 size-4 shrink-0 text-primary" />
                                <div class="min-w-0">
                                    <h2 class="text-sm font-semibold text-on-surface">
                                        Por distrito
                                    </h2>
                                    <p class="mt-0.5 text-[11px] text-on-surface-variant">
                                        Según el sector de cada reunión o diezmador; las reuniones
                                        sin sector cuentan como toda la iglesia
                                    </p>
                                </div>
                            </div>
                            <RankedBarList
                                :items="districtItems"
                                label="Recibido por distrito"
                                :limit="6"
                                empty-message="Sin montos recibidos."
                            />
                        </UiCard>

                        <UiCard class="p-6 lg:col-span-2 xl:col-span-1">
                            <div class="mb-5 flex items-start gap-2">
                                <ClipboardCheck class="mt-0.5 size-4 shrink-0 text-primary" />
                                <div class="min-w-0">
                                    <h2 class="text-sm font-semibold text-on-surface">
                                        Estado de los sobres
                                    </h2>
                                    <p class="mt-0.5 text-[11px] text-on-surface-variant">
                                        {{ summary.meetingEnvelopeCount }} sobres de reunión en el
                                        período
                                    </p>
                                </div>
                            </div>
                            <ul v-if="hasMeetingRows" class="flex flex-col gap-4">
                                <li v-for="item in envelopeStateItems" :key="item.label">
                                    <div class="mb-1.5 flex items-baseline justify-between gap-4">
                                        <span class="text-sm text-on-surface">
                                            {{ item.label }}
                                        </span>
                                        <span
                                            class="shrink-0 text-sm font-semibold tabular-nums text-on-surface"
                                        >
                                            {{ item.count }}
                                            <span class="font-normal text-on-surface-variant">
                                                / {{ summary.meetingEnvelopeCount }}
                                            </span>
                                        </span>
                                    </div>
                                    <div
                                        class="h-2 w-full overflow-hidden rounded-full bg-surface-container-high"
                                    >
                                        <div
                                            class="h-full rounded-full transition-[width] duration-500"
                                            :class="item.tone"
                                            :style="{
                                                width: progressWidth(
                                                    item.count,
                                                    summary.meetingEnvelopeCount,
                                                ),
                                            }"
                                        />
                                    </div>
                                </li>
                            </ul>
                            <p
                                v-if="hasTitheRows"
                                class="text-xs leading-relaxed text-on-surface-variant"
                                :class="
                                    hasMeetingRows
                                        ? 'mt-5 border-t border-outline-variant pt-4'
                                        : ''
                                "
                            >
                                {{
                                    summary.titheCount === 1
                                        ? 'El sobre de diezmo no se cuadra'
                                        : `Los ${summary.titheCount} sobres de diezmo no se cuadran`
                                }}: no hay un monto reportado por un líder contra el cual
                                compararlos.
                            </p>
                        </UiCard>
                    </section>

                    <section class="mt-8">
                        <div
                            class="mb-4 flex flex-col gap-3 md:flex-row md:items-end md:justify-between"
                        >
                            <div>
                                <h2 class="font-display text-2xl font-semibold text-on-surface">
                                    Detalle del reporte
                                </h2>
                                <p class="mt-1 text-xs text-on-surface-variant">
                                    La fila de totales suma todas las filas que coinciden con la
                                    búsqueda, no solo la página visible.
                                </p>
                            </div>
                            <div
                                class="inline-flex flex-wrap rounded-lg border border-outline-variant bg-surface-container-low p-1"
                                role="tablist"
                            >
                                <button
                                    v-for="tab in tabs"
                                    :key="tab.key"
                                    type="button"
                                    role="tab"
                                    :aria-selected="currentTab === tab.key"
                                    class="inline-flex items-center gap-2 rounded-md px-4 py-2 text-xs font-semibold uppercase tracking-wider transition-colors"
                                    :class="
                                        currentTab === tab.key
                                            ? 'bg-primary text-primary-foreground'
                                            : 'text-on-surface-variant hover:text-on-surface'
                                    "
                                    @click="activeTab = tab.key"
                                >
                                    {{ tab.label }}
                                    <span
                                        class="rounded-full px-1.5 py-0.5 text-[10px] tabular-nums"
                                        :class="
                                            currentTab === tab.key
                                                ? 'bg-primary-foreground text-primary'
                                                : 'bg-surface-container-high'
                                        "
                                    >
                                        {{ tab.count }}
                                    </span>
                                </button>
                            </div>
                        </div>

                        <DataTable
                            v-if="currentTab === 'reuniones'"
                            :rows="meetingAggregates"
                            :columns="meetingColumns"
                            row-key="key"
                            :page-size="25"
                            :page-size-options="[10, 25, 50, 100, 250]"
                            show-search
                            dense
                            search-placeholder="Buscar reunión, código, territorio o líder..."
                            empty-message="Ninguna reunión coincide con la búsqueda."
                        >
                            <template #cell-meeting="{ row }">
                                <div class="flex items-start gap-3">
                                    <span
                                        class="mt-1.5 size-2.5 shrink-0 rounded-full"
                                        :style="{ backgroundColor: row.meetingColor }"
                                    />
                                    <div class="min-w-0">
                                        <p class="font-semibold text-on-surface">
                                            {{ row.meetingTitle }}
                                        </p>
                                        <p
                                            class="mt-0.5 text-[11px] uppercase tracking-wider text-on-surface-variant"
                                        >
                                            <template v-if="row.source === 'diezmo'">
                                                A nombre de cada diezmador
                                            </template>
                                            <template v-else>
                                                {{ row.meetingCode }} · {{ row.meetingTypeName }}
                                                <span v-if="!row.isMeetingActive">· Inactiva</span>
                                            </template>
                                        </p>
                                    </div>
                                </div>
                            </template>
                            <template #cell-territory="{ row }">
                                <p class="text-on-surface">
                                    {{ aggregateTerritoryParts(row).primary }}
                                </p>
                                <p
                                    v-if="aggregateTerritoryParts(row).secondary"
                                    class="mt-0.5 text-[11px] text-on-surface-variant"
                                >
                                    {{ aggregateTerritoryParts(row).secondary }}
                                </p>
                            </template>
                            <template #cell-leaderName="{ row }">
                                <span
                                    v-if="row.source === 'diezmo'"
                                    class="text-on-surface-variant"
                                >
                                    {{ titherCountLabel(summary.titherCount) }}
                                </span>
                                <span
                                    v-else
                                    :class="row.leaderName ? '' : 'text-on-surface-variant'"
                                >
                                    {{ row.leaderName ?? 'Sin líder' }}
                                </span>
                            </template>
                            <template
                                v-for="category in visibleCategories"
                                :key="category.id"
                                #[`cell-category-${category.id}`]="{ row }"
                            >
                                <span
                                    :class="
                                        row.categoryAmounts[category.id]
                                            ? ''
                                            : 'text-on-surface-variant'
                                    "
                                >
                                    {{ formatReportMoney(row.categoryAmounts[category.id] ?? 0) }}
                                </span>
                            </template>
                            <template #cell-uncategorized="{ row }">
                                <span
                                    :class="
                                        row.uncategorizedAmount ? '' : 'text-on-surface-variant'
                                    "
                                >
                                    {{ formatReportMoney(row.uncategorizedAmount) }}
                                </span>
                            </template>
                            <template #cell-titheAmount="{ row }">
                                <span :class="row.titheAmount ? '' : 'text-on-surface-variant'">
                                    {{ formatReportMoney(row.titheAmount) }}
                                </span>
                            </template>
                            <template #cell-totalReceived="{ row }">
                                {{ formatReportMoney(row.totalReceived) }}
                            </template>
                            <template #cell-averagePerEnvelope="{ row }">
                                {{ formatReportMoney(row.averagePerEnvelope) }}
                            </template>
                            <template #cell-share="{ row }">
                                <div class="flex items-center justify-end gap-2">
                                    <div
                                        class="h-1.5 w-16 overflow-hidden rounded-full bg-surface-container-high"
                                    >
                                        <div
                                            class="h-full rounded-full bg-primary"
                                            :style="{ width: `${Math.min(100, row.share * 100)}%` }"
                                        />
                                    </div>
                                    <span class="w-14 text-right tabular-nums">
                                        {{ formatReportPercent(row.share) }}
                                    </span>
                                </div>
                            </template>
                            <template #cell-openDiscrepancyCount="{ row }">
                                <span
                                    v-if="row.source === 'diezmo'"
                                    class="text-on-surface-variant"
                                >
                                    —
                                </span>
                                <span
                                    v-else-if="row.openDiscrepancyCount > 0"
                                    class="font-semibold text-amber-700 dark:text-amber-300"
                                >
                                    {{ row.openDiscrepancyCount }}
                                </span>
                                <span v-else class="text-on-surface-variant">0</span>
                            </template>
                            <template #cell-lastDate="{ row }">
                                {{ formatReportDate(row.lastDate) }}
                            </template>
                            <template #cell-actions="{ row }">
                                <button
                                    v-if="row.meetingId !== null"
                                    type="button"
                                    class="inline-flex size-8 items-center justify-center rounded border border-outline-variant text-on-surface-variant transition-colors hover:border-primary hover:text-primary"
                                    :aria-label="`Ver historial de ${row.meetingTitle}`"
                                    title="Ver historial de la reunión"
                                    @click="openMeetingHistory(row.meetingId)"
                                >
                                    <ExternalLink class="size-3.5" />
                                </button>
                            </template>
                        </DataTable>

                        <DataTable
                            v-else-if="currentTab === 'diezmadores'"
                            :rows="titherAggregates"
                            :columns="titherColumns"
                            row-key="key"
                            :page-size="25"
                            :page-size-options="[10, 25, 50, 100, 250]"
                            show-search
                            dense
                            search-placeholder="Buscar diezmador, código o territorio..."
                            empty-message="Ningún diezmador coincide con la búsqueda."
                        >
                            <template #cell-tither="{ row }">
                                <div class="flex items-start gap-3">
                                    <span
                                        class="mt-1.5 size-2.5 shrink-0 rounded-full"
                                        :style="{ backgroundColor: TITHE_COLOR }"
                                    />
                                    <div class="min-w-0">
                                        <p class="font-semibold text-on-surface">
                                            {{ row.titherName }}
                                        </p>
                                        <p
                                            class="mt-0.5 text-[11px] uppercase tracking-wider text-on-surface-variant"
                                        >
                                            {{ row.titherCode }}
                                        </p>
                                    </div>
                                </div>
                            </template>
                            <template #cell-territory="{ row }">
                                <p class="text-on-surface">
                                    {{ territoryParts(row).primary }}
                                </p>
                                <p
                                    v-if="territoryParts(row).secondary"
                                    class="mt-0.5 text-[11px] text-on-surface-variant"
                                >
                                    {{ territoryParts(row).secondary }}
                                </p>
                            </template>
                            <template #cell-totalReceived="{ row }">
                                {{ formatReportMoney(row.totalReceived) }}
                            </template>
                            <template #cell-averagePerEnvelope="{ row }">
                                {{ formatReportMoney(row.averagePerEnvelope) }}
                            </template>
                            <template #cell-titheShare="{ row }">
                                <div class="flex items-center justify-end gap-2">
                                    <div
                                        class="h-1.5 w-16 overflow-hidden rounded-full bg-surface-container-high"
                                    >
                                        <div
                                            class="h-full rounded-full bg-primary"
                                            :style="{
                                                width: `${Math.min(100, row.titheShare * 100)}%`,
                                            }"
                                        />
                                    </div>
                                    <span class="w-14 text-right tabular-nums">
                                        {{ formatReportPercent(row.titheShare) }}
                                    </span>
                                </div>
                            </template>
                            <template #cell-lastDate="{ row }">
                                {{ formatReportDate(row.lastDate) }}
                            </template>
                        </DataTable>

                        <DataTable
                            v-else-if="currentTab === 'detalle'"
                            :rows="filteredRows"
                            :columns="detailColumns"
                            row-key="key"
                            :page-size="25"
                            :page-size-options="[10, 25, 50, 100, 250]"
                            show-search
                            dense
                            search-placeholder="Buscar fecha, reunión, diezmador, territorio o quién recibió..."
                            empty-message="Ningún sobre coincide con la búsqueda."
                        >
                            <template #cell-date="{ row }">
                                <p class="font-semibold tabular-nums text-on-surface">
                                    {{ formatReportDate(row.date) }}
                                </p>
                                <p class="mt-0.5 text-[11px] capitalize text-on-surface-variant">
                                    {{ formatReportWeekday(row.date) }}
                                </p>
                            </template>
                            <template #cell-subject="{ row }">
                                <div class="flex items-start gap-3">
                                    <span
                                        class="mt-1.5 size-2.5 shrink-0 rounded-full"
                                        :style="{ backgroundColor: reportRowColor(row) }"
                                    />
                                    <div class="min-w-0">
                                        <p class="font-semibold text-on-surface">
                                            {{ reportRowTitle(row) }}
                                        </p>
                                        <p
                                            class="mt-0.5 text-[11px] uppercase tracking-wider text-on-surface-variant"
                                        >
                                            {{ reportRowCode(row) }} · {{ reportRowType(row) }}
                                        </p>
                                        <p
                                            v-if="row.notes"
                                            class="mt-1 text-[11px] italic text-on-surface-variant"
                                        >
                                            {{ row.notes }}
                                        </p>
                                    </div>
                                </div>
                            </template>
                            <template #cell-territory="{ row }">
                                <p class="text-on-surface">
                                    {{ territoryParts(row).primary }}
                                </p>
                                <p
                                    v-if="territoryParts(row).secondary"
                                    class="mt-0.5 text-[11px] text-on-surface-variant"
                                >
                                    {{ territoryParts(row).secondary }}
                                </p>
                            </template>
                            <template #cell-leaderName="{ row }">
                                <span v-if="isTitheRow(row)" class="text-on-surface-variant">
                                    —
                                </span>
                                <span
                                    v-else
                                    :class="row.leaderName ? '' : 'text-on-surface-variant'"
                                >
                                    {{ row.leaderName ?? 'Sin líder' }}
                                </span>
                            </template>
                            <template
                                v-for="category in visibleCategories"
                                :key="category.id"
                                #[`cell-category-${category.id}`]="{ row }"
                            >
                                {{ formatReportMoney(sumCategory([row], category.id)) }}
                            </template>
                            <template #cell-uncategorized="{ row }">
                                {{ formatReportMoney(row.uncategorizedAmount) }}
                            </template>
                            <template #cell-titheAmount="{ row }">
                                {{ formatReportMoney(isTitheRow(row) ? row.receivedAmount : 0) }}
                            </template>
                            <template #cell-receivedAmount="{ row }">
                                {{ formatReportMoney(row.receivedAmount) }}
                            </template>
                            <template #cell-state="{ row }">
                                <span
                                    class="inline-flex whitespace-nowrap rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider"
                                    :class="stateBadgeClass(receptionState(row))"
                                >
                                    {{ reportStateLabel(receptionState(row)) }}
                                </span>
                                <p
                                    v-if="row.directEntry"
                                    class="mt-1 text-[10px] text-on-surface-variant"
                                >
                                    Ingreso directo
                                </p>
                            </template>
                            <template #cell-receivedBy="{ row }">
                                <p class="text-on-surface">{{ row.receivedByName ?? '—' }}</p>
                                <p class="mt-0.5 text-[11px] text-on-surface-variant">
                                    {{ formatReportDateTime(row.receivedAt) }}
                                </p>
                            </template>
                        </DataTable>

                        <DataTable
                            v-else
                            :rows="districtAggregates"
                            :columns="districtColumns"
                            row-key="key"
                            :page-size="25"
                            show-search
                            dense
                            search-placeholder="Buscar distrito..."
                            empty-message="Ningún distrito coincide con la búsqueda."
                        >
                            <template #cell-totalReceived="{ row }">
                                {{ formatReportMoney(row.totalReceived) }}
                            </template>
                            <template #cell-averagePerEnvelope="{ row }">
                                {{ formatReportMoney(row.averagePerEnvelope) }}
                            </template>
                            <template #cell-share="{ row }">
                                <div class="flex items-center justify-end gap-2">
                                    <div
                                        class="h-1.5 w-16 overflow-hidden rounded-full bg-surface-container-high"
                                    >
                                        <div
                                            class="h-full rounded-full bg-primary"
                                            :style="{ width: `${Math.min(100, row.share * 100)}%` }"
                                        />
                                    </div>
                                    <span class="w-14 text-right tabular-nums">
                                        {{ formatReportPercent(row.share) }}
                                    </span>
                                </div>
                            </template>
                        </DataTable>
                    </section>
                </template>
            </div>
        </template>
    </main>
</template>
