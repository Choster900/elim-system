<script setup lang="ts">
import { cn } from '@lib/utils'

defineOptions({ inheritAttrs: false })

const props = defineProps<{
    modelValue?: string | number
    class?: string
}>()

const emit = defineEmits<{
    'update:modelValue': [value: string]
}>()
</script>

<template>
    <input
        :class="cn(
            'flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 transition-colors',
            props.class,
        )"
        :value="modelValue"
        v-bind="$attrs"
        @input="emit('update:modelValue', ($event.target as HTMLInputElement).value)"
    />
</template>
