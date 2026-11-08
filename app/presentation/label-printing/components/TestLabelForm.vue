<script setup lang="ts">
import { LABEL_SIZE_LIMITS_MM } from '~/infrastructure/label-printing'
import {
    LABEL_SIZE_PRESETS,
    TEST_LABEL_CODE_SAMPLES,
    TEST_LABEL_CODE_TYPES,
} from '../constants/label-printing.constants'
import type { TestLabelCodeType, TestLabelForm } from '../interfaces/test-label-form.interface'

const form = defineModel<TestLabelForm>({ required: true })

const fieldClass = 'grid gap-2'
const sampleValues = Object.values(TEST_LABEL_CODE_SAMPLES)

const codeHint = computed(
    () => TEST_LABEL_CODE_TYPES.find((type) => type.value === form.value.codeType)?.hint ?? '',
)

function selectCodeType(codeType: TestLabelCodeType) {
    const keepsCustomValue =
        form.value.codeValue.trim() && !sampleValues.includes(form.value.codeValue)
    form.value.codeType = codeType
    if (!keepsCustomValue) form.value.codeValue = TEST_LABEL_CODE_SAMPLES[codeType]
}

function selectSize(widthMm: number, heightMm: number) {
    form.value.widthMm = widthMm
    form.value.heightMm = heightMm
}

function isSelectedSize(widthMm: number, heightMm: number) {
    return form.value.widthMm === widthMm && form.value.heightMm === heightMm
}
</script>

<template>
    <div class="grid gap-5">
        <div :class="fieldClass">
            <UiLabel for="label-title">Título</UiLabel>
            <UiInput id="label-title" v-model="form.title" maxlength="60" autocomplete="off" />
        </div>
        <div :class="fieldClass">
            <UiLabel for="label-subtitle">Subtítulo</UiLabel>
            <UiInput
                id="label-subtitle"
                v-model="form.subtitle"
                maxlength="80"
                autocomplete="off"
                placeholder="Opcional"
            />
        </div>

        <div :class="fieldClass">
            <span class="text-sm font-medium leading-none text-foreground">Tipo de código</span>
            <div
                class="grid grid-cols-3 gap-1 rounded-lg border border-outline-variant bg-surface-container-low p-1"
                role="radiogroup"
                aria-label="Tipo de código"
            >
                <button
                    v-for="type in TEST_LABEL_CODE_TYPES"
                    :key="type.value"
                    type="button"
                    role="radio"
                    :aria-checked="form.codeType === type.value"
                    :class="[
                        'rounded-md px-3 py-1.5 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary',
                        form.codeType === type.value
                            ? 'bg-primary text-primary-foreground'
                            : 'text-on-surface-variant hover:text-on-surface',
                    ]"
                    @click="selectCodeType(type.value)"
                >
                    {{ type.label }}
                </button>
            </div>
        </div>
        <div :class="fieldClass">
            <UiLabel for="label-code">Contenido del código</UiLabel>
            <UiInput
                id="label-code"
                v-model="form.codeValue"
                class="font-mono"
                autocomplete="off"
                spellcheck="false"
            />
            <p class="text-xs text-on-surface-variant">{{ codeHint }}</p>
        </div>

        <div :class="fieldClass">
            <span class="text-sm font-medium leading-none text-foreground">Tamaño (mm)</span>
            <div class="grid grid-cols-4 gap-2">
                <button
                    v-for="preset in LABEL_SIZE_PRESETS"
                    :key="`${preset.widthMm}x${preset.heightMm}`"
                    type="button"
                    :aria-pressed="isSelectedSize(preset.widthMm, preset.heightMm)"
                    :class="[
                        'rounded-full border px-1 py-1 font-mono text-xs font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary',
                        isSelectedSize(preset.widthMm, preset.heightMm)
                            ? 'border-primary bg-primary/10 text-primary'
                            : 'border-outline-variant text-on-surface-variant hover:border-primary/60',
                    ]"
                    @click="selectSize(preset.widthMm, preset.heightMm)"
                >
                    {{ preset.widthMm }} × {{ preset.heightMm }}
                </button>
            </div>
            <div class="grid grid-cols-2 gap-3">
                <div :class="fieldClass">
                    <UiLabel for="label-width" class="text-xs text-on-surface-variant">
                        Ancho
                    </UiLabel>
                    <UiInput
                        id="label-width"
                        v-model.number="form.widthMm"
                        type="number"
                        :min="LABEL_SIZE_LIMITS_MM.min"
                        :max="LABEL_SIZE_LIMITS_MM.max"
                    />
                </div>
                <div :class="fieldClass">
                    <UiLabel for="label-height" class="text-xs text-on-surface-variant">
                        Alto
                    </UiLabel>
                    <UiInput
                        id="label-height"
                        v-model.number="form.heightMm"
                        type="number"
                        :min="LABEL_SIZE_LIMITS_MM.min"
                        :max="LABEL_SIZE_LIMITS_MM.max"
                    />
                </div>
            </div>
        </div>
    </div>
</template>
