import type { LabelPrintJob } from '~/presentation/label-printing/interfaces/label-print-job.interface'
import type { MeetingRecord } from '../interfaces/meeting.interface'

const UNASSIGNED_PERSON = 'Sin asignar'

export interface MeetingLabelPeople {
    supervisorName?: string | null
    coordinatorName?: string | null
}

function personName(name?: string | null) {
    return name?.trim() || UNASSIGNED_PERSON
}

export function buildMeetingLabelJob(
    meeting: MeetingRecord,
    people: MeetingLabelPeople = {},
): LabelPrintJob {
    return {
        title: meeting.title,
        kindLabel: 'viñeta',
        blocks: [
            { kind: 'field', label: 'Líder', value: personName(meeting.leaderName), size: 'sm' },
            { kind: 'field', label: 'Anfitrión', value: personName(meeting.hostName), size: 'sm' },
            {
                kind: 'field',
                label: 'Supervisor',
                value: personName(meeting.supervisorName || people.supervisorName),
                size: 'sm',
            },
            {
                kind: 'field',
                label: 'Coordinador',
                value: personName(people.coordinatorName),
                size: 'sm',
            },
            { kind: 'barcode', value: meeting.fullCode, symbology: 'code128', showValue: true },
        ],
    }
}
