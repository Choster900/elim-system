import type {
    CategoryReportTotal,
    DistrictReportAggregate,
    MeetingReportAggregate,
    MeetingReportRow,
    ReportCategory,
    ReportDateRange,
    ReportSummary,
    TitherReportAggregate,
} from '../interfaces/meeting-report.interface'
import {
    UNCATEGORIZED_LABEL,
    isTitheRow,
    receptionState,
    sumCategory,
} from '../utils/meeting-report.util'
import {
    TITHES_LABEL,
    formatReportDate,
    formatReportDateTime,
    formatReportMoney,
    formatReportNumber,
    formatReportPercent,
    formatReportRange,
    formatReportWeekday,
    reportAggregateDistrictLabel,
    reportAggregateTerritoryLabel,
    reportDistrictLabel,
    reportRowCode,
    reportRowTitle,
    reportRowType,
    reportStateLabel,
    reportTerritoryLabel,
} from '../utils/report-format.util'

export interface MeetingReportExportContext {
    appName: string
    title: string
    subtitle: string
    range: ReportDateRange
    generatedAt: string
    filterLabels: string[]
    summary: ReportSummary
    categories: ReportCategory[]
    showUncategorized: boolean
    showTitheColumn: boolean
    categoryTotals: CategoryReportTotal[]
    meetings: MeetingReportAggregate[]
    tithers: TitherReportAggregate[]
    districts: DistrictReportAggregate[]
    rows: MeetingReportRow[]
}

export type MeetingReportCsvKind = 'reuniones' | 'diezmadores' | 'detalle'

type ExportValue = string | number | null
type ExportKind = 'text' | 'money' | 'integer' | 'decimal' | 'percent' | 'date'

interface ExportColumn<T> {
    header: string
    width: number
    kind: ExportKind
    value: (item: T) => ExportValue
    total?: ExportValue
}

type ExcelCell = Record<string, unknown> | null

const BRAND_COLOR = '#6B4F3A'
const BRAND_BORDER = '#B9AA9E'
const BODY_BORDER = '#DED4CA'
const ALTERNATE_FILL = '#FBF7F0'
const TOTAL_FILL = '#EFE5D8'
const BODY_TEXT = '#352F2B'
const MUTED_TEXT = '#655D58'

const EXCEL_FORMATS: Partial<Record<ExportKind, string>> = {
    money: '#,##0.00',
    integer: '#,##0',
    decimal: '#,##0.0',
    percent: '0.0%',
    date: 'dd/mm/yyyy',
}

const TOTAL_LABEL = 'Total general'

function fileBaseName(range: ReportDateRange) {
    return `reporte-ofrendas-y-diezmos_${range.from}_${range.to}`
}

function categoryTotal(context: MeetingReportExportContext, id: CategoryReportTotal['id']) {
    return context.categoryTotals.find((total) => total.id === id)?.amount ?? 0
}

function categoryColumns<T>(
    context: MeetingReportExportContext,
    amountOf: (item: T, categoryId: number) => number,
    uncategorizedOf: (item: T) => number,
    titheOf: (item: T) => number,
): ExportColumn<T>[] {
    const columns: ExportColumn<T>[] = context.categories.map((category) => ({
        header: category.name,
        width: Math.max(14, category.name.length + 4),
        kind: 'money',
        value: (item) => amountOf(item, category.id),
        total: categoryTotal(context, category.id),
    }))
    if (context.showUncategorized) {
        columns.push({
            header: UNCATEGORIZED_LABEL,
            width: 16,
            kind: 'money',
            value: uncategorizedOf,
            total: categoryTotal(context, 'uncategorized'),
        })
    }
    if (context.showTitheColumn) {
        columns.push({
            header: TITHES_LABEL,
            width: 14,
            kind: 'money',
            value: titheOf,
            total: categoryTotal(context, 'tithes'),
        })
    }
    return columns
}

function hasMeetings(context: MeetingReportExportContext) {
    return context.summary.meetingEnvelopeCount > 0
}

function hasTithes(context: MeetingReportExportContext) {
    return context.summary.titheCount > 0
}

function subjectHeader(context: MeetingReportExportContext) {
    if (!hasTithes(context)) return 'Reunión'
    return hasMeetings(context) ? 'Reunión o diezmador' : 'Diezmador'
}

function sourceDateHeader(context: MeetingReportExportContext) {
    if (!hasTithes(context)) return 'Fecha de la reunión'
    return hasMeetings(context) ? 'Fecha de reunión o diezmo' : 'Fecha del diezmo'
}

