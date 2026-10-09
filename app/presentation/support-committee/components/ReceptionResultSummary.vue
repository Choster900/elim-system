<script setup lang="ts">
import { differenceLabel, formatMoney, toCents } from '../utils/reception-format.util'

export interface ResultSummary {
    envelopes: number
    matched: number
    surplusCount: number
    surplusAmount: number
    shortageCount: number
    shortageAmount: number
    mixedCount: number
    registered: number
    counted: number
}

const props = defineProps<{
    summary: ResultSummary
}>()

type SegmentKey = 'matched' | 'surplus' | 'shortage' | 'mixed'

const activeSegment = ref<SegmentKey | null>(null)

const segments = computed(() => {
    const total = Math.max(props.summary.envelopes, 1)
    let offset = 0
    return [
        {
            key: 'matched' as const,
            label: 'Cuadran',
            count: props.summary.matched,
            amount: null,
            colorClass: 'seg-matched',
        },
        {
            key: 'surplus' as const,
            label: 'Sobró dinero',
            count: props.summary.surplusCount,
            amount: props.summary.surplusAmount,
            colorClass: 'seg-surplus',
        },
        {
            key: 'shortage' as const,
            label: 'Faltó dinero',
            count: props.summary.shortageCount,
            amount: props.summary.shortageAmount,
            colorClass: 'seg-shortage',
        },
        {
            key: 'mixed' as const,
            label: 'Tipos no cuadran',
            count: props.summary.mixedCount,
            amount: null,
            colorClass: 'seg-mixed',
        },
    ]
        .filter((segment) => segment.count > 0)
        .map((segment) => {
            const share = segment.count / total
            const item = { ...segment, share, start: offset }
            offset += share
            return item
        })
})

const matchedShare = computed(() =>
    props.summary.envelopes > 0 ? props.summary.matched / props.summary.envelopes : 0,
)

const headline = computed(() => {
    const { envelopes, matched } = props.summary
    if (matched === envelopes) {
        return envelopes === 1 ? 'El sobre cuadró' : `Los ${envelopes} sobres cuadraron`
    }
    return `${matched} de ${envelopes} ${envelopes === 1 ? 'sobre cuadró' : 'sobres cuadraron'}`
})

const percentLabel = computed(() => `${Math.round(matchedShare.value * 100)}%`)

const comparisonMax = computed(() =>
    Math.max(props.summary.registered, props.summary.counted, 0.01),
)

function barWidth(value: number) {
    return `${Math.max(value > 0 ? 1.5 : 0, (value / comparisonMax.value) * 100)}%`
}

const difference = computed(() => props.summary.counted - props.summary.registered)
const differenceTone = computed(() => {
    const cents = toCents(difference.value)
    if (cents < 0) return 'seg-shortage'
    if (cents > 0) return 'seg-surplus'
    return 'seg-matched'
})

const activeInfo = computed(
    () => segments.value.find((segment) => segment.key === activeSegment.value) ?? null,
)

function segmentAria(segment: (typeof segments.value)[number]) {
    const base = `${segment.label}: ${segment.count} ${segment.count === 1 ? 'sobre' : 'sobres'} (${Math.round(segment.share * 100)}%)`
    return segment.amount ? `${base}, ${formatMoney(segment.amount)}` : base
}
</script>

