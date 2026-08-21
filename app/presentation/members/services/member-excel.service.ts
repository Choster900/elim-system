import type {
    Member,
    MemberCatalogOption,
    MemberCatalogs,
    MemberCommunityRole,
    MemberGender,
    MemberInput,
    MemberMaritalStatus,
    MemberStatus,
} from '../interfaces/member.interface'
import {
    getMemberGenderLabel,
    getMemberMaritalStatusLabel,
    getMemberRoleLabel,
    getMemberStatusLabel,
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

const HEADERS = [
    'Código',
    'Nombres *',
    'Segundo nombre',
    'Apellidos *',
    'Segundo apellido',
    'Nombre preferido',
    'Documento',
    'Fecha nacimiento',
    'Género',
    'Estado civil',
    'Teléfono',
    'Teléfono alterno',
    'Correo',
    'Dirección',
    'País',
    'Departamento',
    'Municipio',
    'Ocupación',
    'Estado',
    'Roles',
    'Ministerios',
    'Fecha ingreso',
    'Fecha conversión',
    'Fecha bautismo',
    'Sector',
    'Grupo pequeño',
    'Contacto emergencia',
    'Teléfono emergencia',
    'Notas',
] as const

const COLUMN_WIDTHS = [
    14, 20, 18, 20, 18, 18, 18, 16, 16, 18, 16, 18, 26, 32, 20, 22, 24, 22, 14, 30, 28, 16, 16, 16,
    18, 22, 24, 20, 36,
].map((width) => ({ width }))

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
        member.preferredName,
        member.documentNumber,
        dateCell(member.birthDate),
        getMemberGenderLabel(member.gender),
        getMemberMaritalStatusLabel(member.maritalStatus),
        member.phone,
        member.alternatePhone,
        member.email,
        member.address,
        member.countryCode ?? member.country,
        member.departmentCode ?? member.department,
        member.municipalityCode ?? member.municipality,
        member.occupation,
        getMemberStatusLabel(member.status),
        member.roles.map(getMemberRoleLabel).join('; '),
        member.ministries.join('; '),
        dateCell(member.joinedAt),
        dateCell(member.conversionDate),
        dateCell(member.baptismDate),
        member.sectorCode ?? member.sector,
        member.smallGroup,
        member.emergencyContactName,
        member.emergencyContactPhone,
        member.notes,
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
                value: 'No cambies los encabezados de “Miembros”. Cada catálogo tiene su propia pestaña; separa múltiples roles o ministerios con punto y coma.',
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
        ['Código', 'No', 'Vacío para generar MIE-####; existente para actualizar', 'MIE-0025'],
        ['Documento', 'No', 'Único; también permite identificar una actualización', '01234567-8'],
        ['Fechas', 'No', 'dd/mm/aaaa o fecha válida de Excel', '14/08/2026'],
        ['Estado', 'No', catalogs.statuses.map((option) => option.label).join(', '), 'Activo'],
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
        [
            'Ministerios',
            'No',
            'Nombres o códigos de la hoja Ministerios, separados por ;',
            'Jóvenes; Alabanza',
        ],
        [
            'Residencia',
            'No',
            'Usa País, Departamento y Municipio respetando la jerarquía de sus hojas.',
            'SV; SV-SS; SV-SS-CENTRO',
        ],
        [
            'Sector',
            'Sí',
            'Escribe un único código de la hoja Sectores. Distrito y zona se obtienen del sector.',
            'SEC-001',
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
    const countryByCode = new Map(
        catalogs.countries.map((country) => [country.code ?? country.value, country.label]),
    )
    const departmentByCode = new Map(
        catalogs.departments.map((department) => [department.code ?? department.value, department]),
    )
    const districtByCode = new Map(
        catalogs.districts.map((district) => [district.code ?? district.value, district.label]),
    )
    const zoneByCode = new Map(catalogs.zones.map((zone) => [zone.code ?? zone.value, zone]))

    return [
        catalogSheet(
            'Estados',
            'Estados del miembro',
            'Escribe el código o el nombre exactamente como aparece en esta tabla.',
            ['Valor a escribir', 'Nombre visible'],
            simpleCatalogRows(catalogs.statuses),
            [24, 32],
        ),
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
            'Países',
            'Países disponibles',
            'Selecciona primero el país para identificar sus departamentos.',
            ['Código de país', 'Nombre del país'],
            simpleCatalogRows(catalogs.countries),
            [24, 34],
        ),
        catalogSheet(
            'Departamentos',
            'Departamentos disponibles',
            'Cada departamento pertenece a un país.',
            ['Código', 'Departamento', 'Código de país', 'País'],
            catalogs.departments.map((department) => [
                department.code ?? department.value,
                department.label,
                department.countryCode,
                countryByCode.get(department.countryCode) ?? '',
            ]),
            [24, 34, 24, 32],
        ),
        catalogSheet(
            'Municipios',
            'Municipios disponibles',
            'Cada municipio pertenece a un departamento y a su país.',
            ['Código', 'Municipio', 'Código de departamento', 'Departamento'],
            catalogs.municipalities.map((municipality) => [
                municipality.code ?? municipality.value,
                municipality.label,
                municipality.departmentCode,
                departmentByCode.get(municipality.departmentCode)?.label ?? '',
            ]),
            [28, 38, 30, 36],
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
            'Ministerios',
            'Ministerios activos',
            'Para asignar varios ministerios sepáralos con punto y coma.',
            ['Código', 'Nombre visible'],
            simpleCatalogRows(catalogs.ministries),
            [28, 36],
        ),
        catalogSheet(
            'Distritos',
            'Distritos activos',
            'Consulta informativa: el distrito se deriva del sector y no se importa en el miembro.',
            ['Código de distrito', 'Nombre del distrito'],
            simpleCatalogRows(catalogs.districts),
            [28, 40],
        ),
        catalogSheet(
            'Zonas',
            'Zonas activas',
            'Consulta informativa: la zona se deriva del sector y no se importa en el miembro.',
            ['Código de zona', 'Nombre de la zona', 'Código de distrito', 'Distrito'],
            catalogs.zones.map((zone) => [
                zone.code ?? zone.value,
                zone.label,
                zone.districtCode,
                districtByCode.get(zone.districtCode) ?? '',
            ]),
            [24, 36, 26, 36],
        ),
        catalogSheet(
            'Sectores',
            'Sectores activos',
            'Cada sector pertenece a una zona y, por medio de ella, a un distrito.',
            [
                'Código de sector',
                'Nombre del sector',
                'Código de zona',
                'Zona',
                'Código de distrito',
                'Distrito',
            ],
            catalogs.sectors.map((sector) => {
                const zone = zoneByCode.get(sector.zoneCode)
                return [
                    sector.code ?? sector.value,
                    sector.label,
                    sector.zoneCode,
                    zone?.label ?? '',
                    zone?.districtCode ?? '',
                    zone ? (districtByCode.get(zone.districtCode) ?? '') : '',
                ]
            }),
            [24, 38, 24, 34, 26, 34],
        ),
    ]
}

