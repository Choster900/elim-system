<script setup lang="ts">
import { Pencil, Trash2 } from '@lucide/vue'
import DataTable, {
    type DataTableColumn,
} from '~/presentation/shared/components/DataTable/DataTable.vue'
import { useAppToast } from '~/presentation/shared/composables/useAppToast'
import { formatLocalIsoDate } from '~/utils/date/date-format.util'
import { resolveHttpErrorMessage } from '~/utils/http/resolve-http-error-message.util'
import SupportCommitteeTabs from '../components/SupportCommitteeTabs.vue'
import TitheForm from '../components/TitheForm.vue'
import { useDeleteTitheMutation } from '../composables/useTitheMutations'
import { useTithesQuery } from '../composables/useTitheQueries'
import type { TitheRecord } from '../interfaces/tithe.interface'
import { formatMoney, toCents } from '../utils/reception-format.util'
import { localIsoDate, memberMeta, timeLabel } from '../utils/tithe-format.util'

defineOptions({ name: 'TitheReceptionView' })

useHead({ title: 'Diezmos · Sistema' })

const PAGE_SIZE = 5
const UNKNOWN_RECEIVER = 'Sin usuario'

const toast = useAppToast()
const today = localIsoDate()

const tithesQuery = useTithesQuery()
const deleteMutation = useDeleteTitheMutation()

const editing = ref<TitheRecord | null>(null)
const deletingId = ref<number | null>(null)
const formRef = ref<InstanceType<typeof TitheForm> | null>(null)

const tithes = computed(() => tithesQuery.data.value?.items ?? [])

function totalOf(items: TitheRecord[]) {
    return items.reduce((sum, tithe) => sum + toCents(tithe.amount), 0) / 100
}

const todayTithes = computed(() => tithes.value.filter((tithe) => tithe.date === today))
const monthTithes = computed(() =>
    tithes.value.filter((tithe) => tithe.date.slice(0, 7) === today.slice(0, 7)),
)

const receiverOptions = computed(() =>
    [...new Set(tithes.value.map((tithe) => tithe.receivedByName ?? UNKNOWN_RECEIVER))]
        .sort((left, right) => left.localeCompare(right, 'es'))
        .map((name) => ({ value: name, label: name })),
)

const columns = computed<DataTableColumn<TitheRecord>[]>(() => [
    {
        key: 'date',
        label: 'Fecha',
        sortable: true,
        filterable: true,
        filterType: 'daterange',
        accessor: (row) => row.date,
        width: '170px',
    },
    {
        key: 'member',
        label: 'Diezmador',
        sortable: true,
        filterable: true,
        accessor: (row) =>
            `${row.member.fullName} ${row.member.code} ${row.member.documentNumber ?? ''}`,
    },
    {
        key: 'amount',
        label: 'Monto',
        sortable: true,
        align: 'right',
        accessor: (row) => row.amount,
        width: '130px',
    },
    {
        key: 'receivedBy',
        label: 'Recibió',
        sortable: true,
        filterable: true,
        filterType: 'select',
        filterOptions: receiverOptions.value,
        accessor: (row) => row.receivedByName ?? UNKNOWN_RECEIVER,
        width: '190px',
    },
    { key: 'notes', label: 'Nota', accessor: (row) => row.notes ?? '' },
    { key: 'actions', label: '', align: 'right', width: '96px' },
])

const loadError = computed(() =>
    tithesQuery.error.value
        ? resolveHttpErrorMessage(tithesQuery.error.value, 'No fue posible cargar los diezmos')
        : '',
)

function dateLabel(isoDate: string) {
    return formatLocalIsoDate(isoDate, {
        weekday: 'short',
        day: 'numeric',
        month: 'short',
        year: 'numeric',
    })
}

function startEditing(tithe: TitheRecord) {
    editing.value = tithe
    nextTick(() => {
        const element = formRef.value?.$el as HTMLElement | undefined
        if ((element?.getBoundingClientRect().top ?? 0) < 0) {
            element?.scrollIntoView({ behavior: 'smooth', block: 'start' })
        }
    })
}

async function removeTithe(tithe: TitheRecord) {
    const confirmed = window.confirm(
        `¿Eliminar el diezmo de ${tithe.member.fullName} por ${formatMoney(tithe.amount)}? Úsalo solo si se registró por error.`,
    )
    if (!confirmed) return
    deletingId.value = tithe.id
    try {
        await deleteMutation.mutateAsync(tithe.id)
        if (editing.value?.id === tithe.id) editing.value = null
        toast.success(`Diezmo de ${tithe.member.fullName} eliminado`)
    } catch (error) {
        toast.error(resolveHttpErrorMessage(error, 'No fue posible eliminar el diezmo'))
    } finally {
        deletingId.value = null
    }
}

const iconButtonClass =
    'inline-flex size-8 items-center justify-center rounded-md text-on-surface-variant transition-colors disabled:pointer-events-none disabled:opacity-40'
</script>