function meetingColumns(
    context: MeetingReportExportContext,
): ExportColumn<MeetingReportAggregate>[] {
    const { summary } = context
    const isTithes = (item: MeetingReportAggregate) => item.source === 'diezmo'
    return [
        {
            header: 'Código',
            width: 20,
            kind: 'text',
            value: (item) => item.meetingCode,
            total: TOTAL_LABEL,
        },
        { header: 'Reunión', width: 34, kind: 'text', value: (item) => item.meetingTitle },
        { header: 'Tipo', width: 18, kind: 'text', value: (item) => item.meetingTypeName },
        {
            header: 'Distrito',
            width: 20,
            kind: 'text',
            value: (item) => reportAggregateDistrictLabel(item),
        },
        { header: 'Zona', width: 18, kind: 'text', value: (item) => item.zoneName ?? '' },
        { header: 'Sector', width: 18, kind: 'text', value: (item) => item.sectorName ?? '' },
        {
            header: 'Líder',
            width: 26,
            kind: 'text',
            value: (item) =>
                isTithes(item)
                    ? `${summary.titherCount} ${summary.titherCount === 1 ? 'diezmador' : 'diezmadores'}`
                    : (item.leaderName ?? ''),
        },
        {
            header: 'Sobres',
            width: 10,
            kind: 'integer',
            value: (item) => item.envelopeCount,
            total: summary.envelopeCount,
        },
        ...categoryColumns<MeetingReportAggregate>(
            context,
            (item, categoryId) => item.categoryAmounts[categoryId] ?? 0,
            (item) => item.uncategorizedAmount,
            (item) => item.titheAmount,
        ),
        {
            header: 'Total recibido',
            width: 16,
            kind: 'money',
            value: (item) => item.totalReceived,
            total: summary.totalReceived,
        },
        {
            header: 'Promedio por sobre',
            width: 18,
            kind: 'money',
            value: (item) => item.averagePerEnvelope,
            total: summary.averagePerEnvelope,
        },
        {
            header: '% del total',
            width: 12,
            kind: 'percent',
            value: (item) => item.share,
            total: summary.totalReceived > 0 ? 1 : 0,
        },
        {
            header: 'Diferencias abiertas',
            width: 18,
            kind: 'integer',
            value: (item) => item.openDiscrepancyCount,
            total: summary.openDiscrepancyCount,
        },
        {
            header: 'Primera recepción',
            width: 14,
            kind: 'date',
            value: (item) => item.firstDate,
        },
        {
            header: 'Última recepción',
            width: 14,
            kind: 'date',
            value: (item) => item.lastDate,
        },
    ]
}

function detailColumns(context: MeetingReportExportContext): ExportColumn<MeetingReportRow>[] {
    const { summary } = context
    return [
        {
            header: 'Fecha de recepción',
            width: 13,
            kind: 'date',
            value: (row) => row.receivedDate,
            total: TOTAL_LABEL,
        },
        {
            header: 'Día',
            width: 12,
            kind: 'text',
            value: (row) => formatReportWeekday(row.receivedDate),
        },
        {
            header: sourceDateHeader(context),
            width: 13,
            kind: 'date',
            value: (row) => row.date,
        },
        { header: 'Código', width: 20, kind: 'text', value: (row) => reportRowCode(row) },
        {
            header: subjectHeader(context),
            width: 34,
            kind: 'text',
            value: (row) => reportRowTitle(row),
        },
        { header: 'Tipo', width: 18, kind: 'text', value: (row) => reportRowType(row) },
        { header: 'Distrito', width: 20, kind: 'text', value: (row) => reportDistrictLabel(row) },
        { header: 'Zona', width: 18, kind: 'text', value: (row) => row.zoneName ?? '' },
        { header: 'Sector', width: 18, kind: 'text', value: (row) => row.sectorName ?? '' },
        ...(hasMeetings(context)
            ? [
                  {
                      header: 'Líder',
                      width: 26,
                      kind: 'text' as const,
                      value: (row: MeetingReportRow) => row.leaderName ?? '',
                  },
              ]
            : []),
        ...categoryColumns<MeetingReportRow>(
            context,
            (row, categoryId) => sumCategory([row], categoryId),
            (row) => row.uncategorizedAmount,
            (row) => (isTitheRow(row) ? row.receivedAmount : 0),
        ),
        {
            header: 'Total recibido',
            width: 15,
            kind: 'money',
            value: (row) => row.receivedAmount,
            total: summary.totalReceived,
        },
        {
            header: 'Estado del sobre',
            width: 18,
            kind: 'text',
            value: (row) => reportStateLabel(receptionState(row)),
        },
        {
            header: 'Recibido por',
            width: 24,
            kind: 'text',
            value: (row) => row.receivedByName ?? '',
        },
        {
            header: 'Fecha y hora de recepción',
            width: 22,
            kind: 'text',
            value: (row) => formatReportDateTime(row.receivedAt),
        },
        ...(hasTithes(context)
            ? [
                  {
                      header: 'Nota',
                      width: 30,
                      kind: 'text' as const,
                      value: (row: MeetingReportRow) => row.notes ?? '',
                  },
              ]
            : []),
    ]
}

