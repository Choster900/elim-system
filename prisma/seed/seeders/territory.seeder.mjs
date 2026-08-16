// Datos de prueba de la jerarquía territorial: distritos -> zonas -> sectores.
// Los polígonos son arreglos de pares [lat, lng] (formato usado por el mapa en
// app/presentation/territories). Las coordenadas se ubican en el área metropolitana
// de San Salvador, El Salvador.
//
// `leaderCode` referencia el `code` de un miembro sembrado (ver member.seeder.mjs).

export const DISTRICT_SEEDS = [
    {
        code: 'DIS-001',
        name: 'Distrito Norte',
        description: 'Cobertura de los municipios al norte del área metropolitana.',
        color: '#2563eb',
        leaderCode: 'MIE-0001',
        polygon: [
            [13.75, -89.24],
            [13.75, -89.18],
            [13.7, -89.18],
            [13.7, -89.24],
        ],
    },
    {
        code: 'DIS-002',
        name: 'Distrito Sur',
        description: 'Cobertura de los municipios al sur y poniente del área metropolitana.',
        color: '#16a34a',
        leaderCode: 'MIE-0009',
        polygon: [
            [13.7, -89.24],
            [13.7, -89.18],
            [13.65, -89.18],
            [13.65, -89.24],
        ],
    },
]

export const ZONE_SEEDS = [
    {
        code: 'ZON-001',
        districtCode: 'DIS-001',
        name: 'Zona Noroeste',
        description: 'Mejicanos y Cuscatancingo.',
        color: '#3b82f6',
        leaderCode: 'MIE-0002',
        polygon: [
            [13.75, -89.24],
            [13.75, -89.21],
            [13.725, -89.21],
            [13.725, -89.24],
        ],
    },
    {
        code: 'ZON-002',
        districtCode: 'DIS-001',
        name: 'Zona Noreste',
        description: 'Ciudad Delgado y Apopa.',
        color: '#6366f1',
        leaderCode: 'MIE-0006',
        polygon: [
            [13.75, -89.21],
            [13.75, -89.18],
            [13.725, -89.18],
            [13.725, -89.21],
        ],
    },
    {
        code: 'ZON-003',
        districtCode: 'DIS-002',
        name: 'Zona Suroeste',
        description: 'Santa Tecla y Antiguo Cuscatlán.',
        color: '#22c55e',
        leaderCode: 'MIE-0005',
        polygon: [
            [13.7, -89.24],
            [13.7, -89.21],
            [13.675, -89.21],
            [13.675, -89.24],
        ],
    },
    {
        code: 'ZON-004',
        districtCode: 'DIS-002',
        name: 'Zona Sureste',
        description: 'San Marcos e Ilopango.',
        color: '#14b8a6',
        leaderCode: 'MIE-0008',
        polygon: [
            [13.7, -89.21],
            [13.7, -89.18],
            [13.675, -89.18],
            [13.675, -89.21],
        ],
    },
]

