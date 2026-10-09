<script setup lang="ts">
import { ChevronRight, Inbox, Info, Search, ShieldCheck } from '@lucide/vue'
import type { DatePickerRange } from '~/components/ui/DatePicker.vue'
import { getMeetingScopeLabel } from '~/presentation/meetings/utils/meeting-format.util'
import { formatLocalIsoDate } from '~/utils/date/date-format.util'
import { resolveHttpErrorMessage } from '~/utils/http/resolve-http-error-message.util'
import ReceptionResultSummary, {
    type ResultSummary,
} from '../components/ReceptionResultSummary.vue'
import EnvelopeListSkeleton from '../components/EnvelopeListSkeleton.vue'
import SupportCommitteeTabs from '../components/SupportCommitteeTabs.vue'
import { usePendingCountQuery, useReceptionsQuery } from '../composables/useReceptionQueries'
import type {
    ReceptionFilters,
    ReceptionRecord,
    ReceptionStatus,
} from '../interfaces/reception.interface'
import {
    differenceLabel,
    envelopePath,
    formatMoney,
    shortDateLabel,
    toCents,
} from '../utils/reception-format.util'

defineOptions({ name: 'ReceivedEnvelopesView' })

useHead({ title: 'Sobres recibidos · Sistema' })

const statusOptions: { value: ReceptionStatus | null; label: string }[] = [
    { value: null, label: 'Todos' },
    { value: 'cuadra', label: 'Cuadran' },
    { value: 'con_diferencia', label: 'Con diferencia' },
]

function localIsoDate(date: Date) {
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    return `${date.getFullYear()}-${month}-${day}`
}

function normalize(text: string) {
    return text
        .normalize('NFD')
        .replace(/\p{Diacritic}/gu, '')
        .toLowerCase()
}

const todayIso = localIsoDate(new Date())
const selectedStatus = ref<ReceptionStatus | null>(null)
const dateRange = ref<DatePickerRange>({ start: `${todayIso.slice(0, 8)}01`, end: todayIso })
const search = ref('')

function dayLabel(isoDate: string) {
    return formatLocalIsoDate(isoDate, { day: 'numeric', month: 'short', year: 'numeric' })
}

const periodLabel = computed(() => {
    const { start, end } = dateRange.value
    if (start && end) {
        return start === end
            ? `el ${dayLabel(start)}`
            : `del ${dayLabel(start)} al ${dayLabel(end)}`
    }
    if (start) return `desde el ${dayLabel(start)}`
    if (end) return `hasta el ${dayLabel(end)}`
    return 'en cualquier fecha'
})

const filters = computed<ReceptionFilters>(() => ({
    ...(selectedStatus.value ? { status: selectedStatus.value } : {}),
    ...(dateRange.value.start ? { from: dateRange.value.start } : {}),
    ...(dateRange.value.end ? { to: dateRange.value.end } : {}),
}))

const receptionsQuery = useReceptionsQuery(filters)
const pendingTotal = usePendingCountQuery()

const receptions = computed(() => {
    const term = normalize(search.value.trim())
    return (receptionsQuery.data.value ?? []).filter(
        (reception) =>
            !term ||
            normalize(
                [
                    reception.envelope.meetingTitle,
                    reception.envelope.meetingCode,
                    reception.envelope.leaderName ?? '',
                    reception.envelope.sectorName ?? '',
                    reception.receivedByName ?? '',
                ].join(' '),
            ).includes(term),
    )
})

function receivedDay(reception: ReceptionRecord) {
    return localIsoDate(new Date(reception.receivedAt))
}

function totalsOf(items: ReceptionRecord[]) {
    let counted = 0
    let shortage = 0
    let surplus = 0
    for (const item of items) {
        const difference = toCents(item.difference)
        counted += toCents(item.countedAmount)
        if (difference < 0) shortage -= difference
        if (difference > 0) surplus += difference
    }
    return {
        envelopes: items.length,
        matched: items.filter((item) => item.status === 'cuadra').length,
        counted: counted / 100,
        shortage: shortage / 100,
        surplus: surplus / 100,
    }
}

