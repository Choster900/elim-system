<script setup lang="ts">
import { ChevronRight } from '@lucide/vue'
import DataTable, {
    type DataTableColumn,
} from '~/presentation/shared/components/DataTable/DataTable.vue'
import {
    differenceLabel,
    formatMoney,
    toCents,
} from '~/presentation/support-committee/utils/reception-format.util'
import { resolveHttpErrorMessage } from '~/utils/http/resolve-http-error-message.util'
import ReconciliationFiltersBar from '../components/ReconciliationFiltersBar.vue'
import ReconciliationTableSkeleton from '../components/ReconciliationTableSkeleton.vue'
import ReconciliationTabs from '../components/ReconciliationTabs.vue'
import { useReconciliationFilters } from '../composables/useReconciliationFilters'
import { useReconciliationQuery } from '../composables/useReconciliationQueries'
import type { ReconciliationLeaderRow } from '../interfaces/reconciliation.interface'
import { RECONCILIATION_ENVELOPES, pendingLabel } from '../utils/reconciliation-format.util'

defineOptions({ name: 'ReconciliationLeadersView' })

useHead({ title: 'Por líder · Conciliación · Sistema' })

const { filters, linkTo } = useReconciliationFilters()
const reconciliationQuery = useReconciliationQuery(filters)

const summary = computed(() => reconciliationQuery.data.value ?? null)
const leaders = computed(() => summary.value?.byLeader ?? [])

const columns: DataTableColumn<ReconciliationLeaderRow>[] = [
    {
        key: 'leader',
        label: 'Líder',
        sortable: true,
        accessor: (row) => `${row.leaderName ?? ''} ${row.sectorNames.join(' ')}`,
    },
    {
        key: 'envelopes',
        label: 'Sobres',
        sortable: true,
        align: 'right',
        accessor: (row) => row.envelopes,
        width: '90px',
    },
    {
        key: 'registered',
        label: 'Registró',
        sortable: true,
        align: 'right',
        accessor: (row) => row.registeredAmount,
    },
    {
        key: 'received',
        label: 'Contó el comité',
        sortable: true,
        align: 'right',
        accessor: (row) => row.receivedAmount,
    },
    {
        key: 'difference',
        label: 'Resultado',
        sortable: true,
        align: 'right',
        accessor: (row) => row.difference,
    },
    {
        key: 'open',
        label: 'Sin revisar',
        sortable: true,
        align: 'right',
        accessor: (row) => row.openDiscrepancies,
        width: '110px',
    },
    {
        key: 'undelivered',
        label: 'Sin entregar',
        sortable: true,
        align: 'right',
        accessor: (row) => row.undelivered,
        width: '120px',
    },
    {
        key: 'oldest',
        label: 'Mayor atraso',
        sortable: true,
        align: 'right',
        accessor: (row) => row.oldestPendingDays ?? -1,
        width: '120px',
    },
]

const loadError = computed(() =>
    reconciliationQuery.error.value
        ? resolveHttpErrorMessage(
              reconciliationQuery.error.value,
              'No fue posible cargar los datos',
          )
        : '',
)

function differenceClass(value: number) {
    return toCents(value) === 0
        ? 'text-emerald-700 dark:text-emerald-300'
        : 'text-amber-700 dark:text-amber-300'
}
</script>

<template>
    <main class="mx-auto w-full max-w-system px-6 pb-20 pt-24 lg:px-10">
        <header class="pb-8">
            <p class="text-xs font-semibold uppercase tracking-[0.4em] text-on-surface-variant">
                Finanzas · Conciliación
            </p>
            <h1 class="mt-4 font-display text-4xl font-semibold text-on-surface md:text-5xl">
                Por líder y sector
            </h1>
            <p class="mt-3 max-w-2xl text-sm leading-relaxed text-on-surface-variant">
                Quién tiene faltantes, diferencias sin revisar o sobres sin entregar. Abre un líder
                para ver sus sobres.
            </p>
        </header>

        <ReconciliationTabs active="leaders" />

        <div class="mt-6">
            <ReconciliationFiltersBar :zones="summary?.zones ?? []" />
        </div>

        <div
            v-if="loadError"
            class="mt-6 rounded-xl border border-destructive/40 bg-destructive/10 px-6 py-8 text-center text-sm text-destructive"
        >
            {{ loadError }}
        </div>

        <ReconciliationTableSkeleton
            v-else-if="reconciliationQuery.isPending.value"
            class="mt-5"
            :columns="8"
        />

        <div
            v-else
            class="mt-5 transition-opacity duration-200"
            :class="{ 'opacity-50': reconciliationQuery.isPlaceholderData.value }"
            :aria-busy="reconciliationQuery.isPlaceholderData.value"
        >
            <DataTable
                :rows="leaders"
                :columns="columns"
                row-key="key"
                :page-size="25"
                dense
                show-search
                search-placeholder="Buscar líder o sector…"
                empty-title="Sin líderes"
                empty-message="No hay ofrendas registradas en este periodo."
            >
                <template #cell-leader="{ row }">
                    <NuxtLink
                        :to="linkTo(RECONCILIATION_ENVELOPES, { lider: row.key })"
                        class="group flex items-center gap-2"
                    >
                        <span class="min-w-0">
                            <span
                                class="block truncate font-semibold text-on-surface group-hover:text-primary group-hover:underline"
                            >
                                {{ row.leaderName ?? 'Sin líder asignado' }}
                            </span>
                            <span class="block truncate text-xs text-on-surface-variant">
                                {{ row.sectorNames.join(', ') || 'Reunión general' }}
                            </span>
                        </span>
                        <ChevronRight
                            class="size-4 shrink-0 text-on-surface-variant group-hover:text-primary"
                        />
                    </NuxtLink>
                </template>
                <template #cell-registered="{ row }">
                    <span class="tabular-nums">{{ formatMoney(row.registeredAmount) }}</span>
                </template>
                <template #cell-received="{ row }">
                    <span class="font-semibold tabular-nums">
                        {{ formatMoney(row.receivedAmount) }}
                    </span>
                </template>
                <template #cell-difference="{ row }">
                    <span
                        class="whitespace-nowrap text-xs font-semibold"
                        :class="differenceClass(row.difference)"
                    >
                        {{ differenceLabel(row.difference) }}
                    </span>
                </template>
                <template #cell-open="{ row }">
                    <span
                        class="tabular-nums"
                        :class="
                            row.openDiscrepancies > 0
                                ? 'font-semibold text-amber-700 dark:text-amber-300'
                                : 'text-on-surface-variant'
                        "
                    >
                        {{ row.openDiscrepancies }}
                    </span>
                </template>
                <template #cell-undelivered="{ row }">
                    <span
                        class="tabular-nums"
                        :class="
                            row.undelivered > 0
                                ? 'font-semibold text-rose-700 dark:text-rose-300'
                                : 'text-on-surface-variant'
                        "
                    >
                        {{ row.undelivered }}
                        <span v-if="row.undelivered > 0" class="text-[11px] font-normal">
                            ({{ formatMoney(row.undeliveredAmount) }})
                        </span>
                    </span>
                </template>
                <template #cell-oldest="{ row }">
                    <span class="text-xs tabular-nums text-on-surface-variant">
                        {{ pendingLabel(row.oldestPendingDays) || '—' }}
                    </span>
                </template>
            </DataTable>
        </div>
    </main>
</template>
