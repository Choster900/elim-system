import { prisma } from '../database/prisma'

function fullName(member: {
    firstName: string
    middleName: string | null
    lastName: string
    secondLastName: string | null
}) {
    return [member.firstName, member.middleName, member.lastName, member.secondLastName]
        .filter(Boolean)
        .join(' ')
}

function serializeDate(value: Date | null | undefined) {
    return value ? value.toISOString() : null
}

export async function findMembers() {
    const members = await prisma.member.findMany({
        orderBy: [{ lastName: 'asc' }, { firstName: 'asc' }],
        include: {
            communityRoles: {
                include: {
                    role: true,
                },
            },
            ministries: {
                include: {
                    ministry: true,
                },
            },
        },
    })

    return members.map((member) => ({
        id: member.id,
        code: member.code,
        firstName: member.firstName,
        middleName: member.middleName,
        lastName: member.lastName,
        secondLastName: member.secondLastName,
        preferredName: member.preferredName,
        documentNumber: member.documentNumber,
        birthDate: serializeDate(member.birthDate),
        gender: member.gender,
        maritalStatus: member.maritalStatus,
        phone: member.phone,
        alternatePhone: member.alternatePhone,
        email: member.email,
        address: member.address,
        municipality: member.municipality,
        department: member.department,
        occupation: member.occupation,
        status: member.status,
        roles: member.communityRoles.map((item) => item.role.code),
        ministries: member.ministries.map((item) => item.ministry.name),
        joinedAt: serializeDate(member.joinedAt),
        conversionDate: serializeDate(member.conversionDate),
        baptismDate: serializeDate(member.baptismDate),
        district: member.district,
        zone: member.zone,
        sector: member.sector,
        smallGroup: member.smallGroup,
        emergencyContactName: member.emergencyContactName,
        emergencyContactPhone: member.emergencyContactPhone,
        notes: member.notes,
        createdAt: member.createdAt.toISOString(),
        updatedAt: member.updatedAt.toISOString(),
        fullName: fullName(member),
    }))
}
