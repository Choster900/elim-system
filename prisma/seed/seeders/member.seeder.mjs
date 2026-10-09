const COMMUNITY_ROLE_SEEDS = [
    ['MEMBER', 'Miembro', 'Persona que forma parte de la comunidad.'],
    ['PASTOR', 'Pastor', 'Responsable pastoral de la comunidad.'],
    ['LEADER', 'Líder', 'Miembro autorizado para conducir reuniones.'],
    ['COORDINATOR', 'Coordinador', 'Miembro responsable de coordinar una zona.'],
    ['HOST', 'Anfitrión', 'Miembro que recibe reuniones en su hogar o local.'],
    [
        'SUPERVISOR',
        'Supervisor',
        'Miembro responsable de supervisar todas las reuniones de un sector.',
    ],
    ['DEACON', 'Diácono', 'Miembro que sirve en funciones de diaconado.'],
    ['VOLUNTEER', 'Voluntario', 'Miembro que apoya actividades de servicio.'],
    ['TEACHER', 'Maestro', 'Miembro responsable de enseñanza.'],
    ['WORSHIP', 'Alabanza', 'Miembro que sirve en el equipo de alabanza.'],
    ['YOUTH_LEADER', 'Líder de jóvenes', 'Responsable del acompañamiento juvenil.'],
    ['CHILDREN_LEADER', 'Líder infantil', 'Responsable del ministerio infantil.'],
    ['ELDER', 'Anciano', 'Miembro que apoya el cuidado espiritual de la comunidad.'],
    ['SUPPORT_COMMITTEE', 'Comité de apoyo', 'Miembro que sirve en el comité de apoyo.'],
    ['ASSOCIATE_PASTOR', 'Pastor asociado', 'Pastor que colabora en el cuidado de la comunidad.'],
    ['EVANGELIST', 'Evangelista', 'Miembro dedicado a compartir el evangelio.'],
    ['MISSIONARY', 'Misionero', 'Miembro enviado o dedicado al trabajo misionero.'],
    ['WORSHIP_LEADER', 'Líder de alabanza', 'Responsable de coordinar el equipo de alabanza.'],
    [
        'SMALL_GROUP_LEADER',
        'Líder de célula',
        'Responsable de acompañar una célula o grupo pequeño.',
    ],
    ['DISCIPLESHIP_LEADER', 'Discipulador', 'Miembro que acompaña procesos de discipulado.'],
    ['INTERCESSOR', 'Intercesor', 'Miembro que sirve en el ministerio de intercesión.'],
    ['COUNSELOR', 'Consejero', 'Miembro que brinda consejería y acompañamiento.'],
    ['USHER', 'Ujier', 'Miembro que orienta y recibe durante las reuniones.'],
    ['HOSPITALITY', 'Hospitalidad', 'Miembro que sirve en la atención y bienvenida.'],
    ['MEDIA_TECHNICIAN', 'Multimedia', 'Miembro que apoya proyección, transmisión y medios.'],
    ['SOUND_TECHNICIAN', 'Sonido', 'Miembro que apoya la operación de audio.'],
    ['MISSIONS_LEADER', 'Líder de misiones', 'Responsable de coordinar iniciativas misioneras.'],
    [
        'EVANGELISM_LEADER',
        'Líder de evangelismo',
        'Responsable de coordinar iniciativas evangelísticas.',
    ],
    ['TREASURER', 'Tesorero', 'Miembro que apoya la gestión financiera de la comunidad.'],
    ['SECRETARY', 'Secretario', 'Miembro que apoya la gestión documental y administrativa.'],
    ['ADMINISTRATOR', 'Administrador', 'Miembro que apoya la administración de la comunidad.'],
    ['AUDITOR', 'Auditor', 'Miembro que apoya la revisión y transparencia administrativa.'],
].map(([code, name, description]) => ({
    code,
    name,
    description,
    isActive: true,
    isSystem: true,
}))

const MINISTRY_SEEDS = [
    ['ALABANZA', 'Alabanza'],
    ['JOVENES', 'Jóvenes'],
    ['NINEZ', 'Niñez'],
    ['HOSPITALIDAD', 'Hospitalidad'],
    ['INTERCESION', 'Intercesión'],
    ['MISIONES', 'Misiones'],
    ['EVANGELISMO', 'Evangelismo'],
    ['DIACONADO', 'Diaconado'],
].map(([code, name]) => ({
    code,
    name,
    description: `Ministerio de ${name.toLowerCase()}.`,
    isActive: true,
}))