export const SECTOR_SEEDS = [
    {
        code: 'SEC-001',
        zoneCode: 'ZON-001',
        name: 'Sector Las Palmeras',
        description: 'Colonias del sector norte de Mejicanos.',
        color: '#60a5fa',
        leaderCode: 'MIE-0002',
        polygon: [
            [13.75, -89.24],
            [13.75, -89.225],
            [13.7375, -89.225],
            [13.7375, -89.24],
        ],
    },
    {
        code: 'SEC-002',
        zoneCode: 'ZON-001',
        name: 'Sector El Progreso',
        description: 'Colonias del sector sur de Mejicanos.',
        color: '#93c5fd',
        leaderCode: 'MIE-0010',
        polygon: [
            [13.7375, -89.24],
            [13.7375, -89.225],
            [13.725, -89.225],
            [13.725, -89.24],
        ],
    },
    {
        code: 'SEC-003',
        zoneCode: 'ZON-002',
        name: 'Sector San Antonio',
        description: 'Zona central de Ciudad Delgado.',
        color: '#818cf8',
        leaderCode: 'MIE-0006',
        polygon: [
            [13.75, -89.21],
            [13.75, -89.195],
            [13.7375, -89.195],
            [13.7375, -89.21],
        ],
    },
    {
        code: 'SEC-004',
        zoneCode: 'ZON-002',
        name: 'Sector Los Ángeles',
        description: 'Zona periférica hacia Apopa.',
        color: '#a5b4fc',
        leaderCode: 'MIE-0007',
        polygon: [
            [13.7375, -89.21],
            [13.7375, -89.195],
            [13.725, -89.195],
            [13.725, -89.21],
        ],
    },
    {
        code: 'SEC-005',
        zoneCode: 'ZON-003',
        name: 'Sector El Cafetalón',
        description: 'Zona central de Santa Tecla.',
        color: '#4ade80',
        leaderCode: 'MIE-0005',
        polygon: [
            [13.7, -89.24],
            [13.7, -89.225],
            [13.6875, -89.225],
            [13.6875, -89.24],
        ],
    },
    {
        code: 'SEC-006',
        zoneCode: 'ZON-003',
        name: 'Sector La Sabana',
        description: 'Zona hacia Antiguo Cuscatlán.',
        color: '#86efac',
        leaderCode: 'MIE-0015',
        polygon: [
            [13.6875, -89.24],
            [13.6875, -89.225],
            [13.675, -89.225],
            [13.675, -89.24],
        ],
    },
    {
        code: 'SEC-007',
        zoneCode: 'ZON-004',
        name: 'Sector San Marcos Centro',
        description: 'Casco urbano de San Marcos.',
        color: '#2dd4bf',
        leaderCode: 'MIE-0008',
        polygon: [
            [13.7, -89.21],
            [13.7, -89.195],
            [13.6875, -89.195],
            [13.6875, -89.21],
        ],
    },
    {
        code: 'SEC-008',
        zoneCode: 'ZON-004',
        name: 'Sector Altavista',
        description: 'Comunidad Altavista, Ilopango.',
        color: '#5eead4',
        leaderCode: 'MIE-0014',
        polygon: [
            [13.6875, -89.21],
            [13.6875, -89.195],
            [13.675, -89.195],
            [13.675, -89.21],
        ],
    },
]

function resolveLeader(members, leaderCode) {
    if (!leaderCode) return { leaderId: null, leaderName: null }
    const leader = members.get(leaderCode)
    if (!leader) throw new Error(`Seed leader member not found: ${leaderCode}`)
    const leaderName = [leader.firstName, leader.lastName].filter(Boolean).join(' ')
    return { leaderId: leader.id, leaderName }
}

export async function seedDistricts(prisma, members) {
    const districts = await prisma.$transaction(
        DISTRICT_SEEDS.map((seed) => {
            const { leaderId, leaderName } = resolveLeader(members, seed.leaderCode)
            const data = {
                code: seed.code,
                name: seed.name,
                description: seed.description ?? null,
                color: seed.color,
                polygon: seed.polygon,
                leaderId,
                leaderName,
                isActive: true,
            }
            return prisma.district.upsert({
                where: { code: seed.code },
                create: data,
                update: data,
            })
        }),
    )

    return new Map(districts.map((district) => [district.code, district]))
}

export async function seedZones(prisma, districts, members) {
    const zones = await prisma.$transaction(
        ZONE_SEEDS.map((seed) => {
            const district = districts.get(seed.districtCode)
            if (!district) throw new Error(`Seed district not found: ${seed.districtCode}`)
            const { leaderId, leaderName } = resolveLeader(members, seed.leaderCode)
            const data = {
                districtId: district.id,
                code: seed.code,
                name: seed.name,
                description: seed.description ?? null,
                color: seed.color,
                polygon: seed.polygon,
                leaderId,
                leaderName,
                isActive: true,
            }
            return prisma.zone.upsert({
                where: { code: seed.code },
                create: data,
                update: data,
            })
        }),
    )

    return new Map(zones.map((zone) => [zone.code, zone]))
}

export async function seedSectors(prisma, zones, members) {
    const sectors = await prisma.$transaction(
        SECTOR_SEEDS.map((seed) => {
            const zone = zones.get(seed.zoneCode)
            if (!zone) throw new Error(`Seed zone not found: ${seed.zoneCode}`)
            const { leaderId, leaderName } = resolveLeader(members, seed.leaderCode)
            const data = {
                zoneId: zone.id,
                code: seed.code,
                name: seed.name,
                description: seed.description ?? null,
                color: seed.color,
                polygon: seed.polygon,
                leaderId,
                leaderName,
                isActive: true,
            }
            return prisma.territorySector.upsert({
                where: { code: seed.code },
                create: data,
                update: data,
            })
        }),
    )

    return new Map(sectors.map((sector) => [sector.code, sector]))
}

export async function seedTerritories(prisma, members) {
    const districts = await seedDistricts(prisma, members)
    const zones = await seedZones(prisma, districts, members)
    const sectors = await seedSectors(prisma, zones, members)
    return { districts, zones, sectors }
}
