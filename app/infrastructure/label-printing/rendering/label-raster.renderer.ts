import type {
    LabelBarcodeBlock,
    LabelBlock,
    LabelCodeBlock,
    LabelDocument,
    LabelFieldBlock,
    LabelLineBlock,
    LabelQrBlock,
    LabelTextAlign,
} from '../document/label-document.types'
import { renderCodeSymbol } from './code-symbol.renderer'

export interface LabelRenderOptions {
    dpi: number
}

interface RenderBox {
    x: number
    y: number
    width: number
    height: number
}

interface LayoutRow {
    block: LabelBlock
    height: number
}

const MM_PER_INCH = 25.4
export const LABEL_MARGIN_MM = 1.5
const GAP_MM = 0.8
const LINE_HEIGHT_RATIO = 1.25
const TEXT_SIZE_MM = { sm: 2.4, md: 3.2, lg: 4.4 } as const
const BARCODE_VALUE_SIZE_MM = 2.6
const BARCODE_VALUE_GAP_MM = 0.6
const FONT_FAMILY = 'Arial, Helvetica, sans-serif'
const INK_LUMINANCE_THRESHOLD = 160
const INK_COLOR = '#000000'
const PAPER_COLOR = '#ffffff'

export function mmToPx(mm: number, dpi: number) {
    return Math.max(1, Math.round((mm * dpi) / MM_PER_INCH))
}

export function pxToMm(px: number, dpi: number) {
    return (px * MM_PER_INCH) / dpi
}

function lineHeight(fontPx: number) {
    return Math.round(fontPx * LINE_HEIGHT_RATIO)
}

function isLineBlock(block: LabelBlock): block is LabelLineBlock {
    return block.kind === 'text' || block.kind === 'field'
}

function isCodeBlock(block: LabelBlock): block is LabelCodeBlock {
    return !isLineBlock(block)
}

function textFontPx(block: LabelLineBlock, dpi: number) {
    return mmToPx(TEXT_SIZE_MM[block.size ?? 'md'], dpi)
}

function fitText(context: CanvasRenderingContext2D, value: string, maxWidth: number) {
    if (context.measureText(value).width <= maxWidth) return value
    let end = value.length
    while (end > 0 && context.measureText(`${value.slice(0, end).trimEnd()}…`).width > maxWidth) {
        end -= 1
    }
    return `${value.slice(0, end).trimEnd()}…`
}

function drawTextLine(
    context: CanvasRenderingContext2D,
    value: string,
    box: RenderBox,
    fontPx: number,
    style: { bold?: boolean; align?: LabelTextAlign } = {},
) {
    const centered = style.align === 'center'
    context.font = `${style.bold ? 'bold ' : ''}${fontPx}px ${FONT_FAMILY}`
    context.textBaseline = 'middle'
    context.textAlign = centered ? 'center' : 'left'
    context.fillText(
        fitText(context, value, box.width),
        centered ? box.x + box.width / 2 : box.x,
        box.y + box.height / 2,
    )
}

function drawField(
    context: CanvasRenderingContext2D,
    block: LabelFieldBlock,
    box: RenderBox,
    fontPx: number,
) {
    const centerY = box.y + box.height / 2
    context.textBaseline = 'middle'
    context.textAlign = 'left'
    context.font = `bold ${fontPx}px ${FONT_FAMILY}`
    const labelText = fitText(context, `${block.label}: `, box.width)
    context.fillText(labelText, box.x, centerY)
    const labelWidth = Math.min(box.width, Math.ceil(context.measureText(labelText).width))
    const valueWidth = box.width - labelWidth
    if (valueWidth <= 0) return
    context.font = `${fontPx}px ${FONT_FAMILY}`
    context.fillText(fitText(context, block.value, valueWidth), box.x + labelWidth, centerY)
}

function moduleScale(available: number, size: number) {
    return available >= size ? Math.floor(available / size) : available / size
}

