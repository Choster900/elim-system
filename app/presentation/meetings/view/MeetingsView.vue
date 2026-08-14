<script setup lang="ts">
import {
    AlertTriangle,
    CalendarDays,
    CheckCircle2,
    Clock,
    Compass,
    Eye,
    EyeOff,
    MapPin,
    MoreVertical,
    Pencil,
    Plus,
    Trash2,
    Users,
    X,
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
import {
    formatMeetingDate,
    formatMeetingMonth,
    formatMeetingTimeRange,
    getMeetingDateDay,
    getMeetingFrequencyLabel,
    getMeetingStatusLabel,
} from '~/presentation/meetings/utils/meeting-format.util'
import { formatInitials } from '~/utils/string/text-format.util'
import { readJsonStorage, writeJsonStorage } from '~/utils/storage/json-storage.util'
import {
    type MeetingStatus,
    type MockMeeting,
    colorPalette,
    getMockMeetings,
    mockMeetingTypes,
    mockSectors,
    mockSupervisors,
    statusOptions,
} from '~/mock/meetings.mock'

defineOptions({ name: 'MeetingsView' })

useHead({
    title: 'Reuniones · Sistema',
})

const STORAGE_KEY = 'meetings-catalog-v2'

const meetings = ref<MockMeeting[]>(getMockMeetings())

onMounted(() => {
    const storedMeetings = readJsonStorage<MockMeeting[] | null>(STORAGE_KEY, null)
    if (storedMeetings) {
        meetings.value = storedMeetings
    } else {
        writeJsonStorage(STORAGE_KEY, meetings.value)
    }
})

function persist() {
    writeJsonStorage(STORAGE_KEY, meetings.value)
}

function isWithinNextDays(dateStr: string, days: number) {
    const target = new Date(dateStr)
    const now = new Date()
    now.setHours(0, 0, 0, 0)
    const diffDays = Math.floor((target.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
    return diffDays >= 0 && diffDays <= days
}

const stats = computed(() => {
    const total = meetings.value.length
    const upcoming = meetings.value.filter(
        (m) => m.status === 'programada' && new Date(m.date) >= new Date(new Date().toDateString()),
    ).length
    const thisWeek = meetings.value.filter(
        (m) => m.status !== 'cancelada' && isWithinNextDays(m.date, 7),
    ).length
    const completed = meetings.value.filter((m) => m.status === 'completada').length
    return { total, upcoming, thisWeek, completed }
})

function sectorOf(id: string) {
    return mockSectors.find((s) => s.id === id)
}
function supervisorOf(id: string | null) {
    return id ? mockSupervisors.find((s) => s.id === id) : null
}
function typeOf(id: string) {
    return mockMeetingTypes.find((t) => t.id === id)
}
function statusTone(status: MeetingStatus) {
    switch (status) {
        case 'programada':
            return 'border-primary/40 bg-primary/10 text-primary'
        case 'en_curso':
            return 'border-emerald-500/40 bg-emerald-500/10 text-emerald-500'
        case 'completada':
            return 'border-outline-variant bg-surface-container-high text-on-surface-variant'
        case 'cancelada':
            return 'border-destructive/40 bg-destructive/10 text-destructive'
    }
}

const columns: DataTableColumn<MockMeeting>[] = [
    {
        key: 'date',
        label: 'Fecha',
        sortable: true,
        filterable: true,
        filterType: 'date',
        width: '300px',
        accessor: (row) => row.date,
    },
    {
        key: 'title',
        label: 'Reunión',
        sortable: true,
        filterable: true,
        filterType: 'text',
        accessor: (row) => row.title,
        width: '480px',
    },
    {
        key: 'type',
        label: 'Tipo',
        sortable: true,
        filterable: true,
        filterType: 'select',
        filterOptions: mockMeetingTypes.map((t) => ({ value: t.id, label: t.label })),
        accessor: (row) => row.typeId,
        width: '180px',
    },
    {
        key: 'sector',
        label: 'Sector',
        sortable: true,
        filterable: true,
        filterType: 'select',
        filterOptions: mockSectors.map((s) => ({ value: s.id, label: s.name })),
        accessor: (row) => row.sectorId,
        width: '180px',
    },
    {
        key: 'supervisor',
        label: 'Supervisor',
        sortable: true,
        filterable: true,
        filterType: 'text',
        accessor: (row) => supervisorOf(row.supervisorId)?.name ?? '',
        width: '120px',
    },
    {
        key: 'status',
        label: 'Estado',
        sortable: true,
        filterable: true,
        filterType: 'select',
        filterOptions: statusOptions.map((s) => ({ value: s.value, label: s.label })),
        accessor: (row) => row.status,
        width: '140px',
    },
    {
        key: 'actions',
        label: '',
        width: '72px',
        align: 'right',
    },
]

const toast = useAppToast()

function openEdit(m: MockMeeting) {
    navigateTo(`/catalogos/reuniones/${m.id}/editar`)
}

const deleteTargetId = ref<string | null>(null)
const deleteDialogOpen = ref(false)

function askDelete(m: MockMeeting) {
    deleteTargetId.value = m.id
    deleteDialogOpen.value = true
}

function confirmDelete() {
    if (!deleteTargetId.value) return
    meetings.value = meetings.value.filter((m) => m.id !== deleteTargetId.value)
    persist()
    toast.success('Reunión eliminada')
    deleteDialogOpen.value = false
    deleteTargetId.value = null
}

function duplicateMeeting(m: MockMeeting) {
    meetings.value.unshift({
        ...m,
        id: crypto.randomUUID(),
        title: `${m.title} (copia)`,
        status: 'programada',
        createdAt: new Date().toISOString(),
    })
    persist()
    toast.success('Reunión duplicada')
}

function changeStatus(m: MockMeeting, next: MeetingStatus) {
    const idx = meetings.value.findIndex((x) => x.id === m.id)
    if (idx !== -1) {
        meetings.value[idx] = { ...meetings.value[idx]!, status: next }
        persist()
        toast.success(`Estado: ${getMeetingStatusLabel(next)}`)
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
                    Catálogos · Mantenimiento
                </p>
                <h1 class="mt-4 font-display text-4xl font-semibold text-on-surface md:text-5xl">
                    Reuniones
                </h1>
                <p class="mt-3 max-w-xl text-sm leading-relaxed text-on-surface-variant">
                    Administra los encuentros ministeriales: programa, asigna sectores y
                    supervisores, y mantén la trazabilidad de cada reunión recurrente o única.
                </p>
            </div>

            <NuxtLink
                to="/catalogos/reuniones/nueva"
                class="inline-flex h-11 items-center rounded bg-primary px-5 text-xs font-semibold uppercase tracking-wider text-primary-foreground transition-colors hover:bg-primary/90"
            >
                <Plus class="mr-2 size-4" />
                Nueva reunión
            </NuxtLink>
        </section>

        <section class="mt-10 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <UiCard class="p-6">
                <CalendarDays class="mb-4 size-6 text-primary" />
                <p
                    class="text-[11px] font-semibold uppercase tracking-wider text-on-surface-variant"
                >
                    Total registradas
                </p>
                <h3 class="mt-1 font-display text-3xl font-semibold text-on-surface">
                    {{ stats.total }}
                </h3>
                <p class="mt-2 text-xs text-on-surface-variant">Catálogo histórico completo</p>
            </UiCard>
            <UiCard class="p-6">
                <Clock class="mb-4 size-6 text-primary" />
                <p
                    class="text-[11px] font-semibold uppercase tracking-wider text-on-surface-variant"
                >
                    Próximas
                </p>
                <h3 class="mt-1 font-display text-3xl font-semibold text-on-surface">
                    {{ stats.upcoming }}
                </h3>
                <p class="mt-2 text-xs text-primary">Programadas a futuro</p>
            </UiCard>
            <UiCard class="p-6">
                <Compass class="mb-4 size-6 text-primary" />
                <p
                    class="text-[11px] font-semibold uppercase tracking-wider text-on-surface-variant"
                >
                    Esta semana
                </p>
                <h3 class="mt-1 font-display text-3xl font-semibold text-on-surface">
                    {{ stats.thisWeek }}
                </h3>
                <p class="mt-2 text-xs text-on-surface-variant">Dentro de los próximos 7 días</p>
            </UiCard>
            <UiCard class="p-6">
                <CheckCircle2 class="mb-4 size-6 text-primary" />
                <p
                    class="text-[11px] font-semibold uppercase tracking-wider text-on-surface-variant"
                >
                    Completadas
                </p>
                <h3 class="mt-1 font-display text-3xl font-semibold text-on-surface">
                    {{ stats.completed }}
                </h3>
                <p class="mt-2 text-xs text-on-surface-variant">Cerradas con éxito</p>
            </UiCard>
        </section>

        <section class="mt-10">
            <DataTable
                :rows="meetings"
                :columns="columns"
                row-key="id"
                :page-size="10"
                empty-title="Sin reuniones"
                empty-message="No hay reuniones que coincidan con los filtros aplicados."
            >
                <template #cell-date="{ row }">
                    <div class="flex items-center gap-3">
                        <div
                            class="flex size-12 flex-col items-center justify-center rounded text-on-surface"
                            :style="{
                                backgroundColor: (row as MockMeeting).color + '22',
                                border: `1px solid ${(row as MockMeeting).color}55`,
                            }"
                        >
                            <span
                                class="font-display text-base font-semibold leading-none"
                                :style="{ color: (row as MockMeeting).color }"
                            >
                                {{ getMeetingDateDay((row as MockMeeting).date) }}
                            </span>
                            <span
                                class="text-[9px] font-semibold uppercase tracking-wider text-on-surface-variant"
                            >
                                {{ formatMeetingMonth((row as MockMeeting).date) }}
                            </span>
                        </div>
                        <div>
                            <p class="text-xs font-semibold uppercase text-on-surface-variant">
                                {{ formatMeetingDate((row as MockMeeting).date) }}
                            </p>
                            <p class="text-[11px] text-on-surface-variant">
                                {{
                                    formatMeetingTimeRange(
                                        (row as MockMeeting).startTime,
                                        (row as MockMeeting).endTime,
                                    )
                                }}
                            </p>
                        </div>
                    </div>
                </template>

                <template #cell-title="{ row }">
                    <div class="min-w-0">
                        <p class="font-display text-sm font-semibold text-on-surface">
                            {{ (row as MockMeeting).title }}
                        </p>
                        <p
                            v-if="(row as MockMeeting).description"
                            class="mt-0.5 line-clamp-1 text-xs text-on-surface-variant"
                        >
                            {{ (row as MockMeeting).description }}
                        </p>
                        <div
                            class="mt-1 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[11px] text-on-surface-variant"
                        >
                            <span
                                v-if="(row as MockMeeting).location"
                                class="inline-flex items-center gap-1"
                            >
                                <MapPin class="size-3" />
                                {{ (row as MockMeeting).location }}
                            </span>
                            <span class="inline-flex items-center gap-1">
                                <Users class="size-3" />
                                {{ (row as MockMeeting).expectedAttendees }} esperados
                            </span>
                            <span
                                >·
                                {{ getMeetingFrequencyLabel((row as MockMeeting).frequency) }}</span
                            >
                            <span
                                v-if="(row as MockMeeting).isPublic"
                                class="inline-flex items-center gap-1"
                            >
                                <Eye class="size-3" /> Pública
                            </span>
                            <span v-else class="inline-flex items-center gap-1">
                                <EyeOff class="size-3" /> Interna
                            </span>
                        </div>
                    </div>
                </template>

                <template #cell-type="{ row }">
                    <span
                        class="inline-flex rounded border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider"
                        :style="{
                            color: typeOf((row as MockMeeting).typeId)?.accent,
                            borderColor: (typeOf((row as MockMeeting).typeId)?.accent ?? '') + '55',
                        }"
                    >
                        {{ typeOf((row as MockMeeting).typeId)?.label }}
                    </span>
                </template>

                <template #cell-sector="{ row }">
                    <div class="flex items-center gap-2">
                        <span
                            class="flex size-7 items-center justify-center rounded-full bg-primary/10 text-[11px] font-semibold text-primary"
                        >
                            {{ sectorOf((row as MockMeeting).sectorId)?.code }}
                        </span>
                        <span class="text-sm text-on-surface">{{
                            sectorOf((row as MockMeeting).sectorId)?.name
                        }}</span>
                    </div>
                </template>

                <template #cell-supervisor="{ row }">
                    <div class="flex items-center gap-3">
                        <div
                            class="flex size-9 items-center justify-center rounded-full border border-outline-variant bg-surface-container-high text-xs font-semibold text-on-surface"
                        >
                            {{
                                formatInitials(
                                    supervisorOf((row as MockMeeting).supervisorId)?.name,
                                )
                            }}
                        </div>
                        <div class="min-w-0">
                            <p class="truncate text-sm font-medium text-on-surface">
                                {{ supervisorOf((row as MockMeeting).supervisorId)?.name }}
                            </p>
                            <p class="truncate text-[11px] text-on-surface-variant">
                                {{ supervisorOf((row as MockMeeting).supervisorId)?.role }}
                            </p>
                        </div>
                    </div>
                </template>

                <template #cell-status="{ row }">
                    <span
                        class="inline-flex items-center rounded border px-2 py-1 text-[10px] font-semibold uppercase tracking-wider"
                        :class="statusTone((row as MockMeeting).status)"
                    >
                        {{ getMeetingStatusLabel((row as MockMeeting).status) }}
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
                                class="z-50 w-56 overflow-hidden border border-outline-variant bg-surface-container py-1 shadow-lg focus:outline-none"
                            >
                                <DropdownMenuItem
                                    class="flex cursor-pointer items-center gap-3 px-4 py-2.5 text-xs font-semibold uppercase tracking-wider text-on-surface-variant outline-none data-[highlighted]:bg-surface-container-high data-[highlighted]:text-primary"
                                    @select="openEdit(row as MockMeeting)"
                                >
                                    <Pencil class="size-3.5" /> Editar
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                    class="flex cursor-pointer items-center gap-3 px-4 py-2.5 text-xs font-semibold uppercase tracking-wider text-on-surface-variant outline-none data-[highlighted]:bg-surface-container-high data-[highlighted]:text-primary"
                                    @select="duplicateMeeting(row as MockMeeting)"
                                >
                                    <Plus class="size-3.5" /> Duplicar
                                </DropdownMenuItem>
                                <div class="my-1 h-px bg-outline-variant" />
                                <DropdownMenuItem
                                    v-for="s in statusOptions.filter(
                                        (o) => o.value !== (row as MockMeeting).status,
                                    )"
                                    :key="s.value"
                                    class="flex cursor-pointer items-center gap-3 px-4 py-2 text-[11px] text-on-surface-variant outline-none data-[highlighted]:bg-surface-container-high data-[highlighted]:text-primary"
                                    @select="changeStatus(row as MockMeeting, s.value)"
                                >
                                    Marcar como {{ s.label.toLowerCase() }}
                                </DropdownMenuItem>
                                <div class="my-1 h-px bg-outline-variant" />
                                <DropdownMenuItem
                                    class="flex cursor-pointer items-center gap-3 px-4 py-2.5 text-xs font-semibold uppercase tracking-wider text-destructive outline-none data-[highlighted]:bg-destructive/10"
                                    @select="askDelete(row as MockMeeting)"
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
                                Eliminar reunión
                            </DialogTitle>
                            <DialogDescription class="mt-2 text-sm text-on-surface-variant">
                                Esta acción no se puede deshacer. La reunión será removida del
                                catálogo de forma permanente.
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
