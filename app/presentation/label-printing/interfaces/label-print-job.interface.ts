import type { LabelBlock } from '~/infrastructure/label-printing'

export interface LabelPrintJob {
    title: string
    kindLabel: string
    blocks: LabelBlock[]
}
