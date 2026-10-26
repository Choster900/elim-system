<script setup lang="ts">
import {
    ChevronDown,
    ChevronLeft,
    ChevronRight,
    Inbox,
    MapPin,
    PartyPopper,
    Search,
    X,
} from '@lucide/vue'
import type { DatePickerRange } from '~/components/ui/DatePicker.vue'
import { formatLocalIsoDate } from '~/utils/date/date-format.util'
import { getMeetingScopeLabel } from '~/presentation/meetings/utils/meeting-format.util'
import { resolveHttpErrorMessage } from '~/utils/http/resolve-http-error-message.util'
import EnvelopeListSkeleton from '../components/EnvelopeListSkeleton.vue'
import SupportCommitteeTabs from '../components/SupportCommitteeTabs.vue'
import { usePendingEnvelopesQuery } from '../composables/useReceptionQueries'
import type {
    Envelope,
    PendingDateField,
    PendingEnvelopesParams,
} from '../interfaces/reception.interface'
import { useReceptionDraftStore } from '../stores/reception-draft.store'
import { categoryLabel, countPath, longDateLabel } from '../utils/reception-format.util'

defineOptions({ name: 'SupportCommitteeView' })

useHead({ title: 'Comité de apoyo · Sistema' })

const PAGE_SIZE = 5

const draftStore = useReceptionDraftStore()
const listRef = ref<HTMLElement | null>(null)

const page = ref(1)
const search = ref('')
const appliedSearch = ref('')
const selectedDistrict = ref<number | null>(null)
const selectedZone = ref<number | null>(null)
const selectedSector = ref<number | null>(null)
const dateField = ref<PendingDateField>('reunion')
const dateRange = ref<DatePickerRange>({ start: null, end: null })
const showTerritory = ref(false)
let searchTimer: ReturnType<typeof setTimeout> | undefined

const dateFieldOptions: { value: PendingDateField; label: string; title: string }[] = [
    { value: 'reunion', label: 'Reunión', title: 'Día en que estaba programada la reunión' },
    {
        value: 'registro',
        label: 'Registro',
        title: 'Día en que el líder registró la ofrenda y la asistencia',
    },
]

watch(selectedDistrict, () => {
    selectedZone.value = null
    selectedSector.value = null
})

watch(selectedZone, () => {
    selectedSector.value = null
})

watch(search, (value) => {
    clearTimeout(searchTimer)
    searchTimer = setTimeout(() => {
        appliedSearch.value = value.trim()
    }, 300)
})

watch(
    [appliedSearch, selectedDistrict, selectedZone, selectedSector, dateField, dateRange],
    () => {
        page.value = 1
    },
    { deep: true },
)

onBeforeUnmount(() => clearTimeout(searchTimer))

const params = computed<PendingEnvelopesParams>(() => ({
    page: page.value,
    limit: PAGE_SIZE,
    kind: 'lideres',
    ...(appliedSearch.value ? { search: appliedSearch.value } : {}),
    ...(selectedDistrict.value ? { districtId: selectedDistrict.value } : {}),
    ...(selectedZone.value ? { zoneId: selectedZone.value } : {}),
    ...(selectedSector.value ? { sectorId: selectedSector.value } : {}),
    ...(dateRange.value.start || dateRange.value.end ? { dateField: dateField.value } : {}),
    ...(dateRange.value.start ? { from: dateRange.value.start } : {}),
    ...(dateRange.value.end ? { to: dateRange.value.end } : {}),
}))

const pendingQuery = usePendingEnvelopesQuery(params)

const pageData = computed(() => pendingQuery.data.value ?? null)
const envelopes = computed(() => pageData.value?.items ?? [])
const pagination = computed(() => pageData.value?.pagination ?? null)
const territoryCount = computed(
    () =>
        [selectedDistrict.value, selectedZone.value, selectedSector.value].filter(
            (value) => value !== null,
        ).length,
)
const hasDateFilter = computed(() => !!dateRange.value.start || !!dateRange.value.end)
const hasFilters = computed(
    () => !!appliedSearch.value || territoryCount.value > 0 || hasDateFilter.value,
)

const districtOptions = computed(() =>
    (pageData.value?.districts ?? []).map((district) => ({
        value: district.id,
        label: district.name,
    })),
)

const zoneOptions = computed(() =>
    (pageData.value?.zones ?? [])
        .filter(
            (zone) => selectedDistrict.value === null || zone.districtId === selectedDistrict.value,
        )
        .map((zone) => ({ value: zone.id, label: zone.name })),
)

