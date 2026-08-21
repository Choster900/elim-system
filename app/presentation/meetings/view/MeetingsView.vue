<script setup lang="ts">
import {
    AlertTriangle,
    CalendarDays,
    CheckCircle2,
    Clock,
    Compass,
    Download,
    Eye,
    EyeOff,
    FileDown,
    FileSpreadsheet,
    MapPin,
    MoreVertical,
    Pencil,
    Plus,
    Trash2,
    Upload,
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
import { useAuthStore } from '~/presentation/auth/stores/auth.store'
import { useAppToast } from '~/presentation/shared/composables/useAppToast'
import {
    useMeetingLeadersQuery,
    useMeetingMembersQuery,
    useMeetingSectorsQuery,
    useMeetingTypesQuery,
} from '~/presentation/meetings/composables/useMeetingCatalogQueries'
import {
    useCreateMeetingMutation,
    useDeleteMeetingMutation,
    useImportMeetingsMutation,
    useUpdateMeetingMutation,
} from '~/presentation/meetings/composables/useMeetingMutations'
import { useMeetingsQuery } from '~/presentation/meetings/composables/useMeetingsQuery'
import { activeOptions } from '~/presentation/meetings/constants/meeting.constants'
import {
    formatMeetingDate,
    formatMeetingMonth,
    formatMeetingTimeRange,
    getMeetingDateDay,
    getMeetingFrequencyLabel,
} from '~/presentation/meetings/utils/meeting-format.util'
import type {
    MeetingInput,
    MeetingRecord,
} from '~/presentation/meetings/interfaces/meeting.interface'
import {
    downloadMeetingImportFailures,
    downloadMeetingsTemplate,
    parseMeetingsWorkbook,
    type MeetingImportCatalogs,
    type MeetingImportFailure,
    type MeetingImportPreview,
    type MeetingImportResult,
} from '~/presentation/meetings/services/meeting-excel.service'
import { formatInitials } from '~/utils/string/text-format.util'
import { resolveHttpErrorMessage } from '~/utils/http/resolve-http-error-message.util'

defineOptions({ name: 'MeetingsView' })

useHead({
    title: 'Reuniones · Sistema',
})

const toast = useAppToast()
const authStore = useAuthStore()
const canManage = computed(() => authStore.hasPermission('meetings.manage'))
const meetingsQuery = useMeetingsQuery()
const meetingTypesQuery = useMeetingTypesQuery()
const sectorsQuery = useMeetingSectorsQuery()
const membersQuery = useMeetingMembersQuery(canManage)
const leadersQuery = useMeetingLeadersQuery(canManage)
const createMeetingMutation = useCreateMeetingMutation()
const updateMeetingMutation = useUpdateMeetingMutation()
const deleteMeetingMutation = useDeleteMeetingMutation()
const importMeetingsMutation = useImportMeetingsMutation()

const meetings = computed(() => meetingsQuery.data.value ?? [])
const meetingTypes = computed(() => meetingTypesQuery.data.value ?? [])
const sectors = computed(() => sectorsQuery.data.value ?? [])
const members = computed(() => membersQuery.data.value ?? [])
const leaders = computed(() => leadersQuery.data.value ?? [])
const importCatalogs = computed<MeetingImportCatalogs>(() => ({
    meetingTypes: meetingTypes.value,
    sectors: sectors.value,
    members: members.value,
    leaders: leaders.value,
}))
const importCatalogsLoading = computed(
    () =>
        meetingTypesQuery.isPending.value ||
        sectorsQuery.isPending.value ||
        membersQuery.isPending.value ||
        leadersQuery.isPending.value,
)
const isLoading = computed(
    () =>
        meetingsQuery.isPending.value ||
        meetingTypesQuery.isPending.value ||
        sectorsQuery.isPending.value,
)
const isMutating = computed(
    () =>
        createMeetingMutation.isPending.value ||
        updateMeetingMutation.isPending.value ||
        deleteMeetingMutation.isPending.value,
)

if (import.meta.server) {
    onServerPrefetch(() =>
        Promise.allSettled([
            meetingsQuery.suspense(),
            meetingTypesQuery.suspense(),
            sectorsQuery.suspense(),
        ]),
    )
}

if (import.meta.client) {
    watch(
        () => [
            meetingsQuery.error.value,
            meetingTypesQuery.error.value,
            sectorsQuery.error.value,
            membersQuery.error.value,
            leadersQuery.error.value,
        ],
        (errors) => {
            const error = errors.find(Boolean)
            if (error) {
                toast.error(resolveHttpErrorMessage(error, 'No fue posible cargar las reuniones'))
            }
        },
        { immediate: true },
    )
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
        (m) => m.isActive && new Date(m.date) >= new Date(new Date().toDateString()),
    ).length
    const thisWeek = meetings.value.filter((m) => m.isActive && isWithinNextDays(m.date, 7)).length
    const inactive = meetings.value.filter((m) => !m.isActive).length
    return { total, upcoming, thisWeek, inactive }
})

