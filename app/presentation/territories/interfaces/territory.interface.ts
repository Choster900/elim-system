export type LatLng = [number, number]
export type Polygon = LatLng[]
export type TerritoryLevel = 'distrito' | 'zona' | 'sector'

export interface TerritoryEntity {
    id: string
    name: string
    code: string
    description: string
    leaderName: string
    color: string
    polygon: Polygon
    isActive: boolean
    createdAt: string
    updatedAt: string
}

export type District = TerritoryEntity

export interface Zone extends TerritoryEntity {
    districtId: string
}

export interface TerritorySector extends TerritoryEntity {
    zoneId: string
}

export interface TerritoryHierarchy {
    districts: District[]
    zones: Zone[]
    sectors: TerritorySector[]
}

export interface TerritoryInput {
    name: string
    code: string
    leaderName: string
    description: string
    color: string
    polygon: Polygon
    isActive: boolean
}
