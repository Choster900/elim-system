<script setup lang="ts">
import { CircleAlert, Printer, Wrench } from '@lucide/vue'
import { LABEL_COPIES_LIMITS } from '~/infrastructure/label-printing'
import { useAppToast } from '~/presentation/shared/composables/useAppToast'
import LabelPreview from '../components/LabelPreview.vue'
import PrinterConnectionCard from '../components/PrinterConnectionCard.vue'
import TestLabelForm from '../components/TestLabelForm.vue'
import { useLabelPreview } from '../composables/useLabelPreview'
import {
    DEFAULT_TEST_LABEL_FORM,
    PREVIEW_FALLBACK_DPI,
} from '../constants/label-printing.constants'
import type { TestLabelForm as TestLabelFormValue } from '../interfaces/test-label-form.interface'
import { useLabelPrinterStore } from '../stores/label-printer.store'
import { buildTestLabelDocument } from '../utils/test-label.util'

defineOptions({ name: 'LabelPrinterTestView' })
useHead({ title: 'Impresora de etiquetas · Sistema' })

const toast = useAppToast()
const printerStore = useLabelPrinterStore()
const form = ref<TestLabelFormValue>({ ...DEFAULT_TEST_LABEL_FORM })

const labelDocument = computed(() => buildTestLabelDocument(form.value))
const previewDpi = computed(() => printerStore.printer?.dpi ?? PREVIEW_FALLBACK_DPI)
const { preview, previewError, rendering } = useLabelPreview(labelDocument, previewDpi)

const isPrinting = computed(() => printerStore.status === 'printing')
const canPrint = computed(() => printerStore.status === 'connected' && !previewError.value)
const progressLabel = computed(() => {
    const progress = printerStore.progress
    if (!progress) return ''
    return `Copia ${progress.page} de ${progress.totalPages} · ${progress.percent} %`
})
const printHint = computed(() => {
    if (!printerStore.isConnected) return 'Conecta una impresora para imprimir.'
    return `Se imprimirá en ${printerStore.printer?.deviceName}.`
})

watch(labelDocument, () => {
    printerStore.printError = null
})

async function printLabel() {
    const copies = Number(form.value.copies)
    const printed = await printerStore.print(labelDocument.value, copies)
    if (printed) toast.success(copies === 1 ? 'Etiqueta impresa' : `${copies} etiquetas impresas`)
}
</script>

<template>
    <main class="mx-auto w-full max-w-system px-5 pb-16 pt-24 sm:px-8 sm:pt-28 lg:px-10">
        <section
            class="relative overflow-hidden rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/15 via-surface-container to-surface-container-low px-6 py-7 sm:px-8"
        >
            <div class="absolute -right-16 -top-20 size-64 rounded-full bg-primary/10 blur-3xl" />
            <div class="relative flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
                <div class="max-w-2xl">
                    <div
                        class="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.24em] text-primary"
                    >
                        <Wrench class="size-4" /> Herramientas
                    </div>
                    <h1
                        class="mt-3 font-display text-3xl font-semibold text-on-surface sm:text-4xl"
                    >
                        Impresora de etiquetas
                    </h1>
                    <p class="mt-3 text-sm leading-relaxed text-on-surface-variant">
                        Banco de pruebas para conectar una impresora térmica e imprimir etiquetas.
                        La vista previa es exactamente lo que sale en el papel.
                    </p>
                </div>
                <div
                    class="rounded-xl border border-outline-variant bg-surface/80 px-4 py-3 backdrop-blur"
                >
                    <p
                        class="text-[10px] font-semibold uppercase tracking-wider text-on-surface-variant"
                    >
                        Impresora
                    </p>
                    <p class="mt-1 text-sm font-bold text-primary">
                        {{ printerStore.printer?.model ?? 'Sin conexión' }}
                    </p>
                </div>
            </div>
        </section>

        <div class="mt-8 grid gap-6 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:items-start">
            <PrinterConnectionCard />

            <UiCard class="flex flex-col gap-6 p-5 sm:p-6">
                <header>
                    <h2 class="font-display text-xl font-semibold text-on-surface">
                        Etiqueta de prueba
                    </h2>
                    <p class="mt-1 text-sm text-on-surface-variant">
                        Cambia los datos y revisa cómo queda antes de imprimir.
                    </p>
                </header>

                <div class="grid gap-6 xl:grid-cols-2">
                    <TestLabelForm v-model="form" />
                    <LabelPreview :preview="preview" :error="previewError" :rendering="rendering" />
                </div>

                <footer class="grid gap-4 border-t border-outline-variant pt-5">
                    <div class="flex flex-col gap-4 sm:flex-row sm:items-end">
                        <div class="grid gap-2 sm:w-28">
                            <UiLabel for="label-copies">Copias</UiLabel>
                            <UiInput
                                id="label-copies"
                                v-model.number="form.copies"
                                type="number"
                                :min="LABEL_COPIES_LIMITS.min"
                                :max="LABEL_COPIES_LIMITS.max"
                                :disabled="isPrinting"
                            />
                        </div>
                        <UiButton
                            class="sm:flex-1"
                            size="lg"
                            :disabled="!canPrint"
                            :loading="isPrinting"
                            @click="printLabel"
                        >
                            <Printer v-if="!isPrinting" />
                            {{ isPrinting ? 'Imprimiendo…' : 'Imprimir etiqueta' }}
                        </UiButton>
                    </div>

                    <div v-if="printerStore.progress" class="grid gap-2" aria-live="polite">
                        <div
                            class="h-2 overflow-hidden rounded-full bg-surface-container-high"
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
                        <p class="text-xs text-on-surface-variant">{{ progressLabel }}</p>
                    </div>
                    <p
                        v-else-if="printerStore.printError"
                        class="flex items-start gap-2 rounded-md border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive"
                        role="alert"
                    >
                        <CircleAlert class="mt-0.5 size-4 shrink-0" aria-hidden="true" />
                        {{ printerStore.printError }}
                    </p>
                    <p v-else class="text-xs text-on-surface-variant">{{ printHint }}</p>
                </footer>
            </UiCard>
        </div>
    </main>
</template>