function activeTone(isActive: boolean) {
    return isActive
        ? 'border-primary/40 bg-primary/10 text-primary'
        : 'border-outline-variant bg-surface-container-high text-on-surface-variant'
}

const columns = computed<DataTableColumn<MeetingRecord>[]>(() => [
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
        key: 'code',
        label: 'Código',
        sortable: true,
        filterable: true,
        filterType: 'text',
        accessor: (row) => row.code,
        width: '220px',
    },
    {
        key: 'title',
        label: 'Reunión',
        sortable: true,
        filterable: true,
        filterType: 'text',
        accessor: (row) => row.title,
        width: '420px',
    },
    {
        key: 'type',
        label: 'Tipo',
        sortable: true,
        filterable: true,
        filterType: 'select',
        filterOptions: meetingTypes.value.map((t) => ({ value: t.id, label: t.name })),
        accessor: (row) => row.typeId,
        width: '180px',
    },
    {
        key: 'sector',
        label: 'Sector',
        sortable: true,
        filterable: true,
        filterType: 'select',
        filterOptions: sectors.value.map((s) => ({ value: s.id, label: s.name })),
        accessor: (row) => row.sectorId,
        width: '180px',
    },
    {
        key: 'supervisor',
        label: 'Supervisor',
        sortable: true,
        filterable: true,
        filterType: 'text',
        accessor: (row) => row.supervisorName ?? '',
        width: '120px',
    },
    {
        key: 'isActive',
        label: 'Estado',
        sortable: true,
        filterable: true,
        filterType: 'select',
        filterOptions: activeOptions.map((o) => ({ value: o.value, label: o.label })),
        accessor: (row) => row.isActive,
        width: '140px',
    },
    {
        key: 'actions',
        label: '',
        width: '72px',
        align: 'right',
    },
])

function openEdit(m: MeetingRecord) {
    navigateTo(`/catalogos/reuniones/${m.id}/editar`)
}

const deleteTargetId = ref<number | null>(null)
const deleteDialogOpen = ref(false)

function askDelete(m: MeetingRecord) {
    deleteTargetId.value = m.id
    deleteDialogOpen.value = true
}

async function confirmDelete() {
    if (!deleteTargetId.value) return
    try {
        await deleteMeetingMutation.mutateAsync(deleteTargetId.value)
        toast.success('Reunión eliminada')
    } catch (error) {
        toast.error(resolveHttpErrorMessage(error, 'No fue posible eliminar la reunión'))
    } finally {
        deleteDialogOpen.value = false
        deleteTargetId.value = null
    }
}