const COMMUNITY_LEADER_CODES = new Set([
    'MIE-0001',
    'MIE-0002',
    'MIE-0005',
    'MIE-0006',
    'MIE-0007',
    'MIE-0008',
    'MIE-0009',
    'MIE-0010',
    'MIE-0014',
    'MIE-0015',
])

const COMMUNITY_SUPERVISOR_CODES = new Set([
    'MIE-0002',
    'MIE-0005',
    'MIE-0006',
    'MIE-0007',
    'MIE-0008',
    'MIE-0010',
    'MIE-0014',
    'MIE-0015',
])

const COMMUNITY_COORDINATOR_CODES = new Set(['MIE-0002', 'MIE-0005', 'MIE-0006', 'MIE-0008'])

const COMMUNITY_PASTOR_CODES = new Set(['MIE-0001', 'MIE-0009'])

export const MEMBER_SEEDS = [
    {
        code: 'MIE-0001',
        firstName: 'Carlos',
        middleName: 'Alberto',
        lastName: 'Martínez',
        secondLastName: 'Rivas',
        gender: 'MALE',
        maritalStatus: 'MARRIED',
        phone: '+503 7000-0001',
        email: 'carlos.martinez@example.com',
        birthDate: '1982-03-14',
        joinedAt: '2015-01-10',
        conversionDate: '2010-05-02',
        baptismDate: '2010-12-12',
        status: 'ACTIVE',
        department: 'San Salvador',
        municipality: 'San Salvador',
        occupation: 'Ingeniero',
    },
    {
        code: 'MIE-0002',
        firstName: 'María',
        middleName: 'José',
        lastName: 'González',
        secondLastName: 'Portillo',
        gender: 'FEMALE',
        maritalStatus: 'MARRIED',
        phone: '+503 7000-0002',
        email: 'maria.gonzalez@example.com',
        birthDate: '1985-07-22',
        joinedAt: '2016-03-05',
        status: 'ACTIVE',
        department: 'San Salvador',
        municipality: 'Mejicanos',
        occupation: 'Docente',
    },
    {
        code: 'MIE-0003',
        firstName: 'José',
        lastName: 'Hernández',
        secondLastName: 'Cruz',
        gender: 'MALE',
        maritalStatus: 'SINGLE',
        phone: '+503 7000-0003',
        email: 'jose.hernandez@example.com',
        birthDate: '1990-11-03',
        joinedAt: '2018-06-17',
        status: 'ACTIVE',
        department: 'San Salvador',
        municipality: 'Soyapango',
        occupation: 'Contador',
    },
    {
        code: 'MIE-0004',
        firstName: 'Ana',
        middleName: 'Lucía',
        lastName: 'Ramírez',
        gender: 'FEMALE',
        maritalStatus: 'SINGLE',
        phone: '+503 7000-0004',
        email: 'ana.ramirez@example.com',
        birthDate: '1995-01-28',
        joinedAt: '2019-09-01',
        status: 'ACTIVE',
        department: 'San Salvador',
        municipality: 'San Salvador',
        occupation: 'Enfermera',
    },
    {
        code: 'MIE-0005',
        firstName: 'Roberto',
        lastName: 'López',
        secondLastName: 'Menjívar',
        gender: 'MALE',
        maritalStatus: 'MARRIED',
        phone: '+503 7000-0005',
        email: 'roberto.lopez@example.com',
        birthDate: '1978-09-09',
        joinedAt: '2012-02-20',
        status: 'ACTIVE',
        department: 'La Libertad',
        municipality: 'Santa Tecla',
        occupation: 'Comerciante',
    },
    {
        code: 'MIE-0006',
        firstName: 'Sofía',
        middleName: 'Elena',
        lastName: 'Flores',
        secondLastName: 'Guzmán',
        gender: 'FEMALE',
        maritalStatus: 'UNION',
        phone: '+503 7000-0006',
        email: 'sofia.flores@example.com',
        birthDate: '1992-04-16',
        joinedAt: '2017-07-11',
        status: 'ACTIVE',
        department: 'San Salvador',
        municipality: 'Ciudad Delgado',
        occupation: 'Diseñadora',
    },
    {
        code: 'MIE-0007',
        firstName: 'Luis',
        middleName: 'Fernando',
        lastName: 'Díaz',
        gender: 'MALE',
        maritalStatus: 'SINGLE',
        phone: '+503 7000-0007',
        email: 'luis.diaz@example.com',
        birthDate: '1998-12-05',
        joinedAt: '2021-01-15',
        status: 'ACTIVE',
        department: 'San Salvador',
        municipality: 'Apopa',
        occupation: 'Estudiante',
    },
    {
        code: 'MIE-0008',
        firstName: 'Gabriela',
        lastName: 'Vásquez',
        secondLastName: 'Alfaro',
        gender: 'FEMALE',
        maritalStatus: 'MARRIED',
        phone: '+503 7000-0008',
        email: 'gabriela.vasquez@example.com',
        birthDate: '1987-06-30',
        joinedAt: '2014-10-03',
        status: 'ACTIVE',
        department: 'San Salvador',
        municipality: 'San Marcos',
        occupation: 'Administradora',
    },
    {
        code: 'MIE-0009',
        firstName: 'Miguel',
        middleName: 'Ángel',
        lastName: 'Reyes',
        secondLastName: 'Campos',
        gender: 'MALE',
        maritalStatus: 'MARRIED',
        phone: '+503 7000-0009',
        email: 'miguel.reyes@example.com',
        birthDate: '1980-08-19',
        joinedAt: '2013-05-25',
        status: 'ACTIVE',
        department: 'La Libertad',
        municipality: 'Antiguo Cuscatlán',
        occupation: 'Pastor',
    },
    {
        code: 'MIE-0010',
        firstName: 'Patricia',
        middleName: 'del Carmen',
        lastName: 'Mejía',
        gender: 'FEMALE',
        maritalStatus: 'WIDOWED',
        phone: '+503 7000-0010',
        email: 'patricia.mejia@example.com',
        birthDate: '1969-02-11',
        joinedAt: '2009-04-19',
        status: 'ACTIVE',
        department: 'San Salvador',
        municipality: 'Cuscatancingo',
        occupation: 'Jubilada',
    },
    {
        code: 'MIE-0011',
        firstName: 'Daniel',
        lastName: 'Castro',
        secondLastName: 'Molina',
        gender: 'MALE',
        maritalStatus: 'SINGLE',
        phone: '+503 7000-0011',
        email: 'daniel.castro@example.com',
        birthDate: '2000-10-27',
        joinedAt: '2022-08-07',
        status: 'VISITOR',
        department: 'San Salvador',
        municipality: 'Ilopango',
        occupation: 'Técnico',
    },
    {
        code: 'MIE-0012',
        firstName: 'Andrea',
        middleName: 'Beatriz',
        lastName: 'Guevara',
        secondLastName: 'Solís',
        gender: 'FEMALE',
        maritalStatus: 'SINGLE',
        phone: '+503 7000-0012',
        email: 'andrea.guevara@example.com',
        birthDate: '1996-05-08',
        joinedAt: '2020-11-22',
        status: 'ACTIVE',
        department: 'San Salvador',
        municipality: 'San Salvador',
        occupation: 'Abogada',
    },
    {
        code: 'MIE-0013',
        firstName: 'Óscar',
        lastName: 'Mendoza',
        secondLastName: 'Argueta',
        gender: 'MALE',
        maritalStatus: 'DIVORCED',
        phone: '+503 7000-0013',
        email: 'oscar.mendoza@example.com',
        birthDate: '1975-01-17',
        joinedAt: '2011-03-30',
        status: 'INACTIVE',
        department: 'Cuscatlán',
        municipality: 'Cojutepeque',
        occupation: 'Mecánico',
    },
    {
        code: 'MIE-0014',
        firstName: 'Karla',
        middleName: 'Yamileth',
        lastName: 'Cortez',
        gender: 'FEMALE',
        maritalStatus: 'MARRIED',
        phone: '+503 7000-0014',
        email: 'karla.cortez@example.com',
        birthDate: '1989-09-14',
        joinedAt: '2016-12-04',
        status: 'ACTIVE',
        department: 'San Salvador',
        municipality: 'Tonacatepeque',
        occupation: 'Psicóloga',
    },
    {
        code: 'MIE-0015',
        firstName: 'Fernando',
        middleName: 'Antonio',
        lastName: 'Rivas',
        secondLastName: 'Peña',
        gender: 'MALE',
        maritalStatus: 'MARRIED',
        phone: '+503 7000-0015',
        email: 'fernando.rivas@example.com',
        birthDate: '1983-11-25',
        joinedAt: '2015-08-16',
        status: 'ACTIVE',
        department: 'La Libertad',
        municipality: 'Santa Tecla',
        occupation: 'Arquitecto',
    },
]

