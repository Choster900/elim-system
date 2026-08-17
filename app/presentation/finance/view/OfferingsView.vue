<script setup lang="ts">
import {
    AlertTriangle,
    CalendarDays,
    HandCoins,
    ListChecks,
    MoreVertical,
    Pencil,
    Plus,
    Trash2,
    TrendingUp,
    Users,
} from '@lucide/vue'
import {
    DialogClose,
    DialogContent,
    DialogDescription,
    DialogOverlay,
    DialogPortal,
    DialogRoot,
    DialogTitle,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuPortal,
    DropdownMenuRoot,
    DropdownMenuTrigger,
} from 'radix-vue'
import DataTable, {
    type DataTableColumn,
} from '~/presentation/shared/components/DataTable/DataTable.vue'
import { useAppToast } from '~/presentation/shared/composables/useAppToast'
import { useDeleteOfferingMutation } from '~/presentation/finance/composables/useOfferingMutations'
import { useOfferingsQuery } from '~/presentation/finance/composables/useOfferingsQuery'
import type { OfferingRecord } from '~/presentation/finance/interfaces/offering.interface'
import { useAuthStore } from '~/presentation/auth/stores/auth.store'
import { formatMeetingDate } from '~/presentation/meetings/utils/meeting-format.util'
import { resolveHttpErrorMessage } from '~/utils/http/resolve-http-error-message.util'

defineOptions({ name: 'OfferingsView' })

useHead({ title: 'Ofrendas · Sistema' })

const toast = useAppToast()
const authStore = useAuthStore()
const offeringsQuery = useOfferingsQuery()
const deleteOfferingMutation = useDeleteOfferingMutation()
const offerings = computed(() => offeringsQuery.data.value ?? [])
const isLoading = computed(() => offeringsQuery.isPending.value)
const isAdmin = computed(() =>
    authStore.user?.roles.some((role) => ['SUPER_ADMIN', 'ADMINISTRATOR'].includes(role.code)),
)
const selectedDistrictId = ref<number | null>(null)
const districtOptions = computed(() => {
    const districts = new Map<number, string>()
    for (const offering of offerings.value) {
        districts.set(offering.districtId, offering.districtName)
    }

    return [...districts]
        .map(([value, label]) => ({ value, label }))
        .sort((left, right) => left.label.localeCompare(right.label, 'es'))
})
const visibleOfferings = computed(() => {
    if (!isAdmin.value || selectedDistrictId.value === null) return offerings.value
    return offerings.value.filter((offering) => offering.districtId === selectedDistrictId.value)
})

if (import.meta.server) {
    onServerPrefetch(() =>
        offeringsQuery
            .suspense()
            .then(() => undefined)
            .catch(() => undefined),
    )
}

if (import.meta.client) {
    watch(
        () => offeringsQuery.error.value,
        (error) => {
            if (error) {
                toast.error(resolveHttpErrorMessage(error, 'No fue posible cargar las ofrendas'))
            }
        },
        { immediate: true },
    )
}

