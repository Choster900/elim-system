<script setup lang="ts">
import type { LabelDocument } from '~/infrastructure/label-printing'
import { useLabelPreview } from '../composables/useLabelPreview'
import LabelPreview from './LabelPreview.vue'

const props = defineProps<{
    document: LabelDocument
    dpi: number
}>()

const { preview, previewError, rendering } = useLabelPreview(
    () => props.document,
    () => props.dpi,
)
</script>

<template>
    <LabelPreview :preview="preview" :error="previewError" :rendering="rendering" />
</template>
