import type {
    CategoryReportTotal,
    DistrictReportAggregate,
    MeetingReportAggregate,
    MeetingReportRow,
    ReportCategory,
    ReportDateRange,
    ReportSummary,
} from '../interfaces/meeting-report.interface'
import { UNCATEGORIZED_LABEL, sumAttendance, sumCategory } from '../utils/meeting-report.util'
import {
    formatReportDate,
    formatReportDateTime,
    formatReportMoney,
    formatReportNumber,
    formatReportPercent,
    formatReportRange,
    formatReportSignedMoney,
    formatReportWeekday,
    reportDistrictLabel,
    reportReceptionLabel,
    reportStatusLabel,
    reportTerritoryLabel,
} from '../utils/report-format.util'

export interface MeetingReportExportContext {
    appName: string
    title: string
    range: ReportDateRange
    generatedAt: string
    filterLabels: string[]
    summary: ReportSummary
    categories: ReportCategory[]
    showUncategorized: boolean
    categoryTotals: CategoryReportTotal[]
    meetings: MeetingReportAggregate[]
    districts: DistrictReportAggregate[]
    rows: MeetingReportRow[]
}

export type MeetingReportCsvKind = 'reuniones' | 'detalle'

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
    return `reporte-reuniones_${range.from}_${range.to}`
}

function categoryColumns<T>(
    context: MeetingReportExportContext,
    amountOf: (item: T, categoryId: number) => number,
    uncategorizedOf: (item: T) => number,
): ExportColumn<T>[] {
    const columns: ExportColumn<T>[] = context.categories.map((category) => ({
        header: category.name,
        width: Math.max(14, category.name.length + 4),
        kind: 'money',
        value: (item) => amountOf(item, category.id),
        total: context.categoryTotals.find((total) => total.id === category.id)?.amount ?? 0,
    }))
    if (context.showUncategorized) {
        columns.push({
            header: UNCATEGORIZED_LABEL,
            width: 16,
            kind: 'money',
            value: uncategorizedOf,
            total:
                context.categoryTotals.find((total) => total.id === 'uncategorized')?.amount ?? 0,
        })
    }
    return columns
}

function meetingColumns(
    context: MeetingReportExportContext,
): ExportColumn<MeetingReportAggregate>[] {
    const { summary, meetings } = context
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
            value: (item) => reportDistrictLabel(item),
        },
        { header: 'Zona', width: 18, kind: 'text', value: (item) => item.zoneName ?? '' },
        { header: 'Sector', width: 18, kind: 'text', value: (item) => item.sectorName ?? '' },
        { header: 'Líder', width: 26, kind: 'text', value: (item) => item.leaderName ?? '' },
        {
            header: 'Fechas',
            width: 10,
            kind: 'integer',
            value: (item) => item.occurrenceCount,
            total: summary.occurrenceCount,
        },
        {
            header: 'Registradas',
            width: 12,
            kind: 'integer',
            value: (item) => item.recordedCount,
            total: summary.recordedCount,
        },
        {
            header: 'Pendientes',
            width: 12,
            kind: 'integer',
            value: (item) => item.pendingCount,
            total: summary.pendingCount,
        },
        {
            header: 'Asistencia',
            width: 12,
            kind: 'integer',
            value: (item) => item.attendance,
            total: meetings.reduce((sum, item) => sum + item.attendance, 0),
        },
        {
            header: 'Prom. asistencia',
            width: 15,
            kind: 'decimal',
            value: (item) => item.averageAttendance,
            total: summary.averageAttendance,
        },
        ...categoryColumns<MeetingReportAggregate>(
            context,
            (item, categoryId) => item.categoryAmounts[categoryId] ?? 0,
            (item) => item.uncategorizedAmount,
        ),
        {
            header: 'Total ofrendas',
            width: 16,
            kind: 'money',
            value: (item) => item.totalOfferings,
            total: summary.totalOfferings,
        },
        {
            header: 'Promedio por fecha',
            width: 18,
            kind: 'money',
            value: (item) => item.averageOffering,
            total: summary.averagePerOccurrence,
        },
        {
            header: '% del total',
            width: 12,
            kind: 'percent',
            value: (item) => item.share,
            total: summary.totalOfferings > 0 ? 1 : 0,
        },
        {
            header: 'Recibido comité',
            width: 16,
            kind: 'money',
            value: (item) => item.receivedAmount,
            total: summary.receivedAmount,
        },
        {
            header: 'Diferencia',
            width: 14,
            kind: 'money',
            value: (item) => item.receivedDifference,
            total: summary.receivedDifference,
        },
        {
            header: 'Última fecha registrada',
            width: 22,
            kind: 'date',
            value: (item) => item.lastRecordedDate,
        },
    ]
}