const downloadingTemplate = ref(false)
const parsingImportFile = ref(false)
const downloadingFailures = ref(false)
const importInput = ref<HTMLInputElement | null>(null)
const importOpen = ref(false)
const importFileName = ref('')
const importPreview = ref<MeetingImportPreview>({ rows: [], fileErrors: [] })
const importResult = ref<MeetingImportResult | null>(null)
const retryImportFailures = ref<MeetingImportFailure[]>([])
const validImportRows = computed(() => importPreview.value.rows.filter((row) => !row.issues.length))
const invalidImportRows = computed(() =>
    importPreview.value.rows.filter((row) => row.issues.length),
)
const importErrors = computed(() => {
    if (importResult.value) {
        return retryImportFailures.value.flatMap((failure) =>
            failure.reasons.map((reason) => `Fila ${failure.rowNumber}: ${reason}`),
        )
    }
    return [
        ...importPreview.value.fileErrors,
        ...invalidImportRows.value.flatMap((row) =>
            row.issues.map((issue) => `Fila ${row.rowNumber}: ${issue}`),
        ),
    ]
})

async function downloadTemplate() {
    downloadingTemplate.value = true
    try {
        await downloadMeetingsTemplate(importCatalogs.value)
        toast.success('Plantilla de reuniones descargada')
    } catch {
        toast.error('No fue posible generar la plantilla de reuniones')
    } finally {
        downloadingTemplate.value = false
    }
}

function pickImportFile() {
    importInput.value?.click()
}

async function onImportFile(event: Event) {
    const input = event.target as HTMLInputElement
    const file = input.files?.[0]
    input.value = ''
    if (!file) return

    parsingImportFile.value = true
    importFileName.value = file.name
    importResult.value = null
    retryImportFailures.value = []
    try {
        importPreview.value = await parseMeetingsWorkbook(
            file,
            importCatalogs.value,
            meetings.value,
        )
        importOpen.value = true
    } catch {
        toast.error('No pudimos leer el archivo. Verifica que sea un Excel .xlsx válido.')
    } finally {
        parsingImportFile.value = false
    }
}

function previewFailures(): MeetingImportFailure[] {
    return invalidImportRows.value.map((row) => ({
        rowNumber: row.rowNumber,
        reasons: row.issues,
    }))
}

async function downloadPendingMeetings() {
    const failures = retryImportFailures.value.length
        ? retryImportFailures.value
        : previewFailures()
    if (!failures.length) return

    downloadingFailures.value = true
    try {
        await downloadMeetingImportFailures(
            importPreview.value.rows,
            failures,
            importCatalogs.value,
        )
        toast.success('Archivo de reuniones pendientes descargado')
    } catch {
        toast.error('No fue posible generar el archivo de pendientes')
    } finally {
        downloadingFailures.value = false
    }
}

async function confirmMeetingImport() {
    if (!validImportRows.value.length) return

    try {
        const result = await importMeetingsMutation.mutateAsync(validImportRows.value)
        const failures = [...previewFailures(), ...result.failures].sort(
            (left, right) => left.rowNumber - right.rowNumber,
        )
        retryImportFailures.value = failures
        importResult.value = { ...result, failures }

        if (failures.length) {
            try {
                await downloadMeetingImportFailures(
                    importPreview.value.rows,
                    failures,
                    importCatalogs.value,
                )
                toast.warning(
                    `${result.created} reuniones creadas y ${failures.length} pendientes. Se descargó el archivo de corrección.`,
                )
            } catch {
                toast.warning(
                    `${result.created} reuniones creadas y ${failures.length} pendientes. Descarga el archivo de corrección desde este resumen.`,
                )
            }
        } else {
            toast.success(`Importación completa: ${result.created} reuniones creadas`)
            importOpen.value = false
        }
    } catch {
        toast.error('No fue posible iniciar la importación de reuniones')
    }
}

