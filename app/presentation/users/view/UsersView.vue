<script setup lang="ts">
import {
    Ban,
    CheckCircle2,
    Clock3,
    Edit3,
    KeyRound,
    LockKeyhole,
    Mail,
    MoreVertical,
    Plus,
    RotateCcwKey,
    ShieldCheck,
    UserCog,
    UserRoundCheck,
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
import { formatInitials } from '~/utils/string/text-format.util'
import UserFormDrawer from '../components/UserFormDrawer.vue'
import {
    getSystemRoleLabel,
    getSystemUserStatusLabel,
    systemRoleOptions,
    systemUserStatusOptions,
} from '../constants/user.constants'
import type { SystemUser, SystemUserStatus, UserFormPayload } from '../interfaces/user.interface'
import { systemUsersMock, userMemberOptionsMock } from '../mocks/user.mock'

defineOptions({ name: 'UsersView' })

withDefaults(defineProps<{ embedded?: boolean }>(), { embedded: false })

const toast = useAppToast()
const users = ref<SystemUser[]>(
    systemUsersMock.map((user) => ({ ...user, roles: [...user.roles] })),
)
const formOpen = ref(false)
const editingUser = ref<SystemUser | null>(null)

const stats = computed(() => ({
    total: users.value.length,
    active: users.value.filter((user) => user.status === 'ACTIVE').length,
    pending: users.value.filter((user) => user.status === 'INVITED').length,
    protected: users.value.filter((user) => user.twoFactorEnabled).length,
}))

const availableMembers = computed(() => {
    const assignedMemberIds = new Set(
        users.value
            .filter((user) => user.id !== editingUser.value?.id)
            .map((user) => user.memberId),
    )
    return userMemberOptionsMock.filter((member) => !assignedMemberIds.has(member.id))
})

const columns: DataTableColumn<SystemUser>[] = [
    {
        key: 'member',
        label: 'Miembro',
        sortable: true,
        filterable: true,
        filterType: 'text',
        accessor: (row) => `${row.memberCode} ${row.memberName}`,
        width: '300px',
    },
    {
        key: 'account',
        label: 'Cuenta',
        sortable: true,
        filterable: true,
        filterType: 'text',
        accessor: (row) => `${row.username} ${row.email}`,
        width: '270px',
    },
    {
        key: 'roles',
        label: 'Roles de acceso',
        filterable: true,
        filterType: 'select',
        filterOptions: systemRoleOptions,
        accessor: (row) => row.roles.join(', '),
        width: '260px',
    },
    {
        key: 'security',
        label: 'Seguridad',
        accessor: (row) => (row.twoFactorEnabled ? '2FA' : 'Contraseña'),
        width: '170px',
    },
    {
        key: 'lastAccess',
        label: 'Último acceso',
        sortable: true,
        accessor: (row) => row.lastAccessAt ?? '',
        width: '190px',
    },
    {
        key: 'status',
        label: 'Estado',
        sortable: true,
        filterable: true,
        filterType: 'select',
        filterOptions: systemUserStatusOptions,
        accessor: (row) => row.status,
        width: '135px',
    },
    { key: 'actions', label: '', width: '70px', align: 'right' },
]

function statusTone(status: SystemUserStatus) {
    switch (status) {
        case 'ACTIVE':
            return 'border-emerald-500/40 bg-emerald-500/10 text-emerald-400'
        case 'INVITED':
            return 'border-amber-400/40 bg-amber-400/10 text-amber-300'
        case 'BLOCKED':
            return 'border-destructive/40 bg-destructive/10 text-destructive'
    }
}

function formatAccessDate(value: string | null) {
    if (!value) return 'Aún no ha ingresado'
    return new Intl.DateTimeFormat('es-SV', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    }).format(new Date(value))
}

function openCreate() {
    editingUser.value = null
    formOpen.value = true
}

function openEdit(user: SystemUser) {
    editingUser.value = user
    formOpen.value = true
}

function saveUser(payload: UserFormPayload) {
    const member = userMemberOptionsMock.find((item) => item.id === payload.memberId)
    if (!member) return

    if (editingUser.value) {
        users.value = users.value.map((user) =>
            user.id === editingUser.value?.id
                ? {
                      ...user,
                      username: payload.username,
                      email: payload.email,
                      roles: [...payload.roles],
                      status: payload.status,
                      twoFactorEnabled: payload.twoFactorEnabled,
                      mustChangePassword: payload.requirePasswordChange,
                  }
                : user,
        )
        toast.success('Cambios aplicados en esta vista previa')
    } else {
        const nextId = Math.max(0, ...users.value.map((user) => user.id)) + 1
        users.value = [
            {
                id: nextId,
                memberId: member.id,
                memberCode: member.code,
                memberName: member.fullName,
                username: payload.username,
                email: payload.email,
                roles: [...payload.roles],
                status: payload.status,
                twoFactorEnabled: payload.twoFactorEnabled,
                mustChangePassword: payload.requirePasswordChange,
                lastAccessAt: null,
                createdAt: new Date().toISOString(),
            },
            ...users.value,
        ]
        toast.success('Usuario agregado a esta vista previa')
    }

    formOpen.value = false
    editingUser.value = null
}

