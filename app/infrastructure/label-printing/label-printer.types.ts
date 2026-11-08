import type { LabelDocument } from './document/label-document.types'

export type LabelPrinterAdapterId = 'niimbot-bluetooth' | 'niimbot-serial' | 'simulator'

export interface LabelPrinterDevice {
    id: string
    name: string
}

export interface LabelPrinterInfo {
    deviceName: string
    model: string
    dpi: number
    printheadPx?: number
    batteryPercent?: number
    firmware?: string
}

export interface LabelPrintProgress {
    page: number
    totalPages: number
    percent: number
}

export interface LabelPrintRequest {
    document: LabelDocument
    copies: number
    onProgress?: (progress: LabelPrintProgress) => void
}

export type LabelPrinterSupport = { supported: true } | { supported: false; reason: string }

export interface LabelPrinterAdapter {
    readonly id: LabelPrinterAdapterId
    checkSupport: () => LabelPrinterSupport
    listAuthorizedDevices: () => Promise<LabelPrinterDevice[]>
    connect: (deviceId?: string) => Promise<LabelPrinterInfo>
    disconnect: () => Promise<void>
    print: (request: LabelPrintRequest) => Promise<void>
    onDisconnect: (listener: () => void) => () => void
}

export interface LabelPrinterAdapterDefinition {
    id: LabelPrinterAdapterId
    label: string
    description: string
    create: () => LabelPrinterAdapter
}