function titherColumns(context: MeetingReportExportContext): ExportColumn<TitherReportAggregate>[] {
    const { summary } = context
    return [
        {
            header: 'Código',
            width: 14,
            kind: 'text',
            value: (item) => item.titherCode,
            total: TOTAL_LABEL,
        },
        { header: 'Diezmador', width: 34, kind: 'text', value: (item) => item.titherName },
        { header: 'Distrito', width: 20, kind: 'text', value: (item) => reportDistrictLabel(item) },
        { header: 'Zona', width: 18, kind: 'text', value: (item) => item.zoneName ?? '' },
        { header: 'Sector', width: 18, kind: 'text', value: (item) => item.sectorName ?? '' },
        {
            header: 'Sobres',
            width: 10,
            kind: 'integer',
            value: (item) => item.envelopeCount,
            total: summary.titheCount,
        },
        {
            header: 'Total recibido',
            width: 16,
            kind: 'money',
            value: (item) => item.totalReceived,
            total: summary.titheTotal,
        },
        {
            header: 'Promedio por sobre',
            width: 18,
            kind: 'money',
            value: (item) => item.averagePerEnvelope,
            total: summary.averagePerTithe,
        },
        {
            header: '% de los diezmos',
            width: 16,
            kind: 'percent',
            value: (item) => item.titheShare,
            total: summary.titheTotal > 0 ? 1 : 0,
        },
        {
            header: '% del total',
            width: 12,
            kind: 'percent',
            value: (item) => item.share,
            total: summary.totalReceived > 0 ? summary.titheTotal / summary.totalReceived : 0,
        },
        {
            header: 'Primera recepción',
            width: 14,
            kind: 'date',
            value: (item) => item.firstDate,
        },
        {
            header: 'Última recepción',
            width: 14,
            kind: 'date',
            value: (item) => item.lastDate,
        },
    ]
}

function districtColumns(
    context: MeetingReportExportContext,
): ExportColumn<DistrictReportAggregate>[] {
    const { summary } = context
    return [
        {
            header: 'Distrito',
            width: 24,
            kind: 'text',
            value: (item) => item.districtName,
            total: TOTAL_LABEL,
        },
        ...(hasMeetings(context)
            ? [
                  {
                      header: 'Reuniones',
                      width: 12,
                      kind: 'integer' as const,
                      value: (item: DistrictReportAggregate) => item.meetingCount,
                      total: summary.meetingCount,
                  },
              ]
            : []),
        ...(hasTithes(context)
            ? [
                  {
                      header: 'Diezmadores',
                      width: 13,
                      kind: 'integer' as const,
                      value: (item: DistrictReportAggregate) => item.titherCount,
                      total: summary.titherCount,
                  },
              ]
            : []),
        {
            header: 'Sobres',
            width: 10,
            kind: 'integer',
            value: (item) => item.envelopeCount,
            total: summary.envelopeCount,
        },
        {
            header: 'Total recibido',
            width: 16,
            kind: 'money',
            value: (item) => item.totalReceived,
            total: summary.totalReceived,
        },
        {
            header: 'Promedio por sobre',
            width: 18,
            kind: 'money',
            value: (item) => item.averagePerEnvelope,
            total: summary.averagePerEnvelope,
        },
        {
            header: '% del total',
            width: 12,
            kind: 'percent',
            value: (item) => item.share,
            total: summary.totalReceived > 0 ? 1 : 0,
        },
    ]
}

function summaryLines(context: MeetingReportExportContext): [string, ExportValue, ExportKind][] {
    const { summary } = context
    const lines: [string, ExportValue, ExportKind][] = [
        ['Total recibido por el comité', summary.totalReceived, 'money'],
        ['Sobres recibidos', summary.envelopeCount, 'integer'],
        ['Promedio por sobre', summary.averagePerEnvelope, 'money'],
    ]
    if (hasMeetings(context)) {
        lines.push(
            ['Recibido de reuniones', summary.meetingTotal, 'money'],
            ['Reuniones con sobres recibidos', summary.meetingCount, 'integer'],
            ['Sobres de reunión', summary.meetingEnvelopeCount, 'integer'],
            ['Promedio por reunión', summary.averagePerMeeting, 'money'],
            ['Sobres que cuadran', summary.balancedCount, 'integer'],
            ['Porcentaje que cuadra', summary.balancedRate ?? 0, 'percent'],
            ['Sobres con diferencia abierta', summary.openDiscrepancyCount, 'integer'],
            ['Sobres con diferencia cerrada', summary.closedDiscrepancyCount, 'integer'],
            ['Ingresos directos de cultos generales', summary.directEntryCount, 'integer'],
        )
    }
    if (hasTithes(context)) {
        lines.push(
            ['Recibido en diezmos', summary.titheTotal, 'money'],
            ['Sobres de diezmo', summary.titheCount, 'integer'],
            ['Diezmadores', summary.titherCount, 'integer'],
            ['Promedio por diezmador', summary.averagePerTither, 'money'],
            ['Diezmo más alto', summary.largestTithe, 'money'],
        )
    }
    return lines
}

