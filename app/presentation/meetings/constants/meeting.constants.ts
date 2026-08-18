import type { MeetingFrequency, MonthlyMode } from '../interfaces/meeting.interface'

export const frequencyOptions: { value: MeetingFrequency; label: string }[] = [
    { value: 'unica', label: 'Única vez' },
    { value: 'diaria', label: 'Todos los días' },
    { value: 'semanal', label: 'Semanal' },
    { value: 'quincenal', label: 'Quincenal' },
    { value: 'mensual', label: 'Mensual' },
]

export const monthlyModeOptions: { value: MonthlyMode; label: string }[] = [
    { value: 'dia_fijo', label: 'El mismo día del mes' },
    { value: 'ordinal', label: 'Un día de semana concreto' },
]

export const weekOrdinalOptions = [
    { value: 1, label: 'Primer' },
    { value: 2, label: 'Segundo' },
    { value: 3, label: 'Tercer' },
    { value: 4, label: 'Cuarto' },
    { value: 5, label: 'Último' },
]

export const weekdayOptions = [
    { value: 0, label: 'domingo' },
    { value: 1, label: 'lunes' },
    { value: 2, label: 'martes' },
    { value: 3, label: 'miércoles' },
    { value: 4, label: 'jueves' },
    { value: 5, label: 'viernes' },
    { value: 6, label: 'sábado' },
]

// La reunión ya no tiene estado: una plantilla que se repite no puede estar
// «completada». Lo que sí tiene es si sigue activa generando fechas.
export const activeOptions = [
    { value: true, label: 'Activa' },
    { value: false, label: 'Inactiva' },
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
