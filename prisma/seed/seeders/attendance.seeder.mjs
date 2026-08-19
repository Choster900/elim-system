// Catálogo de tipos de asistencia. Los códigos son los mismos que inserta la
// migración `20260819140000_attendance_types`: el seed debe reconciliar esas filas,
// no crear un segundo juego con otro código (el nombre es único y chocaría).

export const ATTENDANCE_TYPE_SEEDS = [
    { code: 'HERMANOS', name: 'Hermanos', sortOrder: 1, description: 'Miembros de la iglesia.' },
    {
        code: 'AMIGOS',
        name: 'Amigos',
        sortOrder: 2,
        description: 'Visitas que ya asisten con regularidad.',
    },
    {
        code: 'NUEVOS',
        name: 'Nuevos',
        sortOrder: 3,
        description: 'Personas que asisten por primera vez.',
    },
    { code: 'NINOS', name: 'Niños', sortOrder: 4, description: 'Menores de edad.' },
    { code: 'JOVENES', name: 'Jóvenes', sortOrder: 5, description: 'Ministerio juvenil.' },
]

export async function seedAttendanceTypes(prisma) {
    const types = await prisma.$transaction(
        ATTENDANCE_TYPE_SEEDS.map((seed) => {
            const data = {
                code: seed.code,
                name: seed.name,
                description: seed.description ?? null,
                sortOrder: seed.sortOrder ?? 0,
                isActive: true,
            }
            return prisma.attendanceType.upsert({
                where: { code: seed.code },
                create: data,
                update: data,
            })
        }),
    )

    return new Map(types.map((type) => [type.code, type]))
}
