<script setup lang="ts">
import {
    AlertTriangle,
    ArrowLeft,
    CalendarClock,
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
    }))
    formError.value = null
}

watch([occurrences, categories, attendanceTypes], buildRows, { immediate: true })

const selectedRows = computed(() => rows.value.filter((row) => row.selected))
const allSelected = computed(
    () => rows.value.length > 0 && selectedRows.value.length === rows.value.length,
)

function rowTotal(row: CaptureRow) {
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

/// Cuántas personas de cada tipo suman las fechas marcadas, para el resumen lateral.
const attendanceBreakdown = computed(() =>
    attendanceTypes.value
        .map((type) => ({
            id: type.id,
            name: type.name,
            quantity: selectedRows.value.reduce(
                (sum, row) => sum + (row.attendanceByType[type.id] ?? 0),
                0,
            ),
        }))
        .filter((entry) => entry.quantity > 0),
)

/// Marcar la fila al escribir evita el paso extra de tildar la casilla.
function touchRow(row: CaptureRow) {
    row.selected = true
    formError.value = null
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
            // Sin desglose el total va en cero: hubo reunión y no hubo ofrenda.
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
        await navigateTo('/finanzas/ofrendas')
    } catch (error) {
        formError.value = resolveHttpErrorMessage(error, 'No fue posible registrar las fechas')
    }
}

const inputClass =
    'w-full rounded-md border border-outline-variant bg-surface px-3 py-2 text-sm tabular-nums text-on-surface outline-none transition-colors placeholder:text-on-surface-variant/40 focus:border-primary focus:ring-1 focus:ring-primary/40'
const labelClass =
    'mb-1.5 block text-[10px] font-semibold uppercase tracking-wider text-on-surface-variant'
const groupLabelClass =
    'mb-2.5 text-[10px] font-semibold uppercase tracking-[0.2em] text-on-surface-variant'
</script>

