export type LatLng = [number, number]
export type Polygon = LatLng[]

export interface MockDistrict {
    id: string
    name: string
    code: string
    description: string
    leaderName: string
    color: string
    polygon: Polygon
    createdAt: string
}

export interface MockZone {
    id: string
    districtId: string
    name: string
    code: string
    description: string
    leaderName: string
    color: string
    polygon: Polygon
    createdAt: string
}

export interface MockTerritorySector {
    id: string
    zoneId: string
    name: string
    code: string
    description: string
    leaderName: string
    color: string
    polygon: Polygon
    createdAt: string
}

const NOW = '2026-01-01T00:00:00.000Z'

export const districtPalette = ['#e9c176', '#9bc1bc', '#d39a9a', '#a3b18a', '#b4a7d6', '#f4a261', '#8ab0d9']
export const zonePalette = ['#f4a261', '#9bc1bc', '#d39a9a', '#b4a7d6', '#8ab0d9']
export const sectorPalette = ['#e9c176', '#a3b18a', '#9bc1bc', '#d39a9a', '#f4a261']

export const mockDistricts: MockDistrict[] = [
    {
        id: 'dist-metro',
        name: 'Distrito Metropolitano',
        code: 'DM',
        description: 'Área metropolitana de San Salvador. Concentra la mayor parte de la membresía y los ministerios centrales.',
        leaderName: 'Pastor Daniel Hernández',
        color: '#e9c176',
        polygon: [
            [13.78, -89.30],
            [13.78, -89.15],
            [13.65, -89.15],
            [13.65, -89.30],
        ],
        createdAt: NOW,
    },
    {
        id: 'dist-occidental',
        name: 'Distrito Occidental',
        code: 'DO',
        description: 'Cubre Santa Ana, Sonsonate y zonas aledañas del occidente del país.',
        leaderName: 'Pastor Roberto Quintanilla',
        color: '#9bc1bc',
        polygon: [
            [13.95, -89.70],
            [13.95, -89.50],
            [13.78, -89.50],
            [13.78, -89.70],
        ],
        createdAt: NOW,
    },
]

export const mockZones: MockZone[] = [
    {
        id: 'zone-metro-norte',
        districtId: 'dist-metro',
        name: 'Zona Norte',
        code: 'ZMN',
        description: 'Mejicanos, Apopa y aledaños.',
        leaderName: 'Lucía Ramírez',
        color: '#f4a261',
        polygon: [
            [13.78, -89.25],
            [13.78, -89.18],
            [13.74, -89.18],
            [13.74, -89.25],
        ],
        createdAt: NOW,
    },
    {
        id: 'zone-metro-centro',
        districtId: 'dist-metro',
        name: 'Zona Centro',
        code: 'ZMC',
        description: 'San Salvador centro histórico y colonias circundantes.',
        leaderName: 'María González',
        color: '#9bc1bc',
        polygon: [
            [13.74, -89.25],
            [13.74, -89.18],
            [13.70, -89.18],
            [13.70, -89.25],
        ],
        createdAt: NOW,
    },
    {
        id: 'zone-metro-sur',
        districtId: 'dist-metro',
        name: 'Zona Sur',
        code: 'ZMS',
        description: 'Soyapango sur, San Marcos, Santo Tomás.',
        leaderName: 'Esteban Cruz',
        color: '#d39a9a',
        polygon: [
            [13.70, -89.25],
            [13.70, -89.18],
            [13.65, -89.18],
            [13.65, -89.25],
        ],
        createdAt: NOW,
    },
    {
        id: 'zone-occidental-santa-ana',
        districtId: 'dist-occidental',
        name: 'Zona Santa Ana',
        code: 'ZOSA',
        description: 'Casco urbano de Santa Ana y municipios cercanos.',
        leaderName: 'Andrea Martínez',
        color: '#b4a7d6',
        polygon: [
            [13.95, -89.65],
            [13.95, -89.55],
            [13.86, -89.55],
            [13.86, -89.65],
        ],
        createdAt: NOW,
    },
    {
        id: 'zone-occidental-sonsonate',
        districtId: 'dist-occidental',
        name: 'Zona Sonsonate',
        code: 'ZOSO',
        description: 'Sonsonate y costa occidental.',
        leaderName: 'Patricia Fuentes',
        color: '#8ab0d9',
        polygon: [
            [13.86, -89.70],
            [13.86, -89.55],
            [13.78, -89.55],
            [13.78, -89.70],
        ],
        createdAt: NOW,
    },
]

