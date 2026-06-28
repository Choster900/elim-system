<script setup lang="ts">
import type { Component } from 'vue'

defineProps<{
    icon: Component
    label: string
    value: string
    meta: string
    positive?: boolean
}>()
</script>

<template>
    <UiCard class="group rounded p-8 transition-all duration-300 hover:border-primary">
        <component :is="icon" class="mb-6 size-8 text-primary" />
        <p class="mb-1 text-xs font-semibold uppercase text-on-surface-variant">{{ label }}</p>
        <h3 class="font-display text-3xl font-semibold text-on-surface">{{ value }}</h3>
        <p :class="['mt-2 text-xs', positive ? 'text-primary' : 'text-on-surface-variant']">
            {{ meta }}
        </p>
    </UiCard>
</template>
