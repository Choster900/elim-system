import type { AxiosInstance } from 'axios'
import type {
    TerritoryHierarchy,
    TerritoryInput,
    TerritoryLeaderOption,
    TerritoryLevel,
    TerritorySupervisorOption,
} from '../interfaces/territory.interface'
import { territoryColorCatalog } from '../constants/territory.constants'
import { contrastColor, normalizeHexColor } from '~/utils/color/color.util'
import { createTerritoryEntity } from './territory.service'

type ExcelValue = string | number | boolean | Date | null | undefined
type ExcelOutputCell = ExcelValue | Record<string, unknown>

type SheetColumn = readonly [header: string, width: number]

const DISTRICT_COLUMNS = [
    ['Referencia *', 24],
    ['Nombre *', 34],
    ['Pastor', 30],
    ['Descripción', 44],
    ['Dirección general', 44],
    ['Color', 14],
    ['Estado', 14],
    ['Polígono', 74],
] as const satisfies readonly SheetColumn[]
const ZONE_COLUMNS = [
    ['Referencia *', 24],
    ['Distrito *', 24],
    ['Nombre *', 34],
    ['Coordinador', 30],
    ['Descripción', 44],
    ['Dirección general', 44],
    ['Color', 14],
    ['Estado', 14],
    ['Polígono', 74],
] as const satisfies readonly SheetColumn[]
const SECTOR_COLUMNS = [
    ['Referencia *', 24],
    ['Zona *', 24],
    ['Nombre *', 34],
    ['Supervisor', 30],
    ['Descripción', 44],
    ['Dirección general', 44],
    ['Color', 14],
    ['Estado', 14],
    ['Polígono', 74],
] as const satisfies readonly SheetColumn[]

const headersOf = (columns: readonly SheetColumn[]) => columns.map(([header]) => header)
const DISTRICT_HEADERS = headersOf(DISTRICT_COLUMNS)
const ZONE_HEADERS = headersOf(ZONE_COLUMNS)
const SECTOR_HEADERS = headersOf(SECTOR_COLUMNS)

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

