import {
    memberGenderOptions,
    memberMaritalStatusOptions,
    memberRoleOptions,
    memberStatusOptions,
} from '../constants/member.constants'
import type {
    Member,
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

export interface MemberImportPreview {
    members: MemberInput[]
    errors: string[]
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
    'Municipio',
    'Departamento',
    'Ocupación',
    'Estado',
    'Roles',
    'Ministerios',
    'Fecha ingreso',
    'Fecha conversión',
    'Fecha bautismo',
    'Distrito',
    'Zona',
    'Sector',
    'Grupo pequeño',
    'Contacto emergencia',
    'Teléfono emergencia',
    'Notas',
] as const

const COLUMN_WIDTHS = [
    14, 20, 18, 20, 18, 18, 18, 16, 16, 18, 16, 18, 26, 32, 20, 20, 22, 14, 30, 28, 16, 16, 16, 20,
    20, 20, 22, 24, 20, 36,
].map((width) => ({ width }))

const headerStyle = (value: string) => ({
    value,
    fontWeight: 'bold' as const,
    textColor: '#201A17',
    backgroundColor: '#E9C176',
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

function memberRow(member: Member) {
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
        member.municipality,
        member.department,
        member.occupation,
        getMemberStatusLabel(member.status),
        member.roles.map(getMemberRoleLabel).join('; '),
        member.ministries.join('; '),
        dateCell(member.joinedAt),
        dateCell(member.conversionDate),
        dateCell(member.baptismDate),
        member.district,
        member.zone,
        member.sector,
        member.smallGroup,
        member.emergencyContactName,
        member.emergencyContactPhone,
        member.notes,
    ]
}

function instructionsData() {
    const heading = (value: string) => ({
        value,
        fontWeight: 'bold' as const,
        textColor: '#FFFFFF',
        backgroundColor: '#6B4F3A',
        borderColor: '#B9AA9E',
        borderStyle: 'thin' as const,
    })
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
                value: 'No cambies los encabezados de la hoja “Miembros”. Las fechas pueden escribirse como dd/mm/aaaa.',
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
        ['Nombres', 'Sí', 'Texto', 'María Elena'],
        ['Apellidos', 'Sí', 'Texto', 'González'],
        ['Código', 'No', 'Vacío para generar uno; sirve para actualizar', 'M-00025'],
        ['Documento', 'No', 'Único; también sirve para actualizar', '01234567-8'],
        ['Estado', 'No', memberStatusOptions.map((option) => option.label).join(', '), 'Activo'],
        ['Género', 'No', memberGenderOptions.map((option) => option.label).join(', '), 'Femenino'],
        [
            'Estado civil',
            'No',
            memberMaritalStatusOptions.map((option) => option.label).join(', '),
            'Casado/a',
        ],
        [
            'Roles',
            'No',
            `Separados por punto y coma: ${memberRoleOptions.map((option) => option.label).join(', ')}`,
            'Miembro; Líder',
        ],
        ['Ministerios', 'No', 'Separados por punto y coma', 'Jóvenes; Alabanza'],
        ['Fechas', 'No', 'dd/mm/aaaa o fecha válida de Excel', '14/08/2026'],
    ]
}

export async function exportMembersWorkbook(members: Member[]) {
    const { default: writeExcelFile } = await import('write-excel-file/browser')
    const data = [HEADERS.map(headerStyle), ...members.map(memberRow)]
    await writeExcelFile(
        [
            {
                data,
                sheet: 'Miembros',
                columns: COLUMN_WIDTHS,
                stickyRowsCount: 1,
                stickyColumnsCount: 2,
                showGridLines: false,
                orientation: 'landscape',
                dateFormat: 'dd/mm/yyyy',
            },
            {
                data: instructionsData(),
                sheet: 'Instrucciones',
                columns: [{ width: 22 }, { width: 14 }, { width: 70 }, { width: 28 }],
                stickyRowsCount: 3,
                showGridLines: false,
            },
        ],
        { fontFamily: 'Arial', fontSize: 10 },
    ).toFile(`miembros-${new Date().toISOString().slice(0, 10)}.xlsx`)
}

export async function downloadMembersTemplate() {
    const { default: writeExcelFile } = await import('write-excel-file/browser')
    await writeExcelFile(
        [
            {
                data: [HEADERS.map(headerStyle)],
                sheet: 'Miembros',
                columns: COLUMN_WIDTHS,
                stickyRowsCount: 1,
                stickyColumnsCount: 2,
                showGridLines: false,
                orientation: 'landscape',
            },
            {
                data: instructionsData(),
                sheet: 'Instrucciones',
                columns: [{ width: 22 }, { width: 14 }, { width: 70 }, { width: 28 }],
                stickyRowsCount: 3,
                showGridLines: false,
            },
        ],
        { fontFamily: 'Arial', fontSize: 10 },
    ).toFile('plantilla-importacion-miembros.xlsx')
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

function optionValue<T extends string>(
    value: ExcelValue,
    options: { value: T; label: string }[],
    fallback: T,
) {
    const input = normalize(text(value))
    if (!input) return fallback
    return (
        options.find(
            (option) => normalize(option.label) === input || normalize(option.value) === input,
        )?.value ?? fallback
    )
}

function isoDate(value: ExcelValue) {
    if (!value) return null
    if (value instanceof Date && !Number.isNaN(value.getTime()))
        return value.toISOString().slice(0, 10)
    const input = text(value)
    const dayFirst = input.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/)
    if (dayFirst) {
        return `${dayFirst[3]}-${dayFirst[2]!.padStart(2, '0')}-${dayFirst[1]!.padStart(2, '0')}`
    }
    return /^\d{4}-\d{2}-\d{2}$/.test(input) ? input : null
}

function roles(value: ExcelValue) {
    const values = text(value).split(/[;,]/).map(normalize).filter(Boolean)
    if (!values.length) return ['MEMBER'] as MemberCommunityRole[]
    return [
        ...new Set(
            values
                .map(
                    (input) =>
                        memberRoleOptions.find(
                            (option) =>
                                normalize(option.label) === input ||
                                normalize(option.value) === input,
                        )?.value,
                )
                .filter((role): role is MemberCommunityRole => !!role),
        ),
    ]
}

function list(value: ExcelValue) {
    return [
        ...new Set(
            text(value)
                .split(/[;,]/)
                .map((item) => item.trim())
                .filter(Boolean),
        ),
    ]
}

export async function parseMembersWorkbook(file: File): Promise<MemberImportPreview> {
    if (file.size > 5 * 1024 * 1024) {
        return { members: [], errors: ['El archivo supera el límite de 5 MB.'] }
    }

    const { readSheet } = await import('read-excel-file/browser')
    const rows = await readSheet(file)
    if (!rows.length) return { members: [], errors: ['El archivo no contiene datos.'] }

    const headerIndexes = new Map(rows[0]!.map((value, index) => [normalize(text(value)), index]))
    const column = (name: (typeof HEADERS)[number]) => headerIndexes.get(normalize(name))
    const missing = ['Nombres *', 'Apellidos *'].filter(
        (name) => column(name as (typeof HEADERS)[number]) == null,
    )
    if (missing.length) {
        return { members: [], errors: [`Faltan columnas obligatorias: ${missing.join(', ')}.`] }
    }

    const value = (row: ExcelValue[], name: (typeof HEADERS)[number]) => {
        const index = column(name)
        return index == null ? null : row[index]
    }
    const members: MemberInput[] = []
    const errors: string[] = []
    const seenCodes = new Set<string>()
    const seenDocuments = new Set<string>()

    rows.slice(1, 1001).forEach((row, index) => {
        if (!row.some((cell) => text(cell))) return
        const rowNumber = index + 2
        const firstName = text(value(row, 'Nombres *'))
        const lastName = text(value(row, 'Apellidos *'))
        const code = text(value(row, 'Código')).toUpperCase()
        const documentNumber = text(value(row, 'Documento'))
        if (!firstName || !lastName) {
            errors.push(`Fila ${rowNumber}: nombres y apellidos son obligatorios.`)
            return
        }
        if (code && seenCodes.has(code)) errors.push(`Fila ${rowNumber}: código duplicado ${code}.`)
        if (documentNumber && seenDocuments.has(documentNumber)) {
            errors.push(`Fila ${rowNumber}: documento duplicado ${documentNumber}.`)
        }
        if (code) seenCodes.add(code)
        if (documentNumber) seenDocuments.add(documentNumber)

        members.push({
            code: code || undefined,
            firstName,
            middleName: text(value(row, 'Segundo nombre')) || null,
            lastName,
            secondLastName: text(value(row, 'Segundo apellido')) || null,
            preferredName: text(value(row, 'Nombre preferido')) || null,
            documentNumber: documentNumber || null,
            birthDate: isoDate(value(row, 'Fecha nacimiento')),
            gender: optionValue(
                value(row, 'Género'),
                memberGenderOptions,
                'UNSPECIFIED',
            ) as MemberGender,
            maritalStatus: optionValue(
                value(row, 'Estado civil'),
                memberMaritalStatusOptions,
                'UNSPECIFIED',
            ) as MemberMaritalStatus,
            phone: text(value(row, 'Teléfono')) || null,
            alternatePhone: text(value(row, 'Teléfono alterno')) || null,
            email: text(value(row, 'Correo')) || null,
            address: text(value(row, 'Dirección')) || null,
            municipality: text(value(row, 'Municipio')) || null,
            department: text(value(row, 'Departamento')) || null,
            occupation: text(value(row, 'Ocupación')) || null,
            status: optionValue(
                value(row, 'Estado'),
                memberStatusOptions,
                'ACTIVE',
            ) as MemberStatus,
            roles: roles(value(row, 'Roles')),
            ministries: list(value(row, 'Ministerios')),
            joinedAt: isoDate(value(row, 'Fecha ingreso')),
            conversionDate: isoDate(value(row, 'Fecha conversión')),
            baptismDate: isoDate(value(row, 'Fecha bautismo')),
            district: text(value(row, 'Distrito')) || null,
            zone: text(value(row, 'Zona')) || null,
            sector: text(value(row, 'Sector')) || null,
            smallGroup: text(value(row, 'Grupo pequeño')) || null,
            emergencyContactName: text(value(row, 'Contacto emergencia')) || null,
            emergencyContactPhone: text(value(row, 'Teléfono emergencia')) || null,
            notes: text(value(row, 'Notas')) || null,
        })
    })

    if (rows.length > 1001)
        errors.push('El archivo contiene más de 1,000 registros; divídelo en partes.')
    if (!members.length && !errors.length) errors.push('No se encontraron miembros para importar.')
    return { members, errors }
}
