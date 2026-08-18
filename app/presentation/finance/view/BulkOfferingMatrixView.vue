<script setup lang="ts">
import { ArrowLeft, ClipboardPaste, Loader2, Save, Table2 } from '@lucide/vue'
import { useAppToast } from '~/presentation/shared/composables/useAppToast'
import { resolveHttpErrorMessage } from '~/utils/http/resolve-http-error-message.util'
import { formatShortIsoDate } from '~/utils/date/date-format.util'
import { useRecordOccurrencesBulkMutation } from '../composables/useOccurrenceMutations'
import {
    useOfferingCategoriesQuery,
    usePendingOccurrencesQuery,
} from '../composables/useOccurrenceQueries'
import type { OccurrenceRecord } from '../interfaces/occurrence.interface'
import { normalizePastedNumber, parseClipboardMatrix } from '../utils/sheet-paste.util'

defineOptions({ name: 'BulkOfferingMatrixView' })

useHead({ title: 'Registro global · Ofrendas · Sistema' })

interface MatrixRow {
    occurrence: OccurrenceRecord
    attendance: number | null
    amounts: Record<number, number | null>
}

const toast = useAppToast()
const pendingQuery = usePendingOccurrencesQuery()
const categoriesQuery = useOfferingCategoriesQuery()
const bulkMutation = useRecordOccurrencesBulkMutation()

const categories = computed(() =>
    (categoriesQuery.data.value ?? []).filter((category) => category.isActive),
)
const isLoading = computed(() => pendingQuery.isPending.value || categoriesQuery.isPending.value)
const isSaving = computed(() => bulkMutation.isPending.value)

const selectedSector = ref<string>('')
const rows = ref<MatrixRow[]>([])
const formError = ref<string | null>(null)

const occurrences = computed(() => pendingQuery.data.value ?? [])

const sectorOptions = computed(() =>
    [...new Set(occurrences.value.map((item) => item.sectorName))].sort((a, b) =>
        a.localeCompare(b, 'es'),
    ),
)

/// Las columnas de la matriz son la asistencia más cada categoría activa.
const columnCount = computed(() => 1 + categories.value.length)

function buildRows() {
    const source = occurrences.value.filter(
        (item) => !selectedSector.value || item.sectorName === selectedSector.value,
    )

    rows.value = [...source]
        .sort(
            (left, right) =>
                left.meetingTitle.localeCompare(right.meetingTitle, 'es') ||
                left.date.localeCompare(right.date),
        )
        .map((occurrence) => ({
            occurrence,
            attendance: null,
            amounts: Object.fromEntries(categories.value.map((category) => [category.id, null])),
        }))
    formError.value = null
}

watch([occurrences, categories, selectedSector], buildRows, { immediate: true })

function rowTotal(row: MatrixRow) {
    return Object.values(row.amounts).reduce<number>((sum, amount) => sum + (amount ?? 0), 0)
}

/// Una fila cuenta como capturada en cuanto tenga asistencia.
const filledRows = computed(() => rows.value.filter((row) => row.attendance !== null))

const grandTotal = computed(() => filledRows.value.reduce((sum, row) => sum + rowTotal(row), 0))

function setCell(rowIndex: number, columnIndex: number, value: string) {
    const row = rows.value[rowIndex]
    if (!row) return false

    const number = normalizePastedNumber(value)
    if (number === null) return false

    if (columnIndex === 0) {
        row.attendance = Math.round(number)
        return true
    }

    const category = categories.value[columnIndex - 1]
    if (!category) return false
    row.amounts[category.id] = number
    return true
}

function handleSheetPaste(event: ClipboardEvent, startRow: number, startColumn: number) {
    const clipboard = event.clipboardData?.getData('text/plain')
    if (!clipboard) return
    event.preventDefault()

    let pastedCells = 0
    parseClipboardMatrix(clipboard).forEach((values, rowOffset) => {
        values.forEach((value, columnOffset) => {
            if (setCell(startRow + rowOffset, startColumn + columnOffset, value)) pastedCells += 1
        })
    })

    if (pastedCells > 1) toast.success(`${pastedCells} celdas pegadas`)
}

