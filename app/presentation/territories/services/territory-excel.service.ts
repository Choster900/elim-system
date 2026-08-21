import type { AxiosInstance } from 'axios'
import type {
    TerritoryHierarchy,
    TerritoryInput,
    TerritoryLevel,
    TerritorySupervisorOption,
} from '../interfaces/territory.interface'
import { createTerritoryEntity } from './territory.service'

type ExcelValue = string | number | boolean | Date | null | undefined
type ExcelOutputCell = ExcelValue | Record<string, unknown>

const DISTRICT_HEADERS = [
    'Referencia *',
    'Nombre *',
    'Responsable',
    'Descripción',
    'Color',
    'Estado',
    'Polígono *',
] as const
const ZONE_HEADERS = [
    'Referencia *',
    'Distrito *',
    'Nombre *',
    'Responsable',
    'Descripción',
    'Color',
    'Estado',
    'Polígono *',
] as const
const SECTOR_HEADERS = [
    'Referencia *',
    'Zona *',
    'Nombre *',
    'Supervisor *',
    'Descripción',
    'Color',
    'Estado',
    'Polígono *',
] as const

const LEVEL_SHEET: Record<TerritoryLevel, string> = {
    distrito: 'Distritos',
    zona: 'Zonas',
    sector: 'Sectores',
}

const DEFAULT_COLORS: Record<TerritoryLevel, string> = {
    distrito: '#e9c176',
    zona: '#f4a261',
    sector: '#a3b18a',
}

export interface TerritoryWorkbookImportRow {
    level: TerritoryLevel
    rowNumber: number
    reference: string
    parentReference: string | null
    input: TerritoryInput
    rawValues: ExcelValue[]
    issues: string[]
}

export interface TerritoryImportPreview {
    districts: TerritoryWorkbookImportRow[]
    zones: TerritoryWorkbookImportRow[]
    sectors: TerritoryWorkbookImportRow[]
    fileErrors: string[]
}

export interface TerritoryImportFailure {
    level: TerritoryLevel
    rowNumber: number
    reasons: string[]
}

export interface TerritoryImportResult {
    createdDistricts: number
    createdZones: number
    createdSectors: number
    failures: TerritoryImportFailure[]
    resolvedDistrictCodes: Record<string, string>
    resolvedZoneCodes: Record<string, string>
}

interface WorkbookRows {
    districts: ExcelValue[][]
    zones: ExcelValue[][]
    sectors: ExcelValue[][]
}

interface WorkbookFailureReasons {
    districts: string[]
    zones: string[]
    sectors: string[]
}

