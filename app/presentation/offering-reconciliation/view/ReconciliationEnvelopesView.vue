<script setup lang="ts">
import { Download, X } from '@lucide/vue'
import DataTable, {
    type DataTableColumn,
} from '~/presentation/shared/components/DataTable/DataTable.vue'
import { getMeetingScopeLabel } from '~/presentation/meetings/utils/meeting-format.util'
import {
    differenceLabel,
    formatDateTime,
    formatMoney,
    shortDateLabel,
    toCents,
} from '~/presentation/support-committee/utils/reception-format.util'
import { resolveHttpErrorMessage } from '~/utils/http/resolve-http-error-message.util'
import ReconciliationFiltersBar from '../components/ReconciliationFiltersBar.vue'
import ReconciliationStatusBadge from '../components/ReconciliationStatusBadge.vue'
import ReconciliationTableSkeleton from '../components/ReconciliationTableSkeleton.vue'
import ReconciliationTabs from '../components/ReconciliationTabs.vue'
import { useReconciliationFilters } from '../composables/useReconciliationFilters'
import { useReconciliationQuery } from '../composables/useReconciliationQueries'
import type { ReconciliationEnvelope } from '../interfaces/reconciliation.interface'
import {
    RECONCILIATION_STATUSES,
    downloadCsv,
    isReconciliationStatus,
    pendingLabel,
    reconciliationEnvelopePath,
    statusMeta,
} from '../utils/reconciliation-format.util'

defineOptions({ name: 'ReconciliationEnvelopesView' })

useHead({ title: 'Sobres · Conciliación · Sistema' })

const route = useRoute()
const { filters, linkTo, updateQuery } = useReconciliationFilters()
const reconciliationQuery = useReconciliationQuery(filters)

const summary = computed(() => reconciliationQuery.data.value ?? null)

const selectedStatus = computed(() =>
    isReconciliationStatus(route.query.estado) ? route.query.estado : null,
)
const selectedLeader = computed(() =>
    typeof route.query.lider === 'string' && route.query.lider ? route.query.lider : null,
)
const selectedLeaderName = computed(() => {
    if (!selectedLeader.value) return null
    const leader = summary.value?.byLeader.find((item) => item.key === selectedLeader.value)
    return leader?.leaderName ?? 'Sin líder asignado'
})

function leaderKey(envelope: ReconciliationEnvelope) {
    return String(envelope.leaderId ?? 'sin-lider')
}

const envelopes = computed(() =>
    (summary.value?.envelopes ?? []).filter(
        (envelope) =>
            (!selectedStatus.value || envelope.status === selectedStatus.value) &&
            (!selectedLeader.value || leaderKey(envelope) === selectedLeader.value),
    ),
)

const statusCounts = computed(() => {
    const base = (summary.value?.envelopes ?? []).filter(
        (envelope) => !selectedLeader.value || leaderKey(envelope) === selectedLeader.value,
    )
    return Object.fromEntries(
        RECONCILIATION_STATUSES.map((status) => [
            status.value,
            base.filter((envelope) => envelope.status === status.value).length,
        ]),
    ) as Record<string, number>
})

const statusChips = computed(() => [
    {
        value: null,
        label: 'Todos',
        count: Object.values(statusCounts.value).reduce((sum, count) => sum + count, 0),
    },
    ...RECONCILIATION_STATUSES.map((status) => ({
        value: status.value,
        label: status.plural,
        count: statusCounts.value[status.value] ?? 0,
    })),
])

