<script setup lang="ts">
import { Check } from '@lucide/vue'

const props = defineProps<{
    current: 1 | 2 | 3
}>()

const steps = [
    { number: 1, label: 'Contar' },
    { number: 2, label: 'Revisar' },
    { number: 3, label: 'Listo' },
] as const

function stateOf(step: number) {
    if (step < props.current) return 'done'
    if (step === props.current) return 'current'
    return 'upcoming'
}
</script>

<template>
    <ol class="flex items-center gap-2 sm:gap-3" aria-label="Pasos para recibir un sobre">
        <li
            v-for="(step, index) in steps"
            :key="step.number"
            class="flex items-center gap-2 sm:gap-3"
            :aria-current="stateOf(step.number) === 'current' ? 'step' : undefined"
        >
            <span
                class="flex size-7 shrink-0 items-center justify-center rounded-full border text-xs font-bold tabular-nums"
                :class="{
                    'border-primary bg-primary text-primary-foreground':
                        stateOf(step.number) !== 'upcoming',
                    'border-outline-variant bg-surface text-on-surface-variant':
                        stateOf(step.number) === 'upcoming',
                }"
            >
                <Check v-if="stateOf(step.number) === 'done'" class="size-3.5" />
                <template v-else>{{ step.number }}</template>
            </span>
            <span
                class="text-sm font-semibold"
                :class="
                    stateOf(step.number) === 'current'
                        ? 'text-on-surface'
                        : 'text-on-surface-variant'
                "
            >
                {{ step.label }}
            </span>
            <span
                v-if="index < steps.length - 1"
                class="h-px w-6 bg-outline-variant sm:w-10"
                aria-hidden="true"
            />
        </li>
    </ol>
</template>