const sectorOptions = computed(() => {
    const allowedZones = new Set(zoneOptions.value.map((zone) => zone.value))
    return (pageData.value?.sectors ?? [])
        .filter((sector) =>
            selectedZone.value !== null
                ? sector.zoneId === selectedZone.value
                : allowedZones.has(sector.zoneId),
        )
        .map((sector) => ({ value: sector.id, label: sector.name }))
})

function pickLabel(options: { value: number; label: string }[], id: number | null) {
    return options.find((option) => option.value === id)?.label ?? null
}

const territoryLabel = computed(
    () =>
        pickLabel(sectorOptions.value, selectedSector.value) ??
        pickLabel(zoneOptions.value, selectedZone.value) ??
        pickLabel(districtOptions.value, selectedDistrict.value),
)

function capitalizeFirst(text: string) {
    return text.charAt(0).toUpperCase() + text.slice(1)
}

function shortDay(isoDate: string) {
    return formatLocalIsoDate(isoDate, { day: 'numeric', month: 'short', year: 'numeric' })
}

const dateLabel = computed(() => {
    const { start, end } = dateRange.value
    const prefix = dateField.value === 'registro' ? 'Registrados' : 'Reuniones'
    if (start && end) {
        return start === end
            ? `${prefix} el ${shortDay(start)}`
            : `${prefix} del ${shortDay(start)} al ${shortDay(end)}`
    }
    if (start) return `${prefix} desde el ${shortDay(start)}`
    if (end) return `${prefix} hasta el ${shortDay(end)}`
    return null
})

function clearTerritory() {
    selectedDistrict.value = null
    selectedZone.value = null
    selectedSector.value = null
}

function clearDates() {
    dateRange.value = { start: null, end: null }
}

const activeChips = computed(() => {
    const chips: { key: string; label: string; clear: () => void }[] = []
    if (territoryLabel.value) {
        chips.push({ key: 'territory', label: territoryLabel.value, clear: clearTerritory })
    }
    if (dateLabel.value) chips.push({ key: 'date', label: dateLabel.value, clear: clearDates })
    if (appliedSearch.value) {
        chips.push({
            key: 'search',
            label: `“${appliedSearch.value}”`,
            clear: () => {
                search.value = ''
                appliedSearch.value = ''
            },
        })
    }
    return chips
})

function clearFilters() {
    clearTerritory()
    clearDates()
    search.value = ''
    appliedSearch.value = ''
}

const rangeText = computed(() => {
    const current = pagination.value
    if (!current || current.totalItems === 0) return ''
    const first = (current.page - 1) * current.limit + 1
    const last = Math.min(current.page * current.limit, current.totalItems)
    return `${first}–${last}`
})

watch(pagination, (current) => {
    if (current && current.totalPages > 0 && page.value > current.totalPages) {
        page.value = current.totalPages
    }
})

function goToPage(next: number) {
    page.value = next
    nextTick(() => {
        const top = listRef.value?.getBoundingClientRect().top ?? 0
        if (top < 0) listRef.value?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    })
}

const groups = computed(() => {
    const byDate = new Map<string, Envelope[]>()
    for (const envelope of envelopes.value) {
        const list = byDate.get(envelope.date) ?? []
        list.push(envelope)
        byDate.set(envelope.date, list)
    }
    return [...byDate.entries()].map(([date, items]) => ({ date, items }))
})

const loadError = computed(() =>
    pendingQuery.error.value
        ? resolveHttpErrorMessage(pendingQuery.error.value, 'No fue posible cargar los sobres')
        : '',
)

function categoriesLabel(envelope: Envelope) {
    return envelope.categories.map((category) => categoryLabel(category.categoryName)).join(' · ')
}

const NuxtLinkComponent = resolveComponent('NuxtLink')

const pageButtonClass =
    'inline-flex h-9 items-center gap-1 rounded-lg border border-outline-variant bg-surface px-3 text-sm font-semibold text-on-surface transition-colors hover:border-primary disabled:pointer-events-none disabled:opacity-40'