export interface TerritoryRoleCatalogs {
    leaders: TerritoryLeaderOption[]
    coordinators: TerritoryLeaderOption[]
    supervisors: TerritorySupervisorOption[]
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

// La celda de color se pinta con su propio color para que se vea en el Excel.
function colorSwatch(value: ExcelValue) {
    const color = normalizeHexColor(text(value))
    return color ? { backgroundColor: color.toUpperCase(), textColor: contrastColor(color) } : {}
}

function territorySheet(
    sheet: string,
    columns: readonly SheetColumn[],
    rows: ExcelValue[][],
    failureReasons?: string[],
) {
    const headers = headersOf(columns)
    const colorIndex = headers.indexOf('Color')
    const outputHeaders = failureReasons ? [...headers, 'Motivo del rechazo'] : headers
    const dataRows = rows.map((row, index) => {
        const values = failureReasons ? [...row, failureReasons[index] ?? ''] : row
        return values.map((value, columnIndex) => ({
            ...bodyCell(value, index % 2 === 1),
            ...(columnIndex === colorIndex ? colorSwatch(value) : {}),
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
        columns: [...columns.map(([, width]) => width), ...(failureReasons ? [58] : [])].map(
            (width) => ({ width }),
        ),
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
            'Usa la referencia de una fila del mismo archivo o el código de un registro que ya existe. Los códigos existentes están en las pestañas Distritos existentes y Zonas existentes.',
            'DISTRITO-NORTE o DIS-001',
        ],
        [
            'Pastor / Coordinador / Supervisor',
            'No',
            'Escribe el código de un miembro que aparezca en la pestaña correspondiente: Pastores para Distritos, Coordinadores para Zonas y Supervisores para Sectores.',
            'MIE-0012',
        ],
        [
            'Color',
            'No',
            'Color hexadecimal, con o sin #. Puedes copiar uno de la pestaña Colores sugeridos. Si queda vacío se aplicará el color predeterminado del nivel.',
            '#E9C176',
        ],
        ['Estado', 'No', 'Admite Activo o Inactivo. Si queda vacío se usará Activo.', 'Activo'],
        [
            'Polígono',
            'No',
            'Si deseas delimitar el área desde la importación, escribe al menos tres puntos como latitud,longitud separados por |. También puedes dejarlo vacío y definirlo después al editar el territorio.',
            '13.704,-89.204 | 13.711,-89.192 | 13.696,-89.188',
        ],
        [
            'Importación',
            '—',
            'Solo crea registros nuevos. Antes de guardar verás las filas válidas y los errores que debes corregir.',
            'No cambia registros existentes',
        ],
        [
            'Archivo de Exportar',
            '—',
            'El archivo que genera Exportar es un reporte: sus referencias son códigos que ya existen y serían rechazadas. Para importar, parte de esta plantilla.',
            'Usa Descargar plantilla',
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

// Hoja de consulta: título, nota, encabezados y filas. Si no hay filas muestra el aviso vacío.
function catalogSheet(
    sheet: string,
    title: string,
    note: string,
    columns: readonly SheetColumn[],
    rows: ExcelOutputCell[][],
    emptyMessage: string,
) {
    const span = columns.length
    const fullWidth = (cell: Record<string, unknown>) => [
        { ...cell, columnSpan: span },
        ...Array.from({ length: span - 1 }, () => null),
    ]
    const body = rows.length
        ? rows.map((row, index) =>
              row.map((value) =>
                  value !== null && typeof value === 'object' && !(value instanceof Date)
                      ? { ...bodyCell(null, index % 2 === 1), ...value }
                      : bodyCell(value as ExcelValue, index % 2 === 1),
              ),
          )
        : [fullWidth({ value: emptyMessage, textColor: '#655D58', fontStyle: 'italic' })]

    return {
        data: [
            fullWidth({
                value: title,
                fontWeight: 'bold',
                fontSize: 17,
                textColor: '#FFFFFF',
                backgroundColor: '#6B4F3A',
            }),
            fullWidth({
                value: note,
                textColor: '#655D58',
                backgroundColor: '#F7EFE3',
                wrap: true,
            }),
            columns.map(([header]) => titleCell(header)),
            ...body,
        ] as never[][],
        sheet,
        columns: columns.map(([, width]) => ({ width })),
        stickyRowsCount: 3,
        showGridLines: false,
    }
}

function roleCatalogSheet(
    sheet: string,
    title: string,
    columnLabel: string,
    members: TerritoryLeaderOption[] | TerritorySupervisorOption[],
) {
    return catalogSheet(
        sheet,
        title,
        `Copia el código del miembro en la columna ${columnLabel}.`,
        [
            ['Código', 22],
            ['Nombre', 42],
            ['Correo', 34],
            ['Teléfono', 22],
        ],
        members.map((member) => [member.code, member.fullName, member.email, member.phone]),
        'No hay miembros activos con este rol. Asígnalo desde Comunidad › Miembros.',
    )
}

function existingDistrictsSheet(hierarchy: TerritoryHierarchy | null) {
    return catalogSheet(
        'Distritos existentes',
        'Distritos registrados en el sistema',
        'Usa el código en la columna Distrito * de la pestaña Zonas para colgar una zona de un distrito que ya existe.',
        [
            ['Código', 18],
            ['Nombre', 40],
            ['Estado', 14],
            ['Color', 14],
        ],
        (hierarchy?.districts ?? []).map((district) => [
            district.code,
            district.name,
            district.isActive ? 'Activo' : 'Inactivo',
            { value: district.color, ...colorSwatch(district.color) },
        ]),
        'Aún no hay distritos registrados.',
    )
}

function existingZonesSheet(hierarchy: TerritoryHierarchy | null) {
    const districtById = new Map((hierarchy?.districts ?? []).map((d) => [d.id, d]))
    return catalogSheet(
        'Zonas existentes',
        'Zonas registradas en el sistema',
        'Usa el código en la columna Zona * de la pestaña Sectores para colgar un sector de una zona que ya existe.',
        [
            ['Código', 18],
            ['Nombre', 36],
            ['Distrito', 36],
            ['Estado', 14],
        ],
        (hierarchy?.zones ?? []).map((zone) => {
            const district = districtById.get(zone.districtId)
            return [
                zone.code,
                zone.name,
                district ? `${district.code} · ${district.name}` : '',
                zone.isActive ? 'Activo' : 'Inactivo',
            ]
        }),
        'Aún no hay zonas registradas.',
    )
}

function colorCatalogSheet() {
    return catalogSheet(
        'Colores sugeridos',
        'Colores sugeridos',
        'Copia el código en la columna Color. También puedes usar cualquier otro hexadecimal.',
        [
            ['Muestra', 14],
            ['Código', 16],
        ],
        territoryColorCatalog.map((color) => [
            { value: '', backgroundColor: color.toUpperCase() },
            color.toUpperCase(),
        ]),
        '',
    )
}

/** Hojas del libro; separado de la escritura para poder verificarlo sin navegador. */
export function buildTerritoryWorkbookSheets(
    rows: WorkbookRows,
    roleCatalogs: TerritoryRoleCatalogs,
    hierarchy: TerritoryHierarchy | null,
    failureReasons?: WorkbookFailureReasons,
) {
    return [
        instructionsSheet(),
        territorySheet('Distritos', DISTRICT_COLUMNS, rows.districts, failureReasons?.districts),
        territorySheet('Zonas', ZONE_COLUMNS, rows.zones, failureReasons?.zones),
        territorySheet('Sectores', SECTOR_COLUMNS, rows.sectors, failureReasons?.sectors),
        roleCatalogSheet(
            'Pastores',
            'Pastores disponibles para distritos',
            'Pastor de la pestaña Distritos',
            roleCatalogs.leaders,
        ),
        roleCatalogSheet(
            'Coordinadores',
            'Coordinadores disponibles para zonas',
            'Coordinador de la pestaña Zonas',
            roleCatalogs.coordinators,
        ),
        roleCatalogSheet(
            'Supervisores',
            'Supervisores disponibles para sectores',
            'Supervisor de la pestaña Sectores',
            roleCatalogs.supervisors,
        ),
        existingDistrictsSheet(hierarchy),
        existingZonesSheet(hierarchy),
        colorCatalogSheet(),
    ]
}

async function writeTerritoryWorkbook(
    rows: WorkbookRows,
    roleCatalogs: TerritoryRoleCatalogs,
    hierarchy: TerritoryHierarchy | null,
    filename: string,
    failureReasons?: WorkbookFailureReasons,
) {
    const { default: writeExcelFile } = await import('write-excel-file/browser')

    await writeExcelFile(
        buildTerritoryWorkbookSheets(rows, roleCatalogs, hierarchy, failureReasons),
        { fontFamily: 'Arial', fontSize: 10 },
    ).toFile(filename)
}

function hierarchyRows(hierarchy: TerritoryHierarchy, roleCatalogs: TerritoryRoleCatalogs) {
    const districtById = new Map(hierarchy.districts.map((district) => [district.id, district]))
    const zoneById = new Map(hierarchy.zones.map((zone) => [zone.id, zone]))
    const leaderById = new Map(roleCatalogs.leaders.map((leader) => [leader.id, leader]))
    const coordinatorById = new Map(
        roleCatalogs.coordinators.map((coordinator) => [coordinator.id, coordinator]),
    )
    const supervisorById = new Map(
        roleCatalogs.supervisors.map((supervisor) => [supervisor.id, supervisor]),
    )

    return {
        districts: hierarchy.districts.map((district) => [
            district.code,
            district.name,
            district.leaderId ? (leaderById.get(district.leaderId)?.code ?? '') : '',
            district.description,
            district.address,
            district.color,
            district.isActive ? 'Activo' : 'Inactivo',
            formatPolygon(district.polygon),
        ]),
        zones: hierarchy.zones.map((zone) => [
            zone.code,
            districtById.get(zone.districtId)?.code ?? '',
            zone.name,
            zone.leaderId ? (coordinatorById.get(zone.leaderId)?.code ?? '') : '',
            zone.description,
            zone.address,
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
            sector.address,
            sector.color,
            sector.isActive ? 'Activo' : 'Inactivo',
            formatPolygon(sector.polygon),
        ]),
    } satisfies WorkbookRows
}

export function exportTerritoriesWorkbook(
    hierarchy: TerritoryHierarchy,
    roleCatalogs: TerritoryRoleCatalogs,
) {
    return writeTerritoryWorkbook(
        hierarchyRows(hierarchy, roleCatalogs),
        roleCatalogs,
        hierarchy,
        `territorios-${new Date().toISOString().slice(0, 10)}.xlsx`,
    )
}

export function downloadTerritoryTemplate(
    roleCatalogs: TerritoryRoleCatalogs,
    hierarchy: TerritoryHierarchy | null,
) {
    return writeTerritoryWorkbook(
        { districts: [], zones: [], sectors: [] },
        roleCatalogs,
        hierarchy,
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
    const raw = text(value)
    if (!raw) return DEFAULT_COLORS[level]
    // Acepta con o sin #, como suele quedar al copiar un color en Excel.
    const color = normalizeHexColor(raw)
    if (!color) {
        issues.push('Color: debe tener formato hexadecimal, por ejemplo #E9C176.')
        return DEFAULT_COLORS[level]
    }
    return color
}

// "Referencia", "Referencia *" y "referencia*" cuentan como el mismo encabezado.
function normalizeHeader(value: string) {
    return normalize(value).replace(/\*/g, '').replace(/\s+/g, ' ').trim()
}

function parsePolygon(value: ExcelValue, issues: string[]): TerritoryInput['polygon'] {
    const source = text(value)
    if (!source) return []

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

function findRoleMember(
    value: ExcelValue,
    roleLabel: string,
    sheet: string,
    members: TerritoryLeaderOption[] | TerritorySupervisorOption[],
    issues: string[],
) {
    const input = normalize(text(value))
    if (!input) return null

    const matches = members.filter(
        (member) => normalize(member.code) === input || normalize(member.fullName) === input,
    )
    if (matches.length !== 1) {
        issues.push(
            matches.length
                ? `${roleLabel}: el nombre es ambiguo; utiliza el código del catálogo.`
                : `${roleLabel}: “${text(value)}” no existe en la pestaña ${sheet}.`,
        )
        return null
    }
    return matches[0]!
}

function parseTerritorySheetRows(
    excelRows: ExcelValue[][],
    sheet: string,
    headers: readonly string[],
    level: TerritoryLevel,
    roleCatalogs: TerritoryRoleCatalogs,
) {
    if (!excelRows.length) return []

    const headerIndexes = new Map(
        excelRows[0]!.map((cell, index) => [normalizeHeader(text(cell)), index]),
    )
    const requiredHeaders = headers.filter((header) => header.endsWith('*'))
    const missingHeaders = requiredHeaders.filter(
        (header) => headerIndexes.get(normalizeHeader(header)) == null,
    )
    if (missingHeaders.length) {
        throw new Error(`${sheet}: faltan columnas obligatorias: ${missingHeaders.join(', ')}.`)
    }

    const value = (row: ExcelValue[], header: string) => {
        const index = headerIndexes.get(normalizeHeader(header))
        return index == null ? null : row[index]
    }

    return excelRows.slice(1).flatMap((row, index): TerritoryWorkbookImportRow[] => {
        if (!row.some((cell) => text(cell))) return []
        const issues: string[] = []
        const reference = text(value(row, 'Referencia *'))
        const name = text(value(row, 'Nombre *'))
        const description = text(value(row, 'Descripción'))
        const address = text(value(row, 'Dirección general'))
        const parentReference =
            level === 'zona'
                ? text(value(row, 'Distrito *'))
                : level === 'sector'
                  ? text(value(row, 'Zona *'))
                  : null

        validateText(reference, 'Referencia', 100, issues, 1)
        validateText(name, 'Nombre', 100, issues, 2)
        validateText(description, 'Descripción', 300, issues)
        validateText(address, 'Dirección general', 300, issues)
        if (level !== 'distrito' && !parentReference) {
            issues.push(`${level === 'zona' ? 'Distrito' : 'Zona'}: es obligatorio.`)
        }

        const assignedMember =
            level === 'distrito'
                ? findRoleMember(
                      value(row, 'Pastor'),
                      'Pastor',
                      'Pastores',
                      roleCatalogs.leaders,
                      issues,
                  )
                : level === 'zona'
                  ? findRoleMember(
                        value(row, 'Coordinador'),
                        'Coordinador',
                        'Coordinadores',
                        roleCatalogs.coordinators,
                        issues,
                    )
                  : findRoleMember(
                        value(row, 'Supervisor'),
                        'Supervisor',
                        'Supervisores',
                        roleCatalogs.supervisors,
                        issues,
                    )

        return [
            {
                level,
                rowNumber: index + 2,
                reference,
                parentReference,
                input: {
                    name,
                    code: '',
                    leaderId: level === 'sector' ? undefined : (assignedMember?.id ?? null),
                    leaderName: level === 'sector' ? '' : (assignedMember?.fullName ?? ''),
                    description,
                    address,
                    color: parseColor(value(row, 'Color'), level, issues),
                    polygon: parsePolygon(value(row, 'Polígono'), issues),
                    isActive: parseStatus(value(row, 'Estado'), issues),
                    supervisorId: level === 'sector' ? (assignedMember?.id ?? null) : null,
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
    roleCatalogs: TerritoryRoleCatalogs,
): Promise<TerritoryImportPreview> {
    if (file.size > 5 * 1024 * 1024) {
        return {
            districts: [],
            zones: [],
            sectors: [],
            fileErrors: ['El archivo supera el límite de 5 MB.'],
        }
    }

    const { readSheet } = await import('read-excel-file/browser')
    return buildTerritoryImportPreview(
        async (sheet) => (await readSheet(file, sheet)) as ExcelValue[][],
        hierarchy,
        roleCatalogs,
    )
}

/** Valida las hojas leídas; recibe el lector para poder probarlo sin navegador. */
export async function buildTerritoryImportPreview(
    readRows: (sheet: string) => Promise<ExcelValue[][]>,
    hierarchy: TerritoryHierarchy,
    roleCatalogs: TerritoryRoleCatalogs,
): Promise<TerritoryImportPreview> {
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
            const rows = parseTerritorySheetRows(
                await readRows(sheet),
                sheet,
                headers,
                level,
                roleCatalogs,
            )
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
    roleCatalogs: TerritoryRoleCatalogs,
    result?: TerritoryImportResult | null,
    hierarchy: TerritoryHierarchy | null = null,
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
        roleCatalogs,
        hierarchy,
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
