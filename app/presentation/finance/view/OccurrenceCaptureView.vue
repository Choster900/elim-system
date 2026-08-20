<script setup lang="ts">
import {
    AlertTriangle,
    ArrowLeft,
    Check,
    CircleDot,
    Clock,
    HandCoins,
    Loader2,
    MapPin,
    UserRound,
    Users,
} from '@lucide/vue'
import { useAppToast } from '~/presentation/shared/composables/useAppToast'
import { resolveHttpErrorMessage } from '~/utils/http/resolve-http-error-message.util'
import { formatLocalIsoDate } from '~/utils/date/date-format.util'
import { useRecordOccurrencesBulkMutation } from '../composables/useOccurrenceMutations'
import {
    useAttendanceTypesQuery,
    useOfferingCategoriesQuery,
    usePendingOccurrencesQuery,
} from '../composables/useOccurrenceQueries'

defineOptions({ name: 'OccurrenceCaptureView' })

interface CaptureRow {
    occurrenceId: number
    date: string
    /// Una fila sin marcar no se envía: llenar 2 de 4 es lo normal.
    selected: boolean
    /// Asistencia desglosada por tipo; el total de la fecha es la suma del desglose.
    attendanceByType: Record<number, number | null>
    /// Respaldo cuando el catálogo de tipos está vacío: total escrito a mano.
    attendanceTotal: number | null
    amounts: Record<number, number | null>
    /// Respaldo cuando el catálogo de ofrendas está vacío.
    offeringTotal: number | null
}

const route = useRoute()
const toast = useAppToast()
const pendingQuery = usePendingOccurrencesQuery()
const categoriesQuery = useOfferingCategoriesQuery()
const attendanceTypesQuery = useAttendanceTypesQuery()
const bulkMutation = useRecordOccurrencesBulkMutation()

const meetingId = computed(() => {
    const raw = Number(route.params.meetingId)
    return Number.isSafeInteger(raw) && raw > 0 ? raw : null
})

const categories = computed(() =>
    (categoriesQuery.data.value ?? []).filter((category) => category.isActive),
)
const hasCategories = computed(() => categories.value.length > 0)

/// Solo los tipos vigentes se capturan; los desactivados sobreviven en el histórico.
const attendanceTypes = computed(() =>
    (attendanceTypesQuery.data.value ?? []).filter((type) => type.isActive),
)

/// Sin catálogo vigente se cae al total escrito a mano en vez de bloquear la captura.
const hasAttendanceTypes = computed(() => attendanceTypes.value.length > 0)

/// Las fechas pendientes de esta reunión, de la más antigua a la más reciente.
const occurrences = computed(() =>
    (pendingQuery.data.value ?? [])
        .filter((item) => item.meetingId === meetingId.value)
        .sort((left, right) => left.date.localeCompare(right.date)),
)

const meeting = computed(() => occurrences.value[0] ?? null)

useHead({
    title: computed(() =>
        meeting.value
            ? `Registrar · ${meeting.value.meetingTitle} · Sistema`
            : 'Registrar · Sistema',
    ),
})

const isLoading = computed(
    () =>
        pendingQuery.isPending.value ||
        categoriesQuery.isPending.value ||
        attendanceTypesQuery.isPending.value,
)
const isSaving = computed(() => bulkMutation.isPending.value)

const rows = ref<CaptureRow[]>([])
const formError = ref<string | null>(null)

function buildRows() {
    rows.value = occurrences.value.map((occurrence) => ({
        occurrenceId: occurrence.id,
        date: occurrence.date,
        selected: false,
        attendanceByType: Object.fromEntries(attendanceTypes.value.map((type) => [type.id, null])),
        attendanceTotal: null,
        amounts: Object.fromEntries(categories.value.map((category) => [category.id, null])),
        offeringTotal: null,
    }))
    formError.value = null
}

watch([occurrences, categories, attendanceTypes], buildRows, { immediate: true })

const selectedRows = computed(() => rows.value.filter((row) => row.selected))
const allSelected = computed(
    () => rows.value.length > 0 && selectedRows.value.length === rows.value.length,
)

function rowTotal(row: CaptureRow) {
    if (!hasCategories.value) return row.offeringTotal ?? 0
    return Object.values(row.amounts).reduce<number>((sum, amount) => sum + (amount ?? 0), 0)
}

