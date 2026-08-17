import type { MeetingFrequency, MeetingStatus } from '../interfaces/meeting.interface'

export const frequencyOptions: { value: MeetingFrequency; label: string }[] = [
    { value: 'unica', label: 'Única vez' },
    { value: 'diaria', label: 'Todos los días' },
    { value: 'semanal', label: 'Semanal' },
    { value: 'quincenal', label: 'Quincenal' },
    { value: 'mensual', label: 'Mensual' },
]

export const statusOptions: { value: MeetingStatus; label: string }[] = [
    { value: 'programada', label: 'Programada' },
    { value: 'en_curso', label: 'En curso' },
    { value: 'completada', label: 'Completada' },
    { value: 'cancelada', label: 'Cancelada' },
]

export const meetingColorPalette = [
    '#e9c176',
    '#9bc1bc',
    '#d39a9a',
    '#a3b18a',
    '#b4a7d6',
    '#f4a261',
    '#8ab0d9',
]