onMounted(() => draftStore.ensureLoaded())
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
                Ofrendas por recibir
            </h1>
        </header>

        <SupportCommitteeTabs active="pending" />

        <section
            class="mt-4 rounded-xl border border-outline-variant bg-surface-container-low p-3"
            aria-label="Filtros de sobres por recibir"
        >
            <div class="flex flex-col gap-2 xl:flex-row xl:items-center">
                <label class="relative block min-w-0 xl:flex-1">
                    <span class="sr-only">Buscar sobre</span>
                    <Search
                        class="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-on-surface-variant"
                    />
                    <UiInput
                        v-model="search"
                        type="search"
                        placeholder="Buscar por reunión, código, líder, sector o zona"
                        class="h-11 bg-surface pl-9"
                    />
                </label>
                <div class="flex flex-col gap-2 sm:flex-row">
                    <div
                        class="flex h-11 items-center gap-1 rounded-lg border border-outline-variant bg-surface p-1"
                        role="group"
                        aria-label="Filtrar por fecha de"
                    >
                        <span
                            class="px-2 text-[11px] font-semibold uppercase tracking-wider text-on-surface-variant"
                        >
                            Fecha de
                        </span>
                        <button
                            v-for="option in dateFieldOptions"
                            :key="option.value"
                            type="button"
                            class="h-full flex-1 whitespace-nowrap rounded-md px-3 text-xs font-semibold transition-colors sm:flex-none"
                            :class="
                                dateField === option.value
                                    ? 'bg-primary text-primary-foreground'
                                    : 'text-on-surface-variant hover:bg-surface-container hover:text-on-surface'
                            "
                            :title="option.title"
                            :aria-pressed="dateField === option.value"
                            @click="dateField = option.value"
                        >
                            {{ option.label }}
                        </button>
                    </div>
                    <div class="w-full sm:w-64">
                        <UiDatePicker
                            v-model="dateRange"
                            mode="range"
                            placeholder="Cualquier fecha"
                        />
                    </div>
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
                    aria-controls="pending-territory-filters"
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
                id="pending-territory-filters"
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
                    empty-message="Sin distritos con sobres pendientes"
                    aria-label="Filtrar por distrito"
                />
                <UiSearchSelect
                    v-model="selectedZone"
                    :options="zoneOptions"
                    clearable
                    placeholder="Todas las zonas"
                    search-placeholder="Buscar zona..."
                    empty-message="Sin zonas con sobres pendientes"
                    aria-label="Filtrar por zona"
                />
                <UiSearchSelect
                    v-model="selectedSector"
                    :options="sectorOptions"
                    clearable
                    placeholder="Todos los sectores"
                    search-placeholder="Buscar sector..."
                    empty-message="Sin sectores con sobres pendientes"
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
            <p
                v-if="dateField === 'registro' && hasDateFilter"
                class="text-xs text-on-surface-variant"
            >
                Los cultos generales sin registro de líder no tienen fecha de registro
            </p>
        </div>

        <section ref="listRef" class="mt-4 scroll-mt-24">
            <EnvelopeListSkeleton v-if="pendingQuery.isPending.value" :rows="PAGE_SIZE" />

            <div
                v-else-if="loadError"
                class="rounded-xl border border-destructive/40 bg-destructive/10 px-6 py-8 text-center text-sm text-destructive"
            >
                {{ loadError }}
            </div>

            <div
                v-else-if="envelopes.length === 0 && !hasFilters"
                class="flex flex-col items-center gap-3 rounded-xl border border-outline-variant bg-surface-container-low px-6 py-16 text-center"
            >
                <PartyPopper class="size-10 text-primary" />
                <h2 class="font-display text-2xl font-semibold text-on-surface">Todo recibido</h2>
                <p class="max-w-md text-sm text-on-surface-variant">
                    No hay sobres pendientes. Cuando un líder registre la ofrenda de una reunión, su
                    sobre aparecerá aquí.
                </p>
            </div>

            <div
                v-else-if="envelopes.length === 0"
                class="flex flex-col items-center gap-3 rounded-xl border border-outline-variant bg-surface-container-low px-6 py-12 text-center"
            >
                <Inbox class="size-8 text-on-surface-variant" />
                <p class="text-sm text-on-surface-variant">
                    Ningún sobre coincide con los filtros.
                </p>
            </div>

            <div
                v-else
                class="flex flex-col gap-8 transition-opacity duration-200"
                :class="{ 'opacity-50': pendingQuery.isPlaceholderData.value }"
                :aria-busy="pendingQuery.isPlaceholderData.value"
            >
                <section v-for="group in groups" :key="group.date">
                    <h2
                        class="mb-3 flex items-baseline gap-3 text-sm font-semibold text-on-surface"
                    >
                        {{ capitalizeFirst(longDateLabel(group.date)) }}
                        <span class="text-xs font-normal normal-case text-on-surface-variant">
                            {{ group.items.length }}
                            {{ group.items.length === 1 ? 'sobre' : 'sobres' }}
                        </span>
                    </h2>
                    <ul class="flex flex-col gap-2">
                        <li v-for="envelope in group.items" :key="envelope.occurrenceId">
                            <component
                                :is="envelope.isReady ? NuxtLinkComponent : 'div'"
                                v-bind="
                                    envelope.isReady ? { to: countPath(envelope.occurrenceId) } : {}
                                "
                                class="group flex items-center gap-4 rounded-xl border border-outline-variant bg-surface-container-low px-4 py-4 transition-colors sm:px-5"
                                :class="
                                    envelope.isReady
                                        ? 'hover:border-primary hover:bg-surface focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary'
                                        : 'opacity-70'
                                "
                            >
                                <span
                                    class="h-12 w-1 shrink-0 rounded-full"
                                    :style="{ backgroundColor: envelope.meetingColor }"
                                />
                                <div class="min-w-0 flex-1">
                                    <div class="flex flex-wrap items-center gap-2">
                                        <h3
                                            class="truncate text-base font-semibold text-on-surface"
                                        >
                                            {{ envelope.meetingTitle }}
                                        </h3>
                                        <span
                                            v-if="envelope.isGeneral"
                                            class="rounded-full border border-outline-variant bg-surface px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-on-surface-variant"
                                        >
                                            Culto general
                                        </span>
                                        <span
                                            v-if="draftStore.hasDraft(envelope.occurrenceId)"
                                            class="rounded-full border border-primary/40 bg-primary/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-primary"
                                        >
                                            En progreso
                                        </span>
                                    </div>
                                    <p class="mt-0.5 truncate text-xs text-on-surface-variant">
                                        <template v-if="envelope.leaderName">
                                            {{ envelope.leaderName }} ·
                                        </template>
                                        {{ getMeetingScopeLabel(envelope) }} ·
                                        <span class="font-mono uppercase">
                                            {{ envelope.meetingCode }}
                                        </span>
                                    </p>
                                    <p
                                        v-if="envelope.directEntry"
                                        class="mt-1.5 truncate text-xs text-on-surface-variant"
                                    >
                                        Sin líder: lo que cuente el comité será la ofrenda
                                        registrada
                                    </p>
                                    <p v-else class="mt-1.5 truncate text-xs text-on-surface">
                                        <span class="text-on-surface-variant">
                                            El líder registró:
                                        </span>
                                        {{ categoriesLabel(envelope) }}
                                    </p>
                                </div>
                                <span
                                    v-if="envelope.isReady"
                                    class="inline-flex shrink-0 items-center gap-1 rounded-md bg-primary px-3 py-2 text-xs font-semibold uppercase tracking-wider text-primary-foreground transition-opacity group-hover:opacity-90"
                                >
                                    {{
                                        draftStore.hasDraft(envelope.occurrenceId)
                                            ? 'Seguir'
                                            : 'Recibir'
                                    }}
                                    <ChevronRight class="size-4" />
                                </span>
                                <span
                                    v-else
                                    class="shrink-0 text-right text-xs text-on-surface-variant"
                                >
                                    Disponible después de las {{ envelope.endTime }}
                                </span>
                            </component>
                        </li>
                    </ul>
                </section>

                <nav
                    v-if="pagination"
                    class="flex flex-col items-center justify-between gap-3 border-t border-outline-variant pt-4 sm:flex-row"
                    aria-label="Paginación de sobres"
                >
                    <p class="text-xs text-on-surface-variant">
                        Mostrando
                        <strong class="text-on-surface">{{ rangeText }}</strong>
                        de
                        <strong class="text-on-surface">{{ pagination.totalItems }}</strong>
                        {{ pagination.totalItems === 1 ? 'sobre' : 'sobres' }}
                    </p>
                    <div v-if="pagination.totalPages > 1" class="flex items-center gap-2">
                        <button
                            type="button"
                            :class="pageButtonClass"
                            :disabled="!pagination.hasPreviousPage"
                            @click="goToPage(pagination.page - 1)"
                        >
                            <ChevronLeft class="size-4" />
                            Anterior
                        </button>
                        <span class="px-2 text-xs tabular-nums text-on-surface-variant">
                            Página {{ pagination.page }} de {{ pagination.totalPages }}
                        </span>
                        <button
                            type="button"
                            :class="pageButtonClass"
                            :disabled="!pagination.hasNextPage"
                            @click="goToPage(pagination.page + 1)"
                        >
                            Siguiente
                            <ChevronRight class="size-4" />
                        </button>
                    </div>
                </nav>
            </div>
        </section>
    </main>
</template>