function headerCell(value: string, warning = false) {
    return {
        value,
        fontWeight: 'bold' as const,
        textColor: warning ? '#FFFFFF' : '#201A17',
        backgroundColor: warning ? '#B42318' : '#E9C176',
        borderColor: '#B9AA9E',
        borderStyle: 'thin' as const,
        align: 'center' as const,
        alignVertical: 'center' as const,
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

function titleCell(value: string) {
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

function formatPolygon(polygon: TerritoryInput['polygon']) {
    return polygon.map(([latitude, longitude]) => `${latitude},${longitude}`).join(' | ')
}

function territorySheet(
    sheet: string,
    headers: readonly string[],
    rows: ExcelValue[][],
    widths: number[],
    failureReasons?: string[],
) {
    const outputHeaders = failureReasons ? [...headers, 'Motivo del rechazo'] : [...headers]
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
            outputHeaders.map((header) => headerCell(header, header === 'Motivo del rechazo')),
            ...dataRows,
        ] as never[][],
        sheet,
        columns: [...widths, ...(failureReasons ? [58] : [])].map((width) => ({ width })),
        stickyRowsCount: 1,
        stickyColumnsCount: sheet === 'Distritos' ? 1 : 2,
        showGridLines: false,
        orientation: 'landscape' as const,
    }
}

function instructionsSheet() {
    const emptyCells = [null, null, null]
    const rows: ExcelOutputCell[][] = [
        [
            {
                value: 'Guía de importación territorial',
                fontWeight: 'bold',
                fontSize: 18,
                textColor: '#6B4F3A',
                columnSpan: 4,
            },
            ...emptyCells,
        ],
        [
            {
                value: 'Completa las pestañas Distritos, Zonas y Sectores. Las reuniones no forman parte de esta importación.',
                textColor: '#655D58',
                columnSpan: 4,
                wrap: true,
            },
            ...emptyCells,
        ],
        [
            titleCell('Campo'),
            titleCell('Obligatorio'),
            titleCell('Cómo completarlo'),
            titleCell('Ejemplo'),
        ],
        [
            'Referencia',
            'Sí',
            'Identificador temporal único dentro del archivo. El sistema generará el código definitivo.',
            'DISTRITO-NORTE',
        ],
        [
            'Distrito / Zona',
            'Sí',
            'Usa la referencia de una fila del mismo archivo o el código de un registro que ya existe.',
            'DISTRITO-NORTE o DIS-001',
        ],
        [
            'Supervisor',
            'Solo en sectores',
            'Escribe un código de la pestaña Supervisores. El miembro debe estar activo y tener el rol SUPERVISOR.',
            'MIE-0012',
        ],
        [
            'Color',
            'No',
            'Color hexadecimal. Si queda vacío se aplicará el color predeterminado del nivel.',
            '#E9C176',
        ],
        ['Estado', 'No', 'Admite Activo o Inactivo. Si queda vacío se usará Activo.', 'Activo'],
        [
            'Polígono',
            'Sí',
            'Escribe al menos tres puntos como latitud,longitud separados por |. Puedes copiar más puntos para delimitar mejor el área.',
            '13.704,-89.204 | 13.711,-89.192 | 13.696,-89.188',
        ],
        [
            'Importación',
            '—',
            'Solo crea registros nuevos. Antes de guardar verás las filas válidas y los errores que debes corregir.',
            'No cambia registros existentes',
        ],
    ]

    return {
        data: rows as never[][],
        sheet: 'Instrucciones',
        columns: [{ width: 22 }, { width: 18 }, { width: 78 }, { width: 42 }],
        stickyRowsCount: 3,
        showGridLines: false,
    }
}

function supervisorsSheet(supervisors: TerritorySupervisorOption[]) {
    const rows = supervisors.map((supervisor) => [
        supervisor.code,
        supervisor.fullName,
        supervisor.email,
        supervisor.phone,
    ])

    return {
        data: [
            [
                {
                    value: 'Supervisores disponibles para sectores',
                    fontWeight: 'bold',
                    fontSize: 17,
                    textColor: '#FFFFFF',
                    backgroundColor: '#6B4F3A',
                    columnSpan: 4,
                },
                null,
                null,
                null,
            ],
            [
                {
                    value: 'Copia el código del supervisor en la columna Supervisor de la pestaña Sectores.',
                    textColor: '#655D58',
                    backgroundColor: '#F7EFE3',
                    columnSpan: 4,
                    wrap: true,
                },
                null,
                null,
                null,
            ],
            ['Código', 'Nombre', 'Correo', 'Teléfono'].map((header) => titleCell(header)),
            ...rows.map((row, index) => row.map((value) => bodyCell(value, index % 2 === 1))),
        ] as never[][],
        sheet: 'Supervisores',
        columns: [{ width: 22 }, { width: 42 }, { width: 34 }, { width: 22 }],
        stickyRowsCount: 3,
        showGridLines: false,
    }
}

async function writeTerritoryWorkbook(
    rows: WorkbookRows,
    supervisors: TerritorySupervisorOption[],
    filename: string,
    failureReasons?: WorkbookFailureReasons,
) {
    const { default: writeExcelFile } = await import('write-excel-file/browser')

    await writeExcelFile(
        [
            instructionsSheet(),
            territorySheet(
                'Distritos',
                DISTRICT_HEADERS,
                rows.districts,
                [24, 34, 30, 44, 16, 16, 74],
                failureReasons?.districts,
            ),
            territorySheet(
                'Zonas',
                ZONE_HEADERS,
                rows.zones,
                [24, 24, 34, 30, 44, 16, 16, 74],
                failureReasons?.zones,
            ),
            territorySheet(
                'Sectores',
                SECTOR_HEADERS,
                rows.sectors,
                [24, 24, 34, 24, 44, 16, 16, 74],
                failureReasons?.sectors,
            ),
            supervisorsSheet(supervisors),
        ],
        { fontFamily: 'Arial', fontSize: 10 },
    ).toFile(filename)
}

function hierarchyRows(hierarchy: TerritoryHierarchy, supervisors: TerritorySupervisorOption[]) {
    const districtById = new Map(hierarchy.districts.map((district) => [district.id, district]))
    const zoneById = new Map(hierarchy.zones.map((zone) => [zone.id, zone]))
    const supervisorById = new Map(supervisors.map((supervisor) => [supervisor.id, supervisor]))

    return {
        districts: hierarchy.districts.map((district) => [
            district.code,
            district.name,
            district.leaderName,
            district.description,
            district.color,
            district.isActive ? 'Activo' : 'Inactivo',
            formatPolygon(district.polygon),
        ]),
        zones: hierarchy.zones.map((zone) => [
            zone.code,
            districtById.get(zone.districtId)?.code ?? '',
            zone.name,
            zone.leaderName,
            zone.description,
            zone.color,
            zone.isActive ? 'Activo' : 'Inactivo',
            formatPolygon(zone.polygon),
        ]),
        sectors: hierarchy.sectors.map((sector) => [
            sector.code,
            zoneById.get(sector.zoneId)?.code ?? '',
            sector.name,
            sector.supervisorId ? (supervisorById.get(sector.supervisorId)?.code ?? '') : '',
            sector.description,
            sector.color,
            sector.isActive ? 'Activo' : 'Inactivo',
            formatPolygon(sector.polygon),
        ]),
    } satisfies WorkbookRows
}

export function exportTerritoriesWorkbook(
    hierarchy: TerritoryHierarchy,
    supervisors: TerritorySupervisorOption[],
) {
    return writeTerritoryWorkbook(
        hierarchyRows(hierarchy, supervisors),
        supervisors,
        `territorios-${new Date().toISOString().slice(0, 10)}.xlsx`,
    )
}

export function downloadTerritoryTemplate(supervisors: TerritorySupervisorOption[]) {
    return writeTerritoryWorkbook(
        { districts: [], zones: [], sectors: [] },
        supervisors,
        'plantilla-importacion-territorial.xlsx',
    )
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

export function normalizeTerritoryReference(value: string) {
    return normalize(value).toUpperCase()
}

function parseStatus(value: ExcelValue, issues: string[]) {
    const normalized = normalize(text(value))
    if (!normalized || ['activo', 'true', 'si', '1'].includes(normalized)) return true
    if (['inactivo', 'false', 'no', '0'].includes(normalized)) return false
    issues.push('Estado: usa Activo o Inactivo.')
    return true
}

function parseColor(value: ExcelValue, level: TerritoryLevel, issues: string[]) {
    const color = text(value) || DEFAULT_COLORS[level]
    if (!/^#[0-9a-f]{6}$/i.test(color)) {
        issues.push('Color: debe tener formato hexadecimal, por ejemplo #E9C176.')
        return DEFAULT_COLORS[level]
    }
    return color.toLowerCase()
}

function parsePolygon(value: ExcelValue, issues: string[]): TerritoryInput['polygon'] {
    const source = text(value)
    if (!source) {
        issues.push('Polígono: es obligatorio y requiere al menos tres puntos.')
        return []
    }

    let rawPoints: unknown[]
    try {
        const parsed = JSON.parse(source) as unknown
        rawPoints = Array.isArray(parsed) ? parsed : []
    } catch {
        rawPoints = source.split(/\s*[|;\n]\s*/).map((point) => point.split(/\s*,\s*/))
    }

    const polygon = rawPoints.flatMap((point) => {
        if (!Array.isArray(point) || point.length !== 2) return []
        const latitude = Number(point[0])
        const longitude = Number(point[1])
        if (
            !Number.isFinite(latitude) ||
            !Number.isFinite(longitude) ||
            latitude < -90 ||
            latitude > 90 ||
            longitude < -180 ||
            longitude > 180
        ) {
            return []
        }
        return [[latitude, longitude] as [number, number]]
    })

    if (polygon.length !== rawPoints.length || polygon.length < 3) {
        issues.push('Polígono: usa al menos tres pares válidos latitud,longitud separados por |.')
    }
    return polygon
}

function validateText(value: string, field: string, max: number, issues: string[], min = 0) {
    if (value.length < min) issues.push(`${field}: debe tener al menos ${min} caracteres.`)
    if (value.length > max) issues.push(`${field}: no puede superar ${max} caracteres.`)
}

function findSupervisor(
    value: ExcelValue,
    supervisors: TerritorySupervisorOption[],
    issues: string[],
) {
    const input = normalize(text(value))
    if (!input) {
        issues.push('Supervisor: es obligatorio en los sectores.')
        return null
    }
    const matches = supervisors.filter(
        (supervisor) =>
            normalize(supervisor.code) === input || normalize(supervisor.fullName) === input,
    )
    if (matches.length !== 1) {
        issues.push(
            matches.length
                ? 'Supervisor: el nombre es ambiguo; utiliza el código del catálogo.'
                : `Supervisor: “${text(value)}” no existe en la pestaña Supervisores.`,
        )
        return null
    }
    return matches[0]!.id
}

async function readTerritorySheet(
    file: File,
    sheet: string,
    headers: readonly string[],
    level: TerritoryLevel,
    supervisors: TerritorySupervisorOption[],
) {
    const { readSheet } = await import('read-excel-file/browser')
    const excelRows = (await readSheet(file, sheet)) as ExcelValue[][]
    if (!excelRows.length) return []

    const headerIndexes = new Map(
        excelRows[0]!.map((cell, index) => [normalize(text(cell)), index]),
    )
    const requiredHeaders = headers.filter((header) => header.endsWith('*'))
    const missingHeaders = requiredHeaders.filter(
        (header) => headerIndexes.get(normalize(header)) == null,
    )
    if (missingHeaders.length) {
        throw new Error(`${sheet}: faltan columnas obligatorias: ${missingHeaders.join(', ')}.`)
    }

    const value = (row: ExcelValue[], header: string) => {
        const index = headerIndexes.get(normalize(header))
        return index == null ? null : row[index]
    }

    return excelRows.slice(1).flatMap((row, index): TerritoryWorkbookImportRow[] => {
        if (!row.some((cell) => text(cell))) return []
        const issues: string[] = []
        const reference = text(value(row, 'Referencia *'))
        const name = text(value(row, 'Nombre *'))
        const description = text(value(row, 'Descripción'))
        const leaderName = level === 'sector' ? '' : text(value(row, 'Responsable'))
        const parentReference =
            level === 'zona'
                ? text(value(row, 'Distrito *'))
                : level === 'sector'
                  ? text(value(row, 'Zona *'))
                  : null

        validateText(reference, 'Referencia', 100, issues, 1)
        validateText(name, 'Nombre', 100, issues, 2)
        validateText(description, 'Descripción', 300, issues)
        validateText(leaderName, 'Responsable', 100, issues)
        if (level !== 'distrito' && !parentReference) {
            issues.push(`${level === 'zona' ? 'Distrito' : 'Zona'}: es obligatorio.`)
        }

        const supervisorId =
            level === 'sector'
                ? findSupervisor(value(row, 'Supervisor *'), supervisors, issues)
                : null

        return [
            {
                level,
                rowNumber: index + 2,
                reference,
                parentReference,
                input: {
                    name,
                    code: '',
                    leaderName,
                    description,
                    color: parseColor(value(row, 'Color'), level, issues),
                    polygon: parsePolygon(value(row, 'Polígono *'), issues),
                    isActive: parseStatus(value(row, 'Estado'), issues),
                    supervisorId,
                },
                rawValues: headers.map((header) => value(row, header)),
                issues,
            },
        ]
    })
}

function markDuplicateReferences(rows: TerritoryWorkbookImportRow[]) {
    const byReference = new Map<string, TerritoryWorkbookImportRow[]>()
    rows.forEach((row) => {
        const key = normalizeTerritoryReference(row.reference)
        const matches = byReference.get(key) ?? []
        matches.push(row)
        byReference.set(key, matches)
    })
    byReference.forEach((matches, reference) => {
        if (!reference || matches.length < 2) return
        matches.forEach((row) =>
            row.issues.push(`Referencia duplicada en la hoja: ${row.reference}.`),
        )
    })
}

function validateRelationships(preview: TerritoryImportPreview, hierarchy: TerritoryHierarchy) {
    const existingDistrictCodes = new Set(
        hierarchy.districts.map((district) => normalizeTerritoryReference(district.code)),
    )
    const existingZoneCodes = new Set(
        hierarchy.zones.map((zone) => normalizeTerritoryReference(zone.code)),
    )
    const existingSectorCodes = new Set(
        hierarchy.sectors.map((sector) => normalizeTerritoryReference(sector.code)),
    )
    const districtRows = new Map(
        preview.districts.map((row) => [normalizeTerritoryReference(row.reference), row]),
    )
    const zoneRows = new Map(
        preview.zones.map((row) => [normalizeTerritoryReference(row.reference), row]),
    )

    preview.districts.forEach((row) => {
        if (existingDistrictCodes.has(normalizeTerritoryReference(row.reference))) {
            row.issues.push('Referencia: ya corresponde al código de un distrito existente.')
        }
    })
    preview.zones.forEach((row) => {
        const reference = normalizeTerritoryReference(row.reference)
        const parentReference = normalizeTerritoryReference(row.parentReference ?? '')
        if (existingZoneCodes.has(reference)) {
            row.issues.push('Referencia: ya corresponde al código de una zona existente.')
        }
        const importedParent = districtRows.get(parentReference)
        if (!existingDistrictCodes.has(parentReference) && !importedParent) {
            row.issues.push(`Distrito: “${row.parentReference}” no existe ni está en el archivo.`)
        } else if (!existingDistrictCodes.has(parentReference) && importedParent?.issues.length) {
            row.issues.push(
                `Distrito: la fila referenciada “${row.parentReference}” tiene errores.`,
            )
        }
    })
    preview.sectors.forEach((row) => {
        const reference = normalizeTerritoryReference(row.reference)
        const parentReference = normalizeTerritoryReference(row.parentReference ?? '')
        const importedParent = zoneRows.get(parentReference)
        if (existingSectorCodes.has(reference)) {
            row.issues.push('Referencia: ya corresponde al código de un sector existente.')
        }
        if (!existingZoneCodes.has(parentReference) && !importedParent) {
            row.issues.push(`Zona: “${row.parentReference}” no existe ni está en el archivo.`)
        } else if (!existingZoneCodes.has(parentReference) && importedParent?.issues.length) {
            row.issues.push(`Zona: la fila referenciada “${row.parentReference}” tiene errores.`)
        }
    })
}

export async function parseTerritoriesWorkbook(
    file: File,
    hierarchy: TerritoryHierarchy,
    supervisors: TerritorySupervisorOption[],
): Promise<TerritoryImportPreview> {
    if (file.size > 5 * 1024 * 1024) {
        return {
            districts: [],
            zones: [],
            sectors: [],
            fileErrors: ['El archivo supera el límite de 5 MB.'],
        }
    }

    const preview: TerritoryImportPreview = {
        districts: [],
        zones: [],
        sectors: [],
        fileErrors: [],
    }
    const sheets = [
        ['distritos', 'Distritos', DISTRICT_HEADERS, 'distrito'],
        ['zones', 'Zonas', ZONE_HEADERS, 'zona'],
        ['sectors', 'Sectores', SECTOR_HEADERS, 'sector'],
    ] as const

    for (const [target, sheet, headers, level] of sheets) {
        try {
            const rows = await readTerritorySheet(file, sheet, headers, level, supervisors)
            if (target === 'distritos') preview.districts = rows
            if (target === 'zones') preview.zones = rows
            if (target === 'sectors') preview.sectors = rows
        } catch (error) {
            preview.fileErrors.push(
                error instanceof Error && error.message.includes(':')
                    ? error.message
                    : `No se encontró o no se pudo leer la pestaña ${sheet}.`,
            )
        }
    }

    const allRows = [...preview.districts, ...preview.zones, ...preview.sectors]
    if (allRows.length > 500) {
        preview.fileErrors.push('El archivo supera el límite de 500 registros territoriales.')
    }
    if (!allRows.length && !preview.fileErrors.length) {
        preview.fileErrors.push('No se encontraron distritos, zonas ni sectores para importar.')
    }

    markDuplicateReferences(preview.districts)
    markDuplicateReferences(preview.zones)
    markDuplicateReferences(preview.sectors)
    validateRelationships(preview, hierarchy)
    return preview
}

function requestErrorMessage(error: unknown) {
    const response = (
        error as { response?: { data?: { message?: string; error?: { details?: string } } } }
    )?.response?.data
    if (response?.error?.details) return response.error.details
    if (response?.message) return response.message
    if (error instanceof Error && error.message) return error.message
    return 'No fue posible crear el registro.'
}

export async function importTerritories(
    apiClient: AxiosInstance,
    preview: TerritoryImportPreview,
    hierarchy: TerritoryHierarchy,
): Promise<TerritoryImportResult> {
    const districtIds = new Map(
        hierarchy.districts.map((district) => [
            normalizeTerritoryReference(district.code),
            district.id,
        ]),
    )
    const zoneIds = new Map(
        hierarchy.zones.map((zone) => [normalizeTerritoryReference(zone.code), zone.id]),
    )
    const result: TerritoryImportResult = {
        createdDistricts: 0,
        createdZones: 0,
        createdSectors: 0,
        failures: [],
        resolvedDistrictCodes: {},
        resolvedZoneCodes: {},
    }

    for (const row of preview.districts.filter((item) => !item.issues.length)) {
        try {
            const created = await createTerritoryEntity(apiClient, 'distrito', row.input)
            const reference = normalizeTerritoryReference(row.reference)
            districtIds.set(reference, created.id)
            result.resolvedDistrictCodes[reference] = created.code
            result.createdDistricts += 1
        } catch (error) {
            result.failures.push({
                level: row.level,
                rowNumber: row.rowNumber,
                reasons: [requestErrorMessage(error)],
            })
        }
    }

    for (const row of preview.zones.filter((item) => !item.issues.length)) {
        const parentReference = normalizeTerritoryReference(row.parentReference ?? '')
        const parentId = districtIds.get(parentReference)
        if (!parentId) {
            result.failures.push({
                level: row.level,
                rowNumber: row.rowNumber,
                reasons: [`No se creó ni se encontró el distrito “${row.parentReference}”.`],
            })
            continue
        }
        try {
            const created = await createTerritoryEntity(apiClient, 'zona', row.input, parentId)
            const reference = normalizeTerritoryReference(row.reference)
            zoneIds.set(reference, created.id)
            result.resolvedZoneCodes[reference] = created.code
            result.createdZones += 1
        } catch (error) {
            result.failures.push({
                level: row.level,
                rowNumber: row.rowNumber,
                reasons: [requestErrorMessage(error)],
            })
        }
    }

    for (const row of preview.sectors.filter((item) => !item.issues.length)) {
        const parentReference = normalizeTerritoryReference(row.parentReference ?? '')
        const parentId = zoneIds.get(parentReference)
        if (!parentId) {
            result.failures.push({
                level: row.level,
                rowNumber: row.rowNumber,
                reasons: [`No se creó ni se encontró la zona “${row.parentReference}”.`],
            })
            continue
        }
        try {
            await createTerritoryEntity(apiClient, 'sector', row.input, parentId)
            result.createdSectors += 1
        } catch (error) {
            result.failures.push({
                level: row.level,
                rowNumber: row.rowNumber,
                reasons: [requestErrorMessage(error)],
            })
        }
    }

    return result
}

export function downloadTerritoryImportFailures(
    preview: TerritoryImportPreview,
    failures: TerritoryImportFailure[],
    supervisors: TerritorySupervisorOption[],
    result?: TerritoryImportResult | null,
) {
    const failureByRow = new Map(
        failures.map((failure) => [
            `${failure.level}:${failure.rowNumber}`,
            failure.reasons.join(' | '),
        ]),
    )
    const failedRows = (rows: TerritoryWorkbookImportRow[]) =>
        rows.filter((row) => failureByRow.has(`${row.level}:${row.rowNumber}`))
    const districts = failedRows(preview.districts)
    const zones = failedRows(preview.zones)
    const sectors = failedRows(preview.sectors)
    const replaceParent = (
        row: TerritoryWorkbookImportRow,
        resolvedCodes: Record<string, string> | undefined,
    ) => {
        const values = [...row.rawValues]
        const resolved = resolvedCodes?.[normalizeTerritoryReference(row.parentReference ?? '')]
        if (resolved) values[1] = resolved
        return values
    }

    return writeTerritoryWorkbook(
        {
            districts: districts.map((row) => row.rawValues),
            zones: zones.map((row) => replaceParent(row, result?.resolvedDistrictCodes)),
            sectors: sectors.map((row) => replaceParent(row, result?.resolvedZoneCodes)),
        },
        supervisors,
        `territorios-pendientes-${new Date().toISOString().slice(0, 10)}.xlsx`,
        {
            districts: districts.map(
                (row) => failureByRow.get(`${row.level}:${row.rowNumber}`) ?? '',
            ),
            zones: zones.map((row) => failureByRow.get(`${row.level}:${row.rowNumber}`) ?? ''),
            sectors: sectors.map((row) => failureByRow.get(`${row.level}:${row.rowNumber}`) ?? ''),
        },
    )
}

export function territoryImportRows(preview: TerritoryImportPreview) {
    return [...preview.districts, ...preview.zones, ...preview.sectors]
}

export function territoryImportSheetLabel(level: TerritoryLevel) {
    return LEVEL_SHEET[level]
}
