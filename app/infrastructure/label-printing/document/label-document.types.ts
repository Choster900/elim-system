export type LabelTextSize = 'sm' | 'md' | 'lg'
export type LabelTextAlign = 'start' | 'center'
export type LabelBarcodeSymbology = 'code128' | 'ean13'

export interface LabelSize {
    widthMm: number
    heightMm: number
}

export interface LabelTextBlock {
    kind: 'text'
    value: string
    size?: LabelTextSize
    bold?: boolean
    align?: LabelTextAlign
}

export interface LabelFieldBlock {
    kind: 'field'
    label: string
    value: string
    size?: LabelTextSize
}

export interface LabelBarcodeBlock {
    kind: 'barcode'
    value: string
    symbology: LabelBarcodeSymbology
    showValue?: boolean
}

export interface LabelQrBlock {
    kind: 'qr'
    value: string
}

export type LabelCodeBlock = LabelBarcodeBlock | LabelQrBlock
export type LabelLineBlock = LabelTextBlock | LabelFieldBlock
export type LabelBlock = LabelLineBlock | LabelCodeBlock

export interface LabelDocument {
    size: LabelSize
    blocks: LabelBlock[]
}