const columns: DataTableColumn<ReconciliationEnvelope>[] = [
    {
        key: 'received',
        label: 'Recibido',
        sortable: true,
        accessor: (row) => row.receivedAt ?? '',
        width: '150px',
    },
    {
        key: 'meeting',
        label: 'Reunión',
        sortable: true,
        accessor: (row) => `${row.date} ${row.meetingTitle} ${row.meetingCode}`,
    },
    {
        key: 'leader',
        label: 'Líder · sector',
        sortable: true,
        accessor: (row) => `${row.leaderName ?? ''} ${row.sectorName ?? ''}`,
    },
    {
        key: 'registered',
        label: 'Líder',
        sortable: true,
        align: 'right',
        accessor: (row) => row.registeredAmount,
    },
    {
        key: 'counted',
        label: 'Comité',
        sortable: true,
        align: 'right',
        accessor: (row) => row.countedAmount ?? -1,
    },
    {
        key: 'difference',
        label: 'Resultado',
        sortable: true,
        align: 'right',
        accessor: (row) => row.difference ?? 0,
    },
    {
        key: 'status',
        label: 'Estado',
        sortable: true,
        accessor: (row) => statusMeta(row.status).label,
    },
    {
        key: 'pending',
        label: 'Atraso',
        sortable: true,
        align: 'right',
        accessor: (row) => row.pendingDays ?? -1,
        width: '90px',
    },
]

const loadError = computed(() =>
    reconciliationQuery.error.value
        ? resolveHttpErrorMessage(
              reconciliationQuery.error.value,
              'No fue posible cargar los sobres',
          )
        : '',
)

function setStatus(value: string | null) {
    updateQuery({ estado: value ?? undefined })
}

function clearLeader() {
    updateQuery({ lider: undefined })
}

function differenceClass(value: number) {
    return toCents(value) === 0
        ? 'text-emerald-700 dark:text-emerald-300'
        : 'text-amber-700 dark:text-amber-300'
}

function exportCsv() {
    const period = summary.value?.period
    downloadCsv(
        `conciliacion-${period?.from ?? ''}-${period?.to ?? ''}.csv`,
        [
            'Recibido por el comité',
            'Fecha de la reunión',
            'Reunión',
            'Código',
            'Líder',
            'Sector',
            'Zona',
            'Registrado líder',
            'Contado comité',
            'Diferencia',
            'Estado',
            'Días de atraso',
            'Recibió',
            'Revisó',
        ],
        envelopes.value.map((envelope) => [
            envelope.receivedAt ? formatDateTime(envelope.receivedAt) : 'Sin entregar',
            envelope.date,
            envelope.meetingTitle,
            envelope.meetingCode,
            envelope.leaderName,
            envelope.sectorName,
            envelope.zoneName,
            envelope.registeredAmount.toFixed(2),
            envelope.countedAmount?.toFixed(2) ?? '',
            envelope.difference?.toFixed(2) ?? '',
            statusMeta(envelope.status).label,
            envelope.pendingDays,
            envelope.receivedByName,
            envelope.closedByName,
        ]),
    )
}
</script>

