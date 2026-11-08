import { LabelPrinterError } from '../label-printer.error'
import type { LabelPrintRequest } from '../label-printer.types'
import type { LabelBlock, LabelDocument } from './label-document.types'

export const LABEL_SIZE_LIMITS_MM = { min: 10, max: 120 } as const
export const LABEL_COPIES_LIMITS = { min: 1, max: 100 } as const
export const LABEL_QR_MAX_LENGTH = 500

const PRINTABLE_ASCII_PATTERN = /^[\x20-\x7E]+$/

function invalid(message: string): never {
    throw new LabelPrinterError('invalid-document', message)
}

export function computeEan13CheckDigit(firstTwelveDigits: string) {
    const sum = [...firstTwelveDigits].reduce(
        (total, digit, index) => total + Number(digit) * (index % 2 === 0 ? 1 : 3),
        0,
    )
    return (10 - (sum % 10)) % 10
}

export function isValidEan13(value: string) {
    if (/^\d{12}$/.test(value)) return true
    if (!/^\d{13}$/.test(value)) return false
    return computeEan13CheckDigit(value.slice(0, 12)) === Number(value[12])
}

function isWithinSizeLimits(valueMm: number) {
    return (
        Number.isFinite(valueMm) &&
        valueMm >= LABEL_SIZE_LIMITS_MM.min &&
        valueMm <= LABEL_SIZE_LIMITS_MM.max
    )
}

function validateBlock(block: LabelBlock) {
    const value = block.value.trim()
    if (!value) invalid('Hay un campo vacío en la etiqueta.')

    if (block.kind === 'barcode' && block.symbology === 'code128') {
        if (!PRINTABLE_ASCII_PATTERN.test(value)) {
            invalid('El Code 128 solo admite letras sin tilde, números y símbolos básicos.')
        }
    }

    if (block.kind === 'barcode' && block.symbology === 'ean13' && !isValidEan13(value)) {
        invalid('El EAN-13 debe tener 12 dígitos, o 13 con un dígito de control válido.')
    }

    if (block.kind === 'qr' && value.length > LABEL_QR_MAX_LENGTH) {
        invalid(`El código QR admite hasta ${LABEL_QR_MAX_LENGTH} caracteres.`)
    }
}

export function validateLabelDocument(document: LabelDocument) {
    const { widthMm, heightMm } = document.size
    if (!isWithinSizeLimits(widthMm) || !isWithinSizeLimits(heightMm)) {
        invalid(
            `El ancho y el alto deben estar entre ${LABEL_SIZE_LIMITS_MM.min} y ${LABEL_SIZE_LIMITS_MM.max} mm.`,
        )
    }
    if (!document.blocks.length) invalid('La etiqueta no tiene contenido.')
    document.blocks.forEach(validateBlock)
}

export function validateLabelPrintRequest(request: LabelPrintRequest) {
    validateLabelDocument(request.document)
    const { copies } = request
    if (
        !Number.isInteger(copies) ||
        copies < LABEL_COPIES_LIMITS.min ||
        copies > LABEL_COPIES_LIMITS.max
    ) {
        invalid(
            `Las copias deben ser un número entero entre ${LABEL_COPIES_LIMITS.min} y ${LABEL_COPIES_LIMITS.max}.`,
        )
    }
}
