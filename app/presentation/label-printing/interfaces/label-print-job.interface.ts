import type { LabelBlock, LabelSize } from '~/infrastructure/label-printing'

export interface LabelPrintJob {
    title: string
    kindLabel: string
    size: LabelSize
    blocks: LabelBlock[]
}
