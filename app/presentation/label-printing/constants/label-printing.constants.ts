import type { TestLabelCodeType, TestLabelForm } from '../interfaces/test-label-form.interface'

export const LABEL_PRINTER_ROUTE = '/herramientas/impresora-etiquetas'

export const PREVIEW_FALLBACK_DPI = 203

export const LABEL_SIZE_PRESETS = [
    { widthMm: 50, heightMm: 30 },
    { widthMm: 40, heightMm: 30 },
    { widthMm: 30, heightMm: 15 },
    { widthMm: 40, heightMm: 12 },
] as const

export const TEST_LABEL_CODE_TYPES: { value: TestLabelCodeType; label: string; hint: string }[] = [
    { value: 'code128', label: 'Code 128', hint: 'Letras sin tilde, números y símbolos básicos.' },
    { value: 'ean13', label: 'EAN-13', hint: '12 dígitos; el dígito de control se calcula solo.' },
    { value: 'qr', label: 'QR', hint: 'Texto o enlace de hasta 500 caracteres.' },
]

export const TEST_LABEL_CODE_SAMPLES: Record<TestLabelCodeType, string> = {
    code128: 'D1Z1S1C1',
    ean13: '750105530012',
    qr: 'D1Z1S1C1 · Reunión de célula',
}

export const DEFAULT_TEST_LABEL_FORM: TestLabelForm = {
    title: 'Reunión de célula',
    subtitle: 'Domingo · 10:00 a. m.',
    codeType: 'code128',
    codeValue: TEST_LABEL_CODE_SAMPLES.code128,
    widthMm: 50,
    heightMm: 30,
    copies: 1,
}
