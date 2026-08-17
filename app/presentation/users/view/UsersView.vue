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
    RefreshCw,
    RotateCcwKey,
    UserCog,
    UserRoundCheck,
    UsersRound,
    X,
} from '@lucide/vue'
import {
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuPortal,
    DropdownMenuRoot,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from 'radix-vue'
import { routePermissionCodes } from '~/presentation/auth/constants/permission.constants'
import { useAuthStore } from '~/presentation/auth/stores/auth.store'
import DataTable, {
    type DataTableColumn,
} from '~/presentation/shared/components/DataTable/DataTable.vue'
import { useAppToast } from '~/presentation/shared/composables/useAppToast'
import { resolveHttpErrorMessage } from '~/utils/http/resolve-http-error-message.util'
import { formatInitials } from '~/utils/string/text-format.util'
import UserFormDrawer from '../components/UserFormDrawer.vue'
import {
    useCreateUserMutation,
    useResetUserPasswordMutation,
    useUpdateUserMutation,
    useUpdateUserStatusMutation,
} from '../composables/useUserMutations'
import { useUserCatalogQuery, useUsersQuery } from '../composables/useUsersQuery'
import { getSystemUserStatusLabel, systemUserStatusOptions } from '../constants/user.constants'
import type { SystemUser, SystemUserStatus, UserFormPayload } from '../interfaces/user.interface'

defineOptions({ name: 'UsersView' })

withDefaults(defineProps<{ embedded?: boolean }>(), { embedded: false })

const toast = useAppToast()
const authStore = useAuthStore()
const usersQuery = useUsersQuery()
const catalogQuery = useUserCatalogQuery()
const createMutation = useCreateUserMutation()
const updateMutation = useUpdateUserMutation()
const statusMutation = useUpdateUserStatusMutation()
const resetMutation = useResetUserPasswordMutation()

const users = computed(() => usersQuery.data.value ?? [])
const catalog = computed(() => catalogQuery.data.value)
const roleOptions = computed(() => catalog.value?.roles ?? [])
const defaultInvitationExpiresInHours = computed(
    () => catalog.value?.defaultInvitationExpiresInHours ?? 24,
)
const isLoading = computed(() => usersQuery.isPending.value || catalogQuery.isPending.value)
const isSaving = computed(() => createMutation.isPending.value || updateMutation.isPending.value)
const loadError = computed(() => {
    const error = usersQuery.error.value ?? catalogQuery.error.value
    return error ? resolveHttpErrorMessage(error, 'No fue posible cargar los usuarios') : ''
})

const canCreate = computed(() => authStore.hasPermission(routePermissionCodes.usersCreate))
const canUpdate = computed(() => authStore.hasPermission(routePermissionCodes.usersUpdate))
const canBlock = computed(() => authStore.hasPermission(routePermissionCodes.usersBlock))
const hasActions = computed(() => canUpdate.value || canBlock.value)

const formOpen = ref(false)
const editingUser = ref<SystemUser | null>(null)
const resetTarget = ref<SystemUser | null>(null)
const resetRequirePasswordChange = ref(true)
const resetExpiresInHours = ref(24)

const stats = computed(() => ({
    total: users.value.length,
    active: users.value.filter((user) => user.status === 'ACTIVE').length,
    pending: users.value.filter((user) => user.status === 'INVITED').length,
    changePending: users.value.filter((user) => user.mustChangePassword).length,
}))

const availableMembers = computed(() =>
    (catalog.value?.members ?? []).filter(
        (member) => !member.assignedUserId || member.assignedUserId === editingUser.value?.id,
    ),
)

const columns = computed<DataTableColumn<SystemUser>[]>(() => [
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
        filterOptions: roleOptions.value,
        accessor: (row) => row.roles.join(', '),
        width: '260px',
    },
    {
        key: 'security',
        label: 'Seguridad',
        accessor: (row) => (row.mustChangePassword ? 'Cambio pendiente' : 'Contraseña vigente'),
        width: '190px',
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
    ...(hasActions.value
        ? ([
              { key: 'actions', label: '', width: '70px', align: 'right' },
          ] as DataTableColumn<SystemUser>[])
        : []),
])

function getRoleLabel(role: string) {
    return roleOptions.value.find((option) => option.value === role)?.label ?? role
}

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

function formatInvitationDate(value: string | null) {
    if (!value) return null
    return new Intl.DateTimeFormat('es-SV', {
        day: '2-digit',
        month: 'short',
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

async function saveUser(payload: UserFormPayload) {
    try {
        if (editingUser.value) {
            await updateMutation.mutateAsync({ id: editingUser.value.id, payload })
            toast.success('Usuario actualizado correctamente')
        } else {
            await createMutation.mutateAsync(payload)
            toast.success('Usuario creado; la invitación fue enviada por correo')
        }
        formOpen.value = false
        editingUser.value = null
    } catch (error) {
        toast.error(resolveHttpErrorMessage(error, 'No fue posible guardar el usuario'))
    }
}

async function toggleBlocked(user: SystemUser) {
    const nextStatus = user.status === 'BLOCKED' ? 'ACTIVE' : 'BLOCKED'
    try {
        await statusMutation.mutateAsync({ id: user.id, status: nextStatus })
        toast.success(nextStatus === 'BLOCKED' ? 'Acceso bloqueado' : 'Acceso habilitado')
    } catch (error) {
        toast.error(resolveHttpErrorMessage(error, 'No fue posible cambiar el acceso'))
    }
}

function openPasswordReset(user: SystemUser) {
    resetTarget.value = user
    resetRequirePasswordChange.value = true
    resetExpiresInHours.value = defaultInvitationExpiresInHours.value
}

async function confirmPasswordReset() {
    if (!resetTarget.value) return
    try {
        await resetMutation.mutateAsync({
            id: resetTarget.value.id,
            payload: {
                requirePasswordChange: resetRequirePasswordChange.value,
                invitationExpiresInHours: resetExpiresInHours.value,
            },
        })
        toast.success('Nueva contraseña temporal e invitación enviadas por correo')
        resetTarget.value = null
    } catch (error) {
        toast.error(resolveHttpErrorMessage(error, 'No fue posible restablecer el acceso'))
    }
}

function retryQueries() {
    void Promise.all([usersQuery.refetch(), catalogQuery.refetch()])
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
                    Vincula miembros, asigna roles y entrega credenciales temporales mediante una
                    invitación segura por correo.
                </p>
            </div>

            <UiButton
                v-if="canCreate"
                type="button"
                data-testid="users-new-button"
                @click="openCreate"
            >
                <Plus class="size-4" /> Nuevo usuario
            </UiButton>
        </section>

        <div
            v-if="loadError"
            class="mt-6 flex items-center justify-between gap-4 rounded border border-destructive/35 bg-destructive/10 px-4 py-3"
        >
            <p class="text-sm text-destructive">{{ loadError }}</p>
            <UiButton variant="outline" size="sm" type="button" @click="retryQueries">
                <RefreshCw class="size-4" /> Reintentar
            </UiButton>
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
                <p class="mt-1 text-xs text-on-surface-variant">Cuentas registradas</p>
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
                    Cambio requerido
                </p>
                <p class="mt-1 font-display text-3xl font-semibold text-on-surface">
                    {{ stats.changePending }}
                </p>
                <p class="mt-1 text-xs text-on-surface-variant">Contraseña propia pendiente</p>
            </UiCard>
        </section>

        <section class="mt-8">
            <DataTable
                :rows="users"
                :columns="columns"
                row-key="id"
                :page-size="10"
                :loading="isLoading"
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

                <template v-if="canCreate" #toolbar-end>
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
                                {{ (row as SystemUser).memberCode }}
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
                            {{ getRoleLabel(role) }}
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
                        <p v-if="(row as SystemUser).mustChangePassword" class="text-amber-300">
                            Cambio obligatorio
                        </p>
                        <p v-else>Contraseña vigente</p>
                        <p v-if="(row as SystemUser).status === 'INVITED'" class="text-[11px]">
                            Vence:
                            {{
                                formatInvitationDate((row as SystemUser).invitationExpiresAt) ||
                                'sin fecha'
                            }}
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

                <template v-if="hasActions" #cell-actions="{ row }">
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
                                    v-if="canUpdate"
                                    class="flex cursor-pointer items-center gap-3 px-4 py-2.5 text-xs text-on-surface-variant outline-none data-[highlighted]:bg-surface-container-high data-[highlighted]:text-primary"
                                    @select="openEdit(row as SystemUser)"
                                >
                                    <Edit3 class="size-4" /> Editar cuenta
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                    v-if="canUpdate"
                                    class="flex cursor-pointer items-center gap-3 px-4 py-2.5 text-xs text-on-surface-variant outline-none data-[highlighted]:bg-surface-container-high data-[highlighted]:text-primary"
                                    @select="openPasswordReset(row as SystemUser)"
                                >
                                    <RotateCcwKey class="size-4" /> Restablecer y reenviar
                                </DropdownMenuItem>
                                <DropdownMenuSeparator
                                    v-if="canUpdate && canBlock"
                                    class="my-1 h-px bg-outline-variant"
                                />
                                <DropdownMenuItem
                                    v-if="canBlock"
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
            :role-options="roleOptions"
            :default-invitation-expires-in-hours="defaultInvitationExpiresInHours"
            :saving="isSaving"
            @close="formOpen = false"
            @save="saveUser"
        />

        <template v-if="resetTarget">
            <div class="fixed inset-0 z-[70] bg-black/70 backdrop-blur-sm" />
            <section
                role="dialog"
                aria-modal="true"
                aria-labelledby="reset-access-title"
                class="fixed left-1/2 top-1/2 z-[71] w-[520px] max-w-[calc(100vw-2rem)] -translate-x-1/2 -translate-y-1/2 rounded border border-outline-variant bg-surface-container p-6 shadow-2xl"
            >
                <div class="flex items-start justify-between gap-4">
                    <div>
                        <p class="text-[11px] font-semibold uppercase tracking-widest text-primary">
                            Seguridad
                        </p>
                        <h2
                            id="reset-access-title"
                            class="mt-1 font-display text-2xl text-on-surface"
                        >
                            Restablecer acceso
                        </h2>
                    </div>
                    <button
                        type="button"
                        class="text-on-surface-variant hover:text-on-surface"
                        aria-label="Cerrar"
                        @click="resetTarget = null"
                    >
                        <X class="size-5" />
                    </button>
                </div>
                <p class="mt-4 text-sm leading-relaxed text-on-surface-variant">
                    Se invalidarán las sesiones de <strong>{{ resetTarget.memberName }}</strong> y
                    se enviará una nueva contraseña temporal con un enlace de un solo uso.
                </p>
                <div class="mt-5 space-y-4 rounded border border-outline-variant bg-surface p-4">
                    <label class="flex items-start gap-3">
                        <input
                            v-model="resetRequirePasswordChange"
                            type="checkbox"
                            class="mt-0.5 size-4 accent-primary"
                        />
                        <span class="text-sm text-on-surface">
                            Forzar cambio de contraseña después de ingresar
                        </span>
                    </label>
                    <label class="block">
                        <span
                            class="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-on-surface-variant"
                        >
                            Vigencia del nuevo enlace
                        </span>
                        <select
                            v-model.number="resetExpiresInHours"
                            class="h-11 w-full rounded border border-outline-variant bg-surface-container px-3 text-sm text-on-surface outline-none focus:border-primary"
                        >
                            <option :value="1">1 hora</option>
                            <option :value="6">6 horas</option>
                            <option :value="12">12 horas</option>
                            <option :value="24">24 horas</option>
                            <option :value="48">2 días</option>
                            <option :value="72">3 días</option>
                            <option :value="168">7 días</option>
                        </select>
                    </label>
                </div>
                <div class="mt-6 flex justify-end gap-3">
                    <UiButton
                        variant="outline"
                        type="button"
                        :disabled="resetMutation.isPending.value"
                        @click="resetTarget = null"
                    >
                        Cancelar
                    </UiButton>
                    <UiButton
                        type="button"
                        :loading="resetMutation.isPending.value"
                        @click="confirmPasswordReset"
                    >
                        <Mail class="size-4" /> Generar y enviar
                    </UiButton>
                </div>
            </section>
        </template>
    </component>
</template>
