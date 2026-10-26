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

export const OFFERING_SEEDS = [
    {
        meetingTitle: 'Servicio Dominical de Adoración',
        attendance: {
            NINOS_HERMANOS: 30,
            NINOS_AMIGOS: 15,
            JOVENES_HERMANOS: 14,
            JOVENES_AMIGOS: 6,
            ADULTOS_HERMANOS: 160,
            ADULTOS_AMIGOS: 33,
            CONVERSIONES: 4,
            RECONCILIACIONES: 2,
            VISITAS_PROGRAMADAS: 6,
            BAUTISMOS: 1,
        },
        notes: 'Servicio con alta asistencia.',
        details: [
            { categoryCode: 'COF-DIEZMOS', amount: 1850.0 },
            { categoryCode: 'COF-OFRENDA', amount: 640.5 },
            { categoryCode: 'COF-MISIONES', amount: 210.0 },
        ],
    },
    {
        meetingTitle: 'Célula del Buen Pastor',
        attendance: {
            NINOS_HERMANOS: 2,
            ADULTOS_HERMANOS: 9,
            ADULTOS_AMIGOS: 5,
            CONVERSIONES: 1,
            VISITAS_PROGRAMADAS: 2,
        },
        notes: '',
        details: [
            { categoryCode: 'COF-OFRENDA', amount: 45.75 },
            { categoryCode: 'COF-MISIONES', amount: 20.0 },
        ],
    },
    {
        meetingTitle: 'Reunión de Líderes de Sector',
        attendance: { ADULTOS_HERMANOS: 20 },
        notes: 'Ofrenda de gratitud de los líderes.',
        details: [{ categoryCode: 'COF-OFRENDA', amount: 120.0 }],
    },
    {
        meetingTitle: 'Capacitación de Voluntarios',
        attendance: { JOVENES_HERMANOS: 5, ADULTOS_HERMANOS: 12 },
        notes: '',
        details: [
            { categoryCode: 'COF-OFRENDA', amount: 35.0 },
            { categoryCode: 'COF-OTROS', amount: 15.5 },
        ],
    },
    {
        meetingTitle: 'Estudio Bíblico de Jueves',
        attendance: {
            NINOS_HERMANOS: 4,
            JOVENES_HERMANOS: 2,
            ADULTOS_HERMANOS: 28,
            ADULTOS_AMIGOS: 8,
            RECONCILIACIONES: 1,
        },
        notes: '',
        details: [
            { categoryCode: 'COF-DIEZMOS', amount: 260.0 },
            { categoryCode: 'COF-OFRENDA', amount: 88.25 },
        ],
    },
    {
        meetingTitle: 'Servicio de Sanidad y Liberación',
        attendance: {
            NINOS_HERMANOS: 12,
            NINOS_AMIGOS: 6,
            JOVENES_HERMANOS: 9,
            JOVENES_AMIGOS: 4,
            ADULTOS_HERMANOS: 96,
            ADULTOS_AMIGOS: 38,
            CONVERSIONES: 7,
            RECONCILIACIONES: 3,
            VISITAS_PROGRAMADAS: 9,
            BAUTISMOS: 2,
        },
        notes: 'Noche de gratitud, ofrenda especial de primicias.',
        details: [
            { categoryCode: 'COF-DIEZMOS', amount: 920.0 },
            { categoryCode: 'COF-OFRENDA', amount: 410.0 },
            { categoryCode: 'COF-PRIMICIAS', amount: 175.0 },
            { categoryCode: 'COF-MISIONES', amount: 95.0 },
        ],
    },
]

function attendanceTotal(attendance, attendanceTypes) {
    return Object.entries(attendance).reduce((sum, [typeCode, quantity]) => {
        const counts = attendanceTypes.get(typeCode)?.group?.countsTowardAttendance ?? true
        return counts ? sum + quantity : sum
    }, 0)
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

        const captureData = {
            status: 'RECORDED',
            attendance: attendanceTotal(seed.attendance, attendanceTypes),
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