function formatMoney(value: number) {
    return value.toLocaleString('es-SV', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

const stats = computed(() => {
    const count = visibleOfferings.value.length
    const totalCollected = visibleOfferings.value.reduce((sum, item) => sum + item.totalAmount, 0)
    const totalAttendance = visibleOfferings.value.reduce((sum, item) => sum + item.attendance, 0)
    const average = count > 0 ? totalCollected / count : 0
    return { count, totalCollected, totalAttendance, average }
})

const columns = computed<DataTableColumn<OfferingRecord>[]>(() => [
    {
        key: 'date',
        label: 'Fecha',
        sortable: true,
        filterable: true,
        filterType: 'date',
        width: '160px',
        accessor: (row) => row.date,
    },
    {
        key: 'meeting',
        label: 'Reunión',
        sortable: true,
        filterable: true,
        filterType: 'text',
        accessor: (row) => row.meetingTitle ?? '',
    },
    ...(isAdmin.value
        ? [
              {
                  key: 'district',
                  label: 'Distrito',
                  sortable: true,
                  width: '180px',
                  accessor: (row: OfferingRecord) => row.districtName,
              },
          ]
        : []),
    {
        key: 'categories',
        label: 'Desglose',
        width: '260px',
    },
    {
        key: 'attendance',
        label: 'Asistencia',
        sortable: true,
        align: 'right',
        width: '120px',
        accessor: (row) => row.attendance,
    },
    {
        key: 'total',
        label: 'Total',
        sortable: true,
        align: 'right',
        width: '140px',
        accessor: (row) => row.totalAmount,
    },
    {
        key: 'actions',
        label: '',
        width: '72px',
        align: 'right',
    },
])

function openCreate() {
    navigateTo('/finanzas/ofrendas/nueva')
}

function openEdit(row: OfferingRecord) {
    navigateTo(`/finanzas/ofrendas/${row.id}/editar`)
}

// --- Delete ---
const deleteTargetId = ref<number | null>(null)
const deleteDialogOpen = ref(false)

function askDelete(row: OfferingRecord) {
    deleteTargetId.value = row.id
    deleteDialogOpen.value = true
}

async function confirmDelete() {
    if (!deleteTargetId.value) return
    try {
        await deleteOfferingMutation.mutateAsync(deleteTargetId.value)
        toast.success('Ofrenda eliminada')
    } catch (error) {
        toast.error(resolveHttpErrorMessage(error, 'No fue posible eliminar la ofrenda'))
    } finally {
        deleteDialogOpen.value = false
        deleteTargetId.value = null
    }
}
</script>

<template>
    <main class="mx-auto w-full max-w-system px-6 pb-20 pt-24 lg:px-10">
        <section
            class="flex flex-col gap-6 border-b border-outline-variant pb-10 md:flex-row md:items-end md:justify-between"
        >
            <div>
                <p class="text-xs font-semibold uppercase tracking-[0.4em] text-on-surface-variant">
                    Finanzas · Ofrendas
                </p>
                <h1 class="mt-4 font-display text-4xl font-semibold text-on-surface md:text-5xl">
                    Ofrendas
                </h1>
                <p class="mt-3 max-w-xl text-sm leading-relaxed text-on-surface-variant">
                    Documenta, por cada reunión, la asistencia registrada y cuánto se recogió de
                    ofrenda ese día, con el desglose por categoría.
                </p>
            </div>

            <div class="flex flex-wrap gap-2">
                <UiButton
                    variant="outline"
                    type="button"
                    class="h-11 rounded px-5 text-xs uppercase tracking-wider"
                    @click="navigateTo('/finanzas/ofrendas/registro-global')"
                >
                    <ListChecks class="mr-2 size-4" /> Registro global
                </UiButton>
                <UiButton
                    type="button"
                    class="h-11 rounded px-5 text-xs uppercase tracking-wider"
                    @click="openCreate"
                >
                    <Plus class="mr-2 size-4" />
                    Registrar ofrenda
                </UiButton>
            </div>
        </section>

        <section class="mt-10 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <UiCard class="p-6">
                <HandCoins class="mb-4 size-6 text-primary" />
                <p
                    class="text-[11px] font-semibold uppercase tracking-wider text-on-surface-variant"
                >
                    Total recolectado
                </p>
                <h3 class="mt-1 font-display text-3xl font-semibold text-on-surface">
                    ${{ formatMoney(stats.totalCollected) }}
                </h3>
                <p class="mt-2 text-xs text-on-surface-variant">Suma de todas las ofrendas</p>
            </UiCard>
            <UiCard class="p-6">
                <CalendarDays class="mb-4 size-6 text-primary" />
                <p
                    class="text-[11px] font-semibold uppercase tracking-wider text-on-surface-variant"
                >
                    Ofrendas registradas
                </p>
                <h3 class="mt-1 font-display text-3xl font-semibold text-on-surface">
                    {{ stats.count }}
                </h3>
                <p class="mt-2 text-xs text-on-surface-variant">Reuniones documentadas</p>
            </UiCard>
            <UiCard class="p-6">
                <Users class="mb-4 size-6 text-primary" />
                <p
                    class="text-[11px] font-semibold uppercase tracking-wider text-on-surface-variant"
                >
                    Asistencia total
                </p>
                <h3 class="mt-1 font-display text-3xl font-semibold text-on-surface">
                    {{ stats.totalAttendance }}
                </h3>
                <p class="mt-2 text-xs text-on-surface-variant">Personas registradas</p>
            </UiCard>
            <UiCard class="p-6">
                <TrendingUp class="mb-4 size-6 text-primary" />
                <p
                    class="text-[11px] font-semibold uppercase tracking-wider text-on-surface-variant"
                >
                    Promedio por reunión
                </p>
                <h3 class="mt-1 font-display text-3xl font-semibold text-on-surface">
                    ${{ formatMoney(stats.average) }}
                </h3>
                <p class="mt-2 text-xs text-on-surface-variant">Ofrenda promedio</p>
            </UiCard>
        </section>

        <section class="mt-10">
            <div
                v-if="isAdmin"
                class="mb-4 flex flex-col gap-3 rounded-lg border border-outline-variant bg-surface-container-low px-5 py-4 sm:flex-row sm:items-center sm:justify-between"
            >
                <div>
                    <p class="text-xs font-semibold uppercase tracking-wider text-on-surface">
                        Filtrar por distrito
                    </p>
                    <p class="mt-1 text-xs text-on-surface-variant">
                        Los totales y registros se actualizan según el distrito seleccionado.
                    </p>
                </div>
                <div class="w-full sm:w-72">
                    <UiSearchSelect
                        v-model="selectedDistrictId"
                        :options="districtOptions"
                        clearable
                        placeholder="Todos los distritos"
                        search-placeholder="Buscar distrito..."
                    />
                </div>
            </div>

            <DataTable
                :rows="visibleOfferings"
                :columns="columns"
                row-key="id"
                :page-size="10"
                :loading="isLoading"
                empty-title="Sin ofrendas"
                empty-message="Aún no se ha registrado ninguna ofrenda. Usa «Registrar ofrenda» para comenzar."
            >
                <template #cell-date="{ row }">
                    <div class="flex items-center gap-2">
                        <CalendarDays class="size-4 text-on-surface-variant" />
                        <span class="text-sm text-on-surface">
                            {{ formatMeetingDate((row as OfferingRecord).date) }}
                        </span>
                    </div>
                </template>

                <template #cell-meeting="{ row }">
                    <p class="font-display text-sm font-semibold text-on-surface">
                        {{ (row as OfferingRecord).meetingTitle ?? '—' }}
                    </p>
                    <p
                        v-if="(row as OfferingRecord).recordedByName"
                        class="mt-0.5 text-[11px] text-on-surface-variant"
                    >
                        Registró: {{ (row as OfferingRecord).recordedByName }}
                    </p>
                </template>

                <template #cell-categories="{ row }">
                    <div class="flex flex-wrap gap-1">
                        <span
                            v-for="detail in (row as OfferingRecord).details"
                            :key="detail.id"
                            class="inline-flex items-center gap-1 rounded border border-outline-variant bg-surface-container px-2 py-0.5 text-[10px] text-on-surface-variant"
                        >
                            {{ detail.categoryName }}:
                            <span class="font-semibold text-on-surface"
                                >${{ formatMoney(detail.amount) }}</span
                            >
                        </span>
                    </div>
                </template>

                <template #cell-attendance="{ row }">
                    <span class="text-sm text-on-surface">{{
                        (row as OfferingRecord).attendance
                    }}</span>
                </template>

                <template #cell-total="{ row }">
                    <span class="font-display text-sm font-semibold text-primary">
                        {{ (row as OfferingRecord).currency }}
                        {{ formatMoney((row as OfferingRecord).totalAmount) }}
                    </span>
                </template>

                <template #cell-actions="{ row }">
                    <DropdownMenuRoot>
                        <DropdownMenuTrigger
                            class="flex size-9 items-center justify-center rounded-full text-on-surface-variant transition-colors hover:bg-surface-container-high hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                            aria-label="Más acciones"
                        >
                            <MoreVertical class="size-4" />
                        </DropdownMenuTrigger>
                        <DropdownMenuPortal>
                            <DropdownMenuContent
                                :side-offset="6"
                                align="end"
                                class="z-50 w-48 overflow-hidden border border-outline-variant bg-surface-container py-1 shadow-lg focus:outline-none"
                            >
                                <DropdownMenuItem
                                    class="flex cursor-pointer items-center gap-3 px-4 py-2.5 text-xs font-semibold uppercase tracking-wider text-on-surface-variant outline-none data-[highlighted]:bg-surface-container-high data-[highlighted]:text-primary"
                                    @select="openEdit(row as OfferingRecord)"
                                >
                                    <Pencil class="size-3.5" /> Editar
                                </DropdownMenuItem>
                                <div class="my-1 h-px bg-outline-variant" />
                                <DropdownMenuItem
                                    class="flex cursor-pointer items-center gap-3 px-4 py-2.5 text-xs font-semibold uppercase tracking-wider text-destructive outline-none data-[highlighted]:bg-destructive/10"
                                    @select="askDelete(row as OfferingRecord)"
                                >
                                    <Trash2 class="size-3.5" /> Eliminar
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenuPortal>
                    </DropdownMenuRoot>
                </template>
            </DataTable>
        </section>

        <DialogRoot v-model:open="deleteDialogOpen">
            <DialogPortal>
                <DialogOverlay class="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm" />
                <DialogContent
                    class="fixed left-1/2 top-1/2 z-50 w-[90vw] max-w-md -translate-x-1/2 -translate-y-1/2 rounded-lg border border-outline-variant bg-surface p-6 shadow-2xl focus:outline-none"
                >
                    <div class="flex items-start gap-4">
                        <div
                            class="flex size-11 shrink-0 items-center justify-center rounded-full bg-destructive/10 text-destructive"
                        >
                            <AlertTriangle class="size-5" />
                        </div>
                        <div>
                            <DialogTitle class="font-display text-xl font-semibold text-on-surface">
                                Eliminar ofrenda
                            </DialogTitle>
                            <DialogDescription class="mt-2 text-sm text-on-surface-variant">
                                Esta acción no se puede deshacer. El registro de ofrenda será
                                removido de forma permanente.
                            </DialogDescription>
                        </div>
                    </div>

                    <div class="mt-6 flex justify-end gap-2">
                        <DialogClose as-child>
                            <UiButton
                                variant="outline"
                                type="button"
                                class="h-10 rounded px-4 text-xs uppercase tracking-wider"
                            >
                                Cancelar
                            </UiButton>
                        </DialogClose>
                        <UiButton
                            type="button"
                            class="h-10 rounded bg-destructive px-4 text-xs uppercase tracking-wider text-white hover:bg-destructive/90"
                            :loading="deleteOfferingMutation.isPending.value"
                            :disabled="deleteOfferingMutation.isPending.value"
                            @click="confirmDelete"
                        >
                            <Trash2 class="mr-2 size-4" />
                            Eliminar
                        </UiButton>
                    </div>
                </DialogContent>
            </DialogPortal>
        </DialogRoot>
    </main>
</template>
