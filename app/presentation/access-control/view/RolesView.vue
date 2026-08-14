<script setup lang="ts">
import {
    CheckCircle2,
    Copy,
    Edit3,
    KeyRound,
    Layers3,
    LockKeyhole,
    MoreVertical,
    Plus,
    Power,
    ShieldCheck,
    ShieldOff,
    UsersRound,
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
import RoleFormDrawer from '../components/RoleFormDrawer.vue'
import { useAccessControlPreview } from '../composables/useAccessControlPreview'
import { accessStatusOptions, getAccessStatusLabel } from '../constants/access-control.constants'
import type {
    AccessRecordStatus,
    AccessRole,
    RoleFormPayload,
} from '../interfaces/access-control.interface'

defineOptions({ name: 'RolesView' })

withDefaults(defineProps<{ embedded?: boolean }>(), { embedded: false })

const toast = useAppToast()
const { roles, permissions } = useAccessControlPreview()
const formOpen = ref(false)
const editingRole = ref<AccessRole | null>(null)

const stats = computed(() => ({
    total: roles.value.length,
    active: roles.value.filter((role) => role.status === 'ACTIVE').length,
    assignedUsers: roles.value.reduce((total, role) => total + role.userCount, 0),
    protected: roles.value.filter((role) => role.isSystem).length,
}))

const columns: DataTableColumn<AccessRole>[] = [
    {
        key: 'role',
        label: 'Rol',
        sortable: true,
        filterable: true,
        filterType: 'text',
        accessor: (row) => `${row.name} ${row.code} ${row.description}`,
        width: '360px',
    },
    {
        key: 'users',
        label: 'Usuarios',
        sortable: true,
        accessor: (row) => row.userCount,
        width: '125px',
        align: 'center',
    },
    {
        key: 'permissions',
        label: 'Permisos',
        sortable: true,
        accessor: (row) => row.permissionIds.length,
        width: '240px',
    },
    {
        key: 'updatedAt',
        label: 'Actualizado',
        sortable: true,
        accessor: (row) => row.updatedAt,
        width: '165px',
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

function permissionModules(role: AccessRole) {
    return Array.from(
        new Set(
            permissions.value
                .filter((permission) => role.permissionIds.includes(permission.id))
                .map((permission) => permission.module),
        ),
    )
}

function formatDate(value: string) {
    return new Intl.DateTimeFormat('es-SV', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
    }).format(new Date(value))
}

function openCreate() {
    editingRole.value = null
    formOpen.value = true
}

function openEdit(role: AccessRole) {
    editingRole.value = role
    formOpen.value = true
}

function saveRole(payload: RoleFormPayload) {
    const duplicatedCode = roles.value.some(
        (role) => role.code === payload.code && role.id !== editingRole.value?.id,
    )
    if (duplicatedCode) {
        toast.error('Ya existe un rol con ese código')
        return
    }

    if (editingRole.value) {
        roles.value = roles.value.map((role) =>
            role.id === editingRole.value?.id
                ? {
                      ...role,
                      name: role.isSystem ? role.name : payload.name,
                      code: role.isSystem ? role.code : payload.code,
                      description: payload.description,
                      status: role.isSystem ? role.status : payload.status,
                      permissionIds: [...payload.permissionIds],
                      updatedAt: new Date().toISOString(),
                  }
                : role,
        )
        toast.success('Rol actualizado en esta vista previa')
    } else {
        const nextId = Math.max(0, ...roles.value.map((role) => role.id)) + 1
        roles.value = [
            {
                id: nextId,
                ...payload,
                isSystem: false,
                userCount: 0,
                updatedAt: new Date().toISOString(),
            },
            ...roles.value,
        ]
        toast.success('Rol creado en esta vista previa')
    }

    formOpen.value = false
    editingRole.value = null
}

function duplicateRole(role: AccessRole) {
    const nextId = Math.max(0, ...roles.value.map((item) => item.id)) + 1
    const baseCode = `${role.code}_COPY`
    let code = baseCode
    let suffix = 2
    while (roles.value.some((item) => item.code === code)) {
        code = `${baseCode}_${suffix}`
        suffix += 1
    }
    const duplicate: AccessRole = {
        ...role,
        id: nextId,
        name: `${role.name} (copia)`,
        code,
        isSystem: false,
        userCount: 0,
        permissionIds: [...role.permissionIds],
        updatedAt: new Date().toISOString(),
    }
    roles.value = [duplicate, ...roles.value]
    toast.success('Rol duplicado; ya puedes personalizarlo')
    openEdit(duplicate)
}

function toggleStatus(role: AccessRole) {
    if (role.isSystem) {
        toast.error('Los roles protegidos no pueden desactivarse')
        return
    }
    const nextStatus: AccessRecordStatus = role.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE'
    roles.value = roles.value.map((item) =>
        item.id === role.id
            ? { ...item, status: nextStatus, updatedAt: new Date().toISOString() }
            : item,
    )
    toast.success(nextStatus === 'ACTIVE' ? 'Rol habilitado' : 'Rol desactivado')
}
</script>

<template>
    <component
        :is="embedded ? 'section' : 'main'"
        :class="embedded ? 'w-full' : 'mx-auto w-full max-w-system px-6 pb-20 pt-24 lg:px-10'"
        data-testid="roles-page"
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
                    Roles
                </h1>
                <p class="mt-3 max-w-2xl text-sm leading-relaxed text-on-surface-variant">
                    Agrupa permisos en perfiles de acceso reutilizables y controla qué áreas del
                    sistema puede utilizar cada grupo de usuarios.
                </p>
            </div>
            <UiButton type="button" data-testid="roles-new-button" @click="openCreate">
                <Plus class="size-4" /> Nuevo rol
            </UiButton>
        </section>

        <div
            class="mt-5 flex items-start gap-3 rounded border border-primary/25 bg-primary/5 px-4 py-3 text-xs text-on-surface-variant"
        >
            <ShieldCheck class="mt-0.5 size-4 shrink-0 text-primary" />
            <p>
                Vista visual sin conexión al backend. Los roles protegidos conservan su identidad,
                pero puedes explorar cómo se administrarían sus permisos.
            </p>
        </div>

        <section class="mt-7 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <UiCard class="p-5">
                <Layers3 class="mb-3 size-6 text-primary" />
                <p
                    class="text-[11px] font-semibold uppercase tracking-wider text-on-surface-variant"
                >
                    Roles totales
                </p>
                <p class="mt-1 font-display text-3xl font-semibold text-on-surface">
                    {{ stats.total }}
                </p>
                <p class="mt-1 text-xs text-on-surface-variant">Perfiles configurados</p>
            </UiCard>
            <UiCard class="p-5">
                <CheckCircle2 class="mb-3 size-6 text-emerald-400" />
                <p
                    class="text-[11px] font-semibold uppercase tracking-wider text-on-surface-variant"
                >
                    Roles activos
                </p>
                <p class="mt-1 font-display text-3xl font-semibold text-on-surface">
                    {{ stats.active }}
                </p>
                <p class="mt-1 text-xs text-emerald-400">Disponibles para asignar</p>
            </UiCard>
            <UiCard class="p-5">
                <UsersRound class="mb-3 size-6 text-primary" />
                <p
                    class="text-[11px] font-semibold uppercase tracking-wider text-on-surface-variant"
                >
                    Asignaciones
                </p>
                <p class="mt-1 font-display text-3xl font-semibold text-on-surface">
                    {{ stats.assignedUsers }}
                </p>
                <p class="mt-1 text-xs text-on-surface-variant">Usuarios por rol</p>
            </UiCard>
            <UiCard class="p-5">
                <LockKeyhole class="mb-3 size-6 text-primary" />
                <p
                    class="text-[11px] font-semibold uppercase tracking-wider text-on-surface-variant"
                >
                    Protegidos
                </p>
                <p class="mt-1 font-display text-3xl font-semibold text-on-surface">
                    {{ stats.protected }}
                </p>
                <p class="mt-1 text-xs text-on-surface-variant">Roles base del sistema</p>
            </UiCard>
        </section>

        <section class="mt-8">
            <DataTable
                :rows="roles"
                :columns="columns"
                row-key="id"
                :page-size="10"
                show-search
                search-placeholder="Buscar por nombre, código o descripción…"
                empty-title="Sin roles"
                empty-message="Crea el primer rol y asígnale los permisos necesarios."
            >
                <template #toolbar-start="{ total }">
                    <span class="hidden text-xs text-on-surface-variant md:inline">
                        {{ total }} rol(es)
                    </span>
                </template>

                <template #toolbar-end>
                    <UiButton variant="outline" size="sm" type="button" @click="openCreate">
                        <Plus class="size-4" /> Nuevo rol
                    </UiButton>
                </template>

                <template #cell-role="{ row }">
                    <button
                        type="button"
                        class="flex min-w-0 items-center gap-3 text-left"
                        @click="openEdit(row as AccessRole)"
                    >
                        <span
                            class="flex size-11 shrink-0 items-center justify-center rounded-full border border-primary/25 bg-primary/10 text-primary"
                        >
                            <LockKeyhole v-if="(row as AccessRole).isSystem" class="size-4" />
                            <ShieldCheck v-else class="size-4" />
                        </span>
                        <span class="min-w-0">
                            <span class="flex items-center gap-2">
                                <span
                                    class="truncate font-display text-sm font-semibold text-on-surface hover:text-primary"
                                >
                                    {{ (row as AccessRole).name }}
                                </span>
                                <span
                                    v-if="(row as AccessRole).isSystem"
                                    class="rounded border border-primary/25 px-1.5 py-0.5 text-[9px] font-bold uppercase text-primary"
                                >
                                    Sistema
                                </span>
                            </span>
                            <code class="mt-0.5 block text-[10px] text-on-surface-variant">
                                {{ (row as AccessRole).code }}
                            </code>
                            <span
                                class="mt-1 block max-w-xs truncate text-[11px] text-on-surface-variant"
                            >
                                {{ (row as AccessRole).description }}
                            </span>
                        </span>
                    </button>
                </template>

                <template #cell-users="{ row }">
                    <div class="text-center">
                        <p class="font-display text-lg font-semibold text-on-surface">
                            {{ (row as AccessRole).userCount }}
                        </p>
                        <p class="text-[10px] text-on-surface-variant">asignados</p>
                    </div>
                </template>

                <template #cell-permissions="{ row }">
                    <div>
                        <p class="flex items-center gap-2 text-xs font-semibold text-on-surface">
                            <KeyRound class="size-3.5 text-primary" />
                            {{ (row as AccessRole).permissionIds.length }} permisos
                        </p>
                        <div class="mt-1.5 flex flex-wrap gap-1">
                            <span
                                v-for="module in permissionModules(row as AccessRole).slice(0, 3)"
                                :key="module"
                                class="rounded bg-surface-container-high px-1.5 py-0.5 text-[9px] text-on-surface-variant"
                            >
                                {{ module }}
                            </span>
                            <span
                                v-if="permissionModules(row as AccessRole).length > 3"
                                class="text-[9px] text-on-surface-variant"
                            >
                                +{{ permissionModules(row as AccessRole).length - 3 }}
                            </span>
                        </div>
                    </div>
                </template>

                <template #cell-updatedAt="{ row }">
                    <p class="text-xs text-on-surface-variant">
                        {{ formatDate((row as AccessRole).updatedAt) }}
                    </p>
                </template>

                <template #cell-status="{ row }">
                    <span
                        class="inline-flex rounded border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider"
                        :class="
                            (row as AccessRole).status === 'ACTIVE'
                                ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-400'
                                : 'border-outline-variant bg-surface-container-high text-on-surface-variant'
                        "
                    >
                        {{ getAccessStatusLabel((row as AccessRole).status) }}
                    </span>
                </template>

                <template #cell-actions="{ row }">
                    <DropdownMenuRoot>
                        <DropdownMenuTrigger
                            class="flex size-9 items-center justify-center rounded-full text-on-surface-variant hover:bg-surface-container-high hover:text-primary"
                            :aria-label="`Acciones de ${(row as AccessRole).name}`"
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
                                    @select="openEdit(row as AccessRole)"
                                >
                                    <Edit3 class="size-4" /> Editar y asignar permisos
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                    class="flex cursor-pointer items-center gap-3 px-4 py-2.5 text-xs text-on-surface-variant outline-none data-[highlighted]:bg-surface-container-high data-[highlighted]:text-primary"
                                    @select="duplicateRole(row as AccessRole)"
                                >
                                    <Copy class="size-4" /> Duplicar rol
                                </DropdownMenuItem>
                                <DropdownMenuSeparator class="my-1 h-px bg-outline-variant" />
                                <DropdownMenuItem
                                    :disabled="(row as AccessRole).isSystem"
                                    class="flex cursor-pointer items-center gap-3 px-4 py-2.5 text-xs text-on-surface-variant outline-none data-[disabled]:cursor-not-allowed data-[disabled]:opacity-40 data-[highlighted]:bg-surface-container-high data-[highlighted]:text-primary"
                                    @select="toggleStatus(row as AccessRole)"
                                >
                                    <Power
                                        v-if="(row as AccessRole).status === 'INACTIVE'"
                                        class="size-4"
                                    />
                                    <ShieldOff v-else class="size-4" />
                                    {{
                                        (row as AccessRole).status === 'ACTIVE'
                                            ? 'Desactivar rol'
                                            : 'Activar rol'
                                    }}
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenuPortal>
                    </DropdownMenuRoot>
                </template>
            </DataTable>
        </section>

        <RoleFormDrawer
            :open="formOpen"
            :role="editingRole"
            :permissions="permissions"
            @close="formOpen = false"
            @save="saveRole"
        />
    </component>
</template>
