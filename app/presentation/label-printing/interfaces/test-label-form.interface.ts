export type TestLabelCodeType = 'code128' | 'ean13' | 'qr'

export interface TestLabelForm {
    title: string
    subtitle: string
    codeType: TestLabelCodeType
    codeValue: string
    widthMm: number
    heightMm: number
    copies: number
}
