<script setup lang="ts">
import { Pencil, Trash2 } from '@lucide/vue'
import DataTable, {
    type DataTableColumn,
} from '~/presentation/shared/components/DataTable/DataTable.vue'
import { useAppToast } from '~/presentation/shared/composables/useAppToast'
import { businessIsoDate, formatLocalIsoDate } from '~/utils/date/date-format.util'
import { resolveHttpErrorMessage } from '~/utils/http/resolve-http-error-message.util'
import SupportCommitteeTabs from '../components/SupportCommitteeTabs.vue'
import TitheForm from '../components/TitheForm.vue'
import { useSupportCommitteeAccess } from '../composables/useSupportCommitteeAccess'
import { useDeleteTitheMutation } from '../composables/useTitheMutations'
import { useTithesQuery } from '../composables/useTitheQueries'
import type { TitheRecord } from '../interfaces/tithe.interface'
import { formatMoney, toCents } from '../utils/reception-format.util'
import { memberMeta, timeLabel } from '../utils/tithe-format.util'

defineOptions({ name: 'TitheReceptionView' })

useHead({ title: 'Diezmos · Sistema' })

const PAGE_SIZE = 5
const UNKNOWN_RECEIVER = 'Sin usuario'
const CLOCK_TICK_MS = 60_000

type TithePeriod = 'hoy' | 'mes' | 'todos'

interface TitheRow extends TitheRecord {
    receivedDay: string
}

const toast = useAppToast()
const now = ref(Date.now())
const today = computed(() => businessIsoDate(now.value))
let clock: ReturnType<typeof setInterval> | undefined
const { canCreateTithes, canUpdateTithes, canDeleteTithes } = useSupportCommitteeAccess()

const tithesQuery = useTithesQuery()
const deleteMutation = useDeleteTitheMutation()

const editing = ref<TitheRecord | null>(null)
const deletingId = ref<number | null>(null)
const formRef = ref<InstanceType<typeof TitheForm> | null>(null)
const showForm = computed(
    () => canCreateTithes.value || (editing.value !== null && canUpdateTithes.value),
)
const hasRowActions = computed(() => canUpdateTithes.value || canDeleteTithes.value)

const tithes = computed(() => tithesQuery.data.value?.items ?? [])

function totalOf(items: TitheRecord[]) {
    return items.reduce((sum, tithe) => sum + toCents(tithe.amount), 0) / 100
}

const rows = computed<TitheRow[]>(() =>
    tithes.value
        .map((tithe) => ({ ...tithe, receivedDay: businessIsoDate(tithe.receivedAt) }))
        .sort(
            (left, right) => right.receivedAt.localeCompare(left.receivedAt) || right.id - left.id,
        ),
)

const todayTithes = computed(() => rows.value.filter((row) => row.receivedDay === today.value))
const monthTithes = computed(() =>
    rows.value.filter((row) => row.receivedDay.slice(0, 7) === today.value.slice(0, 7)),
)

const period = ref<TithePeriod>('mes')
const periodOptions = computed(() => [
    { key: 'hoy' as const, label: 'Hoy', items: todayTithes.value },
    { key: 'mes' as const, label: 'Este mes', items: monthTithes.value },
    { key: 'todos' as const, label: 'Todos', items: rows.value },
])
const visibleTithes = computed(
    () => periodOptions.value.find((option) => option.key === period.value)?.items ?? rows.value,
)

const emptyTitle = computed(() => {
    if (tithes.value.length === 0) return 'Aún no hay diezmos'
    if (visibleTithes.value.length > 0) return 'Sin resultados'
    return period.value === 'hoy' ? 'Nada recibido hoy' : 'Nada recibido este mes'
})

const emptyMessage = computed(() => {
    if (tithes.value.length === 0) {
        return canCreateTithes.value
            ? 'Registra el primer sobre con el formulario de arriba.'
            : 'El comité todavía no ha registrado diezmos.'
    }
    if (visibleTithes.value.length > 0) return 'Ningún diezmo coincide con los filtros.'
    return 'Toca «Todos» para ver los diezmos recibidos en otras fechas.'
})

