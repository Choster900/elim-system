import type {
    Member,
    MemberCatalogOption,
    MemberCatalogs,
    MemberCommunityRole,
    MemberGender,
    MemberInput,
    MemberMaritalStatus,
} from '../interfaces/member.interface'
import { isValidDui, normalizeDui } from '#shared/utils/dui.util'
import {
    getMemberGenderLabel,
    getMemberMaritalStatusLabel,
    getMemberRoleLabel,
} from '../utils/member-format.util'

type ExcelValue = string | number | boolean | Date | null | undefined
type ExcelOutputCell = ExcelValue | Record<string, unknown>

export interface MemberWorkbookImportRow {
    rowNumber: number
    member: MemberInput
    rawValues: ExcelValue[]
    issues: string[]
}

export interface MemberImportPreview {
    rows: MemberWorkbookImportRow[]
    fileErrors: string[]
}

export interface MemberRetryFailure {
    rowNumber: number
    reasons: string[]
}

const TEMPLATE_HEADERS = [
    'Nombres *',
    'Segundo nombre',
    'Apellidos *',
    'Segundo apellido',
    'Documento',
    'Fecha nacimiento',
    'Género *',
    'Estado civil',
    'Teléfono',
    'Correo',
    'Municipio',
    'Ocupación',
    'Roles',
    'Fecha conversión',
    'Fecha bautismo',
    'Sector',
] as const

const TEMPLATE_COLUMN_WIDTHS = [20, 18, 20, 18, 18, 16, 16, 18, 16, 26, 28, 22, 30, 16, 16, 18].map(
    (width) => ({ width }),
)
const EXPORT_HEADERS = ['Código', ...TEMPLATE_HEADERS]
const EXPORT_COLUMN_WIDTHS = [{ width: 14 }, ...TEMPLATE_COLUMN_WIDTHS]

const headerStyle = (value: string, warning = false) => ({
    value,
    fontWeight: 'bold' as const,
    textColor: warning ? '#FFFFFF' : '#201A17',
    backgroundColor: warning ? '#B42318' : '#E9C176',
    borderColor: '#B9AA9E',
    borderStyle: 'thin' as const,
    align: 'center' as const,
    alignVertical: 'center' as const,
    wrap: true,
})

function dateCell(value: string | null) {
    return value
        ? {
              value: new Date(`${value.slice(0, 10)}T00:00:00.000Z`),
              type: Date,
              format: 'dd/mm/yyyy',
          }
        : null
}

function memberRow(member: Member): ExcelOutputCell[] {
    return [
        member.code,
        member.firstName,
        member.middleName,
        member.lastName,
        member.secondLastName,
        member.documentNumber,
        dateCell(member.birthDate),
        getMemberGenderLabel(member.gender),
        getMemberMaritalStatusLabel(member.maritalStatus),
        member.phone,
        member.email,
        member.municipalityCode ?? member.municipality,
        member.occupation,
        member.roles.map(getMemberRoleLabel).join('; '),
        dateCell(member.conversionDate),
        dateCell(member.baptismDate),
        member.sectorCode ?? member.sector,
    ]
}

