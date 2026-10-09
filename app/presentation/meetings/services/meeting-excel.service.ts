import type { AxiosInstance } from 'axios'
import {
    frequencyOptions,
    monthlyModeOptions,
    weekdayOptions,
    weekOrdinalOptions,
} from '../constants/meeting.constants'
import type {
    MeetingInput,
    MeetingRecord,
    MeetingTypeOption,
    MemberOption,
    SectorOption,
} from '../interfaces/meeting.interface'
import { createMeeting } from './meeting.service'

type ExcelValue = string | number | boolean | Date | null | undefined
type ExcelOutputCell = ExcelValue | Record<string, unknown>

const MEETING_COLUMNS = [
    ['Tipo *', 20],
    ['Sector *', 22],
    ['Líder *', 22],
    ['Anfitrión *', 22],
    ['Fecha de inicio *', 18],
    ['Hora de inicio *', 16],
    ['Hora de fin *', 16],
    ['Frecuencia *', 18],
    ['Fecha fin de recurrencia', 22],
    ['Modo mensual', 18],
    ['Ordinal', 14],
    ['Día de semana', 18],
    ['Ubicación *', 38],
    ['Asistentes esperados', 20],
    ['Descripción', 46],
] as const

const MEETING_HEADERS = MEETING_COLUMNS.map(([header]) => header)

const DEFAULT_COLOR = '#e9c176'
const MAX_FILE_SIZE = 5 * 1024 * 1024
const MAX_ROWS = 500

export interface MeetingImportCatalogs {
    meetingTypes: MeetingTypeOption[]
    sectors: SectorOption[]
    leaders: MemberOption[]
    hosts: MemberOption[]
}

export interface MeetingWorkbookImportRow {
    rowNumber: number
    input: MeetingInput
    rawValues: ExcelValue[]
    issues: string[]
}

export interface MeetingImportPreview {
    rows: MeetingWorkbookImportRow[]
    fileErrors: string[]
}

export interface MeetingImportFailure {
    rowNumber: number
    reasons: string[]
}

export interface MeetingImportResult {
    created: number
    failures: MeetingImportFailure[]
}

function headerCell(value: string, warning = false) {
    return {
        value,
        fontWeight: 'bold' as const,
        textColor: '#FFFFFF',
        backgroundColor: warning ? '#B42318' : '#6B4F3A',
        borderColor: warning ? '#912018' : '#B9AA9E',
        borderStyle: 'thin' as const,
        align: 'center' as const,
        alignVertical: 'center' as const,
        wrap: true,
    }
}

function sectionCell(value: string) {
    return {
        value,
        fontWeight: 'bold' as const,
        textColor: '#FFFFFF',
        backgroundColor: '#6B4F3A',
        borderColor: '#B9AA9E',
        borderStyle: 'thin' as const,
        wrap: true,
    }
}

function bodyCell(value: ExcelValue, alternate: boolean) {
    return {
        value,
        backgroundColor: alternate ? '#FBF7F0' : '#FFFFFF',
        textColor: '#352F2B',
        borderColor: '#DED4CA',
        borderStyle: 'thin' as const,
        alignVertical: 'center' as const,
        wrap: true,
    }
}

function meetingsSheet(rows: ExcelValue[][], failureReasons?: string[]) {
    const headers = failureReasons
        ? [...MEETING_HEADERS, 'Motivo del rechazo']
        : [...MEETING_HEADERS]
    const dataRows = rows.map((row, index) => {
        const values = failureReasons ? [...row, failureReasons[index] ?? ''] : row
        return values.map((value, columnIndex) => ({
            ...bodyCell(value, index % 2 === 1),
            ...(failureReasons && columnIndex === values.length - 1
                ? { textColor: '#B42318', backgroundColor: '#FEF3F2' }
                : {}),
        }))
    })

    return {
        data: [
            headers.map((header) => headerCell(header, header === 'Motivo del rechazo')),
            ...dataRows,
        ] as never[][],
        sheet: 'Reuniones',
        columns: [
            ...MEETING_COLUMNS.map(([, width]) => width),
            ...(failureReasons ? [58] : []),
        ].map((width) => ({ width })),
        stickyRowsCount: 1,
        stickyColumnsCount: 3,
        showGridLines: false,
        orientation: 'landscape' as const,
    }
}

