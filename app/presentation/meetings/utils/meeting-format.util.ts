import {
    type MeetingFrequency,
    type MeetingStatus,
    frequencyOptions,
    statusOptions,
} from '~/mock/meetings.mock'
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

export function getMeetingStatusLabel(status: MeetingStatus) {
    return getOptionLabel(statusOptions, status)
}
