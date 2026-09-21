<script setup lang="ts">
import { computed, nextTick, onMounted, ref } from 'vue'

defineOptions({ name: 'SecurityCodeInput' })

const props = withDefaults(
    defineProps<{
        modelValue: string
        length?: number
        disabled?: boolean
        autofocus?: boolean
        inputmode?: 'numeric' | 'text'
        ariaLabel?: string
    }>(),
    {
        length: 6,
        inputmode: 'numeric',
        ariaLabel: 'Código de seguridad',
    },
)

const emit = defineEmits<{
    'update:modelValue': [value: string]
}>()

const inputs = ref<HTMLInputElement[]>([])
const slots = computed(() =>
    Array.from({ length: props.length }, (_, index) => props.modelValue[index] ?? ''),
)

function clean(value: string) {
    return value.replace(/[\s-]/g, '').toUpperCase()
}

function focusAt(index: number) {
    void nextTick(() => inputs.value[index]?.focus())
}

onMounted(() => {
    if (props.autofocus) focusAt(0)
})

function updateFrom(index: number, value: string) {
    const nextValue = clean(value)
    const chars = slots.value.slice()

    if (!nextValue) {
        chars[index] = ''
        emit('update:modelValue', chars.join('').slice(0, props.length))
        return
    }

    for (let offset = 0; offset < nextValue.length && index + offset < props.length; offset++) {
        chars[index + offset] = nextValue[offset]!
    }

    emit('update:modelValue', chars.join('').slice(0, props.length))
    focusAt(Math.min(index + nextValue.length, props.length - 1))
}

function onKeydown(event: KeyboardEvent, index: number) {
    if (event.key === 'Backspace' && !slots.value[index] && index > 0) {
        focusAt(index - 1)
    }

    if (event.key === 'ArrowLeft' && index > 0) {
        event.preventDefault()
        focusAt(index - 1)
    }

    if (event.key === 'ArrowRight' && index < props.length - 1) {
        event.preventDefault()
        focusAt(index + 1)
    }
}

function onPaste(event: ClipboardEvent, index: number) {
    const text = event.clipboardData?.getData('text') ?? ''
    if (!text) return

    event.preventDefault()
    updateFrom(index, text)
}
</script>

<template>
    <div class="flex flex-wrap gap-2" role="group" :aria-label="ariaLabel">
        <input
            v-for="(_, index) in length"
            :key="index"
            :ref="
                (element) => {
                    if (element) inputs[index] = element as HTMLInputElement
                }
            "
            :value="slots[index]"
            :disabled="disabled"
            :inputmode="inputmode"
            autocomplete="one-time-code"
            maxlength="1"
            class="h-11 w-10 rounded-md border border-outline-variant bg-background text-center font-mono text-base font-semibold text-on-surface transition focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 disabled:cursor-not-allowed disabled:opacity-50 sm:h-12 sm:w-11"
            @input="updateFrom(index, ($event.target as HTMLInputElement).value)"
            @keydown="onKeydown($event, index)"
            @paste="onPaste($event, index)"
        />
    </div>
</template>
