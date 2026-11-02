<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'

interface ColumnValue {
    key: string
    label: string
    value: number
    detail?: string[]
}

interface ColumnUnit {
    one: string
    other: string
}

const props = withDefaults(
    defineProps<{
        values: ColumnValue[]
        color?: string
        format?: 'number' | 'currency'
        unit?: ColumnUnit
        label: string
        emptyMessage?: string
    }>(),
    {
        color: 'var(--chart-1)',
        format: 'number',
        unit: undefined,
        emptyMessage: 'Sin datos para mostrar.',
    },
)

const height = 250
const padding = { top: 28, right: 16, bottom: 40, left: 52 }
const plotHeight = height - padding.top - padding.bottom
const baseline = padding.top + plotHeight
const slotMinWidth = 76
const barMaxWidth = 24
const cornerRadius = 4
const fullLabelLimit = 12
const tooltipEdge = 4
const tooltipGap = 10

const scroller = ref<HTMLElement | null>(null)
const tooltip = ref<HTMLElement | null>(null)
const containerWidth = ref(680)
const activeIndex = ref<number | null>(null)
const tooltipWidth = ref(0)
const visibleRange = ref({ start: 0, end: 0 })
let resizeObserver: ResizeObserver | null = null

const width = computed(() =>
    Math.max(
        containerWidth.value,
        padding.left + padding.right + props.values.length * slotMinWidth,
    ),
)
const plotWidth = computed(() => width.value - padding.left - padding.right)
const slotWidth = computed(() => plotWidth.value / Math.max(1, props.values.length))
const barWidth = computed(() => Math.min(barMaxWidth, slotWidth.value * 0.6))
const dataMax = computed(() => Math.max(0, ...props.values.map((point) => point.value)))

const tickStep = computed(() => {
    const raw = Math.max(1, dataMax.value) / 4
    const magnitude = 10 ** Math.floor(Math.log10(raw))
    const residual = raw / magnitude
    const factor =
        residual <= 1 ? 1 : residual <= 2 ? 2 : residual <= 2.5 ? 2.5 : residual <= 5 ? 5 : 10
    return Math.max(1, factor * magnitude)
})
const axisMax = computed(
    () => tickStep.value * Math.max(1, Math.ceil(dataMax.value / tickStep.value)),
)
const ticks = computed(() =>
    Array.from({ length: Math.round(axisMax.value / tickStep.value) + 1 }, (_, index) => {
        const value = index * tickStep.value
        return { value, y: baseline - (value / axisMax.value) * plotHeight }
    }),
)

const maxIndex = computed(() =>
    props.values.reduce(
        (best, point, index) => (point.value >= (props.values[best]?.value ?? 0) ? index : best),
        0,
    ),
)

function columnPath(x: number, top: number, barHeight: number) {
    if (barHeight <= 0) return ''
    const radius = Math.min(cornerRadius, barWidth.value / 2, barHeight)
    const right = x + barWidth.value
    return [
        `M ${x} ${baseline}`,
        `V ${top + radius}`,
        `A ${radius} ${radius} 0 0 1 ${x + radius} ${top}`,
        `H ${right - radius}`,
        `A ${radius} ${radius} 0 0 1 ${right} ${top + radius}`,
        `V ${baseline}`,
        'Z',
    ].join(' ')
}

const columns = computed(() =>
    props.values.map((point, index) => {
        const slotX = padding.left + slotWidth.value * index
        const center = slotX + slotWidth.value / 2
        const barHeight = (point.value / axisMax.value) * plotHeight
        const top = baseline - barHeight
        return {
            ...point,
            index,
            slotX,
            center,
            top,
            path: columnPath(center - barWidth.value / 2, top, barHeight),
            showValue:
                props.values.length <= fullLabelLimit ||
                index === props.values.length - 1 ||
                index === maxIndex.value,
        }
    }),
)

