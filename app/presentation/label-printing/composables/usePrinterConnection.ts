import {
    labelPrinterAdapters,
    type LabelPrinterAdapterId,
    type LabelPrinterSupport,
} from '~/infrastructure/label-printing'
import {
    checkLabelPrinterAdapterSupport,
    useLabelPrinterStore,
} from '../stores/label-printer.store'

export function usePrinterConnection() {
    const printerStore = useLabelPrinterStore()
    const supportByAdapter = ref<Partial<Record<LabelPrinterAdapterId, LabelPrinterSupport>>>({})
    const connectingDeviceId = ref<string | null>(null)

    const unsupportedReason = computed(() => {
        const support = supportByAdapter.value[printerStore.adapterId]
        return support && !support.supported ? support.reason : null
    })
    const isSearching = computed(
        () => printerStore.status === 'connecting' && connectingDeviceId.value === null,
    )

    function isAdapterSupported(id: LabelPrinterAdapterId) {
        return supportByAdapter.value[id]?.supported ?? true
    }

    async function connectTo(deviceId?: string) {
        connectingDeviceId.value = deviceId ?? null
        try {
            await printerStore.connect(deviceId)
        } finally {
            connectingDeviceId.value = null
        }
    }

    onMounted(() => {
        printerStore.loadPreferences()
        supportByAdapter.value = Object.fromEntries(
            labelPrinterAdapters.map((adapter) => [
                adapter.id,
                checkLabelPrinterAdapterSupport(adapter.id),
            ]),
        )
        void printerStore.refreshDevices()
    })

    return {
        printerStore,
        connectingDeviceId,
        unsupportedReason,
        isSearching,
        isAdapterSupported,
        connectTo,
    }
}