async function writeMembersWorkbook(
    rows: ExcelOutputCell[][],
    catalogs: MemberCatalogs,
    filename: string,
    failureReasons?: string[],
) {
    const { default: writeExcelFile } = await import('write-excel-file/browser')
    const headers = failureReasons
        ? [...HEADERS.map((header) => headerStyle(header)), headerStyle('Motivo del rechazo', true)]
        : HEADERS.map((header) => headerStyle(header))
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
                columns: failureReasons ? [...COLUMN_WIDTHS, { width: 60 }] : COLUMN_WIDTHS,
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
    )
}

export function downloadMembersTemplate(catalogs: MemberCatalogs) {
    return writeMembersWorkbook([], catalogs, 'plantilla-importacion-miembros.xlsx')
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
    value: (row: ExcelValue[], name: (typeof HEADERS)[number]) => ExcelValue,
    catalogs: MemberCatalogs,
    issues: string[],
) {
    return (
        resolveOption(value(row, 'Sector'), catalogs.sectors, undefined, 'Sector', issues, true) ??
        null
    )
}

function resolveResidence(
    row: ExcelValue[],
    value: (row: ExcelValue[], name: (typeof HEADERS)[number]) => ExcelValue,
    catalogs: MemberCatalogs,
    issues: string[],
) {
    let country = resolveOption(value(row, 'País'), catalogs.countries, undefined, 'País', issues)
    let department = resolveOption(
        value(row, 'Departamento'),
        catalogs.departments,
        undefined,
        'Departamento',
        issues,
    )
    const municipality = resolveOption(
        value(row, 'Municipio'),
        catalogs.municipalities,
        undefined,
        'Municipio',
        issues,
    )
    const municipalityOption = catalogs.municipalities.find(
        (option) => option.value === municipality,
    )

    if (municipalityOption) {
        if (department && municipalityOption.departmentCode !== department) {
            issues.push(
                `Municipio: ${municipalityOption.label} no pertenece al departamento seleccionado.`,
            )
        }
        department = municipalityOption.departmentCode
    }

    const departmentOption = catalogs.departments.find((option) => option.value === department)
    if (departmentOption) {
        if (country && departmentOption.countryCode !== country) {
            issues.push(
                `Departamento: ${departmentOption.label} no pertenece al país seleccionado.`,
            )
        }
        country = departmentOption.countryCode
    }

    return {
        country: country ?? null,
        department: department ?? null,
        municipality: municipality ?? null,
    }
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
    const column = (name: (typeof HEADERS)[number]) => headerIndexes.get(normalize(name))
    const missing = ['Nombres *', 'Apellidos *'].filter(
        (name) => column(name as (typeof HEADERS)[number]) == null,
    )
    if (missing.length) {
        return {
            rows: [],
            fileErrors: [`Faltan columnas obligatorias: ${missing.join(', ')}.`],
        }
    }

    const value = (row: ExcelValue[], name: (typeof HEADERS)[number]) => {
        const index = column(name)
        return index == null ? null : row[index]
    }
    const rows: MemberWorkbookImportRow[] = []
    const seenCodes = new Set<string>()
    const seenDocuments = new Set<string>()

    excelRows.slice(1).forEach((row, index) => {
        if (!row.some((cell) => text(cell))) return
        const rowNumber = index + 2
        const issues: string[] = []
        if (rows.length >= 1000) issues.push('El archivo supera el límite de 1,000 miembros.')

        const firstName = text(value(row, 'Nombres *'))
        const lastName = text(value(row, 'Apellidos *'))
        const code = text(value(row, 'Código')).toUpperCase()
        const documentNumber = text(value(row, 'Documento'))
        if (!firstName) issues.push('Nombres: es obligatorio.')
        if (!lastName) issues.push('Apellidos: es obligatorio.')
        if (code && seenCodes.has(code)) issues.push(`Código duplicado en el archivo: ${code}.`)
        if (documentNumber && seenDocuments.has(documentNumber)) {
            issues.push(`Documento duplicado en el archivo: ${documentNumber}.`)
        }
        if (code) seenCodes.add(code)
        if (documentNumber) seenDocuments.add(documentNumber)

        const email = text(value(row, 'Correo'))
        if (email && !/^\S+@\S+\.\S+$/.test(email)) {
            issues.push(`Correo: “${email}” no es válido.`)
        }
        const sector = resolveTerritory(row, value, catalogs, issues)
        const residence = resolveResidence(row, value, catalogs, issues)
        const roles = resolveCatalogList(value(row, 'Roles'), catalogs.roles, 'Roles', issues)

        const member: MemberInput = {
            code: code || undefined,
            firstName,
            middleName: text(value(row, 'Segundo nombre')) || null,
            lastName,
            secondLastName: text(value(row, 'Segundo apellido')) || null,
            preferredName: text(value(row, 'Nombre preferido')) || null,
            documentNumber: documentNumber || null,
            birthDate: isoDate(value(row, 'Fecha nacimiento'), 'Fecha de nacimiento', issues),
            gender: resolveOption(
                value(row, 'Género'),
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
            alternatePhone: text(value(row, 'Teléfono alterno')) || null,
            email: email || null,
            address: text(value(row, 'Dirección')) || null,
            country: residence.country,
            municipality: residence.municipality,
            department: residence.department,
            occupation: text(value(row, 'Ocupación')) || null,
            status: resolveOption(
                value(row, 'Estado'),
                catalogs.statuses,
                'ACTIVE',
                'Estado',
                issues,
            ) as MemberStatus,
            roles: (roles.length ? roles : ['MEMBER']) as MemberCommunityRole[],
            ministries: resolveCatalogList(
                value(row, 'Ministerios'),
                catalogs.ministries,
                'Ministerios',
                issues,
            ),
            joinedAt: isoDate(value(row, 'Fecha ingreso'), 'Fecha de ingreso', issues),
            conversionDate: isoDate(value(row, 'Fecha conversión'), 'Fecha de conversión', issues),
            baptismDate: isoDate(value(row, 'Fecha bautismo'), 'Fecha de bautismo', issues),
            sector,
            smallGroup: text(value(row, 'Grupo pequeño')) || null,
            emergencyContactName: text(value(row, 'Contacto emergencia')) || null,
            emergencyContactPhone: text(value(row, 'Teléfono emergencia')) || null,
            notes: text(value(row, 'Notas')) || null,
        }

        rows.push({
            rowNumber,
            member,
            rawValues: HEADERS.map((header) => value(row, header)),
            issues,
        })
    })

    return {
        rows,
        fileErrors: rows.length ? [] : ['No se encontraron miembros para importar.'],
    }
}
