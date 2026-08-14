<script setup lang="ts" generic="T extends Record<string, unknown>">
import {
    ChevronDown,
    ChevronLeft,
    ChevronRight,
    ChevronsLeft,
    ChevronsRight,
    ChevronUp,
    ChevronsUpDown,
    Search,
    X,
} from '@lucide/vue'
import { normalizeSearchText, toDisplayString } from '~/utils/string/text-format.util'

export interface DataTableColumn<R> {
    key: string
    label: string
    sortable?: boolean
    filterable?: boolean
    filterType?: 'text' | 'select' | 'date' | 'daterange'
    filterOptions?: { value: string | number; label: string }[]
    accessor?: (row: R) => string | number | null | undefined
    width?: string
    align?: 'left' | 'center' | 'right'
    headerClass?: string
    cellClass?: string
    sticky?: 'right'
}

const props = withDefaults(
    defineProps<{
        rows: T[]
        columns: DataTableColumn<T>[]
        rowKey?: keyof T | ((row: T) => string)
        pageSize?: number
        pageSizeOptions?: number[]
        showSearch?: boolean
        searchPlaceholder?: string
        dense?: boolean
        loading?: boolean
        emptyTitle?: string
        emptyMessage?: string
    }>(),
    {
        rowKey: 'id' as keyof T,
        pageSize: 10,
        pageSizeOptions: () => [5, 10, 25, 50, 100],
        showSearch: false,
        searchPlaceholder: 'Buscar...',
        dense: false,
        loading: false,
        emptyTitle: 'Sin resultados',
        emptyMessage: 'No hay registros que coincidan con los filtros actuales.',
    },
)

type FilterValue = string | { start: string | null; end: string | null } | null
const sortKey = ref<string | null>(null)
const sortDir = ref<'asc' | 'desc'>('asc')
const columnFilters = reactive<Record<string, FilterValue>>({})
const globalSearch = ref('')
const currentPage = ref(1)
const pageSize = ref(props.pageSize)

watch(
    () => [props.rows, columnFilters, globalSearch.value, pageSize.value],
    () => {
        if (currentPage.value > totalPages.value) {
            currentPage.value = Math.max(1, totalPages.value)
        }
    },
    { deep: true },
)

function getColumnValue(col: DataTableColumn<T>, row: T): string {
    if (col.accessor) {
        return toDisplayString(col.accessor(row))
    }
    return toDisplayString((row as Record<string, unknown>)[col.key])
}

function getRowKey(row: T, index: number): string {
    if (typeof props.rowKey === 'function') return props.rowKey(row)
    const v = (row as Record<string, unknown>)[props.rowKey as string]
    return v != null ? String(v) : String(index)
}

const filteredRows = computed<T[]>(() => {
    let result = props.rows.slice()

    for (const col of props.columns) {
        const raw = columnFilters[col.key]
        if (raw == null) continue

        if (col.filterType === 'daterange') {
            const range = (typeof raw === 'object' ? raw : null) as {
                start: string | null
                end: string | null
            } | null
            if (!range || (!range.start && !range.end)) continue
            result = result.filter((row) => {
                const v = getColumnValue(col, row)
                if (!v) return false
                if (range.start && v < range.start) return false
                if (range.end && v > range.end) return false
                return true
            })
            continue
        }

        if (typeof raw !== 'string' || raw.trim() === '') continue
        const needle = normalizeSearchText(raw)

        if (col.filterType === 'select' || col.filterType === 'date') {
            result = result.filter((row) => getColumnValue(col, row) === raw)
        } else {
            result = result.filter((row) =>
                normalizeSearchText(getColumnValue(col, row)).includes(needle),
            )
        }
    }

    if (props.showSearch && globalSearch.value.trim()) {
        const needle = normalizeSearchText(globalSearch.value)
        result = result.filter((row) =>
            props.columns.some((col) =>
                normalizeSearchText(getColumnValue(col, row)).includes(needle),
            ),
        )
    }

    return result
})

const sortedRows = computed<T[]>(() => {
    if (!sortKey.value) return filteredRows.value
    const col = props.columns.find((c) => c.key === sortKey.value)
    if (!col) return filteredRows.value

    const dir = sortDir.value === 'asc' ? 1 : -1
    return filteredRows.value.slice().sort((a, b) => {
        const av = getColumnValue(col, a)
        const bv = getColumnValue(col, b)
        const an = Number(av)
        const bn = Number(bv)
        if (!Number.isNaN(an) && !Number.isNaN(bn) && av !== '' && bv !== '') {
            return (an - bn) * dir
        }
        return av.localeCompare(bv, 'es', { sensitivity: 'base' }) * dir
    })
})

