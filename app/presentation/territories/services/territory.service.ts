import type { AxiosInstance } from 'axios'
import type { ApiResponse } from '~/presentation/shared/interfaces/api-response.interface'
import type {
    District,
    Polygon,
    TerritoryEntity,
    TerritoryHierarchy,
    TerritoryInput,
    TerritoryLevel,
    TerritorySector,
    Zone,
} from '../interfaces/territory.interface'

interface TerritoryApiEntity {
    id: number
    name: string
    code: string
    description: string | null
    leaderName: string | null
    color: string
    polygon: unknown
    isActive: boolean
    createdAt: string
    updatedAt: string
}

type DistrictApiEntity = TerritoryApiEntity

interface ZoneApiEntity extends TerritoryApiEntity {
    districtId: number
}

interface SectorApiEntity extends TerritoryApiEntity {
    zoneId: number
}

interface TerritoryHierarchyApiResponse {
    districts: DistrictApiEntity[]
    zones: ZoneApiEntity[]
    sectors: SectorApiEntity[]
}

function normalizePolygon(value: unknown): Polygon {
    if (!Array.isArray(value)) return []

    return value.flatMap((point) => {
        if (
            !Array.isArray(point) ||
            point.length !== 2 ||
            typeof point[0] !== 'number' ||
            typeof point[1] !== 'number'
        ) {
            return []
        }
        return [[point[0], point[1]]]
    })
}

function mapEntity(entity: TerritoryApiEntity): TerritoryEntity {
    return {
        ...entity,
        id: String(entity.id),
        description: entity.description ?? '',
        leaderName: entity.leaderName ?? '',
        polygon: normalizePolygon(entity.polygon),
    }
}

function responseData<T>(response: ApiResponse<T>, fallbackMessage: string): T {
    if (!response.success || !response.data) {
        throw new Error(response.error?.details || response.message || fallbackMessage)
    }
    return response.data
}

export async function getTerritoryHierarchy(apiClient: AxiosInstance): Promise<TerritoryHierarchy> {
    const response = await apiClient.get<ApiResponse<TerritoryHierarchyApiResponse>>('/territories')
    const data = responseData(response.data, 'No fue posible cargar la jerarquía territorial')

    return {
        districts: data.districts.map((district): District => mapEntity(district)),
        zones: data.zones.map(
            (zone): Zone => ({
                ...mapEntity(zone),
                districtId: String(zone.districtId),
            }),
        ),
        sectors: data.sectors.map(
            (sector): TerritorySector => ({
                ...mapEntity(sector),
                zoneId: String(sector.zoneId),
            }),
        ),
    }
}

function endpointFor(level: TerritoryLevel) {
    if (level === 'distrito') return 'districts'
    if (level === 'zona') return 'zones'
    return 'sectors'
}

function requestPayload(level: TerritoryLevel, input: TerritoryInput, parentId?: string | null) {
    const payload: Record<string, unknown> = {
        ...input,
        leaderName: input.leaderName || null,
        description: input.description || null,
    }

    if (level === 'zona') payload.districtId = Number(parentId)
    if (level === 'sector') payload.zoneId = Number(parentId)
    return payload
}

export async function createTerritoryEntity(
    apiClient: AxiosInstance,
    level: TerritoryLevel,
    input: TerritoryInput,
    parentId?: string | null,
) {
    const endpoint = endpointFor(level)
    const response = await apiClient.post<ApiResponse<TerritoryApiEntity>>(
        `/territories/${endpoint}`,
        requestPayload(level, input, parentId),
    )
    return mapEntity(responseData(response.data, 'No fue posible crear el registro'))
}

export async function updateTerritoryEntity(
    apiClient: AxiosInstance,
    level: TerritoryLevel,
    id: string,
    input: Partial<TerritoryInput> & { parentId?: string },
) {
    const endpoint = endpointFor(level)
    const { parentId, ...fields } = input
    const payload: Record<string, unknown> = { ...fields }
    if (level === 'zona' && parentId) payload.districtId = Number(parentId)
    if (level === 'sector' && parentId) payload.zoneId = Number(parentId)

    const response = await apiClient.put<ApiResponse<TerritoryApiEntity>>(
        `/territories/${endpoint}/${id}`,
        payload,
    )
    return mapEntity(responseData(response.data, 'No fue posible actualizar el registro'))
}

export async function deleteTerritoryEntity(
    apiClient: AxiosInstance,
    level: TerritoryLevel,
    id: string,
) {
    const endpoint = endpointFor(level)
    await apiClient.delete(`/territories/${endpoint}/${id}`)
}
