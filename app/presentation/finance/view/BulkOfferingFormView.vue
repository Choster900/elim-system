<script setup lang="ts">
import {
    ArrowLeft,
    CalendarCheck,
    CheckCheck,
    ClipboardPaste,
    HandCoins,
    Save,
    Table2,
} from '@lucide/vue'
import {
    useOfferingCategoriesQuery,
    useOfferingMeetingOptionsQuery,
} from '~/presentation/finance/composables/useOfferingCatalogQueries'
import { useCreateOfferingsBulkMutation } from '~/presentation/finance/composables/useOfferingMutations'
import { useOfferingsQuery } from '~/presentation/finance/composables/useOfferingsQuery'
import type {
    MeetingOption,
    OfferingInput,
} from '~/presentation/finance/interfaces/offering.interface'
import { formatMeetingDate } from '~/presentation/meetings/utils/meeting-format.util'
import { useAppToast } from '~/presentation/shared/composables/useAppToast'
import { resolveHttpErrorMessage } from '~/utils/http/resolve-http-error-message.util'

defineOptions({ name: 'BulkOfferingFormView' })

useHead({ title: 'Registro global · Asistencia y ofrendas · Sistema' })

interface BulkRow {
    meeting: MeetingOption
    selected: boolean
    date: string
    attendance: number
    amounts: Record<number, number>
}

const toast = useAppToast()
const meetingsQuery = useOfferingMeetingOptionsQuery()
const categoriesQuery = useOfferingCategoriesQuery()
const offeringsQuery = useOfferingsQuery()
const bulkMutation = useCreateOfferingsBulkMutation()

const meetings = computed(() => meetingsQuery.data.value ?? [])
const categories = computed(() =>
    (categoriesQuery.data.value ?? []).filter((category) => category.isActive),
)
const offerings = computed(() => offeringsQuery.data.value ?? [])
const isLoading = computed(
    () =>
        meetingsQuery.isPending.value ||
        categoriesQuery.isPending.value ||
        offeringsQuery.isPending.value,
)
const loadError = computed(
    () => meetingsQuery.error.value ?? categoriesQuery.error.value ?? offeringsQuery.error.value,
)

const selectedDistrictId = ref<number | null>(null)
const selectedZoneId = ref<number | null>(null)
const selectedSectorId = ref<number | null>(null)
const commonDate = ref(new Date().toISOString().slice(0, 10))
const rows = ref<BulkRow[]>([])
const activeCell = ref<{ rowIndex: number; columnIndex: number } | null>(null)

function uniqueOptions(items: { value: number; label: string }[]) {
    return [...new Map(items.map((item) => [item.value, item])).values()].sort((left, right) =>
        left.label.localeCompare(right.label, 'es'),
    )
}

const districtOptions = computed(() =>
    uniqueOptions(
        meetings.value.map((meeting) => ({
            value: meeting.districtId,
            label: meeting.districtName,
        })),
    ),
)
const zoneOptions = computed(() =>
    uniqueOptions(
        meetings.value
            .filter((meeting) => meeting.districtId === selectedDistrictId.value)
            .map((meeting) => ({ value: meeting.zoneId, label: meeting.zoneName })),
    ),
)
const sectorOptions = computed(() =>
    uniqueOptions(
        meetings.value
            .filter(
                (meeting) =>
                    meeting.districtId === selectedDistrictId.value &&
                    meeting.zoneId === selectedZoneId.value,
            )
            .map((meeting) => ({
                value: meeting.sectorId,
                label: meeting.sectorName ?? `Sector ${meeting.sectorId}`,
            })),
    ),
)

const existingKeys = computed(
    () => new Set(offerings.value.map((offering) => `${offering.meetingId}:${offering.date}`)),
)

function isAlreadyRegistered(row: BulkRow) {
    return existingKeys.value.has(`${row.meeting.id}:${row.date}`)
}