const totalRows = computed(() => sortedRows.value.length)
const totalPages = computed(() => Math.max(1, Math.ceil(totalRows.value / pageSize.value)))
const pagedRows = computed<T[]>(() => {
    const start = (currentPage.value - 1) * pageSize.value
    return sortedRows.value.slice(start, start + pageSize.value)
})

const rangeStart = computed(() =>
    totalRows.value === 0 ? 0 : (currentPage.value - 1) * pageSize.value + 1,
)
const rangeEnd = computed(() => Math.min(currentPage.value * pageSize.value, totalRows.value))

const hasActiveFilters = computed(() => {
    if (globalSearch.value.trim()) return true
    return Object.values(columnFilters).some((v) => {
        if (v == null) return false
        if (typeof v === 'string') return v.trim() !== ''
        return !!(v.start || v.end)
    })
})

function toggleSort(col: DataTableColumn<T>) {
    if (!col.sortable) return
    if (sortKey.value !== col.key) {
        sortKey.value = col.key
        sortDir.value = 'asc'
        return
    }
    if (sortDir.value === 'asc') {
        sortDir.value = 'desc'
        return
    }
    sortKey.value = null
    sortDir.value = 'asc'
}

function clearAllFilters() {
    for (const key of Object.keys(columnFilters)) {
        columnFilters[key] = null
    }
    globalSearch.value = ''
}

function goToPage(page: number) {
    currentPage.value = Math.min(Math.max(1, page), totalPages.value)
}

const visiblePages = computed<(number | '...')[]>(() => {
    const total = totalPages.value
    const cur = currentPage.value
    if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1)

    const pages: (number | '...')[] = [1]
    const left = Math.max(2, cur - 1)
    const right = Math.min(total - 1, cur + 1)
    if (left > 2) pages.push('...')
    for (let i = left; i <= right; i++) pages.push(i)
    if (right < total - 1) pages.push('...')
    pages.push(total)
    return pages
})

function alignClass(align?: 'left' | 'center' | 'right') {
    if (align === 'center') return 'text-center'
    if (align === 'right') return 'text-right'
    return 'text-left'
}

const cellPadding = computed(() => (props.dense ? 'px-4 py-2' : 'px-5 py-4'))

const pageSizeSelectOptions = computed(() =>
    props.pageSizeOptions.map((n) => ({ value: n, label: String(n) })),
)
</script>

