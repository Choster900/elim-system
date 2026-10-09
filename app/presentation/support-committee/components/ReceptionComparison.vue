<script setup lang="ts">
import { ChevronDown } from '@lucide/vue'
import type { ReceptionCategoryResult } from '../interfaces/reception.interface'
import {
    categoryLabel,
    denominationKindLabel,
    denominationValueLabel,
    differenceLabel,
    formatMoney,
    toCents,
} from '../utils/reception-format.util'

defineProps<{
    categories: ReceptionCategoryResult[]
    registeredAmount: number
    countedAmount: number
    difference: number
}>()

function differenceClass(difference: number) {
    return toCents(difference) === 0
        ? 'text-emerald-700 dark:text-emerald-300'
        : 'text-amber-700 dark:text-amber-300'
}
</script>

<template>
    <div class="overflow-hidden rounded-xl border border-outline-variant bg-surface">
        <div
            class="hidden grid-cols-[1fr_repeat(3,minmax(0,9rem))] gap-4 border-b border-outline-variant bg-surface-container-low px-5 py-3 text-[10px] font-bold uppercase tracking-[0.16em] text-on-surface-variant sm:grid"
        >
            <span>Tipo de ofrenda</span>
            <span class="text-right">Registró el líder</span>
            <span class="text-right">Contó el comité</span>
            <span class="text-right">Resultado</span>
        </div>

        <article
            v-for="category in categories"
            :key="category.categoryId ?? 'sin-tipo'"
            class="border-b border-outline-variant last:border-b-0"
        >
            <div
                class="grid grid-cols-2 gap-x-4 gap-y-2 px-5 py-4 sm:grid-cols-[1fr_repeat(3,minmax(0,9rem))] sm:items-center"
            >
                <h3 class="col-span-2 text-base font-semibold text-on-surface sm:col-span-1">
                    {{ categoryLabel(category.categoryName) }}
                </h3>
                <p class="text-sm tabular-nums text-on-surface-variant sm:text-right">
                    <span class="mr-1 text-[11px] sm:hidden">Líder:</span>
                    {{ formatMoney(category.registeredAmount) }}
                </p>
                <p class="text-right text-sm font-semibold tabular-nums text-on-surface">
                    <span class="mr-1 text-[11px] font-normal text-on-surface-variant sm:hidden">
                        Comité:
                    </span>
                    {{ formatMoney(category.countedAmount) }}
                </p>
                <p
                    class="col-span-2 text-sm font-semibold sm:col-span-1 sm:text-right"
                    :class="differenceClass(category.difference)"
                >
                    {{ differenceLabel(category.difference) }}
                </p>
            </div>

            <details class="group border-t border-dashed border-outline-variant">
                <summary
                    class="flex cursor-pointer list-none items-center gap-1.5 px-5 py-2.5 text-xs font-semibold text-primary hover:underline"
                >
                    <ChevronDown class="size-3.5 transition-transform group-open:rotate-180" />
                    Ver billetes y monedas
                </summary>
                <ul
                    v-if="category.counts.length > 0"
                    class="grid gap-x-6 gap-y-1.5 px-5 pb-4 text-sm sm:grid-cols-2"
                >
                    <li
                        v-for="count in category.counts"
                        :key="count.denomination.id"
                        class="flex items-baseline justify-between gap-3 tabular-nums"
                    >
                        <span class="text-on-surface-variant">
                            {{ count.quantity }} ×
                            <strong class="text-on-surface">
                                {{ denominationValueLabel(count.denomination) }}
                            </strong>
                            <span class="text-xs">
                                {{ denominationKindLabel(count.denomination).toLowerCase() }}
                            </span>
                        </span>
                        <span class="font-semibold text-on-surface">
                            {{ formatMoney(count.amount) }}
                        </span>
                    </li>
                </ul>
                <p v-else class="px-5 pb-4 text-sm text-on-surface-variant">
                    No se contó dinero de este tipo.
                </p>
            </details>
        </article>

        <div
            class="grid grid-cols-2 gap-x-4 gap-y-1 border-t border-outline-variant bg-surface-container-low px-5 py-4 sm:grid-cols-[1fr_repeat(3,minmax(0,9rem))] sm:items-center"
        >
            <p
                class="col-span-2 text-xs font-bold uppercase tracking-[0.16em] text-on-surface sm:col-span-1"
            >
                Total del sobre
            </p>
            <p class="text-sm font-semibold tabular-nums text-on-surface-variant sm:text-right">
                {{ formatMoney(registeredAmount) }}
            </p>
            <p class="text-right text-base font-bold tabular-nums text-on-surface">
                {{ formatMoney(countedAmount) }}
            </p>
            <p
                class="col-span-2 text-sm font-bold sm:col-span-1 sm:text-right"
                :class="differenceClass(difference)"
            >
                {{ differenceLabel(difference) }}
            </p>
        </div>
    </div>
</template>
