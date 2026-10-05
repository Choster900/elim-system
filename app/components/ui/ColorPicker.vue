<script setup lang="ts">
import { Check, Pipette } from '@lucide/vue'
import { contrastColor, normalizeHexColor } from '~/utils/color/color.util'

const props = withDefaults(
    defineProps<{
        modelValue: string
        palette: readonly string[]
        id?: string
    }>(),
    { id: 'color-picker' },
)

const emit = defineEmits<{
    'update:modelValue': [value: string]
}>()

const customColor = ref(props.modelValue.toUpperCase())
const colorError = ref('')

watch(
    () => props.modelValue,
    (color) => {
        customColor.value = color.toUpperCase()
        colorError.value = ''
    },
)

function isSelected(color: string) {
    return props.modelValue.toLowerCase() === color.toLowerCase()
}

function setColor(color: string) {
    colorError.value = ''
    emit('update:modelValue', color.toLowerCase())
}

function applyCustomColor() {
    const color = normalizeHexColor(customColor.value)
    if (!color) {
        colorError.value = 'Usa un hexadecimal de 6 caracteres, por ejemplo #E9C176.'
        return
    }
    setColor(color)
}

function onNativeInput(event: Event) {
    setColor((event.target as HTMLInputElement).value)
}
</script>

<template>
    <div class="rounded-xl border border-outline-variant bg-surface-container p-4">
        <div class="flex flex-wrap items-center gap-4">
            <label
                :for="`${id}-native`"
                class="group relative flex size-14 shrink-0 cursor-pointer items-center justify-center overflow-hidden rounded-xl border border-outline-variant shadow-sm transition-transform focus-within:ring-2 focus-within:ring-primary hover:scale-[1.03]"
                title="Abrir selector de color"
            >
                <input
                    :id="`${id}-native`"
                    :value="modelValue"
                    type="color"
                    class="absolute inset-0 size-full cursor-pointer opacity-0"
                    aria-label="Seleccionar un color personalizado"
                    @input="onNativeInput"
                />
                <span class="absolute inset-0" :style="{ backgroundColor: modelValue }" />
                <Pipette
                    class="relative size-5 drop-shadow-sm"
                    :style="{ color: contrastColor(modelValue) }"
                />
            </label>

            <div class="min-w-0 flex-1">
                <p class="text-sm font-semibold text-on-surface">Color personalizado</p>
                <p class="mt-0.5 text-xs text-on-surface-variant">
                    Haz clic en la muestra para abrir el selector completo.
                </p>
            </div>

            <slot name="preview" :color="modelValue" :text-color="contrastColor(modelValue)" />
        </div>

        <!-- flex-wrap en vez de breakpoints: se acomoda al ancho del contenedor (drawer o página) -->
        <div class="mt-4 flex flex-wrap gap-4">
            <div class="min-w-48 flex-[2_1_14rem]">
                <p
                    class="text-[10px] font-semibold uppercase tracking-wider text-on-surface-variant"
                >
                    Paleta sugerida
                </p>
                <div class="mt-2 flex flex-wrap items-center gap-2.5">
                    <button
                        v-for="color in palette"
                        :key="color"
                        type="button"
                        class="flex size-8 items-center justify-center rounded-full border border-black/10 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-surface-container"
                        :class="
                            isSelected(color)
                                ? 'ring-2 ring-primary ring-offset-2 ring-offset-surface-container'
                                : ''
                        "
                        :style="{ backgroundColor: color }"
                        :aria-label="`Usar color ${color}`"
                        :aria-pressed="isSelected(color)"
                        @click="setColor(color)"
                    >
                        <Check
                            v-if="isSelected(color)"
                            class="size-4"
                            :style="{ color: contrastColor(color) }"
                        />
                    </button>
                </div>
            </div>

            <div class="min-w-44 flex-[1_1_11rem]">
                <label
                    :for="`${id}-hex`"
                    class="text-[10px] font-semibold uppercase tracking-wider text-on-surface-variant"
                >
                    Código hexadecimal
                </label>
                <div class="mt-2 flex gap-2">
                    <input
                        :id="`${id}-hex`"
                        v-model="customColor"
                        type="text"
                        maxlength="7"
                        spellcheck="false"
                        autocomplete="off"
                        class="h-10 min-w-0 flex-1 rounded border border-outline-variant bg-surface px-3 font-mono text-sm uppercase text-on-surface focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                        :aria-invalid="!!colorError"
                        @keydown.enter.prevent="applyCustomColor"
                    />
                    <button
                        type="button"
                        class="h-10 rounded border border-outline-variant bg-surface px-3 text-xs font-semibold text-on-surface transition-colors hover:border-primary hover:text-primary"
                        @click="applyCustomColor"
                    >
                        Aplicar
                    </button>
                </div>
                <p v-if="colorError" class="mt-1.5 text-xs text-destructive">
                    {{ colorError }}
                </p>
            </div>
        </div>
    </div>
</template>