function detailColumns(context: MeetingReportExportContext): ExportColumn<MeetingReportRow>[] {
    const { summary, rows } = context
    return [
        {
            header: 'Fecha',
            width: 13,
            kind: 'date',
            value: (row) => row.date,
            total: TOTAL_LABEL,
        },
        { header: 'Día', width: 12, kind: 'text', value: (row) => formatReportWeekday(row.date) },
        { header: 'Código', width: 20, kind: 'text', value: (row) => row.meetingCode },
        { header: 'Reunión', width: 34, kind: 'text', value: (row) => row.meetingTitle },
        { header: 'Tipo', width: 18, kind: 'text', value: (row) => row.meetingTypeName },
        { header: 'Distrito', width: 20, kind: 'text', value: (row) => reportDistrictLabel(row) },
        { header: 'Zona', width: 18, kind: 'text', value: (row) => row.zoneName ?? '' },
        { header: 'Sector', width: 18, kind: 'text', value: (row) => row.sectorName ?? '' },
        { header: 'Líder', width: 26, kind: 'text', value: (row) => row.leaderName ?? '' },
        {
            header: 'Estado',
            width: 12,
            kind: 'text',
            value: (row) => reportStatusLabel(row.status),
        },
        {
            header: 'Asistencia',
            width: 12,
            kind: 'integer',
            value: (row) => row.attendance,
            total: sumAttendance(rows),
        },
        ...categoryColumns<MeetingReportRow>(
            context,
            (row, categoryId) => sumCategory([row], categoryId),
            (row) => row.uncategorizedAmount,
        ),
        {
            header: 'Total ofrenda',
            width: 15,
            kind: 'money',
            value: (row) => row.totalAmount,
            total: summary.totalOfferings,
        },
        {
            header: 'Recepción',
            width: 18,
            kind: 'text',
            value: (row) => reportReceptionLabel(row.reception, row.status),
        },
        {
            header: 'Recibido',
            width: 14,
            kind: 'money',
            value: (row) => row.reception?.receivedAmount ?? null,
            total: summary.receivedAmount,
        },
        {
            header: 'Diferencia',
            width: 14,
            kind: 'money',
            value: (row) => row.reception?.difference ?? null,
            total: summary.receivedDifference,
        },
        {
            header: 'Registrado por',
            width: 24,
            kind: 'text',
            value: (row) => row.recordedByName ?? '',
        },
        {
            header: 'Fecha de registro',
            width: 22,
            kind: 'text',
            value: (row) => (row.recordedAt ? formatReportDateTime(row.recordedAt) : ''),
        },
    ]
}

function districtColumns(
    context: MeetingReportExportContext,
): ExportColumn<DistrictReportAggregate>[] {
    const { summary, districts } = context
    return [
        {
            header: 'Distrito',
            width: 24,
            kind: 'text',
            value: (item) => item.districtName,
            total: TOTAL_LABEL,
        },
        {
            header: 'Reuniones',
            width: 12,
            kind: 'integer',
            value: (item) => item.meetingCount,
            total: summary.meetingCount,
        },
        {
            header: 'Fechas',
            width: 10,
            kind: 'integer',
            value: (item) => item.occurrenceCount,
            total: summary.occurrenceCount,
        },
        {
            header: 'Registradas',
            width: 12,
            kind: 'integer',
            value: (item) => item.recordedCount,
            total: summary.recordedCount,
        },
        {
            header: 'Asistencia',
            width: 12,
            kind: 'integer',
            value: (item) => item.attendance,
            total: districts.reduce((sum, item) => sum + item.attendance, 0),
        },
        {
            header: 'Total ofrendas',
            width: 16,
            kind: 'money',
            value: (item) => item.totalOfferings,
            total: summary.totalOfferings,
        },
        {
            header: 'Promedio por fecha',
            width: 18,
            kind: 'money',
            value: (item) => item.averageOffering,
            total: summary.averagePerOccurrence,
        },
        {
            header: '% del total',
            width: 12,
            kind: 'percent',
            value: (item) => item.share,
            total: summary.totalOfferings > 0 ? 1 : 0,
        },
        {
            header: 'Recibido comité',
            width: 16,
            kind: 'money',
            value: (item) => item.receivedAmount,
            total: summary.receivedAmount,
        },
        {
            header: 'Diferencia',
            width: 14,
            kind: 'money',
            value: (item) => item.receivedDifference,
            total: summary.receivedDifference,
        },
    ]
}

