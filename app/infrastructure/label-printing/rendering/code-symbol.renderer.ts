import type { LabelCodeBlock } from '../document/label-document.types'

type BwipModule = typeof import('bwip-js/browser')

let bwipModule: Promise<BwipModule> | null = null

function loadBwip() {
    bwipModule ??= import('bwip-js/browser').catch((error) => {
        bwipModule = null
        throw error
    })
    return bwipModule
}

function toUtf8ByteString(value: string) {
    return String.fromCharCode(...new TextEncoder().encode(value))
}

export async function renderCodeSymbol(block: LabelCodeBlock) {
    const bwip = await loadBwip()
    const canvas = document.createElement('canvas')
    if (block.kind === 'qr') {
        bwip.toCanvas(canvas, { bcid: 'qrcode', text: toUtf8ByteString(block.value), scale: 1 })
    } else {
        bwip.toCanvas(canvas, {
            bcid: block.symbology,
            text: block.value,
            scale: 1,
            height: 1,
            includetext: false,
        })
    }
    return canvas
}
