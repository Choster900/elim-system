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
    Landmark,
    ListChecks,
    Loader2,
    MapPinned,
    PieChart,
    RefreshCw,
    Sheet,
    TrendingUp,
    Users,
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
    ReportStatusFilter,
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
    rangeDays,
    sumAttendance,
    sumCategory,
    summarizeReport,
    sumOfferings,
    sumReceived,
    sumReceivedDifference,
    sumUncategorized,
    toCents,
    usedCategories,
} from '../utils/meeting-report.util'
import {
    formatReportDate,
    formatReportDateTime,
    formatReportMoney,
    formatReportNumber,
    formatReportPercent,
    formatReportRange,
    formatReportSignedMoney,
    formatReportWeekday,
    reportReceptionLabel,
    reportStatusLabel,
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

const REPORT_TITLE = 'Reporte de reuniones y ofrendas'
const MAX_RANGE_DAYS = 366

useHead({ title: 'Reporte de reuniones · Sistema' })

type ReportTab = 'reuniones' | 'detalle' | 'distritos'
type ExportFormat = 'excel' | 'pdf' | 'csv-reuniones' | 'csv-detalle'

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

function applyRange(range: ReportDateRange) {
    appliedRange.value = range
    pickerRange.value = { start: range.from, end: range.to }
}

function applyPreset(key: ReportRangePresetKey) {
    applyRange(resolveReportRangePreset(key))
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

const kindOptions: { value: ReportMeetingKind; label: string }[] = [
    { value: 'todas', label: 'Todas' },
    { value: 'celulas', label: 'Células y sectores' },
    { value: 'generales', label: 'Cultos generales' },
]

const statusOptions: { value: ReportStatusFilter; label: string }[] = [
    { value: 'todas', label: 'Todas las fechas' },
    { value: 'registrada', label: 'Solo registradas' },
    { value: 'pendiente', label: 'Solo pendientes' },
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
    distinctOptions(allRows.value, (row) => ({
        value: row.meetingTypeId,
        label: row.meetingTypeName,
    })),
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
    },
)

const hasActiveFilters = computed(
    () =>
        filters.kind !== 'todas' ||
        filters.status !== 'todas' ||
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
    if (filters.status !== 'todas') {
        labels.push(
            `Estado: ${statusOptions.find((option) => option.value === filters.status)?.label}`,
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
                left.meetingCode.localeCompare(right.meetingCode, 'es'),
        ),
)
const reportCategories = computed(() =>
    usedCategories(allRows.value, report.value?.categories ?? []),
)
const showUncategorized = computed(() =>
    allRows.value.some((row) => toCents(row.uncategorizedAmount) > 0),
)
const summary = computed(() => summarizeReport(filteredRows.value))
const meetingAggregates = computed(() => groupByMeeting(filteredRows.value))
const districtAggregates = computed(() => groupByDistrict(filteredRows.value))
const categoryBreakdown = computed(() => categoryTotals(filteredRows.value, reportCategories.value))
const trend = computed(() => buildReportTrend(filteredRows.value, appliedRange.value))

const trendTitle = computed(() => {
    if (trend.value.granularity === 'day') return 'Ofrendas por día'
    if (trend.value.granularity === 'week') return 'Ofrendas por semana'
    return 'Ofrendas por mes'
})

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
        .filter((item) => item.totalOfferings > 0)
        .map((item) => ({
            id: item.key,
            label: item.districtName,
            value: item.totalOfferings,
            meta: formatReportPercent(item.share),
        })),
)
const topMeetingItems = computed(() =>
    meetingAggregates.value
        .filter((item) => item.totalOfferings > 0)
        .map((item) => ({
            id: item.meetingId,
            label: `${item.meetingCode} · ${item.meetingTitle}`,
            value: item.totalOfferings,
            meta: formatReportPercent(item.share),
        })),
)

const progressItems = computed(() => {
    const value = summary.value
    return [
        {
            label: 'Fechas registradas',
            count: value.recordedCount,
            total: value.occurrenceCount,
            tone: 'bg-primary',
        },
        {
            label: 'Sobres recibidos por el comité',
            count: value.receivedCount,
            total: value.recordedCount,
            tone: 'bg-emerald-500',
        },
        {
            label: 'Sobres con diferencia abierta',
            count: value.discrepancyCount,
            total: value.receivedCount,
            tone: 'bg-amber-500',
        },
        {
            label: 'Registradas sin entregar',
            count: value.unreceivedCount,
            total: value.recordedCount,
            tone: 'bg-destructive',
        },
    ]
})

function progressWidth(count: number, total: number) {
    return `${total > 0 ? Math.max(count > 0 ? 2 : 0, (count / total) * 100) : 0}%`
}

const activeTab = ref<ReportTab>('reuniones')
const tabs = computed<{ key: ReportTab; label: string; count: number }[]>(() => [
    { key: 'reuniones', label: 'Por reunión', count: meetingAggregates.value.length },
    { key: 'detalle', label: 'Detalle por fecha', count: filteredRows.value.length },
    { key: 'distritos', label: 'Por distrito', count: districtAggregates.value.length },
])

function sumMoney<T>(rows: T[], pick: (row: T) => number) {
    return fromCents(rows.reduce((sum, row) => sum + toCents(pick(row)), 0))
}

function shareOf(amount: number) {
    return summary.value.totalOfferings > 0 ? amount / summary.value.totalOfferings : 0
}

function differenceClass(value: number) {
    if (toCents(value) === 0) return 'text-on-surface-variant'
    return value > 0 ? 'text-emerald-700 dark:text-emerald-300' : 'text-destructive'
}

function territoryParts(item: {
    isGeneral: boolean
    sectorName: string | null
    zoneName: string | null
    districtName: string | null
}) {
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

const moneyCellClass = 'whitespace-nowrap tabular-nums'

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
            [row.sectorName, row.zoneName, row.districtName].filter(Boolean).join(' ') ||
            (row.isGeneral ? 'Toda la iglesia' : 'Sin asignar'),
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
        key: 'dates',
        label: 'Fechas',
        sortable: true,
        align: 'center',
        accessor: (row) => row.recordedCount,
        footer: (rows) =>
            `${rows.reduce((sum, row) => sum + row.recordedCount, 0)}/${rows.reduce((sum, row) => sum + row.occurrenceCount, 0)}`,
    },
    {
        key: 'attendance',
        label: 'Asistencia',
        sortable: true,
        align: 'right',
        accessor: (row) => row.attendance,
        cellClass: moneyCellClass,
        footer: (rows) =>
            rows.reduce((sum, row) => sum + row.attendance, 0).toLocaleString('es-SV'),
    },
    {
        key: 'averageAttendance',
        label: 'Prom. asist.',
        sortable: true,
        align: 'right',
        accessor: (row) => Math.round(row.averageAttendance * 10) / 10,
        cellClass: moneyCellClass,
    },
    ...reportCategories.value.map<DataTableColumn<MeetingReportAggregate>>((category) => ({
        key: `category-${category.id}`,
        label: category.name,
        sortable: true,
        align: 'right',
        accessor: (row) => row.categoryAmounts[category.id] ?? 0,
        cellClass: moneyCellClass,
        footer: (rows) =>
            formatReportMoney(sumMoney(rows, (row) => row.categoryAmounts[category.id] ?? 0)),
        footerClass: moneyCellClass,
    })),
    ...(showUncategorized.value
        ? [
              {
                  key: 'uncategorized',
                  label: UNCATEGORIZED_LABEL,
                  sortable: true,
                  align: 'right' as const,
                  accessor: (row: MeetingReportAggregate) => row.uncategorizedAmount,
                  cellClass: moneyCellClass,
                  footer: (rows: MeetingReportAggregate[]) =>
                      formatReportMoney(sumMoney(rows, (row) => row.uncategorizedAmount)),
                  footerClass: moneyCellClass,
              },
          ]
        : []),
    {
        key: 'totalOfferings',
        label: 'Total ofrendas',
        sortable: true,
        align: 'right',
        accessor: (row) => row.totalOfferings,
        cellClass: `${moneyCellClass} font-semibold`,
        footer: (rows) => formatReportMoney(sumMoney(rows, (row) => row.totalOfferings)),
        footerClass: `${moneyCellClass} text-primary`,
    },
    {
        key: 'averageOffering',
        label: 'Prom. por fecha',
        sortable: true,
        align: 'right',
        accessor: (row) => row.averageOffering,
        cellClass: moneyCellClass,
        footer: (rows) => {
            const recorded = rows.reduce((sum, row) => sum + row.recordedCount, 0)
            const total = toCents(sumMoney(rows, (row) => row.totalOfferings))
            return formatReportMoney(recorded > 0 ? fromCents(Math.round(total / recorded)) : 0)
        },
        footerClass: moneyCellClass,
    },
    {
        key: 'share',
        label: '% del total',
        sortable: true,
        align: 'right',
        accessor: (row) => row.share,
        cellClass: 'min-w-[130px]',
        footer: (rows) => formatReportPercent(shareOf(sumMoney(rows, (row) => row.totalOfferings))),
        footerClass: moneyCellClass,
    },
    {
        key: 'receivedAmount',
        label: 'Recibido comité',
        sortable: true,
        align: 'right',
        accessor: (row) => row.receivedAmount,
        cellClass: moneyCellClass,
        footer: (rows) => formatReportMoney(sumMoney(rows, (row) => row.receivedAmount)),
        footerClass: moneyCellClass,
    },
    {
        key: 'receivedDifference',
        label: 'Diferencia',
        sortable: true,
        align: 'right',
        accessor: (row) => row.receivedDifference,
        cellClass: moneyCellClass,
        footer: (rows) => formatReportSignedMoney(sumMoney(rows, (row) => row.receivedDifference)),
        footerClass: moneyCellClass,
    },
    {
        key: 'lastRecordedDate',
        label: 'Última fecha',
        sortable: true,
        accessor: (row) => row.lastRecordedDate ?? '',
        cellClass: 'whitespace-nowrap',
    },
    ...(canOpenMeetingHistory.value
        ? [{ key: 'actions', label: '', align: 'center' as const, width: '56px' }]
        : []),
])

