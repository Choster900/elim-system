<script setup lang="ts">
import { CalendarClock, Check, Loader2, X } from '@lucide/vue'
import { useAppToast } from '~/presentation/shared/composables/useAppToast'
import { resolveHttpErrorMessage } from '~/utils/http/resolve-http-error-message.util'
import { formatShortIsoDate } from '~/utils/date/date-format.util'
import { useRecordOccurrencesBulkMutation } from '../composables/useOccurrenceMutations'
import type { OfferingCategoryOption, PendingGroup } from '../interfaces/occurrence.interface'

defineOptions({ name: 'OccurrenceCaptureDrawer' })

const props = defineProps<{
    open: boolean
    group: PendingGroup | null
    categories: OfferingCategoryOption[]
}>()

const emit = defineEmits<{ close: [] }>()

interface CaptureRow {
    occurrenceId: number
    date: string
    /// Una fila sin marcar simplemente no se envía: llenar 2 de 4 es lo normal.
    selected: boolean
    attendance: number | null
    amounts: Record<number, number | null>
}

const toast = useAppToast()
const bulkMutation = useRecordOccurrencesBulkMutation()
const rows = ref<CaptureRow[]>([])
const formError = ref<string | null>(null)

const isSaving = computed(() => bulkMutation.isPending.value)
const selectedRows = computed(() => rows.value.filter((row) => row.selected))

function buildRows() {
    rows.value = (props.group?.occurrences ?? []).map((occurrence) => ({
        occurrenceId: occurrence.id,
        date: occurrence.date,
        selected: false,
        attendance: null,
        amounts: Object.fromEntries(props.categories.map((category) => [category.id, null])),
    }))
    formError.value = null
}

watch(() => [props.open, props.group?.meetingId], buildRows, { immediate: true })

function rowTotal(row: CaptureRow) {
    return Object.values(row.amounts).reduce<number>((sum, amount) => sum + (amount ?? 0), 0)
}

const grandTotal = computed(() => selectedRows.value.reduce((sum, row) => sum + rowTotal(row), 0))

/// Marcar la fila al escribir evita el paso extra de tildar la casilla.
function touchRow(row: CaptureRow) {
    row.selected = true
    formError.value = null
}

function toggleAll(value: boolean) {
    rows.value.forEach((row) => {
        row.selected = value
    })
}

async function onSubmit() {
    formError.value = null

    if (selectedRows.value.length === 0) {
        formError.value = 'Marca al menos una fecha para registrar.'
        return
    }

    const incomplete = selectedRows.value.find((row) => row.attendance === null)
    if (incomplete) {
        formError.value = `Indica la asistencia de ${formatShortIsoDate(incomplete.date)}.`
        return
    }

    const entries = selectedRows.value.map((row) => {
        const details = Object.entries(row.amounts)
            .filter(([, amount]) => amount !== null && amount > 0)
            .map(([categoryId, amount]) => ({
                categoryId: Number(categoryId),
                amount: amount as number,
                notes: null,
            }))

        return {
            occurrenceId: row.occurrenceId,
            attendance: row.attendance as number,
            // Sin desglose se envía el total en cero, que es un dato válido: hubo reunión sin ofrenda.
            totalAmount: details.length > 0 ? null : 0,
            currency: 'USD',
            notes: null,
            details,
        }
    })

    try {
        await bulkMutation.mutateAsync(entries)
        const count = entries.length
        toast.success(count === 1 ? 'Fecha registrada' : `${count} fechas registradas`)
        emit('close')
    } catch (error) {
        formError.value = resolveHttpErrorMessage(error, 'No fue posible registrar las fechas')
    }
}

const inputClass =
    'w-full rounded border border-outline-variant bg-surface px-2.5 py-1.5 text-sm text-on-surface outline-none placeholder:text-on-surface-variant/50 focus:border-primary'
</script>

