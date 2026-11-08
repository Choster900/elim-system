<script setup lang="ts">
import type { LabelSize } from '~/infrastructure/label-printing'
import {
    TEST_LABEL_CODE_SAMPLES,
    TEST_LABEL_CODE_TYPES,
} from '../constants/label-printing.constants'
import type { TestLabelCodeType, TestLabelForm } from '../interfaces/test-label-form.interface'
import LabelSizeField from './LabelSizeField.vue'

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

const size = computed<LabelSize>({
    get: () => ({ widthMm: form.value.widthMm, heightMm: form.value.heightMm }),
    set: (value) => {
        form.value.widthMm = value.widthMm
        form.value.heightMm = value.heightMm
    },
})
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

        <LabelSizeField v-model="size" id-prefix="label" />
    </div>
</template>
