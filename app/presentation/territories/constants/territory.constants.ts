import type { LatLng } from '../interfaces/territory.interface'

export const EL_SALVADOR_CENTER: LatLng = [13.8, -89.4]

const EXTENDED_TERRITORY_COLORS = [
    '#e07a5f',
    '#81b29a',
    '#f2cc8f',
    '#6d9dc5',
    '#c9a0dc',
    '#e8a0bf',
    '#7fb7be',
    '#c2a878',
    '#9c89b8',
    '#b5c99a',
]

function withExtendedColors(base: string[]) {
    return [...new Set([...base, ...EXTENDED_TERRITORY_COLORS])]
}

export const districtPalette = withExtendedColors([
    '#e9c176',
    '#9bc1bc',
    '#d39a9a',
    '#a3b18a',
    '#b4a7d6',
    '#f4a261',
    '#8ab0d9',
])

export const zonePalette = withExtendedColors([
    '#f4a261',
    '#9bc1bc',
    '#d39a9a',
    '#b4a7d6',
    '#8ab0d9',
])

export const sectorPalette = withExtendedColors([
    '#e9c176',
    '#a3b18a',
    '#9bc1bc',
    '#d39a9a',
    '#f4a261',
])

export const territoryColorCatalog = withExtendedColors([...districtPalette, ...zonePalette])
