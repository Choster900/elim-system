<script setup lang="ts">
withDefaults(defineProps<{ tone?: 'info' | 'warning' }>(), { tone: 'info' })
</script>

<template>
    <p
        class="mt-4 rounded-xl border p-4 text-xs leading-relaxed text-on-surface-variant"
        :class="
            tone === 'warning'
                ? 'border-amber-500/30 bg-amber-500/5'
                : 'border-primary/25 bg-primary/5'
        "
    >
        <slot />
    </p>
</template>
