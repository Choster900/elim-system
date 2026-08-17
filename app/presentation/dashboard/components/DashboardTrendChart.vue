<script setup lang="ts">
import { computed, useId } from 'vue'

interface TrendValue {
    label: string
    value: number
}

const props = withDefaults(
    defineProps<{
        values: TrendValue[]
        color?: string
        format?: 'number' | 'currency'
        ariaLabel: string
    }>(),
    {
        color: 'var(--chart-1)',
        format: 'number',
    },
)

const width = 680
const height = 250
const padding = { top: 20, right: 18, bottom: 42, left: 58 }
const plotWidth = width - padding.left - padding.right
const plotHeight = height - padding.top - padding.bottom
const gradientId = `dashboard-trend-${useId().replaceAll(':', '')}`
const maxValue = computed(() => Math.max(1, ...props.values.map((point) => point.value)))
const points = computed(() =>
    props.values.map((point, index) => ({
        ...point,
        x:
            props.values.length === 1
                ? padding.left + plotWidth / 2
                : padding.left + (index / (props.values.length - 1)) * plotWidth,
        y: padding.top + plotHeight - (point.value / maxValue.value) * plotHeight,
    })),
)
const linePath = computed(() =>
    points.value
        .map((point, index) => `${index === 0 ? 'M' : 'L'} ${point.x} ${point.y}`)
        .join(' '),
)
const areaPath = computed(() => {
    if (!points.value.length) return ''
    const first = points.value[0]!
    const last = points.value.at(-1)!
    return `${linePath.value} L ${last.x} ${padding.top + plotHeight} L ${first.x} ${
        padding.top + plotHeight
    } Z`
})
const gridLines = computed(() =>
    Array.from({ length: 4 }, (_, index) => {
        const ratio = index / 3
        return {
            y: padding.top + plotHeight * ratio,
            value: maxValue.value * (1 - ratio),
        }
    }),
)

function formatValue(value: number) {
    if (props.format === 'currency') {
        return new Intl.NumberFormat('es-SV', {
            style: 'currency',
            currency: 'USD',
            notation: value >= 10000 ? 'compact' : 'standard',
            maximumFractionDigits: value >= 1000 ? 1 : 0,
        }).format(value)
    }

    return new Intl.NumberFormat('es-SV', {
        notation: value >= 10000 ? 'compact' : 'standard',
        maximumFractionDigits: 0,
    }).format(value)
}
</script>

<template>
    <div class="w-full overflow-hidden">
        <svg
            :viewBox="`0 0 ${width} ${height}`"
            class="h-auto min-h-56 w-full overflow-visible"
            role="img"
            :aria-label="ariaLabel"
        >
            <defs>
                <linearGradient :id="gradientId" x1="0" x2="0" y1="0" y2="1">
                    <stop offset="0%" :style="{ stopColor: color, stopOpacity: 0.32 }" />
                    <stop offset="100%" :style="{ stopColor: color, stopOpacity: 0.02 }" />
                </linearGradient>
            </defs>

            <g v-for="line in gridLines" :key="line.y">
                <line
                    :x1="padding.left"
                    :x2="width - padding.right"
                    :y1="line.y"
                    :y2="line.y"
                    class="stroke-outline-variant"
                    stroke-dasharray="4 6"
                    stroke-width="1"
                />
                <text
                    :x="padding.left - 10"
                    :y="line.y + 4"
                    text-anchor="end"
                    class="fill-on-surface-variant text-[11px]"
                >
                    {{ formatValue(line.value) }}
                </text>
            </g>

            <path v-if="areaPath" :d="areaPath" :fill="`url(#${gradientId})`" />
            <path
                v-if="linePath"
                :d="linePath"
                fill="none"
                :stroke="color"
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="3"
            />

            <g v-for="point in points" :key="`${point.label}-${point.x}`" class="group">
                <circle
                    :cx="point.x"
                    :cy="point.y"
                    r="8"
                    class="fill-surface opacity-0 transition-opacity group-hover:opacity-100"
                    :stroke="color"
                    stroke-width="2"
                />
                <circle :cx="point.x" :cy="point.y" r="3.5" :fill="color">
                    <title>{{ point.label }}: {{ formatValue(point.value) }}</title>
                </circle>
                <text
                    :x="point.x"
                    :y="height - 13"
                    text-anchor="middle"
                    class="fill-on-surface-variant text-[11px] font-medium"
                >
                    {{ point.label }}
                </text>
            </g>
        </svg>
    </div>
</template>
