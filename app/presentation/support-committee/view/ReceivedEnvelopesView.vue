<script setup lang="ts">
import { ChevronDown, ChevronRight, Inbox, MapPin, Search, ShieldCheck, X } from '@lucide/vue'
import type { DatePickerRange } from '~/components/ui/DatePicker.vue'
import { getMeetingScopeLabel } from '~/presentation/meetings/utils/meeting-format.util'
import { formatLocalIsoDate } from '~/utils/date/date-format.util'
import { resolveHttpErrorMessage } from '~/utils/http/resolve-http-error-message.util'
import ReceptionResultSummary, {
    type ResultSummary,
} from '../components/ReceptionResultSummary.vue'
import EnvelopeListSkeleton from '../components/EnvelopeListSkeleton.vue'
import SupportCommitteeTabs from '../components/SupportCommitteeTabs.vue'
import { useReceptionsQuery } from '../composables/useReceptionQueries'
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
const selectedDistrict = ref<number | null>(null)
const selectedZone = ref<number | null>(null)
const selectedSector = ref<number | null>(null)

watch(selectedDistrict, () => {
    selectedZone.value = null
    selectedSector.value = null
})

watch(selectedZone, () => {
    selectedSector.value = null
})

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

interface TerritoryOption {
    value: number
    label: string
}

function uniqueOptions(entries: { id: number | null; name: string | null }[]) {
    const options = new Map<number, string>()
    for (const entry of entries) {
        if (entry.id !== null && entry.name) options.set(entry.id, entry.name)
    }
    return [...options.entries()]
        .map<TerritoryOption>(([value, label]) => ({ value, label }))
        .sort((left, right) => left.label.localeCompare(right.label, 'es'))
}

const loadedEnvelopes = computed(() =>
    (receptionsQuery.data.value ?? []).map((reception) => reception.envelope),
)

const districtOptions = computed(() =>
    uniqueOptions(
        loadedEnvelopes.value.map((envelope) => ({
            id: envelope.districtId,
            name: envelope.districtName,
        })),
    ),
)

const zoneOptions = computed(() =>
    uniqueOptions(
        loadedEnvelopes.value
            .filter(
                (envelope) =>
                    selectedDistrict.value === null ||
                    envelope.districtId === selectedDistrict.value,
            )
            .map((envelope) => ({ id: envelope.zoneId, name: envelope.zoneName })),
    ),
)

const sectorOptions = computed(() =>
    uniqueOptions(
        loadedEnvelopes.value
            .filter(
                (envelope) =>
                    (selectedDistrict.value === null ||
                        envelope.districtId === selectedDistrict.value) &&
                    (selectedZone.value === null || envelope.zoneId === selectedZone.value),
            )
            .map((envelope) => ({ id: envelope.sectorId, name: envelope.sectorName })),
    ),
)

const hasTerritoryFilter = computed(
    () =>
        selectedDistrict.value !== null ||
        selectedZone.value !== null ||
        selectedSector.value !== null,
)

const territoryLabel = computed(() => {
    const pick = (options: TerritoryOption[], id: number | null) =>
        options.find((option) => option.value === id)?.label
    return (
        pick(sectorOptions.value, selectedSector.value) ??
        pick(zoneOptions.value, selectedZone.value) ??
        pick(districtOptions.value, selectedDistrict.value) ??
        null
    )
})

const showTerritory = ref(false)

const territoryCount = computed(
    () =>
        [selectedDistrict.value, selectedZone.value, selectedSector.value].filter(
            (value) => value !== null,
        ).length,
)

function clearTerritory() {
    selectedDistrict.value = null
    selectedZone.value = null
    selectedSector.value = null
}

const activeChips = computed(() => {
    const chips: { key: string; label: string; clear: () => void }[] = []
    if (territoryLabel.value) {
        chips.push({ key: 'territory', label: territoryLabel.value, clear: clearTerritory })
    }
    const status = statusOptions.find(
        (option) => option.value !== null && option.value === selectedStatus.value,
    )
    if (status) {
        chips.push({
            key: 'status',
            label: status.label,
            clear: () => {
                selectedStatus.value = null
            },
        })
    }
    const term = search.value.trim()
    if (term) {
        chips.push({
            key: 'search',
            label: `“${term}”`,
            clear: () => {
                search.value = ''
            },
        })
    }
    return chips
})

function clearFilters() {
    clearTerritory()
    selectedStatus.value = null
    search.value = ''
}

function matchesTerritory(reception: ReceptionRecord) {
    const { envelope } = reception
    return (
        (selectedDistrict.value === null || envelope.districtId === selectedDistrict.value) &&
        (selectedZone.value === null || envelope.zoneId === selectedZone.value) &&
        (selectedSector.value === null || envelope.sectorId === selectedSector.value)
    )
}