function formatExportValue(value: ExportValue, kind: ExportKind) {
    if (value === null || value === '') return ''
    if (typeof value === 'string') return kind === 'date' ? formatReportDate(value) : value
    if (kind === 'money') return formatReportMoney(value)
    if (kind === 'percent') return formatReportPercent(value)
    if (kind === 'decimal') return formatReportNumber(value)
    if (kind === 'integer') return value.toLocaleString('es-SV')
    return String(value)
}

function excelValueCell(value: ExportValue, kind: ExportKind) {
    if (value === null || value === '') return { value: null }
    if (kind === 'date' && typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
        return { value: new Date(`${value}T00:00:00Z`), type: Date, format: EXCEL_FORMATS.date }
    }
    if (typeof value === 'number') {
        return { value, type: Number, format: EXCEL_FORMATS[kind] }
    }
    return { value, type: String }
}

function excelHeaderCell(value: string) {
    return {
        value,
        fontWeight: 'bold',
        textColor: '#FFFFFF',
        backgroundColor: BRAND_COLOR,
        borderColor: BRAND_BORDER,
        borderStyle: 'thin',
        align: 'center',
        alignVertical: 'center',
        wrap: true,
    }
}

function excelBodyCell(value: ExportValue, kind: ExportKind, alternate: boolean) {
    return {
        ...excelValueCell(value, kind),
        textColor: BODY_TEXT,
        backgroundColor: alternate ? ALTERNATE_FILL : '#FFFFFF',
        borderColor: BODY_BORDER,
        borderStyle: 'thin',
        alignVertical: 'center',
        ...(kind === 'text' ? { wrap: true } : { align: 'right' }),
    }
}

function excelTotalCell(value: ExportValue, kind: ExportKind) {
    return {
        ...excelValueCell(value ?? null, kind),
        fontWeight: 'bold',
        textColor: BODY_TEXT,
        backgroundColor: TOTAL_FILL,
        borderColor: BRAND_BORDER,
        borderStyle: 'thin',
        topBorderStyle: 'medium',
        topBorderColor: BRAND_COLOR,
        ...(kind === 'text' ? {} : { align: 'right' }),
    }
}

function excelTableRows<T>(columns: ExportColumn<T>[], items: T[]): ExcelCell[][] {
    return [
        columns.map((column) => excelHeaderCell(column.header)),
        ...items.map((item, index) =>
            columns.map((column) =>
                excelBodyCell(column.value(item), column.kind, index % 2 === 1),
            ),
        ),
        columns.map((column) =>
            excelTotalCell(
                column.total ?? null,
                typeof column.total === 'string' ? 'text' : column.kind,
            ),
        ),
    ]
}

function padRow(cells: ExcelCell[], width: number) {
    return [...cells, ...Array.from({ length: Math.max(0, width - cells.length) }, () => null)]
}

function excelSummarySheet(context: MeetingReportExportContext) {
    const width = 6
    const sectionTitle = (value: string): ExcelCell[] =>
        padRow([{ value, fontWeight: 'bold', fontSize: 12, textColor: BRAND_COLOR }], width)
    const labelValue = (label: string, value: ExportValue, kind: ExportKind): ExcelCell[] =>
        padRow(
            [
                {
                    value: label,
                    textColor: MUTED_TEXT,
                    borderColor: BODY_BORDER,
                    borderStyle: 'thin',
                },
                {
                    ...excelValueCell(value, kind),
                    fontWeight: 'bold',
                    textColor: BODY_TEXT,
                    borderColor: BODY_BORDER,
                    borderStyle: 'thin',
                    align: kind === 'text' ? 'left' : 'right',
                },
            ],
            width,
        )
    const blank = (): ExcelCell[] => padRow([], width)

    const categoryTable = excelTableRows<CategoryReportTotal>(
        [
            {
                header: 'Categoría',
                width: 0,
                kind: 'text',
                value: (item) => item.name,
                total: TOTAL_LABEL,
            },
            {
                header: 'Monto recibido',
                width: 0,
                kind: 'money',
                value: (item) => item.amount,
                total: context.summary.totalReceived,
            },
            {
                header: '% del total',
                width: 0,
                kind: 'percent',
                value: (item) => item.share,
                total: context.summary.totalReceived > 0 ? 1 : 0,
            },
        ],
        context.categoryTotals,
    ).map((row) => padRow(row, width))

    const districtTable = excelTableRows(districtColumns(context), context.districts).map((row) =>
        padRow(row, width),
    )

    const data: ExcelCell[][] = [
        padRow(
            [{ value: context.title, fontWeight: 'bold', fontSize: 16, textColor: BRAND_COLOR }],
            width,
        ),
        padRow([{ value: context.subtitle, textColor: MUTED_TEXT }], width),
        padRow([{ value: context.appName, textColor: MUTED_TEXT }], width),
        blank(),
        labelValue(
            'Período (fecha de recepción)',
            formatReportRange(context.range.from, context.range.to),
            'text',
        ),
        labelValue('Generado', formatReportDateTime(context.generatedAt), 'text'),
        labelValue(
            'Filtros aplicados',
            context.filterLabels.length > 0 ? context.filterLabels.join(' · ') : 'Ninguno',
            'text',
        ),
        blank(),
        sectionTitle('Indicadores'),
        ...summaryLines(context).map(([label, value, kind]) => labelValue(label, value, kind)),
        blank(),
        sectionTitle('Recibido por categoría'),
        ...categoryTable,
        blank(),
        sectionTitle('Recibido por distrito'),
        ...districtTable,
    ]

    return {
        data: data as never[][],
        sheet: 'Resumen',
        columns: [38, 22, 14, 18, 18, 14].map((columnWidth) => ({ width: columnWidth })),
        showGridLines: false,
    }
}

