<script setup lang="ts">
import { CalendarCheck, ChevronLeft, ChevronRight, Clock, Coins, PartyPopper } from '@lucide/vue'
import { formatLocalIsoDate, formatTimeRange } from '~/utils/date/date-format.util'
import { resolveHttpErrorMessage } from '~/utils/http/resolve-http-error-message.util'
import EnvelopeListSkeleton from '../components/EnvelopeListSkeleton.vue'
import SupportCommitteeTabs from '../components/SupportCommitteeTabs.vue'
import { usePendingEnvelopesQuery } from '../composables/useReceptionQueries'
import type { PendingEnvelopesParams } from '../interfaces/reception.interface'
import { useReceptionDraftStore } from '../stores/reception-draft.store'
import { countPath } from '../utils/reception-format.util'
import { localIsoDate } from '../utils/tithe-format.util'

defineOptions({ name: 'GeneralServicesView' })

useHead({ title: 'Cultos generales · Sistema' })

const TODAY_LIMIT = 20
const PAGE_SIZE = 5

const draftStore = useReceptionDraftStore()
const listRef = ref<HTMLElement | null>(null)
const today = localIsoDate()
const yesterday = (() => {
    const [year, month, day] = today.split('-').map(Number)
    return localIsoDate(new Date(year!, month! - 1, day! - 1))
})()

const page = ref(1)

const todayParams = computed<PendingEnvelopesParams>(() => ({
    page: 1,
    limit: TODAY_LIMIT,
    kind: 'generales',
    dateField: 'reunion',
    from: today,
    to: today,
}))

const previousParams = computed<PendingEnvelopesParams>(() => ({
    page: page.value,
    limit: PAGE_SIZE,
    kind: 'generales',
    order: 'desc',
    dateField: 'reunion',
    to: yesterday,
}))

const todayQuery = usePendingEnvelopesQuery(todayParams)
const previousQuery = usePendingEnvelopesQuery(previousParams)

const todayServices = computed(() => todayQuery.data.value?.items ?? [])
const previousServices = computed(() => previousQuery.data.value?.items ?? [])
const pagination = computed(() => previousQuery.data.value?.pagination ?? null)

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

function errorOf(error: unknown) {
    return error ? resolveHttpErrorMessage(error, 'No fue posible cargar los cultos generales') : ''
}

const todayError = computed(() => errorOf(todayQuery.error.value))
const previousError = computed(() => errorOf(previousQuery.error.value))

function capitalizeFirst(text: string) {
    return text.charAt(0).toUpperCase() + text.slice(1)
}

const todayLabel = capitalizeFirst(
    formatLocalIsoDate(today, { weekday: 'long', day: 'numeric', month: 'long' }),
)

function weekdayOf(isoDate: string) {
    return capitalizeFirst(formatLocalIsoDate(isoDate, { weekday: 'long' }))
}

function dayOf(isoDate: string) {
    return formatLocalIsoDate(isoDate, { day: '2-digit' })
}

function monthOf(isoDate: string) {
    return formatLocalIsoDate(isoDate, { month: 'short' }).replace('.', '')
}

