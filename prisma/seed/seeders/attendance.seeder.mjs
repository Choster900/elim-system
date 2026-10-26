export const ATTENDANCE_GROUP_SEEDS = [
    {
        code: 'NINOS',
        name: 'Niños',
        sortOrder: 1,
        countsTowardAttendance: true,
        description: 'Asistencia de niños.',
    },
    {
        code: 'JOVENES',
        name: 'Jóvenes',
        sortOrder: 2,
        countsTowardAttendance: true,
        description: 'Asistencia de jóvenes.',
    },
    {
        code: 'ADULTOS',
        name: 'Adultos',
        sortOrder: 3,
        countsTowardAttendance: true,
        description: 'Asistencia de adultos.',
    },
    {
        code: 'RESULTADOS',
        name: 'Resultados',
        sortOrder: 4,
        countsTowardAttendance: false,
        description:
            'Frutos de la reunión; no suman a la asistencia porque esas personas ya se contaron.',
    },
]

export const ATTENDANCE_TYPE_SEEDS = [
    {
        groupCode: 'NINOS',
        code: 'NINOS_HERMANOS',
        name: 'Hermanos',
        sortOrder: 1,
        description: 'Niños que son miembros de la iglesia.',
    },
    {
        groupCode: 'NINOS',
        code: 'NINOS_AMIGOS',
        name: 'Amigos',
        sortOrder: 2,
        description: 'Niños que nos visitan.',
    },
    {
        groupCode: 'JOVENES',
        code: 'JOVENES_HERMANOS',
        name: 'Hermanos',
        sortOrder: 3,
        description: 'Jóvenes que son miembros de la iglesia.',
    },
    {
        groupCode: 'JOVENES',
        code: 'JOVENES_AMIGOS',
        name: 'Amigos',
        sortOrder: 4,
        description: 'Jóvenes que nos visitan.',
    },
    {
        groupCode: 'ADULTOS',
        code: 'ADULTOS_HERMANOS',
        name: 'Hermanos',
        sortOrder: 5,
        description: 'Adultos que son miembros de la iglesia.',
    },
    {
        groupCode: 'ADULTOS',
        code: 'ADULTOS_AMIGOS',
        name: 'Amigos',
        sortOrder: 6,
        description: 'Adultos que nos visitan.',
    },
    {
        groupCode: 'RESULTADOS',
        code: 'CONVERSIONES',
        name: 'Conversiones',
        sortOrder: 7,
        description: 'Personas que aceptaron a Cristo en la reunión.',
    },
    {
        groupCode: 'RESULTADOS',
        code: 'RECONCILIACIONES',
        name: 'Reconciliaciones',
        sortOrder: 8,
        description: 'Personas que se reconciliaron en la reunión.',
    },
    {
        groupCode: 'RESULTADOS',
        code: 'VISITAS_PROGRAMADAS',
        name: 'Visitas programadas',
        sortOrder: 9,
        description: 'Visitas que se acordaron durante la reunión.',
    },
    {
        groupCode: 'RESULTADOS',
        code: 'BAUTISMOS',
        name: 'Bautismos',
        sortOrder: 10,
        description: 'Personas bautizadas o anotadas para bautizarse.',
    },
]

export async function seedAttendanceTypes(prisma) {
    const groups = await prisma.$transaction(
        ATTENDANCE_GROUP_SEEDS.map((seed) => {
            const data = { ...seed, isActive: true }
            return prisma.attendanceGroup.upsert({
                where: { code: seed.code },
                create: data,
                update: data,
            })
        }),
    )
    const groupsByCode = new Map(groups.map((group) => [group.code, group]))

    const types = await prisma.$transaction(
        ATTENDANCE_TYPE_SEEDS.map((seed) => {
            const group = groupsByCode.get(seed.groupCode)
            if (!group) throw new Error(`Seed attendance group not found: ${seed.groupCode}`)
            const data = {
                code: seed.code,
                name: seed.name,
                description: seed.description,
                sortOrder: seed.sortOrder,
                groupId: group.id,
                isActive: true,
            }
            return prisma.attendanceType.upsert({
                where: { code: seed.code },
                create: data,
                update: data,
                include: { group: true },
            })
        }),
    )

    return new Map(types.map((type) => [type.code, type]))
}