function instructionsSheet() {
    const emptyCells = [null, null, null]
    const rows: ExcelOutputCell[][] = [
        [
            {
                value: 'Guía de importación de reuniones',
                fontWeight: 'bold',
                fontSize: 18,
                textColor: '#6B4F3A',
                columnSpan: 4,
            },
            ...emptyCells,
        ],
        [
            {
                value: 'Llena solo la pestaña Reuniones. Copia los códigos de las demás pestañas.',
                textColor: '#655D58',
                columnSpan: 4,
                wrap: true,
            },
            ...emptyCells,
        ],
        [
            sectionCell('Campo'),
            sectionCell('Obligatorio'),
            sectionCell('Cómo completarlo'),
            sectionCell('Ejemplo'),
        ],
        [
            'Tipo, Sector, Líder, Anfitrión',
            'Sí',
            'Copia el código de su pestaña. Si el tipo es de toda la iglesia, deja vacíos Sector, Líder y Anfitrión.',
            'C, D1Z2S3, MIE-0012, MIE-0018',
        ],
        [
            'Fecha y horas',
            'Sí',
            'Fecha AAAA-MM-DD o DD/MM/AAAA. Horas de 24 horas (HH:mm).',
            '2026-09-05, 19:00, 20:30',
        ],
        [
            'Frecuencia',
            'Sí',
            'Un valor de la pestaña Frecuencias. La fecha fin de recurrencia es opcional.',
            'semanal',
        ],
        [
            'Modo mensual',
            'Solo mensual',
            'dia_fijo u ordinal. Con ordinal llena también Ordinal y Día de semana.',
            'ordinal, 2, martes',
        ],
        ['Ubicación', 'Sí', 'Nombre o dirección del lugar.', 'Templo central'],
        [
            'Automático',
            '—',
            'El título, el supervisor y el color se asignan solos. Las reuniones se crean activas.',
            '—',
        ],
        [
            'Errores',
            '—',
            'Antes de guardar verás los errores por fila. Las filas con error se descargan en otro Excel con el motivo.',
            '—',
        ],
    ]

    return {
        data: rows as never[][],
        sheet: 'Instrucciones',
        columns: [{ width: 25 }, { width: 18 }, { width: 82 }, { width: 42 }],
        stickyRowsCount: 3,
        showGridLines: false,
    }
}

function catalogSheet(
    sheet: string,
    title: string,
    description: string,
    headers: string[],
    rows: ExcelValue[][],
    widths: number[],
) {
    const columnCount = headers.length
    const emptyCells = Array.from({ length: Math.max(0, columnCount - 1) }, () => null)

    return {
        data: [
            [
                {
                    value: title,
                    fontWeight: 'bold',
                    fontSize: 16,
                    textColor: '#FFFFFF',
                    backgroundColor: '#6B4F3A',
                    columnSpan: columnCount,
                },
                ...emptyCells,
            ],
            [
                {
                    value: description,
                    textColor: '#655D58',
                    backgroundColor: '#F7EFE3',
                    columnSpan: columnCount,
                    wrap: true,
                },
                ...emptyCells,
            ],
            headers.map((header) => sectionCell(header)),
            ...rows.map((row, index) => row.map((value) => bodyCell(value, index % 2 === 1))),
        ] as never[][],
        sheet,
        columns: widths.map((width) => ({ width })),
        stickyRowsCount: 3,
        showGridLines: false,
    }
}

