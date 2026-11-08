<script setup lang="ts">
import { LABEL_SIZE_LIMITS_MM, type LabelSize } from '~/infrastructure/label-printing'
import { LABEL_SIZE_PRESETS } from '../constants/label-printing.constants'

const props = withDefaults(defineProps<{ idPrefix: string; label?: string }>(), {
    label: 'Tamaño (mm)',
})

const size = defineModel<LabelSize>({ required: true })

const fieldClass = 'grid gap-2'

function toMm(value: string) {
    return value.trim() === '' ? Number.NaN : Number(value)
}

function toInputValue(valueMm: number) {
    return Number.isNaN(valueMm) ? '' : valueMm
}

function updateSide(side: keyof LabelSize, value: string) {
    size.value = { ...size.value, [side]: toMm(value) }
}

function isSelected(widthMm: number, heightMm: number) {
    return size.value.widthMm === widthMm && size.value.heightMm === heightMm
}
</script>

<template>
    <div :class="fieldClass">
        <span class="text-sm font-medium leading-none text-foreground">{{ props.label }}</span>
        <div class="grid grid-cols-4 gap-2" role="group" :aria-label="props.label">
            <button
                v-for="preset in LABEL_SIZE_PRESETS"
                :key="`${preset.widthMm}x${preset.heightMm}`"
                type="button"
                :aria-pressed="isSelected(preset.widthMm, preset.heightMm)"
                :class="[
                    'rounded-full border px-1 py-1 font-mono text-xs font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary',
                    isSelected(preset.widthMm, preset.heightMm)
                        ? 'border-primary bg-primary/10 text-primary'
                        : 'border-outline-variant text-on-surface-variant hover:border-primary/60',
                ]"
                @click="size = { widthMm: preset.widthMm, heightMm: preset.heightMm }"
            >
                {{ preset.widthMm }} × {{ preset.heightMm }}
            </button>
        </div>
        <div class="grid grid-cols-2 gap-3">
            <div :class="fieldClass">
                <UiLabel :for="`${props.idPrefix}-width`" class="text-xs text-on-surface-variant">
                    Ancho
                </UiLabel>
                <UiInput
                    :id="`${props.idPrefix}-width`"
                    :model-value="toInputValue(size.widthMm)"
                    type="number"
                    :min="LABEL_SIZE_LIMITS_MM.min"
                    :max="LABEL_SIZE_LIMITS_MM.max"
                    @update:model-value="updateSide('widthMm', $event)"
                />
            </div>
            <div :class="fieldClass">
                <UiLabel :for="`${props.idPrefix}-height`" class="text-xs text-on-surface-variant">
                    Alto
                </UiLabel>
                <UiInput
                    :id="`${props.idPrefix}-height`"
                    :model-value="toInputValue(size.heightMm)"
                    type="number"
                    :min="LABEL_SIZE_LIMITS_MM.min"
                    :max="LABEL_SIZE_LIMITS_MM.max"
                    @update:model-value="updateSide('heightMm', $event)"
                />
            </div>
        </div>
    </div>
</template>
