export type TerritoryPointDto = [number, number]
export type TerritoryPolygonDto = TerritoryPointDto[]

export interface TerritoryBaseDto {
    name: string
    code: string
    leaderName: string | null
    description: string | null
    color: string
    polygon: TerritoryPolygonDto
    isActive: boolean
}

export type CreateDistrictDto = TerritoryBaseDto
export type UpdateDistrictDto = Partial<TerritoryBaseDto>

export interface CreateZoneDto extends TerritoryBaseDto {
    districtId: number
}

export type UpdateZoneDto = Partial<CreateZoneDto>

export interface CreateSectorDto extends TerritoryBaseDto {
    zoneId: number
}

export type UpdateSectorDto = Partial<CreateSectorDto>