function buildRows() {
    rows.value = meetings.value
        .filter((meeting) => meeting.sectorId === selectedSectorId.value)
        .sort((left, right) => left.startTime.localeCompare(right.startTime))
        .map((meeting) => {
            const row: BulkRow = {
                meeting,
                selected: true,
                date: commonDate.value,
                attendance: 0,
                amounts: Object.fromEntries(categories.value.map((category) => [category.id, 0])),
            }
            row.selected = !isAlreadyRegistered(row)
            return row
        })
}

watch(
    districtOptions,
    (options) => {
        if (!options.some((option) => option.value === selectedDistrictId.value)) {
            selectedDistrictId.value = options[0]?.value ?? null
        }
    },
    { immediate: true },
)
watch(selectedDistrictId, () => {
    selectedZoneId.value = null
    selectedSectorId.value = null
})
watch(
    zoneOptions,
    (options) => {
        if (!options.some((option) => option.value === selectedZoneId.value)) {
            selectedZoneId.value = options[0]?.value ?? null
        }
    },
    { immediate: true },
)
watch(selectedZoneId, () => {
    selectedSectorId.value = null
})
watch(
    sectorOptions,
    (options) => {
        if (!options.some((option) => option.value === selectedSectorId.value)) {
            selectedSectorId.value = options[0]?.value ?? null
        }
    },
    { immediate: true },
)
watch(
    [selectedSectorId, () => meetingsQuery.data.value, () => categoriesQuery.data.value],
    buildRows,
    { immediate: true },
)

if (import.meta.server) {
    onServerPrefetch(() =>
        Promise.allSettled([
            meetingsQuery.suspense(),
            categoriesQuery.suspense(),
            offeringsQuery.suspense(),
        ]),
    )
}

if (import.meta.client) {
    watch(
        loadError,
        (error) => {
            if (error) {
                toast.error(
                    resolveHttpErrorMessage(error, 'No fue posible cargar el registro global'),
                )
            }
        },
        { immediate: true },
    )
}

const selectedRows = computed(() =>
    rows.value.filter((row) => row.selected && !isAlreadyRegistered(row)),
)
const totalAttendance = computed(() =>
    selectedRows.value.reduce((sum, row) => sum + (Number(row.attendance) || 0), 0),
)
const totalAmount = computed(() =>
    selectedRows.value.reduce(
        (total, row) =>
            total +
            categories.value.reduce(
                (subtotal, category) => subtotal + (Number(row.amounts[category.id]) || 0),
                0,
            ),
        0,
    ),
)
const allAvailableSelected = computed(() => {
    const available = rows.value.filter((row) => !isAlreadyRegistered(row))
    return available.length > 0 && available.every((row) => row.selected)
})

const sheetColumns = computed(() => [
    'Reunión',
    'Horario',
    'Fecha',
    'Asistencia',
    ...categories.value.map((category) => category.name),
    'Total',
    'Estado',
])

function columnLetter(index: number) {
    let value = index + 1
    let result = ''
    while (value > 0) {
        value -= 1
        result = String.fromCharCode(65 + (value % 26)) + result
        value = Math.floor(value / 26)
    }
    return result
}

function rowTotal(row: BulkRow) {
    return categories.value.reduce(
        (total, category) => total + (Number(row.amounts[category.id]) || 0),
        0,
    )
}

function editableCellValue(rowIndex: number, columnIndex: number) {
    const row = rows.value[rowIndex]
    if (!row) return ''
    if (columnIndex === 0) return row.date
    if (columnIndex === 1) return String(row.attendance)
    const category = categories.value[columnIndex - 2]
    return category ? String(row.amounts[category.id] ?? 0) : ''
}

const activeCellAddress = computed(() => {
    if (!activeCell.value) return '—'
    return `${columnLetter(activeCell.value.columnIndex + 2)}${activeCell.value.rowIndex + 2}`
})
const activeCellValue = computed(() => {
    if (!activeCell.value) return 'Selecciona una celda para editarla'
    return editableCellValue(activeCell.value.rowIndex, activeCell.value.columnIndex)
})

