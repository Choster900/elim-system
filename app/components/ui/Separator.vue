<script setup lang="ts">
import { cn } from '@lib/utils'

const props = defineProps<{
    class?: string
    orientation?: 'horizontal' | 'vertical'
    decorative?: boolean
}>()
</script>

<template>
    <div
        :role="decorative ? 'none' : 'separator'"
        :aria-orientation="orientation ?? 'horizontal'"
        :class="cn(
            'shrink-0 bg-border',
            (orientation ?? 'horizontal') === 'horizontal' ? 'h-px w-full' : 'h-full w-px',
            props.class,
        )"
    />
</template>
