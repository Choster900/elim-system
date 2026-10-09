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
}>()

const emit = defineEmits<{
    select: [index: number]
    add: []
    review: []
}>()

function circleClass(index: number, step: CategoryStep) {
    if (index === props.current) {
        return 'border-primary bg-primary text-primary-foreground ring-4 ring-primary/20'
    }
    if (step.hasCounts) return 'border-primary bg-primary/10 text-primary'
    return 'border-outline-variant bg-surface text-on-surface-variant group-hover:border-primary'
}

function caption(index: number, step: CategoryStep) {
    if (step.hasCounts) return formatMoney(step.amount)
    if (step.isExtra) return 'Agregado'
    if (index < props.current) return 'Sin dinero'
    return ''
}
</script>

<template>
    <nav class="overflow-x-auto" aria-label="Tipos de ofrenda a contar">
        <ol class="flex min-w-max items-start sm:min-w-0">
            <li
                v-for="(step, index) in steps"
                :key="step.key"
                class="relative flex min-w-[84px] flex-1 justify-center"
            >
                <span
                    class="absolute left-[calc(50%+1.125rem)] right-[calc(-50%+1.125rem)] top-[17px] h-0.5 rounded-full"
                    :class="index < current ? 'bg-primary' : 'bg-outline-variant'"
                    aria-hidden="true"
                />
                <button
                    type="button"
                    class="group flex flex-col items-center gap-1.5 px-1 text-center focus-visible:outline-none"
                    :aria-current="index === current ? 'step' : undefined"
                    @click="emit('select', index)"
                >
                    <span
                        class="relative z-10 flex size-9 items-center justify-center rounded-full border-2 text-sm font-bold tabular-nums transition-colors group-focus-visible:ring-2 group-focus-visible:ring-primary"
                        :class="circleClass(index, step)"
                    >
                        <Check v-if="step.hasCounts && index !== current" class="size-4" />
                        <template v-else>{{ index + 1 }}</template>
                    </span>
                    <span
                        class="max-w-[7rem] text-xs font-semibold leading-tight"
                        :class="index === current ? 'text-on-surface' : 'text-on-surface-variant'"
                    >
                        {{ step.label }}
                    </span>
                    <span
                        class="h-4 text-[11px] tabular-nums"
                        :class="
                            step.hasCounts
                                ? 'font-semibold text-primary'
                                : 'text-on-surface-variant/70'
                        "
                    >
                        {{ caption(index, step) }}
                    </span>
                </button>
            </li>
            <li v-if="canAdd" class="relative flex min-w-[84px] flex-1 justify-center">
                <span
                    class="absolute left-[calc(50%+1.125rem)] right-[calc(-50%+1.125rem)] top-[17px] h-0.5 rounded-full bg-outline-variant"
                    aria-hidden="true"
                />
                <button
                    type="button"
                    class="group flex flex-col items-center gap-1.5 px-1 text-center focus-visible:outline-none"
                    :aria-expanded="isAdding"
                    @click="emit('add')"
                >
                    <span
                        class="relative z-10 flex size-9 items-center justify-center rounded-full border-2 border-dashed transition-colors group-focus-visible:ring-2 group-focus-visible:ring-primary"
                        :class="
                            isAdding
                                ? 'border-primary bg-primary/10 text-primary'
                                : 'border-outline-variant bg-surface text-on-surface-variant group-hover:border-primary group-hover:text-primary'
                        "
                    >
                        <Plus class="size-4" />
                    </span>
                    <span
                        class="text-xs font-semibold leading-tight"
                        :class="isAdding ? 'text-primary' : 'text-on-surface-variant'"
                    >
                        Agregar tipo
                    </span>
                    <span class="h-4" />
                </button>
            </li>
            <li class="flex min-w-[84px] flex-1 justify-center">
                <button
                    type="button"
                    class="group flex flex-col items-center gap-1.5 px-1 text-center focus-visible:outline-none"
                    @click="emit('review')"
                >
                    <span
                        class="relative z-10 flex size-9 items-center justify-center rounded-full border-2 border-outline-variant bg-surface text-on-surface-variant transition-colors group-hover:border-primary group-hover:text-primary group-focus-visible:ring-2 group-focus-visible:ring-primary"
                    >
                        <ClipboardCheck class="size-4" />
                    </span>
                    <span class="text-xs font-semibold leading-tight text-on-surface-variant">
                        Revisar
                    </span>
                    <span class="h-4" />
                </button>
            </li>
        </ol>
    </nav>
</template>