function formatMoney(value: number) {
    return value.toLocaleString('es-SV', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

function applyCommonDate() {
    if (!commonDate.value) return
    rows.value.forEach((row) => {
        row.date = commonDate.value
        row.selected = !isAlreadyRegistered(row)
    })
}

function toggleAll() {
    const next = !allAvailableSelected.value
    rows.value.forEach((row) => {
        if (!isAlreadyRegistered(row)) row.selected = next
    })
}

function syncRowAvailability(row: BulkRow) {
    row.selected = !isAlreadyRegistered(row)
}

function activateCell(rowIndex: number, columnIndex: number, event: FocusEvent) {
    activeCell.value = { rowIndex, columnIndex }
    const input = event.target as HTMLInputElement
    if (input.type !== 'date') input.select()
}

async function focusCell(rowIndex: number, columnIndex: number) {
    if (!import.meta.client || rowIndex < 0 || rowIndex >= rows.value.length) return
    await nextTick()
    const input = document.querySelector<HTMLInputElement>(
        `[data-sheet-cell="${rowIndex}:${columnIndex}"]`,
    )
    input?.focus()
}

function handleCellKeydown(event: KeyboardEvent, rowIndex: number, columnIndex: number) {
    if (event.key !== 'Enter') return
    event.preventDefault()
    focusCell(rowIndex + (event.shiftKey ? -1 : 1), columnIndex)
}

function normalizePastedDate(value: string) {
    const trimmed = value.trim()
    if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) return trimmed
    const match = /^(\d{1,2})[\/-](\d{1,2})[\/-](\d{4})$/.exec(trimmed)
    if (!match) return null
    return `${match[3]}-${match[2]!.padStart(2, '0')}-${match[1]!.padStart(2, '0')}`
}

function normalizePastedNumber(value: string) {
    const cleaned = value.replace(/[$\s]/g, '')
    const normalized =
        cleaned.includes(',') && !cleaned.includes('.')
            ? cleaned.replace(',', '.')
            : cleaned.replace(/,/g, '')
    const number = Number(normalized)
    return Number.isFinite(number) ? Math.max(0, number) : null
}

function setEditableCell(rowIndex: number, columnIndex: number, value: string) {
    const row = rows.value[rowIndex]
    if (!row) return false
    if (columnIndex === 0) {
        const date = normalizePastedDate(value)
        if (!date) return false
        row.date = date
        syncRowAvailability(row)
        return true
    }

    const number = normalizePastedNumber(value)
    if (number === null) return false
    if (columnIndex === 1) {
        row.attendance = Math.round(number)
        return true
    }

    const category = categories.value[columnIndex - 2]
    if (!category) return false
    row.amounts[category.id] = number
    return true
}

function handleSheetPaste(event: ClipboardEvent, startRow: number, startColumn: number) {
    const clipboard = event.clipboardData?.getData('text/plain')
    if (!clipboard) return
    event.preventDefault()

    const matrix = clipboard
        .trimEnd()
        .split(/\r?\n/)
        .map((line) => line.split('\t'))
    let pastedCells = 0

    matrix.forEach((values, rowOffset) => {
        values.forEach((value, columnOffset) => {
            if (setEditableCell(startRow + rowOffset, startColumn + columnOffset, value)) {
                pastedCells += 1
            }
        })
    })

    if (pastedCells > 1) toast.success(`${pastedCells} celdas pegadas`)
}

async function submit() {
    if (categories.value.length === 0) {
        toast.error('No hay categorías de ofrenda activas')
        return
    }
    if (selectedRows.value.length === 0) {
        toast.error('Selecciona al menos una reunión pendiente')
        return
    }
    if (selectedRows.value.some((row) => !row.date)) {
        toast.error('Todas las reuniones seleccionadas deben tener fecha')
        return
    }

    const payload: OfferingInput[] = selectedRows.value.map((row) => ({
        meetingId: row.meeting.id,
        date: row.date,
        attendance: Math.max(0, Number(row.attendance) || 0),
        currency: 'USD',
        notes: null,
        details: categories.value.map((category) => ({
            categoryId: category.id,
            amount: Math.max(0, Number(row.amounts[category.id]) || 0),
            notes: null,
        })),
    }))

    try {
        await bulkMutation.mutateAsync(payload)
        toast.success(`${payload.length} reuniones registradas correctamente`)
        await navigateTo('/finanzas/ofrendas')
    } catch (error) {
        toast.error(resolveHttpErrorMessage(error, 'No fue posible guardar el registro global'))
    }
}

const inputClass =
    'h-10 w-full rounded border border-outline-variant bg-surface-container px-3 text-sm text-on-surface focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary disabled:opacity-50'
const labelClass = 'text-[10px] font-semibold uppercase tracking-wider text-on-surface-variant'
</script>

<template>
    <div class="pb-24 pt-20">
        <header
            class="sticky top-16 z-30 border-b border-outline-variant bg-surface/95 backdrop-blur-md"
        >
            <div class="flex w-full items-center justify-between gap-4 px-4 py-3 lg:px-6">
                <div class="flex min-w-0 items-center gap-3">
                    <NuxtLink
                        to="/finanzas/ofrendas"
                        class="flex size-9 shrink-0 items-center justify-center rounded border border-outline-variant text-on-surface-variant hover:border-primary hover:text-primary"
                        aria-label="Volver"
                    >
                        <ArrowLeft class="size-4" />
                    </NuxtLink>
                    <div class="min-w-0">
                        <p
                            class="text-[10px] font-semibold uppercase tracking-[0.24em] text-primary"
                        >
                            Finanzas · Registro global
                        </p>
                        <div class="flex items-center gap-2">
                            <h1
                                class="truncate font-display text-xl font-semibold text-on-surface md:text-2xl"
                            >
                                Hoja de asistencia y ofrendas
                            </h1>
                            <span
                                class="hidden rounded-sm border border-primary/25 bg-primary/10 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-primary sm:inline"
                            >
                                Vista de hoja
                            </span>
                        </div>
                    </div>
                </div>
                <UiButton
                    type="button"
                    class="h-9 shrink-0 rounded px-4 text-xs uppercase tracking-wider"
                    :loading="bulkMutation.isPending.value"
                    :disabled="isLoading || !!loadError || selectedRows.length === 0"
                    @click="submit"
                >
                    <Save class="mr-2 size-4" /> Guardar {{ selectedRows.length }}
                </UiButton>
            </div>
        </header>

        <main
            class="min-h-[calc(100vh-8rem)] w-full space-y-4 bg-surface-container-low/20 px-4 py-5 lg:px-6"
        >
            <section class="border border-outline-variant bg-surface-container-low shadow-sm">
                <div
                    class="flex items-center gap-2 border-b border-outline-variant bg-surface-container-high px-3 py-2 text-on-surface"
                >
                    <Table2 class="size-4 text-primary" />
                    <span class="text-xs font-semibold">Cobertura de la hoja</span>
                    <span class="ml-auto text-[10px] text-on-surface-variant">
                        Solo reuniones bajo tu supervisión
                    </span>
                </div>
                <div class="grid gap-3 p-3 md:grid-cols-3 xl:grid-cols-[1fr_1fr_1fr_1.2fr]">
                    <div>
                        <label :class="labelClass">Distrito</label>
                        <UiSearchSelect
                            v-model="selectedDistrictId"
                            class="mt-1"
                            size="sm"
                            :options="districtOptions"
                            placeholder="Distrito"
                            search-placeholder="Buscar distrito…"
                        />
                    </div>
                    <div>
                        <label :class="labelClass">Zona</label>
                        <UiSearchSelect
                            v-model="selectedZoneId"
                            class="mt-1"
                            size="sm"
                            :options="zoneOptions"
                            placeholder="Zona"
                            search-placeholder="Buscar zona…"
                            :disabled="selectedDistrictId === null"
                        />
                    </div>
                    <div>
                        <label :class="labelClass">Sector</label>
                        <UiSearchSelect
                            v-model="selectedSectorId"
                            class="mt-1"
                            size="sm"
                            :options="sectorOptions"
                            placeholder="Sector"
                            search-placeholder="Buscar sector…"
                            :disabled="selectedZoneId === null"
                        />
                    </div>
                    <div>
                        <label :class="labelClass" for="bulk-common-date">Rellenar fecha</label>
                        <div class="mt-1 flex h-8">
                            <input
                                id="bulk-common-date"
                                v-model="commonDate"
                                type="date"
                                class="min-w-0 flex-1 border border-outline-variant bg-surface-container px-2 text-xs text-on-surface outline-none focus:border-primary"
                            />
                            <button
                                type="button"
                                class="inline-flex items-center gap-1.5 border border-l-0 border-primary bg-primary px-3 text-[10px] font-semibold uppercase tracking-wider text-primary-foreground hover:opacity-90"
                                @click="applyCommonDate"
                            >
                                <CalendarCheck class="size-3.5" /> Aplicar a todas
                            </button>
                        </div>
                    </div>
                </div>
            </section>

            <div
                v-if="isLoading"
                class="border border-outline-variant bg-surface-container p-10 text-center text-sm text-on-surface-variant"
            >
                Cargando reuniones y categorías…
            </div>
            <div
                v-else-if="loadError"
                class="border border-destructive/30 bg-destructive/10 p-8 text-center text-sm text-destructive"
            >
                No fue posible cargar la información del registro global.
            </div>

            <section
                v-else
                class="overflow-hidden border border-outline-variant bg-surface shadow-sm"
            >
                <div
                    class="flex flex-wrap items-center gap-x-2 gap-y-2 border-b border-outline-variant bg-surface-container-low px-3 py-2"
                >
                    <button
                        type="button"
                        class="inline-flex h-7 items-center gap-1.5 border border-outline-variant bg-surface px-2.5 text-[10px] font-semibold text-on-surface hover:border-primary hover:text-primary disabled:opacity-40"
                        :disabled="rows.length === 0"
                        @click="toggleAll"
                    >
                        <CheckCheck class="size-3.5" />
                        {{ allAvailableSelected ? 'Deseleccionar' : 'Seleccionar pendientes' }}
                    </button>
                    <span class="h-5 w-px bg-outline-variant" />
                    <span
                        class="inline-flex items-center gap-1.5 text-[10px] text-on-surface-variant"
                    >
                        <ClipboardPaste class="size-3.5 text-primary" />
                        Puedes copiar y pegar varias celdas directamente desde Excel
                    </span>
                    <span class="ml-auto hidden text-[10px] text-on-surface-variant md:inline">
                        Enter: bajar una fila · Shift + Enter: subir
                    </span>
                </div>

                <div
                    class="flex h-8 items-center border-b border-outline-variant bg-surface-container-low text-xs"
                >
                    <span
                        class="flex h-full w-20 shrink-0 items-center justify-center border-r border-outline-variant font-semibold text-on-surface"
                    >
                        {{ activeCellAddress }}
                    </span>
                    <span
                        class="flex h-full w-10 shrink-0 items-center justify-center border-r border-outline-variant font-display italic text-primary"
                    >
                        fx
                    </span>
                    <span class="min-w-0 flex-1 truncate px-3 text-on-surface-variant">
                        {{ activeCellValue }}
                    </span>
                </div>

                <div v-if="rows.length === 0" class="px-6 py-16 text-center">
                    <Table2 class="mx-auto size-8 text-on-surface-variant/40" />
                    <p class="mt-3 font-display text-lg font-semibold text-on-surface">
                        No hay reuniones en este sector
                    </p>
                    <p class="mt-1 text-sm text-on-surface-variant">
                        Elige otro sector o agrega reuniones desde el catálogo.
                    </p>
                </div>

                <div
                    v-else
                    class="sheet-scroll max-h-[calc(100vh-310px)] min-h-[330px] overflow-auto"
                >
                    <table class="sheet-table w-full text-xs">
                        <colgroup>
                            <col class="w-14" />
                            <col class="w-[290px]" />
                            <col class="w-[120px]" />
                            <col class="w-[145px]" />
                            <col class="w-[115px]" />
                            <col
                                v-for="category in categories"
                                :key="`col-${category.id}`"
                                class="w-[130px]"
                            />
                            <col class="w-[125px]" />
                            <col class="w-[140px]" />
                        </colgroup>
                        <thead>
                            <tr class="sheet-letter-row">
                                <th class="sheet-corner sheet-sticky-number">#</th>
                                <th
                                    v-for="(column, index) in sheetColumns"
                                    :key="`letter-${column}`"
                                    :class="index === 0 ? 'sheet-sticky-meeting' : ''"
                                >
                                    {{ columnLetter(index) }}
                                </th>
                            </tr>
                            <tr class="sheet-header-row">
                                <th class="sheet-sticky-number">
                                    <input
                                        type="checkbox"
                                        class="size-3.5 accent-primary"
                                        :checked="allAvailableSelected"
                                        aria-label="Seleccionar todas las reuniones pendientes"
                                        @change="toggleAll"
                                    />
                                </th>
                                <th class="sheet-sticky-meeting text-left">Reunión</th>
                                <th>Horario</th>
                                <th>Fecha</th>
                                <th>Asistencia</th>
                                <th v-for="category in categories" :key="category.id">
                                    {{ category.name }}
                                </th>
                                <th>Total</th>
                                <th>Estado</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr
                                v-for="(row, rowIndex) in rows"
                                :key="row.meeting.id"
                                :class="{
                                    'sheet-row-disabled': !row.selected,
                                    'sheet-row-registered': isAlreadyRegistered(row),
                                }"
                            >
                                <td class="sheet-sticky-number sheet-row-number">
                                    <div class="flex items-center justify-center gap-1.5">
                                        <input
                                            v-model="row.selected"
                                            type="checkbox"
                                            class="size-3.5 accent-primary"
                                            :disabled="isAlreadyRegistered(row)"
                                            :aria-label="`Incluir ${row.meeting.title}`"
                                        />
                                        <span>{{ rowIndex + 2 }}</span>
                                    </div>
                                </td>
                                <td class="sheet-sticky-meeting px-2.5 py-1.5 text-left">
                                    <div class="flex items-center gap-2">
                                        <span
                                            class="size-2 shrink-0 rounded-full"
                                            :style="{ backgroundColor: row.meeting.color }"
                                        />
                                        <div class="min-w-0">
                                            <p class="truncate font-semibold text-on-surface">
                                                {{ row.meeting.title }}
                                            </p>
                                            <p class="truncate text-[10px] text-on-surface-variant">
                                                {{ row.meeting.typeName ?? 'Reunión' }} · Esperados
                                                {{ row.meeting.expectedAttendees }}
                                            </p>
                                        </div>
                                    </div>
                                </td>
                                <td
                                    class="whitespace-nowrap px-2 text-center text-on-surface-variant"
                                >
                                    {{ row.meeting.startTime }}–{{ row.meeting.endTime }}
                                </td>
                                <td class="sheet-editable-cell">
                                    <input
                                        v-model="row.date"
                                        type="date"
                                        class="sheet-cell"
                                        :data-sheet-cell="`${rowIndex}:0`"
                                        @focus="activateCell(rowIndex, 0, $event)"
                                        @change="syncRowAvailability(row)"
                                        @keydown="handleCellKeydown($event, rowIndex, 0)"
                                        @paste="handleSheetPaste($event, rowIndex, 0)"
                                    />
                                </td>
                                <td class="sheet-editable-cell">
                                    <input
                                        v-model.number="row.attendance"
                                        type="number"
                                        min="0"
                                        class="sheet-cell text-right"
                                        :data-sheet-cell="`${rowIndex}:1`"
                                        :disabled="!row.selected"
                                        @focus="activateCell(rowIndex, 1, $event)"
                                        @keydown="handleCellKeydown($event, rowIndex, 1)"
                                        @paste="handleSheetPaste($event, rowIndex, 1)"
                                    />
                                </td>
                                <td
                                    v-for="(category, categoryIndex) in categories"
                                    :key="`${row.meeting.id}-${category.id}`"
                                    class="sheet-editable-cell"
                                >
                                    <div class="relative">
                                        <span
                                            class="pointer-events-none absolute left-2 top-1/2 -translate-y-1/2 text-[10px] text-on-surface-variant/70"
                                        >
                                            $
                                        </span>
                                        <input
                                            v-model.number="row.amounts[category.id]"
                                            type="number"
                                            min="0"
                                            step="0.01"
                                            class="sheet-cell pl-5 text-right"
                                            :data-sheet-cell="`${rowIndex}:${categoryIndex + 2}`"
                                            :disabled="!row.selected"
                                            @focus="
                                                activateCell(rowIndex, categoryIndex + 2, $event)
                                            "
                                            @keydown="
                                                handleCellKeydown(
                                                    $event,
                                                    rowIndex,
                                                    categoryIndex + 2,
                                                )
                                            "
                                            @paste="
                                                handleSheetPaste(
                                                    $event,
                                                    rowIndex,
                                                    categoryIndex + 2,
                                                )
                                            "
                                        />
                                    </div>
                                </td>
                                <td
                                    class="bg-surface-container-low px-2 text-right font-semibold text-on-surface"
                                >
                                    ${{ formatMoney(rowTotal(row)) }}
                                </td>
                                <td class="px-2 text-center">
                                    <span
                                        v-if="isAlreadyRegistered(row)"
                                        class="inline-flex whitespace-nowrap bg-primary/15 px-2 py-1 text-[10px] font-semibold text-primary"
                                        :title="`Registrada el ${formatMeetingDate(row.date)}`"
                                    >
                                        Ya registrado
                                    </span>
                                    <span
                                        v-else-if="row.selected"
                                        class="inline-flex whitespace-nowrap bg-primary/15 px-2 py-1 text-[10px] font-semibold text-primary"
                                    >
                                        Pendiente
                                    </span>
                                    <span v-else class="text-[10px] text-on-surface-variant">
                                        Omitida
                                    </span>
                                </td>
                            </tr>
                        </tbody>
                        <tfoot>
                            <tr class="sheet-total-row">
                                <td class="sheet-sticky-number" />
                                <td class="sheet-sticky-meeting px-2.5 text-left font-semibold">
                                    TOTALES SELECCIONADOS
                                </td>
                                <td />
                                <td class="text-center">{{ selectedRows.length }} reuniones</td>
                                <td class="px-2 text-right font-semibold">{{ totalAttendance }}</td>
                                <td
                                    v-for="category in categories"
                                    :key="`total-${category.id}`"
                                    class="px-2 text-right"
                                >
                                    ${{
                                        formatMoney(
                                            selectedRows.reduce(
                                                (sum, row) =>
                                                    sum + (Number(row.amounts[category.id]) || 0),
                                                0,
                                            ),
                                        )
                                    }}
                                </td>
                                <td class="px-2 text-right font-bold">
                                    ${{ formatMoney(totalAmount) }}
                                </td>
                                <td />
                            </tr>
                        </tfoot>
                    </table>
                </div>
            </section>
        </main>

        <footer
            class="fixed inset-x-0 bottom-0 z-30 border-t border-outline-variant bg-surface/95 text-on-surface shadow-[0_-8px_24px_rgba(0,0,0,.16)] backdrop-blur-md"
        >
            <div
                class="flex min-h-12 w-full flex-wrap items-center justify-between gap-3 px-4 py-2 lg:px-6"
            >
                <div class="flex items-center gap-5 text-[11px]">
                    <span class="font-semibold uppercase tracking-wider text-primary">Listo</span>
                    <span
                        >Reuniones: <strong>{{ selectedRows.length }}</strong></span
                    >
                    <span
                        >Asistencia: <strong>{{ totalAttendance }}</strong></span
                    >
                    <span>
                        Ofrenda: <strong>${{ formatMoney(totalAmount) }}</strong>
                    </span>
                </div>
                <button
                    type="button"
                    class="inline-flex h-8 items-center gap-2 bg-primary px-4 text-[10px] font-bold uppercase tracking-wider text-primary-foreground hover:opacity-90 disabled:opacity-50"
                    :disabled="selectedRows.length === 0 || bulkMutation.isPending.value"
                    @click="submit"
                >
                    <HandCoins class="size-4" />
                    {{ bulkMutation.isPending.value ? 'Guardando…' : 'Registrar todo' }}
                </button>
            </div>
        </footer>
    </div>
