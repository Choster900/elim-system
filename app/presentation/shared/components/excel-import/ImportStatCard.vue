<script setup lang="ts">
type ImportStatTone = 'neutral' | 'primary' | 'success' | 'warning' | 'danger'

const props = withDefaults(
    defineProps<{
        label: string
        value: number
        tone?: ImportStatTone
    }>(),
    { tone: 'neutral' },
)

const TONE_CLASSES: Record<ImportStatTone, { card: string; value: string }> = {
    neutral: { card: 'border-outline-variant bg-surface-container', value: 'text-on-surface' },
    primary: { card: 'border-primary/25 bg-primary/5', value: 'text-primary' },
    success: { card: 'border-emerald-500/30 bg-emerald-500/5', value: 'text-emerald-600' },
    warning: { card: 'border-amber-500/30 bg-amber-500/5', value: 'text-amber-600' },
    danger: { card: 'border-destructive/35 bg-destructive/5', value: 'text-destructive' },
}

const toneClasses = computed(() => TONE_CLASSES[props.tone])
</script>

<template>
    <div class="rounded-xl border p-4" :class="toneClasses.card">
        <p class="text-[10px] font-semibold uppercase tracking-wider text-on-surface-variant">
            {{ label }}
        </p>
        <p class="mt-1 font-display text-2xl font-semibold" :class="toneClasses.value">
            {{ value }}
        </p>
    </div>
</template>