<template>
    <main class="mx-auto w-full max-w-system px-6 pb-32 pt-24 lg:px-10">
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
                                    {{ meeting.startTime }}
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

            <div class="mt-8 grid gap-8 lg:grid-cols-[minmax(0,1fr)_300px]">
                <!-- Fechas -->
                <section>
                    <div class="mb-4 flex items-center justify-between">
                        <h2 class="font-display text-xl font-semibold text-on-surface">
                            Fechas pendientes
                        </h2>
                        <button
                            type="button"
                            class="text-xs font-semibold uppercase tracking-wider text-primary transition-opacity hover:opacity-70"
                            @click="toggleAll"
                        >
                            {{ allSelected ? 'Desmarcar todas' : 'Marcar todas' }}
                        </button>
                    </div>

                    <p class="mb-5 text-sm leading-relaxed text-on-surface-variant">
                        Registra solo las fechas de las que tengas el dato exacto. Las que dejes sin
                        marcar seguirán pendientes y podrás llenarlas después.
                    </p>

                    <div class="flex flex-col gap-4">
                        <article
                            v-for="row in rows"
                            :key="row.occurrenceId"
                            class="overflow-hidden rounded-xl border transition-all"
                            :class="
                                row.selected
                                    ? 'border-primary/50 bg-primary/[0.04] shadow-sm'
                                    : 'border-outline-variant bg-surface-container-low'
                            "
                        >
                            <!-- Cabecera de la fecha -->
                            <label
                                class="flex cursor-pointer items-center gap-4 border-b px-5 py-4 transition-colors"
                                :class="
                                    row.selected
                                        ? 'border-primary/20 bg-primary/[0.06]'
                                        : 'border-outline-variant bg-surface'
                                "
                            >
                                <input
                                    v-model="row.selected"
                                    type="checkbox"
                                    class="size-4 shrink-0 accent-primary"
                                />

                                <div
                                    class="flex size-12 shrink-0 flex-col items-center justify-center rounded-lg border"
                                    :class="
                                        row.selected
                                            ? 'border-primary/40 bg-primary/10'
                                            : 'border-outline-variant bg-surface-container'
                                    "
                                >
                                    <span
                                        class="font-display text-lg font-semibold leading-none tabular-nums"
                                        :class="row.selected ? 'text-primary' : 'text-on-surface'"
                                    >
                                        {{ dayOf(row.date) }}
                                    </span>
                                    <span
                                        class="mt-0.5 text-[9px] font-semibold uppercase tracking-wide text-on-surface-variant"
                                    >
                                        {{ monthOf(row.date) }}
                                    </span>
                                </div>

                                <div class="min-w-0 flex-1">
                                    <p class="text-sm font-semibold capitalize text-on-surface">
                                        {{ weekdayOf(row.date) }}
                                    </p>
                                    <p class="mt-0.5 text-xs tabular-nums text-on-surface-variant">
                                        {{ yearOf(row.date) }} ·
                                        {{ behindLabel(daysSince(row.date)) }}
                                    </p>
                                </div>

                                <div v-if="row.selected" class="flex shrink-0 items-center gap-5">
                                    <div class="text-right">
                                        <p
                                            class="font-display text-xl font-semibold tabular-nums text-on-surface"
                                        >
                                            {{ rowAttendance(row) }}
                                        </p>
                                        <p
                                            class="text-[10px] font-semibold uppercase tracking-wider text-on-surface-variant"
                                        >
                                            personas
                                        </p>
                                    </div>
                                    <span class="h-8 w-px bg-outline-variant" />
                                    <div class="text-right">
                                        <p
                                            class="font-display text-xl font-semibold tabular-nums text-primary"
                                        >
                                            ${{ formatMoney(rowTotal(row)) }}
                                        </p>
                                        <p
                                            class="text-[10px] font-semibold uppercase tracking-wider text-on-surface-variant"
                                        >
                                            total
                                        </p>
                                    </div>
                                </div>
                            </label>

                            <!-- Captura -->
                            <div class="flex flex-col gap-6 px-5 py-4">
                                <!-- Asistencia por tipo: el total de la fecha es su suma -->
                                <div>
                                    <p :class="[groupLabelClass, 'flex items-center gap-1.5']">
                                        <Users class="size-3.5" />
                                        Asistencia *
                                    </p>
                                    <div
                                        v-if="hasAttendanceTypes"
                                        class="grid gap-4 sm:grid-cols-3 xl:grid-cols-5"
                                    >
                                        <div v-for="type in attendanceTypes" :key="type.id">
                                            <label
                                                :class="labelClass"
                                                :for="`asis-${row.occurrenceId}-${type.id}`"
                                                :title="type.description ?? undefined"
                                            >
                                                {{ type.name }}
                                            </label>
                                            <input
                                                :id="`asis-${row.occurrenceId}-${type.id}`"
                                                v-model.number="row.attendanceByType[type.id]"
                                                type="number"
                                                min="0"
                                                placeholder="0"
                                                :class="inputClass"
                                                @input="touchRow(row)"
                                            />
                                        </div>
                                    </div>
                                    <!-- Sin catálogo de tipos se captura el total a mano -->
                                    <div v-else class="sm:max-w-[220px]">
                                        <label
                                            :class="labelClass"
                                            :for="`asistencia-${row.occurrenceId}`"
                                        >
                                            Total de personas
                                        </label>
                                        <input
                                            :id="`asistencia-${row.occurrenceId}`"
                                            v-model.number="row.attendanceTotal"
                                            type="number"
                                            min="0"
                                            placeholder="0"
                                            :class="inputClass"
                                            @input="touchRow(row)"
                                        />
                                    </div>
                                </div>

                                <div v-if="categories.length > 0">
                                    <p :class="[groupLabelClass, 'flex items-center gap-1.5']">
                                        <HandCoins class="size-3.5" />
                                        Ofrenda
                                    </p>
                                    <div class="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                                        <div v-for="category in categories" :key="category.id">
                                            <label
                                                :class="labelClass"
                                                :for="`cat-${row.occurrenceId}-${category.id}`"
                                            >
                                                {{ category.name }}
                                            </label>
                                            <div class="relative">
                                                <span
                                                    class="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-on-surface-variant/60"
                                                >
                                                    $
                                                </span>
                                                <input
                                                    :id="`cat-${row.occurrenceId}-${category.id}`"
                                                    v-model.number="row.amounts[category.id]"
                                                    type="number"
                                                    min="0"
                                                    step="0.01"
                                                    placeholder="0.00"
                                                    :class="[inputClass, 'pl-7']"
                                                    @input="touchRow(row)"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </article>
                    </div>
                </section>

                <!-- Resumen -->
                <aside class="lg:sticky lg:top-24 lg:self-start">
                    <div
                        class="rounded-xl border border-outline-variant bg-surface-container-low p-6"
                    >
                        <h2
                            class="text-[11px] font-semibold uppercase tracking-wider text-on-surface-variant"
                        >
                            Resumen
                        </h2>

                        <dl class="mt-5 flex flex-col gap-4">
                            <div class="flex items-baseline justify-between gap-4">
                                <dt class="text-sm text-on-surface-variant">Fechas marcadas</dt>
                                <dd class="font-semibold tabular-nums text-on-surface">
                                    {{ selectedRows.length }} / {{ pendingCount }}
                                </dd>
                            </div>
                            <div class="flex items-baseline justify-between gap-4">
                                <dt class="text-sm text-on-surface-variant">Asistencia</dt>
                                <dd class="font-semibold tabular-nums text-on-surface">
                                    {{ totalAttendance }}
                                </dd>
                            </div>
                            <div
                                v-if="attendanceBreakdown.length > 0"
                                class="-mt-2 flex flex-col gap-1.5 border-l border-outline-variant pl-3"
                            >
                                <div
                                    v-for="entry in attendanceBreakdown"
                                    :key="entry.id"
                                    class="flex items-baseline justify-between gap-4"
                                >
                                    <dt class="text-xs text-on-surface-variant">
                                        {{ entry.name }}
                                    </dt>
                                    <dd class="text-xs tabular-nums text-on-surface-variant">
                                        {{ entry.quantity }}
                                    </dd>
                                </div>
                            </div>
                            <div
                                class="flex items-baseline justify-between gap-4 border-t border-outline-variant pt-4"
                            >
                                <dt class="text-sm text-on-surface-variant">Total a registrar</dt>
                                <dd
                                    class="font-display text-2xl font-semibold tabular-nums text-on-surface"
                                >
                                    ${{ formatMoney(grandTotal) }}
                                </dd>
                            </div>
                        </dl>

                        <p
                            v-if="formError"
                            role="alert"
                            class="mt-5 flex items-start gap-2 rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-xs text-destructive"
                        >
                            <AlertTriangle class="mt-0.5 size-3.5 shrink-0" />
                            <span>{{ formError }}</span>
                        </p>

                        <div class="mt-6 flex flex-col gap-2">
                            <UiButton
                                type="button"
                                class="h-11 w-full rounded text-xs uppercase tracking-wider"
                                :disabled="isSaving"
                                @click="onSubmit"
                            >
                                <Loader2 v-if="isSaving" class="mr-2 size-4 animate-spin" />
                                <Check v-else class="mr-2 size-4" />
                                Registrar {{ selectedRows.length || '' }}
                            </UiButton>
                            <UiButton
                                variant="outline"
                                type="button"
                                class="h-11 w-full rounded text-xs uppercase tracking-wider"
                                @click="navigateTo('/finanzas/ofrendas')"
                            >
                                Cancelar
                            </UiButton>
                        </div>

                        <p
                            class="mt-5 flex items-start gap-2 text-[11px] leading-relaxed text-on-surface-variant"
                        >
                            <CalendarClock class="mt-0.5 size-3.5 shrink-0" />
                            Lo que no marques queda pendiente. Nadie pierde la fecha.
                        </p>
                    </div>
                </aside>
            </div>
        </template>
    </main>
</template>
