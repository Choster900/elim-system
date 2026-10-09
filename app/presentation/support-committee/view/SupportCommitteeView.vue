<script setup lang="ts">
import { ChevronLeft, ChevronRight, Inbox, PartyPopper, Search } from '@lucide/vue'
import { getMeetingScopeLabel } from '~/presentation/meetings/utils/meeting-format.util'
import { resolveHttpErrorMessage } from '~/utils/http/resolve-http-error-message.util'
import EnvelopeListSkeleton from '../components/EnvelopeListSkeleton.vue'
import SupportCommitteeTabs from '../components/SupportCommitteeTabs.vue'
import { usePendingCountQuery, usePendingEnvelopesQuery } from '../composables/useReceptionQueries'
import type { Envelope, PendingEnvelopesParams } from '../interfaces/reception.interface'
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
const selectedZone = ref<number | null>(null)
let searchTimer: ReturnType<typeof setTimeout> | undefined

watch(search, (value) => {
    clearTimeout(searchTimer)
    searchTimer = setTimeout(() => {
        appliedSearch.value = value.trim()
    }, 300)
})

watch([appliedSearch, selectedZone], () => {
    page.value = 1
})

onBeforeUnmount(() => clearTimeout(searchTimer))

const params = computed<PendingEnvelopesParams>(() => ({
    page: page.value,
    limit: PAGE_SIZE,
    ...(appliedSearch.value ? { search: appliedSearch.value } : {}),
    ...(selectedZone.value ? { zoneId: selectedZone.value } : {}),
}))

const pendingQuery = usePendingEnvelopesQuery(params)
const pendingTotal = usePendingCountQuery()

const pageData = computed(() => pendingQuery.data.value ?? null)
const envelopes = computed(() => pageData.value?.items ?? [])
const pagination = computed(() => pageData.value?.pagination ?? null)
const hasFilters = computed(() => !!appliedSearch.value || !!selectedZone.value)

const zoneOptions = computed(() =>
    (pageData.value?.zones ?? []).map((zone) => ({ value: zone.id, label: zone.name })),
)

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

const pageButtonClass =
    'inline-flex h-9 items-center gap-1 rounded-lg border border-outline-variant bg-surface px-3 text-sm font-semibold text-on-surface transition-colors hover:border-primary disabled:pointer-events-none disabled:opacity-40'

onMounted(() => draftStore.ensureLoaded())
</script>

<template>
    <main class="mx-auto w-full max-w-system px-6 pb-20 pt-24 lg:px-10">
        <header class="pb-8">
            <p class="text-xs font-semibold uppercase tracking-[0.4em] text-on-surface-variant">
                Finanzas · Comité de apoyo
            </p>
            <h1 class="mt-4 font-display text-4xl font-semibold text-on-surface md:text-5xl">
                Sobres por recibir
            </h1>
            <p class="mt-3 max-w-2xl text-sm leading-relaxed text-on-surface-variant">
                Elige el sobre que tienes en la mano, cuenta el dinero por tipo de ofrenda y el
                sistema te dirá si cuadra con lo que registró el líder.
            </p>
        </header>

        <SupportCommitteeTabs active="pending" :pending-count="pendingTotal" />

        <section class="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center">
            <label class="relative block w-full sm:max-w-md">
                <span class="sr-only">Buscar sobre</span>
                <Search
                    class="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-on-surface-variant"
                />
                <UiInput
                    v-model="search"
                    type="search"
                    placeholder="Buscar por reunión, código, líder, sector o zona"
                    class="h-11 pl-9"
                />
            </label>
            <div v-if="zoneOptions.length > 1 || selectedZone" class="w-full sm:w-64">
                <UiSearchSelect
                    v-model="selectedZone"
                    :options="zoneOptions"
                    clearable
                    placeholder="Todas las zonas"
                    search-placeholder="Buscar zona..."
                    aria-label="Filtrar por zona"
                />
            </div>
        </section>

        <section ref="listRef" class="mt-8 scroll-mt-24">
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
                    Ningún sobre coincide con la búsqueda.
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
                        class="mb-3 flex items-baseline gap-3 text-sm font-semibold capitalize text-on-surface"
                    >
                        {{ longDateLabel(group.date) }}
                        <span class="text-xs font-normal normal-case text-on-surface-variant">
                            {{ group.items.length }}
                            {{ group.items.length === 1 ? 'sobre' : 'sobres' }}
                        </span>
                    </h2>
                    <ul class="flex flex-col gap-2">
                        <li v-for="envelope in group.items" :key="envelope.occurrenceId">
                            <NuxtLink
                                :to="countPath(envelope.occurrenceId)"
                                class="group flex items-center gap-4 rounded-xl border border-outline-variant bg-surface-container-low px-4 py-4 transition-colors hover:border-primary hover:bg-surface focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary sm:px-5"
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
                                    <p class="mt-1.5 truncate text-xs text-on-surface">
                                        <span class="text-on-surface-variant">
                                            El líder registró:
                                        </span>
                                        {{ categoriesLabel(envelope) }}
                                    </p>
                                </div>
                                <span
                                    class="inline-flex shrink-0 items-center gap-1 rounded-md bg-primary px-3 py-2 text-xs font-semibold uppercase tracking-wider text-primary-foreground transition-opacity group-hover:opacity-90"
                                >
                                    {{
                                        draftStore.hasDraft(envelope.occurrenceId)
                                            ? 'Seguir'
                                            : 'Recibir'
                                    }}
                                    <ChevronRight class="size-4" />
                                </span>
                            </NuxtLink>
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
