export type LabelPrinterErrorCode =
    | 'unsupported-browser'
    | 'connection-cancelled'
    | 'permission-denied'
    | 'device-not-found'
    | 'connection-failed'
    | 'not-connected'
    | 'busy'
    | 'unsupported-model'
    | 'label-too-large'
    | 'invalid-document'
    | 'print-failed'

const DEFAULT_MESSAGES: Record<LabelPrinterErrorCode, string> = {
    'unsupported-browser':
        'Este navegador no permite conectar impresoras. Usa Chrome o Edge en escritorio, desde localhost o HTTPS.',
    'connection-cancelled': 'No se seleccionó ninguna impresora.',
    'permission-denied': 'El navegador bloqueó el acceso a la impresora.',
    'device-not-found': 'La impresora ya no está autorizada. Búscala de nuevo.',
    'connection-failed': 'No se pudo conectar con la impresora. Revisa que esté encendida y cerca.',
    'not-connected': 'Conecta una impresora antes de imprimir.',
    busy: 'Hay una impresión en curso. Espera a que termine.',
    'unsupported-model': 'Este modelo de impresora no es compatible con el controlador elegido.',
    'label-too-large': 'La etiqueta es más ancha que el cabezal de la impresora.',
    'invalid-document': 'La etiqueta tiene datos inválidos.',
    'print-failed': 'No se pudo imprimir la etiqueta.',
}

export class LabelPrinterError extends Error {
    readonly code: LabelPrinterErrorCode

    constructor(code: LabelPrinterErrorCode, message?: string, options?: { cause?: unknown }) {
        super(message ?? DEFAULT_MESSAGES[code], options)
        this.name = 'LabelPrinterError'
        this.code = code
    }
}

function fromDomException(error: DOMException) {
    if (error.name === 'NotFoundError' || error.name === 'AbortError') {
        return new LabelPrinterError('connection-cancelled', undefined, { cause: error })
    }
    if (error.name === 'SecurityError' || error.name === 'NotAllowedError') {
        return new LabelPrinterError('permission-denied', undefined, { cause: error })
    }
    return null
}

export function toLabelPrinterError(error: unknown, fallback: LabelPrinterErrorCode) {
    if (error instanceof LabelPrinterError) return error
    if (error instanceof DOMException) {
        const mapped = fromDomException(error)
        if (mapped) return mapped
    }
    const detail = error instanceof Error ? error.message : String(error)
    return new LabelPrinterError(fallback, `${DEFAULT_MESSAGES[fallback]} ${detail}`.trim(), {
        cause: error,
    })
}

export function resolveLabelPrinterErrorMessage(error: unknown) {
    return toLabelPrinterError(error, 'print-failed').message
}
