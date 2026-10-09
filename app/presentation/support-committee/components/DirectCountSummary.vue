<script setup lang="ts">
import { ChevronDown } from '@lucide/vue'
import type { ReceptionCategoryResult } from '../interfaces/reception.interface'
import {
    categoryLabel,
    denominationKindLabel,
    denominationValueLabel,
    formatMoney,
} from '../utils/reception-format.util'

defineProps<{
    categories: ReceptionCategoryResult[]
    total: number
}>()
</script>

<template>
    <div class="overflow-hidden rounded-xl border border-outline-variant bg-surface">
        <div
            class="flex justify-between gap-4 border-b border-outline-variant bg-surface-container-low px-5 py-3 text-xs font-bold uppercase tracking-[0.16em] text-on-surface-variant"
        >
            <span>Tipo de ofrenda</span>
            <span>Contado</span>
        </div>

        <p
            v-if="categories.length === 0"
            class="px-5 py-6 text-center text-sm text-on-surface-variant"
        >
            No se contó dinero en este culto.
        </p>

        <article
            v-for="category in categories"
            :key="category.categoryId ?? 'sin-tipo'"
            class="border-b border-outline-variant last:border-b-0"
        >
            <div class="flex items-center justify-between gap-4 px-5 py-3.5">
                <h3 class="text-sm font-semibold text-on-surface">
                    {{ categoryLabel(category.categoryName) }}
                </h3>
                <p class="text-sm font-semibold tabular-nums text-on-surface">
                    {{ formatMoney(category.countedAmount) }}
                </p>
            </div>
            <details class="group border-t border-dashed border-outline-variant">
                <summary
                    class="flex cursor-pointer list-none items-center gap-1.5 px-5 py-2 text-xs font-semibold text-primary hover:underline"
                >
                    <ChevronDown
                        class="size-3.5 transition-transform group-open:rotate-180"
                        aria-hidden="true"
                    />
                    Ver billetes y monedas
                </summary>
                <ul class="grid gap-x-6 gap-y-1.5 px-5 pb-3 text-sm sm:grid-cols-2">
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
            </details>
        </article>

        <div
            class="flex items-center justify-between gap-4 border-t border-outline-variant bg-surface-container-low px-5 py-3.5"
        >
            <p class="text-xs font-bold uppercase tracking-[0.16em] text-on-surface">
                Ofrenda registrada
            </p>
            <p class="text-base font-bold tabular-nums text-on-surface">
                {{ formatMoney(total) }}
            </p>
        </div>
    </div>
</template>