const receptions = computed(() => {
    const term = normalize(search.value.trim())
    return (receptionsQuery.data.value ?? []).filter(
        (reception) =>
            matchesTerritory(reception) &&
            (!term ||
                normalize(
                    [
                        reception.envelope.meetingTitle,
                        reception.envelope.meetingCode,
                        reception.envelope.leaderName ?? '',
                        reception.envelope.sectorName ?? '',
                        reception.receivedByName ?? '',
                    ].join(' '),
                ).includes(term)),
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

function capitalizeFirst(text: string) {
    return text.charAt(0).toUpperCase() + text.slice(1)
}

function groupTitle(isoDate: string) {
    if (isoDate === todayIso) return 'Hoy'
    return capitalizeFirst(
        formatLocalIsoDate(isoDate, { weekday: 'long', day: 'numeric', month: 'long' }),
    )
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
    <main class="mx-auto w-full max-w-system px-6 pb-16 pt-20 lg:px-10">
        <header class="pb-4">
            <p
                class="text-[11px] font-semibold uppercase tracking-[0.35em] text-on-surface-variant"
            >
                Finanzas · Comité de apoyo
            </p>
            <h1 class="mt-1.5 font-display text-3xl font-semibold text-on-surface">
                Sobres recibidos
            </h1>
        </header>

        <SupportCommitteeTabs active="received" />

        <section
            class="mt-4 rounded-xl border border-outline-variant bg-surface-container-low p-3"
            aria-label="Filtros de sobres recibidos"
        >
            <div class="flex flex-col gap-2 lg:flex-row lg:items-center">
                <label class="relative block min-w-0 lg:flex-1">
                    <span class="sr-only">Buscar sobre recibido</span>
                    <Search
                        class="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-on-surface-variant"
                    />
                    <UiInput
                        v-model="search"
                        type="search"
                        placeholder="Buscar reunión, líder o quién recibió"
                        class="h-11 bg-surface pl-9"
                    />
                </label>
                <div class="w-full lg:w-64">
                    <UiDatePicker
                        v-model="dateRange"
                        mode="range"
                        placeholder="Cualquier fecha de recepción"
                    />
                </div>
                <div
                    class="flex h-11 items-center gap-1 rounded-lg border border-outline-variant bg-surface p-1"
                    role="group"
                    aria-label="Filtrar por resultado"
                >
                    <button
                        v-for="option in statusOptions"
                        :key="option.label"
                        type="button"
                        class="h-full flex-1 whitespace-nowrap rounded-md px-3 text-xs font-semibold transition-colors lg:flex-none"
                        :class="
                            selectedStatus === option.value
                                ? 'bg-primary text-primary-foreground'
                                : 'text-on-surface-variant hover:bg-surface-container hover:text-on-surface'
                        "
                        :aria-pressed="selectedStatus === option.value"
                        @click="selectedStatus = option.value"
                    >
                        {{ option.label }}
                    </button>
                </div>
                <button
                    type="button"
                    class="inline-flex h-11 items-center justify-center gap-2 rounded-lg border px-3.5 text-sm font-semibold transition-colors"
                    :class="
                        showTerritory || territoryCount > 0
                            ? 'border-primary bg-surface text-primary'
                            : 'border-outline-variant bg-surface text-on-surface hover:border-primary'
                    "
                    :aria-expanded="showTerritory"
                    aria-controls="received-territory-filters"
                    @click="showTerritory = !showTerritory"
                >
                    <MapPin class="size-4" />
                    Territorio
                    <span
                        v-if="territoryCount > 0"
                        class="rounded-full bg-primary px-1.5 text-[11px] font-bold tabular-nums text-primary-foreground"
                    >
                        {{ territoryCount }}
                    </span>
                    <ChevronDown
                        class="size-4 transition-transform"
                        :class="{ 'rotate-180': showTerritory }"
                    />
                </button>
            </div>

            <div
                v-if="showTerritory"
                id="received-territory-filters"
                class="mt-3 grid gap-2 border-t border-outline-variant pt-3 sm:grid-cols-3"
                role="group"
                aria-label="Filtrar por territorio"
            >
                <UiSearchSelect
                    v-model="selectedDistrict"
                    :options="districtOptions"
                    clearable
                    placeholder="Todos los distritos"
                    search-placeholder="Buscar distrito..."
                    empty-message="Sin distritos en este período"
                    aria-label="Filtrar por distrito"
                />
                <UiSearchSelect
                    v-model="selectedZone"
                    :options="zoneOptions"
                    clearable
                    placeholder="Todas las zonas"
                    search-placeholder="Buscar zona..."
                    empty-message="Sin zonas en este período"
                    aria-label="Filtrar por zona"
                />
                <UiSearchSelect
                    v-model="selectedSector"
                    :options="sectorOptions"
                    clearable
                    placeholder="Todos los sectores"
                    search-placeholder="Buscar sector..."
                    empty-message="Sin sectores en este período"
                    aria-label="Filtrar por sector"
                />
            </div>
        </section>

        <div class="mt-3 flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
            <div class="flex flex-wrap items-center gap-2">
                <button
                    v-for="chip in activeChips"
                    :key="chip.key"
                    type="button"
                    class="inline-flex items-center gap-1.5 rounded-full border border-primary/40 bg-primary/10 px-3 py-1 text-xs font-semibold text-on-surface transition-colors hover:border-primary"
                    :aria-label="`Quitar filtro ${chip.label}`"
                    @click="chip.clear()"
                >
                    {{ chip.label }}
                    <X class="size-3 text-on-surface-variant" />
                </button>
                <button
                    v-if="activeChips.length > 1"
                    type="button"
                    class="text-xs font-semibold text-primary hover:underline"
                    @click="clearFilters"
                >
                    Limpiar filtros
                </button>
            </div>
            <p class="text-xs text-on-surface-variant">
                Recibidos {{ periodLabel }} · por fecha de conteo del comité
            </p>
        </div>

        <section class="mt-4">
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
                            <h2 class="text-sm font-semibold text-on-surface">
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
                                                {{
                                                    capitalizeFirst(
                                                        shortDateLabel(reception.envelope.date),
                                                    )
                                                }}
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
