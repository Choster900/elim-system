<script setup lang="ts">
import {
    ArrowRight,
    Church,
    Clock,
    HandCoins,
    HandHeart,
    Inbox,
    PackageX,
    Scale,
} from '@lucide/vue'
import { useAuthStore } from '~/presentation/auth/stores/auth.store'
import { routePermissionCodes } from '~/presentation/auth/constants/permission.constants'
import ColumnChart from '~/presentation/shared/components/charts/ColumnChart.vue'
import RankedBarList from '~/presentation/shared/components/charts/RankedBarList.vue'
import { localIsoDate } from '~/presentation/support-committee/utils/tithe-format.util'
import { formatLocalIsoDate } from '~/utils/date/date-format.util'
import {
    categoryLabel,
    differenceLabel,
    formatMoney,
    shortDateLabel,
    TITHES_PATH,
    toCents,
} from '~/presentation/support-committee/utils/reception-format.util'
import { resolveHttpErrorMessage } from '~/utils/http/resolve-http-error-message.util'
import ReconciliationFiltersBar from '../components/ReconciliationFiltersBar.vue'
import ReconciliationSummarySkeleton from '../components/ReconciliationSummarySkeleton.vue'
import ReconciliationStatusBadge from '../components/ReconciliationStatusBadge.vue'
import ReconciliationTabs from '../components/ReconciliationTabs.vue'
import { useReconciliationFilters } from '../composables/useReconciliationFilters'
import { useReconciliationQuery } from '../composables/useReconciliationQueries'
import type {
    ReconciliationEnvelope,
    ReconciliationFilters,
} from '../interfaces/reconciliation.interface'
import {
    RECONCILIATION_ENVELOPES,
    RECONCILIATION_GENERALS,
    RECONCILIATION_LEADERS,
    RECONCILIATION_STATUSES,
    pendingLabel,
    reconciliationEnvelopePath,
} from '../utils/reconciliation-format.util'

defineOptions({ name: 'ReconciliationSummaryView' })

useHead({ title: 'Conciliación de ofrendas · Sistema' })

const route = useRoute()
const { filters, linkTo, updateQuery } = useReconciliationFilters()
const isGeneralView = computed(() => route.query.tipo === 'generales')
const kindOptions = [
    { value: 'reuniones', label: 'Reuniones' },
    { value: 'generales', label: 'Cultos generales' },
] as const
const queryFilters = computed<ReconciliationFilters>(() =>
    isGeneralView.value
        ? { from: filters.value.from, to: filters.value.to, kind: 'generales' }
        : filters.value,
)
const reconciliationQuery = useReconciliationQuery(queryFilters)

function selectKind(kind: 'reuniones' | 'generales') {
    updateQuery({ tipo: kind === 'generales' ? 'generales' : undefined })
}

const summary = computed(() => reconciliationQuery.data.value ?? null)
const totals = computed(() => summary.value?.totals ?? null)
const receivedCount = computed(() =>
    totals.value
        ? totals.value.counts.cuadra +
          totals.value.counts.diferencia_abierta +
          totals.value.counts.diferencia_cerrada
        : 0,
)

const authStore = useAuthStore()
const canViewTithes = computed(() => authStore.hasPermission(routePermissionCodes.tithesView))

const tithes = computed(() => summary.value?.tithes ?? { count: 0, members: 0, amount: 0 })
const committeeTotal = computed(() =>
    totals.value ? (toCents(totals.value.receivedAmount) + toCents(tithes.value.amount)) / 100 : 0,
)

const loadError = computed(() =>
    reconciliationQuery.error.value
        ? resolveHttpErrorMessage(
              reconciliationQuery.error.value,
              'No fue posible cargar los datos',
          )
        : '',
)

function oldest(status: ReconciliationEnvelope['status']) {
    return (summary.value?.envelopes ?? [])
        .filter((envelope) => envelope.status === status)
        .sort((left, right) => (right.pendingDays ?? 0) - (left.pendingDays ?? 0))
        .slice(0, 5)
}