/// El desglose manda: el total de la fecha es lo que suman sus tipos.
function rowAttendance(row: CaptureRow) {
    if (!hasAttendanceTypes.value) return row.attendanceTotal ?? 0
    return Object.values(row.attendanceByType).reduce<number>(
        (sum, quantity) => sum + (quantity ?? 0),
        0,
    )
}

/// Un cero escrito a propósito cuenta; lo que no cuenta es dejarlo todo en blanco.
function hasAttendance(row: CaptureRow) {
    if (!hasAttendanceTypes.value) return row.attendanceTotal !== null
    return Object.values(row.attendanceByType).some((quantity) => quantity !== null)
}

const grandTotal = computed(() => selectedRows.value.reduce((sum, row) => sum + rowTotal(row), 0))
const totalAttendance = computed(() =>
    selectedRows.value.reduce((sum, row) => sum + rowAttendance(row), 0),
)
const attendanceColumnCount = computed(() =>
    hasAttendanceTypes.value ? attendanceTypes.value.length + 1 : 1,
)
const offeringColumnCount = computed(() => (hasCategories.value ? categories.value.length + 1 : 1))

function attendanceTypeTotal(typeId: number) {
    return selectedRows.value.reduce((sum, row) => sum + (row.attendanceByType[typeId] ?? 0), 0)
}

function categoryTotal(categoryId: number) {
    return selectedRows.value.reduce((sum, row) => sum + (row.amounts[categoryId] ?? 0), 0)
}

/// Marcar la fila al escribir evita el paso extra de tildar la casilla.
function touchRow(row: CaptureRow) {
    row.selected = true
    formError.value = null
}

function numericInputValue(event: Event, integer = false) {
    const input = event.currentTarget as HTMLInputElement
    if (input.value === '') return null

    const value = Number(input.value)
    if (!Number.isFinite(value)) return null
    return integer ? Math.max(0, Math.trunc(value)) : Math.max(0, value)
}

function setAttendanceValue(row: CaptureRow, typeId: number, event: Event) {
    row.attendanceByType[typeId] = numericInputValue(event, true)
    touchRow(row)
}

function setAttendanceTotal(row: CaptureRow, event: Event) {
    row.attendanceTotal = numericInputValue(event, true)
    touchRow(row)
}

function setOfferingValue(row: CaptureRow, categoryId: number, event: Event) {
    row.amounts[categoryId] = numericInputValue(event)
    touchRow(row)
}

function setOfferingTotal(row: CaptureRow, event: Event) {
    row.offeringTotal = numericInputValue(event)
    touchRow(row)
}

/// Enter baja por la misma columna; Shift + Enter sube. Tab conserva el recorrido horizontal.
function moveVertically(event: KeyboardEvent) {
    if (event.key !== 'Enter') return

    const current = event.currentTarget as HTMLInputElement
    const column = current.dataset.captureColumn
    if (!column) return

    const cells = Array.from(
        document.querySelectorAll<HTMLInputElement>(`input[data-capture-column="${column}"]`),
    )
    const index = cells.indexOf(current)
    const next = cells[index + (event.shiftKey ? -1 : 1)]
    if (!next) return

    event.preventDefault()
    next.focus()
    next.select()
}

function selectCellContents(event: FocusEvent) {
    const input = event.currentTarget as HTMLInputElement
    input.select()
}

function toggleAll() {
    const next = !allSelected.value
    rows.value.forEach((row) => {
        row.selected = next
    })
}

const MS_PER_DAY = 86_400_000

function daysSince(isoDate: string | undefined) {
    if (!isoDate) return 0
    const then = new Date(`${isoDate}T00:00:00Z`).getTime()
    if (Number.isNaN(then)) return 0
    const now = new Date()
    const today = Date.UTC(now.getFullYear(), now.getMonth(), now.getDate())
    return Math.max(0, Math.round((today - then) / MS_PER_DAY))
}

// El encabezado se deriva de las ocurrencias, no de `rows`: el watcher que
// construye las filas corre en el siguiente tick, y en ese hueco `rows` está
// vacío aunque la reunión ya se conozca.
const pendingCount = computed(() => occurrences.value.length)
const oldestDaysBehind = computed(() => daysSince(occurrences.value[0]?.date))