<template>
    <main class="mx-auto w-full max-w-system px-6 pb-20 pt-24 lg:px-10">
        <header class="pb-8">
            <p class="text-xs font-semibold uppercase tracking-[0.4em] text-on-surface-variant">
                Finanzas · Conciliación
            </p>
            <h1 class="mt-4 font-display text-4xl font-semibold text-on-surface md:text-5xl">
                Sobres del periodo
            </h1>
        </header>

        <ReconciliationTabs active="envelopes" />

        <div class="mt-6">
            <ReconciliationFiltersBar :zones="summary?.zones ?? []" />
        </div>

        <section class="mt-5 flex flex-wrap items-center gap-2">
            <button
                v-for="chip in statusChips"
                :key="chip.label"
                type="button"
                class="inline-flex items-center gap-2 rounded-full border px-3.5 py-1.5 text-sm font-semibold transition-colors"
                :class="
                    selectedStatus === chip.value
                        ? 'border-primary bg-primary text-primary-foreground'
                        : 'border-outline-variant bg-surface text-on-surface hover:border-primary'
                "
                :aria-pressed="selectedStatus === chip.value"
                @click="setStatus(chip.value)"
            >
                {{ chip.label }}
                <span v-if="summary" class="tabular-nums opacity-80">{{ chip.count }}</span>
                <span
                    v-else
                    class="h-3 w-4 animate-pulse rounded bg-surface-container-high"
                    aria-hidden="true"
                />
            </button>
            <span
                v-if="selectedLeader"
                class="inline-flex items-center gap-1.5 rounded-full border border-primary/40 bg-primary/10 px-3 py-1.5 text-sm font-semibold text-primary"
            >
                Líder: {{ selectedLeaderName }}
                <button type="button" aria-label="Quitar filtro de líder" @click="clearLeader">
                    <X class="size-3.5" />
                </button>
            </span>
        </section>

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
                :rows="envelopes"
                :columns="columns"
                :row-key="(row) => String(row.occurrenceId)"
                :page-size="25"
                dense
                show-search
                search-placeholder="Buscar reunión, código, líder o sector…"
                empty-title="Sin sobres"
                empty-message="No hay sobres con estos filtros en el periodo."
            >
                <template #toolbar-end>
                    <button
                        type="button"
                        class="inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:underline disabled:opacity-50"
                        :disabled="envelopes.length === 0"
                        @click="exportCsv"
                    >
                        <Download class="size-3.5" />
                        Descargar CSV
                    </button>
                </template>
                <template #cell-received="{ row }">
                    <span v-if="row.receivedAt" class="whitespace-nowrap text-xs">
                        {{ formatDateTime(row.receivedAt) }}
                    </span>
                    <span v-else class="text-xs font-semibold text-rose-700 dark:text-rose-300">
                        Sin entregar
                    </span>
                </template>
                <template #cell-meeting="{ row }">
                    <NuxtLink
                        :to="
                            linkTo(reconciliationEnvelopePath(row.occurrenceId), {
                                estado: selectedStatus ?? undefined,
                                lider: selectedLeader ?? undefined,
                            })
                        "
                        class="group flex items-center gap-2"
                    >
                        <span
                            class="h-6 w-1 shrink-0 rounded-full"
                            :style="{ backgroundColor: row.meetingColor }"
                        />
                        <span class="min-w-0">
                            <span
                                class="block truncate font-semibold text-on-surface group-hover:text-primary group-hover:underline"
                            >
                                {{ row.meetingTitle }}
                            </span>
                            <span class="block text-[11px] text-on-surface-variant">
                                Reunión del
                                <span class="capitalize">{{ shortDateLabel(row.date) }}</span>
                                ·
                                <span class="font-mono uppercase">{{ row.meetingCode }}</span>
                            </span>
                        </span>
                    </NuxtLink>
                </template>
                <template #cell-leader="{ row }">
                    <span class="block truncate">{{ row.leaderName ?? 'Sin líder' }}</span>
                    <span class="block truncate text-xs text-on-surface-variant">
                        {{ getMeetingScopeLabel(row) }}
                    </span>
                </template>
                <template #cell-registered="{ row }">
                    <span class="tabular-nums">{{ formatMoney(row.registeredAmount) }}</span>
                </template>
                <template #cell-counted="{ row }">
                    <span v-if="row.countedAmount !== null" class="font-semibold tabular-nums">
                        {{ formatMoney(row.countedAmount) }}
                    </span>
                    <span v-else class="text-on-surface-variant">—</span>
                </template>
                <template #cell-difference="{ row }">
                    <span
                        v-if="row.difference !== null"
                        class="whitespace-nowrap text-xs font-semibold"
                        :class="differenceClass(row.difference)"
                    >
                        {{ differenceLabel(row.difference) }}
                    </span>
                    <span v-else class="text-on-surface-variant">—</span>
                </template>
                <template #cell-status="{ row }">
                    <ReconciliationStatusBadge :status="row.status" />
                </template>
                <template #cell-pending="{ row }">
                    <span
                        class="whitespace-nowrap text-xs tabular-nums"
                        :class="
                            (row.pendingDays ?? 0) >= 7
                                ? 'font-semibold text-rose-700 dark:text-rose-300'
                                : 'text-on-surface-variant'
                        "
                    >
                        {{ pendingLabel(row.pendingDays) || '—' }}
                    </span>
                </template>
            </DataTable>
        </div>
    </main>
</template>
