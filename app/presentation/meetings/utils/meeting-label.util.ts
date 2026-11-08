import type { LabelPrintJob } from '~/presentation/label-printing/interfaces/label-print-job.interface'
import type { MeetingRecord } from '../interfaces/meeting.interface'

const UNASSIGNED_PERSON = 'Sin asignar'
const MEETING_LABEL_SIZE = { widthMm: 50, heightMm: 30 }

function personName(name?: string | null) {
    return name?.trim() || UNASSIGNED_PERSON
}

export function buildMeetingLabelJob(meeting: MeetingRecord): LabelPrintJob {
    return {
        title: meeting.title,
        kindLabel: 'viñeta',
        size: MEETING_LABEL_SIZE,
        blocks: [
            { kind: 'field', label: 'Líder', value: personName(meeting.leaderName), size: 'lg' },
            { kind: 'field', label: 'Anfitrión', value: personName(meeting.hostName), size: 'lg' },
            { kind: 'barcode', value: meeting.fullCode, symbology: 'code128', showValue: true },
        ],
    }
}
