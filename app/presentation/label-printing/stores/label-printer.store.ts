import { defineStore } from 'pinia'
import {
    DEFAULT_LABEL_PRINTER_ADAPTER_ID,
    LABEL_SIZE_LIMITS_MM,
    LabelPrinterError,
    createLabelPrinterAdapter,
    findLabelPrinterAdapterDefinition,
    labelPrinterAdapters,
    resolveLabelPrinterErrorMessage,
    validateLabelPrintRequest,
    type LabelDocument,
    type LabelPrinterAdapter,
    type LabelPrinterAdapterId,
    type LabelPrinterDevice,
    type LabelPrinterInfo,
    type LabelPrintProgress,
    type LabelPrintRequest,
    type LabelSize,
} from '~/infrastructure/label-printing'
import { readJsonStorage, writeJsonStorage } from '~/utils/storage/json-storage.util'

export type LabelPrinterStatus = 'disconnected' | 'connecting' | 'connected' | 'printing'

interface LabelPrinterState {
    adapterId: LabelPrinterAdapterId
    status: LabelPrinterStatus
    printer: LabelPrinterInfo | null
    devices: LabelPrinterDevice[]
    loadingDevices: boolean
    progress: LabelPrintProgress | null
    connectionError: string | null
    printError: string | null
    paperSize: LabelSize
    preferencesLoaded: boolean
}

interface LabelPrinterPreferences {
    adapterId: LabelPrinterAdapterId
    paperSize: LabelSize
}

const CONNECTION_LOST_MESSAGE = 'Se perdió la conexión con la impresora.'
const PREFERENCES_STORAGE_KEY = 'label-printer-preferences'
export const DEFAULT_PAPER_SIZE: LabelSize = { widthMm: 50, heightMm: 30 }

const adapterInstances = new Map<LabelPrinterAdapterId, LabelPrinterAdapter>()
let stopWatchingDisconnect: (() => void) | null = null

function adapterFor(id: LabelPrinterAdapterId) {
    let adapter = adapterInstances.get(id)
    if (!adapter) {
        adapter = createLabelPrinterAdapter(id)
        adapterInstances.set(id, adapter)
    }
    return adapter
}

function releaseDisconnectWatcher() {
    stopWatchingDisconnect?.()
    stopWatchingDisconnect = null
}

function isKnownAdapterId(value: unknown): value is LabelPrinterAdapterId {
    return labelPrinterAdapters.some((adapter) => adapter.id === value)
}

export function isValidPaperSize(value: unknown): value is LabelSize {
    if (!value || typeof value !== 'object') return false
    const { widthMm, heightMm } = value as Partial<LabelSize>
    return [widthMm, heightMm].every(
        (sizeMm) =>
            typeof sizeMm === 'number' &&
            sizeMm >= LABEL_SIZE_LIMITS_MM.min &&
            sizeMm <= LABEL_SIZE_LIMITS_MM.max,
    )
}

export function checkLabelPrinterAdapterSupport(id: LabelPrinterAdapterId) {
    return adapterFor(id).checkSupport()
}

export const useLabelPrinterStore = defineStore('label-printer', {
    state: (): LabelPrinterState => ({
        adapterId: DEFAULT_LABEL_PRINTER_ADAPTER_ID,
        status: 'disconnected',
        printer: null,
        devices: [],
        loadingDevices: false,
        progress: null,
        connectionError: null,
        printError: null,
        paperSize: { ...DEFAULT_PAPER_SIZE },
        preferencesLoaded: false,
    }),
    getters: {
        selectedAdapter(state) {
            return findLabelPrinterAdapterDefinition(state.adapterId)
        },
        isConnected(state): boolean {
            return state.status === 'connected' || state.status === 'printing'
        },
        isBusy(state): boolean {
            return state.status === 'connecting' || state.status === 'printing'
        },
        isReady(state): boolean {
            return state.status === 'connected'
        },
    },
    actions: {
        loadPreferences() {
            if (this.preferencesLoaded || !import.meta.client) return
            this.preferencesLoaded = true
            const stored = readJsonStorage<Partial<LabelPrinterPreferences> | null>(
                PREFERENCES_STORAGE_KEY,
                null,
            )
            const adapterId = stored?.adapterId
            const paperSize = stored?.paperSize
            if (isKnownAdapterId(adapterId) && this.status === 'disconnected') {
                this.adapterId = adapterId
            }
            if (isValidPaperSize(paperSize)) this.paperSize = { ...paperSize }
        },
        savePreferences() {
            if (!isValidPaperSize(this.paperSize)) return
            const preferences: LabelPrinterPreferences = {
                adapterId: this.adapterId,
                paperSize: this.paperSize,
            }
            writeJsonStorage(PREFERENCES_STORAGE_KEY, preferences)
        },
        setPaperSize(size: LabelSize) {
            this.paperSize = { ...size }
            this.savePreferences()
        },
        async selectAdapter(id: LabelPrinterAdapterId) {
            if (id === this.adapterId || this.isBusy) return
            await this.disconnect()
            this.adapterId = id
            this.savePreferences()
            this.devices = []
            this.connectionError = null
            this.printError = null
            await this.refreshDevices()
        },
        async refreshDevices() {
            const adapter = adapterFor(this.adapterId)
            if (!adapter.checkSupport().supported) {
                this.devices = []
                return
            }
            this.loadingDevices = true
            try {
                this.devices = await adapter.listAuthorizedDevices()
            } catch (error) {
                this.devices = []
                this.connectionError = resolveLabelPrinterErrorMessage(error)
            } finally {
                this.loadingDevices = false
            }
        },
        async connect(deviceId?: string) {
            if (this.isBusy) return null
            const adapter = adapterFor(this.adapterId)
            this.status = 'connecting'
            this.connectionError = null
            this.printError = null
            try {
                const printer = await adapter.connect(deviceId)
                releaseDisconnectWatcher()
                stopWatchingDisconnect = adapter.onDisconnect(() => this.handleConnectionLost())
                this.printer = printer
                this.status = 'connected'
                void this.refreshDevices()
                return printer
            } catch (error) {
                this.printer = null
                this.status = 'disconnected'
                this.connectionError = resolveLabelPrinterErrorMessage(error)
                return null
            }
        },
        async disconnect() {
            releaseDisconnectWatcher()
            const adapter = adapterInstances.get(this.adapterId)
            this.status = 'disconnected'
            this.printer = null
            this.progress = null
            await adapter?.disconnect()
        },
        handleConnectionLost() {
            releaseDisconnectWatcher()
            this.status = 'disconnected'
            this.printer = null
            this.progress = null
            this.connectionError = CONNECTION_LOST_MESSAGE
        },
        async print(document: LabelDocument, copies: number) {
            const request: LabelPrintRequest = {
                document,
                copies,
                onProgress: (progress) => {
                    this.progress = progress
                },
            }
            this.printError = null
            try {
                validateLabelPrintRequest(request)
                if (this.status === 'printing') throw new LabelPrinterError('busy')
                if (this.status !== 'connected') throw new LabelPrinterError('not-connected')
            } catch (error) {
                this.printError = resolveLabelPrinterErrorMessage(error)
                return false
            }

            this.status = 'printing'
            this.progress = { page: 1, totalPages: copies, percent: 0 }
            try {
                await adapterFor(this.adapterId).print(request)
                return true
            } catch (error) {
                this.printError = resolveLabelPrinterErrorMessage(error)
                return false
            } finally {
                if (this.status === 'printing') this.status = 'connected'
                this.progress = null
            }
        },
    },
})
