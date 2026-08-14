<script setup lang="ts">
import {
    CheckCircle2,
    Edit3,
    KeyRound,
    Layers3,
    LockKeyhole,
    MoreVertical,
    Plus,
    Power,
    ShieldCheck,
    ShieldOff,
} from '@lucide/vue'
import {
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuPortal,
    DropdownMenuRoot,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from 'radix-vue'
import DataTable, {
    type DataTableColumn,
} from '~/presentation/shared/components/DataTable/DataTable.vue'
import { useAppToast } from '~/presentation/shared/composables/useAppToast'
import PermissionFormDrawer from '../components/PermissionFormDrawer.vue'
import { useAccessControlPreview } from '../composables/useAccessControlPreview'
import {
    accessModuleOptions,
    accessStatusOptions,
    getAccessStatusLabel,
} from '../constants/access-control.constants'
import type {
    AccessPermission,
    AccessRecordStatus,
    PermissionFormPayload,
} from '../interfaces/access-control.interface'

defineOptions({ name: 'PermissionsView' })

withDefaults(defineProps<{ embedded?: boolean }>(), { embedded: false })

const toast = useAppToast()
const { permissions } = useAccessControlPreview()
const formOpen = ref(false)
const editingPermission = ref<AccessPermission | null>(null)

const stats = computed(() => ({
    total: permissions.value.length,
    active: permissions.value.filter((permission) => permission.status === 'ACTIVE').length,
    modules: new Set(permissions.value.map((permission) => permission.module)).size,
    custom: permissions.value.filter((permission) => !permission.isSystem).length,
}))

const columns: DataTableColumn<AccessPermission>[] = [
    {
        key: 'permission',
        label: 'Permiso',
        sortable: true,
        filterable: true,
        filterType: 'text',
        accessor: (row) => `${row.name} ${row.code} ${row.description}`,
        width: '380px',
    },
    {
        key: 'module',
        label: 'Módulo',
        sortable: true,
        filterable: true,
        filterType: 'select',
        filterOptions: accessModuleOptions,
        accessor: (row) => row.module,
        width: '160px',
    },
    {
        key: 'rule',
        label: 'Regla',
        filterable: true,
        filterType: 'text',
        accessor: (row) => `${row.resource} ${row.action}`,
        width: '210px',
    },
    {
        key: 'roles',
        label: 'Roles',
        sortable: true,
        accessor: (row) => row.roleCount,
        width: '110px',
        align: 'center',
    },
    {
        key: 'status',
        label: 'Estado',
        sortable: true,
        filterable: true,
        filterType: 'select',
        filterOptions: accessStatusOptions,
        accessor: (row) => row.status,
        width: '130px',
    },
    { key: 'actions', label: '', width: '70px', align: 'right' },
]

function openCreate() {
    editingPermission.value = null
    formOpen.value = true
}

function openEdit(permission: AccessPermission) {
    editingPermission.value = permission
    formOpen.value = true
}

function savePermission(payload: PermissionFormPayload) {
    const duplicatedCode = permissions.value.some(
        (permission) =>
            permission.code === payload.code && permission.id !== editingPermission.value?.id,
    )
    if (duplicatedCode) {
        toast.error('Ya existe un permiso con ese código')
        return
    }

    if (editingPermission.value) {
        permissions.value = permissions.value.map((permission) =>
            permission.id === editingPermission.value?.id
                ? {
                      ...permission,
                      name: payload.name,
                      code: permission.isSystem ? permission.code : payload.code,
                      module: payload.module,
                      resource: permission.isSystem ? permission.resource : payload.resource,
                      action: permission.isSystem ? permission.action : payload.action,
                      description: payload.description,
                      status: permission.isSystem ? permission.status : payload.status,
                  }
                : permission,
        )
        toast.success('Permiso actualizado en esta vista previa')
    } else {
        const nextId = Math.max(0, ...permissions.value.map((permission) => permission.id)) + 1
        permissions.value = [
            {
                id: nextId,
                ...payload,
                isSystem: false,
                roleCount: 0,
            },
            ...permissions.value,
        ]
        toast.success('Permiso creado en esta vista previa')
    }

    formOpen.value = false
    editingPermission.value = null
}

function toggleStatus(permission: AccessPermission) {
    if (permission.isSystem) {
        toast.error('Los permisos protegidos no pueden desactivarse')
        return
    }
    const nextStatus: AccessRecordStatus = permission.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE'
    permissions.value = permissions.value.map((item) =>
        item.id === permission.id ? { ...item, status: nextStatus } : item,
    )
    toast.success(nextStatus === 'ACTIVE' ? 'Permiso habilitado' : 'Permiso desactivado')
}
</script>

<template>
    <component
        :is="embedded ? 'section' : 'main'"
        :class="embedded ? 'w-full' : 'mx-auto w-full max-w-system px-6 pb-20 pt-24 lg:px-10'"
        data-testid="permissions-page"
    >
        <section
            v-if="!embedded"
            class="flex flex-col gap-6 border-b border-outline-variant pb-9 xl:flex-row xl:items-end xl:justify-between"
        >
            <div>
                <p class="text-xs font-semibold uppercase tracking-[0.4em] text-on-surface-variant">
                    Comunidad · Seguridad y acceso
                </p>
                <h1 class="mt-4 font-display text-4xl font-semibold text-on-surface md:text-5xl">
                    Permisos
                </h1>
                <p class="mt-3 max-w-2xl text-sm leading-relaxed text-on-surface-variant">
                    Mantén el catálogo de acciones autorizadas del sistema y consulta en cuántos
                    roles se utiliza cada permiso.
                </p>
            </div>
            <UiButton type="button" data-testid="permissions-new-button" @click="openCreate">
                <Plus class="size-4" /> Nuevo permiso
            </UiButton>
        </section>

        <div
            class="mt-5 flex items-start gap-3 rounded border border-primary/25 bg-primary/5 px-4 py-3 text-xs text-on-surface-variant"
        >
            <ShieldCheck class="mt-0.5 size-4 shrink-0 text-primary" />
            <p>
                Vista visual sin conexión al backend. Los permisos base están protegidos; los
                permisos personalizados pueden editarse o desactivarse.
            </p>
        </div>

        <section class="mt-7 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <UiCard class="p-5">
                <KeyRound class="mb-3 size-6 text-primary" />
                <p
                    class="text-[11px] font-semibold uppercase tracking-wider text-on-surface-variant"
                >
                    Permisos totales
                </p>
                <p class="mt-1 font-display text-3xl font-semibold text-on-surface">
                    {{ stats.total }}
                </p>
                <p class="mt-1 text-xs text-on-surface-variant">Acciones registradas</p>
            </UiCard>
            <UiCard class="p-5">
                <CheckCircle2 class="mb-3 size-6 text-emerald-400" />
                <p
                    class="text-[11px] font-semibold uppercase tracking-wider text-on-surface-variant"
                >
                    Activos
                </p>
                <p class="mt-1 font-display text-3xl font-semibold text-on-surface">
                    {{ stats.active }}
                </p>
                <p class="mt-1 text-xs text-emerald-400">Disponibles para asignar</p>
            </UiCard>
            <UiCard class="p-5">
                <Layers3 class="mb-3 size-6 text-primary" />
                <p
                    class="text-[11px] font-semibold uppercase tracking-wider text-on-surface-variant"
                >
                    Módulos
                </p>
                <p class="mt-1 font-display text-3xl font-semibold text-on-surface">
                    {{ stats.modules }}
                </p>
                <p class="mt-1 text-xs text-on-surface-variant">Áreas con autorización</p>
            </UiCard>
            <UiCard class="p-5">
                <LockKeyhole class="mb-3 size-6 text-primary" />
                <p
                    class="text-[11px] font-semibold uppercase tracking-wider text-on-surface-variant"
                >
                    Personalizados
                </p>
                <p class="mt-1 font-display text-3xl font-semibold text-on-surface">
                    {{ stats.custom }}
                </p>
                <p class="mt-1 text-xs text-on-surface-variant">Creados por administradores</p>
            </UiCard>
        </section>

        <section class="mt-8">
            <DataTable
                :rows="permissions"
                :columns="columns"
                row-key="id"
                :page-size="10"
                show-search
                search-placeholder="Buscar por nombre, código, recurso o acción…"
                empty-title="Sin permisos"
                empty-message="Crea el primer permiso para comenzar el catálogo de acceso."
            >
                <template #toolbar-start="{ total }">
                    <span class="hidden text-xs text-on-surface-variant md:inline">
                        {{ total }} permiso(s)
                    </span>
                </template>

                <template #toolbar-end>
                    <UiButton variant="outline" size="sm" type="button" @click="openCreate">
                        <Plus class="size-4" /> Nuevo permiso
                    </UiButton>
                </template>

                <template #cell-permission="{ row }">
                    <button
                        type="button"
                        class="flex min-w-0 items-center gap-3 text-left"
                        @click="openEdit(row as AccessPermission)"
                    >
                        <span
                            class="flex size-11 shrink-0 items-center justify-center rounded-full border border-primary/25 bg-primary/10 text-primary"
                        >
                            <LockKeyhole v-if="(row as AccessPermission).isSystem" class="size-4" />
                            <KeyRound v-else class="size-4" />
                        </span>
                        <span class="min-w-0">
                            <span class="flex items-center gap-2">
                                <span
                                    class="truncate font-display text-sm font-semibold text-on-surface hover:text-primary"
                                >
                                    {{ (row as AccessPermission).name }}
                                </span>
                                <span
                                    v-if="(row as AccessPermission).isSystem"
                                    class="rounded border border-primary/25 px-1.5 py-0.5 text-[9px] font-bold uppercase text-primary"
                                >
                                    Sistema
                                </span>
                            </span>
                            <code class="mt-0.5 block text-[10px] text-primary">
                                {{ (row as AccessPermission).code }}
                            </code>
                            <span
                                class="mt-1 block max-w-sm truncate text-[11px] text-on-surface-variant"
                            >
                                {{ (row as AccessPermission).description }}
                            </span>
                        </span>
                    </button>
                </template>

                <template #cell-module="{ row }">
                    <span
                        class="inline-flex rounded border border-outline-variant bg-surface-container-high px-2.5 py-1 text-[10px] font-semibold text-on-surface-variant"
                    >
                        {{ (row as AccessPermission).module }}
                    </span>
                </template>

                <template #cell-rule="{ row }">
                    <div class="text-xs">
                        <p class="text-on-surface">
                            Recurso:
                            <code class="text-primary">{{
                                (row as AccessPermission).resource
                            }}</code>
                        </p>
                        <p class="mt-1 text-on-surface-variant">
                            Acción: <code>{{ (row as AccessPermission).action }}</code>
                        </p>
                    </div>
                </template>

                <template #cell-roles="{ row }">
                    <div class="text-center">
                        <p class="font-display text-lg font-semibold text-on-surface">
                            {{ (row as AccessPermission).roleCount }}
                        </p>
                        <p class="text-[10px] text-on-surface-variant">roles</p>
                    </div>
                </template>

                <template #cell-status="{ row }">
                    <span
                        class="inline-flex rounded border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider"
                        :class="
                            (row as AccessPermission).status === 'ACTIVE'
                                ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-400'
                                : 'border-outline-variant bg-surface-container-high text-on-surface-variant'
                        "
                    >
                        {{ getAccessStatusLabel((row as AccessPermission).status) }}
                    </span>
                </template>

                <template #cell-actions="{ row }">
                    <DropdownMenuRoot>
                        <DropdownMenuTrigger
                            class="flex size-9 items-center justify-center rounded-full text-on-surface-variant hover:bg-surface-container-high hover:text-primary"
                            :aria-label="`Acciones de ${(row as AccessPermission).name}`"
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
                                    @select="openEdit(row as AccessPermission)"
                                >
                                    <Edit3 class="size-4" /> Editar permiso
                                </DropdownMenuItem>
                                <DropdownMenuSeparator class="my-1 h-px bg-outline-variant" />
                                <DropdownMenuItem
                                    :disabled="(row as AccessPermission).isSystem"
                                    class="flex cursor-pointer items-center gap-3 px-4 py-2.5 text-xs text-on-surface-variant outline-none data-[disabled]:cursor-not-allowed data-[disabled]:opacity-40 data-[highlighted]:bg-surface-container-high data-[highlighted]:text-primary"
                                    @select="toggleStatus(row as AccessPermission)"
                                >
                                    <Power
                                        v-if="(row as AccessPermission).status === 'INACTIVE'"
                                        class="size-4"
                                    />
                                    <ShieldOff v-else class="size-4" />
                                    {{
                                        (row as AccessPermission).status === 'ACTIVE'
                                            ? 'Desactivar permiso'
                                            : 'Activar permiso'
                                    }}
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenuPortal>
                    </DropdownMenuRoot>
                </template>
            </DataTable>
        </section>

        <PermissionFormDrawer
            :open="formOpen"
            :permission="editingPermission"
            @close="formOpen = false"
            @save="savePermission"
        />
    </component>
</template>
