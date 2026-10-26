<script setup lang="ts">
import { EyeOff, Plus, Trash2 } from '@lucide/vue'
import type { EnvelopeCategory } from '../interfaces/reception.interface'
import type { DraftCategory } from '../stores/reception-draft.store'
import { categoryLabel } from '../utils/reception-format.util'

defineProps<{
    categories: DraftCategory[]
    remaining: EnvelopeCategory[]
    hint: string
}>()

const emit = defineEmits<{
    change: [index: number, amount: number | null]
    add: [category: EnvelopeCategory]
    remove: [categoryId: number | null]
    submit: []
}>()

const listRef = ref<HTMLElement | null>(null)
const isAdding = ref(false)

function inputs() {
    return Array.from(listRef.value?.querySelectorAll<HTMLInputElement>('input') ?? [])
}

function onInput(index: number, event: Event) {
    const input = event.currentTarget as HTMLInputElement
    if (input.value === '') {
        emit('change', index, null)
        return
    }
    const value = Number(input.value)
    emit('change', index, Number.isFinite(value) ? Math.min(10000000, Math.max(0, value)) : null)
}

function onKeydown(event: KeyboardEvent) {
    if (event.key !== 'Enter') return
    event.preventDefault()
    const list = inputs()
    const index = list.indexOf(event.currentTarget as HTMLInputElement)
    const next = list[index + (event.shiftKey ? -1 : 1)]
    if (next) next.focus()
    else if (!event.shiftKey) emit('submit')
}

function selectContents(event: FocusEvent) {
    ;(event.currentTarget as HTMLInputElement).select()
}

function addCategory(category: EnvelopeCategory) {
    emit('add', category)
    isAdding.value = false
    nextTick(() => inputs().at(-1)?.focus())
}

onMounted(() => {
    if (window.matchMedia('(min-width: 1024px)').matches) inputs()[0]?.focus()
})
</script>

<template>
    <section class="mt-4 overflow-hidden rounded-xl border border-outline-variant bg-surface">
        <div
            class="flex flex-wrap items-end justify-between gap-x-4 gap-y-2 border-b border-outline-variant bg-surface-container-low px-4 py-4 sm:px-5"
        >
            <div>
                <h1 class="font-display text-2xl font-semibold text-on-surface">
                    ¿Cuánto dinero viene en el sobre?
                </h1>
                <p class="text-sm text-on-surface-variant">
                    Escribe el total de cada tipo de ofrenda, sin separar billetes y monedas.
                </p>
            </div>
            <p class="inline-flex items-center gap-1.5 text-xs text-on-surface-variant">
                <EyeOff class="size-3.5 text-primary" />
                {{ hint }}
            </p>
        </div>

        <ul ref="listRef" class="divide-y divide-outline-variant">
            <li
                v-for="(category, index) in categories"
                :key="category.categoryId ?? 'sin-tipo'"
                class="flex items-center gap-3 px-4 py-3 sm:px-5"
            >
                <label
                    :for="`amount-${category.categoryId ?? 'sin-tipo'}`"
                    class="min-w-0 flex-1 cursor-pointer text-base font-semibold text-on-surface"
                >
                    {{ categoryLabel(category.categoryName) }}
                </label>
                <button
                    v-if="category.extra"
                    type="button"
                    class="inline-flex size-9 shrink-0 items-center justify-center rounded-md text-on-surface-variant transition-colors hover:bg-destructive/10 hover:text-destructive"
                    :aria-label="`Quitar ${categoryLabel(category.categoryName)}`"
                    @click="emit('remove', category.categoryId)"
                >
                    <Trash2 class="size-4" />
                </button>
                <div class="relative w-40 shrink-0 sm:w-48">
                    <span
                        class="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-on-surface-variant/60"
                    >
                        $
                    </span>
                    <input
                        :id="`amount-${category.categoryId ?? 'sin-tipo'}`"
                        :value="category.amount ?? ''"
                        type="number"
                        inputmode="decimal"
                        min="0"
                        step="0.01"
                        placeholder="0.00"
                        autocomplete="off"
                        class="h-11 w-full rounded-md border bg-surface-container-low pl-7 pr-3 text-right text-lg font-semibold tabular-nums text-on-surface outline-none transition-colors placeholder:text-on-surface-variant/40 focus:border-primary focus:bg-surface focus:ring-2 focus:ring-primary/40"
                        :class="category.amount ? 'border-primary' : 'border-outline-variant'"
                        @input="onInput(index, $event)"
                        @keydown="onKeydown"
                        @focus="selectContents"
                    />
                </div>
            </li>
        </ul>

        <div
            v-if="isAdding"
            class="flex flex-col gap-3 border-t border-outline-variant bg-primary/[0.04] px-4 py-3 sm:flex-row sm:items-center sm:px-5"
        >
            <p class="text-sm font-semibold text-on-surface">
                ¿Qué otro tipo de ofrenda vino en el sobre?
            </p>
            <div class="flex flex-wrap gap-2">
                <button
                    v-for="category in remaining"
                    :key="category.categoryId ?? 'sin-tipo'"
                    type="button"
                    class="inline-flex items-center gap-1.5 rounded-full border border-primary/40 bg-surface px-3 py-1.5 text-sm font-semibold text-primary transition-colors hover:bg-primary hover:text-primary-foreground"
                    @click="addCategory(category)"
                >
                    <Plus class="size-3.5" />
                    {{ categoryLabel(category.categoryName) }}
                </button>
            </div>
            <button
                type="button"
                class="text-xs font-semibold text-on-surface-variant hover:text-on-surface sm:ml-auto"
                @click="isAdding = false"
            >
                Cancelar
            </button>
        </div>
        <div
            v-else-if="remaining.length > 0"
            class="border-t border-outline-variant px-4 py-3 sm:px-5"
        >
            <button
                type="button"
                class="inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:underline"
                @click="isAdding = true"
            >
                <Plus class="size-4" />
                Agregar otro tipo de ofrenda
            </button>
        </div>
    </section>
</template>