function weekdayOf(isoDate: string) {
    return formatLocalIsoDate(isoDate, { weekday: 'long' })
}

function dayOf(isoDate: string) {
    return formatLocalIsoDate(isoDate, { day: '2-digit' })
}

function monthOf(isoDate: string) {
    return formatLocalIsoDate(isoDate, { month: 'short' }).replace('.', '')
}

function yearOf(isoDate: string) {
    return formatLocalIsoDate(isoDate, { year: 'numeric' })
}

function behindLabel(days: number) {
    if (days === 0) return 'hoy'
    if (days === 1) return 'hace 1 día'
    return `hace ${days} días`
}

function formatMoney(value: number) {
    return value.toLocaleString('es-SV', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

async function onSubmit() {
    formError.value = null

    if (selectedRows.value.length === 0) {
        formError.value = 'Marca al menos una fecha para registrar.'
        return
    }

    const incomplete = selectedRows.value.find((row) => !hasAttendance(row))
    if (incomplete) {
        formError.value = `Falta la asistencia del ${weekdayOf(incomplete.date)} ${dayOf(incomplete.date)} de ${monthOf(incomplete.date)}.`
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

        // Solo viaja el tipo que alguien llenó; un blanco no es un cero registrado.
        const attendanceDetails = Object.entries(row.attendanceByType)
            .filter(([, quantity]) => quantity !== null)
            .map(([typeId, quantity]) => ({
                typeId: Number(typeId),
                quantity: quantity as number,
            }))

        return {
            occurrenceId: row.occurrenceId,
            attendance: rowAttendance(row),
            attendanceDetails,
            // Sin catálogo se guarda el total manual; con catálogo manda el desglose.
            totalAmount: details.length > 0 ? null : (row.offeringTotal ?? 0),
            currency: 'USD',
            notes: null,
            details,
        }
    })

    try {
        await bulkMutation.mutateAsync(entries)
        const count = entries.length
        toast.success(count === 1 ? 'Fecha registrada' : `${count} fechas registradas`)
        await navigateTo('/finanzas/ofrendas')
    } catch (error) {
        formError.value = resolveHttpErrorMessage(error, 'No fue posible registrar las fechas')
    }
}

const cellInputClass =
    'h-11 w-full min-w-[120px] border-0 bg-transparent px-3 text-right text-sm font-semibold tabular-nums text-on-surface outline-none transition-colors placeholder:text-on-surface-variant/35 focus:bg-primary/[0.07] focus:ring-2 focus:ring-inset focus:ring-primary/60'
</script>

<template>
    <main class="mx-auto w-full max-w-[1800px] px-4 pb-32 pt-24 sm:px-6 lg:px-8">
        <button
            type="button"
            class="mb-6 inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-on-surface-variant transition-colors hover:text-on-surface"
            @click="navigateTo('/finanzas/ofrendas')"
        >
            <ArrowLeft class="size-4" /> Volver a pendientes
        </button>

        <div
            v-if="isLoading"
            class="rounded-xl border border-outline-variant bg-surface-container-low px-6 py-16 text-center text-sm text-on-surface-variant"
        >
            Cargando fechas pendientes…
        </div>

        <div
            v-else-if="!meeting"
            class="flex flex-col items-center gap-3 rounded-xl border border-outline-variant bg-surface-container-low px-6 py-16 text-center"
        >
            <Check class="size-10 text-primary" />
            <h2 class="font-display text-2xl font-semibold text-on-surface">Nada que registrar</h2>
            <p class="max-w-md text-sm text-on-surface-variant">
                Esta reunión no tiene fechas pendientes, o ya fueron registradas por alguien más.
            </p>
            <UiButton
                type="button"
                class="mt-2 h-11 rounded px-6 text-xs uppercase tracking-wider"
                @click="navigateTo('/finanzas/ofrendas')"
            >
                Volver a pendientes
            </UiButton>
        </div>

        <template v-else>
            <!-- Identidad de la reunión -->
            <section class="border-b border-outline-variant pb-8">
                <div class="flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
                    <div class="flex min-w-0 gap-4">
                        <span
                            class="mt-1 h-14 w-1.5 shrink-0 rounded-full"
                            :style="{ backgroundColor: meeting.meetingColor }"
                        />
                        <div class="min-w-0">
                            <p
                                class="text-xs font-semibold uppercase tracking-[0.4em] text-on-surface-variant"
                            >
                                Registrar ofrendas
                            </p>
                            <h1
                                class="mt-3 font-display text-3xl font-semibold text-on-surface md:text-4xl"
                            >
                                {{ meeting.meetingTitle }}
                            </h1>
                            <p
                                class="mt-1.5 font-mono text-xs uppercase tracking-wider text-on-surface-variant"
                            >
                                {{ meeting.meetingCode }}
                            </p>
                            <div
                                class="mt-3 flex flex-wrap items-center gap-x-5 gap-y-1.5 text-xs text-on-surface-variant"
                            >
                                <span class="inline-flex items-center gap-1.5">
                                    <MapPin class="size-3.5" />
                                    {{ meeting.sectorName }} · {{ meeting.zoneName }}
                                </span>
                                <span class="inline-flex items-center gap-1.5">
                                    <Clock class="size-3.5" />
                                    {{ meeting.startTime }}–{{ meeting.endTime }}
                                </span>
                                <span
                                    v-if="meeting.leaderName"
                                    class="inline-flex items-center gap-1.5"
                                >
                                    <UserRound class="size-3.5" />
                                    {{ meeting.leaderName }}
                                </span>
                                <span
                                    v-if="meeting.meetingTypeName"
                                    class="inline-flex items-center gap-1.5"
                                >
                                    <CircleDot class="size-3.5" />
                                    {{ meeting.meetingTypeName }}
                                </span>
                            </div>
                        </div>
                    </div>

                    <div
                        class="flex shrink-0 items-center gap-6 rounded-xl border border-outline-variant bg-surface-container-low px-5 py-4"
                    >
                        <div class="text-center">
                            <p
                                class="font-display text-3xl font-semibold tabular-nums text-on-surface"
                            >
                                {{ pendingCount }}
                            </p>
                            <p
                                class="mt-0.5 text-[10px] font-semibold uppercase tracking-wider text-on-surface-variant"
                            >
                                pendientes
                            </p>
                        </div>
                        <span class="h-10 w-px bg-outline-variant" />
                        <div class="text-center">
                            <p
                                class="font-display text-3xl font-semibold tabular-nums"
                                :class="
                                    oldestDaysBehind >= 30 ? 'text-destructive' : 'text-on-surface'
                                "
                            >
                                {{ oldestDaysBehind }}
                            </p>
                            <p
                                class="mt-0.5 text-[10px] font-semibold uppercase tracking-wider text-on-surface-variant"
                            >
                                días de atraso
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            <section
                class="mt-6 overflow-hidden rounded-xl border border-outline-variant bg-surface shadow-sm"
            >
                <div
                    class="flex flex-col gap-5 bg-primary/[0.07] px-5 py-4 sm:px-6 lg:flex-row lg:items-center lg:justify-between"
                >
                    <div class="flex flex-wrap items-center gap-x-8 gap-y-4">
                        <div>
                            <p
                                class="text-[10px] font-bold uppercase tracking-[0.2em] text-on-surface-variant"
                            >
                                Total a registrar
                            </p>
                            <p
                                class="mt-1 font-display text-3xl font-semibold tabular-nums text-primary"
                            >
                                ${{ formatMoney(grandTotal) }}
                            </p>
                        </div>

                        <span class="hidden h-11 w-px bg-outline-variant sm:block" />

                        <div class="flex items-center gap-8">
                            <div>
                                <p class="text-xl font-semibold tabular-nums text-on-surface">
                                    {{ selectedRows.length }}/{{ pendingCount }}
                                </p>
                                <p
                                    class="text-[10px] font-semibold uppercase tracking-wider text-on-surface-variant"
                                >
                                    fechas
                                </p>
                            </div>
                            <div>
                                <p class="text-xl font-semibold tabular-nums text-on-surface">
                                    {{ totalAttendance }}
                                </p>
                                <p
                                    class="text-[10px] font-semibold uppercase tracking-wider text-on-surface-variant"
                                >
                                    asistencia
                                </p>
                            </div>
                        </div>
                    </div>

                    <UiButton
                        type="button"
                        class="hidden h-11 shrink-0 rounded px-7 text-xs uppercase tracking-wider sm:inline-flex"
                        :disabled="isSaving"
                        @click="onSubmit"
                    >
                        <Loader2 v-if="isSaving" class="mr-2 size-4 animate-spin" />
                        <Check v-else class="mr-2 size-4" />
                        Registrar {{ selectedRows.length || '' }}
                    </UiButton>
                </div>

                <p
                    v-if="formError"
                    role="alert"
                    class="flex items-start gap-2 border-t border-destructive/30 bg-destructive/10 px-5 py-3 text-xs text-destructive sm:px-6"
                >
                    <AlertTriangle class="mt-0.5 size-3.5 shrink-0" />
                    <span>{{ formError }}</span>
                </p>
            </section>

            <div class="mt-8 min-w-0">
                <section class="min-w-0">
                    <div
                        class="mb-4 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between"
                    >
                        <div>
                            <h2 class="font-display text-xl font-semibold text-on-surface">
                                Matriz de captura
                            </h2>
                            <p class="mt-1 text-sm leading-relaxed text-on-surface-variant">
                                Escribe directo en las celdas. Tab avanza y Enter baja por la misma
                                columna.
                            </p>
                        </div>
                        <button
                            type="button"
                            class="self-start text-xs font-semibold uppercase tracking-wider text-primary transition-opacity hover:opacity-70 sm:self-auto"
                            @click="toggleAll"
                        >
                            {{ allSelected ? 'Desmarcar todas' : 'Marcar todas' }}
                        </button>
                    </div>

                    <div
                        class="overflow-hidden rounded-xl border border-outline-variant bg-surface shadow-sm"
                    >
                        <div
                            class="flex flex-wrap items-center justify-between gap-3 border-b border-outline-variant bg-surface-container-low px-4 py-3"
                        >
                            <p class="text-xs text-on-surface-variant">
                                Al escribir, la fecha queda marcada automáticamente.
                            </p>
                            <span class="text-xs tabular-nums text-on-surface-variant">
                                Seleccionadas
                                <strong class="ml-1 text-on-surface">
                                    {{ selectedRows.length }}/{{ pendingCount }}
                                </strong>
                            </span>
                        </div>

                        <div class="max-h-[68vh] overflow-auto overscroll-contain">
                            <table
                                data-testid="occurrence-capture-matrix"
                                class="w-full min-w-max border-separate border-spacing-0 text-sm"
                            >
                                <caption class="sr-only">
                                    Fechas pendientes con asistencia y ofrendas por categoría
                                </caption>
                                <thead class="sticky top-0 z-30 bg-surface shadow-sm">
                                    <tr>
                                        <th
                                            rowspan="2"
                                            scope="col"
                                            class="sticky left-0 z-40 w-[240px] min-w-[240px] border-b border-r border-outline-variant bg-surface-container px-4 py-3 text-left"
                                        >
                                            <label class="flex cursor-pointer items-center gap-2.5">
                                                <input
                                                    type="checkbox"
                                                    :checked="allSelected"
                                                    class="size-4 shrink-0 accent-primary"
                                                    aria-label="Seleccionar todas las fechas"
                                                    @change="toggleAll"
                                                />
                                                <span
                                                    class="text-[10px] font-bold uppercase tracking-[0.18em] text-on-surface-variant"
                                                >
                                                    Fecha pendiente
                                                </span>
                                            </label>
                                        </th>
                                        <th
                                            :colspan="attendanceColumnCount"
                                            scope="colgroup"
                                            class="border-b border-r border-outline-variant bg-secondary/10 px-4 py-2.5 text-left"
                                        >
                                            <span
                                                class="inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.18em] text-on-surface"
                                            >
                                                <Users class="size-3.5 text-secondary" />
                                                Asistencia
                                            </span>
                                        </th>
                                        <th
                                            :colspan="offeringColumnCount"
                                            scope="colgroup"
                                            class="border-b border-outline-variant bg-primary/10 px-4 py-2.5 text-left"
                                        >
                                            <span
                                                class="inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.18em] text-on-surface"
                                            >
                                                <HandCoins class="size-3.5 text-primary" />
                                                Ofrendas
                                            </span>
                                        </th>
                                    </tr>
                                    <tr>
                                        <template v-if="hasAttendanceTypes">
                                            <th
                                                v-for="type in attendanceTypes"
                                                :key="`attendance-heading-${type.id}`"
                                                scope="col"
                                                class="min-w-[112px] border-b border-r border-outline-variant bg-surface px-3 py-2 text-right text-[10px] font-semibold uppercase tracking-wide text-on-surface-variant"
                                                :title="type.description ?? undefined"
                                            >
                                                {{ type.name }}
                                            </th>
                                            <th
                                                scope="col"
                                                class="min-w-[104px] border-b border-r border-outline-variant bg-secondary/10 px-3 py-2 text-right text-[10px] font-bold uppercase tracking-wide text-on-surface"
                                            >
                                                Total
                                            </th>
                                        </template>
                                        <th
                                            v-else
                                            scope="col"
                                            class="min-w-[130px] border-b border-r border-outline-variant bg-surface px-3 py-2 text-right text-[10px] font-semibold uppercase tracking-wide text-on-surface-variant"
                                        >
                                            Total personas
                                        </th>

                                        <template v-if="hasCategories">
                                            <th
                                                v-for="category in categories"
                                                :key="`offering-heading-${category.id}`"
                                                scope="col"
                                                class="min-w-[132px] border-b border-r border-outline-variant bg-surface px-3 py-2 text-right text-[10px] font-semibold uppercase tracking-wide text-on-surface-variant last:border-r-0"
                                                :title="category.description ?? undefined"
                                            >
                                                {{ category.name }}
                                            </th>
                                            <th
                                                scope="col"
                                                class="min-w-[122px] border-b border-outline-variant bg-primary/10 px-3 py-2 text-right text-[10px] font-bold uppercase tracking-wide text-on-surface"
                                            >
                                                Total
                                            </th>
                                        </template>
                                        <th
                                            v-else
                                            scope="col"
                                            class="min-w-[140px] border-b border-outline-variant bg-surface px-3 py-2 text-right text-[10px] font-semibold uppercase tracking-wide text-on-surface-variant"
                                        >
                                            Total ofrenda
                                        </th>
                                    </tr>
                                </thead>

                                <tbody>
                                    <tr
                                        v-for="row in rows"
                                        :key="row.occurrenceId"
                                        class="group transition-colors"
                                        :class="
                                            row.selected
                                                ? 'bg-primary/[0.035]'
                                                : 'bg-surface hover:bg-surface-container-low'
                                        "
                                    >
                                        <th
                                            scope="row"
                                            class="sticky left-0 z-10 border-b border-r border-outline-variant p-0 text-left transition-colors"
                                            :class="
                                                row.selected
                                                    ? 'bg-primary/[0.08]'
                                                    : 'bg-surface group-hover:bg-surface-container-low'
                                            "
                                        >
                                            <label
                                                class="flex min-h-[64px] cursor-pointer items-center gap-3 px-3 py-2"
                                            >
                                                <input
                                                    v-model="row.selected"
                                                    type="checkbox"
                                                    class="size-4 shrink-0 accent-primary"
                                                    :aria-label="`Seleccionar ${weekdayOf(row.date)} ${dayOf(row.date)} de ${monthOf(row.date)}`"
                                                />
                                                <span
                                                    class="flex size-10 shrink-0 flex-col items-center justify-center rounded-md border"
                                                    :class="
                                                        row.selected
                                                            ? 'border-primary/40 bg-primary/10 text-primary'
                                                            : 'border-outline-variant bg-surface-container text-on-surface'
                                                    "
                                                >
                                                    <strong
                                                        class="font-display text-base leading-none tabular-nums"
                                                    >
                                                        {{ dayOf(row.date) }}
                                                    </strong>
                                                    <span
                                                        class="mt-0.5 text-[8px] font-bold uppercase tracking-wide"
                                                    >
                                                        {{ monthOf(row.date) }}
                                                    </span>
                                                </span>
                                                <span class="min-w-0">
                                                    <span
                                                        class="block truncate text-xs font-semibold capitalize text-on-surface"
                                                    >
                                                        {{ weekdayOf(row.date) }}
                                                    </span>
                                                    <span
                                                        class="mt-0.5 block text-[10px] font-normal tabular-nums text-on-surface-variant"
                                                    >
                                                        {{ yearOf(row.date) }} ·
                                                        {{ behindLabel(daysSince(row.date)) }}
                                                    </span>
                                                </span>
                                            </label>
                                        </th>

                                        <template v-if="hasAttendanceTypes">
                                            <td
                                                v-for="type in attendanceTypes"
                                                :key="`attendance-${row.occurrenceId}-${type.id}`"
                                                class="border-b border-r border-outline-variant p-0"
                                            >
                                                <input
                                                    :id="`asis-${row.occurrenceId}-${type.id}`"
                                                    :value="row.attendanceByType[type.id] ?? ''"
                                                    type="number"
                                                    inputmode="numeric"
                                                    min="0"
                                                    step="1"
                                                    placeholder="0"
                                                    autocomplete="off"
                                                    :aria-label="`${type.name} del ${weekdayOf(row.date)} ${dayOf(row.date)} de ${monthOf(row.date)}`"
                                                    :data-capture-column="`attendance-${type.id}`"
                                                    :class="cellInputClass"
                                                    @input="
                                                        setAttendanceValue(row, type.id, $event)
                                                    "
                                                    @keydown="moveVertically"
                                                    @focus="selectCellContents"
                                                />
                                            </td>
                                            <td
                                                class="border-b border-r border-outline-variant bg-secondary/[0.06] px-3 text-right"
                                            >
                                                <strong
                                                    class="text-sm font-bold tabular-nums text-on-surface"
                                                >
                                                    {{ rowAttendance(row) }}
                                                </strong>
                                            </td>
                                        </template>
                                        <td
                                            v-else
                                            class="border-b border-r border-outline-variant p-0"
                                        >
                                            <input
                                                :value="row.attendanceTotal ?? ''"
                                                type="number"
                                                inputmode="numeric"
                                                min="0"
                                                step="1"
                                                placeholder="0"
                                                autocomplete="off"
                                                :aria-label="`Asistencia total del ${weekdayOf(row.date)} ${dayOf(row.date)} de ${monthOf(row.date)}`"
                                                data-capture-column="attendance-total"
                                                :class="cellInputClass"
                                                @input="setAttendanceTotal(row, $event)"
                                                @keydown="moveVertically"
                                                @focus="selectCellContents"
                                            />
                                        </td>

                                        <template v-if="hasCategories">
                                            <td
                                                v-for="category in categories"
                                                :key="`offering-${row.occurrenceId}-${category.id}`"
                                                class="border-b border-r border-outline-variant p-0"
                                            >
                                                <div class="relative">
                                                    <span
                                                        class="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-on-surface-variant/60"
                                                    >
                                                        $
                                                    </span>
                                                    <input
                                                        :id="`cat-${row.occurrenceId}-${category.id}`"
                                                        :value="row.amounts[category.id] ?? ''"
                                                        type="number"
                                                        inputmode="decimal"
                                                        min="0"
                                                        step="0.01"
                                                        placeholder="0.00"
                                                        autocomplete="off"
                                                        :aria-label="`${category.name} del ${weekdayOf(row.date)} ${dayOf(row.date)} de ${monthOf(row.date)}`"
                                                        :data-capture-column="`offering-${category.id}`"
                                                        :class="[cellInputClass, 'pl-6']"
                                                        @input="
                                                            setOfferingValue(
                                                                row,
                                                                category.id,
                                                                $event,
                                                            )
                                                        "
                                                        @keydown="moveVertically"
                                                        @focus="selectCellContents"
                                                    />
                                                </div>
                                            </td>
                                            <td
                                                class="border-b border-outline-variant bg-primary/[0.06] px-3 text-right"
                                            >
                                                <strong
                                                    class="whitespace-nowrap text-sm font-bold tabular-nums text-primary"
                                                >
                                                    ${{ formatMoney(rowTotal(row)) }}
                                                </strong>
                                            </td>
                                        </template>
                                        <td v-else class="border-b border-outline-variant p-0">
                                            <div class="relative">
                                                <span
                                                    class="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-on-surface-variant/60"
                                                >
                                                    $
                                                </span>
                                                <input
                                                    :value="row.offeringTotal ?? ''"
                                                    type="number"
                                                    inputmode="decimal"
                                                    min="0"
                                                    step="0.01"
                                                    placeholder="0.00"
                                                    autocomplete="off"
                                                    :aria-label="`Ofrenda total del ${weekdayOf(row.date)} ${dayOf(row.date)} de ${monthOf(row.date)}`"
                                                    data-capture-column="offering-total"
                                                    :class="[cellInputClass, 'pl-6']"
                                                    @input="setOfferingTotal(row, $event)"
                                                    @keydown="moveVertically"
                                                    @focus="selectCellContents"
                                                />
                                            </div>
                                        </td>
                                    </tr>
                                </tbody>

                                <tfoot class="sticky bottom-0 z-20 bg-surface-container shadow-sm">
                                    <tr>
                                        <th
                                            scope="row"
                                            class="sticky left-0 z-30 border-r border-t border-outline-variant bg-surface-container px-4 py-3 text-left text-[10px] font-bold uppercase tracking-[0.16em] text-on-surface"
                                        >
                                            Totales seleccionados
                                        </th>
                                        <template v-if="hasAttendanceTypes">
                                            <td
                                                v-for="type in attendanceTypes"
                                                :key="`attendance-total-${type.id}`"
                                                class="border-r border-t border-outline-variant px-3 py-3 text-right text-xs font-semibold tabular-nums text-on-surface-variant"
                                            >
                                                {{ attendanceTypeTotal(type.id) }}
                                            </td>
                                            <td
                                                class="border-r border-t border-outline-variant bg-secondary/10 px-3 py-3 text-right text-sm font-bold tabular-nums text-on-surface"
                                            >
                                                {{ totalAttendance }}
                                            </td>
                                        </template>
                                        <td
                                            v-else
                                            class="border-r border-t border-outline-variant bg-secondary/10 px-3 py-3 text-right text-sm font-bold tabular-nums text-on-surface"
                                        >
                                            {{ totalAttendance }}
                                        </td>

                                        <template v-if="hasCategories">
                                            <td
                                                v-for="category in categories"
                                                :key="`offering-total-${category.id}`"
                                                class="border-r border-t border-outline-variant px-3 py-3 text-right text-xs font-semibold tabular-nums text-on-surface-variant"
                                            >
                                                ${{ formatMoney(categoryTotal(category.id)) }}
                                            </td>
                                            <td
                                                class="border-t border-outline-variant bg-primary/10 px-3 py-3 text-right text-sm font-bold tabular-nums text-primary"
                                            >
                                                ${{ formatMoney(grandTotal) }}
                                            </td>
                                        </template>
                                        <td
                                            v-else
                                            class="border-t border-outline-variant bg-primary/10 px-3 py-3 text-right text-sm font-bold tabular-nums text-primary"
                                        >
                                            ${{ formatMoney(grandTotal) }}
                                        </td>
                                    </tr>
                                </tfoot>
                            </table>
                        </div>
                    </div>

                    <div
                        class="sticky bottom-3 z-40 mt-4 flex items-center justify-between gap-4 rounded-xl border border-outline-variant bg-surface/95 p-3 shadow-lg backdrop-blur sm:hidden"
                    >
                        <div class="min-w-0">
                            <p
                                class="text-[9px] font-bold uppercase tracking-wider text-on-surface-variant"
                            >
                                {{ selectedRows.length }} fechas · {{ totalAttendance }} personas
                            </p>
                            <p
                                class="mt-0.5 truncate font-display text-xl font-semibold tabular-nums text-primary"
                            >
                                ${{ formatMoney(grandTotal) }}
                            </p>
                        </div>
                        <UiButton
                            type="button"
                            class="h-11 shrink-0 rounded px-5 text-xs uppercase tracking-wider"
                            :disabled="isSaving"
                            @click="onSubmit"
                        >
                            <Loader2 v-if="isSaving" class="mr-2 size-4 animate-spin" />
                            <Check v-else class="mr-2 size-4" />
                            Registrar
                        </UiButton>
                    </div>
                </section>
            </div>
        </template>
    </main>
</template>