export const mockTerritorySectors: MockTerritorySector[] = [
    {
        id: 'sec-norte',
        zoneId: 'zone-metro-norte',
        name: 'Sector Norte',
        code: 'N',
        description: 'Mejicanos.',
        leaderName: 'Carlos Pérez',
        color: '#e9c176',
        polygon: [
            [13.78, -89.24],
            [13.78, -89.21],
            [13.76, -89.21],
            [13.76, -89.24],
        ],
        createdAt: NOW,
    },
    {
        id: 'sec-centro',
        zoneId: 'zone-metro-centro',
        name: 'Sector Centro',
        code: 'C',
        description: 'San Salvador centro.',
        leaderName: 'María González',
        color: '#a3b18a',
        polygon: [
            [13.735, -89.225],
            [13.735, -89.205],
            [13.715, -89.205],
            [13.715, -89.225],
        ],
        createdAt: NOW,
    },
    {
        id: 'sec-este',
        zoneId: 'zone-metro-centro',
        name: 'Sector Este',
        code: 'E',
        description: 'Soyapango y aledaños.',
        leaderName: 'Esteban Cruz',
        color: '#9bc1bc',
        polygon: [
            [13.735, -89.205],
            [13.735, -89.185],
            [13.715, -89.185],
            [13.715, -89.205],
        ],
        createdAt: NOW,
    },
    {
        id: 'sec-oeste',
        zoneId: 'zone-metro-centro',
        name: 'Sector Oeste',
        code: 'O',
        description: 'Santa Tecla y colonia escalón oeste.',
        leaderName: 'Roberto Quintanilla',
        color: '#d39a9a',
        polygon: [
            [13.735, -89.245],
            [13.735, -89.225],
            [13.715, -89.225],
            [13.715, -89.245],
        ],
        createdAt: NOW,
    },
    {
        id: 'sec-sur',
        zoneId: 'zone-metro-sur',
        name: 'Sector Sur',
        code: 'S',
        description: 'San Marcos y Santo Tomás.',
        leaderName: 'Lucía Ramírez',
        color: '#f4a261',
        polygon: [
            [13.69, -89.23],
            [13.69, -89.20],
            [13.66, -89.20],
            [13.66, -89.23],
        ],
        createdAt: NOW,
    },
    {
        id: 'sec-santa-ana-c',
        zoneId: 'zone-occidental-santa-ana',
        name: 'Santa Ana Centro',
        code: 'SAC',
        description: 'Catedral y centro histórico de Santa Ana.',
        leaderName: 'Andrea Martínez',
        color: '#b4a7d6',
        polygon: [
            [13.94, -89.62],
            [13.94, -89.58],
            [13.90, -89.58],
            [13.90, -89.62],
        ],
        createdAt: NOW,
    },
    {
        id: 'sec-sonsonate',
        zoneId: 'zone-occidental-sonsonate',
        name: 'Sonsonate Centro',
        code: 'SOC',
        description: 'Sonsonate urbano.',
        leaderName: 'Patricia Fuentes',
        color: '#8ab0d9',
        polygon: [
            [13.85, -89.68],
            [13.85, -89.60],
            [13.80, -89.60],
            [13.80, -89.68],
        ],
        createdAt: NOW,
    },
]

export const ELSALVADOR_CENTER: LatLng = [13.80, -89.40]
export const DEFAULT_MAP_ZOOM = 9