const activeColumn = computed(() =>
    activeIndex.value === null ? null : (columns.value[activeIndex.value] ?? null),
)

const tooltipStyle = computed(() => {
    const column = activeColumn.value
    if (!column) return undefined
    const offset = barWidth.value / 2 + tooltipGap
    const start = visibleRange.value.start + tooltipEdge
    const end = visibleRange.value.end - tooltipEdge
    const besideTop = `${Math.min(Math.max(column.top - 8, tooltipEdge), baseline - 72)}px`

    if (column.center + offset + tooltipWidth.value <= end) {
        return { left: `${column.center + offset}px`, top: besideTop }
    }
    if (column.center - offset - tooltipWidth.value >= start) {
        return { left: `${column.center - offset - tooltipWidth.value}px`, top: besideTop }
    }

    const centered = Math.min(
        Math.max(column.center - tooltipWidth.value / 2, start),
        end - tooltipWidth.value,
    )
    return { left: `${centered}px`, top: `${tooltipEdge}px` }
})

const pluralRules = new Intl.PluralRules('es-SV')

function unitOf(value: number) {
    if (!props.unit) return ''
    return pluralRules.select(value) === 'one' ? props.unit.one : props.unit.other
}

function formatCapValue(value: number) {
    if (props.format !== 'currency') return formatValue(value)

    const fractionDigits = value < 1000 && !Number.isInteger(value) ? 2 : 0
    return new Intl.NumberFormat('es-SV', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: fractionDigits,
        maximumFractionDigits: fractionDigits,
    }).format(value)
}

function formatValue(value: number, compact = false) {
    if (props.format === 'currency') {
        return new Intl.NumberFormat('es-SV', {
            style: 'currency',
            currency: 'USD',
            notation: compact && value >= 10000 ? 'compact' : 'standard',
            maximumFractionDigits: compact ? (value >= 1000 ? 1 : 0) : 2,
            minimumFractionDigits: compact ? 0 : 2,
        }).format(value)
    }

    return new Intl.NumberFormat('es-SV', {
        notation: compact && value >= 10000 ? 'compact' : 'standard',
        maximumFractionDigits: compact ? 1 : 0,
    }).format(value)
}

function syncVisibleRange() {
    const element = scroller.value
    visibleRange.value = element
        ? { start: element.scrollLeft, end: element.scrollLeft + element.clientWidth }
        : { start: 0, end: width.value }
}

function activate(index: number) {
    syncVisibleRange()
    activeIndex.value = index
}

function deactivate(index: number) {
    if (activeIndex.value === index) activeIndex.value = null
}

function scrollToLatest() {
    const element = scroller.value
    if (element) element.scrollLeft = element.scrollWidth
}

onMounted(() => {
    const element = scroller.value
    if (!element) return
    containerWidth.value = element.clientWidth || containerWidth.value
    resizeObserver = new ResizeObserver(([entry]) => {
        if (entry) containerWidth.value = entry.contentRect.width
    })
    resizeObserver.observe(element)
    nextTick(scrollToLatest)
})

onBeforeUnmount(() => {
    resizeObserver?.disconnect()
})

watch(
    () => props.values.length,
    () => {
        activeIndex.value = null
        nextTick(scrollToLatest)
    },
)

watch(activeIndex, async (index) => {
    if (index === null) return
    await nextTick()
    tooltipWidth.value = tooltip.value?.offsetWidth ?? 0
})
</script>

