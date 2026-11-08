<script setup lang="ts">
import { CircleAlert, Printer, X } from '@lucide/vue'
import {
    DialogClose,
    DialogContent,
    DialogDescription,
    DialogOverlay,
    DialogPortal,
    DialogRoot,
    DialogTitle,
} from 'radix-vue'
import { useAppToast } from '~/presentation/shared/composables/useAppToast'
import type { LabelPrintJob } from '../interfaces/label-print-job.interface'
import { useLabelPrinterStore } from '../stores/label-printer.store'
import { buildJobDocument, printedJobMessage } from '../utils/label-print-job.util'
import PrinterQuickConnect from './PrinterQuickConnect.vue'

const props = withDefaults(
    defineProps<{
        job?: LabelPrintJob | null
        title?: string
        description?: string
    }>(),
    {
        job: null,
        title: 'Conectar impresora',
        description: '',
    },
)

const open = defineModel<boolean>('open', { required: true })

const emit = defineEmits<{
    printed: [job: LabelPrintJob]
}>()

const toast = useAppToast()
const printerStore = useLabelPrinterStore()

const isPrinting = computed(() => printerStore.status === 'printing')
const canPrint = computed(() => !!props.job && printerStore.isReady)
const resolvedDescription = computed(() => {
    if (props.description) return props.description
    if (props.job) return props.job.title
    return 'Elige cómo se conecta tu impresora.'
})
const printButtonLabel = computed(() => {
    if (isPrinting.value) return 'Imprimiendo…'
    return props.job ? `Imprimir ${props.job.kindLabel}` : 'Imprimir'
})

watch(open, (isOpen) => {
    if (!isOpen) return
    printerStore.printError = null
    printerStore.loadPreferences()
})

function preventCloseWhilePrinting(event: Event) {
    if (isPrinting.value) event.preventDefault()
}

async function printJob() {
    const job = props.job
    if (!job) return
    const printed = await printerStore.print(buildJobDocument(job), 1)
    if (!printed) return
    toast.success(printedJobMessage(job, 1), { description: job.title })
    emit('printed', job)
    open.value = false
}
</script>

<template>
    <DialogRoot v-model:open="open">
        <DialogPortal>
            <DialogOverlay class="fixed inset-0 z-[70] bg-black/60 backdrop-blur-sm" />
            <DialogContent
                class="fixed left-1/2 top-1/2 z-[71] flex max-h-[92dvh] w-[calc(100vw-1.5rem)] max-w-lg -translate-x-1/2 -translate-y-1/2 flex-col overflow-hidden rounded-2xl border border-outline-variant bg-surface shadow-2xl focus:outline-none"
                @escape-key-down="preventCloseWhilePrinting"
                @pointer-down-outside="preventCloseWhilePrinting"
            >
                <header class="flex items-center gap-3 px-5 pb-2 pt-5 sm:px-6">
                    <div
                        class="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary"
                    >
                        <Printer class="size-5" aria-hidden="true" />
                    </div>
                    <div class="min-w-0 flex-1">
                        <DialogTitle class="font-display text-lg font-semibold text-on-surface">
                            {{ props.title }}
                        </DialogTitle>
                        <DialogDescription class="truncate text-xs text-on-surface-variant">
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

                <div class="min-h-0 flex-1 overflow-y-auto px-5 py-4 sm:px-6">
                    <PrinterQuickConnect />
                </div>

                <footer class="grid gap-3 px-5 pb-5 pt-1 sm:px-6">
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
                            Imprimiendo · {{ printerStore.progress.percent }} %
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

                    <div :class="['grid gap-3', job ? 'grid-cols-2' : 'grid-cols-1']">
                        <DialogClose as-child>
                            <UiButton variant="outline" :disabled="isPrinting">
                                {{ job ? 'Cancelar' : 'Listo' }}
                            </UiButton>
                        </DialogClose>
                        <UiButton
                            v-if="job"
                            :disabled="!canPrint"
                            :loading="isPrinting"
                            @click="printJob"
                        >
                            <Printer v-if="!isPrinting" />
                            {{ printButtonLabel }}
                        </UiButton>
                    </div>
                </footer>
            </DialogContent>
        </DialogPortal>
    </DialogRoot>
</template>
