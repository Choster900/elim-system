<script setup lang="ts">
import { ArrowRight, Clock, HandCoins, Inbox, PackageX, Scale } from '@lucide/vue'
import RankedBarList from '~/presentation/shared/components/charts/RankedBarList.vue'
import {
    categoryLabel,
    differenceLabel,
    formatMoney,
    shortDateLabel,
    toCents,
} from '~/presentation/support-committee/utils/reception-format.util'
import { resolveHttpErrorMessage } from '~/utils/http/resolve-http-error-message.util'
import ReconciliationFiltersBar from '../components/ReconciliationFiltersBar.vue'
import ReconciliationSummarySkeleton from '../components/ReconciliationSummarySkeleton.vue'
import ReconciliationStatusBadge from '../components/ReconciliationStatusBadge.vue'
import ReconciliationTabs from '../components/ReconciliationTabs.vue'
import { useReconciliationFilters } from '../composables/useReconciliationFilters'
import { useReconciliationQuery } from '../composables/useReconciliationQueries'
import type { ReconciliationEnvelope } from '../interfaces/reconciliation.interface'
import {
    RECONCILIATION_ENVELOPES,
    RECONCILIATION_LEADERS,
    RECONCILIATION_STATUSES,
    pendingLabel,
    reconciliationEnvelopePath,
} from '../utils/reconciliation-format.util'

defineOptions({ name: 'ReconciliationSummaryView' })

useHead({ title: 'Conciliación de ofrendas · Sistema' })

const { filters, linkTo } = useReconciliationFilters()
const reconciliationQuery = useReconciliationQuery(filters)

const summary = computed(() => reconciliationQuery.data.value ?? null)
const totals = computed(() => summary.value?.totals ?? null)
const receivedCount = computed(() =>
    totals.value
        ? totals.value.counts.cuadra +
          totals.value.counts.diferencia_abierta +
          totals.value.counts.diferencia_cerrada
        : 0,
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

        <div class="mt-6">
            <ReconciliationFiltersBar :zones="summary?.zones ?? []" />
        </div>

        <div
            v-if="loadError"
            class="mt-8 rounded-xl border border-destructive/40 bg-destructive/10 px-6 py-8 text-center text-sm text-destructive"
        >
            {{ loadError }}
        </div>

        <ReconciliationSummarySkeleton v-else-if="!summary || !totals" />

        <div
            v-else-if="totals.envelopes === 0"
            class="mt-8 flex flex-col items-center gap-3 rounded-xl border border-outline-variant bg-surface-container-low px-6 py-14 text-center"
        >
            <Inbox class="size-9 text-on-surface-variant" />
            <p class="max-w-md text-sm text-on-surface-variant">
                El comité no recibió sobres en este periodo y no hay sobres pendientes de entregar.
                Cambia las fechas para ver otro rango.
            </p>
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
                        {{ receivedCount === 1 ? 'sobre recibido' : 'sobres recibidos' }}
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