async function drawBarcode(
    context: CanvasRenderingContext2D,
    block: LabelBarcodeBlock,
    box: RenderBox,
    dpi: number,
) {
    const symbol = await renderCodeSymbol(block)
    const showValue = block.showValue ?? true
    const valueFontPx = mmToPx(BARCODE_VALUE_SIZE_MM, dpi)
    const valueGap = showValue ? mmToPx(BARCODE_VALUE_GAP_MM, dpi) : 0
    const valueHeight = showValue ? lineHeight(valueFontPx) : 0
    const barsHeight = Math.max(1, box.height - valueHeight - valueGap)
    const barsWidth = Math.round(symbol.width * moduleScale(box.width, symbol.width))

    context.drawImage(
        symbol,
        box.x + Math.floor((box.width - barsWidth) / 2),
        box.y,
        barsWidth,
        barsHeight,
    )
    if (!showValue) return
    drawTextLine(
        context,
        block.value,
        { x: box.x, y: box.y + barsHeight + valueGap, width: box.width, height: valueHeight },
        valueFontPx,
        { align: 'center' },
    )
}

async function drawQr(context: CanvasRenderingContext2D, block: LabelQrBlock, box: RenderBox) {
    const symbol = await renderCodeSymbol(block)
    const side = Math.round(
        symbol.width * moduleScale(Math.min(box.width, box.height), symbol.width),
    )
    context.drawImage(
        symbol,
        box.x + Math.floor((box.width - side) / 2),
        box.y + Math.floor((box.height - side) / 2),
        side,
        side,
    )
}

function layoutRows(label: LabelDocument, dpi: number, contentHeight: number, gap: number) {
    const rows: LayoutRow[] = label.blocks.map((block) => ({
        block,
        height: isLineBlock(block) ? lineHeight(textFontPx(block, dpi)) : 0,
    }))
    const codeRows = rows.filter((row) => isCodeBlock(row.block))
    const fixedHeight = rows.reduce((total, row) => total + row.height, 0) + gap * (rows.length - 1)
    const codeHeight = codeRows.length
        ? Math.max(1, Math.floor((contentHeight - fixedHeight) / codeRows.length))
        : 0
    codeRows.forEach((row) => {
        row.height = codeHeight
    })
    const offset = codeRows.length ? 0 : Math.max(0, Math.floor((contentHeight - fixedHeight) / 2))
    return { rows, offset }
}

function binarize(context: CanvasRenderingContext2D, width: number, height: number) {
    const image = context.getImageData(0, 0, width, height)
    const pixels = image.data
    for (let index = 0; index < pixels.length; index += 4) {
        const luminance =
            0.299 * (pixels[index] ?? 255) +
            0.587 * (pixels[index + 1] ?? 255) +
            0.114 * (pixels[index + 2] ?? 255)
        const value = luminance < INK_LUMINANCE_THRESHOLD ? 0 : 255
        pixels[index] = value
        pixels[index + 1] = value
        pixels[index + 2] = value
        pixels[index + 3] = 255
    }
    context.putImageData(image, 0, 0)
}

export async function renderLabelDocument(label: LabelDocument, { dpi }: LabelRenderOptions) {
    const canvas = document.createElement('canvas')
    canvas.width = mmToPx(label.size.widthMm, dpi)
    canvas.height = mmToPx(label.size.heightMm, dpi)
    const context = canvas.getContext('2d', { willReadFrequently: true })
    if (!context) throw new Error('El navegador no permite dibujar la etiqueta.')

    context.fillStyle = PAPER_COLOR
    context.fillRect(0, 0, canvas.width, canvas.height)
    context.fillStyle = INK_COLOR
    context.imageSmoothingEnabled = false

    const margin = mmToPx(LABEL_MARGIN_MM, dpi)
    const gap = mmToPx(GAP_MM, dpi)
    const contentWidth = canvas.width - margin * 2
    const contentHeight = canvas.height - margin * 2
    const { rows, offset } = layoutRows(label, dpi, contentHeight, gap)

    let y = margin + offset
    for (const { block, height } of rows) {
        const box = { x: margin, y, width: contentWidth, height }
        if (block.kind === 'text') {
            drawTextLine(context, block.value, box, textFontPx(block, dpi), block)
        } else if (block.kind === 'field') {
            drawField(context, block, box, textFontPx(block, dpi))
        } else if (block.kind === 'barcode') {
            await drawBarcode(context, block, box, dpi)
        } else {
            await drawQr(context, block, box)
        }
        y += height + gap
    }

    binarize(context, canvas.width, canvas.height)
    return canvas
}
