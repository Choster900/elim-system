import { createNiimbotAdapter } from './adapters/niimbot/niimbot.adapter'
import { createSimulatorAdapter } from './adapters/simulator/simulator.adapter'
import type {
    LabelPrinterAdapter,
    LabelPrinterAdapterDefinition,
    LabelPrinterAdapterId,
} from './label-printer.types'

export const labelPrinterAdapters: LabelPrinterAdapterDefinition[] = [
    {
        id: 'niimbot-bluetooth',
        label: 'NIIMBOT por Bluetooth',
        description: 'Chrome o Edge con Bluetooth activado.',
        create: () => createNiimbotAdapter('bluetooth'),
    },
    {
        id: 'niimbot-serial',
        label: 'NIIMBOT por USB',
        description: 'Cable USB, con Chrome o Edge de escritorio.',
        create: () => createNiimbotAdapter('serial'),
    },
    {
        id: 'simulator',
        label: 'Simulador',
        description: 'Prueba el flujo completo sin impresora.',
        create: createSimulatorAdapter,
    },
]

export const DEFAULT_LABEL_PRINTER_ADAPTER_ID: LabelPrinterAdapterId = 'niimbot-bluetooth'

export function findLabelPrinterAdapterDefinition(id: LabelPrinterAdapterId) {
    const definition = labelPrinterAdapters.find((adapter) => adapter.id === id)
    if (!definition) throw new Error(`Controlador de impresora desconocido: ${id}`)
    return definition
}

export function createLabelPrinterAdapter(id: LabelPrinterAdapterId): LabelPrinterAdapter {
    return findLabelPrinterAdapterDefinition(id).create()
}