function toInput(m: MeetingRecord): MeetingInput {
    return {
        typeId: m.typeId,
        sectorId: m.sectorId,
        leaderId: m.leaderId,
        supervisorId: m.supervisorId,
        coSupervisorIds: [...m.coSupervisorIds],
        title: m.title,
        description: m.description,
        date: m.date,
        recurrenceEndDate: m.recurrenceEndDate,
        startTime: m.startTime,
        endTime: m.endTime,
        location: m.location,
        latitude: m.latitude,
        longitude: m.longitude,
        frequency: m.frequency,
        monthlyMode: m.monthlyMode,
        weekOrdinal: m.weekOrdinal,
        weekday: m.weekday,
        expectedAttendees: m.expectedAttendees,
        isActive: m.isActive,
        isPublic: m.isPublic,
        notes: m.notes,
        color: m.color,
    }
}

async function duplicateMeeting(m: MeetingRecord) {
    try {
        await createMeetingMutation.mutateAsync({
            ...toInput(m),
            title: `${m.title} (copia)`,
        })
        toast.success('Reunión duplicada')
    } catch (error) {
        toast.error(resolveHttpErrorMessage(error, 'No fue posible duplicar la reunión'))
    }
}

// Desactivar una reunión detiene la generación de fechas pendientes.
async function toggleActive(m: MeetingRecord) {
    try {
        await updateMeetingMutation.mutateAsync({ id: m.id, input: { isActive: !m.isActive } })
        toast.success(m.isActive ? 'Reunión desactivada' : 'Reunión activada')
    } catch (error) {
        toast.error(resolveHttpErrorMessage(error, 'No fue posible cambiar el estado'))
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

            <div class="flex flex-wrap items-center gap-2">
                <input
                    v-if="canManage"
                    ref="importInput"
                    type="file"
                    accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                    class="hidden"
                    @change="onImportFile"
                />
                <UiButton
                    v-if="canManage"
                    variant="outline"
                    type="button"
                    :loading="downloadingTemplate"
                    :disabled="importCatalogsLoading"
                    @click="downloadTemplate"
                >
                    <FileDown class="size-4" />
                    Plantilla
                </UiButton>
                <UiButton
                    v-if="canManage"
                    variant="outline"
                    type="button"
                    :loading="parsingImportFile"
                    :disabled="importCatalogsLoading"
                    @click="pickImportFile"
                >
                    <Upload class="size-4" />
                    Importar
                </UiButton>
                <NuxtLink
                    to="/catalogos/reuniones/nueva"
                    class="inline-flex h-11 items-center rounded bg-primary px-5 text-xs font-semibold uppercase tracking-wider text-primary-foreground transition-colors hover:bg-primary/90"
                >
                    <Plus class="mr-2 size-4" />
                    Nueva reunión
                </NuxtLink>
            </div>
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
                    Inactivas
                </p>
                <h3 class="mt-1 font-display text-3xl font-semibold text-on-surface">
                    {{ stats.inactive }}
                </h3>
                <p class="mt-2 text-xs text-on-surface-variant">Ya no generan pendientes</p>
            </UiCard>
        </section>

        <section class="mt-10">
            <DataTable
                :rows="meetings"
                :columns="columns"
                row-key="id"
                :page-size="10"
                :loading="isLoading"
                empty-title="Sin reuniones"
                empty-message="No hay reuniones que coincidan con los filtros aplicados."
            >
                <template #cell-date="{ row }">
                    <div class="flex items-center gap-3">
                        <div
                            class="flex size-12 flex-col items-center justify-center rounded text-on-surface"
                            :style="{
                                backgroundColor: (row as MeetingRecord).color + '22',
                                border: `1px solid ${(row as MeetingRecord).color}55`,
                            }"
                        >
                            <span
                                class="font-display text-base font-semibold leading-none"
                                :style="{ color: (row as MeetingRecord).color }"
                            >
                                {{ getMeetingDateDay((row as MeetingRecord).date) }}
                            </span>
                            <span
                                class="text-[9px] font-semibold uppercase tracking-wider text-on-surface-variant"
                            >
                                {{ formatMeetingMonth((row as MeetingRecord).date) }}
                            </span>
                        </div>
                        <div>
                            <p class="text-xs font-semibold uppercase text-on-surface-variant">
                                {{ formatMeetingDate((row as MeetingRecord).date) }}
                            </p>
                            <p class="text-[11px] text-on-surface-variant">
                                {{
                                    formatMeetingTimeRange(
                                        (row as MeetingRecord).startTime,
                                        (row as MeetingRecord).endTime,
                                    )
                                }}
                            </p>
                        </div>
                    </div>
                </template>

                <template #cell-code="{ row }">
                    <span class="font-mono text-xs tabular-nums text-on-surface-variant">
                        {{ (row as MeetingRecord).code }}
                    </span>
                </template>

                <template #cell-title="{ row }">
                    <div class="min-w-0">
                        <p class="font-display text-sm font-semibold text-on-surface">
                            {{ (row as MeetingRecord).title }}
                        </p>
                        <p
                            v-if="(row as MeetingRecord).description"
                            class="mt-0.5 line-clamp-1 text-xs text-on-surface-variant"
                        >
                            {{ (row as MeetingRecord).description }}
                        </p>
                        <div
                            class="mt-1 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[11px] text-on-surface-variant"
                        >
                            <span
                                v-if="(row as MeetingRecord).location"
                                class="inline-flex items-center gap-1"
                            >
                                <MapPin class="size-3" />
                                {{ (row as MeetingRecord).location }}
                            </span>
                            <span class="inline-flex items-center gap-1">
                                <Users class="size-3" />
                                {{ (row as MeetingRecord).expectedAttendees }} esperados
                            </span>
                            <span
                                >·
                                {{
                                    getMeetingFrequencyLabel((row as MeetingRecord).frequency)
                                }}</span
                            >
                            <span
                                v-if="(row as MeetingRecord).isPublic"
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
                            color: (row as MeetingRecord).typeColor ?? undefined,
                            borderColor: ((row as MeetingRecord).typeColor ?? '') + '55',
                        }"
                    >
                        {{ (row as MeetingRecord).typeName }}
                    </span>
                </template>

                <template #cell-sector="{ row }">
                    <div class="flex items-center gap-2">
                        <span
                            class="flex size-7 items-center justify-center rounded-full bg-primary/10 text-[11px] font-semibold text-primary"
                        >
                            {{ formatInitials((row as MeetingRecord).sectorName) }}
                        </span>
                        <span class="text-sm text-on-surface">{{
                            (row as MeetingRecord).sectorName
                        }}</span>
                    </div>
                </template>

                <template #cell-supervisor="{ row }">
                    <div class="flex items-center gap-3">
                        <div
                            class="flex size-9 items-center justify-center rounded-full border border-outline-variant bg-surface-container-high text-xs font-semibold text-on-surface"
                        >
                            {{ formatInitials((row as MeetingRecord).supervisorName) }}
                        </div>
                        <div class="min-w-0">
                            <p class="truncate text-sm font-medium text-on-surface">
                                {{ (row as MeetingRecord).supervisorName }}
                            </p>
                        </div>
                    </div>
                </template>

                <template #cell-isActive="{ row }">
                    <span
                        class="inline-flex items-center rounded border px-2 py-1 text-[10px] font-semibold uppercase tracking-wider"
                        :class="activeTone((row as MeetingRecord).isActive)"
                    >
                        {{ (row as MeetingRecord).isActive ? 'Activa' : 'Inactiva' }}
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
                                    @select="openEdit(row as MeetingRecord)"
                                >
                                    <Pencil class="size-3.5" /> Editar
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                    class="flex cursor-pointer items-center gap-3 px-4 py-2.5 text-xs font-semibold uppercase tracking-wider text-on-surface-variant outline-none data-[highlighted]:bg-surface-container-high data-[highlighted]:text-primary"
                                    :disabled="isMutating"
                                    @select="duplicateMeeting(row as MeetingRecord)"
                                >
                                    <Plus class="size-3.5" /> Duplicar
                                </DropdownMenuItem>
                                <div class="my-1 h-px bg-outline-variant" />
                                <DropdownMenuItem
                                    class="flex cursor-pointer items-center gap-3 px-4 py-2 text-[11px] text-on-surface-variant outline-none data-[highlighted]:bg-surface-container-high data-[highlighted]:text-primary"
                                    :disabled="isMutating"
                                    @select="toggleActive(row as MeetingRecord)"
                                >
                                    {{
                                        (row as MeetingRecord).isActive
                                            ? 'Desactivar reunión'
                                            : 'Activar reunión'
                                    }}
                                </DropdownMenuItem>
                                <div class="my-1 h-px bg-outline-variant" />
                                <DropdownMenuItem
                                    class="flex cursor-pointer items-center gap-3 px-4 py-2.5 text-xs font-semibold uppercase tracking-wider text-destructive outline-none data-[highlighted]:bg-destructive/10"
                                    @select="askDelete(row as MeetingRecord)"
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
                            :loading="deleteMeetingMutation.isPending.value"
                            :disabled="deleteMeetingMutation.isPending.value"
                            @click="confirmDelete"
                        >
                            <Trash2 class="mr-2 size-4" />
                            Eliminar
                        </UiButton>
                    </div>
                </DialogContent>
            </DialogPortal>
        </DialogRoot>

        <DialogRoot v-model:open="importOpen">
            <DialogPortal>
                <DialogOverlay class="fixed inset-0 z-[70] bg-black/60 backdrop-blur-sm" />
                <DialogContent
                    class="fixed left-1/2 top-1/2 z-[71] max-h-[88vh] w-[96vw] max-w-3xl -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-2xl border border-outline-variant bg-surface p-6 shadow-2xl focus:outline-none sm:p-7"
                >
                    <div class="flex items-start gap-4">
                        <div
                            class="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary"
                        >
                            <FileSpreadsheet class="size-6" />
                        </div>
                        <div class="min-w-0">
                            <DialogTitle class="font-display text-xl font-semibold text-on-surface">
                                Importar reuniones desde Excel
                            </DialogTitle>
                            <DialogDescription
                                class="mt-1 truncate text-sm text-on-surface-variant"
                            >
                                {{ importFileName }}
                            </DialogDescription>
                        </div>
                    </div>

                    <div v-if="importResult" class="mt-6 grid gap-3 sm:grid-cols-2">
                        <div class="rounded-xl border border-emerald-500/30 bg-emerald-500/5 p-4">
                            <p
                                class="text-[10px] font-semibold uppercase tracking-wider text-on-surface-variant"
                            >
                                Creadas
                            </p>
                            <p class="mt-1 font-display text-2xl font-semibold text-emerald-600">
                                {{ importResult.created }}
                            </p>
                        </div>
                        <div
                            class="rounded-xl border p-4"
                            :class="
                                retryImportFailures.length
                                    ? 'border-destructive/35 bg-destructive/5'
                                    : 'border-outline-variant bg-surface-container'
                            "
                        >
                            <p
                                class="text-[10px] font-semibold uppercase tracking-wider text-on-surface-variant"
                            >
                                Pendientes
                            </p>
                            <p
                                class="mt-1 font-display text-2xl font-semibold"
                                :class="
                                    retryImportFailures.length
                                        ? 'text-destructive'
                                        : 'text-on-surface'
                                "
                            >
                                {{ retryImportFailures.length }}
                            </p>
                        </div>
                    </div>

                    <div v-else class="mt-6 grid gap-3 sm:grid-cols-2">
                        <div class="rounded-xl border border-primary/25 bg-primary/5 p-4">
                            <p
                                class="text-[10px] font-semibold uppercase tracking-wider text-on-surface-variant"
                            >
                                Reuniones válidas
                            </p>
                            <p class="mt-1 font-display text-2xl font-semibold text-primary">
                                {{ validImportRows.length }}
                            </p>
                        </div>
                        <div
                            class="rounded-xl border p-4"
                            :class="
                                importErrors.length
                                    ? 'border-destructive/35 bg-destructive/5'
                                    : 'border-outline-variant bg-surface-container'
                            "
                        >
                            <p
                                class="text-[10px] font-semibold uppercase tracking-wider text-on-surface-variant"
                            >
                                Filas con errores
                            </p>
                            <p
                                class="mt-1 font-display text-2xl font-semibold"
                                :class="
                                    importErrors.length ? 'text-destructive' : 'text-on-surface'
                                "
                            >
                                {{ invalidImportRows.length }}
                            </p>
                        </div>
                    </div>

                    <div
                        v-if="importErrors.length"
                        class="mt-4 rounded-xl border border-destructive/30 bg-destructive/5 p-4"
                    >
                        <p class="text-xs font-semibold text-destructive">
                            {{
                                importResult
                                    ? 'Reuniones que continúan pendientes:'
                                    : 'Corrige estas filas o importa únicamente las válidas:'
                            }}
                        </p>
                        <ul
                            class="mt-2 max-h-52 list-disc space-y-1 overflow-y-auto pl-5 text-xs leading-5 text-on-surface-variant"
                        >
                            <li v-for="error in importErrors" :key="error">
                                {{ error }}
                            </li>
                        </ul>
                    </div>

                    <p
                        v-else-if="!importResult"
                        class="mt-4 rounded-xl border border-primary/25 bg-primary/5 p-4 text-xs leading-relaxed text-on-surface-variant"
                    >
                        El supervisor se tomará del sector y cada reunión conservará las mismas
                        reglas de tipo, líder, horario y recurrencia que la creación manual.
                    </p>
                    <p
                        v-if="!importResult && invalidImportRows.length && validImportRows.length"
                        class="mt-4 rounded-xl border border-amber-500/30 bg-amber-500/5 p-4 text-xs leading-relaxed text-on-surface-variant"
                    >
                        Se crearán las {{ validImportRows.length }} reuniones válidas. Las
                        {{ invalidImportRows.length }} filas con problemas quedarán en un nuevo
                        Excel con el motivo para corregirlas y volver a importarlas.
                    </p>
                    <p
                        v-if="importResult && retryImportFailures.length"
                        class="mt-4 rounded-xl border border-primary/25 bg-primary/5 p-4 text-xs leading-relaxed text-on-surface-variant"
                    >
                        Las {{ importResult.created }} reuniones creadas ya no aparecen en el Excel
                        de pendientes.
                    </p>

                    <div class="mt-6 flex flex-wrap justify-end gap-2">
                        <DialogClose as-child>
                            <UiButton variant="outline" type="button">
                                {{ importResult ? 'Cerrar' : 'Cancelar' }}
                            </UiButton>
                        </DialogClose>
                        <UiButton
                            v-if="
                                (importResult && retryImportFailures.length) ||
                                (!importResult &&
                                    !validImportRows.length &&
                                    invalidImportRows.length)
                            "
                            variant="outline"
                            type="button"
                            :loading="downloadingFailures"
                            @click="downloadPendingMeetings"
                        >
                            <Download class="size-4" />
                            Descargar pendientes
                        </UiButton>
                        <UiButton
                            v-if="!importResult"
                            type="button"
                            :loading="importMeetingsMutation.isPending.value"
                            :disabled="!validImportRows.length || !!importPreview.fileErrors.length"
                            @click="confirmMeetingImport"
                        >
                            <Upload class="size-4" />
                            Importar {{ validImportRows.length }} reunión(es)
                        </UiButton>
                    </div>
                </DialogContent>
            </DialogPortal>
        </DialogRoot>
    </main>
</template>
