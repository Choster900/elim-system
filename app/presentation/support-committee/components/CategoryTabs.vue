<script setup lang="ts">
import { Check, ClipboardCheck, Plus } from '@lucide/vue'
import { formatMoney } from '../utils/reception-format.util'

export interface CategoryStep {
    key: string
    label: string
    amount: number
    hasCounts: boolean
    isExtra: boolean
}

const props = defineProps<{
    steps: CategoryStep[]
    current: number
    canAdd: boolean
    isAdding: boolean
    panelId: string
}>()

const emit = defineEmits<{
    select: [index: number]
    add: []
    review: []
}>()

function tabId(step: CategoryStep) {
    return `category-tab-${step.key}`
}

function tabClass(index: number, step: CategoryStep) {
    if (index === props.current) {
        return 'border-primary bg-primary text-primary-foreground shadow-md shadow-primary/20'
    }
    if (step.hasCounts) {
        return 'border-primary/50 bg-primary/10 text-on-surface hover:border-primary'
    }
    return 'border-outline-variant bg-surface text-on-surface-variant hover:border-primary hover:text-on-surface'
}

function amountClass(index: number, step: CategoryStep) {
    if (index === props.current) return 'text-primary-foreground/85'
    return step.hasCounts ? 'font-semibold text-primary' : 'text-on-surface-variant/70'
}

function amountLabel(step: CategoryStep) {
    if (step.hasCounts) return formatMoney(step.amount)
    return step.isExtra ? 'Agregado' : 'Sin contar'
}

function onKeydown(event: KeyboardEvent, index: number) {
    const offsets: Record<string, number> = { ArrowRight: 1, ArrowLeft: -1 }
    const offset = offsets[event.key]
    if (offset === undefined) return
    event.preventDefault()
    const next = (index + offset + props.steps.length) % props.steps.length
    emit('select', next)
    const step = props.steps[next]
    if (step) nextTick(() => document.getElementById(tabId(step))?.focus())
}
</script>

<template>
    <div class="flex items-center gap-3">
        <div
            role="tablist"
            aria-label="Tipos de ofrenda del sobre"
            class="flex min-w-0 flex-1 gap-2 overflow-x-auto p-1"
        >
            <button
                v-for="(step, index) in steps"
                :id="tabId(step)"
                :key="step.key"
                type="button"
                role="tab"
                :aria-selected="index === current"
                :aria-controls="panelId"
                :tabindex="index === current ? 0 : -1"
                class="flex min-w-[9.5rem] shrink-0 flex-col items-start gap-0.5 rounded-lg border-2 px-4 py-2.5 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-surface"
                :class="tabClass(index, step)"
                @click="emit('select', index)"
                @keydown="onKeydown($event, index)"
            >
                <span class="flex items-center gap-1.5 text-sm font-bold">
                    <Check v-if="step.hasCounts" class="size-3.5 shrink-0" aria-hidden="true" />
                    {{ step.label }}
                </span>
                <span class="text-xs tabular-nums" :class="amountClass(index, step)">
                    {{ amountLabel(step) }}
                </span>
            </button>
            <button
                v-if="canAdd"
                type="button"
                class="inline-flex shrink-0 items-center gap-1.5 self-stretch rounded-lg border-2 border-dashed px-4 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                :class="
                    isAdding
                        ? 'border-primary bg-primary/10 text-primary'
                        : 'border-outline-variant text-on-surface-variant hover:border-primary hover:text-primary'
                "
                :aria-expanded="isAdding"
                @click="emit('add')"
            >
                <Plus class="size-4" aria-hidden="true" />
                Agregar tipo
            </button>
        </div>
        <button
            type="button"
            class="hidden shrink-0 items-center gap-1.5 rounded-lg border border-outline-variant bg-surface px-3 py-2 text-sm font-semibold text-on-surface-variant transition-colors hover:border-primary hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary sm:inline-flex"
            @click="emit('review')"
        >
            <ClipboardCheck class="size-4" aria-hidden="true" />
            Revisar
        </button>
    </div>
</template>