</template>

<style scoped>
.sheet-scroll {
    scrollbar-color: rgb(107 114 128 / 45%) transparent;
    scrollbar-width: thin;
}

.sheet-table {
    min-width: max-content;
    border-collapse: separate;
    border-spacing: 0;
    table-layout: fixed;
}

.sheet-table th,
.sheet-table td {
    height: 38px;
    border-bottom: 1px solid var(--outline-variant);
    border-right: 1px solid var(--outline-variant);
}

.sheet-table tr > :last-child {
    border-right: 0;
}

.sheet-letter-row th {
    position: sticky;
    top: 0;
    z-index: 12;
    height: 24px;
    background: var(--surface-container-high);
    color: var(--on-surface-variant);
    font-size: 10px;
    font-weight: 600;
    text-align: center;
}

.sheet-header-row th {
    position: sticky;
    top: 24px;
    z-index: 12;
    height: 36px;
    padding: 0 8px;
    background: var(--surface-container);
    color: var(--on-surface);
    font-size: 10px;
    font-weight: 700;
    letter-spacing: 0.06em;
    text-align: center;
    text-transform: uppercase;
}

.sheet-sticky-number {
    position: sticky !important;
    left: 0;
    z-index: 10;
    width: 56px;
    min-width: 56px;
    background: var(--surface-container-high);
}

