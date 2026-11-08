import type { LabelDocument, LabelSize } from '~/infrastructure/label-printing'
import type { LabelPrintJob } from '../interfaces/label-print-job.interface'

export function buildJobDocument(job: LabelPrintJob, paperSize: LabelSize): LabelDocument {
    return { size: { ...paperSize }, blocks: job.blocks }
}

export function printedJobMessage(job: LabelPrintJob, copies: number) {
    if (copies > 1) return `${copies} ${job.kindLabel}s impresas`
    return `${job.kindLabel.charAt(0).toUpperCase()}${job.kindLabel.slice(1)} impresa`
}