function excelTableSheet<T>(sheet: string, columns: ExportColumn<T>[], items: T[]) {
    return {
        data: excelTableRows(columns, items) as never[][],
        sheet,
        columns: columns.map((column) => ({ width: column.width })),
        stickyRowsCount: 1,
        stickyColumnsCount: 2,
        showGridLines: false,
        orientation: 'landscape' as const,
    }
}

export async function exportMeetingReportExcel(context: MeetingReportExportContext) {
    const { default: writeExcelFile } = await import('write-excel-file/browser')

    await writeExcelFile(
        [
            excelSummarySheet(context),
            ...(hasMeetings(context)
                ? [excelTableSheet('Por reunión', meetingColumns(context), context.meetings)]
                : []),
            ...(hasTithes(context)
                ? [excelTableSheet('Por diezmador', titherColumns(context), context.tithers)]
                : []),
            excelTableSheet('Detalle por sobre', detailColumns(context), context.rows),
        ],
        { fontFamily: 'Arial', fontSize: 10 },
    ).toFile(`${fileBaseName(context.range)}.xlsx`)
}

function csvRawValue(value: ExportValue, kind: ExportKind) {
    if (value === null) return ''
    if (typeof value === 'string') return value
    if (kind === 'money') return value.toFixed(2)
    if (kind === 'percent') return (value * 100).toFixed(2)
    if (kind === 'decimal') return value.toFixed(1)
    return String(value)
}

