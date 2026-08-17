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

type SectorBaseDto = Omit<TerritoryBaseDto, 'code' | 'leaderName'>

export interface CreateSectorDto extends SectorBaseDto {
    zoneId: number
    supervisorId: number
}

export interface UpdateSectorDto extends Partial<SectorBaseDto> {
    zoneId?: number
    supervisorId?: number
}