const groups = computed(() => {
    const byDay = new Map<string, ReceptionRecord[]>()
    for (const reception of receptions.value) {
        const key = receivedDay(reception)
        byDay.set(key, [...(byDay.get(key) ?? []), reception])
    }
    return [...byDay.entries()].map(([date, items]) => ({ date, items, totals: totalsOf(items) }))
})

const resultSummary = computed<ResultSummary>(() => {
    const summary: ResultSummary = {
        envelopes: receptions.value.length,
        matched: 0,
        surplusCount: 0,
        surplusAmount: 0,
        shortageCount: 0,
        shortageAmount: 0,
        mixedCount: 0,
        registered: 0,
        counted: 0,
        directCount: 0,
        directAmount: 0,
    }
    let surplusCents = 0
    let shortageCents = 0
    let registeredCents = 0
    let countedCents = 0
    let directCents = 0
    for (const reception of receptions.value) {
        if (reception.directEntry) {
            summary.directCount += 1
            directCents += toCents(reception.countedAmount)
            continue
        }
        const tone = resultOf(reception).tone
        const difference = toCents(reception.difference)
        registeredCents += toCents(reception.registeredAmount)
        countedCents += toCents(reception.countedAmount)
        if (tone === 'matched') summary.matched += 1
        if (tone === 'mixed') summary.mixedCount += 1
        if (tone === 'surplus') {
            summary.surplusCount += 1
            surplusCents += difference
        }
        if (tone === 'shortage') {
            summary.shortageCount += 1
            shortageCents -= difference
        }
    }
    summary.surplusAmount = surplusCents / 100
    summary.shortageAmount = shortageCents / 100
    summary.registered = registeredCents / 100
    summary.counted = countedCents / 100
    summary.directAmount = directCents / 100
    summary.envelopes -= summary.directCount
    return summary
})

function groupTitle(isoDate: string) {
    if (isoDate === todayIso) return 'Hoy'
    return formatLocalIsoDate(isoDate, { weekday: 'long', day: 'numeric', month: 'long' })
}

function timeOf(value: string) {
    return new Date(value).toLocaleTimeString('es-SV', { hour: 'numeric', minute: '2-digit' })
}

function resultOf(reception: ReceptionRecord) {
    if (reception.directEntry) return { label: 'Registro directo', tone: 'direct' }
    const cents = toCents(reception.difference)
    if (cents < 0) return { label: differenceLabel(reception.difference), tone: 'shortage' }
    if (cents > 0) return { label: differenceLabel(reception.difference), tone: 'surplus' }
    if (reception.status === 'con_diferencia') return { label: 'Tipos no cuadran', tone: 'mixed' }
    return { label: 'Cuadra', tone: 'matched' }
}

const toneDotClass: Record<string, string> = {
    direct: 'bg-primary',
    matched: 'dot-matched',
    shortage: 'dot-shortage',
    surplus: 'dot-surplus',
    mixed: 'dot-mixed',
}

const loadError = computed(() =>
    receptionsQuery.error.value
        ? resolveHttpErrorMessage(receptionsQuery.error.value, 'No fue posible cargar los sobres')
        : '',
)
</script>

