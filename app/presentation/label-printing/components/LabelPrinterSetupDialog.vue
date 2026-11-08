<script setup lang="ts">
import { Check, CircleAlert, Printer, X } from '@lucide/vue'
import {
    DialogClose,
    DialogContent,
    DialogDescription,
    DialogOverlay,
    DialogPortal,
    DialogRoot,
    DialogTitle,
} from 'radix-vue'
import {
    LABEL_COPIES_LIMITS,
    LabelPrinterError,
    validateLabelDocument,
    type LabelSize,
} from '~/infrastructure/label-printing'
import { useAppToast } from '~/presentation/shared/composables/useAppToast'
import { PREVIEW_FALLBACK_DPI } from '../constants/label-printing.constants'
import type { LabelPrintJob } from '../interfaces/label-print-job.interface'
import { isValidPaperSize, useLabelPrinterStore } from '../stores/label-printer.store'
import { buildJobDocument, printedJobMessage } from '../utils/label-print-job.util'
import LabelDocumentPreview from './LabelDocumentPreview.vue'
import LabelSizeField from './LabelSizeField.vue'
import PrinterConnectionPanel from './PrinterConnectionPanel.vue'
import PrinterStatusPill from './PrinterStatusPill.vue'

const props = withDefaults(
    defineProps<{
        job?: LabelPrintJob | null
        title?: string
        description?: string
    }>(),
    {
        job: null,
        title: 'Configura la impresora',
        description: '',
    },
)

const open = defineModel<boolean>('open', { required: true })

const emit = defineEmits<{
    printed: [job: LabelPrintJob]
}>()

const toast = useAppToast()
const printerStore = useLabelPrinterStore()
const copies = ref(1)

const isPrinting = computed(() => printerStore.status === 'printing')
const paperSize = computed<LabelSize>({
    get: () => printerStore.paperSize,
    set: (size) => printerStore.setPaperSize(size),
})
const hasValidPaper = computed(() => isValidPaperSize(printerStore.paperSize))
const previewDpi = computed(() => printerStore.printer?.dpi ?? PREVIEW_FALLBACK_DPI)
const labelDocument = computed(() =>
    props.job ? buildJobDocument(props.job, printerStore.paperSize) : null,
)
const documentError = computed(() => {
    if (!labelDocument.value) return null
    try {
        validateLabelDocument(labelDocument.value)
        return null
    } catch (error) {
        return error instanceof LabelPrinterError ? error.message : 'La etiqueta no es válida.'
    }
})
const canPrint = computed(
    () => !!props.job && printerStore.isReady && hasValidPaper.value && !documentError.value,
)
const resolvedDescription = computed(() => {
    if (props.description) return props.description
    if (props.job) {
        return `Conecta tu impresora de etiquetas y revisa el papel para imprimir la ${props.job.kindLabel} de «${props.job.title}».`
    }
    return 'Conecta tu impresora de etiquetas y elige el papel que tiene cargado.'
})
const steps = computed(() => {
    const connected = printerStore.isConnected
    const list = [
        { label: 'Conecta', done: connected },
        { label: 'Papel', done: connected && hasValidPaper.value },
    ]
    if (props.job) list.push({ label: 'Imprime', done: false })
    const currentIndex = list.findIndex((step) => !step.done)
    return list.map((step, index) => ({ ...step, current: index === currentIndex }))
})
const printButtonLabel = computed(() => {
    if (isPrinting.value) return 'Imprimiendo…'
    return props.job ? `Imprimir ${props.job.kindLabel}` : 'Imprimir'
})

watch(open, (isOpen) => {
    if (!isOpen) return
    copies.value = 1
    printerStore.printError = null
    printerStore.loadPreferences()
})

function preventCloseWhilePrinting(event: Event) {
    if (isPrinting.value) event.preventDefault()
}

async function printJob() {
    const job = props.job
    if (!job || !labelDocument.value) return
    const amount = Number(copies.value)
    const printed = await printerStore.print(labelDocument.value, amount)
    if (!printed) return
    toast.success(printedJobMessage(job, amount), { description: job.title })
    emit('printed', job)
    open.value = false
}
</script>