function daysAgo(isoDate: string) {
    const days = Math.round(
        (Date.parse(`${today}T00:00:00Z`) - Date.parse(`${isoDate}T00:00:00Z`)) / 86_400_000,
    )
    return days === 1 ? 'ayer' : `hace ${days} días`
}

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
                Cultos generales
            </h1>
        </header>

        <SupportCommitteeTabs active="generals" />

        <p class="mt-4 flex items-start gap-2 text-sm text-on-surface-variant">
            <Coins class="mt-0.5 size-4 shrink-0 text-primary" />
            Estos cultos no tienen un líder que registre la ofrenda. El comité cuenta los billetes y
            monedas el mismo día del culto y ese conteo queda como su ofrenda.
        </p>

        <section class="mt-6" aria-labelledby="general-today-title">
            <div class="mb-3 flex items-baseline gap-3">
                <h2
                    id="general-today-title"
                    class="font-display text-xl font-semibold text-on-surface"
                >
                    Hoy
                </h2>
                <span class="text-sm text-on-surface-variant">{{ todayLabel }}</span>
            </div>

            <EnvelopeListSkeleton v-if="todayQuery.isPending.value" :rows="1" />

            <div
                v-else-if="todayError"
                class="rounded-xl border border-destructive/40 bg-destructive/10 px-6 py-6 text-center text-sm text-destructive"
            >
                {{ todayError }}
            </div>

            <div
                v-else-if="todayServices.length === 0"
                class="flex items-center gap-3 rounded-xl border border-dashed border-outline-variant bg-surface-container-low px-5 py-6"
            >
                <CalendarCheck class="size-6 shrink-0 text-on-surface-variant" />
                <p class="text-sm text-on-surface-variant">
                    No hay cultos generales pendientes de registrar hoy.
                </p>
            </div>

            <ul v-else class="grid gap-3 md:grid-cols-2">
                <li v-for="service in todayServices" :key="service.occurrenceId">
                    <NuxtLink
                        :to="countPath(service.occurrenceId)"
                        class="group flex h-full items-center gap-4 rounded-xl border border-primary/40 bg-primary/5 p-5 transition-colors hover:border-primary hover:bg-primary/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                    >
                        <span
                            class="h-14 w-1.5 shrink-0 rounded-full"
                            :style="{ backgroundColor: service.meetingColor }"
                        />
                        <div class="min-w-0 flex-1">
                            <div class="flex flex-wrap items-center gap-2">
                                <h3
                                    class="truncate font-display text-lg font-semibold text-on-surface"
                                >
                                    {{ service.meetingTitle }}
                                </h3>
                                <span
                                    v-if="draftStore.hasDraft(service.occurrenceId)"
                                    class="rounded-full border border-primary/40 bg-primary/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-primary"
                                >
                                    En progreso
                                </span>
                            </div>
                            <p
                                class="mt-1 flex items-center gap-1.5 text-sm text-on-surface-variant"
                            >
                                <Clock class="size-3.5" />
                                {{ formatTimeRange(service.startTime, service.endTime) }}
                                <template v-if="service.meetingTypeName">
                                    · {{ service.meetingTypeName }}
                                </template>
                            </p>
                        </div>
                        <span
                            class="inline-flex shrink-0 items-center gap-1 rounded-md bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition-opacity group-hover:opacity-90"
                        >
                            {{
                                draftStore.hasDraft(service.occurrenceId)
                                    ? 'Seguir conteo'
                                    : 'Registrar ofrendas'
                            }}
                            <ChevronRight class="size-4" />
                        </span>
                    </NuxtLink>
                </li>
            </ul>
        </section>

        <section ref="listRef" class="mt-10 scroll-mt-24" aria-labelledby="general-previous-title">
            <div class="mb-3 flex flex-wrap items-baseline justify-between gap-2">
                <div class="flex items-baseline gap-3">
                    <h2
                        id="general-previous-title"
                        class="font-display text-xl font-semibold text-on-surface"
                    >
                        Días anteriores sin registrar
                    </h2>
                    <span
                        v-if="pagination && pagination.totalItems > 0"
                        class="rounded-full bg-surface-container-high px-2 py-0.5 text-xs font-semibold tabular-nums text-on-surface-variant"
                    >
                        {{ pagination.totalItems }}
                    </span>
                </div>
                <p class="text-xs text-on-surface-variant">Del más reciente al más antiguo</p>
            </div>

            <EnvelopeListSkeleton v-if="previousQuery.isPending.value" :rows="PAGE_SIZE" />

            <div
                v-else-if="previousError"
                class="rounded-xl border border-destructive/40 bg-destructive/10 px-6 py-6 text-center text-sm text-destructive"
            >
                {{ previousError }}
            </div>

            <div
                v-else-if="previousServices.length === 0"
                class="flex items-center gap-3 rounded-xl border border-outline-variant bg-surface-container-low px-5 py-6"
            >
                <PartyPopper class="size-6 shrink-0 text-primary" />
                <p class="text-sm text-on-surface-variant">
                    Todo al día: no hay cultos generales de días anteriores sin registrar.
                </p>
            </div>

            <div
                v-else
                class="transition-opacity duration-200"
                :class="{ 'opacity-50': previousQuery.isPlaceholderData.value }"
                :aria-busy="previousQuery.isPlaceholderData.value"
            >
                <ul class="flex flex-col gap-2">
                    <li v-for="service in previousServices" :key="service.occurrenceId">
                        <NuxtLink
                            :to="countPath(service.occurrenceId)"
                            class="group flex items-center gap-4 rounded-xl border border-outline-variant bg-surface-container-low px-4 py-3 transition-colors hover:border-primary hover:bg-surface focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                        >
                            <span
                                class="flex size-11 shrink-0 flex-col items-center justify-center rounded-lg border border-outline-variant bg-surface"
                            >
                                <strong
                                    class="font-display text-base leading-none tabular-nums text-on-surface"
                                >
                                    {{ dayOf(service.date) }}
                                </strong>
                                <span
                                    class="mt-0.5 text-[9px] font-bold uppercase tracking-wide text-on-surface-variant"
                                >
                                    {{ monthOf(service.date) }}
                                </span>
                            </span>
                            <span
                                class="h-10 w-1 shrink-0 rounded-full"
                                :style="{ backgroundColor: service.meetingColor }"
                            />
                            <div class="min-w-0 flex-1">
                                <div class="flex flex-wrap items-center gap-2">
                                    <h3 class="truncate text-sm font-semibold text-on-surface">
                                        {{ service.meetingTitle }}
                                    </h3>
                                    <span
                                        v-if="draftStore.hasDraft(service.occurrenceId)"
                                        class="rounded-full border border-primary/40 bg-primary/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-primary"
                                    >
                                        En progreso
                                    </span>
                                </div>
                                <p class="mt-0.5 truncate text-xs text-on-surface-variant">
                                    {{ weekdayOf(service.date) }} ·
                                    {{ formatTimeRange(service.startTime, service.endTime) }} ·
                                    {{ daysAgo(service.date) }}
                                </p>
                            </div>
                            <span
                                class="inline-flex shrink-0 items-center gap-1 rounded-md border border-primary/50 px-3 py-2 text-xs font-semibold text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground"
                            >
                                {{
                                    draftStore.hasDraft(service.occurrenceId)
                                        ? 'Seguir'
                                        : 'Registrar'
                                }}
                                <ChevronRight class="size-4" />
                            </span>
                        </NuxtLink>
                    </li>
                </ul>

                <nav
                    v-if="pagination && pagination.totalPages > 1"
                    class="mt-4 flex flex-col items-center justify-between gap-3 border-t border-outline-variant pt-4 sm:flex-row"
                    aria-label="Paginación de cultos anteriores"
                >
                    <p class="text-xs text-on-surface-variant">
                        Mostrando
                        <strong class="text-on-surface">{{ rangeText }}</strong>
                        de
                        <strong class="text-on-surface">{{ pagination.totalItems }}</strong>
                        cultos
                    </p>
                    <div class="flex items-center gap-2">
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
