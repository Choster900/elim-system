import type { MaybeRefOrGetter } from 'vue'
import {
    LabelPrinterError,
    renderLabelDocument,
    validateLabelDocument,
    type LabelDocument,
} from '~/infrastructure/label-printing'

const PREVIEW_DEBOUNCE_MS = 200
const PREVIEW_FAILED_MESSAGE = 'No se pudo generar la vista previa.'

export interface LabelPreviewImage {
    url: string
    widthPx: number
    heightPx: number
    dpi: number
}

export function useLabelPreview(
    labelDocument: MaybeRefOrGetter<LabelDocument>,
    dpi: MaybeRefOrGetter<number>,
) {
    const preview = shallowRef<LabelPreviewImage | null>(null)
    const previewError = ref<string | null>(null)
    const rendering = ref(false)
    let renderId = 0
    let debounceTimer: ReturnType<typeof setTimeout> | undefined

    async function render() {
        const currentRender = ++renderId
        const label = toValue(labelDocument)
        const renderDpi = toValue(dpi)
        rendering.value = true
        try {
            validateLabelDocument(label)
            const canvas = await renderLabelDocument(label, { dpi: renderDpi })
            if (currentRender !== renderId) return
            preview.value = {
                url: canvas.toDataURL('image/png'),
                widthPx: canvas.width,
                heightPx: canvas.height,
                dpi: renderDpi,
            }
            previewError.value = null
        } catch (error) {
            if (currentRender !== renderId) return
            previewError.value =
                error instanceof LabelPrinterError ? error.message : PREVIEW_FAILED_MESSAGE
        } finally {
            if (currentRender === renderId) rendering.value = false
        }
    }

    function scheduleRender() {
        clearTimeout(debounceTimer)
        debounceTimer = setTimeout(render, PREVIEW_DEBOUNCE_MS)
    }

    watch(() => [toValue(labelDocument), toValue(dpi)], scheduleRender)
    onMounted(render)
    onBeforeUnmount(() => {
        clearTimeout(debounceTimer)
        renderId += 1
    })

    return { preview, previewError, rendering }
}