<template>
    <main class="mx-auto w-full max-w-system px-6 pb-20 pt-24 lg:px-10">
        <header class="pb-8">
            <p class="text-xs font-semibold uppercase tracking-[0.4em] text-on-surface-variant">
                Finanzas · Comité de apoyo
            </p>
            <h1 class="mt-4 font-display text-4xl font-semibold text-on-surface md:text-5xl">
                Sobres recibidos
            </h1>
            <p class="mt-3 max-w-2xl text-sm leading-relaxed text-on-surface-variant">
                Los sobres que ya contó el comité. Abre uno para ver el detalle o corregir su
                conteo.
            </p>
        </header>

        <SupportCommitteeTabs active="received" :pending-count="pendingTotal" />

        <section class="mt-6 flex flex-col gap-3">
            <div class="flex flex-col gap-3 lg:flex-row lg:flex-wrap lg:items-end">
                <div class="w-full sm:w-80">
                    <label
                        class="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-on-surface-variant"
                    >
                        Recibidos por el comité entre
                    </label>
                    <UiDatePicker
                        v-model="dateRange"
                        mode="range"
                        placeholder="Cualquier fecha de recepción"
                    />
                </div>
                <div class="flex flex-wrap gap-2" role="group" aria-label="Filtrar por resultado">
                    <button
                        v-for="option in statusOptions"
                        :key="option.label"
                        type="button"
                        class="h-11 rounded-full border px-4 text-sm font-semibold transition-colors"
                        :class="
                            selectedStatus === option.value
                                ? 'border-primary bg-primary text-primary-foreground'
                                : 'border-outline-variant bg-surface text-on-surface hover:border-primary'
                        "
                        :aria-pressed="selectedStatus === option.value"
                        @click="selectedStatus = option.value"
                    >
                        {{ option.label }}
                    </button>
                </div>
                <label class="relative block w-full lg:ml-auto lg:w-72">
                    <span class="sr-only">Buscar sobre recibido</span>
                    <Search
                        class="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-on-surface-variant"
                    />
                    <UiInput
                        v-model="search"
                        type="search"
                        placeholder="Buscar reunión, líder o quién recibió"
                        class="h-11 pl-9"
                    />
                </label>
            </div>
            <p class="flex items-start gap-2 text-xs text-on-surface-variant">
                <Info class="mt-0.5 size-3.5 shrink-0 text-primary" />
                <span>
                    Mostrando los sobres que el comité recibió
                    <strong class="text-on-surface">{{ periodLabel }}</strong
                    >. La fecha es el día en que se contó el sobre, no el día de la reunión.
                </span>
            </p>
        </section>

        <section class="mt-6">
            <EnvelopeListSkeleton v-if="receptionsQuery.isPending.value" />

            <div
                v-else-if="loadError"
                class="rounded-xl border border-destructive/40 bg-destructive/10 px-6 py-8 text-center text-sm text-destructive"
            >
                {{ loadError }}
            </div>

            <div
                v-else-if="receptions.length === 0"
                class="flex flex-col items-center gap-3 rounded-xl border border-outline-variant bg-surface-container-low px-6 py-12 text-center"
            >
                <Inbox class="size-8 text-on-surface-variant" />
                <p class="text-sm text-on-surface-variant">
                    No hay sobres recibidos con estos filtros.
                </p>
            </div>

            <div
                v-else
                class="transition-opacity duration-200"
                :class="{ 'opacity-50': receptionsQuery.isPlaceholderData.value }"
                :aria-busy="receptionsQuery.isPlaceholderData.value"
            >
                <div
                    class="rounded-xl border border-outline-variant bg-surface-container-low p-4 sm:p-5"
                >
                    <ReceptionResultSummary :summary="resultSummary" />
                </div>

                <div class="mt-8 flex flex-col gap-8">
                    <section v-for="group in groups" :key="group.date">
                        <header
                            class="mb-2 flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 border-b border-outline-variant pb-2"
                        >
                            <h2 class="text-sm font-semibold capitalize text-on-surface">
                                {{ groupTitle(group.date) }}
                            </h2>
                            <p class="text-xs tabular-nums text-on-surface-variant">
                                {{ group.totals.envelopes }}
                                {{ group.totals.envelopes === 1 ? 'sobre' : 'sobres' }} · contado
                                <strong class="text-on-surface">
                                    {{ formatMoney(group.totals.counted) }}
                                </strong>
                                <template v-if="group.totals.shortage > 0">
                                    · faltó
                                    <strong class="text-on-surface">
                                        {{ formatMoney(group.totals.shortage) }}
                                    </strong>
                                </template>
                                <template v-if="group.totals.surplus > 0">
                                    · sobró
                                    <strong class="text-on-surface">
                                        {{ formatMoney(group.totals.surplus) }}
                                    </strong>
                                </template>
                            </p>
                        </header>

                        <ul class="flex flex-col gap-1.5">
                            <li v-for="reception in group.items" :key="reception.id">
                                <NuxtLink
                                    :to="envelopePath(reception.occurrenceId)"
                                    class="group grid items-center gap-x-4 gap-y-2 rounded-xl border border-outline-variant bg-surface-container-low px-4 py-3 transition-colors hover:border-primary hover:bg-surface focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary sm:grid-cols-[minmax(0,1fr)_auto_10rem]"
                                >
                                    <div class="flex min-w-0 items-center gap-3">
                                        <span
                                            class="h-10 w-1 shrink-0 rounded-full"
                                            :style="{
                                                backgroundColor: reception.envelope.meetingColor,
                                            }"
                                        />
                                        <div class="min-w-0">
                                            <h3
                                                class="truncate text-sm font-semibold text-on-surface group-hover:text-primary"
                                            >
                                                {{ reception.envelope.meetingTitle }}
                                            </h3>
                                            <p class="truncate text-xs text-on-surface-variant">
                                                Reunión del
                                                <span class="capitalize">
                                                    {{ shortDateLabel(reception.envelope.date) }}
                                                </span>
                                                <template v-if="reception.envelope.leaderName">
                                                    · {{ reception.envelope.leaderName }}
                                                </template>
                                                · {{ getMeetingScopeLabel(reception.envelope) }}
                                            </p>
                                            <p
                                                class="mt-0.5 flex flex-wrap items-center gap-x-2 text-[11px] text-on-surface-variant"
                                            >
                                                <span>
                                                    Recibió
                                                    {{ reception.receivedByName ?? 'sin usuario' }}
                                                    · {{ timeOf(reception.receivedAt) }}
                                                </span>
                                                <span
                                                    v-if="reception.closedAt"
                                                    class="inline-flex items-center gap-1 font-semibold text-sky-700 dark:text-sky-300"
                                                >
                                                    <ShieldCheck class="size-3" />
                                                    Revisado por
                                                    {{ reception.closedByName ?? 'Finanzas' }}
                                                </span>
                                            </p>
                                        </div>
                                    </div>

                                    <dl
                                        class="hidden grid-cols-[auto_auto] gap-x-3 text-right text-xs tabular-nums sm:grid"
                                    >
                                        <template v-if="!reception.directEntry">
                                            <dt class="text-on-surface-variant">Líder</dt>
                                            <dd class="text-on-surface">
                                                {{ formatMoney(reception.registeredAmount) }}
                                            </dd>
                                        </template>
                                        <dt class="text-on-surface-variant">Comité</dt>
                                        <dd class="font-semibold text-on-surface">
                                            {{ formatMoney(reception.countedAmount) }}
                                        </dd>
                                    </dl>

                                    <div
                                        class="flex items-center justify-between gap-2 sm:justify-end"
                                    >
                                        <span class="flex items-center gap-2">
                                            <span
                                                class="size-2.5 shrink-0 rounded-full"
                                                :class="toneDotClass[resultOf(reception).tone]"
                                            />
                                            <span class="text-sm font-semibold text-on-surface">
                                                {{ resultOf(reception).label }}
                                            </span>
                                        </span>
                                        <ChevronRight
                                            class="size-4 shrink-0 text-on-surface-variant transition-colors group-hover:text-primary"
                                        />
                                    </div>
                                </NuxtLink>
                            </li>
                        </ul>
                    </section>
                </div>
            </div>
        </section>
    </main>
</template>

<style scoped>
.dot-matched {
    background-color: #0ca30c;
}

.dot-surplus {
    background-color: #3987e5;
}

.dot-shortage {
    background-color: #e66767;
}

.dot-mixed {
    background-color: #9085e9;
}
</style>