<template>
    <div v-if="values.length === 0" class="py-8 text-center text-sm text-on-surface-variant">
        {{ emptyMessage }}
    </div>

    <div v-else class="w-full">
        <div
            ref="scroller"
            class="w-full overflow-x-auto overflow-y-hidden [contain:inline-size]"
            @scroll.passive="syncVisibleRange"
        >
            <div class="relative" :style="{ width: `${width}px`, height: `${height}px` }">
                <svg
                    :width="width"
                    :height="height"
                    :viewBox="`0 0 ${width} ${height}`"
                    class="block"
                    role="img"
                    :aria-label="label"
                    @pointerleave="activeIndex = null"
                >
                    <g v-for="tick in ticks" :key="tick.value">
                        <line
                            :x1="padding.left"
                            :x2="width - padding.right"
                            :y1="tick.y"
                            :y2="tick.y"
                            class="stroke-outline-variant"
                            stroke-width="1"
                            :stroke-opacity="tick.value === 0 ? 1 : 0.5"
                        />
                        <text
                            :x="padding.left - 10"
                            :y="tick.y + 4"
                            text-anchor="end"
                            class="fill-on-surface-variant text-[11px] tabular-nums"
                        >
                            {{ formatValue(tick.value, true) }}
                        </text>
                    </g>

                    <g v-for="column in columns" :key="column.key">
                        <rect
                            v-if="activeIndex === column.index"
                            :x="column.slotX + 4"
                            :y="padding.top - 20"
                            :width="slotWidth - 8"
                            :height="baseline - padding.top + 20"
                            rx="6"
                            class="fill-surface-container-high"
                        />
                        <path
                            v-if="column.path"
                            :d="column.path"
                            :fill="color"
                            class="transition-opacity duration-150"
                            :opacity="
                                activeIndex === null || activeIndex === column.index ? 1 : 0.45
                            "
                        />
                        <text
                            v-if="column.showValue"
                            :x="column.center"
                            :y="column.top - 8"
                            text-anchor="middle"
                            class="fill-on-surface text-[12px] font-semibold tabular-nums"
                        >
                            {{ formatCapValue(column.value) }}
                        </text>
                        <text
                            :x="column.center"
                            :y="baseline + 22"
                            text-anchor="middle"
                            class="text-[11px] font-medium"
                            :class="
                                activeIndex === column.index
                                    ? 'fill-on-surface'
                                    : 'fill-on-surface-variant'
                            "
                        >
                            {{ column.label }}
                        </text>
                        <rect
                            :x="column.slotX"
                            :y="0"
                            :width="slotWidth"
                            :height="height"
                            fill="transparent"
                            tabindex="0"
                            class="cursor-default outline-none"
                            :aria-label="`${column.label}: ${formatValue(column.value)} ${unitOf(column.value)}`"
                            @pointerenter="activate(column.index)"
                            @focus="activate(column.index)"
                            @blur="deactivate(column.index)"
                        />
                    </g>
                </svg>

                <div
                    v-if="activeColumn"
                    ref="tooltip"
                    class="pointer-events-none absolute z-10 w-max max-w-52 rounded-lg border border-outline-variant bg-surface px-3 py-2 shadow-lg"
                    :style="tooltipStyle"
                    aria-hidden="true"
                >
                    <p class="text-base font-semibold leading-tight text-on-surface">
                        {{ formatValue(activeColumn.value) }}
                        <span v-if="unit" class="text-xs font-normal text-on-surface-variant">
                            {{ unitOf(activeColumn.value) }}
                        </span>
                    </p>
                    <p
                        v-for="line in activeColumn.detail ?? []"
                        :key="line"
                        class="mt-0.5 text-xs text-on-surface-variant"
                    >
                        {{ line }}
                    </p>
                </div>
            </div>
        </div>

        <div class="sr-only">
            <table>
                <caption>
                    {{
                        label
                    }}
                </caption>
                <thead>
                    <tr>
                        <th scope="col">Período</th>
                        <th scope="col">Valor</th>
                        <th scope="col">Detalle</th>
                    </tr>
                </thead>
                <tbody>
                    <tr v-for="point in values" :key="point.key">
                        <th scope="row">{{ point.label }}</th>
                        <td>{{ formatValue(point.value) }} {{ unitOf(point.value) }}</td>
                        <td>{{ (point.detail ?? []).join(' · ') }}</td>
                    </tr>
                </tbody>
            </table>
        </div>
    </div>
</template>