<template>
    <template v-if="open && group">
        <div class="fixed inset-0 z-[60] bg-black/50" @click="emit('close')" />
        <aside
            class="fixed inset-y-0 right-0 z-[61] flex w-[560px] max-w-[96vw] flex-col bg-surface-container-low shadow-2xl"
        >
            <div class="flex-none border-b border-outline-variant px-6 py-5">
                <div class="flex items-start justify-between gap-4">
                    <div class="min-w-0">
                        <span
                            class="text-[11px] font-bold uppercase tracking-[0.2em]"
                            :style="{ color: group.meetingColor }"
                        >
                            Registrar pendientes
                        </span>
                        <h2
                            class="mt-1 truncate font-display text-xl font-semibold text-on-surface"
                        >
                            {{ group.meetingTitle }}
                        </h2>
                        <p class="mt-1 text-xs text-on-surface-variant">
                            {{ group.sectorName }} · {{ group.zoneName }} ·
                            {{ group.occurrences.length }}
                            {{ group.occurrences.length === 1 ? 'fecha' : 'fechas' }}
                        </p>
                    </div>
                    <button
                        type="button"
                        class="text-on-surface-variant hover:text-on-surface"
                        aria-label="Cerrar"
                        @click="emit('close')"
                    >
                        <X class="size-4" />
                    </button>
                </div>

                <p
                    class="mt-3 rounded border border-outline-variant bg-surface px-3 py-2 text-xs text-on-surface-variant"
                >
                    Registra solo las fechas de las que tengas el dato exacto. Las que dejes sin
                    marcar seguirán pendientes.
                </p>
            </div>

            <div class="min-h-0 flex-1 overflow-y-auto px-6 py-5">
                <div class="mb-3 flex items-center justify-between">
                    <button
                        type="button"
                        class="text-xs font-semibold uppercase tracking-wider text-primary hover:underline"
                        @click="toggleAll(selectedRows.length !== rows.length)"
                    >
                        {{
                            selectedRows.length === rows.length ? 'Desmarcar todas' : 'Marcar todas'
                        }}
                    </button>
                    <span class="text-xs text-on-surface-variant">
                        {{ selectedRows.length }} de {{ rows.length }} seleccionadas
                    </span>
                </div>

                <div class="flex flex-col gap-3">
                    <article
                        v-for="row in rows"
                        :key="row.occurrenceId"
                        class="rounded-lg border px-4 py-3 transition-colors"
                        :class="
                            row.selected
                                ? 'border-primary/60 bg-primary/5'
                                : 'border-outline-variant bg-surface'
                        "
                    >
                        <label class="flex cursor-pointer items-center gap-2.5">
                            <input
                                v-model="row.selected"
                                type="checkbox"
                                class="size-4 accent-primary"
                            />
                            <CalendarClock class="size-4 text-on-surface-variant" />
                            <span class="text-sm font-semibold text-on-surface">
                                {{ formatShortIsoDate(row.date) }}
                            </span>
                            <span
                                v-if="row.selected && rowTotal(row) > 0"
                                class="ml-auto text-sm font-semibold tabular-nums text-primary"
                            >
                                ${{ rowTotal(row).toFixed(2) }}
                            </span>
                        </label>

                        <div class="mt-3 grid gap-2.5 sm:grid-cols-2">
                            <div>
                                <label
                                    class="mb-1 block text-[10px] font-semibold uppercase tracking-wider text-on-surface-variant"
                                    :for="`asistencia-${row.occurrenceId}`"
                                >
                                    Asistencia *
                                </label>
                                <input
                                    :id="`asistencia-${row.occurrenceId}`"
                                    v-model.number="row.attendance"
                                    type="number"
                                    min="0"
                                    placeholder="0"
                                    :class="inputClass"
                                    @input="touchRow(row)"
                                />
                            </div>
                            <div v-for="category in categories" :key="category.id">
                                <label
                                    class="mb-1 block truncate text-[10px] font-semibold uppercase tracking-wider text-on-surface-variant"
                                    :for="`cat-${row.occurrenceId}-${category.id}`"
                                >
                                    {{ category.name }}
                                </label>
                                <input
                                    :id="`cat-${row.occurrenceId}-${category.id}`"
                                    v-model.number="row.amounts[category.id]"
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    placeholder="0.00"
                                    :class="inputClass"
                                    @input="touchRow(row)"
                                />
                            </div>
                        </div>
                    </article>
                </div>
            </div>

            <div class="flex-none border-t border-outline-variant px-6 py-4">
                <p
                    v-if="formError"
                    role="alert"
                    class="mb-3 rounded border border-destructive/40 bg-destructive/10 px-3 py-2 text-xs text-destructive"
                >
                    {{ formError }}
                </p>

                <div class="mb-3 flex items-center justify-between text-sm">
                    <span class="text-on-surface-variant">Total a registrar</span>
                    <span class="font-display text-xl font-semibold tabular-nums text-on-surface">
                        ${{ grandTotal.toFixed(2) }}
                    </span>
                </div>

                <div class="flex gap-2">
                    <UiButton
                        variant="outline"
                        type="button"
                        class="h-10 flex-1 rounded text-xs uppercase tracking-wider"
                        @click="emit('close')"
                    >
                        Cancelar
                    </UiButton>
                    <UiButton
                        type="button"
                        class="h-10 flex-1 rounded text-xs uppercase tracking-wider"
                        :disabled="isSaving"
                        @click="onSubmit"
                    >
                        <Loader2 v-if="isSaving" class="mr-2 size-4 animate-spin" />
                        <Check v-else class="mr-2 size-4" />
                        Registrar {{ selectedRows.length || '' }}
                    </UiButton>
                </div>
            </div>
        </aside>
    </template>
</template>