<template>
    <main class="mx-auto w-full max-w-system px-6 pb-16 pt-20 lg:px-10">
        <header class="flex flex-wrap items-end justify-between gap-x-6 gap-y-3 pb-4">
            <div>
                <p
                    class="text-[11px] font-semibold uppercase tracking-[0.35em] text-on-surface-variant"
                >
                    Finanzas · Comité de apoyo
                </p>
                <h1 class="mt-1.5 font-display text-3xl font-semibold text-on-surface">Diezmos</h1>
            </div>
            <dl
                class="flex divide-x divide-outline-variant rounded-lg border border-outline-variant bg-surface-container-low"
            >
                <div class="px-4 py-2">
                    <dt
                        class="text-[10px] font-semibold uppercase tracking-wider text-on-surface-variant"
                    >
                        Hoy
                    </dt>
                    <dd class="text-base font-semibold tabular-nums text-on-surface">
                        {{ formatMoney(totalOf(todayTithes)) }}
                        <span class="text-xs font-normal text-on-surface-variant">
                            · {{ todayTithes.length }}
                            {{ todayTithes.length === 1 ? 'sobre' : 'sobres' }}
                        </span>
                    </dd>
                </div>
                <div class="px-4 py-2">
                    <dt
                        class="text-[10px] font-semibold uppercase tracking-wider text-on-surface-variant"
                    >
                        Este mes
                    </dt>
                    <dd class="text-base font-semibold tabular-nums text-on-surface">
                        {{ formatMoney(totalOf(monthTithes)) }}
                        <span class="text-xs font-normal text-on-surface-variant">
                            · {{ monthTithes.length }}
                            {{ monthTithes.length === 1 ? 'sobre' : 'sobres' }}
                        </span>
                    </dd>
                </div>
            </dl>
        </header>

        <SupportCommitteeTabs active="tithes" />

        <TitheForm
            ref="formRef"
            class="mt-4 scroll-mt-24"
            :editing="editing"
            :tithes="tithes"
            :today="today"
            @saved="editing = null"
            @cancel="editing = null"
        />

        <div
            v-if="loadError"
            class="mt-4 rounded-xl border border-destructive/40 bg-destructive/10 px-6 py-8 text-center text-sm text-destructive"
        >
            {{ loadError }}
        </div>

        <div v-else class="mt-4">
            <DataTable
                :rows="tithes"
                :columns="columns"
                row-key="id"
                :page-size="PAGE_SIZE"
                :page-size-options="[5, 10, 25, 50]"
                dense
                :loading="tithesQuery.isPending.value"
                :empty-title="tithes.length === 0 ? 'Aún no hay diezmos' : 'Sin resultados'"
                :empty-message="
                    tithes.length === 0
                        ? 'Registra el primer sobre con el formulario de arriba.'
                        : 'Ningún diezmo coincide con los filtros.'
                "
            >
                <template #cell-date="{ row }">
                    <p class="whitespace-nowrap text-sm text-on-surface">
                        {{ dateLabel(row.date) }}
                    </p>
                    <p class="text-[11px] tabular-nums text-on-surface-variant">
                        {{ timeLabel(row.receivedAt) }}
                    </p>
                </template>

                <template #cell-member="{ row }">
                    <p class="font-semibold text-on-surface">{{ row.member.fullName }}</p>
                    <p class="text-[11px] text-on-surface-variant">
                        {{ memberMeta(row.member) }}
                    </p>
                </template>

                <template #cell-amount="{ row }">
                    <span class="whitespace-nowrap font-semibold tabular-nums">
                        {{ formatMoney(row.amount) }}
                    </span>
                </template>

                <template #cell-receivedBy="{ row }">
                    <p class="text-on-surface">{{ row.receivedByName ?? UNKNOWN_RECEIVER }}</p>
                    <p v-if="row.updatedByName" class="text-[11px] text-on-surface-variant">
                        Corrigió {{ row.updatedByName }}
                    </p>
                </template>

                <template #cell-notes="{ row }">
                    <p
                        v-if="row.notes"
                        class="line-clamp-2 max-w-xs text-xs italic text-on-surface"
                        :title="row.notes"
                    >
                        {{ row.notes }}
                    </p>
                    <span v-else class="text-on-surface-variant">—</span>
                </template>

                <template #cell-actions="{ row }">
                    <div class="flex justify-end">
                        <button
                            type="button"
                            :class="[
                                iconButtonClass,
                                editing?.id === row.id
                                    ? 'bg-primary/10 text-primary'
                                    : 'hover:bg-surface hover:text-primary',
                            ]"
                            :aria-label="`Corregir diezmo de ${row.member.fullName}`"
                            :disabled="deletingId === row.id"
                            @click="startEditing(row)"
                        >
                            <Pencil class="size-4" />
                        </button>
                        <button
                            type="button"
                            :class="[
                                iconButtonClass,
                                'hover:bg-destructive/10 hover:text-destructive',
                            ]"
                            :aria-label="`Eliminar diezmo de ${row.member.fullName}`"
                            :disabled="deletingId === row.id"
                            @click="removeTithe(row)"
                        >
                            <Trash2 class="size-4" />
                        </button>
                    </div>
                </template>
            </DataTable>
        </div>
    </main>
</template>