function heading(value: string) {
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

function instructionsData(catalogs: MemberCatalogs) {
    return [
        [
            {
                value: 'Guía de importación de miembros',
                fontWeight: 'bold' as const,
                fontSize: 18,
                textColor: '#6B4F3A',
                columnSpan: 4,
            },
            null,
            null,
            null,
        ],
        [
            {
                value: 'No cambies los encabezados de “Miembros”. Cada catálogo tiene su propia pestaña; separa múltiples roles con punto y coma.',
                textColor: '#655D58',
                columnSpan: 4,
                wrap: true,
            },
            null,
            null,
            null,
        ],
        [
            heading('Campo'),
            heading('Obligatorio'),
            heading('Formato / valores'),
            heading('Ejemplo'),
        ],
        ['Nombres', 'Sí', 'Texto, máximo 100 caracteres', 'María Elena'],
        ['Apellidos', 'Sí', 'Texto, máximo 100 caracteres', 'González'],
        [
            'Estado',
            'Automático',
            'Todos los miembros importados se registran como Activo.',
            'Activo',
        ],
        ['Documento', 'No', 'DUI válido y único, con formato ########-#', '01234567-8'],
        [
            'Fechas de conversión y bautismo',
            'No',
            'Opcionales. Usa dd/mm/aaaa o una fecha válida de Excel.',
            '14/08/2026',
        ],
        ['Género', 'Sí', 'FEMALE o MALE. Consulta la hoja Géneros.', 'FEMALE'],
        [
            'Estado civil',
            'No',
            catalogs.maritalStatuses.map((option) => option.label).join(', '),
            'Casado/a',
        ],
        [
            'Roles',
            'No',
            'Nombres o códigos de la hoja Roles, separados por ;',
            'MEMBER; SUPERVISOR',
        ],
        ['Municipio', 'No', 'Escribe el código o nombre de la hoja Municipios.', 'SV-SS-CENTRO'],
        [
            'Sector',
            'No',
            'Opcional. Escribe un único código de la hoja Sectores; ya incluye distrito, zona y sector, así que no se solicitan por separado.',
            'D1Z2S3',
        ],
        [
            'Reintentos',
            '—',
            'Si una fila falla, recibirás otro Excel solo con las filas pendientes y su motivo.',
            'Corrige y vuelve a importar',
        ],
    ]
}

function catalogBodyCell(value: ExcelValue, alternate: boolean) {
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

function catalogSheet(
    sheet: string,
    title: string,
    description: string,
    headers: string[],
    rows: ExcelValue[][],
    widths: number[],
) {
    const emptyCells = Array.from({ length: Math.max(0, headers.length - 1) }, () => null)
    const data: ExcelOutputCell[][] = [
        [
            {
                value: title,
                fontWeight: 'bold',
                fontSize: 17,
                textColor: '#FFFFFF',
                backgroundColor: '#6B4F3A',
                columnSpan: headers.length,
                alignVertical: 'center',
            },
            ...emptyCells,
        ],
        [
            {
                value: description,
                textColor: '#655D58',
                backgroundColor: '#F7EFE3',
                columnSpan: headers.length,
                wrap: true,
            },
            ...emptyCells,
        ],
        headers.map((header) => heading(header)),
        ...rows.map((row, rowIndex) =>
            row.map((value) => catalogBodyCell(value, rowIndex % 2 === 1)),
        ),
    ]

    return {
        data: data as never[][],
        sheet,
        columns: widths.map((width) => ({ width })),
        stickyRowsCount: 3,
        showGridLines: false,
    }
}

function simpleCatalogRows(options: MemberCatalogOption[]) {
    return options.map((option) => [option.code ?? option.value, option.label])
}

function catalogSheets(catalogs: MemberCatalogs) {
    return [
        catalogSheet(
            'Géneros',
            'Géneros permitidos',
            'Este campo es obligatorio y únicamente admite FEMALE o MALE.',
            ['Valor a escribir', 'Nombre visible'],
            simpleCatalogRows(catalogs.genders),
            [24, 32],
        ),
        catalogSheet(
            'Estados civiles',
            'Estados civiles',
            'Si se deja vacío se utilizará “Sin especificar”.',
            ['Valor a escribir', 'Nombre visible'],
            simpleCatalogRows(catalogs.maritalStatuses),
            [24, 32],
        ),
        catalogSheet(
            'Municipios',
            'Municipios disponibles',
            'Escribe el código o el nombre exactamente como aparece en esta tabla.',
            ['Código', 'Municipio'],
            catalogs.municipalities.map((municipality) => [
                municipality.code ?? municipality.value,
                municipality.label,
            ]),
            [28, 38],
        ),
        catalogSheet(
            'Roles',
            'Roles comunitarios',
            'Para asignar varios roles sepáralos con punto y coma, por ejemplo MEMBER; SUPERVISOR.',
            ['Código', 'Nombre visible'],
            simpleCatalogRows(catalogs.roles),
            [28, 36],
        ),
        catalogSheet(
            'Sectores',
            'Sectores activos',
            'La asignación territorial del miembro se realiza únicamente por sector. El código combina distrito, zona y sector (D1Z2S3).',
            ['Código de sector', 'Nombre del sector'],
            simpleCatalogRows(catalogs.sectors),
            [24, 38],
        ),
    ]
}

async function writeMembersWorkbook(
    rows: ExcelOutputCell[][],
    catalogs: MemberCatalogs,
    filename: string,
    headerNames: readonly string[],
    columnWidths: { width: number }[],
    failureReasons?: string[],
) {
    const { default: writeExcelFile } = await import('write-excel-file/browser')
    const headers = failureReasons
        ? [
              ...headerNames.map((header) => headerStyle(header)),
              headerStyle('Motivo del rechazo', true),
          ]
        : headerNames.map((header) => headerStyle(header))
    const memberRows = failureReasons
        ? rows.map((row, index) => [
              ...row,
              {
                  value: failureReasons[index] ?? 'Error no especificado',
                  textColor: '#B42318',
                  backgroundColor: '#FEF3F2',
                  wrap: true,
              },
          ])
        : rows

    await writeExcelFile(
        [
            {
                data: [headers, ...memberRows] as never[][],
                sheet: 'Miembros',
                columns: failureReasons ? [...columnWidths, { width: 60 }] : columnWidths,
                stickyRowsCount: 1,
                stickyColumnsCount: 2,
                showGridLines: false,
                orientation: 'landscape',
                dateFormat: 'dd/mm/yyyy',
            },
            {
                data: instructionsData(catalogs) as never[][],
                sheet: 'Instrucciones',
                columns: [{ width: 22 }, { width: 14 }, { width: 72 }, { width: 30 }],
                stickyRowsCount: 3,
                showGridLines: false,
            },
            ...catalogSheets(catalogs),
        ],
        { fontFamily: 'Arial', fontSize: 10 },
    ).toFile(filename)
}

export function exportMembersWorkbook(members: Member[], catalogs: MemberCatalogs) {
    return writeMembersWorkbook(
        members.map(memberRow),
        catalogs,
        `miembros-${new Date().toISOString().slice(0, 10)}.xlsx`,
        EXPORT_HEADERS,
        EXPORT_COLUMN_WIDTHS,
    )
}

export function downloadMembersTemplate(catalogs: MemberCatalogs) {
    return writeMembersWorkbook(
        [],
        catalogs,
        'plantilla-importacion-miembros.xlsx',
        TEMPLATE_HEADERS,
        TEMPLATE_COLUMN_WIDTHS,
    )
}

export function downloadMemberImportFailures(
    rows: MemberWorkbookImportRow[],
    failures: MemberRetryFailure[],
    catalogs: MemberCatalogs,
) {
    const failureByRow = new Map(failures.map((failure) => [failure.rowNumber, failure.reasons]))
    const failedRows = rows.filter((row) => failureByRow.has(row.rowNumber))
    const date = new Date().toISOString().slice(0, 10)
    return writeMembersWorkbook(
        failedRows.map((row) => row.rawValues),
        catalogs,
        `miembros-pendientes-${date}.xlsx`,
        TEMPLATE_HEADERS,
        TEMPLATE_COLUMN_WIDTHS,
        failedRows.map((row) => failureByRow.get(row.rowNumber)?.join(' | ') ?? ''),
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

function resolveOption<T extends string>(
    rawValue: ExcelValue,
    options: MemberCatalogOption<T>[],
    fallback: T | undefined,
    field: string,
    issues: string[],
    required = false,
) {
    const input = normalize(text(rawValue))
    if (!input) {
        if (required) issues.push(`${field}: es obligatorio.`)
        return fallback
    }
    const option = options.find(
        (item) =>
            normalize(item.label) === input ||
            normalize(item.value) === input ||
            normalize(item.code ?? '') === input,
    )
    if (option) return option.value
    issues.push(`${field}: “${text(rawValue)}” no pertenece al catálogo.`)
    return fallback
}

function resolveCatalogList(
    rawValue: ExcelValue,
    options: MemberCatalogOption[],
    field: string,
    issues: string[],
) {
    const inputs = text(rawValue)
        .split(/[;,]/)
        .map((value) => value.trim())
        .filter(Boolean)
    const values: string[] = []
    inputs.forEach((input) => {
        const key = normalize(input)
        const option = options.find(
            (item) =>
                normalize(item.label) === key ||
                normalize(item.value) === key ||
                normalize(item.code ?? '') === key,
        )
        if (!option) {
            issues.push(`${field}: “${input}” no pertenece al catálogo.`)
            return
        }
        values.push(option.value)
    })
    return [...new Set(values)]
}

function isoDate(value: ExcelValue, field: string, issues: string[]) {
    if (!value) return null
    if (value instanceof Date && !Number.isNaN(value.getTime())) {
        return value.toISOString().slice(0, 10)
    }
    const input = text(value)
    const dayFirst = input.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/)
    if (dayFirst) {
        const iso = `${dayFirst[3]}-${dayFirst[2]!.padStart(2, '0')}-${dayFirst[1]!.padStart(2, '0')}`
        if (!Number.isNaN(new Date(`${iso}T00:00:00.000Z`).getTime())) return iso
    }
    if (/^\d{4}-\d{2}-\d{2}$/.test(input)) {
        if (!Number.isNaN(new Date(`${input}T00:00:00.000Z`).getTime())) return input
    }
    issues.push(`${field}: “${input}” no es una fecha válida.`)
    return null
}

function resolveTerritory(
    row: ExcelValue[],
    value: (row: ExcelValue[], name: (typeof TEMPLATE_HEADERS)[number]) => ExcelValue,
    catalogs: MemberCatalogs,
    issues: string[],
) {
    return (
        resolveOption(value(row, 'Sector'), catalogs.sectors, undefined, 'Sector', issues) ?? null
    )
}

function resolveResidence(
    row: ExcelValue[],
    value: (row: ExcelValue[], name: (typeof TEMPLATE_HEADERS)[number]) => ExcelValue,
    catalogs: MemberCatalogs,
    issues: string[],
) {
    return (
        resolveOption(
            value(row, 'Municipio'),
            catalogs.municipalities,
            undefined,
            'Municipio',
            issues,
        ) ?? null
    )
}

export async function parseMembersWorkbook(
    file: File,
    catalogs: MemberCatalogs,
): Promise<MemberImportPreview> {
    if (file.size > 5 * 1024 * 1024) {
        return { rows: [], fileErrors: ['El archivo supera el límite de 5 MB.'] }
    }

    const { readSheet } = await import('read-excel-file/browser')
    const excelRows = (await readSheet(file)) as ExcelValue[][]
    if (!excelRows.length) return { rows: [], fileErrors: ['El archivo no contiene datos.'] }

    const headerIndexes = new Map(
        excelRows[0]!.map((cell, index) => [normalize(text(cell)), index]),
    )
    const column = (name: (typeof TEMPLATE_HEADERS)[number]) => headerIndexes.get(normalize(name))
    const missing = ['Nombres *', 'Apellidos *', 'Género *'].filter(
        (name) => column(name as (typeof TEMPLATE_HEADERS)[number]) == null,
    )
    if (missing.length) {
        return {
            rows: [],
            fileErrors: [`Faltan columnas obligatorias: ${missing.join(', ')}.`],
        }
    }

    const value = (row: ExcelValue[], name: (typeof TEMPLATE_HEADERS)[number]) => {
        const index = column(name)
        return index == null ? null : row[index]
    }
    const rows: MemberWorkbookImportRow[] = []
    const seenDocuments = new Set<string>()

    excelRows.slice(1).forEach((row, index) => {
        if (!row.some((cell) => text(cell))) return
        const rowNumber = index + 2
        const issues: string[] = []
        if (rows.length >= 1000) issues.push('El archivo supera el límite de 1,000 miembros.')

        const firstName = text(value(row, 'Nombres *'))
        const lastName = text(value(row, 'Apellidos *'))
        const documentNumber = normalizeDui(text(value(row, 'Documento')))
        if (!firstName) issues.push('Nombres: es obligatorio.')
        if (!lastName) issues.push('Apellidos: es obligatorio.')
        if (documentNumber && !isValidDui(documentNumber)) {
            issues.push('Documento: el DUI no es válido o no cumple el formato ########-#.')
        }
        const normalizedDocument = documentNumber.toUpperCase()
        if (documentNumber && seenDocuments.has(normalizedDocument)) {
            issues.push(`Documento duplicado en el archivo: ${documentNumber}.`)
        }
        if (documentNumber) seenDocuments.add(normalizedDocument)

        const email = text(value(row, 'Correo'))
        if (email && !/^\S+@\S+\.\S+$/.test(email)) {
            issues.push(`Correo: “${email}” no es válido.`)
        }
        const sector = resolveTerritory(row, value, catalogs, issues)
        const municipality = resolveResidence(row, value, catalogs, issues)
        const roles = resolveCatalogList(value(row, 'Roles'), catalogs.roles, 'Roles', issues)

        const member: MemberInput = {
            firstName,
            middleName: text(value(row, 'Segundo nombre')) || null,
            lastName,
            secondLastName: text(value(row, 'Segundo apellido')) || null,
            documentNumber: documentNumber || null,
            birthDate: isoDate(value(row, 'Fecha nacimiento'), 'Fecha de nacimiento', issues),
            gender: resolveOption(
                value(row, 'Género *'),
                catalogs.genders,
                undefined,
                'Género',
                issues,
                true,
            ) as MemberGender | undefined,
            maritalStatus: resolveOption(
                value(row, 'Estado civil'),
                catalogs.maritalStatuses,
                'UNSPECIFIED',
                'Estado civil',
                issues,
            ) as MemberMaritalStatus,
            phone: text(value(row, 'Teléfono')) || null,
            email: email || null,
            municipality,
            occupation: text(value(row, 'Ocupación')) || null,
            status: 'ACTIVE',
            roles: (roles.length ? roles : ['MEMBER']) as MemberCommunityRole[],
            ministries: [],
            conversionDate: isoDate(value(row, 'Fecha conversión'), 'Fecha de conversión', issues),
            baptismDate: isoDate(value(row, 'Fecha bautismo'), 'Fecha de bautismo', issues),
            sector,
        }

        rows.push({
            rowNumber,
            member,
            rawValues: TEMPLATE_HEADERS.map((header) => value(row, header)),
            issues,
        })
    })

    return {
        rows,
        fileErrors: rows.length ? [] : ['No se encontraron miembros para importar.'],
    }
}