function summaryLines(context: MeetingReportExportContext): [string, ExportValue, ExportKind][] {
    const { summary } = context
    return [
        ['Total de ofrendas', summary.totalOfferings, 'money'],
        ['Reuniones en el período', summary.meetingCount, 'integer'],
        ['Fechas programadas', summary.occurrenceCount, 'integer'],
        ['Fechas registradas', summary.recordedCount, 'integer'],
        ['Fechas pendientes', summary.pendingCount, 'integer'],
        ['Cumplimiento de registro', summary.complianceRate ?? 0, 'percent'],
        ['Promedio por fecha registrada', summary.averagePerOccurrence, 'money'],
        ['Promedio por reunión', summary.averagePerMeeting, 'money'],
        ['Asistencia total', summary.totalAttendance, 'integer'],
        ['Asistencia promedio por fecha', summary.averageAttendance, 'decimal'],
        ['Ofrenda por persona', summary.offeringPerAttendee, 'money'],
        ['Sobres recibidos por el comité', summary.receivedCount, 'integer'],
        ['Monto recibido por el comité', summary.receivedAmount, 'money'],
        ['Diferencia recibido vs. registrado', summary.receivedDifference, 'money'],
        ['Sobres con diferencia abierta', summary.discrepancyCount, 'integer'],
        ['Fechas registradas sin entregar', summary.unreceivedCount, 'integer'],
    ]
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
    const width = 10
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
                header: 'Monto',
                width: 0,
                kind: 'money',
                value: (item) => item.amount,
                total: context.summary.totalOfferings,
            },
            {
                header: '% del total',
                width: 0,
                kind: 'percent',
                value: (item) => item.share,
                total: context.summary.totalOfferings > 0 ? 1 : 0,
            },
        ],
        context.categoryTotals,
    ).map((row) => padRow(row, width))

    const districtTable = excelTableRows(districtColumns(context), context.districts).map((row) =>
        padRow(row, width),
    )

    const data: ExcelCell[][] = [
        padRow(
            [
                {
                    value: context.title,
                    fontWeight: 'bold',
                    fontSize: 16,
                    textColor: BRAND_COLOR,
                },
            ],
            width,
        ),
        padRow([{ value: context.appName, textColor: MUTED_TEXT }], width),
        blank(),
        labelValue('Período', formatReportRange(context.range.from, context.range.to), 'text'),
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
        sectionTitle('Ofrendas por categoría'),
        ...categoryTable,
        blank(),
        sectionTitle('Totales por distrito'),
        ...districtTable,
    ]

    return {
        data: data as never[][],
        sheet: 'Resumen',
        columns: [36, 22, 14, 14, 14, 18, 18, 14, 18, 14].map((columnWidth) => ({
            width: columnWidth,
        })),
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
            excelTableSheet('Por reunión', meetingColumns(context), context.meetings),
            excelTableSheet('Detalle por fecha', detailColumns(context), context.rows),
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
    return `﻿${lines.map((cells) => cells.map(csvEscape).join(',')).join('\r\n')}\r\n`
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
    const content =
        kind === 'reuniones'
            ? buildCsv(meetingColumns(context), context.meetings)
            : buildCsv(detailColumns(context), context.rows)
    downloadBlob(
        new Blob([content], { type: 'text/csv;charset=utf-8' }),
        `${fileBaseName(context.range)}_${kind === 'reuniones' ? 'por-reunion' : 'detalle'}.csv`,
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
const PDF_MAX_CATEGORY_COLUMNS = 4

function pdfText(value: string) {
    return value.replace(/[   ]/g, ' ').replace(/−/g, '-')
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
    if (context.categories.length > PDF_MAX_CATEGORY_COLUMNS) return []
    return [
        ...context.categories.map((category) => category.name),
        ...(context.showUncategorized ? [UNCATEGORIZED_LABEL] : []),
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
    doc.text(`Período: ${rangeLabel}`, PDF_MARGIN, PDF_MARGIN + 40)
    doc.text(
        pdfText(`Generado: ${formatReportDateTime(context.generatedAt)}`),
        pageWidth - PDF_MARGIN,
        PDF_MARGIN + 40,
        { align: 'right' },
    )
    const filtersText = pdfText(
        `Filtros: ${context.filterLabels.length > 0 ? context.filterLabels.join(' · ') : 'Ninguno'}`,
    )
    const filterLines = doc.splitTextToSize(filtersText, contentWidth) as string[]
    doc.text(filterLines, PDF_MARGIN, PDF_MARGIN + 53)

    const { summary } = context
    const kpis: [string, string, string][] = [
        [
            'Total de ofrendas',
            formatReportMoney(summary.totalOfferings),
            `${summary.recordedCount} fechas registradas`,
        ],
        [
            'Reuniones',
            String(summary.meetingCount),
            `${summary.occurrenceCount} fechas en el período`,
        ],
        [
            'Promedio por fecha',
            formatReportMoney(summary.averagePerOccurrence),
            `${formatReportMoney(summary.averagePerMeeting)} por reunión`,
        ],
        [
            'Asistencia',
            summary.totalAttendance.toLocaleString('es-SV'),
            `${formatReportNumber(summary.averageAttendance)} en promedio`,
        ],
        [
            'Cumplimiento',
            formatReportPercent(summary.complianceRate),
            `${summary.pendingCount} fechas pendientes`,
        ],
        [
            'Recibido comité',
            formatReportMoney(summary.receivedAmount),
            `Diferencia ${formatReportSignedMoney(summary.receivedDifference)}`,
        ],
    ]
    const kpiTop = PDF_MARGIN + 60 + filterLines.length * 11
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
        'Ofrendas por categoría y por distrito',
        'Distribución del total del período',
        kpiTop + 82,
    )
    const halfWidth = (contentWidth - 16) / 2
    const categoryPdfColumns: PdfColumn<CategoryReportTotal>[] = [
        { header: 'Categoría', kind: 'text', value: (item) => item.name, total: TOTAL_LABEL },
        {
            header: 'Monto',
            kind: 'money',
            value: (item) => item.amount,
            total: summary.totalOfferings,
        },
        {
            header: '% del total',
            kind: 'percent',
            value: (item) => item.share,
            total: summary.totalOfferings > 0 ? 1 : 0,
        },
    ]
    drawTable(categoryPdfColumns, context.categoryTotals, y, {
        margin: { ...tableTheme.margin, right: PDF_MARGIN + halfWidth + 16 },
    })
    const categoryEnd = tableEnd()
    doc.setPage(1)
    drawTable(
        pdfColumnsFrom(districtColumns(context), [
            'Distrito',
            'Reuniones',
            'Fechas',
            'Asistencia',
            'Total ofrendas',
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

    y = sectionTitle(
        'Total de ofrendas por reunión',
        `${context.meetings.length} reuniones · ordenadas por monto`,
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
                value: (item: MeetingReportAggregate) => reportTerritoryLabel(item),
            },
            {
                header: 'Fechas',
                kind: 'text',
                value: (item: MeetingReportAggregate) =>
                    `${item.recordedCount}/${item.occurrenceCount}`,
                total: `${summary.recordedCount}/${summary.occurrenceCount}`,
                width: 40,
            },
            ...pdfColumnsFrom(meetingTable, [
                'Asistencia',
                ...pdfCategoryHeaders(context),
                'Total ofrendas',
                '% del total',
                'Recibido comité',
                'Diferencia',
            ]),
        ],
        context.meetings,
        y,
    )

    doc.addPage()
    y = sectionTitle(
        'Detalle por fecha',
        `${context.rows.length} fechas de reunión en el período`,
        PDF_MARGIN + 30,
    )
    const detailTable = detailColumns(context)
    drawTable(
        [
            ...pdfColumnsFrom(detailTable, ['Fecha', 'Código', 'Reunión']),
            {
                header: 'Territorio',
                kind: 'text',
                value: (row: MeetingReportRow) => reportTerritoryLabel(row),
            },
            ...pdfColumnsFrom(detailTable, [
                'Estado',
                'Asistencia',
                'Total ofrenda',
                'Recepción',
                'Recibido',
                'Diferencia',
                'Registrado por',
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
