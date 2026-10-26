import type { TitheMember } from '../interfaces/tithe.interface'

export function memberMeta(member: TitheMember) {
    const place = [member.sectorName, member.zoneName].filter(Boolean).join(', ')
    return [member.code, member.documentNumber ? `DUI ${member.documentNumber}` : null, place]
        .filter(Boolean)
        .join(' · ')
}

export function timeLabel(value: string) {
    return new Date(value).toLocaleTimeString('es-SV', { hour: 'numeric', minute: '2-digit' })
}

export function localIsoDate(date = new Date()) {
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    return `${date.getFullYear()}-${month}-${day}`
}