const detailColumns = computed<DataTableColumn<MeetingReportRow>[]>(() => [
    {
        key: 'date',
        label: 'Fecha',
        sortable: true,
        accessor: (row) => row.date,
        footer: () => 'Total general',
        cellClass: 'whitespace-nowrap',
    },
    {
        key: 'meeting',
        label: 'Reunión',
        sortable: true,
        accessor: (row) => `${row.meetingCode} ${row.meetingTitle}`,
        cellClass: 'min-w-[240px]',
    },
    {
        key: 'territory',
        label: 'Territorio',
        sortable: true,
        accessor: (row) =>
            [row.sectorName, row.zoneName, row.districtName].filter(Boolean).join(' ') ||
            (row.isGeneral ? 'Toda la iglesia' : 'Sin asignar'),
        cellClass: 'min-w-[180px]',
    },
    {
        key: 'leaderName',
        label: 'Líder',
        sortable: true,
        accessor: (row) => row.leaderName ?? '',
        cellClass: 'min-w-[150px]',
    },
    {
        key: 'status',
        label: 'Estado',
        sortable: true,
        align: 'center',
        accessor: (row) => reportStatusLabel(row.status),
        footer: (rows) =>
            `${rows.filter((row) => row.status === 'registrada').length}/${rows.length}`,
    },
    {
        key: 'attendance',
        label: 'Asistencia',
        sortable: true,
        align: 'right',
        accessor: (row) => row.attendance ?? '',
        cellClass: moneyCellClass,
        footer: (rows) => sumAttendance(rows).toLocaleString('es-SV'),
    },
    ...reportCategories.value.map<DataTableColumn<MeetingReportRow>>((category) => ({
        key: `category-${category.id}`,
        label: category.name,
        sortable: true,
        align: 'right',
        accessor: (row) => sumCategory([row], category.id),
        cellClass: moneyCellClass,
        footer: (rows) => formatReportMoney(sumCategory(rows, category.id)),
        footerClass: moneyCellClass,
    })),
    ...(showUncategorized.value
        ? [
              {
                  key: 'uncategorized',
                  label: UNCATEGORIZED_LABEL,
                  sortable: true,
                  align: 'right' as const,
                  accessor: (row: MeetingReportRow) => row.uncategorizedAmount,
                  cellClass: moneyCellClass,
                  footer: (rows: MeetingReportRow[]) => formatReportMoney(sumUncategorized(rows)),
                  footerClass: moneyCellClass,
              },
          ]
        : []),
    {
        key: 'totalAmount',
        label: 'Total ofrenda',
        sortable: true,
        align: 'right',
        accessor: (row) => row.totalAmount ?? '',
        cellClass: `${moneyCellClass} font-semibold`,
        footer: (rows) => formatReportMoney(sumOfferings(rows)),
        footerClass: `${moneyCellClass} text-primary`,
    },
    {
        key: 'reception',
        label: 'Recepción',
        sortable: true,
        align: 'center',
        accessor: (row) => reportReceptionLabel(row.reception, row.status),
    },
    {
        key: 'receivedAmount',
        label: 'Recibido',
        sortable: true,
        align: 'right',
        accessor: (row) => row.reception?.receivedAmount ?? '',
        cellClass: moneyCellClass,
        footer: (rows) => formatReportMoney(sumReceived(rows)),
        footerClass: moneyCellClass,
    },
    {
        key: 'difference',
        label: 'Diferencia',
        sortable: true,
        align: 'right',
        accessor: (row) => row.reception?.difference ?? '',
        cellClass: moneyCellClass,
        footer: (rows) => formatReportSignedMoney(sumReceivedDifference(rows)),
        footerClass: moneyCellClass,
    },
    {
        key: 'recordedBy',
        label: 'Registrado por',
        sortable: true,
        accessor: (row) => row.recordedByName ?? '',
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
    {
        key: 'meetingCount',
        label: 'Reuniones',
        sortable: true,
        align: 'right',
        cellClass: moneyCellClass,
        footer: (rows) => rows.reduce((sum, row) => sum + row.meetingCount, 0),
    },
    {
        key: 'dates',
        label: 'Fechas',
        sortable: true,
        align: 'center',
        accessor: (row) => row.recordedCount,
        footer: (rows) =>
            `${rows.reduce((sum, row) => sum + row.recordedCount, 0)}/${rows.reduce((sum, row) => sum + row.occurrenceCount, 0)}`,
    },
    {
        key: 'attendance',
        label: 'Asistencia',
        sortable: true,
        align: 'right',
        cellClass: moneyCellClass,
        footer: (rows) =>
            rows.reduce((sum, row) => sum + row.attendance, 0).toLocaleString('es-SV'),
    },
    {
        key: 'averageAttendance',
        label: 'Prom. asist.',
        sortable: true,
        align: 'right',
        accessor: (row) => Math.round(row.averageAttendance * 10) / 10,
        cellClass: moneyCellClass,
    },
    {
        key: 'totalOfferings',
        label: 'Total ofrendas',
        sortable: true,
        align: 'right',
        cellClass: `${moneyCellClass} font-semibold`,
        footer: (rows) => formatReportMoney(sumMoney(rows, (row) => row.totalOfferings)),
        footerClass: `${moneyCellClass} text-primary`,
    },
    {
        key: 'averageOffering',
        label: 'Prom. por fecha',
        sortable: true,
        align: 'right',
        cellClass: moneyCellClass,
    },
    {
        key: 'share',
        label: '% del total',
        sortable: true,
        align: 'right',
        cellClass: 'min-w-[130px]',
        footer: (rows) => formatReportPercent(shareOf(sumMoney(rows, (row) => row.totalOfferings))),
        footerClass: moneyCellClass,
    },
    {
        key: 'receivedAmount',
        label: 'Recibido comité',
        sortable: true,
        align: 'right',
        cellClass: moneyCellClass,
        footer: (rows) => formatReportMoney(sumMoney(rows, (row) => row.receivedAmount)),
        footerClass: moneyCellClass,
    },
    {
        key: 'receivedDifference',
        label: 'Diferencia',
        sortable: true,
        align: 'right',
        cellClass: moneyCellClass,
        footer: (rows) => formatReportSignedMoney(sumMoney(rows, (row) => row.receivedDifference)),
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
    range: appliedRange.value,
    generatedAt: report.value?.generatedAt ?? new Date().toISOString(),
    filterLabels: filterLabels.value,
    summary: summary.value,
    categories: reportCategories.value,
    showUncategorized: showUncategorized.value,
    categoryTotals: categoryBreakdown.value,
    meetings: meetingAggregates.value,
    districts: districtAggregates.value,
    rows: filteredRows.value,
}))

const exportLabels: Record<ExportFormat, string> = {
    excel: 'Excel',
    pdf: 'PDF',
    'csv-reuniones': 'CSV por reunión',
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
                    Reportería · Reuniones
                </p>
                <h1 class="mt-4 font-display text-4xl font-semibold text-on-surface md:text-5xl">
                    {{ REPORT_TITLE }}
                </h1>
                <p class="mt-3 max-w-2xl text-sm leading-relaxed text-on-surface-variant">
                    Total de ofrendas por reunión y del período completo, con su desglose por
                    categoría, territorio y fecha, y lo recibido por el comité de apoyo.
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
                                        Resumen, por reunión y detalle
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
                                :class="menuItemClass"
                                @select="runExport('csv-detalle')"
                            >
                                <Sheet class="size-4 text-on-surface-variant" />
                                <span class="flex flex-col">
                                    <span class="font-semibold">CSV de detalle</span>
                                    <span class="text-xs text-on-surface-variant">
                                        Una fila por fecha de reunión
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
                    <span :class="filterLabelClass">Período (fecha de la reunión)</span>
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
                        aria-label="Alcance de las reuniones"
                    />
                </div>
                <div>
                    <span :class="filterLabelClass">Tipo de reunión</span>
                    <UiSearchSelect
                        v-model="filters.meetingTypeIds"
                        :options="meetingTypeOptions"
                        multiple
                        clearable
                        :disabled="meetingTypeOptions.length === 0"
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
                    <span :class="filterLabelClass">Estado del registro</span>
                    <UiSearchSelect
                        v-model="filters.status"
                        :options="statusOptions"
                        :searchable="false"
                        aria-label="Estado del registro"
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
            <CalendarRange class="mx-auto size-10 text-primary" />
            <h2 class="mt-3 font-display text-2xl font-semibold text-on-surface">
                Sin reuniones en este período
            </h2>
            <p class="mt-2 text-sm text-on-surface-variant">
                No hay fechas de reunión entre {{ rangeLabel }} dentro de tu alcance. Prueba con
                otro rango.
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
                        Ninguna fecha de reunión coincide con los filtros aplicados.
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
                    <section class="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-6">
                        <UiCard class="border-primary p-5 sm:col-span-2 lg:col-span-1">
                            <div class="flex items-center justify-between">
                                <p
                                    class="text-[11px] font-semibold uppercase tracking-wider text-on-surface-variant"
                                >
                                    Total de ofrendas
                                </p>
                                <Coins class="size-4 text-primary" />
                            </div>
                            <p
                                class="mt-2 font-display text-3xl font-semibold tabular-nums text-primary"
                            >
                                {{ formatReportMoney(summary.totalOfferings) }}
                            </p>
                            <p class="mt-1 text-xs text-on-surface-variant">
                                de todas las reuniones del período
                            </p>
                        </UiCard>
                        <UiCard class="p-5">
                            <div class="flex items-center justify-between">
                                <p
                                    class="text-[11px] font-semibold uppercase tracking-wider text-on-surface-variant"
                                >
                                    Reuniones
                                </p>
                                <ListChecks class="size-4 text-primary" />
                            </div>
                            <p
                                class="mt-2 font-display text-3xl font-semibold tabular-nums text-on-surface"
                            >
                                {{ summary.meetingCount }}
                            </p>
                            <p class="mt-1 text-xs text-on-surface-variant">
                                {{ summary.occurrenceCount }}
                                {{ summary.occurrenceCount === 1 ? 'fecha' : 'fechas' }} en el
                                período
                            </p>
                        </UiCard>
                        <UiCard class="p-5">
                            <div class="flex items-center justify-between">
                                <p
                                    class="text-[11px] font-semibold uppercase tracking-wider text-on-surface-variant"
                                >
                                    Promedio por fecha
                                </p>
                                <HandCoins class="size-4 text-primary" />
                            </div>
                            <p
                                class="mt-2 font-display text-3xl font-semibold tabular-nums text-on-surface"
                            >
                                {{ formatReportMoney(summary.averagePerOccurrence) }}
                            </p>
                            <p class="mt-1 text-xs text-on-surface-variant">
                                {{ formatReportMoney(summary.averagePerMeeting) }} por reunión
                            </p>
                        </UiCard>
                        <UiCard class="p-5">
                            <div class="flex items-center justify-between">
                                <p
                                    class="text-[11px] font-semibold uppercase tracking-wider text-on-surface-variant"
                                >
                                    Asistencia
                                </p>
                                <Users class="size-4 text-primary" />
                            </div>
                            <p
                                class="mt-2 font-display text-3xl font-semibold tabular-nums text-on-surface"
                            >
                                {{ summary.totalAttendance.toLocaleString('es-SV') }}
                            </p>
                            <p class="mt-1 text-xs text-on-surface-variant">
                                {{ formatReportNumber(summary.averageAttendance) }} por fecha ·
                                {{ formatReportMoney(summary.offeringPerAttendee) }} por persona
                            </p>
                        </UiCard>
                        <UiCard class="p-5">
                            <div class="flex items-center justify-between">
                                <p
                                    class="text-[11px] font-semibold uppercase tracking-wider text-on-surface-variant"
                                >
                                    Cumplimiento
                                </p>
                                <ClipboardCheck class="size-4 text-primary" />
                            </div>
                            <p
                                class="mt-2 font-display text-3xl font-semibold tabular-nums text-on-surface"
                            >
                                {{ formatReportPercent(summary.complianceRate, 0) }}
                            </p>
                            <p class="mt-1 text-xs text-on-surface-variant">
                                {{ summary.recordedCount }} registradas ·
                                {{ summary.pendingCount }} pendientes
                            </p>
                        </UiCard>
                        <UiCard class="p-5">
                            <div class="flex items-center justify-between">
                                <p
                                    class="text-[11px] font-semibold uppercase tracking-wider text-on-surface-variant"
                                >
                                    Recibido por el comité
                                </p>
                                <Landmark class="size-4 text-primary" />
                            </div>
                            <p
                                class="mt-2 font-display text-3xl font-semibold tabular-nums text-on-surface"
                            >
                                {{ formatReportMoney(summary.receivedAmount) }}
                            </p>
                            <p
                                class="mt-1 text-xs"
                                :class="differenceClass(summary.receivedDifference)"
                            >
                                Diferencia {{ formatReportSignedMoney(summary.receivedDifference) }}
                            </p>
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
                                        Suma de todas las reuniones registradas en cada período
                                    </p>
                                </div>
                                <span class="ml-auto shrink-0 text-[11px] text-on-surface-variant">
                                    {{ rangeLabel }}
                                </span>
                            </div>
                            <ColumnChart
                                :values="trend.offerings"
                                format="currency"
                                :label="trendTitle"
                                empty-message="No hay ofrendas registradas en el período."
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
                                        Cómo se compone el total del período
                                    </p>
                                </div>
                            </div>
                            <RankedBarList
                                :items="categoryItems"
                                label="Ofrendas por categoría"
                                :limit="7"
                                empty-message="Sin ofrendas por categoría."
                            />
                        </UiCard>
                    </section>

                    <section class="mt-4 grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
                        <UiCard class="p-6">
                            <div class="mb-5 flex items-start gap-2">
                                <BarChart3 class="mt-0.5 size-4 shrink-0 text-primary" />
                                <div class="min-w-0">
                                    <h2 class="text-sm font-semibold text-on-surface">
                                        Reuniones con más ofrenda
                                    </h2>
                                    <p class="mt-0.5 text-[11px] text-on-surface-variant">
                                        Participación sobre el total
                                    </p>
                                </div>
                            </div>
                            <RankedBarList
                                :items="topMeetingItems"
                                label="Reuniones con más ofrenda"
                                :limit="6"
                                empty-message="Sin ofrendas registradas."
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
                                        Los cultos generales cuentan como toda la iglesia
                                    </p>
                                </div>
                            </div>
                            <RankedBarList
                                :items="districtItems"
                                label="Ofrendas por distrito"
                                :limit="6"
                                empty-message="Sin ofrendas registradas."
                            />
                        </UiCard>

                        <UiCard class="p-6 lg:col-span-2 xl:col-span-1">
                            <div class="mb-5 flex items-start gap-2">
                                <ClipboardCheck class="mt-0.5 size-4 shrink-0 text-primary" />
                                <div class="min-w-0">
                                    <h2 class="text-sm font-semibold text-on-surface">
                                        Registro y entrega de sobres
                                    </h2>
                                    <p class="mt-0.5 text-[11px] text-on-surface-variant">
                                        Avance del período
                                    </p>
                                </div>
                            </div>
                            <ul class="flex flex-col gap-4">
                                <li v-for="item in progressItems" :key="item.label">
                                    <div class="mb-1.5 flex items-baseline justify-between gap-4">
                                        <span class="text-sm text-on-surface">
                                            {{ item.label }}
                                        </span>
                                        <span
                                            class="shrink-0 text-sm font-semibold tabular-nums text-on-surface"
                                        >
                                            {{ item.count }}
                                            <span class="font-normal text-on-surface-variant">
                                                / {{ item.total }}
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
                                                width: progressWidth(item.count, item.total),
                                            }"
                                        />
                                    </div>
                                </li>
                            </ul>
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
                                class="inline-flex rounded-lg border border-outline-variant bg-surface-container-low p-1"
                                role="tablist"
                            >
                                <button
                                    v-for="tab in tabs"
                                    :key="tab.key"
                                    type="button"
                                    role="tab"
                                    :aria-selected="activeTab === tab.key"
                                    class="inline-flex items-center gap-2 rounded-md px-4 py-2 text-xs font-semibold uppercase tracking-wider transition-colors"
                                    :class="
                                        activeTab === tab.key
                                            ? 'bg-primary text-primary-foreground'
                                            : 'text-on-surface-variant hover:text-on-surface'
                                    "
                                    @click="activeTab = tab.key"
                                >
                                    {{ tab.label }}
                                    <span
                                        class="rounded-full px-1.5 py-0.5 text-[10px] tabular-nums"
                                        :class="
                                            activeTab === tab.key
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
                            v-if="activeTab === 'reuniones'"
                            :rows="meetingAggregates"
                            :columns="meetingColumns"
                            row-key="meetingId"
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
                                            {{ row.meetingCode }} · {{ row.meetingTypeName }}
                                            <span v-if="!row.isMeetingActive">· Inactiva</span>
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
                                <span :class="row.leaderName ? '' : 'text-on-surface-variant'">
                                    {{ row.leaderName ?? 'Sin líder' }}
                                </span>
                            </template>
                            <template #cell-dates="{ row }">
                                <span class="font-semibold tabular-nums">
                                    {{ row.recordedCount }}/{{ row.occurrenceCount }}
                                </span>
                                <p
                                    v-if="row.pendingCount > 0"
                                    class="mt-0.5 text-[10px] font-semibold uppercase tracking-wider text-amber-700 dark:text-amber-300"
                                >
                                    {{ row.pendingCount }}
                                    {{ row.pendingCount === 1 ? 'pendiente' : 'pendientes' }}
                                </p>
                            </template>
                            <template #cell-attendance="{ row }">
                                {{ row.attendance.toLocaleString('es-SV') }}
                            </template>
                            <template #cell-averageAttendance="{ row }">
                                {{ formatReportNumber(row.averageAttendance) }}
                            </template>
                            <template
                                v-for="category in reportCategories"
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
                            <template #cell-totalOfferings="{ row }">
                                {{ formatReportMoney(row.totalOfferings) }}
                            </template>
                            <template #cell-averageOffering="{ row }">
                                {{ formatReportMoney(row.averageOffering) }}
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
                            <template #cell-receivedAmount="{ row }">
                                {{ formatReportMoney(row.receivedAmount) }}
                            </template>
                            <template #cell-receivedDifference="{ row }">
                                <span :class="differenceClass(row.receivedDifference)">
                                    {{ formatReportSignedMoney(row.receivedDifference) }}
                                </span>
                            </template>
                            <template #cell-lastRecordedDate="{ row }">
                                {{ formatReportDate(row.lastRecordedDate) }}
                            </template>
                            <template #cell-actions="{ row }">
                                <button
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
                            v-else-if="activeTab === 'detalle'"
                            :rows="filteredRows"
                            :columns="detailColumns"
                            row-key="id"
                            :page-size="25"
                            :page-size-options="[10, 25, 50, 100, 250]"
                            show-search
                            dense
                            search-placeholder="Buscar fecha, reunión, territorio, líder o quién registró..."
                            empty-message="Ninguna fecha coincide con la búsqueda."
                        >
                            <template #cell-date="{ row }">
                                <p class="font-semibold tabular-nums text-on-surface">
                                    {{ formatReportDate(row.date) }}
                                </p>
                                <p class="mt-0.5 text-[11px] capitalize text-on-surface-variant">
                                    {{ formatReportWeekday(row.date) }}
                                </p>
                            </template>
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
                                            {{ row.meetingCode }} · {{ row.meetingTypeName }}
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
                                <span :class="row.leaderName ? '' : 'text-on-surface-variant'">
                                    {{ row.leaderName ?? 'Sin líder' }}
                                </span>
                            </template>
                            <template #cell-status="{ row }">
                                <span
                                    class="inline-flex rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider"
                                    :class="
                                        row.status === 'registrada'
                                            ? 'border-emerald-500 text-emerald-700 dark:text-emerald-300'
                                            : 'border-amber-500 text-amber-700 dark:text-amber-300'
                                    "
                                >
                                    {{ reportStatusLabel(row.status) }}
                                </span>
                            </template>
                            <template #cell-attendance="{ row }">
                                <span v-if="row.attendance !== null">
                                    {{ row.attendance.toLocaleString('es-SV') }}
                                </span>
                                <span v-else class="text-on-surface-variant">—</span>
                            </template>
                            <template
                                v-for="category in reportCategories"
                                :key="category.id"
                                #[`cell-category-${category.id}`]="{ row }"
                            >
                                <span v-if="row.status === 'registrada'">
                                    {{ formatReportMoney(sumCategory([row], category.id)) }}
                                </span>
                                <span v-else class="text-on-surface-variant">—</span>
                            </template>
                            <template #cell-uncategorized="{ row }">
                                <span v-if="row.status === 'registrada'">
                                    {{ formatReportMoney(row.uncategorizedAmount) }}
                                </span>
                                <span v-else class="text-on-surface-variant">—</span>
                            </template>
                            <template #cell-totalAmount="{ row }">
                                <span v-if="row.totalAmount !== null">
                                    {{ formatReportMoney(row.totalAmount) }}
                                </span>
                                <span v-else class="font-normal text-on-surface-variant">—</span>
                            </template>
                            <template #cell-reception="{ row }">
                                <span
                                    class="inline-flex whitespace-nowrap rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider"
                                    :class="
                                        !row.reception
                                            ? 'border-outline-variant text-on-surface-variant'
                                            : row.reception.status === 'cuadra' ||
                                                row.reception.isClosed
                                              ? 'border-emerald-500 text-emerald-700 dark:text-emerald-300'
                                              : 'border-amber-500 text-amber-700 dark:text-amber-300'
                                    "
                                >
                                    {{ reportReceptionLabel(row.reception, row.status) }}
                                </span>
                            </template>
                            <template #cell-receivedAmount="{ row }">
                                <span v-if="row.reception">
                                    {{ formatReportMoney(row.reception.receivedAmount) }}
                                </span>
                                <span v-else class="text-on-surface-variant">—</span>
                            </template>
                            <template #cell-difference="{ row }">
                                <span
                                    v-if="row.reception"
                                    :class="differenceClass(row.reception.difference)"
                                >
                                    {{ formatReportSignedMoney(row.reception.difference) }}
                                </span>
                                <span v-else class="text-on-surface-variant">—</span>
                            </template>
                            <template #cell-recordedBy="{ row }">
                                <template v-if="row.recordedByName">
                                    <p class="text-on-surface">{{ row.recordedByName }}</p>
                                    <p class="mt-0.5 text-[11px] text-on-surface-variant">
                                        {{ formatReportDateTime(row.recordedAt) }}
                                    </p>
                                </template>
                                <span v-else class="text-on-surface-variant">—</span>
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
                            <template #cell-dates="{ row }">
                                <span class="font-semibold tabular-nums">
                                    {{ row.recordedCount }}/{{ row.occurrenceCount }}
                                </span>
                            </template>
                            <template #cell-attendance="{ row }">
                                {{ row.attendance.toLocaleString('es-SV') }}
                            </template>
                            <template #cell-averageAttendance="{ row }">
                                {{ formatReportNumber(row.averageAttendance) }}
                            </template>
                            <template #cell-totalOfferings="{ row }">
                                {{ formatReportMoney(row.totalOfferings) }}
                            </template>
                            <template #cell-averageOffering="{ row }">
                                {{ formatReportMoney(row.averageOffering) }}
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
                            <template #cell-receivedAmount="{ row }">
                                {{ formatReportMoney(row.receivedAmount) }}
                            </template>
                            <template #cell-receivedDifference="{ row }">
                                <span :class="differenceClass(row.receivedDifference)">
                                    {{ formatReportSignedMoney(row.receivedDifference) }}
                                </span>
                            </template>
                        </DataTable>
                    </section>
                </template>
            </div>
        </template>
    </main>
</template>
