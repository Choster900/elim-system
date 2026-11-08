import { useAppToast } from '~/presentation/shared/composables/useAppToast'
import type { LabelPrintJob } from '../interfaces/label-print-job.interface'
import { useLabelPrinterStore } from '../stores/label-printer.store'
import { buildJobDocument, printedJobMessage } from '../utils/label-print-job.util'

const PRINT_FAILED_MESSAGE = 'No se pudo imprimir.'

export function useLabelPrintJob() {
    const printerStore = useLabelPrinterStore()
    const toast = useAppToast()
    const setupOpen = ref(false)
    const pendingJob = shallowRef<LabelPrintJob | null>(null)
    const isPrinterReady = computed(() => printerStore.isReady)

    function openSetup(job: LabelPrintJob | null = null) {
        pendingJob.value = job
        setupOpen.value = true
    }

    async function printNow(job: LabelPrintJob) {
        printerStore.loadPreferences()
        const toastId = toast.loading(`Imprimiendo ${job.kindLabel}…`, { description: job.title })
        const printed = await printerStore.print(buildJobDocument(job, printerStore.paperSize), 1)
        if (printed) {
            toast.success(printedJobMessage(job, 1), { id: toastId, description: job.title })
            return true
        }
        toast.error(printerStore.printError ?? PRINT_FAILED_MESSAGE, {
            id: toastId,
            description: job.title,
            action: { label: 'Configurar', onClick: () => openSetup(job) },
        })
        return false
    }

    return { setupOpen, pendingJob, isPrinterReady, openSetup, printNow }
}
