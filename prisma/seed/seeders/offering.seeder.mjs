// Catálogo de categorías de ofrenda y ofrendas de ejemplo por reunión.
// Cada ofrenda documenta la asistencia desglosada por tipo de persona y lo recogido
// por categoría. El total de asistencia se calcula del desglose, como en la captura.

export const OFFERING_CATEGORY_SEEDS = [
    { code: 'COF-DIEZMOS', name: 'Diezmos', sortOrder: 1, description: 'Diezmos de los miembros.' },
    {
        code: 'COF-OFRENDA',
        name: 'Ofrenda general',
        sortOrder: 2,
        description: 'Ofrenda voluntaria del servicio.',
    },
    {
        code: 'COF-MISIONES',
        name: 'Misiones',
        sortOrder: 3,
        description: 'Ofrenda destinada a misiones.',
    },
    {
        code: 'COF-PRIMICIAS',
        name: 'Primicias',
        sortOrder: 4,
        description: 'Primicias y ofrendas especiales.',
    },
    { code: 'COF-OTROS', name: 'Otros', sortOrder: 5, description: 'Otros ingresos y donaciones.' },
]

// Ofrendas de ejemplo, referenciadas por el título de la reunión.
// details: [{ categoryCode, amount }] · attendance: { typeCode: cantidad }
export const OFFERING_SEEDS = [
    {
        meetingTitle: 'Servicio Dominical de Adoración',
        attendance: { HERMANOS: 180, AMIGOS: 42, NUEVOS: 11, NINOS: 45, JOVENES: 20 },
        notes: 'Servicio con alta asistencia.',
        details: [
            { categoryCode: 'COF-DIEZMOS', amount: 1850.0 },
            { categoryCode: 'COF-OFRENDA', amount: 640.5 },
            { categoryCode: 'COF-MISIONES', amount: 210.0 },
        ],
    },
    {
        meetingTitle: 'Célula del Buen Pastor',
        attendance: { HERMANOS: 9, AMIGOS: 4, NUEVOS: 1, NINOS: 2 },
        notes: '',
        details: [
            { categoryCode: 'COF-OFRENDA', amount: 45.75 },
            { categoryCode: 'COF-MISIONES', amount: 20.0 },
        ],
    },
    {
        meetingTitle: 'Reunión de Líderes de Sector',
        attendance: { HERMANOS: 20 },
        notes: 'Ofrenda de gratitud de los líderes.',
        details: [{ categoryCode: 'COF-OFRENDA', amount: 120.0 }],
    },
    {
        meetingTitle: 'Capacitación de Voluntarios',
        attendance: { HERMANOS: 12, JOVENES: 5 },
        notes: '',
        details: [
            { categoryCode: 'COF-OFRENDA', amount: 35.0 },
            { categoryCode: 'COF-OTROS', amount: 15.5 },
        ],
    },
    {
        meetingTitle: 'Estudio Bíblico de Jueves',
        attendance: { HERMANOS: 28, AMIGOS: 6, NUEVOS: 2, NINOS: 4, JOVENES: 2 },
        notes: '',
        details: [
            { categoryCode: 'COF-DIEZMOS', amount: 260.0 },
            { categoryCode: 'COF-OFRENDA', amount: 88.25 },
        ],
    },
    {
        meetingTitle: 'Servicio de Sanidad y Liberación',
        attendance: { HERMANOS: 96, AMIGOS: 24, NUEVOS: 14, NINOS: 18, JOVENES: 13 },
        notes: 'Noche de gratitud, ofrenda especial de primicias.',
        details: [
            { categoryCode: 'COF-DIEZMOS', amount: 920.0 },
            { categoryCode: 'COF-OFRENDA', amount: 410.0 },
            { categoryCode: 'COF-PRIMICIAS', amount: 175.0 },
            { categoryCode: 'COF-MISIONES', amount: 95.0 },
        ],
    },
]

function attendanceTotal(attendance) {
    return Object.values(attendance).reduce((sum, quantity) => sum + quantity, 0)
}

export async function seedOfferingCategories(prisma) {
    const categories = await prisma.$transaction(
        OFFERING_CATEGORY_SEEDS.map((seed) => {
            const data = {
                code: seed.code,
                name: seed.name,
                description: seed.description ?? null,
                sortOrder: seed.sortOrder ?? 0,
                isActive: true,
            }
            return prisma.offeringCategory.upsert({
                where: { code: seed.code },
                create: data,
                update: data,
            })
        }),
    )

    return new Map(categories.map((category) => [category.code, category]))
}

function round2(value) {
    return Math.round(value * 100) / 100
}

// Idempotente: una ocurrencia por (reunión, fecha). Si ya existe registrada, se omite.
export async function seedOfferings(prisma, meetings, categories, attendanceTypes, recordedById) {
    let created = 0

    for (const seed of OFFERING_SEEDS) {
        const meeting = meetings.get(seed.meetingTitle)
        if (!meeting) throw new Error(`Seed meeting not found: ${seed.meetingTitle}`)

        const existing = await prisma.meetingOccurrence.findUnique({
            where: { meetingId_date: { meetingId: meeting.id, date: meeting.date } },
        })
        if (existing && existing.status === 'RECORDED') continue

        const details = seed.details.map((detail) => {
            const category = categories.get(detail.categoryCode)
            if (!category)
                throw new Error(`Seed offering category not found: ${detail.categoryCode}`)
            return { categoryId: category.id, amount: detail.amount }
        })

        const totalAmount = round2(details.reduce((sum, detail) => sum + detail.amount, 0))

        const attendanceDetails = Object.entries(seed.attendance).map(([typeCode, quantity]) => {
            const type = attendanceTypes.get(typeCode)
            if (!type) throw new Error(`Seed attendance type not found: ${typeCode}`)
            return { typeId: type.id, quantity }
        })

        // La ocurrencia puede existir ya como pendiente si la generación corrió antes.
        const captureData = {
            status: 'RECORDED',
            attendance: attendanceTotal(seed.attendance),
            totalAmount,
            currency: 'USD',
            notes: seed.notes || null,
            recordedById: recordedById ?? null,
            recordedAt: new Date(),
            details: { deleteMany: {}, create: details },
            attendanceDetails: { deleteMany: {}, create: attendanceDetails },
        }

        if (existing) {
            await prisma.meetingOccurrence.update({ where: { id: existing.id }, data: captureData })
        } else {
            await prisma.meetingOccurrence.create({
                data: {
                    meetingId: meeting.id,
                    date: meeting.date,
                    sectorId: meeting.sectorId,
                    leaderId: meeting.leaderId,
                    ...captureData,
                    details: { create: details },
                    attendanceDetails: { create: attendanceDetails },
                },
            })
        }
        created += 1
    }

    return created
}