const attention = computed(() => [
    {
        key: 'diferencia_abierta',
        title: 'Diferencias sin revisar',
        empty: 'No hay diferencias pendientes de revisar.',
        items: oldest('diferencia_abierta'),
    },
    {
        key: 'sin_entregar',
        title: 'Sobres sin entregar',
        empty: 'Todos los sobres registrados ya fueron entregados.',
        items: oldest('sin_entregar'),
    },
])

const shortageByLeader = computed(() =>
    (summary.value?.byLeader ?? [])
        .filter((leader) => toCents(leader.difference) < 0)
        .map((leader) => ({
            id: leader.key,
            label: leader.leaderName ?? 'Sin líder asignado',
            value: Math.abs(leader.difference),
            meta: leader.sectorNames.join(', ') || null,
        })),
)

const averagePerService = computed(() =>
    totals.value && receivedCount.value > 0
        ? Math.round(toCents(totals.value.receivedAmount) / receivedCount.value) / 100
        : 0,
)

function shiftIsoDate(isoDate: string, days: number) {
    const date = new Date(`${isoDate}T00:00:00.000Z`)
    date.setUTCDate(date.getUTCDate() + days)
    return date.toISOString().slice(0, 10)
}

function weekStartOf(isoDate: string) {
    const weekday = new Date(`${isoDate}T00:00:00.000Z`).getUTCDay()
    return shiftIsoDate(isoDate, -((weekday + 6) % 7))
}

function dayMonth(isoDate: string) {
    return formatLocalIsoDate(isoDate, { day: 'numeric', month: 'short' }).replace('.', '')
}

function countLabel(count: number) {
    if (isGeneralView.value)
        return `${count} ${count === 1 ? 'culto recibido' : 'cultos recibidos'}`
    return `${count} ${count === 1 ? 'sobre recibido' : 'sobres recibidos'}`
}

const receivedEnvelopes = computed(() =>
    (summary.value?.envelopes ?? []).filter(
        (envelope) => envelope.receivedAt && envelope.countedAmount !== null,
    ),
)

const weeklyReceived = computed(() => {
    const period = summary.value?.period
    if (!period || receivedEnvelopes.value.length === 0) return []
    const weeks = new Map<string, { counted: number; registered: number; count: number }>()
    for (let week = weekStartOf(period.from); week <= period.to; week = shiftIsoDate(week, 7)) {
        weeks.set(week, { counted: 0, registered: 0, count: 0 })
    }
    for (const envelope of receivedEnvelopes.value) {
        const entry = weeks.get(weekStartOf(localIsoDate(new Date(envelope.receivedAt!))))
        if (!entry) continue
        entry.counted += toCents(envelope.countedAmount ?? 0)
        entry.registered += toCents(envelope.registeredAmount)
        entry.count += 1
    }
    return [...weeks].map(([week, entry]) => ({
        key: week,
        label: dayMonth(week),
        value: entry.counted / 100,
        detail: [
            `Semana del ${dayMonth(week)} al ${dayMonth(shiftIsoDate(week, 6))}`,
            entry.count > 0
                ? countLabel(entry.count)
                : isGeneralView.value
                  ? 'Sin cultos recibidos'
                  : 'Sin sobres recibidos',
            ...(!isGeneralView.value && entry.count > 0
                ? [
                      `Líderes anotaron ${formatMoney(entry.registered / 100)}`,
                      `Diferencia: ${differenceLabel((entry.counted - entry.registered) / 100)}`,
                  ]
                : []),
        ],
    }))
})

function groupReceived(keyOf: (envelope: ReconciliationEnvelope) => string | null) {
    const groups = new Map<string, { counted: number; registered: number; count: number }>()
    for (const envelope of receivedEnvelopes.value) {
        const key = keyOf(envelope) ?? 'Sin asignar'
        const entry = groups.get(key) ?? { counted: 0, registered: 0, count: 0 }
        entry.counted += toCents(envelope.countedAmount ?? 0)
        entry.registered += toCents(envelope.registeredAmount)
        entry.count += 1
        groups.set(key, entry)
    }
    return groups
}