function catalogSheets(catalogs: MeetingImportCatalogs) {
    return [
        catalogSheet(
            'Tipos',
            'Tipos de reunión',
            'Copia el segmento en la columna Tipo de la pestaña Reuniones.',
            ['Segmento', 'Nombre', 'Alcance', 'Estado'],
            catalogs.meetingTypes.map((type) => [
                type.codeSegment,
                type.name,
                type.isGeneral ? 'Toda la iglesia' : 'Sector',
                type.isActive ? 'Activo' : 'Inactivo',
            ]),
            [22, 36, 20, 18],
        ),
        catalogSheet(
            'Sectores',
            'Sectores disponibles',
            'Copia el código del sector: distrito + zona + sector (D1Z2S3). Su supervisor se asignará automáticamente.',
            ['Código', 'Nombre', 'Zona', 'Distrito', 'Supervisor'],
            catalogs.sectors.map((sector) => [
                sector.pathCode,
                sector.name,
                sector.zoneName,
                sector.districtName,
                sector.supervisorName ?? 'Sin supervisor',
            ]),
            [18, 34, 28, 28, 38],
        ),
        catalogSheet(
            'Lideres',
            'Líderes habilitados',
            'Solo estos miembros pueden utilizarse en la columna Líder.',
            ['Código', 'Nombre', 'Estado'],
            catalogs.leaders.map((leader) => [leader.code, leader.fullName, leader.status]),
            [24, 46, 18],
        ),
        catalogSheet(
            'Anfitriones',
            'Anfitriones habilitados',
            'Solo estos miembros pueden utilizarse en la columna Anfitrión.',
            ['Código', 'Nombre', 'Estado'],
            catalogs.hosts.map((host) => [host.code, host.fullName, host.status]),
            [24, 46, 18],
        ),
        catalogSheet(
            'Frecuencias',
            'Frecuencias admitidas',
            'Usa el valor de la columna Código.',
            ['Código', 'Descripción'],
            frequencyOptions.map((option) => [option.value, option.label]),
            [24, 42],
        ),
        catalogSheet(
            'Modos mensuales',
            'Modos para frecuencia mensual',
            'dia_fijo repite la fecha del mes; ordinal usa una posición y un día de semana.',
            ['Código', 'Descripción'],
            monthlyModeOptions.map((option) => [option.value, option.label]),
            [26, 52],
        ),
        catalogSheet(
            'Ordinales',
            'Posiciones dentro del mes',
            'Solo se utiliza con frecuencia mensual y modo ordinal.',
            ['Código', 'Descripción'],
            weekOrdinalOptions.map((option) => [option.value, option.label]),
            [22, 36],
        ),
        catalogSheet(
            'Dias semana',
            'Días de la semana',
            'Puedes escribir el código o el nombre del día.',
            ['Código', 'Descripción'],
            weekdayOptions.map((option) => [option.value, option.label]),
            [22, 36],
        ),
    ]
}

async function writeMeetingsWorkbook(
    rows: ExcelValue[][],
    catalogs: MeetingImportCatalogs,
    filename: string,
    failureReasons?: string[],
) {
    const { default: writeExcelFile } = await import('write-excel-file/browser')

    await writeExcelFile(
        [instructionsSheet(), meetingsSheet(rows, failureReasons), ...catalogSheets(catalogs)],
        { fontFamily: 'Arial', fontSize: 10 },
    ).toFile(filename)
}

export function downloadMeetingsTemplate(catalogs: MeetingImportCatalogs) {
    return writeMeetingsWorkbook([], catalogs, 'plantilla-importacion-reuniones.xlsx')
}

function text(value: ExcelValue) {
    return value == null ? '' : String(value).trim()
}

function normalize(value: string) {
    return value
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .trim()
        .toLowerCase()
}

function normalizeHeader(value: string) {
    return normalize(value).replace(/\*/g, '').replace(/\s+/g, ' ').trim()
}

function validateText(value: string, field: string, max: number, issues: string[], min = 0) {
    if (value.length < min) issues.push(`${field}: debe tener al menos ${min} caracteres.`)
    if (value.length > max) issues.push(`${field}: no puede superar ${max} caracteres.`)
}

function validIsoDate(year: number, month: number, day: number) {
    const date = new Date(Date.UTC(year, month - 1, day))
    return (
        date.getUTCFullYear() === year &&
        date.getUTCMonth() === month - 1 &&
        date.getUTCDate() === day
    )
}

function parseDate(value: ExcelValue, field: string, issues: string[], required = false) {
    if (value instanceof Date && !Number.isNaN(value.getTime())) {
        const year = value.getFullYear()
        const month = value.getMonth() + 1
        const day = value.getDate()
        if (validIsoDate(year, month, day)) {
            return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
        }
    }

    const input = text(value)
    if (!input) {
        if (required) issues.push(`${field}: es obligatoria.`)
        return null
    }

    const iso = input.match(/^(\d{4})-(\d{2})-(\d{2})$/)
    const dayFirst = input.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/)
    const year = Number(iso?.[1] ?? dayFirst?.[3])
    const month = Number(iso?.[2] ?? dayFirst?.[2])
    const day = Number(iso?.[3] ?? dayFirst?.[1])
    if ((iso || dayFirst) && validIsoDate(year, month, day)) {
        return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
    }

    issues.push(`${field}: “${input}” no es una fecha válida.`)
    return null
}

