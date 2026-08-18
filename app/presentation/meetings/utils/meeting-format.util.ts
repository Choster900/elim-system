import { frequencyOptions } from '~/presentation/meetings/constants/meeting.constants'
import type { MeetingFrequency } from '~/presentation/meetings/interfaces/meeting.interface'
import {
    formatLocalIsoDate,
    formatTimeRange,
    getLocalIsoDateDay,
} from '~/utils/date/date-format.util'
import { getOptionLabel } from '~/utils/option/option-label.util'

export function formatMeetingDate(isoDate: string) {
    return formatLocalIsoDate(isoDate, {
        weekday: 'short',
        day: '2-digit',
        month: 'short',
    })
}

export function formatMeetingPreviewDate(isoDate: string) {
    return formatLocalIsoDate(
        isoDate,
        {
            weekday: 'long',
            day: '2-digit',
            month: 'long',
            year: 'numeric',
        },
        'es-SV',
        '—',
    )
}

export function formatMeetingMonth(isoDate: string) {
    return formatLocalIsoDate(isoDate, { month: 'short' })
}

export function getMeetingDateDay(isoDate: string) {
    return getLocalIsoDateDay(isoDate) ?? ''
}

export function formatMeetingTimeRange(startTime: string, endTime: string) {
    return formatTimeRange(startTime, endTime)
}

export function getMeetingFrequencyLabel(frequency: MeetingFrequency) {
    return getOptionLabel(frequencyOptions, frequency)
}

function pluralWeekday(weekday: string) {
    return weekday.endsWith('s') ? weekday : `${weekday}s`
}

export function formatMeetingRecurrence(
    date: string,
    startTime: string,
    endTime: string,
    frequency: MeetingFrequency,
    recurrenceEndDate: string | null,
) {
    if (!date) return 'Selecciona una fecha de inicio para configurar la programación.'

    const weekday = formatLocalIsoDate(date, { weekday: 'long' }, 'es-SV', 'día seleccionado')
    const startDate = formatLocalIsoDate(
        date,
        { day: '2-digit', month: 'long', year: 'numeric' },
        'es-SV',
        date,
    )
    const timeRange = formatTimeRange(startTime, endTime)
    const end = recurrenceEndDate
        ? ` hasta el ${formatLocalIsoDate(
              recurrenceEndDate,
              { day: '2-digit', month: 'long', year: 'numeric' },
              'es-SV',
              recurrenceEndDate,
          )}`
        : ' sin fecha de finalización'

    if (frequency === 'unica') {
        return `Una vez, el ${weekday} ${startDate}, de ${timeRange}.`
    }
    if (frequency === 'diaria') {
        return `Todos los días, de ${timeRange}, a partir del ${startDate}${end}.`
    }
    if (frequency === 'semanal') {
        return `Todos los ${pluralWeekday(weekday)}, de ${timeRange}, a partir del ${startDate}${end}.`
    }
    if (frequency === 'quincenal') {
        return `Cada dos semanas, los ${pluralWeekday(weekday)}, de ${timeRange}, a partir del ${startDate}${end}.`
    }

    return `El día ${Number(date.slice(8, 10))} de cada mes, de ${timeRange}, a partir del ${startDate}${end}.`
}
