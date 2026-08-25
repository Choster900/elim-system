<script setup lang="ts">
import {
    AlertTriangle,
    Cake,
    Download,
    Eye,
    FileDown,
    FileSpreadsheet,
    Mail,
    MoreVertical,
    Pencil,
    Phone,
    Plus,
    ShieldCheck,
    Trash2,
    Upload,
    UserCheck,
    UserRound,
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
import { formatShortIsoDate } from '~/utils/date/date-format.util'
import { resolveHttpErrorMessage } from '~/utils/http/resolve-http-error-message.util'
import { formatInitials } from '~/utils/string/text-format.util'
import MemberDetailsDrawer from '../components/MemberDetailsDrawer.vue'
import MemberFormDrawer from '../components/MemberFormDrawer.vue'
import {
    useDeleteMemberMutation,
    useImportMembersMutation,
    useUpdateMemberMutation,
} from '../composables/useMemberMutations'
import { useMemberCatalogsQuery } from '../composables/useMemberCatalogsQuery'
import { useMembersQuery } from '../composables/useMembersQuery'
import { memberRoleOptions, memberStatusOptions } from '../constants/member.constants'
import type {
    Member,
    MemberImportResult,
    MemberInput,
    MemberStatus,
} from '../interfaces/member.interface'
import {
    downloadMemberImportFailures,
    downloadMembersTemplate,
    exportMembersWorkbook,
    parseMembersWorkbook,
    type MemberImportPreview,
    type MemberRetryFailure,
} from '../services/member-excel.service'
import {
    getMemberAge,
    getMemberFullName,
    getMemberRoleLabel,
    getMemberStatusLabel,
} from '../utils/member-format.util'

defineOptions({ name: 'MembersView' })

useHead({ title: 'Miembros · Sistema' })

const toast = useAppToast()
const authStore = useAuthStore()
const membersQuery = useMembersQuery()
const catalogsQuery = useMemberCatalogsQuery()
const updateMemberMutation = useUpdateMemberMutation()
const deleteMemberMutation = useDeleteMemberMutation()
const importMembersMutation = useImportMembersMutation()

const members = computed(() => membersQuery.data.value ?? [])
const sortedMembers = computed(() =>
    members.value
        .slice()
        .sort(
            (left, right) =>
                new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime(),
        ),
)
const memberCatalogs = computed(() => catalogsQuery.data.value ?? null)
const sectorFilterOptions = computed(() =>
    (memberCatalogs.value?.sectors ?? []).map((sector) => ({
        value: sector.value,
        label: sector.label,
    })),
)
const loading = computed(() => membersQuery.isPending.value)
const saving = computed(() => updateMemberMutation.isPending.value)
const canCreate = computed(() => authStore.hasPermission('members.create'))
const canImportExport = computed(() => authStore.hasPermission('members.import_export'))

if (import.meta.server) {
    onServerPrefetch(() =>
        Promise.allSettled([membersQuery.suspense(), catalogsQuery.suspense()]).then(
            () => undefined,
        ),
    )
}

if (import.meta.client) {
    watch(
        () => membersQuery.error.value,
        (error) => {
            if (error) toast.error('No fue posible cargar el directorio de miembros')
        },
        { immediate: true },
    )
}

const stats = computed(() => {
    const now = new Date()
    const ninetyDaysAgo = new Date(now)
    ninetyDaysAgo.setDate(now.getDate() - 90)
    return {
        total: members.value.length,
        active: members.value.filter((member) => member.status === 'ACTIVE').length,
        leaders: members.value.filter((member) => member.roles.some((role) => role !== 'MEMBER'))
            .length,
        newMembers: members.value.filter(
            (member) => member.joinedAt && new Date(member.joinedAt) >= ninetyDaysAgo,
        ).length,
        birthdays: members.value.filter((member) => {
            if (!member.birthDate) return false
            return (
                new Date(`${member.birthDate.slice(0, 10)}T00:00:00`).getMonth() === now.getMonth()
            )
        }).length,
    }
})

const columns = computed<DataTableColumn<Member>[]>(() => [
    {
        key: 'member',
        label: 'Miembro',
        sortable: true,
        filterable: true,
        filterType: 'text',
        accessor: (row) => `${row.code} ${getMemberFullName(row)} ${row.documentNumber ?? ''}`,
        width: '360px',
    },
    {
        key: 'documentNumber',
        label: 'DUI',
        sortable: true,
        filterable: true,
        filterType: 'text',
        accessor: (row) => row.documentNumber ?? '',
        width: '150px',
    },
    {
        key: 'contact',
        label: 'Contacto',
        filterable: true,
        filterType: 'text',
        accessor: (row) => `${row.phone ?? ''} ${row.email ?? ''}`,
        width: '250px',
    },
    {
        key: 'roles',
        label: 'Roles',
        sortable: true,
        filterable: true,
        filterType: 'select',
        filterOptions: memberRoleOptions,
        accessor: (row) => (row.roles ?? []).join(', '),
        width: '240px',
    },
    {
        key: 'territory',
        label: 'Territorio / grupo',
        filterable: true,
        filterType: 'text',
        accessor: (row) =>
            [row.district, row.zone, row.sector, row.smallGroup].filter(Boolean).join(' '),
        width: '340px',
    },
    {
        key: 'sector',
        label: 'Sector',
        sortable: true,
        filterable: true,
        filterType: 'select',
        filterOptions: sectorFilterOptions.value,
        accessor: (row) => row.sectorCode ?? '',
        width: '180px',
    },
    {
        key: 'status',
        label: 'Estado',
        sortable: true,
        filterable: true,
        filterType: 'select',
        filterOptions: memberStatusOptions,
        accessor: (row) => row.status,
        width: '140px',
    },
    {
        key: 'createdAt',
        label: 'Creado',
        sortable: true,
        filterable: true,
        filterType: 'daterange',
        accessor: (row) => row.createdAt.slice(0, 10),
        width: '170px',
    },
    { key: 'actions', label: '', width: '72px', align: 'right' },
])

function statusTone(status: MemberStatus) {
    switch (status) {
        case 'ACTIVE':
            return 'border-emerald-500/40 bg-emerald-500/10 text-emerald-500'
        case 'VISITOR':
            return 'border-primary/40 bg-primary/10 text-primary'
        case 'INACTIVE':
            return 'border-outline-variant bg-surface-container-high text-on-surface-variant'
        case 'TRANSFERRED':
            return 'border-amber-500/40 bg-amber-500/10 text-amber-500'
        case 'DECEASED':
            return 'border-slate-500/40 bg-slate-500/10 text-slate-400'
    }
}

const formOpen = ref(false)
const editingMember = ref<Member | null>(null)

function openEdit(member: Member) {
    detailsOpen.value = false
    editingMember.value = member
    formOpen.value = true
}

async function saveMember(payload: MemberInput) {
    if (!editingMember.value) return
    try {
        await updateMemberMutation.mutateAsync({ id: editingMember.value.id, input: payload })
        toast.success('Miembro actualizado correctamente')
        formOpen.value = false
    } catch (error) {
        toast.error(resolveHttpErrorMessage(error, 'No fue posible guardar el miembro.'))
    }
}

const detailsOpen = ref(false)
const selectedMember = ref<Member | null>(null)

function openDetails(member: Member) {
    selectedMember.value = member
    detailsOpen.value = true
}

const deleteOpen = ref(false)
const deleteTarget = ref<Member | null>(null)

function askDelete(member: Member) {
    deleteTarget.value = member
    deleteOpen.value = true
}

async function confirmDelete() {
    if (!deleteTarget.value) return
    try {
        await deleteMemberMutation.mutateAsync(deleteTarget.value.id)
        toast.success('Miembro eliminado del directorio')
        deleteOpen.value = false
        deleteTarget.value = null
    } catch {
        toast.error('No fue posible eliminar el miembro')
    }
}

async function changeStatus(member: Member, status: MemberStatus) {
    try {
        await updateMemberMutation.mutateAsync({ id: member.id, input: { status } })
        toast.success(`Estado actualizado a ${getMemberStatusLabel(status).toLowerCase()}`)
    } catch {
        toast.error('No fue posible cambiar el estado')
    }
}

const exporting = ref(false)
const downloadingTemplate = ref(false)

async function exportExcel() {
    if (!memberCatalogs.value) {
        toast.error('Los catálogos todavía no están disponibles')
        return
    }
    exporting.value = true
    try {
        await exportMembersWorkbook(members.value, memberCatalogs.value)
        toast.success('Directorio exportado a Excel')
    } catch {
        toast.error('No fue posible generar el archivo Excel')
    } finally {
        exporting.value = false
    }
}

async function downloadTemplate() {
    if (!memberCatalogs.value) {
        toast.error('Los catálogos todavía no están disponibles')
        return
    }
    downloadingTemplate.value = true
    try {
        await downloadMembersTemplate(memberCatalogs.value)
        toast.success('Plantilla de importación descargada')
    } catch {
        toast.error('No fue posible generar la plantilla')
    } finally {
        downloadingTemplate.value = false
    }
}

const importInput = ref<HTMLInputElement | null>(null)
const importOpen = ref(false)
const importing = computed(() => importMembersMutation.isPending.value)
const parsingFile = ref(false)
const importFileName = ref('')
const importPreview = ref<MemberImportPreview>({ rows: [], fileErrors: [] })
const importResult = ref<MemberImportResult | null>(null)
const retryFailures = ref<MemberRetryFailure[]>([])
const downloadingFailures = ref(false)
const validImportRows = computed(() =>
    importPreview.value.rows.filter((row) => row.issues.length === 0),
)
const invalidImportRows = computed(() =>
    importPreview.value.rows.filter((row) => row.issues.length > 0),
)
const previewErrors = computed(() => {
    if (importResult.value) {
        return retryFailures.value.flatMap((failure) =>
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

function pickImportFile() {
    importInput.value?.click()
}

async function onImportFile(event: Event) {
    const input = event.target as HTMLInputElement
    const file = input.files?.[0]
    input.value = ''
    if (!file) return
    if (!memberCatalogs.value) {
        toast.error('No fue posible cargar los catálogos para validar el archivo')
        return
    }

    parsingFile.value = true
    importFileName.value = file.name
    importResult.value = null
    retryFailures.value = []
    try {
        importPreview.value = await parseMembersWorkbook(file, memberCatalogs.value)
        importOpen.value = true
    } catch {
        toast.error('No pudimos leer el archivo. Verifica que sea un Excel .xlsx válido.')
    } finally {
        parsingFile.value = false
    }
}

async function confirmImport() {
    if (!validImportRows.value.length || !memberCatalogs.value) return
    try {
        const serverResult = await importMembersMutation.mutateAsync(
            validImportRows.value.map((row) => ({
                rowNumber: row.rowNumber,
                member: row.member,
            })),
        )
        const failures: MemberRetryFailure[] = [
            ...invalidImportRows.value.map((row) => ({
                rowNumber: row.rowNumber,
                reasons: row.issues,
            })),
            ...serverResult.failures,
        ].sort((left, right) => left.rowNumber - right.rowNumber)
        retryFailures.value = failures
        importResult.value = {
            ...serverResult,
            rejected: failures.length,
            total: importPreview.value.rows.length,
            failures,
        }

        if (failures.length) {
            await downloadMemberImportFailures(
                importPreview.value.rows,
                failures,
                memberCatalogs.value,
            )
            toast.warning(
                `${serverResult.created + serverResult.updated} miembros guardados y ${failures.length} pendientes. Se descargó el archivo de corrección.`,
            )
        } else {
            toast.success(
                `Importación completa: ${serverResult.created} creados y ${serverResult.updated} actualizados`,
            )
            importOpen.value = false
        }
    } catch {
        toast.error('No fue posible iniciar la importación. Ninguna fila adicional fue procesada.')
    }
}

async function downloadPendingMembers() {
    if (!memberCatalogs.value) return
    const failures = retryFailures.value.length
        ? retryFailures.value
        : invalidImportRows.value.map((row) => ({
              rowNumber: row.rowNumber,
              reasons: row.issues,
          }))
    if (!failures.length) return

    downloadingFailures.value = true
    try {
        await downloadMemberImportFailures(importPreview.value.rows, failures, memberCatalogs.value)
        toast.success('Archivo de miembros pendientes descargado')
    } catch {
        toast.error('No fue posible generar el archivo de miembros pendientes')
    } finally {
        downloadingFailures.value = false
    }
}
</script>

<template>
    <main class="mx-auto w-full max-w-system px-6 pb-20 pt-24 lg:px-10">
        <section
            class="flex flex-col gap-6 border-b border-outline-variant pb-9 xl:flex-row xl:items-end xl:justify-between"
        >
            <div>
                <p class="text-xs font-semibold uppercase tracking-[0.4em] text-on-surface-variant">
                    Comunidad · Directorio pastoral
                </p>
                <h1 class="mt-4 font-display text-4xl font-semibold text-on-surface md:text-5xl">
                    Miembros
                </h1>
                <p class="mt-3 max-w-2xl text-sm leading-relaxed text-on-surface-variant">
                    Administra miembros, pastores, líderes, anfitriones y servidores. Este
                    directorio no concede acceso al sistema; las cuentas de usuario se gestionarán
                    en un flujo separado.
                </p>
            </div>

            <div class="flex flex-wrap gap-2">
                <input
                    v-if="canImportExport"
                    ref="importInput"
                    type="file"
                    accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                    class="hidden"
                    @change="onImportFile"
                />
                <UiButton
                    v-if="canImportExport"
                    variant="outline"
                    type="button"
                    :loading="downloadingTemplate"
                    :disabled="catalogsQuery.isPending.value"
                    @click="downloadTemplate"
                >
                    <FileDown class="size-4" /> Plantilla
                </UiButton>
                <UiButton
                    v-if="canImportExport"
                    variant="outline"
                    type="button"
                    :loading="parsingFile"
                    :disabled="catalogsQuery.isPending.value"
                    @click="pickImportFile"
                >
                    <Upload class="size-4" /> Importar
                </UiButton>
                <UiButton
                    v-if="canImportExport"
                    variant="outline"
                    type="button"
                    :loading="exporting"
                    :disabled="!members.length || catalogsQuery.isPending.value"
                    @click="exportExcel"
                >
                    <Download class="size-4" /> Exportar
                </UiButton>
                <NuxtLink
                    v-if="canCreate"
                    to="/comunidad/miembros/nuevo"
                    class="inline-flex h-10 items-center justify-center gap-2 whitespace-nowrap rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition-colors hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                    data-testid="create-member-link"
                >
                    <Plus class="size-4" /> Nuevo miembro
                </NuxtLink>
            </div>
        </section>

        <section class="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
            <UiCard class="p-5">
                <Users class="mb-3 size-6 text-primary" />
                <p
                    class="text-[11px] font-semibold uppercase tracking-wider text-on-surface-variant"
                >
                    Directorio total
                </p>
                <p class="mt-1 font-display text-3xl font-semibold text-on-surface">
                    {{ stats.total }}
                </p>
                <p class="mt-1 text-xs text-on-surface-variant">Personas registradas</p>
            </UiCard>
            <UiCard class="p-5">
                <UserCheck class="mb-3 size-6 text-emerald-500" />
                <p
                    class="text-[11px] font-semibold uppercase tracking-wider text-on-surface-variant"
                >
                    Miembros activos
                </p>
                <p class="mt-1 font-display text-3xl font-semibold text-on-surface">
                    {{ stats.active }}
                </p>
                <p class="mt-1 text-xs text-emerald-500">En comunión activa</p>
            </UiCard>
            <UiCard class="p-5">
                <ShieldCheck class="mb-3 size-6 text-primary" />
                <p
                    class="text-[11px] font-semibold uppercase tracking-wider text-on-surface-variant"
                >
                    Liderazgo y servicio
                </p>
                <p class="mt-1 font-display text-3xl font-semibold text-on-surface">
                    {{ stats.leaders }}
                </p>
                <p class="mt-1 text-xs text-on-surface-variant">Con roles asignados</p>
            </UiCard>
            <UiCard class="p-5">
                <UserRound class="mb-3 size-6 text-primary" />
                <p
                    class="text-[11px] font-semibold uppercase tracking-wider text-on-surface-variant"
                >
                    Nuevos
                </p>
                <p class="mt-1 font-display text-3xl font-semibold text-on-surface">
                    {{ stats.newMembers }}
                </p>
                <p class="mt-1 text-xs text-on-surface-variant">Últimos 90 días</p>
            </UiCard>
            <UiCard class="p-5">
                <Cake class="mb-3 size-6 text-primary" />
                <p
                    class="text-[11px] font-semibold uppercase tracking-wider text-on-surface-variant"
                >
                    Cumpleaños
                </p>
                <p class="mt-1 font-display text-3xl font-semibold text-on-surface">
                    {{ stats.birthdays }}
                </p>
                <p class="mt-1 text-xs text-on-surface-variant">Durante este mes</p>
            </UiCard>
        </section>

        <section class="mt-8">
            <DataTable
                :rows="sortedMembers"
                :columns="columns"
                row-key="id"
                :page-size="25"
                :loading="loading"
                show-search
                search-placeholder="Buscar por nombre, código, documento, teléfono…"
                empty-title="Sin miembros"
                empty-message="Crea el primer miembro o importa el directorio desde una plantilla Excel."
            >
                <template #toolbar-start="{ total }">
                    <span class="hidden text-xs text-on-surface-variant md:inline"
                        >{{ total }} resultado(s)</span
                    >
                </template>

                <template #cell-member="{ row }">
                    <button
                        type="button"
                        class="flex min-w-0 items-center gap-3 text-left"
                        @click="openDetails(row as Member)"
                    >
                        <span
                            class="flex size-11 shrink-0 items-center justify-center rounded-full border border-primary/25 bg-primary/10 text-xs font-semibold text-primary"
                            >{{
                                formatInitials(
                                    `${(row as Member).firstName} ${(row as Member).lastName}`,
                                )
                            }}</span
                        >
                        <span class="min-w-0">
                            <span
                                class="block truncate font-display text-sm font-semibold text-on-surface hover:text-primary"
                                >{{ getMemberFullName(row as Member) }}</span
                            >
                            <span class="mt-0.5 block text-[11px] text-on-surface-variant"
                                >{{ (row as Member).code
                                }}<template v-if="(row as Member).documentNumber">
                                    · {{ (row as Member).documentNumber }}</template
                                ><template v-if="getMemberAge((row as Member).birthDate) !== null">
                                    · {{ getMemberAge((row as Member).birthDate) }} años</template
                                ></span
                            >
                        </span>
                    </button>
                </template>

                <template #cell-contact="{ row }">
                    <div class="space-y-1 text-xs text-on-surface-variant">
                        <p class="flex items-center gap-2">
                            <Phone class="size-3.5" />{{ (row as Member).phone || 'Sin teléfono' }}
                        </p>
                        <p class="flex items-center gap-2">
                            <Mail class="size-3.5" />{{ (row as Member).email || 'Sin correo' }}
                        </p>
                    </div>
                </template>

                <template #cell-documentNumber="{ row }">
                    <span class="text-xs font-medium text-on-surface">
                        {{ (row as Member).documentNumber || 'Sin DUI' }}
                    </span>
                </template>

                <template #cell-roles="{ row }">
                    <div class="flex flex-wrap gap-1.5">
                        <span
                            v-for="role in (row as Member).roles.slice(0, 3)"
                            :key="role"
                            class="rounded border border-primary/25 bg-primary/10 px-2 py-0.5 text-[10px] font-semibold text-primary"
                            >{{ getMemberRoleLabel(role) }}</span
                        >
                        <span
                            v-if="(row as Member).roles.length > 3"
                            class="rounded border border-outline-variant px-2 py-0.5 text-[10px] text-on-surface-variant"
                            >+{{ (row as Member).roles.length - 3 }}</span
                        >
                    </div>
                </template>

                <template #cell-territory="{ row }">
                    <div class="text-xs">
                        <p class="text-on-surface">
                            {{
                                [
                                    (row as Member).district,
                                    (row as Member).zone,
                                    (row as Member).sector,
                                ]
                                    .filter(Boolean)
                                    .join(' · ') || 'Sin territorio'
                            }}
                        </p>
                        <p class="mt-1 text-on-surface-variant">
                            {{ (row as Member).smallGroup || 'Sin grupo pequeño' }}
                        </p>
                    </div>
                </template>

                <template #cell-sector="{ row }">
                    <span class="text-xs text-on-surface">
                        {{ (row as Member).sector || 'Sin sector' }}
                    </span>
                </template>

                <template #cell-status="{ row }">
                    <span
                        class="inline-flex rounded border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider"
                        :class="statusTone((row as Member).status)"
                        >{{ getMemberStatusLabel((row as Member).status) }}</span
                    >
                </template>

                <template #cell-createdAt="{ row }">
                    <span class="text-xs text-on-surface-variant">
                        {{ formatShortIsoDate((row as Member).createdAt.slice(0, 10)) }}
                    </span>
                </template>

                <template #cell-actions="{ row }">
                    <DropdownMenuRoot>
                        <DropdownMenuTrigger
                            class="flex size-9 items-center justify-center rounded-full text-on-surface-variant hover:bg-surface-container-high hover:text-primary"
                            aria-label="Acciones del miembro"
                        >
                            <MoreVertical class="size-4" />
                        </DropdownMenuTrigger>
                        <DropdownMenuPortal>
                            <DropdownMenuContent
                                :side-offset="6"
                                align="end"
                                class="z-50 w-56 border border-outline-variant bg-surface-container py-1 shadow-xl focus:outline-none"
                            >
                                <DropdownMenuItem
                                    class="flex cursor-pointer items-center gap-3 px-4 py-2.5 text-xs text-on-surface-variant outline-none data-[highlighted]:bg-surface-container-high data-[highlighted]:text-primary"
                                    @select="openDetails(row as Member)"
                                >
                                    <Eye class="size-4" /> Ver ficha completa
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                    class="flex cursor-pointer items-center gap-3 px-4 py-2.5 text-xs text-on-surface-variant outline-none data-[highlighted]:bg-surface-container-high data-[highlighted]:text-primary"
                                    @select="openEdit(row as Member)"
                                >
                                    <Pencil class="size-4" /> Editar
                                </DropdownMenuItem>
                                <div class="my-1 h-px bg-outline-variant" />
                                <DropdownMenuItem
                                    v-for="status in memberStatusOptions.filter(
                                        (option) => option.value !== (row as Member).status,
                                    )"
                                    :key="status.value"
                                    class="cursor-pointer px-4 py-2 text-[11px] text-on-surface-variant outline-none data-[highlighted]:bg-surface-container-high data-[highlighted]:text-primary"
                                    @select="changeStatus(row as Member, status.value)"
                                >
                                    Marcar como {{ status.label.toLowerCase() }}
                                </DropdownMenuItem>
                                <div class="my-1 h-px bg-outline-variant" />
                                <DropdownMenuItem
                                    class="flex cursor-pointer items-center gap-3 px-4 py-2.5 text-xs text-destructive outline-none data-[highlighted]:bg-destructive/10"
                                    @select="askDelete(row as Member)"
                                >
                                    <Trash2 class="size-4" /> Eliminar
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenuPortal>
                    </DropdownMenuRoot>
                </template>
            </DataTable>
        </section>

        <MemberFormDrawer
            :open="formOpen"
            :member="editingMember"
            :saving="saving"
            @close="formOpen = false"
            @save="saveMember"
        />
        <MemberDetailsDrawer
            :open="detailsOpen"
            :member="selectedMember"
            @close="detailsOpen = false"
            @edit="openEdit"
        />

        <DialogRoot v-model:open="deleteOpen">
            <DialogPortal>
                <DialogOverlay class="fixed inset-0 z-[70] bg-black/60 backdrop-blur-sm" />
                <DialogContent
                    class="fixed left-1/2 top-1/2 z-[71] w-[92vw] max-w-md -translate-x-1/2 -translate-y-1/2 rounded-lg border border-outline-variant bg-surface p-6 shadow-2xl focus:outline-none"
                >
                    <div class="flex items-start gap-4">
                        <div
                            class="flex size-11 shrink-0 items-center justify-center rounded-full bg-destructive/10 text-destructive"
                        >
                            <AlertTriangle class="size-5" />
                        </div>
                        <div>
                            <DialogTitle class="font-display text-xl font-semibold text-on-surface">
                                Eliminar miembro </DialogTitle
                            ><DialogDescription
                                class="mt-2 text-sm leading-relaxed text-on-surface-variant"
                            >
                                Se eliminará permanentemente a
                                <strong class="text-on-surface">{{
                                    deleteTarget ? getMemberFullName(deleteTarget) : ''
                                }}</strong
                                >. Si solo dejó de congregarse, es mejor cambiar su estado a
                                inactivo o trasladado.
                            </DialogDescription>
                        </div>
                    </div>
                    <div class="mt-6 flex justify-end gap-2">
                        <DialogClose as-child>
                            <UiButton variant="outline" type="button">
                                Cancelar
                            </UiButton> </DialogClose
                        ><UiButton
                            variant="destructive"
                            type="button"
                            :loading="deleteMemberMutation.isPending.value"
                            :disabled="deleteMemberMutation.isPending.value"
                            @click="confirmDelete"
                        >
                            <Trash2 class="size-4" /> Eliminar
                        </UiButton>
                    </div>
                </DialogContent>
            </DialogPortal>
        </DialogRoot>

        <DialogRoot v-model:open="importOpen">
            <DialogPortal>
                <DialogOverlay class="fixed inset-0 z-[70] bg-black/60 backdrop-blur-sm" />
                <DialogContent
                    class="fixed left-1/2 top-1/2 z-[71] max-h-[85vh] w-[94vw] max-w-xl -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-lg border border-outline-variant bg-surface p-6 shadow-2xl focus:outline-none"
                >
                    <div class="flex items-start gap-4">
                        <div
                            class="flex size-11 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary"
                        >
                            <FileSpreadsheet class="size-5" />
                        </div>
                        <div>
                            <DialogTitle class="font-display text-xl font-semibold text-on-surface">
                                Importar miembros desde Excel </DialogTitle
                            ><DialogDescription class="mt-1 text-sm text-on-surface-variant">
                                {{ importFileName }}
                            </DialogDescription>
                        </div>
                    </div>
                    <div v-if="importResult" class="mt-6 grid grid-cols-3 gap-3">
                        <div class="rounded border border-emerald-500/30 bg-emerald-500/5 p-4">
                            <p class="text-[11px] uppercase tracking-wider text-on-surface-variant">
                                Creados
                            </p>
                            <p class="mt-1 font-display text-2xl font-semibold text-emerald-600">
                                {{ importResult.created }}
                            </p>
                        </div>
                        <div class="rounded border border-primary/30 bg-primary/5 p-4">
                            <p class="text-[11px] uppercase tracking-wider text-on-surface-variant">
                                Actualizados
                            </p>
                            <p class="mt-1 font-display text-2xl font-semibold text-primary">
                                {{ importResult.updated }}
                            </p>
                        </div>
                        <div class="rounded border border-destructive/40 bg-destructive/5 p-4">
                            <p class="text-[11px] uppercase tracking-wider text-on-surface-variant">
                                Pendientes
                            </p>
                            <p class="mt-1 font-display text-2xl font-semibold text-destructive">
                                {{ importResult.rejected }}
                            </p>
                        </div>
                    </div>
                    <div v-else class="mt-6 grid grid-cols-2 gap-3">
                        <div class="rounded border border-outline-variant bg-surface-container p-4">
                            <p class="text-[11px] uppercase tracking-wider text-on-surface-variant">
                                Registros válidos
                            </p>
                            <p class="mt-1 font-display text-2xl font-semibold text-on-surface">
                                {{ validImportRows.length }}
                            </p>
                        </div>
                        <div
                            class="rounded border p-4"
                            :class="
                                previewErrors.length
                                    ? 'border-destructive/40 bg-destructive/5'
                                    : 'border-outline-variant bg-surface-container'
                            "
                        >
                            <p class="text-[11px] uppercase tracking-wider text-on-surface-variant">
                                Errores
                            </p>
                            <p
                                class="mt-1 font-display text-2xl font-semibold"
                                :class="
                                    previewErrors.length ? 'text-destructive' : 'text-on-surface'
                                "
                            >
                                {{ invalidImportRows.length }}
                            </p>
                        </div>
                    </div>
                    <div
                        v-if="previewErrors.length"
                        class="mt-4 rounded border border-destructive/30 bg-destructive/5 p-4"
                    >
                        <p class="text-xs font-semibold text-destructive">
                            {{
                                importResult
                                    ? 'Filas que continúan pendientes:'
                                    : 'Estas filas se devolverán para corregirlas:'
                            }}
                        </p>
                        <ul
                            class="mt-2 max-h-40 list-disc space-y-1 overflow-y-auto pl-5 text-xs text-on-surface-variant"
                        >
                            <li v-for="error in previewErrors" :key="error">
                                {{ error }}
                            </li>
                        </ul>
                    </div>
                    <p
                        v-else-if="!importResult"
                        class="mt-4 rounded border border-primary/25 bg-primary/5 p-4 text-xs leading-relaxed text-on-surface-variant"
                    >
                        Los registros que coincidan por
                        <strong class="text-on-surface">código o documento</strong> serán
                        actualizados. Los demás serán creados con un código automático cuando sea
                        necesario.
                    </p>
                    <p
                        v-if="!importResult && invalidImportRows.length && validImportRows.length"
                        class="mt-4 rounded border border-amber-500/30 bg-amber-500/5 p-4 text-xs leading-relaxed text-on-surface-variant"
                    >
                        Los {{ validImportRows.length }} registros válidos se guardarán. Las
                        {{ invalidImportRows.length }} filas con problemas quedarán en un nuevo
                        Excel junto con el motivo, listas para corregir y volver a importar.
                    </p>
                    <p
                        v-if="importResult && importResult.rejected"
                        class="mt-4 rounded border border-primary/25 bg-primary/5 p-4 text-xs leading-relaxed text-on-surface-variant"
                    >
                        Los miembros creados o actualizados ya no aparecen en el archivo de
                        pendientes. Puedes corregir ese archivo y subirlo nuevamente.
                    </p>
                    <div class="mt-6 flex flex-wrap justify-end gap-2">
                        <DialogClose as-child>
                            <UiButton variant="outline" type="button">
                                {{ importResult ? 'Cerrar' : 'Cancelar' }}
                            </UiButton>
                        </DialogClose>
                        <UiButton
                            v-if="
                                (importResult && importResult.rejected) ||
                                (!importResult &&
                                    !validImportRows.length &&
                                    invalidImportRows.length)
                            "
                            variant="outline"
                            type="button"
                            :loading="downloadingFailures"
                            @click="downloadPendingMembers"
                        >
                            <Download class="size-4" /> Descargar pendientes
                        </UiButton>
                        <UiButton
                            v-if="!importResult"
                            type="button"
                            :loading="importing"
                            :disabled="
                                importing ||
                                !validImportRows.length ||
                                !!importPreview.fileErrors.length
                            "
                            @click="confirmImport"
                        >
                            <Upload class="size-4" /> Importar
                            {{ validImportRows.length }} miembro(s)
                        </UiButton>
                    </div>
                </DialogContent>
            </DialogPortal>
        </DialogRoot>
    </main>
</template>
