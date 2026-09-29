export type MapProviderName = 'carto-dark' | 'carto-light' | 'openstreetmap' | 'custom'

export interface MapProviderConfig {
    name: MapProviderName
    tileUrl: string
    attribution: string
    maxZoom: number
    subdomains?: string
}

export type MapCoordinate = [latitude: number, longitude: number]