async function submit() {
    formError.value = null

    if (filledRows.value.length === 0) {
        formError.value = 'Captura la asistencia de al menos una fecha.'
        return
    }

    const entries = filledRows.value.map((row) => {
        const details = Object.entries(row.amounts)
            .filter(([, amount]) => amount !== null && amount > 0)
            .map(([categoryId, amount]) => ({
                categoryId: Number(categoryId),
                amount: amount as number,
                notes: null,
            }))

        return {
            occurrenceId: row.occurrence.id,
            attendance: row.attendance as number,
            totalAmount: details.length > 0 ? null : 0,
            currency: 'USD',
            notes: null,
            details,
        }
    })

    try {
        await bulkMutation.mutateAsync(entries)
        toast.success(`${entries.length} ${entries.length === 1 ? 'fecha' : 'fechas'} registradas`)
        await navigateTo('/finanzas/ofrendas')
    } catch (error) {
        formError.value = resolveHttpErrorMessage(error, 'No fue posible registrar las fechas')
    }
}

const cellClass =
    'w-full rounded border border-outline-variant bg-surface px-2 py-1.5 text-right text-sm tabular-nums text-on-surface outline-none focus:border-primary'
</script>

<template>
    <main class="mx-auto w-full max-w-system px-6 pb-20 pt-24 lg:px-10">
        <button
            type="button"
            class="mb-6 inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-on-surface-variant hover:text-on-surface"
            @click="navigateTo('/finanzas/ofrendas')"
        >
            <ArrowLeft class="size-4" /> Volver a pendientes
        </button>

        <section class="border-b border-outline-variant pb-8">
            <p class="text-xs font-semibold uppercase tracking-[0.4em] text-on-surface-variant">
                Finanzas · Registro global
            </p>
            <h1 class="mt-4 font-display text-4xl font-semibold text-on-surface">
                Captura en matriz
            </h1>
            <p class="mt-3 max-w-2xl text-sm leading-relaxed text-on-surface-variant">
                Todas las fechas pendientes en una sola cuadrícula. Llena las que tengas y deja el
                resto en blanco: solo se registran las filas con asistencia.
            </p>
        </section>

        <section class="mt-8 flex flex-wrap items-end justify-between gap-4">
            <div v-if="sectorOptions.length > 1">
                <label
                    class="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-on-surface-variant"
                    for="matriz-sector"
                >
                    Sector
                </label>
                <select
                    id="matriz-sector"
                    v-model="selectedSector"
                    class="rounded border border-outline-variant bg-surface px-3 py-2 text-sm text-on-surface outline-none focus:border-primary"
                >
                    <option value="">Todos</option>
                    <option v-for="sector in sectorOptions" :key="sector" :value="sector">
                        {{ sector }}
                    </option>
                </select>
            </div>

            <p
                class="flex items-center gap-2 rounded border border-outline-variant bg-surface-container-low px-3 py-2 text-xs text-on-surface-variant"
            >
                <ClipboardPaste class="size-3.5 shrink-0 text-primary" />
                Puedes pegar un bloque desde Excel sobre cualquier celda.
            </p>
        </section>

        <section class="mt-6">
            <div
                v-if="isLoading"
                class="rounded-lg border border-outline-variant bg-surface-container-low px-6 py-12 text-center text-sm text-on-surface-variant"
            >
                Cargando fechas pendientes…
            </div>

            <div
                v-else-if="rows.length === 0"
                class="flex flex-col items-center gap-3 rounded-lg border border-outline-variant bg-surface-container-low px-6 py-16 text-center"
            >
                <Table2 class="size-10 text-primary" />
                <h3 class="font-display text-2xl font-semibold text-on-surface">
                    Nada que capturar
                </h3>
                <p class="text-sm text-on-surface-variant">
                    No hay fechas pendientes en este alcance.
                </p>
            </div>

            <div v-else class="overflow-x-auto rounded-lg border border-outline-variant">
                <table class="w-full min-w-[720px] border-collapse text-sm">
                    <thead>
                        <tr class="bg-surface-container-high text-on-surface-variant">
                            <th
                                class="px-3 py-3 text-left text-[10px] font-semibold uppercase tracking-wider"
                            >
                                Reunión
                            </th>
                            <th
                                class="px-3 py-3 text-left text-[10px] font-semibold uppercase tracking-wider"
                            >
                                Fecha
                            </th>
                            <th
                                class="px-3 py-3 text-right text-[10px] font-semibold uppercase tracking-wider"
                            >
                                Asistencia
                            </th>
                            <th
                                v-for="category in categories"
                                :key="category.id"
                                class="px-3 py-3 text-right text-[10px] font-semibold uppercase tracking-wider"
                            >
                                {{ category.name }}
                            </th>
                            <th
                                class="px-3 py-3 text-right text-[10px] font-semibold uppercase tracking-wider"
                            >
                                Total
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr
                            v-for="(row, rowIndex) in rows"
                            :key="row.occurrence.id"
                            class="border-t border-outline-variant"
                            :class="row.attendance !== null ? 'bg-primary/5' : 'bg-surface'"
                        >
                            <td class="max-w-[240px] px-3 py-2">
                                <span class="flex items-center gap-2">
                                    <span
                                        class="size-2 shrink-0 rounded-full"
                                        :style="{ backgroundColor: row.occurrence.meetingColor }"
                                    />
                                    <span class="truncate text-on-surface">
                                        {{ row.occurrence.meetingTitle }}
                                    </span>
                                </span>
                            </td>
                            <td
                                class="whitespace-nowrap px-3 py-2 tabular-nums text-on-surface-variant"
                            >
                                {{ formatShortIsoDate(row.occurrence.date) }}
                            </td>
                            <td class="px-3 py-2">
                                <input
                                    v-model.number="row.attendance"
                                    type="number"
                                    min="0"
                                    placeholder="—"
                                    :class="cellClass"
                                    :aria-label="`Asistencia de ${row.occurrence.meetingTitle} el ${row.occurrence.date}`"
                                    @paste="handleSheetPaste($event, rowIndex, 0)"
                                />
                            </td>
                            <td
                                v-for="(category, columnIndex) in categories"
                                :key="category.id"
                                class="px-3 py-2"
                            >
                                <input
                                    v-model.number="row.amounts[category.id]"
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    placeholder="—"
                                    :class="cellClass"
                                    :aria-label="`${category.name} de ${row.occurrence.meetingTitle} el ${row.occurrence.date}`"
                                    @paste="handleSheetPaste($event, rowIndex, columnIndex + 1)"
                                />
                            </td>
                            <td
                                class="whitespace-nowrap px-3 py-2 text-right font-semibold tabular-nums"
                                :class="
                                    rowTotal(row) > 0 ? 'text-primary' : 'text-on-surface-variant'
                                "
                            >
                                ${{ rowTotal(row).toFixed(2) }}
                            </td>
                        </tr>
                    </tbody>
                    <tfoot>
                        <tr class="border-t border-outline-variant bg-surface-container-high">
                            <td
                                :colspan="2 + columnCount"
                                class="px-3 py-3 text-right text-xs font-semibold uppercase tracking-wider text-on-surface-variant"
                            >
                                {{ filledRows.length }} de {{ rows.length }} fechas capturadas
                            </td>
                            <td
                                class="whitespace-nowrap px-3 py-3 text-right font-display text-lg font-semibold tabular-nums text-on-surface"
                            >
                                ${{ grandTotal.toFixed(2) }}
                            </td>
                        </tr>
                    </tfoot>
                </table>
            </div>
        </section>

        <section v-if="rows.length > 0" class="mt-6 flex flex-col gap-3">
            <p
                v-if="formError"
                role="alert"
                class="rounded border border-destructive/40 bg-destructive/10 px-3 py-2 text-xs text-destructive"
            >
                {{ formError }}
            </p>
            <div class="flex justify-end gap-2">
                <UiButton
                    variant="outline"
                    type="button"
                    class="h-11 rounded px-5 text-xs uppercase tracking-wider"
                    @click="navigateTo('/finanzas/ofrendas')"
                >
                    Cancelar
                </UiButton>
                <UiButton
                    type="button"
                    class="h-11 rounded px-6 text-xs uppercase tracking-wider"
                    :disabled="isSaving"
                    @click="submit"
                >
                    <Loader2 v-if="isSaving" class="mr-2 size-4 animate-spin" />
                    <Save v-else class="mr-2 size-4" />
                    Registrar {{ filledRows.length || '' }}
                </UiButton>
            </div>
        </section>
    </main>
</template>