const receiverOptions = computed(() =>
    [...new Set(tithes.value.map((tithe) => tithe.receivedByName ?? UNKNOWN_RECEIVER))]
        .sort((left, right) => left.localeCompare(right, 'es'))
        .map((name) => ({ value: name, label: name })),
)

const columns = computed<DataTableColumn<TitheRow>[]>(() => [
    {
        key: 'receivedDay',
        label: 'Recibido',
        sortable: true,
        filterable: true,
        filterType: 'daterange',
        accessor: (row) => row.receivedDay,
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
    ...(hasRowActions.value
        ? [{ key: 'actions', label: '', align: 'right' as const, width: '96px' }]
        : []),
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

function dayMonthLabel(isoDate: string) {
    return formatLocalIsoDate(isoDate, { day: 'numeric', month: 'short', year: 'numeric' })
}

onMounted(() => {
    clock = setInterval(() => {
        now.value = Date.now()
    }, CLOCK_TICK_MS)
})

onBeforeUnmount(() => clearInterval(clock))

function startEditing(tithe: TitheRecord) {
    if (!canUpdateTithes.value) return
    editing.value = tithe
    nextTick(() => {
        const element = formRef.value?.$el as HTMLElement | undefined
        if ((element?.getBoundingClientRect().top ?? 0) < 0) {
            element?.scrollIntoView({ behavior: 'smooth', block: 'start' })
        }
    })
}

async function removeTithe(tithe: TitheRecord) {
    if (!canDeleteTithes.value) return
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
            <div class="flex w-full flex-col items-start gap-1 sm:w-auto sm:items-end">
                <div
                    role="group"
                    aria-label="Filtrar diezmos por día de recepción"
                    class="grid w-full grid-cols-3 divide-x divide-outline-variant overflow-hidden rounded-lg border border-outline-variant bg-surface-container-low sm:flex sm:w-auto"
                >
                    <button
                        v-for="option in periodOptions"
                        :key="option.key"
                        type="button"
                        class="min-w-0 px-3 py-2 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary sm:px-4"
                        :class="period === option.key ? 'bg-primary/10' : 'hover:bg-surface'"
                        :aria-pressed="period === option.key"
                        @click="period = option.key"
                    >
                        <span
                            class="block text-[10px] font-semibold uppercase tracking-wider"
                            :class="
                                period === option.key ? 'text-primary' : 'text-on-surface-variant'
                            "
                        >
                            {{ option.label }}
                        </span>
                        <span
                            class="block truncate text-sm font-semibold tabular-nums text-on-surface sm:whitespace-nowrap sm:text-base"
                        >
                            {{ formatMoney(totalOf(option.items)) }}
                            <span
                                class="block text-xs font-normal text-on-surface-variant sm:inline"
                            >
                                <span class="hidden sm:inline">·</span>
                                {{ option.items.length }}
                                {{ option.items.length === 1 ? 'sobre' : 'sobres' }}
                            </span>
                        </span>
                    </button>
                </div>
                <p class="text-[11px] text-on-surface-variant">
                    Según el día en que el comité recibió cada sobre
                </p>
            </div>
        </header>

        <SupportCommitteeTabs active="tithes" />

        <TitheForm
            v-if="showForm"
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
                :rows="visibleTithes"
                :columns="columns"
                row-key="id"
                :page-size="PAGE_SIZE"
                :page-size-options="[5, 10, 25, 50]"
                dense
                :loading="tithesQuery.isPending.value"
                :empty-title="emptyTitle"
                :empty-message="emptyMessage"
            >
                <template #cell-receivedDay="{ row }">
                    <p class="whitespace-nowrap text-sm text-on-surface">
                        {{ dateLabel(row.receivedDay) }}
                    </p>
                    <p class="text-[11px] tabular-nums text-on-surface-variant">
                        {{ timeLabel(row.receivedAt) }}
                    </p>
                    <p
                        v-if="row.date !== row.receivedDay"
                        class="whitespace-nowrap text-[11px] font-semibold text-primary"
                    >
                        Diezmo del {{ dayMonthLabel(row.date) }}
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
                            v-if="canUpdateTithes"
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
                            v-if="canDeleteTithes"
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