.sheet-sticky-meeting {
    position: sticky !important;
    left: 56px;
    z-index: 9;
    background: var(--surface);
    box-shadow: 2px 0 0 var(--outline-variant);
}

.sheet-letter-row .sheet-sticky-number,
.sheet-letter-row .sheet-sticky-meeting,
.sheet-header-row .sheet-sticky-number,
.sheet-header-row .sheet-sticky-meeting {
    z-index: 15;
}

.sheet-row-number {
    color: var(--on-surface-variant);
    font-size: 10px;
    text-align: center;
}

.sheet-editable-cell {
    padding: 0;
    background: var(--surface);
}

.sheet-cell {
    width: 100%;
    height: 37px;
    border: 0;
    border-radius: 0;
    background: transparent;
    padding: 0 8px;
    color: var(--on-surface);
    font-size: 12px;
    outline: none;
}

.sheet-cell:focus {
    position: relative;
    z-index: 2;
    background: color-mix(in srgb, var(--primary) 6%, var(--surface));
    box-shadow: inset 0 0 0 2px var(--primary);
}

.sheet-cell:disabled {
    cursor: not-allowed;
    color: var(--on-surface-variant);
}

.sheet-row-disabled td:not(.sheet-row-number) {
    background-color: color-mix(in srgb, var(--surface-container) 70%, transparent);
}

.sheet-row-disabled .sheet-sticky-meeting,
.sheet-row-disabled .sheet-editable-cell {
    opacity: 0.72;
}

.sheet-row-registered td {
    background-color: color-mix(in srgb, var(--primary) 5%, var(--surface));
}

.sheet-total-row td {
    position: sticky;
    bottom: 0;
    z-index: 8;
    height: 40px;
    border-top: 2px solid var(--primary);
    border-bottom: 0;
    background: var(--surface-container-high);
    color: var(--on-surface);
    font-size: 11px;
}

.sheet-total-row .sheet-sticky-number,
.sheet-total-row .sheet-sticky-meeting {
    z-index: 11;
    background: var(--surface-container-high);
}
</style>