const receivedByZone = computed(() =>
    [...groupReceived((envelope) => envelope.zoneName)].map(([zone, entry]) => ({
        id: zone,
        label: zone,
        value: entry.counted / 100,
        meta: `${countLabel(entry.count)} · ${differenceLabel((entry.counted - entry.registered) / 100)}`,
    })),
)

const receivedByService = computed(() =>
    [...groupReceived((envelope) => envelope.meetingTitle)].map(([title, entry]) => ({
        id: title,
        label: title,
        value: entry.counted / 100,
        meta: countLabel(entry.count),
    })),
)

const recentGeneralServices = computed(() =>
    (summary.value?.envelopes ?? [])
        .filter((envelope) => envelope.receivedAt)
        .sort((left, right) => (right.receivedAt ?? '').localeCompare(left.receivedAt ?? ''))
        .slice(0, 6),
)

function differenceClass(value: number) {
    if (toCents(value) === 0) return 'text-emerald-700 dark:text-emerald-300'
    return 'text-amber-700 dark:text-amber-300'
}
</script>

<template>
    <main class="mx-auto w-full max-w-system px-6 pb-20 pt-24 lg:px-10">
        <header class="pb-8">
            <p class="text-xs font-semibold uppercase tracking-[0.4em] text-on-surface-variant">
                Finanzas · Conciliación
            </p>
            <h1 class="mt-4 font-display text-4xl font-semibold text-on-surface md:text-5xl">
                Conciliación de ofrendas
            </h1>
            <p class="mt-3 max-w-2xl text-sm leading-relaxed text-on-surface-variant">
                Compara lo que registraron los líderes con lo que contó el comité de apoyo, revisa
                las diferencias y da seguimiento a los sobres que no se han entregado.
            </p>
        </header>

        <ReconciliationTabs active="summary" />

        <div class="mt-6 flex flex-wrap items-center gap-3">
            <span
                id="reconciliation-kind-label"
                class="text-xs font-semibold uppercase tracking-wider text-on-surface-variant"
            >
                Ver resumen de
            </span>
            <div
                role="group"
                aria-labelledby="reconciliation-kind-label"
                class="flex h-10 items-center gap-1 rounded-lg border border-outline-variant bg-surface p-1"
            >
                <button
                    v-for="option in kindOptions"
                    :key="option.value"
                    type="button"
                    class="h-full whitespace-nowrap rounded-md px-3.5 text-xs font-semibold uppercase tracking-wider transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                    :class="
                        (option.value === 'generales') === isGeneralView
                            ? 'bg-primary text-primary-foreground shadow-sm'
                            : 'text-on-surface-variant hover:bg-surface-container'
                    "
                    :aria-pressed="(option.value === 'generales') === isGeneralView"
                    @click="selectKind(option.value)"
                >
                    {{ option.label }}
                </button>
            </div>
            <p class="text-xs text-on-surface-variant">
                {{
                    isGeneralView
                        ? 'Solo los cultos generales, contados directamente por el comité.'
                        : 'Solo las reuniones de los sectores. Los cultos generales no se mezclan.'
                }}
            </p>
        </div>

        <div class="mt-4">
            <ReconciliationFiltersBar :zones="summary?.zones ?? []" :hide-zone="isGeneralView" />
        </div>

        <div
            v-if="loadError"
            class="mt-8 rounded-xl border border-destructive/40 bg-destructive/10 px-6 py-8 text-center text-sm text-destructive"
        >
            {{ loadError }}
        </div>

        <ReconciliationSummarySkeleton v-else-if="!summary || !totals" />

        <div
            v-else-if="totals.envelopes === 0 && (isGeneralView || tithes.count === 0)"
            class="mt-8 flex flex-col items-center gap-3 rounded-xl border border-outline-variant bg-surface-container-low px-6 py-14 text-center"
        >
            <Inbox class="size-9 text-on-surface-variant" />
            <p class="max-w-md text-sm text-on-surface-variant">
                {{
                    isGeneralView
                        ? 'El comité no recibió cultos generales en este periodo.'
                        : 'El comité no recibió sobres en este periodo y no hay sobres pendientes de entregar.'
                }}
                Cambia las fechas para ver otro rango.
            </p>
        </div>

        <div
            v-else-if="isGeneralView"
            class="transition-opacity duration-200"
            :class="{ 'opacity-50': reconciliationQuery.isPlaceholderData.value }"
            :aria-busy="reconciliationQuery.isPlaceholderData.value"
        >
            <section class="mt-8 grid gap-4 sm:grid-cols-3">
                <UiCard class="p-5">
                    <Inbox class="mb-3 size-5 text-primary" />
                    <p
                        class="text-[11px] font-semibold uppercase tracking-wider text-on-surface-variant"
                    >
                        Recibido por el comité
                    </p>
                    <p
                        class="mt-1 font-display text-3xl font-semibold tabular-nums text-on-surface"
                    >
                        {{ formatMoney(totals.receivedAmount) }}
                    </p>
                    <p class="mt-1 text-xs text-on-surface-variant">
                        Ofrenda de los cultos generales del periodo
                    </p>
                </UiCard>
                <UiCard class="p-5">
                    <Church class="mb-3 size-5 text-primary" />
                    <p
                        class="text-[11px] font-semibold uppercase tracking-wider text-on-surface-variant"
                    >
                        Cultos recibidos
                    </p>
                    <p
                        class="mt-1 font-display text-3xl font-semibold tabular-nums text-on-surface"
                    >
                        {{ receivedCount }}
                    </p>
                    <p class="mt-1 text-xs text-on-surface-variant">
                        Contados por el comité en el periodo
                    </p>
                </UiCard>
                <UiCard class="p-5">
                    <HandCoins class="mb-3 size-5 text-primary" />
                    <p
                        class="text-[11px] font-semibold uppercase tracking-wider text-on-surface-variant"
                    >
                        Promedio por culto
                    </p>
                    <p
                        class="mt-1 font-display text-3xl font-semibold tabular-nums text-on-surface"
                    >
                        {{ formatMoney(averagePerService) }}
                    </p>
                    <p class="mt-1 text-xs text-on-surface-variant">
                        Lo recibido entre los cultos contados
                    </p>
                </UiCard>
            </section>

            <section class="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]">
                <UiCard class="p-5">
                    <h2 class="font-display text-lg font-semibold text-on-surface">
                        Recibido por semana
                    </h2>
                    <p class="mb-4 mt-1 text-xs text-on-surface-variant">
                        Cada barra suma la ofrenda de los cultos generales que el comité contó en
                        una semana (lunes a domingo). Pasa el cursor sobre una barra para ver el
                        detalle.
                    </p>
                    <ColumnChart
                        :values="weeklyReceived"
                        format="currency"
                        color="var(--chart-2)"
                        label="Ofrenda de cultos generales por semana"
                        empty-message="El comité todavía no recibe cultos generales en este periodo."
                    />
                </UiCard>
                <UiCard class="p-5">
                    <h2 class="font-display text-lg font-semibold text-on-surface">
                        Ofrenda por culto
                    </h2>
                    <p class="mb-4 mt-1 text-xs text-on-surface-variant">
                        Lo que dejó cada culto general en el periodo.
                    </p>
                    <RankedBarList
                        :items="receivedByService"
                        label="Ofrenda por culto"
                        format="currency"
                        empty-message="Todavía no hay cultos contados en este periodo."
                        :limit="6"
                    />
                </UiCard>
            </section>

            <section class="mt-6 grid gap-6 lg:grid-cols-2">
                <UiCard class="p-5">
                    <div class="mb-3 flex items-center justify-between">
                        <h2 class="font-display text-lg font-semibold text-on-surface">
                            Últimos cultos recibidos
                        </h2>
                        <NuxtLink
                            :to="linkTo(RECONCILIATION_GENERALS)"
                            class="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline"
                        >
                            Ver todos
                            <ArrowRight class="size-3.5" />
                        </NuxtLink>
                    </div>
                    <ul class="flex flex-col divide-y divide-outline-variant">
                        <li v-for="envelope in recentGeneralServices" :key="envelope.occurrenceId">
                            <NuxtLink
                                :to="linkTo(reconciliationEnvelopePath(envelope.occurrenceId))"
                                class="flex items-center gap-3 py-2.5 hover:text-primary"
                            >
                                <span
                                    class="h-8 w-1 shrink-0 rounded-full"
                                    :style="{ backgroundColor: envelope.meetingColor }"
                                />
                                <span class="min-w-0 flex-1">
                                    <span
                                        class="block truncate text-sm font-semibold text-on-surface"
                                    >
                                        {{ envelope.meetingTitle }}
                                    </span>
                                    <span class="block truncate text-xs text-on-surface-variant">
                                        <span class="capitalize">
                                            {{ shortDateLabel(envelope.date) }}
                                        </span>
                                        <template v-if="envelope.receivedByName">
                                            · Recibió {{ envelope.receivedByName }}
                                        </template>
                                    </span>
                                </span>
                                <span class="text-sm font-semibold tabular-nums text-on-surface">
                                    {{ formatMoney(envelope.countedAmount ?? 0) }}
                                </span>
                            </NuxtLink>
                        </li>
                    </ul>
                </UiCard>

                <UiCard class="p-5">
                    <h2 class="mb-3 font-display text-lg font-semibold text-on-surface">
                        Por tipo de ofrenda
                    </h2>
                    <p
                        v-if="summary.byType.length === 0"
                        class="py-6 text-center text-sm text-on-surface-variant"
                    >
                        Todavía no hay cultos contados en este periodo.
                    </p>
                    <table v-else class="w-full text-sm">
                        <thead>
                            <tr
                                class="border-b border-outline-variant text-[10px] uppercase tracking-wider text-on-surface-variant"
                            >
                                <th class="py-2 text-left font-semibold">Tipo</th>
                                <th class="py-2 text-right font-semibold">Contado por el comité</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr
                                v-for="row in summary.byType"
                                :key="row.categoryId ?? 'sin-tipo'"
                                class="border-b border-outline-variant last:border-b-0"
                            >
                                <td class="py-2.5 text-on-surface">
                                    {{ categoryLabel(row.categoryName) }}
                                </td>
                                <td
                                    class="py-2.5 text-right font-semibold tabular-nums text-on-surface"
                                >
                                    {{ formatMoney(row.countedAmount) }}
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </UiCard>
            </section>
        </div>

        <div
            v-else
            class="transition-opacity duration-200"
            :class="{ 'opacity-50': reconciliationQuery.isPlaceholderData.value }"
            :aria-busy="reconciliationQuery.isPlaceholderData.value"
        >
            <section class="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <UiCard class="p-5">
                    <Inbox class="mb-3 size-5 text-primary" />
                    <p
                        class="text-[11px] font-semibold uppercase tracking-wider text-on-surface-variant"
                    >
                        Recibido por el comité
                    </p>
                    <p
                        class="mt-1 font-display text-3xl font-semibold tabular-nums text-on-surface"
                    >
                        {{ formatMoney(totals.receivedAmount) }}
                    </p>
                    <p class="mt-1 text-xs text-on-surface-variant">
                        {{ receivedCount }}
                        {{ receivedCount === 1 ? 'sobre de reunión' : 'sobres de reunión' }}
                        en el periodo
                    </p>
                </UiCard>
                <UiCard class="p-5">
                    <HandCoins class="mb-3 size-5 text-primary" />
                    <p
                        class="text-[11px] font-semibold uppercase tracking-wider text-on-surface-variant"
                    >
                        Anotado por los líderes
                    </p>
                    <p
                        class="mt-1 font-display text-3xl font-semibold tabular-nums text-on-surface"
                    >
                        {{ formatMoney(totals.deliveredRegisteredAmount) }}
                    </p>
                    <p class="mt-1 text-xs text-on-surface-variant">
                        En esos mismos sobres recibidos
                    </p>
                </UiCard>
                <UiCard class="p-5">
                    <Scale class="mb-3 size-5 text-primary" />
                    <p
                        class="text-[11px] font-semibold uppercase tracking-wider text-on-surface-variant"
                    >
                        Diferencia
                    </p>
                    <p
                        class="mt-1 font-display text-3xl font-semibold tabular-nums"
                        :class="differenceClass(totals.difference)"
                    >
                        {{ differenceLabel(totals.difference) }}
                    </p>
                    <p class="mt-1 text-xs text-on-surface-variant">
                        Lo contado por el comité menos lo anotado por los líderes
                    </p>
                </UiCard>
                <UiCard class="p-5">
                    <PackageX class="mb-3 size-5 text-primary" />
                    <p
                        class="text-[11px] font-semibold uppercase tracking-wider text-on-surface-variant"
                    >
                        Sin entregar
                    </p>
                    <p
                        class="mt-1 font-display text-3xl font-semibold tabular-nums"
                        :class="
                            totals.counts.sin_entregar > 0
                                ? 'text-rose-700 dark:text-rose-300'
                                : 'text-on-surface'
                        "
                    >
                        {{ formatMoney(totals.undeliveredAmount) }}
                    </p>
                    <p class="mt-1 text-xs text-on-surface-variant">
                        {{ totals.counts.sin_entregar }}
                        {{
                            totals.counts.sin_entregar === 1
                                ? 'sobre pendiente'
                                : 'sobres pendientes'
                        }}
                        de cualquier fecha
                    </p>
                </UiCard>
            </section>

            <UiCard class="mt-4 p-5">
                <div class="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
                    <div class="flex items-start gap-3">
                        <span
                            class="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10"
                            aria-hidden="true"
                        >
                            <HandHeart class="size-5 text-primary" />
                        </span>
                        <div>
                            <h2 class="font-display text-lg font-semibold text-on-surface">
                                Diezmos individuales
                            </h2>
                            <p class="mt-0.5 max-w-md text-xs text-on-surface-variant">
                                Sobres de diezmo que el comité registró a nombre de cada diezmador.
                                No tienen registro de líder, por eso no entran en la diferencia.
                            </p>
                        </div>
                    </div>
                    <div class="flex flex-wrap items-center gap-x-8 gap-y-4">
                        <dl class="flex flex-wrap gap-x-8 gap-y-3">
                            <div>
                                <dt
                                    class="text-[11px] font-semibold uppercase tracking-wider text-on-surface-variant"
                                >
                                    Diezmos
                                </dt>
                                <dd class="text-xl font-semibold tabular-nums text-on-surface">
                                    {{ formatMoney(tithes.amount) }}
                                </dd>
                            </div>
                            <div>
                                <dt
                                    class="text-[11px] font-semibold uppercase tracking-wider text-on-surface-variant"
                                >
                                    Sobres
                                </dt>
                                <dd class="text-xl font-semibold tabular-nums text-on-surface">
                                    {{ tithes.count }}
                                </dd>
                            </div>
                            <div>
                                <dt
                                    class="text-[11px] font-semibold uppercase tracking-wider text-on-surface-variant"
                                >
                                    Diezmadores
                                </dt>
                                <dd class="text-xl font-semibold tabular-nums text-on-surface">
                                    {{ tithes.members }}
                                </dd>
                            </div>
                            <div class="sm:border-l sm:border-outline-variant sm:pl-8">
                                <dt
                                    class="text-[11px] font-semibold uppercase tracking-wider text-on-surface-variant"
                                >
                                    Total recibido por el comité
                                </dt>
                                <dd class="text-xl font-semibold tabular-nums text-primary">
                                    {{ formatMoney(committeeTotal) }}
                                </dd>
                                <dd class="text-[11px] text-on-surface-variant">
                                    Sobres de reunión + diezmos
                                </dd>
                            </div>
                        </dl>
                        <NuxtLink
                            v-if="canViewTithes"
                            :to="TITHES_PATH"
                            class="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline"
                        >
                            Ver diezmos
                            <ArrowRight class="size-3.5" />
                        </NuxtLink>
                    </div>
                </div>
            </UiCard>

            <section class="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
                <NuxtLink
                    v-for="status in RECONCILIATION_STATUSES"
                    :key="status.value"
                    :to="linkTo(RECONCILIATION_ENVELOPES, { estado: status.value })"
                    class="flex items-center justify-between gap-3 rounded-xl border border-outline-variant bg-surface-container-low px-4 py-3 transition-colors hover:border-primary"
                >
                    <span class="flex items-center gap-2 text-sm text-on-surface">
                        <span class="size-2 rounded-full" :class="status.dotClass" />
                        {{ status.plural }}
                    </span>
                    <span class="text-lg font-semibold tabular-nums text-on-surface">
                        {{ totals.counts[status.value] }}
                    </span>
                </NuxtLink>
            </section>

            <section class="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]">
                <UiCard class="p-5">
                    <h2 class="font-display text-lg font-semibold text-on-surface">
                        Recibido por el comité por semana
                    </h2>
                    <p class="mb-4 mt-1 text-xs text-on-surface-variant">
                        Cada barra suma lo que el comité contó en una semana (lunes a domingo),
                        según el día en que recibió los sobres. Pasa el cursor sobre una barra para
                        ver lo que anotaron los líderes y la diferencia.
                    </p>
                    <ColumnChart
                        :values="weeklyReceived"
                        format="currency"
                        label="Recibido por el comité por semana"
                        empty-message="El comité todavía no recibe sobres en este periodo."
                    />
                </UiCard>
                <UiCard class="p-5">
                    <h2 class="font-display text-lg font-semibold text-on-surface">
                        Recibido por zona
                    </h2>
                    <p class="mb-4 mt-1 text-xs text-on-surface-variant">
                        Lo contado por el comité en cada zona, con cuántos sobres y la diferencia
                        frente a lo anotado por los líderes.
                    </p>
                    <RankedBarList
                        :items="receivedByZone"
                        label="Recibido por zona"
                        format="currency"
                        empty-message="Todavía no hay sobres contados en este periodo."
                        :limit="6"
                    />
                </UiCard>
            </section>

            <section class="mt-8 grid gap-6 lg:grid-cols-2">
                <UiCard v-for="block in attention" :key="block.key" class="p-5">
                    <div class="mb-3 flex items-center justify-between">
                        <h2 class="font-display text-lg font-semibold text-on-surface">
                            {{ block.title }}
                        </h2>
                        <NuxtLink
                            v-if="block.items.length > 0"
                            :to="linkTo(RECONCILIATION_ENVELOPES, { estado: block.key })"
                            class="text-xs font-semibold text-primary hover:underline"
                        >
                            Ver todos
                        </NuxtLink>
                    </div>
                    <p
                        v-if="block.items.length === 0"
                        class="py-6 text-center text-sm text-on-surface-variant"
                    >
                        {{ block.empty }}
                    </p>
                    <ul v-else class="flex flex-col divide-y divide-outline-variant">
                        <li v-for="envelope in block.items" :key="envelope.occurrenceId">
                            <NuxtLink
                                :to="
                                    linkTo(reconciliationEnvelopePath(envelope.occurrenceId), {
                                        estado: block.key,
                                    })
                                "
                                class="flex items-center gap-3 py-2.5 hover:text-primary"
                            >
                                <span
                                    class="h-8 w-1 shrink-0 rounded-full"
                                    :style="{ backgroundColor: envelope.meetingColor }"
                                />
                                <span class="min-w-0 flex-1">
                                    <span
                                        class="block truncate text-sm font-semibold text-on-surface"
                                    >
                                        {{ envelope.meetingTitle }}
                                    </span>
                                    <span
                                        class="block truncate text-xs capitalize text-on-surface-variant"
                                    >
                                        {{ shortDateLabel(envelope.date) }}
                                        <template v-if="envelope.leaderName">
                                            · {{ envelope.leaderName }}
                                        </template>
                                    </span>
                                </span>
                                <span class="text-right">
                                    <span
                                        class="block text-sm font-semibold tabular-nums text-on-surface"
                                    >
                                        {{
                                            envelope.difference !== null
                                                ? differenceLabel(envelope.difference)
                                                : formatMoney(envelope.registeredAmount)
                                        }}
                                    </span>
                                    <span
                                        class="inline-flex items-center gap-1 text-[11px] text-on-surface-variant"
                                    >
                                        <Clock class="size-3" />
                                        {{ pendingLabel(envelope.pendingDays) }}
                                    </span>
                                </span>
                            </NuxtLink>
                        </li>
                    </ul>
                </UiCard>
            </section>

            <section class="mt-6 grid gap-6 lg:grid-cols-2">
                <UiCard class="p-5">
                    <h2 class="mb-3 font-display text-lg font-semibold text-on-surface">
                        Por tipo de ofrenda
                    </h2>
                    <p
                        v-if="summary.byType.length === 0"
                        class="py-6 text-center text-sm text-on-surface-variant"
                    >
                        Todavía no hay sobres contados en este periodo.
                    </p>
                    <table v-else class="w-full text-sm">
                        <thead>
                            <tr
                                class="border-b border-outline-variant text-[10px] uppercase tracking-wider text-on-surface-variant"
                            >
                                <th class="py-2 text-left font-semibold">Tipo</th>
                                <th class="py-2 text-right font-semibold">Líderes</th>
                                <th class="py-2 text-right font-semibold">Comité</th>
                                <th class="py-2 text-right font-semibold">Resultado</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr
                                v-for="row in summary.byType"
                                :key="row.categoryId ?? 'sin-tipo'"
                                class="border-b border-outline-variant last:border-b-0"
                            >
                                <td class="py-2.5 text-on-surface">
                                    {{ categoryLabel(row.categoryName) }}
                                </td>
                                <td class="py-2.5 text-right tabular-nums text-on-surface-variant">
                                    {{ formatMoney(row.registeredAmount) }}
                                </td>
                                <td
                                    class="py-2.5 text-right font-semibold tabular-nums text-on-surface"
                                >
                                    {{ formatMoney(row.countedAmount) }}
                                </td>
                                <td
                                    class="py-2.5 text-right text-xs font-semibold"
                                    :class="differenceClass(row.difference)"
                                >
                                    {{ differenceLabel(row.difference) }}
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </UiCard>

                <UiCard class="p-5">
                    <div class="mb-3 flex items-center justify-between">
                        <h2 class="font-display text-lg font-semibold text-on-surface">
                            Líderes con faltante
                        </h2>
                        <NuxtLink
                            :to="linkTo(RECONCILIATION_LEADERS)"
                            class="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline"
                        >
                            Ver por líder
                            <ArrowRight class="size-3.5" />
                        </NuxtLink>
                    </div>
                    <RankedBarList
                        :items="shortageByLeader"
                        label="Faltante por líder"
                        format="currency"
                        empty-message="Ningún líder tiene faltante en los sobres contados."
                        :limit="6"
                    />
                </UiCard>
            </section>

            <p class="mt-6 flex flex-wrap items-center gap-2 text-xs text-on-surface-variant">
                Estados:
                <ReconciliationStatusBadge
                    v-for="status in RECONCILIATION_STATUSES"
                    :key="status.value"
                    :status="status.value"
                />
            </p>
        </div>
    </main>
</template>