function toggleBlocked(user: SystemUser) {
    const nextStatus: SystemUserStatus = user.status === 'BLOCKED' ? 'ACTIVE' : 'BLOCKED'
    users.value = users.value.map((item) =>
        item.id === user.id ? { ...item, status: nextStatus } : item,
    )
    toast.success(
        nextStatus === 'BLOCKED'
            ? 'Acceso bloqueado en la vista previa'
            : 'Acceso habilitado en la vista previa',
    )
}

function simulatePasswordReset(user: SystemUser) {
    users.value = users.value.map((item) =>
        item.id === user.id ? { ...item, mustChangePassword: true } : item,
    )
    toast.success(`Restablecimiento preparado para ${user.memberName}`)
}
</script>

<template>
    <component
        :is="embedded ? 'section' : 'main'"
        :class="embedded ? 'w-full' : 'mx-auto w-full max-w-system px-6 pb-20 pt-24 lg:px-10'"
        data-testid="users-page"
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
                    Usuarios
                </h1>
                <p class="mt-3 max-w-2xl text-sm leading-relaxed text-on-surface-variant">
                    Convierte un miembro del directorio en usuario del sistema y administra sus
                    credenciales, roles de acceso y opciones de seguridad.
                </p>
            </div>

            <UiButton type="button" data-testid="users-new-button" @click="openCreate">
                <Plus class="size-4" /> Nuevo usuario
            </UiButton>
        </section>

        <div
            class="mt-6 flex items-start gap-3 rounded border border-primary/25 bg-primary/5 px-4 py-3 text-xs text-on-surface-variant"
        >
            <ShieldCheck class="mt-0.5 size-4 shrink-0 text-primary" />
            <p>
                Esta es una vista visual sin conexión al backend. Los cambios realizados aquí se
                restablecen al recargar la página.
            </p>
        </div>

        <section class="mt-7 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <UiCard class="p-5">
                <UsersRound class="mb-3 size-6 text-primary" />
                <p
                    class="text-[11px] font-semibold uppercase tracking-wider text-on-surface-variant"
                >
                    Usuarios totales
                </p>
                <p class="mt-1 font-display text-3xl font-semibold text-on-surface">
                    {{ stats.total }}
                </p>
                <p class="mt-1 text-xs text-on-surface-variant">Cuentas vinculadas a miembros</p>
            </UiCard>
            <UiCard class="p-5">
                <UserRoundCheck class="mb-3 size-6 text-emerald-400" />
                <p
                    class="text-[11px] font-semibold uppercase tracking-wider text-on-surface-variant"
                >
                    Acceso activo
                </p>
                <p class="mt-1 font-display text-3xl font-semibold text-on-surface">
                    {{ stats.active }}
                </p>
                <p class="mt-1 text-xs text-emerald-400">Pueden iniciar sesión</p>
            </UiCard>
            <UiCard class="p-5">
                <Clock3 class="mb-3 size-6 text-amber-300" />
                <p
                    class="text-[11px] font-semibold uppercase tracking-wider text-on-surface-variant"
                >
                    Invitaciones
                </p>
                <p class="mt-1 font-display text-3xl font-semibold text-on-surface">
                    {{ stats.pending }}
                </p>
                <p class="mt-1 text-xs text-on-surface-variant">Pendientes de primer ingreso</p>
            </UiCard>
            <UiCard class="p-5">
                <LockKeyhole class="mb-3 size-6 text-primary" />
                <p
                    class="text-[11px] font-semibold uppercase tracking-wider text-on-surface-variant"
                >
                    Doble verificación
                </p>
                <p class="mt-1 font-display text-3xl font-semibold text-on-surface">
                    {{ stats.protected }}
                </p>
                <p class="mt-1 text-xs text-on-surface-variant">Cuentas con 2FA</p>
            </UiCard>
        </section>

        <section class="mt-8">
            <DataTable
                :rows="users"
                :columns="columns"
                row-key="id"
                :page-size="10"
                show-search
                search-placeholder="Buscar por miembro, usuario o correo…"
                empty-title="Sin usuarios"
                empty-message="Selecciona un miembro para crear la primera cuenta de acceso."
            >
                <template #toolbar-start="{ total }">
                    <span class="hidden text-xs text-on-surface-variant md:inline">
                        {{ total }} cuenta(s)
                    </span>
                </template>

                <template #toolbar-end>
                    <UiButton variant="outline" size="sm" type="button" @click="openCreate">
                        <UserCog class="size-4" /> Asignar acceso
                    </UiButton>
                </template>

                <template #cell-member="{ row }">
                    <div class="flex min-w-0 items-center gap-3">
                        <span
                            class="flex size-11 shrink-0 items-center justify-center rounded-full border border-primary/25 bg-primary/10 text-xs font-semibold text-primary"
                        >
                            {{ formatInitials((row as SystemUser).memberName) }}
                        </span>
                        <span class="min-w-0">
                            <span
                                class="block truncate font-display text-sm font-semibold text-on-surface"
                            >
                                {{ (row as SystemUser).memberName }}
                            </span>
                            <span class="mt-0.5 block text-[11px] text-on-surface-variant">
                                {{ (row as SystemUser).memberCode }} · Miembro vinculado
                            </span>
                        </span>
                    </div>
                </template>

                <template #cell-account="{ row }">
                    <div class="space-y-1 text-xs">
                        <p class="flex items-center gap-2 font-semibold text-on-surface">
                            <KeyRound class="size-3.5 text-primary" />@{{
                                (row as SystemUser).username
                            }}
                        </p>
                        <p class="flex items-center gap-2 text-on-surface-variant">
                            <Mail class="size-3.5" />{{ (row as SystemUser).email }}
                        </p>
                    </div>
                </template>

                <template #cell-roles="{ row }">
                    <div class="flex flex-wrap gap-1.5">
                        <span
                            v-for="role in (row as SystemUser).roles.slice(0, 2)"
                            :key="role"
                            class="rounded border border-primary/25 bg-primary/10 px-2 py-0.5 text-[10px] font-semibold text-primary"
                        >
                            {{ getSystemRoleLabel(role) }}
                        </span>
                        <span
                            v-if="(row as SystemUser).roles.length > 2"
                            class="rounded border border-outline-variant px-2 py-0.5 text-[10px] text-on-surface-variant"
                        >
                            +{{ (row as SystemUser).roles.length - 2 }}
                        </span>
                    </div>
                </template>

                <template #cell-security="{ row }">
                    <div class="space-y-1 text-xs text-on-surface-variant">
                        <p class="flex items-center gap-2">
                            <CheckCircle2
                                class="size-3.5"
                                :class="
                                    (row as SystemUser).twoFactorEnabled ? 'text-emerald-400' : ''
                                "
                            />
                            {{
                                (row as SystemUser).twoFactorEnabled
                                    ? '2FA habilitado'
                                    : 'Solo contraseña'
                            }}
                        </p>
                        <p v-if="(row as SystemUser).mustChangePassword" class="text-amber-300">
                            Cambio pendiente
                        </p>
                    </div>
                </template>

                <template #cell-lastAccess="{ row }">
                    <p class="text-xs text-on-surface-variant">
                        {{ formatAccessDate((row as SystemUser).lastAccessAt) }}
                    </p>
                </template>

                <template #cell-status="{ row }">
                    <span
                        class="inline-flex rounded border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider"
                        :class="statusTone((row as SystemUser).status)"
                    >
                        {{ getSystemUserStatusLabel((row as SystemUser).status) }}
                    </span>
                </template>

                <template #cell-actions="{ row }">
                    <DropdownMenuRoot>
                        <DropdownMenuTrigger
                            class="flex size-9 items-center justify-center rounded-full text-on-surface-variant hover:bg-surface-container-high hover:text-primary"
                            :aria-label="`Acciones de ${(row as SystemUser).memberName}`"
                        >
                            <MoreVertical class="size-4" />
                        </DropdownMenuTrigger>
                        <DropdownMenuPortal>
                            <DropdownMenuContent
                                :side-offset="6"
                                align="end"
                                class="z-50 w-60 border border-outline-variant bg-surface-container py-1 shadow-xl focus:outline-none"
                            >
                                <DropdownMenuItem
                                    class="flex cursor-pointer items-center gap-3 px-4 py-2.5 text-xs text-on-surface-variant outline-none data-[highlighted]:bg-surface-container-high data-[highlighted]:text-primary"
                                    @select="openEdit(row as SystemUser)"
                                >
                                    <Edit3 class="size-4" /> Editar cuenta
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                    class="flex cursor-pointer items-center gap-3 px-4 py-2.5 text-xs text-on-surface-variant outline-none data-[highlighted]:bg-surface-container-high data-[highlighted]:text-primary"
                                    @select="simulatePasswordReset(row as SystemUser)"
                                >
                                    <RotateCcwKey class="size-4" /> Restablecer contraseña
                                </DropdownMenuItem>
                                <DropdownMenuSeparator class="my-1 h-px bg-outline-variant" />
                                <DropdownMenuItem
                                    class="flex cursor-pointer items-center gap-3 px-4 py-2.5 text-xs outline-none data-[highlighted]:bg-surface-container-high"
                                    :class="
                                        (row as SystemUser).status === 'BLOCKED'
                                            ? 'text-emerald-400'
                                            : 'text-destructive'
                                    "
                                    @select="toggleBlocked(row as SystemUser)"
                                >
                                    <CheckCircle2
                                        v-if="(row as SystemUser).status === 'BLOCKED'"
                                        class="size-4"
                                    />
                                    <Ban v-else class="size-4" />
                                    {{
                                        (row as SystemUser).status === 'BLOCKED'
                                            ? 'Habilitar acceso'
                                            : 'Bloquear acceso'
                                    }}
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenuPortal>
                    </DropdownMenuRoot>
                </template>
            </DataTable>
        </section>

        <UserFormDrawer
            :open="formOpen"
            :user="editingUser"
            :members="availableMembers"
            @close="formOpen = false"
            @save="saveUser"
        />
    </component>
</template>
