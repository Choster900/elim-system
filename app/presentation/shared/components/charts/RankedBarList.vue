<script setup lang="ts">
import { computed } from 'vue'

interface RankedItem {
    id: number | string
    label: string
    value: number
    /// Dato secundario que se muestra junto al valor, por ejemplo la asistencia.
    meta?: string | null
}

const props = withDefaults(
    defineProps<{
        items: RankedItem[]
        /// Nombre accesible del gráfico; se expone como aria-label.
        label: string
        format?: 'number' | 'currency'
        emptyMessage?: string
        /// Cuántas filas se muestran antes de plegar la cola en «Otras».
        limit?: number
    }>(),
    {
        format: 'currency',
        emptyMessage: 'Sin datos para mostrar.',
        limit: 6,
    },
)

// Un solo tono para todas las barras: la longitud ya codifica la magnitud, y
// teñirlas por tamaño sería duplicar esa información en el único canal libre.
const ranked = computed(() => [...props.items].sort((left, right) => right.value - left.value))

const visible = computed(() => {
    if (ranked.value.length <= props.limit) return ranked.value

    const head = ranked.value.slice(0, props.limit - 1)
    const tail = ranked.value.slice(props.limit - 1)
    const tailTotal = tail.reduce((sum, item) => sum + item.value, 0)

    return [
        ...head,
        {
            id: '__otras__',
            label: `Otras ${tail.length}`,
            value: tailTotal,
            meta: null,
        },
    ]
})

const maxValue = computed(() => Math.max(1, ...visible.value.map((item) => item.value)))

function widthOf(value: number) {
    return `${Math.max(1.5, (value / maxValue.value) * 100)}%`
}

function formatValue(value: number) {
    if (props.format === 'currency') {
        return new Intl.NumberFormat('es-SV', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        }).format(value)
    }

    return new Intl.NumberFormat('es-SV', { maximumFractionDigits: 0 }).format(value)
}
</script>

<template>
    <div v-if="visible.length === 0" class="py-8 text-center text-sm text-on-surface-variant">
        {{ emptyMessage }}
    </div>

    <ul v-else class="flex flex-col gap-3.5" role="list" :aria-label="label">
        <li v-for="item in visible" :key="item.id" class="group">
            <div class="mb-1.5 flex items-baseline justify-between gap-4">
                <span class="min-w-0 truncate text-sm text-on-surface">{{ item.label }}</span>
                <span class="flex shrink-0 items-baseline gap-2">
                    <span v-if="item.meta" class="text-[11px] tabular-nums text-on-surface-variant">
                        {{ item.meta }}
                    </span>
                    <span class="text-sm font-semibold tabular-nums text-on-surface">
                        {{ formatValue(item.value) }}
                    </span>
                </span>
            </div>
            <div class="h-2 w-full overflow-hidden rounded-full bg-surface-container-high">
                <div
                    class="h-full rounded-full bg-primary transition-[width] duration-500"
                    :style="{ width: widthOf(item.value) }"
                />
            </div>
        </li>
    </ul>
</template>