function toDate(value) {
    return value ? new Date(`${value}T00:00:00.000Z`) : null
}

function buildMemberData(seed) {
    return {
        code: seed.code,
        firstName: seed.firstName,
        middleName: seed.middleName ?? null,
        lastName: seed.lastName,
        secondLastName: seed.secondLastName ?? null,
        gender: seed.gender,
        maritalStatus: seed.maritalStatus ?? 'UNSPECIFIED',
        phone: seed.phone ?? null,
        email: seed.email ?? null,
        birthDate: toDate(seed.birthDate),
        joinedAt: toDate(seed.joinedAt),
        conversionDate: toDate(seed.conversionDate),
        baptismDate: toDate(seed.baptismDate),
        status: seed.status ?? 'ACTIVE',
        department: seed.department ?? null,
        municipality: seed.municipality ?? null,
        occupation: seed.occupation ?? null,
    }
}

export async function seedMembers(prisma) {
    const communityRoles = await prisma.$transaction(
        COMMUNITY_ROLE_SEEDS.map((role) =>
            prisma.communityRole.upsert({
                where: { code: role.code },
                create: role,
                update: role,
            }),
        ),
    )
    await prisma.$transaction(
        MINISTRY_SEEDS.map((ministry) =>
            prisma.ministry.upsert({
                where: { code: ministry.code },
                create: ministry,
                update: ministry,
            }),
        ),
    )
    const leaderRole = communityRoles.find((role) => role.code === 'LEADER')
    const coordinatorRole = communityRoles.find((role) => role.code === 'COORDINATOR')
    const supervisorRole = communityRoles.find((role) => role.code === 'SUPERVISOR')
    const pastorRole = communityRoles.find((role) => role.code === 'PASTOR')
    if (!leaderRole || !coordinatorRole || !supervisorRole || !pastorRole) {
        throw new Error('Community role catalog was not created.')
    }

    const members = await prisma.$transaction(
        MEMBER_SEEDS.map((seed) => {
            const data = buildMemberData(seed)
            return prisma.member.upsert({
                where: { code: seed.code },
                create: data,
                update: data,
            })
        }),
    )

    await prisma.$transaction(
        members
            .filter((member) => COMMUNITY_LEADER_CODES.has(member.code))
            .map((member) =>
                prisma.memberCommunityRole.upsert({
                    where: {
                        memberId_roleId: {
                            memberId: member.id,
                            roleId: leaderRole.id,
                        },
                    },
                    create: {
                        memberId: member.id,
                        roleId: leaderRole.id,
                    },
                    update: {
                        endedAt: null,
                    },
                }),
            ),
    )

    await prisma.$transaction(
        members
            .filter((member) => COMMUNITY_COORDINATOR_CODES.has(member.code))
            .map((member) =>
                prisma.memberCommunityRole.upsert({
                    where: {
                        memberId_roleId: {
                            memberId: member.id,
                            roleId: coordinatorRole.id,
                        },
                    },
                    create: {
                        memberId: member.id,
                        roleId: coordinatorRole.id,
                    },
                    update: {
                        endedAt: null,
                    },
                }),
            ),
    )

    await prisma.$transaction(
        members
            .filter((member) => COMMUNITY_PASTOR_CODES.has(member.code))
            .map((member) =>
                prisma.memberCommunityRole.upsert({
                    where: {
                        memberId_roleId: {
                            memberId: member.id,
                            roleId: pastorRole.id,
                        },
                    },
                    create: {
                        memberId: member.id,
                        roleId: pastorRole.id,
                    },
                    update: {
                        endedAt: null,
                    },
                }),
            ),
    )

    await prisma.$transaction(
        members
            .filter((member) => COMMUNITY_SUPERVISOR_CODES.has(member.code))
            .map((member) =>
                prisma.memberCommunityRole.upsert({
                    where: {
                        memberId_roleId: {
                            memberId: member.id,
                            roleId: supervisorRole.id,
                        },
                    },
                    create: {
                        memberId: member.id,
                        roleId: supervisorRole.id,
                    },
                    update: {
                        endedAt: null,
                    },
                }),
            ),
    )

    return new Map(members.map((member) => [member.code, member]))
}
