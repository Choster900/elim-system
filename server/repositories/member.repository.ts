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

export async function findMembers() {
    const members = await prisma.member.findMany({
        orderBy: [{ lastName: 'asc' }, { firstName: 'asc' }],
    })

    return members.map((member) => ({
        id: member.id,
        code: member.code,
        firstName: member.firstName,
        middleName: member.middleName,
        lastName: member.lastName,
        secondLastName: member.secondLastName,
        fullName: fullName(member),
        email: member.email,
        phone: member.phone,
        status: member.status,
    }))
}
