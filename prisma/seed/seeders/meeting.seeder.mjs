// Datos de prueba de tipos de reunión y reuniones.
// Las reuniones referencian sectores (por code SEC-***) y miembros líderes/supervisores
// (por code MIE-****) sembrados en territory.seeder.mjs y member.seeder.mjs.

export const MEETING_TYPE_SEEDS = [
    {
        code: 'TIP-SERVICIO',
        name: 'Servicio Dominical',
        color: '#e9c176',
        description: 'Reunión central de adoración y predicación.',
    },
    {
        code: 'TIP-CELULA',
        name: 'Célula Familiar',
        color: '#9bc1bc',
        description: 'Grupo pequeño en hogares.',
    },
    {
        code: 'TIP-LIDERAZGO',
        name: 'Reunión de Liderazgo',
        color: '#d39a9a',
        description: 'Coordinación y planificación de líderes.',
    },
    {
        code: 'TIP-CAPACITACION',
        name: 'Capacitación',
        color: '#a3b18a',
        description: 'Formación y talleres para servidores.',
    },
    {
        code: 'TIP-VIGILIA',
        name: 'Vigilia de Oración',
        color: '#b4a7d6',
        description: 'Noche de oración e intercesión.',
    },
    {
        code: 'TIP-ESTUDIO',
        name: 'Estudio Bíblico',
        color: '#f4a261',
        description: 'Estudio expositivo de la Palabra.',
    },
    {
        code: 'TIP-ENSAYO',
        name: 'Ensayo de Adoración',
        color: '#8ab0d9',
        description: 'Preparación del equipo de alabanza.',
    },
]

// frequency: ONCE | WEEKLY | BIWEEKLY | MONTHLY
export const MEETING_SEEDS = [
    {
        title: 'Servicio Dominical de Adoración',
        description: 'Encuentro central de la semana. Adoración y exposición de la Palabra.',
        typeCode: 'TIP-SERVICIO',
        sectorCode: 'SEC-004',
        supervisorCode: 'MIE-0009',
        coSupervisorCodes: ['MIE-0002'],
        date: '2026-08-09',
        startTime: '09:00',
        endTime: '11:30',
        location: 'Salón Principal',
        frequency: 'WEEKLY',
        expectedAttendees: 320,
        isPublic: true,
        notes: 'Comunión al cierre del servicio.',
        color: '#e9c176',
    },
    {
        title: 'Célula del Buen Pastor',
        description: 'Grupo pequeño de familias del sector norte.',
        typeCode: 'TIP-CELULA',
        sectorCode: 'SEC-001',
        supervisorCode: 'MIE-0002',
        coSupervisorCodes: [],
        date: '2026-08-12',
        startTime: '19:30',
        endTime: '21:00',
        location: 'Casa de la familia Mendoza',
        frequency: 'WEEKLY',
        expectedAttendees: 14,
        isPublic: false,
        notes: '',
        color: '#9bc1bc',
    },
    {
        title: 'Reunión de Líderes de Sector',
        description: 'Revisión mensual del avance ministerial por sector.',
        typeCode: 'TIP-LIDERAZGO',
        sectorCode: 'SEC-004',
        supervisorCode: 'MIE-0009',
        coSupervisorCodes: ['MIE-0001'],
        date: '2026-08-10',
        startTime: '18:00',
        endTime: '20:00',
        location: 'Sala de Consejo',
        frequency: 'MONTHLY',
        expectedAttendees: 22,
        isPublic: false,
        notes: 'Llevar reporte de asistencia trimestral.',
        color: '#d39a9a',
    },
    {
        title: 'Capacitación de Voluntarios',
        description: 'Inducción para nuevos servidores en el área de hospitalidad.',
        typeCode: 'TIP-CAPACITACION',
        sectorCode: 'SEC-005',
        supervisorCode: 'MIE-0008',
        coSupervisorCodes: [],
        date: '2026-08-05',
        startTime: '16:00',
        endTime: '18:30',
        location: 'Aula 2',
        frequency: 'ONCE',
        expectedAttendees: 18,
        isPublic: false,
        notes: 'Material entregado en versión digital.',
        color: '#a3b18a',
    },
    {
        title: 'Estudio Bíblico de Jueves',
        description: 'Recorrido por el libro de Hechos.',
        typeCode: 'TIP-ESTUDIO',
        sectorCode: 'SEC-003',
        supervisorCode: 'MIE-0007',
        coSupervisorCodes: [],
        date: '2026-08-13',
        startTime: '19:00',
        endTime: '20:30',
        location: 'Salón Multipropósito',
        frequency: 'WEEKLY',
        expectedAttendees: 45,
        isPublic: true,
        notes: '',
        color: '#f4a261',
    },
    {
        title: 'Servicio de Sanidad y Liberación',
        description: 'Servicio especial de oración por enfermos.',
        typeCode: 'TIP-SERVICIO',
        sectorCode: 'SEC-005',
        supervisorCode: 'MIE-0009',
        coSupervisorCodes: ['MIE-0005'],
        date: '2026-08-02',
        startTime: '19:00',
        endTime: '21:30',
        location: 'Templo',
        frequency: 'MONTHLY',
        expectedAttendees: 180,
        isPublic: true,
        notes: '',
        color: '#e9c176',
    },
    {
        title: 'Servicio Dominical (próximo)',
        description: 'Servicio dominical de la próxima semana.',
        typeCode: 'TIP-SERVICIO',
        sectorCode: 'SEC-004',
        supervisorCode: 'MIE-0009',
        coSupervisorCodes: ['MIE-0002'],
        date: '2026-08-23',
        startTime: '09:00',
        endTime: '11:30',
        location: 'Salón Principal',
        frequency: 'WEEKLY',
        expectedAttendees: 320,
        isPublic: true,
        notes: '',
        color: '#e9c176',
    },
    {
        title: 'Vigilia de Inicio de Mes',
        description: 'Noche de oración intercesora abierta a toda la congregación.',
        typeCode: 'TIP-VIGILIA',
        sectorCode: 'SEC-004',
        supervisorCode: 'MIE-0005',
        coSupervisorCodes: ['MIE-0007'],
        date: '2026-09-01',
        startTime: '22:00',
        endTime: '23:59',
        location: 'Templo',
        frequency: 'MONTHLY',
        expectedAttendees: 90,
        isPublic: true,
        notes: '',
        color: '#b4a7d6',
    },
    {
        title: 'Ensayo del Equipo de Alabanza',
        description: 'Preparación de repertorio para el servicio dominical.',
        typeCode: 'TIP-ENSAYO',
        sectorCode: 'SEC-004',
        supervisorCode: 'MIE-0002',
        coSupervisorCodes: [],
        date: '2026-08-21',
        startTime: '20:00',
        endTime: '22:00',
        location: 'Templo · escenario',
        frequency: 'WEEKLY',
        expectedAttendees: 12,
        isPublic: false,
        notes: 'Repasar tres canciones nuevas.',
        color: '#8ab0d9',
    },
    {
        title: 'Célula de Jóvenes "Renuevo"',
        description: 'Encuentro semanal de jóvenes adultos.',
        typeCode: 'TIP-CELULA',
        sectorCode: 'SEC-007',
        supervisorCode: 'MIE-0007',
        coSupervisorCodes: ['MIE-0014'],
        date: '2026-08-22',
        startTime: '19:00',
        endTime: '21:00',
        location: 'Casa pastoral',
        frequency: 'WEEKLY',
        expectedAttendees: 28,
        isPublic: true,
        notes: '',
        color: '#9bc1bc',
    },
]

