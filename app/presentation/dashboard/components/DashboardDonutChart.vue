<script setup lang="ts">
import { computed } from 'vue'

interface DonutItem {
    id: number
    name: string
    value: number
    percentage: number
}

const props = defineProps<{
    items: DonutItem[]
    totalLabel: string
}>()

const colors = [
    'var(--chart-1)',
    'var(--chart-2)',
    'var(--chart-3)',
    'var(--chart-4)',
    'var(--chart-5)',
]
const total = computed(() => props.items.reduce((sum, item) => sum + item.value, 0))
const gradient = computed(() => {
    if (total.value <= 0) return 'conic-gradient(var(--outline-variant) 0 100%)'

    let cursor = 0
    const stops = props.items.map((item, index) => {
        const start = cursor
        cursor += item.percentage
        return `${colors[index % colors.length]} ${start}% ${cursor}%`
    })
    return `conic-gradient(${stops.join(', ')})`
})

function formatMoney(value: number) {
    return new Intl.NumberFormat('es-SV', {
        style: 'currency',
        currency: 'USD',
        notation: value >= 10000 ? 'compact' : 'standard',
        minimumFractionDigits: value >= 10000 ? 0 : 2,
        maximumFractionDigits: value >= 10000 ? 1 : 2,
    }).format(value)
}
</script>

<template>
    <div class="grid items-center gap-7 sm:grid-cols-[190px_1fr]">
        <div
            class="relative mx-auto aspect-square w-44 rounded-full"
            :style="{ background: gradient }"
            role="img"
            :aria-label="`Distribución de ofrendas. Total ${formatMoney(total)}`"
        >
            <div
                class="absolute inset-[22%] flex flex-col items-center justify-center rounded-full bg-surface text-center shadow-inner"
            >
                <strong class="font-display text-xl text-on-surface">{{
                    formatMoney(total)
                }}</strong>
                <span
                    class="mt-1 max-w-20 text-[9px] font-semibold uppercase tracking-wider text-on-surface-variant"
                >
                    {{ totalLabel }}
                </span>
            </div>
        </div>

        <div v-if="items.length" class="space-y-3">
            <div
                v-for="(item, index) in items"
                :key="item.id"
                class="grid grid-cols-[1fr_auto] gap-3"
            >
                <div class="flex min-w-0 items-center gap-2.5">
                    <span
                        class="size-2.5 flex-none rounded-full"
                        :style="{ backgroundColor: colors[index % colors.length] }"
                    />
                    <span class="truncate text-xs text-on-surface-variant">{{ item.name }}</span>
                </div>
                <div class="text-right">
                    <p class="text-xs font-semibold text-on-surface">{{ item.percentage }}%</p>
                    <p class="text-[10px] text-on-surface-variant">{{ formatMoney(item.value) }}</p>
                </div>
            </div>
        </div>
        <p v-else class="text-center text-sm text-on-surface-variant sm:text-left">
            Aún no hay categorías registradas en este período.
        </p>
    </div>
</template>