function csvEscape(value: string) {
    return /[",\r\n]/.test(value) || value !== value.trim()
        ? `"${value.replace(/"/g, '""')}"`
        : value
}

function buildCsv<T>(columns: ExportColumn<T>[], items: T[]) {
    const lines = [
        columns.map((column) => column.header),
        ...items.map((item) =>
            columns.map((column) => csvRawValue(column.value(item), column.kind)),
        ),
        columns.map((column) => csvRawValue(column.total ?? null, column.kind)),
    ]
    return `\uFEFF${lines.map((cells) => cells.map(csvEscape).join(',')).join('\r\n')}\r\n`
}

function downloadBlob(blob: Blob, filename: string) {
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = filename
    link.rel = 'noopener'
    document.body.appendChild(link)
    link.click()
    link.remove()
    setTimeout(() => URL.revokeObjectURL(url), 1000)
}

export function exportMeetingReportCsv(
    context: MeetingReportExportContext,
    kind: MeetingReportCsvKind,
) {
    const files: Record<MeetingReportCsvKind, { content: () => string; suffix: string }> = {
        reuniones: {
            content: () => buildCsv(meetingColumns(context), context.meetings),
            suffix: 'por-reunion',
        },
        diezmadores: {
            content: () => buildCsv(titherColumns(context), context.tithers),
            suffix: 'por-diezmador',
        },
        detalle: {
            content: () => buildCsv(detailColumns(context), context.rows),
            suffix: 'detalle',
        },
    }
    const file = files[kind]
    downloadBlob(
        new Blob([file.content()], { type: 'text/csv;charset=utf-8' }),
        `${fileBaseName(context.range)}_${file.suffix}.csv`,
    )
}

type Rgb = [number, number, number]

const PDF_BRAND: Rgb = [107, 79, 58]
const PDF_TEXT: Rgb = [53, 47, 43]
const PDF_MUTED: Rgb = [101, 93, 88]
const PDF_ALTERNATE: Rgb = [251, 247, 240]
const PDF_TOTAL: Rgb = [239, 229, 216]
const PDF_BORDER: Rgb = [222, 212, 202]
const PDF_MARGIN = 36
const PDF_MAX_CATEGORY_COLUMNS = 5

function pdfText(value: string) {
    return value.replace(/[\u00A0\u202F\u2009]/g, ' ').replace(/\u2212/g, '-')
}

function pdfCell(value: ExportValue, kind: ExportKind) {
    return pdfText(formatExportValue(value, kind))
}

function pdfAlign(kind: ExportKind) {
    return kind === 'text' || kind === 'date' ? ('left' as const) : ('right' as const)
}

interface PdfColumn<T> {
    header: string
    kind: ExportKind
    value: (item: T) => ExportValue
    total?: ExportValue
    width?: number
}

function pdfColumnsFrom<T>(columns: ExportColumn<T>[], headers: string[]): PdfColumn<T>[] {
    return headers
        .map((header) => columns.find((column) => column.header === header))
        .filter((column): column is ExportColumn<T> => column !== undefined)
        .map(({ header, kind, value, total }) => ({ header, kind, value, total }))
}

function pdfCategoryHeaders(context: MeetingReportExportContext) {
    const titheHeaders = context.showTitheColumn ? [TITHES_LABEL] : []
    if (context.categories.length > PDF_MAX_CATEGORY_COLUMNS) return titheHeaders
    return [
        ...context.categories.map((category) => category.name),
        ...(context.showUncategorized ? [UNCATEGORIZED_LABEL] : []),
        ...titheHeaders,
    ]
}

function countLabel(count: number, singular: string, plural: string) {
    return `${count} ${count === 1 ? singular : plural}`
}

function pdfKpis(context: MeetingReportExportContext): [string, string, string][] {
    const { summary } = context
    const total: [string, string, string] = [
        'Total recibido',
        formatReportMoney(summary.totalReceived),
        countLabel(summary.envelopeCount, 'sobre contado', 'sobres contados'),
    ]
    const tithers: [string, string, string] = [
        TITHES_LABEL,
        formatReportMoney(summary.titheTotal),
        `${countLabel(summary.titheCount, 'sobre', 'sobres')} · ${countLabel(summary.titherCount, 'diezmador', 'diezmadores')}`,
    ]
    if (!hasMeetings(context)) {
        return [
            total,
            [
                'Diezmadores',
                String(summary.titherCount),
                `${formatReportMoney(summary.averagePerTither)} por diezmador`,
            ],
            [
                'Promedio por sobre',
                formatReportMoney(summary.averagePerTithe),
                countLabel(summary.titheCount, 'sobre de diezmo', 'sobres de diezmo'),
            ],
            ['Diezmo más alto', formatReportMoney(summary.largestTithe), 'en el período'],
        ]
    }
    return [
        total,
        [
            'Reuniones',
            String(summary.meetingCount),
            `${formatReportMoney(summary.averagePerMeeting)} por reunión`,
        ],
        hasTithes(context)
            ? tithers
            : [
                  'Promedio por sobre',
                  formatReportMoney(summary.averagePerEnvelope),
                  `${summary.envelopeCount} sobres en el período`,
              ],
        [
            'Sobres que cuadran',
            formatReportPercent(summary.balancedRate, 0),
            `${summary.balancedCount} de ${summary.meetingEnvelopeCount} de reunión`,
        ],
        [
            'Diferencias abiertas',
            String(summary.openDiscrepancyCount),
            `${summary.closedDiscrepancyCount} ya cerradas`,
        ],
    ]
}

export async function exportMeetingReportPdf(context: MeetingReportExportContext) {
    const [{ jsPDF }, { autoTable }] = await Promise.all([
        import('jspdf'),
        import('jspdf-autotable'),
    ])
    const doc = new jsPDF({ orientation: 'landscape', unit: 'pt', format: 'letter' })
    const pageWidth = doc.internal.pageSize.getWidth()
    const pageHeight = doc.internal.pageSize.getHeight()
    const contentWidth = pageWidth - PDF_MARGIN * 2
    const rangeLabel = pdfText(formatReportRange(context.range.from, context.range.to))
    const lastY = () =>
        (doc as unknown as { lastAutoTable?: { finalY?: number } }).lastAutoTable?.finalY ??
        PDF_MARGIN
    const tableEnd = () => ({ page: doc.getCurrentPageInfo().pageNumber, y: lastY() })

    const tableTheme = {
        theme: 'grid' as const,
        margin: { left: PDF_MARGIN, right: PDF_MARGIN, top: PDF_MARGIN + 22, bottom: 40 },
        styles: {
            font: 'helvetica',
            fontSize: 7.5,
            cellPadding: 4,
            textColor: PDF_TEXT,
            lineColor: PDF_BORDER,
            lineWidth: 0.5,
            overflow: 'linebreak' as const,
            valign: 'middle' as const,
        },
        headStyles: {
            fillColor: PDF_BRAND,
            textColor: [255, 255, 255] as Rgb,
            fontStyle: 'bold' as const,
            halign: 'center' as const,
        },
        alternateRowStyles: { fillColor: PDF_ALTERNATE },
        footStyles: {
            fillColor: PDF_TOTAL,
            textColor: PDF_TEXT,
            fontStyle: 'bold' as const,
        },
    }

    function drawTable<T>(columns: PdfColumn<T>[], items: T[], startY: number, extra = {}) {
        autoTable(doc, {
            ...tableTheme,
            startY,
            head: [columns.map((column) => pdfText(column.header))],
            body: items.map((item) =>
                columns.map((column) => pdfCell(column.value(item), column.kind)),
            ),
            foot: [
                columns.map((column) =>
                    pdfCell(
                        column.total ?? null,
                        typeof column.total === 'string' ? 'text' : column.kind,
                    ),
                ),
            ],
            showFoot: 'lastPage',
            columnStyles: Object.fromEntries(
                columns.map((column, index) => [
                    index,
                    {
                        halign: pdfAlign(column.kind),
                        ...(column.width ? { cellWidth: column.width } : {}),
                    },
                ]),
            ),
            didParseCell: (data) => {
                if (data.section === 'foot') {
                    data.cell.styles.halign = pdfAlign(columns[data.column.index]?.kind ?? 'text')
                }
            },
            ...extra,
        })
    }

    function sectionTitle(title: string, subtitle: string, y: number) {
        doc.setFont('helvetica', 'bold')
        doc.setFontSize(12)
        doc.setTextColor(...PDF_BRAND)
        doc.text(pdfText(title), PDF_MARGIN, y)
        doc.setFont('helvetica', 'normal')
        doc.setFontSize(8)
        doc.setTextColor(...PDF_MUTED)
        doc.text(pdfText(subtitle), PDF_MARGIN, y + 12)
        return y + 20
    }

    function ensureSpace(y: number, needed: number) {
        if (y + needed <= pageHeight - 48) return y
        doc.addPage()
        return PDF_MARGIN + 30
    }

    doc.setFillColor(...PDF_BRAND)
    doc.rect(0, 0, pageWidth, 6, 'F')
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(8)
    doc.setTextColor(...PDF_MUTED)
    doc.text(pdfText(context.appName.toUpperCase()), PDF_MARGIN, PDF_MARGIN)
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(20)
    doc.setTextColor(...PDF_TEXT)
    doc.text(pdfText(context.title), PDF_MARGIN, PDF_MARGIN + 24)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(9)
    doc.setTextColor(...PDF_MUTED)
    doc.text(pdfText(context.subtitle), PDF_MARGIN, PDF_MARGIN + 38)
    doc.text(`Período (fecha de recepción): ${rangeLabel}`, PDF_MARGIN, PDF_MARGIN + 51)
    doc.text(
        pdfText(`Generado: ${formatReportDateTime(context.generatedAt)}`),
        pageWidth - PDF_MARGIN,
        PDF_MARGIN + 51,
        { align: 'right' },
    )
    const filtersText = pdfText(
        `Filtros: ${context.filterLabels.length > 0 ? context.filterLabels.join(' · ') : 'Ninguno'}`,
    )
    const filterLines = doc.splitTextToSize(filtersText, contentWidth) as string[]
    doc.text(filterLines, PDF_MARGIN, PDF_MARGIN + 64)

    const { summary } = context
    const kpis = pdfKpis(context)
    const kpiTop = PDF_MARGIN + 72 + filterLines.length * 11
    const kpiGap = 8
    const kpiWidth = (contentWidth - kpiGap * (kpis.length - 1)) / kpis.length
    kpis.forEach(([label, value, meta], index) => {
        const x = PDF_MARGIN + index * (kpiWidth + kpiGap)
        doc.setDrawColor(...PDF_BORDER)
        doc.setFillColor(...PDF_ALTERNATE)
        doc.roundedRect(x, kpiTop, kpiWidth, 58, 4, 4, 'FD')
        doc.setFont('helvetica', 'bold')
        doc.setFontSize(7)
        doc.setTextColor(...PDF_MUTED)
        doc.text(pdfText(label.toUpperCase()), x + 8, kpiTop + 14)
        doc.setFontSize(14)
        doc.setTextColor(...PDF_TEXT)
        doc.text(pdfText(value), x + 8, kpiTop + 34)
        doc.setFont('helvetica', 'normal')
        doc.setFontSize(7)
        doc.setTextColor(...PDF_MUTED)
        doc.text(pdfText(meta), x + 8, kpiTop + 48)
    })

    let y = sectionTitle(
        'Recibido por categoría y por distrito',
        'Distribución del total contado por el comité',
        kpiTop + 82,
    )
    const halfWidth = (contentWidth - 16) / 2
    drawTable<CategoryReportTotal>(
        [
            { header: 'Categoría', kind: 'text', value: (item) => item.name, total: TOTAL_LABEL },
            {
                header: 'Monto recibido',
                kind: 'money',
                value: (item) => item.amount,
                total: summary.totalReceived,
            },
            {
                header: '% del total',
                kind: 'percent',
                value: (item) => item.share,
                total: summary.totalReceived > 0 ? 1 : 0,
            },
        ],
        context.categoryTotals,
        y,
        { margin: { ...tableTheme.margin, right: PDF_MARGIN + halfWidth + 16 } },
    )
    const categoryEnd = tableEnd()
    doc.setPage(1)
    drawTable(
        pdfColumnsFrom(districtColumns(context), [
            'Distrito',
            'Reuniones',
            'Diezmadores',
            'Sobres',
            'Total recibido',
            '% del total',
        ]),
        context.districts,
        y,
        { margin: { ...tableTheme.margin, left: PDF_MARGIN + halfWidth + 16 } },
    )
    const districtEnd = tableEnd()
    const breakdownEnd =
        categoryEnd.page === districtEnd.page
            ? { page: districtEnd.page, y: Math.max(categoryEnd.y, districtEnd.y) }
            : categoryEnd.page > districtEnd.page
              ? categoryEnd
              : districtEnd
    doc.setPage(breakdownEnd.page)
    y = breakdownEnd.y

    if (hasMeetings(context)) {
        y = sectionTitle(
            'Total recibido por reunión',
            hasTithes(context)
                ? `${summary.meetingCount} reuniones y los diezmos · ordenadas por monto`
                : `${summary.meetingCount} reuniones · ordenadas por monto`,
            ensureSpace(y + 24, 120),
        )
        const meetingTable = meetingColumns(context)
        const meetingRank = new Map(context.meetings.map((item, index) => [item, index + 1]))
        drawTable(
            [
                {
                    header: '#',
                    kind: 'integer',
                    value: (item: MeetingReportAggregate) => meetingRank.get(item) ?? null,
                    width: 22,
                },
                ...pdfColumnsFrom(meetingTable, ['Código', 'Reunión', 'Tipo']),
                {
                    header: 'Territorio',
                    kind: 'text',
                    value: (item: MeetingReportAggregate) => reportAggregateTerritoryLabel(item),
                },
                ...pdfColumnsFrom(meetingTable, [
                    'Sobres',
                    ...pdfCategoryHeaders(context),
                    'Total recibido',
                    '% del total',
                ]),
            ],
            context.meetings,
            y,
        )
        y = lastY()
    }

    if (hasTithes(context)) {
        y = sectionTitle(
            'Diezmos por diezmador',
            `${countLabel(summary.titherCount, 'diezmador', 'diezmadores')} · ${formatReportMoney(summary.titheTotal)} en ${countLabel(summary.titheCount, 'sobre', 'sobres')}`,
            ensureSpace(y + 24, 120),
        )
        const titherTable = titherColumns(context)
        const titherRank = new Map(context.tithers.map((item, index) => [item, index + 1]))
        drawTable(
            [
                {
                    header: '#',
                    kind: 'integer',
                    value: (item: TitherReportAggregate) => titherRank.get(item) ?? null,
                    width: 22,
                },
                ...pdfColumnsFrom(titherTable, ['Código', 'Diezmador']),
                {
                    header: 'Territorio',
                    kind: 'text',
                    value: (item: TitherReportAggregate) => reportTerritoryLabel(item),
                },
                ...pdfColumnsFrom(titherTable, [
                    'Sobres',
                    'Total recibido',
                    'Promedio por sobre',
                    '% de los diezmos',
                    'Última recepción',
                ]),
            ],
            context.tithers,
            y,
        )
    }

    doc.addPage()
    y = sectionTitle(
        'Detalle por sobre',
        `${countLabel(context.rows.length, 'sobre recibido', 'sobres recibidos')} en el período`,
        PDF_MARGIN + 30,
    )
    const detailTable = detailColumns(context)
    drawTable(
        [
            ...pdfColumnsFrom(detailTable, [
                'Fecha de recepción',
                sourceDateHeader(context),
                'Código',
                subjectHeader(context),
            ]),
            {
                header: 'Territorio',
                kind: 'text',
                value: (row: MeetingReportRow) => reportTerritoryLabel(row),
            },
            ...pdfColumnsFrom(detailTable, [
                ...pdfCategoryHeaders(context),
                'Total recibido',
                'Estado del sobre',
                'Recibido por',
            ]),
        ],
        context.rows,
        y,
    )

    const totalPages = doc.getNumberOfPages()
    for (let page = 1; page <= totalPages; page += 1) {
        doc.setPage(page)
        if (page > 1) {
            doc.setFillColor(...PDF_BRAND)
            doc.rect(0, 0, pageWidth, 4, 'F')
            doc.setFont('helvetica', 'bold')
            doc.setFontSize(9)
            doc.setTextColor(...PDF_TEXT)
            doc.text(pdfText(context.title), PDF_MARGIN, PDF_MARGIN)
            doc.setFont('helvetica', 'normal')
            doc.setTextColor(...PDF_MUTED)
            doc.text(rangeLabel, pageWidth - PDF_MARGIN, PDF_MARGIN, { align: 'right' })
        }
        doc.setDrawColor(...PDF_BORDER)
        doc.line(PDF_MARGIN, pageHeight - 30, pageWidth - PDF_MARGIN, pageHeight - 30)
        doc.setFont('helvetica', 'normal')
        doc.setFontSize(7.5)
        doc.setTextColor(...PDF_MUTED)
        doc.text(pdfText(`${context.appName} · ${context.title}`), PDF_MARGIN, pageHeight - 18)
        doc.text(`Página ${page} de ${totalPages}`, pageWidth - PDF_MARGIN, pageHeight - 18, {
            align: 'right',
        })
    }

    doc.save(`${fileBaseName(context.range)}.pdf`)
}
