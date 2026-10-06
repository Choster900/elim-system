<script setup lang="ts">
import { Download, FileDown, FileSpreadsheet, LoaderCircle, Upload } from '@lucide/vue'
import {
    DialogClose,
    DialogContent,
    DialogDescription,
    DialogOverlay,
    DialogPortal,
    DialogRoot,
    DialogTitle,
} from 'radix-vue'

withDefaults(
    defineProps<{
        title: string
        fileName: string
        parsing: boolean
        templateHint?: string
        downloadingTemplate?: boolean
        errors: string[]
        errorsTitle: string
        hasResult: boolean
        canDownloadPending: boolean
        downloadingPending?: boolean
        confirmLabel: string
        confirming?: boolean
        confirmDisabled?: boolean
    }>(),
    {
        templateHint:
            'Descarga la plantilla si necesitas las columnas y los catálogos actualizados.',
        downloadingTemplate: false,
        downloadingPending: false,
        confirming: false,
        confirmDisabled: false,
    },
)

const open = defineModel<boolean>('open', { required: true })

const emit = defineEmits<{
    'download-template': []
    file: [file: File]
    'download-pending': []
    confirm: []
}>()

const fileInput = ref<HTMLInputElement | null>(null)
const isDropActive = ref(false)

function pickFile() {
    fileInput.value?.click()
}

function onFileChange(event: Event) {
    const input = event.target as HTMLInputElement
    const file = input.files?.[0]
    input.value = ''
    if (file) emit('file', file)
}

function onDrop(event: DragEvent) {
    isDropActive.value = false
    const file = event.dataTransfer?.files?.[0]
    if (file) emit('file', file)
}
</script>

<template>
    <DialogRoot v-model:open="open">
        <DialogPortal>
            <DialogOverlay class="fixed inset-0 z-[70] bg-black/60 backdrop-blur-sm" />
            <DialogContent
                class="fixed left-1/2 top-1/2 z-[71] max-h-[88vh] w-[96vw] max-w-3xl -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-2xl border border-outline-variant bg-surface p-6 shadow-2xl focus:outline-none sm:p-7"
            >
                <input
                    ref="fileInput"
                    type="file"
                    accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                    class="hidden"
                    @change="onFileChange"
                />

                <div class="flex items-start gap-4">
                    <div
                        class="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary"
                    >
                        <FileSpreadsheet class="size-6" />
                    </div>
                    <div class="min-w-0">
                        <DialogTitle class="font-display text-xl font-semibold text-on-surface">
                            {{ title }}
                        </DialogTitle>
                        <DialogDescription class="mt-1 truncate text-sm text-on-surface-variant">
                            {{
                                fileName || 'Descarga la plantilla o sube un archivo de Excel .xlsx'
                            }}
                        </DialogDescription>
                    </div>
                </div>

                <div v-if="!fileName || parsing" class="mt-6 space-y-5">
                    <div
                        class="flex flex-col gap-4 rounded-2xl border border-outline-variant bg-surface-container-low p-4 sm:flex-row sm:items-center sm:justify-between"
                    >
                        <div>
                            <p class="text-sm font-semibold text-on-surface">
                                ¿Ya tienes el archivo listo?
                            </p>
                            <p class="mt-1 text-xs leading-5 text-on-surface-variant">
                                {{ templateHint }}
                            </p>
                        </div>
                        <div class="flex shrink-0 flex-wrap gap-2">
                            <UiButton
                                variant="outline"
                                type="button"
                                class="border-primary/40 bg-surface hover:bg-primary hover:text-primary-foreground"
                                :loading="downloadingTemplate"
                                @click="emit('download-template')"
                            >
                                <FileDown class="size-4" />
                                Descargar plantilla
                            </UiButton>
                            <UiButton
                                type="button"
                                class="shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-lg active:translate-y-0"
                                :loading="parsing"
                                :disabled="parsing"
                                @click="pickFile"
                            >
                                <Upload class="size-4" />
                                Importar
                            </UiButton>
                        </div>
                    </div>

                    <button
                        type="button"
                        class="group flex w-full cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed px-6 py-10 text-center transition-all duration-200 hover:-translate-y-0.5 hover:border-primary hover:bg-primary/10 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 sm:py-12"
                        :class="
                            isDropActive
                                ? 'border-primary bg-primary/10 text-primary'
                                : 'border-outline-variant bg-surface-container-low text-on-surface-variant hover:border-primary/60 hover:bg-primary/5'
                        "
                        :disabled="parsing"
                        @click="pickFile"
                        @dragenter.prevent="isDropActive = true"
                        @dragover.prevent="isDropActive = true"
                        @dragleave.self.prevent="isDropActive = false"
                        @drop.prevent="onDrop"
                    >
                        <span
                            class="flex size-14 items-center justify-center rounded-2xl bg-surface text-primary shadow-sm transition-transform duration-200 group-hover:scale-110"
                        >
                            <Upload v-if="!parsing" class="size-6" />
                            <LoaderCircle v-else class="size-6 animate-spin" />
                        </span>
                        <span class="mt-4 text-sm font-semibold text-on-surface">
                            {{
                                parsing
                                    ? 'Analizando el archivo…'
                                    : 'Arrastra aquí tu archivo de Excel'
                            }}
                        </span>
                        <span class="mt-1 text-xs leading-5">
                            {{
                                parsing ? fileName : 'o haz clic para seleccionar un archivo .xlsx'
                            }}
                        </span>
                    </button>

                    <p class="text-center text-xs leading-5 text-on-surface-variant">
                        Revisaremos el archivo antes de guardar. Las filas válidas se podrán
                        importar aunque otras tengan errores.
                    </p>

                    <div class="flex justify-end">
                        <DialogClose as-child>
                            <UiButton
                                variant="outline"
                                type="button"
                                class="bg-surface hover:bg-surface-container"
                            >
                                Cancelar
                            </UiButton>
                        </DialogClose>
                    </div>
                </div>

                <template v-else>
                    <div class="mt-6">
                        <slot name="summary" />
                    </div>

                    <div
                        v-if="errors.length"
                        class="mt-4 rounded-xl border border-destructive/30 bg-destructive/5 p-4"
                    >
                        <p class="text-xs font-semibold text-destructive">{{ errorsTitle }}</p>
                        <ul
                            class="mt-2 max-h-52 list-disc space-y-1 overflow-y-auto pl-5 text-xs leading-5 text-on-surface-variant"
                        >
                            <li v-for="error in errors" :key="error">
                                {{ error }}
                            </li>
                        </ul>
                    </div>

                    <slot name="notes" />

                    <div class="mt-6 flex flex-wrap justify-end gap-2">
                        <DialogClose as-child>
                            <UiButton
                                variant="outline"
                                type="button"
                                class="bg-surface hover:bg-surface-container"
                            >
                                {{ hasResult ? 'Cerrar' : 'Cancelar' }}
                            </UiButton>
                        </DialogClose>
                        <UiButton
                            v-if="canDownloadPending"
                            variant="outline"
                            type="button"
                            class="bg-surface hover:bg-surface-container"
                            :loading="downloadingPending"
                            @click="emit('download-pending')"
                        >
                            <Download class="size-4" />
                            Descargar pendientes
                        </UiButton>
                        <UiButton
                            v-if="!hasResult"
                            type="button"
                            :loading="confirming"
                            :disabled="confirming || confirmDisabled"
                            @click="emit('confirm')"
                        >
                            <Upload class="size-4" />
                            {{ confirmLabel }}
                        </UiButton>
                    </div>
                </template>
            </DialogContent>
        </DialogPortal>
    </DialogRoot>
</template>
