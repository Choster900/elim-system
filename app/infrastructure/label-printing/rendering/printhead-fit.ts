import { LabelPrinterError } from '../label-printer.error'
import { LABEL_MARGIN_MM, pxToMm } from './label-raster.renderer'

export type PrintheadAxis = 'width' | 'height'

export interface PrintheadSpec {
    model: string
    dpi: number
    printheadPx: number
    axis: PrintheadAxis
}

const MAX_TRIMMED_MM = LABEL_MARGIN_MM * 2

export function fitCanvasToPrinthead(canvas: HTMLCanvasElement, spec: PrintheadSpec) {
    const side = spec.axis === 'width' ? canvas.width : canvas.height
    if (side <= spec.printheadPx) return canvas

    if (pxToMm(side - spec.printheadPx, spec.dpi) > MAX_TRIMMED_MM) {
        const labelMm = Math.round(pxToMm(side, spec.dpi))
        const printheadMm = Math.floor(pxToMm(spec.printheadPx, spec.dpi))
        const sideName = spec.axis === 'width' ? 'ancho' : 'alto'
        throw new LabelPrinterError(
            'label-too-large',
            `El ${sideName} de la etiqueta (${labelMm} mm) supera el cabezal de la impresora ${spec.model} (${printheadMm} mm).`,
        )
    }

    const trimmed = document.createElement('canvas')
    trimmed.width = spec.axis === 'width' ? spec.printheadPx : canvas.width
    trimmed.height = spec.axis === 'height' ? spec.printheadPx : canvas.height
    const offset = Math.floor((side - spec.printheadPx) / 2)
    trimmed
        .getContext('2d')
        ?.drawImage(
            canvas,
            spec.axis === 'width' ? -offset : 0,
            spec.axis === 'height' ? -offset : 0,
        )
    return trimmed
}