<template>
    <DialogRoot v-model:open="open">
        <DialogPortal>
            <DialogOverlay class="fixed inset-0 z-[70] bg-black/60 backdrop-blur-sm" />
            <DialogContent
                class="fixed left-1/2 top-1/2 z-[71] flex max-h-[92dvh] w-[calc(100vw-1.5rem)] max-w-4xl -translate-x-1/2 -translate-y-1/2 flex-col overflow-hidden rounded-2xl border border-outline-variant bg-surface shadow-2xl focus:outline-none"
                @escape-key-down="preventCloseWhilePrinting"
                @pointer-down-outside="preventCloseWhilePrinting"
            >
                <header class="flex items-start gap-4 px-5 pb-4 pt-5 sm:px-7 sm:pt-6">
                    <div
                        class="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary"
                    >
                        <Printer class="size-6" aria-hidden="true" />
                    </div>
                    <div class="min-w-0 flex-1">
                        <DialogTitle class="font-display text-xl font-semibold text-on-surface">
                            {{ props.title }}
                        </DialogTitle>
                        <DialogDescription class="mt-1 text-sm text-on-surface-variant">
                            {{ resolvedDescription }}
                        </DialogDescription>
                    </div>
                    <DialogClose
                        class="flex size-8 shrink-0 items-center justify-center rounded-md text-on-surface-variant transition-colors hover:bg-surface-container-high hover:text-on-surface disabled:opacity-50"
                        :disabled="isPrinting"
                        aria-label="Cerrar"
                    >
                        <X class="size-4" />
                    </DialogClose>
                </header>

                <ol
                    class="flex items-center gap-2 overflow-x-auto border-y border-outline-variant bg-surface-container-low px-5 py-3 sm:px-7"
                    aria-label="Pasos"
                >
                    <li
                        v-for="(step, index) in steps"
                        :key="step.label"
                        class="flex shrink-0 items-center gap-2"
                    >
                        <span
                            :class="[
                                'flex size-6 items-center justify-center rounded-full text-[11px] font-bold transition-colors',
                                step.done
                                    ? 'bg-primary text-primary-foreground'
                                    : step.current
                                      ? 'border-2 border-primary text-primary'
                                      : 'border border-outline-variant text-on-surface-variant',
                            ]"
                        >
                            <Check v-if="step.done" class="size-3.5" aria-hidden="true" />
                            <template v-else>{{ index + 1 }}</template>
                        </span>
                        <span
                            :class="[
                                'text-xs font-semibold',
                                step.done || step.current
                                    ? 'text-on-surface'
                                    : 'text-on-surface-variant',
                            ]"
                        >
                            {{ step.label }}
                        </span>
                        <span
                            v-if="index < steps.length - 1"
                            :class="[
                                'mx-1 h-px w-6 sm:w-12',
                                step.done ? 'bg-primary' : 'bg-outline-variant',
                            ]"
                            aria-hidden="true"
                        />
                    </li>
                </ol>

                <div class="min-h-0 flex-1 overflow-y-auto px-5 py-5 sm:px-7">
                    <div class="grid gap-6 md:grid-cols-2">
                        <section class="flex flex-col gap-4" aria-labelledby="setup-printer-title">
                            <div class="flex items-center justify-between gap-3">
                                <h3
                                    id="setup-printer-title"
                                    class="text-xs font-semibold uppercase tracking-wider text-on-surface-variant"
                                >
                                    Impresora
                                </h3>
                                <PrinterStatusPill />
                            </div>
                            <PrinterConnectionPanel compact />
                        </section>

                        <section class="flex flex-col gap-5" aria-labelledby="setup-paper-title">
                            <div class="grid gap-3">
                                <h3
                                    id="setup-paper-title"
                                    class="text-xs font-semibold uppercase tracking-wider text-on-surface-variant"
                                >
                                    Papel cargado
                                </h3>
                                <LabelSizeField
                                    v-model="paperSize"
                                    id-prefix="setup-paper"
                                    label="Tamaño de la etiqueta (mm)"
                                />
                                <p class="text-xs text-on-surface-variant">
                                    Se recuerda en este navegador para las próximas impresiones.
                                </p>
                            </div>
                            <div v-if="labelDocument" class="grid gap-3">
                                <h3
                                    class="text-xs font-semibold uppercase tracking-wider text-on-surface-variant"
                                >
                                    Así se imprimirá
                                </h3>
                                <LabelDocumentPreview :document="labelDocument" :dpi="previewDpi" />
                            </div>
                        </section>
                    </div>
                </div>

                <footer class="grid gap-3 border-t border-outline-variant px-5 py-4 sm:px-7">
                    <div v-if="printerStore.progress" class="grid gap-1.5" aria-live="polite">
                        <div
                            class="h-1.5 overflow-hidden rounded-full bg-surface-container-high"
                            role="progressbar"
                            :aria-valuenow="printerStore.progress.percent"
                            aria-valuemin="0"
                            aria-valuemax="100"
                        >
                            <div
                                class="h-full rounded-full bg-primary transition-[width] duration-200"
                                :style="{ width: `${printerStore.progress.percent}%` }"
                            />
                        </div>
                        <p class="text-xs text-on-surface-variant">
                            Copia {{ printerStore.progress.page }} de
                            {{ printerStore.progress.totalPages }} ·
                            {{ printerStore.progress.percent }} %
                        </p>
                    </div>
                    <p
                        v-else-if="printerStore.printError"
                        class="flex items-start gap-2 rounded-md border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive"
                        role="alert"
                    >
                        <CircleAlert class="mt-0.5 size-4 shrink-0" aria-hidden="true" />
                        {{ printerStore.printError }}
                    </p>

                    <div class="flex flex-wrap items-center gap-3">
                        <p
                            v-if="job && !printerStore.isConnected"
                            class="w-full text-xs text-on-surface-variant sm:w-auto sm:flex-1"
                        >
                            Conecta la impresora para habilitar la impresión.
                        </p>
                        <DialogClose as-child>
                            <UiButton
                                variant="outline"
                                :class="
                                    job
                                        ? 'hidden sm:ml-auto sm:inline-flex'
                                        : 'w-full sm:ml-auto sm:w-auto'
                                "
                                :disabled="isPrinting"
                            >
                                {{ job ? 'Cancelar' : 'Listo' }}
                            </UiButton>
                        </DialogClose>
                        <template v-if="job">
                            <label class="flex items-center gap-2 text-sm text-on-surface-variant">
                                Copias
                                <UiInput
                                    v-model.number="copies"
                                    type="number"
                                    class="h-10 w-20"
                                    :min="LABEL_COPIES_LIMITS.min"
                                    :max="LABEL_COPIES_LIMITS.max"
                                    :disabled="isPrinting"
                                />
                            </label>
                            <UiButton
                                class="flex-1 sm:flex-none"
                                :disabled="!canPrint"
                                :loading="isPrinting"
                                @click="printJob"
                            >
                                <Printer v-if="!isPrinting" />
                                {{ printButtonLabel }}
                            </UiButton>
                        </template>
                    </div>
                </footer>
            </DialogContent>
        </DialogPortal>
    </DialogRoot>
</template>
