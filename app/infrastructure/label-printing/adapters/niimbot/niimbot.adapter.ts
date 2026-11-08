import type {
    AbstractPrintTask,
    NiimbotBluetoothClient,
    NiimbotSerialClient,
    PrintProgressEvent,
} from '@mmote/niimbluelib'
import { LabelPrinterError, toLabelPrinterError } from '../../label-printer.error'
import type {
    LabelPrinterAdapter,
    LabelPrinterInfo,
    LabelPrintProgress,
    LabelPrintRequest,
} from '../../label-printer.types'
import { renderLabelDocument } from '../../rendering/label-raster.renderer'
import { fitCanvasToPrinthead } from '../../rendering/printhead-fit'
import {
    describeBluetoothDevice,
    describeSerialPort,
    findAuthorizedBluetoothDevice,
    findAuthorizedSerialPort,
    checkTransportSupport,
    listAuthorizedBluetoothDevices,
    listAuthorizedSerialPorts,
    type NiimbotTransport,
} from './niimbot-device-access'

type NiimbluelibModule = typeof import('@mmote/niimbluelib')
type NiimbotClient = NiimbotBluetoothClient | NiimbotSerialClient

const FALLBACK_DPI = 203
const STATUS_POLL_INTERVAL_MS = 100
const STATUS_TIMEOUT_MS = 8_000

let libraryModule: Promise<NiimbluelibModule> | null = null

function loadLibrary() {
    libraryModule ??= import('@mmote/niimbluelib').catch((error) => {
        libraryModule = null
        throw error
    })
    return libraryModule
}

function toProgress(event: PrintProgressEvent): LabelPrintProgress {
    const totalPages = Math.max(1, event.pagesTotal)
    const completedPages = Math.max(0, event.page - 1) + event.pagePrintProgress / 100
    return {
        page: Math.max(1, event.page),
        totalPages,
        percent: Math.min(100, Math.round((completedPages / totalPages) * 100)),
    }
}

function describePrinter(client: NiimbotClient, deviceName?: string): LabelPrinterInfo {
    const meta = client.getModelMetadata()
    const info = client.getPrinterInfo()
    const model = meta?.model ?? (info.modelId !== undefined ? `ID ${info.modelId}` : 'Desconocido')
    return {
        deviceName: deviceName || model,
        model,
        dpi: meta?.dpi ?? FALLBACK_DPI,
        printheadPx: meta?.printheadPixels,
        batteryPercent: info.batteryPercents,
        firmware: info.softwareVersion,
    }
}

export function createNiimbotAdapter(transport: NiimbotTransport): LabelPrinterAdapter {
    const disconnectListeners = new Set<() => void>()
    let client: NiimbotClient | null = null
    let printing = false

    function handleClientDisconnect() {
        client = null
        disconnectListeners.forEach((listener) => listener())
    }

    function requireClient() {
        if (!client?.isConnected()) throw new LabelPrinterError('not-connected')
        return client
    }

    async function resolveConnectOptions(deviceId?: string) {
        if (!deviceId) return {}
        if (transport === 'bluetooth') {
            const authorizedDevice = await findAuthorizedBluetoothDevice(deviceId)
            if (!authorizedDevice) throw new LabelPrinterError('device-not-found')
            return { authorizedDevice }
        }
        const authorizedPort = await findAuthorizedSerialPort(deviceId)
        if (!authorizedPort) throw new LabelPrinterError('device-not-found')
        return { authorizedPort }
    }

    async function createClient(): Promise<NiimbotClient> {
        const library = await loadLibrary()
        return transport === 'bluetooth'
            ? new library.NiimbotBluetoothClient()
            : new library.NiimbotSerialClient()
    }

    async function disconnect() {
        const activeClient = client
        client = null
        if (!activeClient) return
        activeClient.off('disconnect', handleClientDisconnect)
        await activeClient.disconnect().catch(() => undefined)
    }

    async function connect(deviceId?: string) {
        const support = checkTransportSupport(transport)
        if (!support.supported) throw new LabelPrinterError('unsupported-browser', support.reason)
        await disconnect()
        const options = await resolveConnectOptions(deviceId)
        const candidate = await createClient()
        try {
            const connection = await candidate.connect(options)
            candidate.on('disconnect', handleClientDisconnect)
            client = candidate
            return describePrinter(candidate, connection.deviceName)
        } catch (error) {
            await candidate.disconnect().catch(() => undefined)
            throw toLabelPrinterError(error, 'connection-failed')
        }
    }

    async function print({ document, copies, onProgress }: LabelPrintRequest) {
        const activeClient = requireClient()
        if (printing) throw new LabelPrinterError('busy')
        const meta = activeClient.getModelMetadata()
        const taskName = activeClient.getPrintTaskType()
        if (!meta || !taskName) {
            throw new LabelPrinterError(
                'unsupported-model',
                `El modelo ${meta?.model ?? 'detectado'} todavía no se puede imprimir desde el navegador.`,
            )
        }

        printing = true
        const handleProgress = (event: PrintProgressEvent) => onProgress?.(toProgress(event))
        activeClient.on('printprogress', handleProgress)
        let task: AbstractPrintTask | undefined
        try {
            const library = await loadLibrary()
            const canvas = fitCanvasToPrinthead(
                await renderLabelDocument(document, { dpi: meta.dpi }),
                {
                    model: meta.model,
                    dpi: meta.dpi,
                    printheadPx: meta.printheadPixels,
                    axis: meta.printDirection === 'top' ? 'width' : 'height',
                },
            )
            const image = library.ImageEncoder.encodeCanvas(
                canvas,
                library.PageColorType.SingleColor,
                meta.printDirection,
            )
            task = activeClient.protocol.newPrintTask(taskName, {
                totalPages: copies,
                density: meta.densityDefault,
                statusPollIntervalMs: STATUS_POLL_INTERVAL_MS,
                statusTimeoutMs: STATUS_TIMEOUT_MS,
            })
            await task.printInit()
            await task.printPage(image, copies)
            await task.waitForPageFinished()
            await task.waitForFinished()
            onProgress?.({ page: copies, totalPages: copies, percent: 100 })
        } catch (error) {
            throw toLabelPrinterError(error, 'print-failed')
        } finally {
            await task?.printEnd().catch(() => undefined)
            activeClient.off('printprogress', handleProgress)
            printing = false
        }
    }

    async function listAuthorizedDevices() {
        if (transport === 'bluetooth') {
            const devices = await listAuthorizedBluetoothDevices()
            return devices.map(describeBluetoothDevice)
        }
        const ports = await listAuthorizedSerialPorts()
        return ports.map(describeSerialPort)
    }

    return {
        id: transport === 'bluetooth' ? 'niimbot-bluetooth' : 'niimbot-serial',
        checkSupport: () => checkTransportSupport(transport),
        listAuthorizedDevices,
        connect,
        disconnect,
        print,
        onDisconnect(listener) {
            disconnectListeners.add(listener)
            return () => disconnectListeners.delete(listener)
        },
    }
}