<template>
    <div class="overflow-hidden rounded-lg border border-outline-variant bg-surface-container">
        <div
            v-if="showSearch || $slots['toolbar-start'] || $slots['toolbar-end']"
            class="flex flex-col gap-3 border-b border-outline-variant bg-surface-container-low px-5 py-3 md:flex-row md:items-center md:justify-between"
        >
            <div class="flex flex-1 items-center gap-3">
                <div v-if="showSearch" class="relative w-full max-w-sm">
                    <Search
                        class="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-on-surface-variant"
                    />
                    <input
                        v-model="globalSearch"
                        type="search"
                        :placeholder="searchPlaceholder"
                        class="h-10 w-full rounded border border-outline-variant bg-surface px-3 pl-10 text-sm text-on-surface placeholder:text-on-surface-variant/60 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                </div>
                <slot name="toolbar-start" :total="totalRows" :filtered="hasActiveFilters" />
            </div>
            <div class="flex items-center gap-2">
                <slot name="toolbar-end" :total="totalRows" :filtered="hasActiveFilters" />
            </div>
        </div>

        <div class="overflow-x-auto">
            <table class="w-full border-collapse text-sm">
                <thead class="bg-surface-container-high">
                    <tr>
                        <th
                            v-for="col in columns"
                            :key="col.key"
                            scope="col"
                            :style="col.width ? { width: col.width } : undefined"
                            :class="[
                                'border-b border-outline-variant px-5 py-3 text-[11px] font-semibold uppercase tracking-wider text-on-surface-variant',
                                alignClass(col.align),
                                col.headerClass,
                                col.sortable
                                    ? 'cursor-pointer select-none transition-colors hover:text-primary'
                                    : '',
                            ]"
                            @click="toggleSort(col)"
                        >
                            <span
                                class="inline-flex items-center gap-1.5"
                                :class="
                                    col.align === 'right'
                                        ? 'justify-end'
                                        : col.align === 'center'
                                          ? 'justify-center'
                                          : ''
                                "
                            >
                                {{ col.label }}
                                <template v-if="col.sortable">
                                    <ChevronUp
                                        v-if="sortKey === col.key && sortDir === 'asc'"
                                        class="size-3 text-primary"
                                    />
                                    <ChevronDown
                                        v-else-if="sortKey === col.key && sortDir === 'desc'"
                                        class="size-3 text-primary"
                                    />
                                    <ChevronsUpDown v-else class="size-3 opacity-40" />
                                </template>
                            </span>
                        </th>
                    </tr>
                    <tr v-if="columns.some((c) => c.filterable)" class="bg-surface-container">
                        <th
                            v-for="col in columns"
                            :key="`${col.key}-filter`"
                            class="border-b border-outline-variant px-3 py-2"
                            :style="col.width ? { width: col.width } : undefined"
                        >
                            <template v-if="col.filterable">
                                <UiSearchSelect
                                    v-if="col.filterType === 'select'"
                                    :model-value="
                                        (typeof columnFilters[col.key] === 'string'
                                            ? columnFilters[col.key]
                                            : null) as string | null
                                    "
                                    :options="col.filterOptions ?? []"
                                    option-value="value"
                                    option-label="label"
                                    size="sm"
                                    clearable
                                    :placeholder="`Todos`"
                                    :search-placeholder="`Buscar ${col.label.toLowerCase()}...`"
                                    @update:model-value="
                                        (v) =>
                                            (columnFilters[col.key] = v == null ? null : String(v))
                                    "
                                />
                                <UiDatePicker
                                    v-else-if="col.filterType === 'date'"
                                    :model-value="
                                        (typeof columnFilters[col.key] === 'string'
                                            ? columnFilters[col.key]
                                            : null) as string | null
                                    "
                                    mode="single"
                                    size="sm"
                                    placeholder="Fecha"
                                    @update:model-value="
                                        (v) =>
                                            (columnFilters[col.key] = (v ?? null) as string | null)
                                    "
                                />
                                <UiDatePicker
                                    v-else-if="col.filterType === 'daterange'"
                                    :model-value="
                                        (columnFilters[col.key] as {
                                            start: string | null
                                            end: string | null
                                        } | null) ?? { start: null, end: null }
                                    "
                                    mode="range"
                                    size="sm"
                                    placeholder="Rango de fechas"
                                    @update:model-value="
                                        (v) =>
                                            (columnFilters[col.key] = v as {
                                                start: string | null
                                                end: string | null
                                            })
                                    "
                                />
                                <input
                                    v-else
                                    :value="
                                        typeof columnFilters[col.key] === 'string'
                                            ? columnFilters[col.key]
                                            : ''
                                    "
                                    type="search"
                                    :placeholder="`Filtrar ${col.label.toLowerCase()}...`"
                                    class="h-8 w-full rounded border border-outline-variant bg-surface px-2 text-xs text-on-surface placeholder:text-on-surface-variant/60 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                                    @input="
                                        (e) =>
                                            (columnFilters[col.key] = (
                                                e.target as HTMLInputElement
                                            ).value)
                                    "
                                />
                            </template>
                        </th>
                    </tr>
                </thead>

                <tbody>
                    <tr v-if="loading">
                        <td
                            :colspan="columns.length"
                            class="px-5 py-16 text-center text-sm text-on-surface-variant"
                        >
                            Cargando registros...
                        </td>
                    </tr>
                    <tr v-else-if="pagedRows.length === 0">
                        <td :colspan="columns.length" class="px-5 py-16 text-center">
                            <slot name="empty">
                                <div class="flex flex-col items-center gap-2">
                                    <p class="font-display text-lg font-semibold text-on-surface">
                                        {{ emptyTitle }}
                                    </p>
                                    <p class="text-sm text-on-surface-variant">
                                        {{ emptyMessage }}
                                    </p>
                                    <button
                                        v-if="hasActiveFilters"
                                        type="button"
                                        class="mt-3 inline-flex items-center gap-1 text-xs font-semibold uppercase tracking-wider text-primary hover:underline"
                                        @click="clearAllFilters"
                                    >
                                        <X class="size-3" />
                                        Limpiar filtros
                                    </button>
                                </div>
                            </slot>
                        </td>
                    </tr>
                    <tr
                        v-for="(row, idx) in pagedRows"
                        v-else
                        :key="getRowKey(row, idx)"
                        class="border-b border-outline-variant transition-colors hover:bg-surface-container-high"
                    >
                        <td
                            v-for="col in columns"
                            :key="col.key"
                            :class="[
                                cellPadding,
                                alignClass(col.align),
                                col.cellClass,
                                'text-on-surface align-middle',
                            ]"
                        >
                            <slot
                                :name="`cell-${col.key}`"
                                :row="row"
                                :column="col"
                                :value="getColumnValue(col, row)"
                            >
                                {{ getColumnValue(col, row) }}
                            </slot>
                        </td>
                    </tr>
                </tbody>
            </table>
        </div>

        <div
            class="flex flex-col gap-3 border-t border-outline-variant bg-surface-container-low px-5 py-3 text-xs text-on-surface-variant md:flex-row md:items-center md:justify-between"
        >
            <div class="flex flex-wrap items-center gap-4">
                <span>
                    Mostrando <span class="font-semibold text-on-surface">{{ rangeStart }}</span> –
                    <span class="font-semibold text-on-surface">{{ rangeEnd }}</span> de
                    <span class="font-semibold text-on-surface">{{ totalRows }}</span>
                </span>
                <div class="flex items-center gap-2">
                    <span class="uppercase tracking-wider">Filas:</span>
                    <div class="w-20">
                        <UiSearchSelect
                            v-model="pageSize"
                            :options="pageSizeSelectOptions"
                            :searchable="false"
                            size="sm"
                        />
                    </div>
                </div>
                <button
                    v-if="hasActiveFilters"
                    type="button"
                    class="inline-flex items-center gap-1 font-semibold uppercase tracking-wider text-on-surface-variant hover:text-primary"
                    @click="clearAllFilters"
                >
                    <X class="size-3" />
                    Limpiar
                </button>
            </div>

            <div class="flex items-center gap-1">
                <button
                    type="button"
                    class="flex size-8 items-center justify-center rounded border border-outline-variant text-on-surface-variant transition-colors hover:border-primary hover:text-primary disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:border-outline-variant disabled:hover:text-on-surface-variant"
                    :disabled="currentPage <= 1"
                    aria-label="Primera página"
                    @click="goToPage(1)"
                >
                    <ChevronsLeft class="size-4" />
                </button>
                <button
                    type="button"
                    class="flex size-8 items-center justify-center rounded border border-outline-variant text-on-surface-variant transition-colors hover:border-primary hover:text-primary disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:border-outline-variant disabled:hover:text-on-surface-variant"
                    :disabled="currentPage <= 1"
                    aria-label="Página anterior"
                    @click="goToPage(currentPage - 1)"
                >
                    <ChevronLeft class="size-4" />
                </button>

                <template v-for="(p, i) in visiblePages" :key="`page-${i}`">
                    <span v-if="p === '...'" class="px-2 text-on-surface-variant">···</span>
                    <button
                        v-else
                        type="button"
                        class="flex size-8 items-center justify-center rounded border text-xs font-semibold transition-colors"
                        :class="
                            p === currentPage
                                ? 'border-primary bg-primary text-primary-foreground'
                                : 'border-outline-variant text-on-surface-variant hover:border-primary hover:text-primary'
                        "
                        @click="goToPage(p)"
                    >
                        {{ p }}
                    </button>
                </template>

                <button
                    type="button"
                    class="flex size-8 items-center justify-center rounded border border-outline-variant text-on-surface-variant transition-colors hover:border-primary hover:text-primary disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:border-outline-variant disabled:hover:text-on-surface-variant"
                    :disabled="currentPage >= totalPages"
                    aria-label="Página siguiente"
                    @click="goToPage(currentPage + 1)"
                >
                    <ChevronRight class="size-4" />
                </button>
                <button
                    type="button"
                    class="flex size-8 items-center justify-center rounded border border-outline-variant text-on-surface-variant transition-colors hover:border-primary hover:text-primary disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:border-outline-variant disabled:hover:text-on-surface-variant"
                    :disabled="currentPage >= totalPages"
                    aria-label="Última página"
                    @click="goToPage(totalPages)"
                >
                    <ChevronsRight class="size-4" />
                </button>
            </div>
        </div>
    </div>
</template>
