<script setup lang="ts">
import { Banknote, Coins } from '@lucide/vue'
import type { Denomination } from '../interfaces/reception.interface'
import {
    countedCents,
    denominationNickname,
    denominationValueLabel,
    formatMoney,
    toCents,
} from '../utils/reception-format.util'

const props = defineProps<{
    denominations: Denomination[]
    quantities: Record<string, number | null>
    categoryName: string
}>()

const emit = defineEmits<{
    change: [denominationId: number, quantity: number | null]
}>()

const gridRef = ref<HTMLElement | null>(null)

const groups = computed(() =>
    [
        {
            key: 'billete',
            title: 'Billetes',
            icon: Banknote,
            items: props.denominations.filter((denomination) => denomination.kind === 'billete'),
        },
        {
            key: 'moneda',
            title: 'Monedas',
            icon: Coins,
            items: props.denominations.filter((denomination) => denomination.kind === 'moneda'),
        },
    ]
        .filter((group) => group.items.length > 0)
        .map((group) => ({
            ...group,
            total: countedCents(props.quantities, group.items) / 100,
        })),
)

function quantityOf(denomination: Denomination) {
    return props.quantities[String(denomination.id)] ?? null
}

function subtotal(denomination: Denomination) {
    return (toCents(denomination.value) * (quantityOf(denomination) ?? 0)) / 100
}

function onInput(denomination: Denomination, event: Event) {
    const input = event.currentTarget as HTMLInputElement
    if (input.value === '') {
        emit('change', denomination.id, null)
        return
    }
    const value = Number(input.value)
    emit(
        'change',
        denomination.id,
        Number.isFinite(value) ? Math.min(100000, Math.max(0, Math.trunc(value))) : null,
    )
}

function inputs() {
    return Array.from(gridRef.value?.querySelectorAll<HTMLInputElement>('input') ?? [])
}

function onKeydown(event: KeyboardEvent) {
    if (event.key !== 'Enter') return
    const list = inputs()
    const index = list.indexOf(event.currentTarget as HTMLInputElement)
    const next = list[index + (event.shiftKey ? -1 : 1)]
    if (!next) return
    event.preventDefault()
    next.focus()
}

function selectContents(event: FocusEvent) {
    ;(event.currentTarget as HTMLInputElement).select()
}

function focusFirst() {
    inputs()[0]?.focus()
}

defineExpose({ focusFirst })
</script>

<template>
    <div ref="gridRef" class="flex flex-col gap-5">
        <section v-for="group in groups" :key="group.key">
            <div class="mb-2 flex items-center justify-between">
                <h3
                    class="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.18em] text-on-surface-variant"
                >
                    <component :is="group.icon" class="size-3.5 text-primary" />
                    {{ group.title }}
                </h3>
                <span
                    class="text-xs tabular-nums"
                    :class="
                        group.total > 0
                            ? 'font-semibold text-on-surface'
                            : 'text-on-surface-variant/60'
                    "
                >
                    {{ formatMoney(group.total) }}
                </span>
            </div>
            <ul class="grid grid-cols-3 gap-2 sm:grid-cols-6">
                <li
                    v-for="denomination in group.items"
                    :key="denomination.id"
                    class="rounded-lg border p-2 transition-colors"
                    :class="
                        quantityOf(denomination)
                            ? 'border-primary bg-primary/[0.06]'
                            : 'border-outline-variant bg-surface'
                    "
                >
                    <label
                        :for="`den-${denomination.id}`"
                        class="flex cursor-pointer items-baseline justify-between gap-1"
                    >
                        <span
                            class="font-display text-lg font-semibold leading-none tabular-nums text-on-surface"
                        >
                            {{ denominationValueLabel(denomination) }}
                        </span>
                        <span
                            v-if="denominationNickname(denomination)"
                            class="text-[10px] font-semibold uppercase tracking-wide text-on-surface-variant"
                        >
                            {{ denominationNickname(denomination) }}
                        </span>
                    </label>
                    <input
                        :id="`den-${denomination.id}`"
                        :value="quantityOf(denomination) ?? ''"
                        type="number"
                        inputmode="numeric"
                        min="0"
                        step="1"
                        placeholder="0"
                        autocomplete="off"
                        :aria-label="`Cantidad de ${denomination.name} en ${categoryName}`"
                        class="mt-1.5 h-9 w-full rounded-md border border-outline-variant bg-surface-container-low px-2 text-center text-base font-semibold tabular-nums text-on-surface outline-none transition-colors placeholder:text-on-surface-variant/40 focus:border-primary focus:bg-surface focus:ring-2 focus:ring-primary/40"
                        @input="onInput(denomination, $event)"
                        @keydown="onKeydown"
                        @focus="selectContents"
                    />
                    <p
                        class="mt-1 text-center text-[11px] tabular-nums"
                        :class="
                            quantityOf(denomination)
                                ? 'font-semibold text-primary'
                                : 'text-on-surface-variant/50'
                        "
                    >
                        {{ formatMoney(subtotal(denomination)) }}
                    </p>
                </li>
            </ul>
        </section>
    </div>
</template>
