import { LabelPrinterError } from '../../label-printer.error'
import type {
    LabelPrinterAdapter,
    LabelPrinterDevice,
    LabelPrinterInfo,
    LabelPrintRequest,
} from '../../label-printer.types'
import { renderLabelDocument } from '../../rendering/label-raster.renderer'
import { fitCanvasToPrinthead } from '../../rendering/printhead-fit'

const SIMULATED_DPI = 203
const SIMULATED_PRINTHEAD_PX = 384
const SIMULATED_DEVICE: LabelPrinterDevice = { id: 'simulador', name: 'Impresora simulada' }
const SIMULATED_PRINTER: LabelPrinterInfo = {
    deviceName: SIMULATED_DEVICE.name,
    model: 'Simulador',
    dpi: SIMULATED_DPI,
    printheadPx: SIMULATED_PRINTHEAD_PX,
    batteryPercent: 100,
    firmware: 'virtual',
}
const CONNECT_DELAY_MS = 400
const PROGRESS_STEPS_PER_PAGE = 4
const PROGRESS_STEP_MS = 120

function wait(ms: number) {
    return new Promise((resolve) => setTimeout(resolve, ms))
}

export function createSimulatorAdapter(): LabelPrinterAdapter {
    let connected = false
    let printing = false

    async function print({ document, copies, onProgress }: LabelPrintRequest) {
        if (!connected) throw new LabelPrinterError('not-connected')
        if (printing) throw new LabelPrinterError('busy')

        printing = true
        try {
            fitCanvasToPrinthead(await renderLabelDocument(document, { dpi: SIMULATED_DPI }), {
                model: SIMULATED_PRINTER.model,
                dpi: SIMULATED_DPI,
                printheadPx: SIMULATED_PRINTHEAD_PX,
                axis: 'width',
            })
            const totalSteps = copies * PROGRESS_STEPS_PER_PAGE
            for (let step = 1; step <= totalSteps; step += 1) {
                await wait(PROGRESS_STEP_MS)
                onProgress?.({
                    page: Math.ceil(step / PROGRESS_STEPS_PER_PAGE),
                    totalPages: copies,
                    percent: Math.round((step / totalSteps) * 100),
                })
            }
        } finally {
            printing = false
        }
    }

    return {
        id: 'simulator',
        checkSupport: () => ({ supported: true }),
        listAuthorizedDevices: async () => [SIMULATED_DEVICE],
        async connect() {
            await wait(CONNECT_DELAY_MS)
            connected = true
            return { ...SIMULATED_PRINTER }
        },
        async disconnect() {
            connected = false
        },
        print,
        onDisconnect: () => () => undefined,
    }
}