function dateOf(iso) {
    return new Date(`${iso}T00:00:00.000Z`)
}

function timeOf(hhmm) {
    const [hours, minutes] = hhmm.split(':').map(Number)
    return new Date(Date.UTC(1970, 0, 1, hours, minutes, 0))
}

export async function seedMeetingTypes(prisma) {
    const types = await prisma.$transaction(
        MEETING_TYPE_SEEDS.map((seed) => {
            const data = {
                code: seed.code,
                name: seed.name,
                description: seed.description ?? null,
                color: seed.color,
                isActive: true,
            }
            return prisma.meetingType.upsert({
                where: { code: seed.code },
                create: data,
                update: data,
            })
        }),
    )

    return new Map(types.map((type) => [type.code, type]))
}

// Devuelve un Map<title, meeting>. Idempotente: usa el título como clave natural
// (Meeting no tiene un unique de negocio), buscando primero y creando si no existe.
export async function seedMeetings(prisma, types, sectors, members) {
    const result = new Map()

    for (const seed of MEETING_SEEDS) {
        const type = types.get(seed.typeCode)
        if (!type) throw new Error(`Seed meeting type not found: ${seed.typeCode}`)
        const sector = sectors.get(seed.sectorCode)
        if (!sector) throw new Error(`Seed sector not found: ${seed.sectorCode}`)
        const supervisor = members.get(seed.supervisorCode)
        if (!supervisor) throw new Error(`Seed supervisor member not found: ${seed.supervisorCode}`)

        const baseData = {
            typeId: type.id,
            sectorId: sector.id,
            leaderId: supervisor.id,
            supervisorId: supervisor.id,
            title: seed.title,
            description: seed.description ?? null,
            date: dateOf(seed.date),
            startTime: timeOf(seed.startTime),
            endTime: timeOf(seed.endTime),
            location: seed.location,
            frequency: seed.frequency,
            expectedAttendees: seed.expectedAttendees,
            isActive: seed.isActive ?? true,
            isPublic: seed.isPublic,
            notes: seed.notes || null,
            color: seed.color,
        }

        const existing = await prisma.meeting.findFirst({ where: { title: seed.title } })

        let meeting
        if (existing) {
            meeting = await prisma.meeting.update({ where: { id: existing.id }, data: baseData })
        } else {
            // El código necesita el id, que aún no existe: se crea con un valor
            // temporal irrepetible y se reemplaza enseguida, igual que hace la API.
            const coSupervisorIds = seed.coSupervisorCodes
                .map((code) => members.get(code))
                .filter(Boolean)
                .map((member) => ({ memberId: member.id }))

            meeting = await prisma.meeting.create({
                data: {
                    ...baseData,
                    code: `TMP-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
                    ...(coSupervisorIds.length
                        ? { coSupervisors: { create: coSupervisorIds } }
                        : {}),
                },
            })
        }

        // Mismo formato que server/utils/code/entity-code.util.ts.
        const code = `${sector.code.toUpperCase().replace(/[^A-Z0-9]/g, '')}-REU${String(
            meeting.id,
        ).padStart(4, '0')}-${seed.date.replace(/-/g, '')}`

        if (meeting.code !== code) {
            meeting = await prisma.meeting.update({ where: { id: meeting.id }, data: { code } })
        }

        result.set(seed.title, meeting)
    }

    return result
}
