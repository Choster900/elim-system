<script setup lang="ts">
const props = withDefaults(
    defineProps<{
        to?: string
        compact?: boolean
    }>(),
    {
        to: '/',
        compact: false,
    },
)
</script>

<template>
    <NuxtLink
        :to="props.to"
        class="font-display text-2xl font-bold text-primary transition-opacity hover:opacity-80"
    >
        {{ props.compact ? 'R' : 'Elim' }}
    </NuxtLink>
</template>