function parseTime(value: ExcelValue, field: string, issues: string[]) {
    if (value instanceof Date && !Number.isNaN(value.getTime())) {
        return `${String(value.getHours()).padStart(2, '0')}:${String(value.getMinutes()).padStart(2, '0')}`
    }
    if (typeof value === 'number' && value >= 0 && value < 1) {
        const totalMinutes = Math.round(value * 24 * 60) % (24 * 60)
        return `${String(Math.floor(totalMinutes / 60)).padStart(2, '0')}:${String(totalMinutes % 60).padStart(2, '0')}`
    }

    const input = text(value)
    const match = input.match(/^(\d{1,2}):(\d{2})$/)
    const hours = Number(match?.[1])
    const minutes = Number(match?.[2])
    if (match && hours >= 0 && hours <= 23 && minutes >= 0 && minutes <= 59) {
        return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`
    }

    issues.push(`${field}: usa el formato de 24 horas HH:mm.`)
    return ''
}

function parseNumber(
    value: ExcelValue,
    field: string,
    issues: string[],
    options: { min: number; max: number; integer?: boolean; required?: boolean },
) {
    const input = text(value)
    if (!input) {
        if (options.required) issues.push(`${field}: es obligatorio.`)
        return null
    }
    const parsed = typeof value === 'number' ? value : Number(input.replace(',', '.'))
    if (
        !Number.isFinite(parsed) ||
        parsed < options.min ||
        parsed > options.max ||
        (options.integer && !Number.isInteger(parsed))
    ) {
        issues.push(
            `${field}: debe ser ${options.integer ? 'un entero' : 'un número'} entre ${options.min} y ${options.max}.`,
        )
        return null
    }
    return parsed
}

function resolveCatalogItem<T>(
    value: ExcelValue,
    items: T[],
    field: string,
    issues: string[],
    codeOf: (item: T) => string,
    labelOf: (item: T) => string,
) {
    const raw = text(value)
    const input = normalize(raw)
    if (!input) {
        issues.push(`${field}: es obligatorio.`)
        return null
    }

    const codeMatch = items.find((item) => normalize(codeOf(item)) === input)
    if (codeMatch) return codeMatch

    const labelMatches = items.filter((item) => normalize(labelOf(item)) === input)
    if (labelMatches.length === 1) return labelMatches[0]!
    issues.push(
        labelMatches.length > 1
            ? `${field}: el nombre “${raw}” es ambiguo; utiliza el código del catálogo.`
            : `${field}: “${raw}” no pertenece al catálogo.`,
    )
    return null
}

function resolveFrequency(value: ExcelValue, issues: string[]) {
    const raw = text(value)
    const input = normalize(raw)
    const option = frequencyOptions.find(
        (item) => normalize(item.value) === input || normalize(item.label) === input,
    )
    if (option) return option.value
    issues.push(`Frecuencia: “${raw}” no pertenece al catálogo.`)
    return 'unica' as const
}

function resolveMonthlyMode(value: ExcelValue, issues: string[]) {
    const raw = text(value)
    const input = normalize(raw)
    if (!input) return 'dia_fijo' as const
    const option = monthlyModeOptions.find(
        (item) => normalize(item.value) === input || normalize(item.label) === input,
    )
    if (option) return option.value
    issues.push(`Modo mensual: “${raw}” no pertenece al catálogo.`)
    return 'dia_fijo' as const
}

function resolveWeekOrdinal(value: ExcelValue, issues: string[]) {
    const raw = text(value)
    const input = normalize(raw)
    const numeric = Number(input)
    const option = weekOrdinalOptions.find(
        (item) => item.value === numeric || normalize(item.label) === input,
    )
    if (option) return option.value
    issues.push(`Ordinal: “${raw}” no pertenece al catálogo.`)
    return null
}

function resolveWeekday(value: ExcelValue, issues: string[]) {
    const raw = text(value)
    const input = normalize(raw)
    const numeric = Number(input)
    const option = weekdayOptions.find(
        (item) => item.value === numeric || normalize(item.label) === input,
    )
    if (option) return option.value
    issues.push(`Día de semana: “${raw}” no pertenece al catálogo.`)
    return null
}

type MeetingKeyFields = Pick<
    MeetingInput,
    'sectorId' | 'typeId' | 'leaderId' | 'date' | 'startTime' | 'endTime'
>

function meetingKey(input: MeetingKeyFields) {
    return [
        input.sectorId,
        input.typeId,
        input.leaderId,
        input.date,
        input.startTime,
        input.endTime,
    ].join('|')
}

export async function parseMeetingsWorkbook(
    file: File,
    catalogs: MeetingImportCatalogs,
    existingMeetings: MeetingRecord[],
): Promise<MeetingImportPreview> {
    if (file.size > MAX_FILE_SIZE) {
        return { rows: [], fileErrors: ['El archivo supera el límite de 5 MB.'] }
    }

    const { readSheet } = await import('read-excel-file/browser')
    let excelRows: ExcelValue[][]
    try {
        excelRows = (await readSheet(file, 'Reuniones')) as ExcelValue[][]
    } catch {
        return {
            rows: [],
            fileErrors: ['No se encontró o no se pudo leer la pestaña Reuniones.'],
        }
    }
    if (!excelRows.length) {
        return { rows: [], fileErrors: ['La pestaña Reuniones no contiene datos.'] }
    }

    const headerIndexes = new Map(
        excelRows[0]!.map((cell, index) => [normalizeHeader(text(cell)), index]),
    )
    const requiredHeaders = MEETING_HEADERS.filter((header) => header.endsWith('*'))
    const missingHeaders = requiredHeaders.filter(
        (header) => headerIndexes.get(normalizeHeader(header)) == null,
    )
    if (missingHeaders.length) {
        return {
            rows: [],
            fileErrors: [`Faltan columnas obligatorias: ${missingHeaders.join(', ')}.`],
        }
    }

    const value = (row: ExcelValue[], header: (typeof MEETING_HEADERS)[number]) => {
        const index = headerIndexes.get(normalizeHeader(header))
        return index == null ? null : row[index]
    }
    const rows: MeetingWorkbookImportRow[] = []
    const existingKeys = new Set(existingMeetings.map((meeting) => meetingKey(meeting)))
    const importedKeys = new Map<string, MeetingWorkbookImportRow[]>()

    excelRows.slice(1).forEach((row, index) => {
        if (!row.some((cell) => text(cell))) return
        const rowNumber = index + 2
        const issues: string[] = []
        if (rows.length >= MAX_ROWS) {
            issues.push(`El archivo supera el límite de ${MAX_ROWS} reuniones.`)
        }

        const description = text(value(row, 'Descripción'))
        const location = text(value(row, 'Ubicación *'))
        validateText(description, 'Descripción', 300, issues)
        validateText(location, 'Ubicación', 300, issues, 2)

        const type = resolveCatalogItem(
            value(row, 'Tipo *'),
            catalogs.meetingTypes,
            'Tipo',
            issues,
            (item) => item.codeSegment,
            (item) => item.name,
        )
        const isGeneral = type?.isGeneral ?? false
        const sector = isGeneral
            ? null
            : resolveCatalogItem(
                  value(row, 'Sector *'),
                  catalogs.sectors,
                  'Sector',
                  issues,
                  (item) => item.pathCode,
                  (item) => item.name,
              )
        const leader = isGeneral
            ? null
            : resolveCatalogItem(
                  value(row, 'Líder *'),
                  catalogs.leaders,
                  'Líder',
                  issues,
                  (item) => item.code,
                  (item) => item.fullName,
              )
        const host = isGeneral
            ? null
            : resolveCatalogItem(
                  value(row, 'Anfitrión *'),
                  catalogs.hosts,
                  'Anfitrión',
                  issues,
                  (item) => item.code,
                  (item) => item.fullName,
              )
        if (sector && !sector.supervisorId) {
            issues.push('Sector: debe tener un supervisor asignado antes de crear reuniones.')
        }

        const date = parseDate(value(row, 'Fecha de inicio *'), 'Fecha de inicio', issues, true)
        const startTime = parseTime(value(row, 'Hora de inicio *'), 'Hora de inicio', issues)
        const endTime = parseTime(value(row, 'Hora de fin *'), 'Hora de fin', issues)
        if (startTime && endTime && startTime >= endTime) {
            issues.push('Hora de fin: debe ser posterior a la hora de inicio.')
        }

        const frequency = resolveFrequency(value(row, 'Frecuencia *'), issues)
        const recurrenceEndDate =
            frequency === 'unica'
                ? null
                : parseDate(
                      value(row, 'Fecha fin de recurrencia'),
                      'Fecha fin de recurrencia',
                      issues,
                  )
        if (date && recurrenceEndDate && recurrenceEndDate < date) {
            issues.push('Fecha fin de recurrencia: debe ser igual o posterior al inicio.')
        }

        const monthlyMode =
            frequency === 'mensual' ? resolveMonthlyMode(value(row, 'Modo mensual'), issues) : null
        const weekOrdinal =
            frequency === 'mensual' && monthlyMode === 'ordinal'
                ? resolveWeekOrdinal(value(row, 'Ordinal'), issues)
                : null
        const weekday =
            frequency === 'mensual' && monthlyMode === 'ordinal'
                ? resolveWeekday(value(row, 'Día de semana'), issues)
                : null

        const expectedAttendees =
            parseNumber(value(row, 'Asistentes esperados'), 'Asistentes esperados', issues, {
                min: 0,
                max: 1_000_000,
                integer: true,
            }) ?? 0

        const input: MeetingInput = {
            typeId: type?.id ?? 0,
            sectorId: isGeneral ? null : (sector?.id ?? 0),
            leaderId: isGeneral ? null : (leader?.id ?? 0),
            supervisorId: isGeneral ? null : (sector?.supervisorId ?? 0),
            hostId: isGeneral ? null : (host?.id ?? 0),
            coSupervisorIds: [],
            title: '',
            description: description || null,
            date: date ?? '',
            recurrenceEndDate,
            startTime,
            endTime,
            location,
            latitude: null,
            longitude: null,
            frequency,
            monthlyMode,
            weekOrdinal,
            weekday,
            expectedAttendees,
            isActive: true,
            isPublic: false,
            notes: null,
            color: type?.color ?? DEFAULT_COLOR,
        }
        const parsedRow: MeetingWorkbookImportRow = {
            rowNumber,
            input,
            rawValues: MEETING_HEADERS.map((header) => value(row, header)),
            issues,
        }
        rows.push(parsedRow)

        if (type && (isGeneral || (sector && leader)) && date && startTime && endTime) {
            const key = meetingKey(input)
            if (existingKeys.has(key)) {
                issues.push('Reunión: ya existe un registro con los mismos datos principales.')
            }
            const matches = importedKeys.get(key) ?? []
            matches.push(parsedRow)
            importedKeys.set(key, matches)
        }
    })

    importedKeys.forEach((matches) => {
        if (matches.length < 2) return
        matches.forEach((row) =>
            row.issues.push('Reunión: está duplicada dentro de la pestaña Reuniones.'),
        )
    })

    const fileErrors: string[] = []
    if (!rows.length) fileErrors.push('No se encontraron reuniones para importar.')
    return { rows, fileErrors }
}

function requestErrorMessage(error: unknown) {
    const response = (
        error as { response?: { data?: { message?: string; error?: { details?: string } } } }
    )?.response?.data
    if (response?.error?.details) return response.error.details
    if (response?.message) return response.message
    if (error instanceof Error && error.message) return error.message
    return 'No fue posible crear la reunión.'
}

export async function importMeetings(
    apiClient: AxiosInstance,
    rows: MeetingWorkbookImportRow[],
): Promise<MeetingImportResult> {
    const result: MeetingImportResult = { created: 0, failures: [] }

    for (const row of rows.filter((item) => !item.issues.length)) {
        try {
            await createMeeting(apiClient, row.input)
            result.created += 1
        } catch (error) {
            result.failures.push({
                rowNumber: row.rowNumber,
                reasons: [requestErrorMessage(error)],
            })
        }
    }

    return result
}

export function downloadMeetingImportFailures(
    rows: MeetingWorkbookImportRow[],
    failures: MeetingImportFailure[],
    catalogs: MeetingImportCatalogs,
) {
    const failureByRow = new Map(
        failures.map((failure) => [failure.rowNumber, failure.reasons.join(' | ')]),
    )
    const failedRows = rows.filter((row) => failureByRow.has(row.rowNumber))

    return writeMeetingsWorkbook(
        failedRows.map((row) => row.rawValues),
        catalogs,
        `reuniones-pendientes-${new Date().toISOString().slice(0, 10)}.xlsx`,
        failedRows.map((row) => failureByRow.get(row.rowNumber) ?? ''),
    )
}
