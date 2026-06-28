<script setup lang="ts">
import { cn } from '@lib/utils'

const props = defineProps<{
    class?: string
}>()
</script>

<template>
    <article
        :class="cn(
            'rounded-lg border border-outline-variant bg-card text-card-foreground',
            props.class,
        )"
    >
        <slot />
    </article>
</template>
