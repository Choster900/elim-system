import type { LabelBlock, LabelDocument } from '~/infrastructure/label-printing'
import type { TestLabelForm } from '../interfaces/test-label-form.interface'

export function buildTestLabelDocument(form: TestLabelForm): LabelDocument {
    const blocks: LabelBlock[] = []
    const title = form.title.trim()
    const subtitle = form.subtitle.trim()
    const codeValue = form.codeValue.trim()

    if (title) blocks.push({ kind: 'text', value: title, size: 'lg', bold: true, align: 'center' })
    if (subtitle) blocks.push({ kind: 'text', value: subtitle, size: 'sm', align: 'center' })
    if (codeValue) {
        blocks.push(
            form.codeType === 'qr'
                ? { kind: 'qr', value: codeValue }
                : { kind: 'barcode', value: codeValue, symbology: form.codeType },
        )
    }

    return {
        size: { widthMm: Number(form.widthMm), heightMm: Number(form.heightMm) },
        blocks,
    }
}
