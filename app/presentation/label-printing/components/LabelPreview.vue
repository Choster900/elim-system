<script setup lang="ts">
import { CircleAlert, Loader2 } from '@lucide/vue'
import type { LabelPreviewImage } from '../composables/useLabelPreview'

const CSS_PX_PER_MM = 5

const props = defineProps<{
    preview: LabelPreviewImage | null
    error: string | null
    rendering: boolean
}>()

const paperStyle = computed(() => {
    if (!props.preview) return { width: '15.625rem', aspectRatio: '5 / 3' }
    const widthMm = (props.preview.widthPx * 25.4) / props.preview.dpi
    return {
        width: `min(100%, ${Math.round(widthMm * CSS_PX_PER_MM)}px)`,
        aspectRatio: `${props.preview.widthPx} / ${props.preview.heightPx}`,
    }
})

const caption = computed(() => {
    if (!props.preview) return 'Generando vista previa…'
    const { widthPx, heightPx, dpi } = props.preview
    const toMm = (px: number) => Math.round((px * 25.4) / dpi)
    return `${toMm(widthPx)} × ${toMm(heightPx)} mm · ${dpi} dpi · ${widthPx} × ${heightPx} px`
})
</script>

<template>
    <div class="grid gap-3">
        <div
            class="relative flex min-h-52 items-center justify-center rounded-xl border border-outline-variant bg-surface-container-low p-6"
        >
            <div
                :class="[
                    'overflow-hidden rounded-md bg-white shadow-lg ring-1 ring-black/10 transition-opacity',
                    error ? 'opacity-40' : '',
                ]"
                :style="paperStyle"
            >
                <img
                    v-if="preview"
                    :src="preview.url"
                    alt="Vista previa de la etiqueta"
                    class="block size-full [image-rendering:pixelated]"
                />
            </div>
            <Loader2
                v-if="rendering"
                class="absolute right-3 top-3 size-4 animate-spin text-on-surface-variant"
                aria-hidden="true"
            />
        </div>
        <p
            v-if="error"
            class="flex items-start gap-2 rounded-md border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive"
            role="alert"
        >
            <CircleAlert class="mt-0.5 size-4 shrink-0" aria-hidden="true" />
            {{ error }}
        </p>
        <p v-else class="text-center font-mono text-xs text-on-surface-variant">{{ caption }}</p>
    </div>
</template>