<template>
    <div class="result-summary grid gap-6 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)] lg:gap-10">
        <section aria-label="Resultado de los sobres">
            <p class="text-[11px] font-semibold uppercase tracking-wider text-on-surface-variant">
                Resultado de los sobres
            </p>
            <p class="mt-1 flex flex-wrap items-baseline gap-x-2 font-sans text-on-surface">
                <span class="text-2xl font-semibold sm:text-3xl">{{ headline }}</span>
                <span
                    v-if="summary.matched !== summary.envelopes"
                    class="text-lg font-semibold text-on-surface-variant"
                >
                    ({{ percentLabel }})
                </span>
            </p>

            <div class="relative mt-4">
                <div
                    class="flex h-3.5 w-full gap-0.5 overflow-hidden rounded-full bg-surface-container-high"
                    role="list"
                >
                    <div
                        v-for="segment in segments"
                        :key="segment.key"
                        role="listitem"
                        tabindex="0"
                        :aria-label="segmentAria(segment)"
                        class="h-full min-w-[6px] basis-0 outline-none transition-opacity focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-on-surface"
                        :class="[
                            segment.colorClass,
                            activeSegment && activeSegment !== segment.key ? 'opacity-40' : '',
                        ]"
                        :style="{ flexGrow: segment.count }"
                        @pointerenter="activeSegment = segment.key"
                        @pointerleave="activeSegment = null"
                        @focus="activeSegment = segment.key"
                        @blur="activeSegment = null"
                    />
                </div>
                <div
                    v-if="activeInfo"
                    class="pointer-events-none absolute bottom-full mb-2 -translate-x-1/2 whitespace-nowrap rounded-lg border border-outline-variant bg-surface px-3 py-1.5 text-xs shadow-xl"
                    :style="{
                        left: `${Math.min(Math.max((activeInfo.start + activeInfo.share / 2) * 100, 12), 88)}%`,
                    }"
                >
                    <strong class="text-on-surface">
                        {{ activeInfo.count }} {{ activeInfo.count === 1 ? 'sobre' : 'sobres' }}
                    </strong>
                    <span class="text-on-surface-variant">
                        · {{ activeInfo.label.toLowerCase() }} ·
                        {{ Math.round(activeInfo.share * 100) }}%
                    </span>
                    <span v-if="activeInfo.amount" class="text-on-surface-variant">
                        · {{ formatMoney(activeInfo.amount) }}
                    </span>
                </div>
            </div>

            <ul class="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-xs">
                <li
                    v-for="segment in segments"
                    :key="segment.key"
                    class="flex items-center gap-1.5 transition-opacity"
                    :class="activeSegment && activeSegment !== segment.key ? 'opacity-50' : ''"
                    @pointerenter="activeSegment = segment.key"
                    @pointerleave="activeSegment = null"
                >
                    <span class="size-2.5 rounded-sm" :class="segment.colorClass" />
                    <span class="text-on-surface-variant">{{ segment.label }}</span>
                    <strong class="text-on-surface">{{ segment.count }}</strong>
                    <span v-if="segment.amount" class="text-on-surface-variant">
                        ({{ formatMoney(segment.amount) }})
                    </span>
                </li>
            </ul>
        </section>

        <section aria-label="Dinero anotado contra dinero contado">
            <p class="text-[11px] font-semibold uppercase tracking-wider text-on-surface-variant">
                Dinero
            </p>
            <div class="mt-2 space-y-3">
                <div>
                    <div class="mb-1 flex items-baseline justify-between gap-3 text-xs">
                        <span class="text-on-surface-variant">Anotado por los líderes</span>
                        <span class="text-sm font-semibold tabular-nums text-on-surface">
                            {{ formatMoney(summary.registered) }}
                        </span>
                    </div>
                    <div class="h-2.5 w-full rounded-full bg-surface-container-high">
                        <div
                            class="bar-registered h-full rounded-full"
                            :style="{ width: barWidth(summary.registered) }"
                        />
                    </div>
                </div>
                <div>
                    <div class="mb-1 flex items-baseline justify-between gap-3 text-xs">
                        <span class="text-on-surface-variant">Contado por el comité</span>
                        <span class="text-sm font-semibold tabular-nums text-on-surface">
                            {{ formatMoney(summary.counted) }}
                        </span>
                    </div>
                    <div class="h-2.5 w-full rounded-full bg-surface-container-high">
                        <div
                            class="h-full rounded-full bg-primary"
                            :style="{ width: barWidth(summary.counted) }"
                        />
                    </div>
                </div>
            </div>
            <p class="mt-3 flex items-center justify-end gap-2 text-sm">
                <span class="size-2.5 rounded-full" :class="differenceTone" />
                <strong class="text-on-surface">
                    {{
                        toCents(difference) === 0
                            ? 'Coinciden exactamente'
                            : differenceLabel(difference)
                    }}
                </strong>
                <span class="text-xs text-on-surface-variant">en total</span>
            </p>
        </section>
    </div>
</template>

<style scoped>
.seg-matched {
    background-color: #0ca30c;
}

.seg-surplus {
    background-color: #3987e5;
}

.seg-shortage {
    background-color: #e66767;
}

.seg-mixed {
    background-color: #9085e9;
}

.bar-registered {
    background-color: #6b6b66;
}
</style>
