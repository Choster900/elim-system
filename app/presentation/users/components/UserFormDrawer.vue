<script setup lang="ts">
import { Clock3, KeyRound, MailCheck, Save, ShieldCheck, UserRound, X } from '@lucide/vue'
import { systemUserStatusOptions } from '../constants/user.constants'
import type {
    SystemRole,
    SystemUser,
    SystemUserStatus,
    UserFormPayload,
    UserMemberOption,
    UserRoleOption,
} from '../interfaces/user.interface'

interface FormState {
    memberId: number | null
    username: string
    email: string
    roles: SystemRole[]
    status: SystemUserStatus
    requirePasswordChange: boolean
    invitationExpiresInHours: number
}

const props = defineProps<{
    open: boolean
    user: SystemUser | null
    members: UserMemberOption[]
    roleOptions: UserRoleOption[]
    defaultInvitationExpiresInHours: number
    saving?: boolean
}>()

const emit = defineEmits<{
    close: []
    save: [payload: UserFormPayload]
}>()

const invitationExpirationOptions = [
    { value: 1, label: '1 hora' },
    { value: 6, label: '6 horas' },
    { value: 12, label: '12 horas' },
    { value: 24, label: '24 horas' },
    { value: 48, label: '2 días' },
    { value: 72, label: '3 días' },
    { value: 168, label: '7 días' },
]

function emptyForm(): FormState {
    return {
        memberId: null,
        username: '',
        email: '',
        roles: props.roleOptions[0] ? [props.roleOptions[0].value] : [],
        status: 'ACTIVE',
        requirePasswordChange: true,
        invitationExpiresInHours: props.defaultInvitationExpiresInHours || 24,
    }
}

const form = reactive<FormState>(emptyForm())
const errors = reactive({
    member: '',
    username: '',
    email: '',
    roles: '',
})

const memberSelectOptions = computed(() =>
    props.members.map((member) => ({
        ...member,
        value: member.id,
        label: member.fullName,
        description: `${member.code} · ${member.communityRoles.join(', ') || 'Miembro'}`,
    })),
)

const selectedMember = computed(() => props.members.find((member) => member.id === form.memberId))
const editableStatusOptions = computed(() => {
    if (props.user?.status === 'INVITED') {
        return systemUserStatusOptions.filter(({ value }) => value !== 'ACTIVE')
    }
    return systemUserStatusOptions.filter(({ value }) => value !== 'INVITED')
})

function suggestedUsername(fullName: string) {
    const parts = fullName
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
        .split(/\s+/)
        .filter(Boolean)
    if (parts.length < 2) return parts[0] ?? ''
    return `${parts[0]?.charAt(0) ?? ''}${parts.at(-1) ?? ''}`
}

function clearErrors() {
    for (const key of Object.keys(errors) as (keyof typeof errors)[]) errors[key] = ''
}

function resetForm() {
    Object.assign(form, emptyForm())
    clearErrors()
    if (!props.user) return
    Object.assign(form, {
        memberId: props.user.memberId,
        username: props.user.username,
        email: props.user.email,
        roles: [...props.user.roles],
        status: props.user.status,
        requirePasswordChange: props.user.mustChangePassword,
    })
}

watch(
    () => props.open,
    (isOpen) => isOpen && resetForm(),
    { immediate: true },
)

watch(
    () => props.roleOptions,
    (roles) => {
        if (props.user || form.roles.length || !roles[0]) return
        form.roles = [roles[0].value]
    },
)

watch(
    () => form.memberId,
    (memberId, previousMemberId) => {
        if (props.user || !memberId || memberId === previousMemberId) return
        const member = props.members.find((item) => item.id === memberId)
        if (!member) return
        form.username = suggestedUsername(member.fullName)
        form.email = member.email ?? ''
        errors.member = ''
    },
)

function validate() {
    clearErrors()
    if (!props.user && !form.memberId) {
        errors.member = 'Selecciona el miembro que recibirá acceso.'
    }
    if (!/^[a-z0-9._-]{4,100}$/.test(form.username.trim().toLowerCase())) {
        errors.username = 'Usa de 4 a 100 caracteres: letras, números, punto, guion o guion bajo.'
    }
    if (!/^\S+@\S+\.\S+$/.test(form.email.trim())) {
        errors.email = 'Ingresa un correo válido.'
    }
    if (!form.roles.length) errors.roles = 'Asigna al menos un rol de acceso.'
    return !Object.values(errors).some(Boolean)
}

function submit() {
    if (!validate() || (!props.user && !form.memberId) || props.saving) return
    emit('save', {
        memberId: form.memberId,
        username: form.username.trim().toLowerCase(),
        email: form.email.trim().toLowerCase(),
        roles: form.roles,
        status: form.status,
        requirePasswordChange: form.requirePasswordChange,
        twoFactorEnabled: props.user?.twoFactorEnabled ?? false,
        invitationExpiresInHours: form.invitationExpiresInHours,
    })
}

const inputClass =
    'h-11 w-full rounded border border-outline-variant bg-surface px-3 text-sm text-on-surface outline-none placeholder:text-on-surface-variant/60 focus:border-primary focus:ring-1 focus:ring-primary'
const labelClass =
    'mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-on-surface-variant'
</script>

<template>
    <template v-if="open">
        <div
            class="fixed inset-0 z-[60] bg-black/65 backdrop-blur-sm"
            data-testid="user-form-overlay"
            @click="emit('close')"
        />
        <aside
            class="user-form-drawer fixed inset-y-0 right-0 z-[61] flex w-[620px] max-w-[96vw] flex-col bg-surface-container-low shadow-2xl"
            data-testid="user-form-drawer"
        >
            <header
                class="flex items-start justify-between border-b border-outline-variant px-6 py-5 sm:px-8"
            >
                <div class="flex items-center gap-4">
                    <div
                        class="flex size-11 items-center justify-center rounded-full bg-primary/15 text-primary"
                    >
                        <KeyRound class="size-5" />
                    </div>
                    <div>
                        <p class="text-[11px] font-bold uppercase tracking-[0.2em] text-primary">
                            Comunidad · Acceso al sistema
                        </p>
                        <h2 class="mt-1 font-display text-2xl font-semibold text-on-surface">
                            {{ user ? 'Editar usuario' : 'Crear usuario' }}
                        </h2>
                    </div>
                </div>
                <button
                    type="button"
                    class="text-on-surface-variant hover:text-on-surface"
                    aria-label="Cerrar formulario de usuario"
                    @click="emit('close')"
                >
                    <X class="size-5" />
                </button>
            </header>

            <form class="min-h-0 flex-1 overflow-y-auto px-6 py-6 sm:px-8" @submit.prevent="submit">
                <section>
                    <div class="flex items-center gap-3">
                        <span
                            class="flex size-8 items-center justify-center rounded-full bg-primary/10 text-primary"
                        >
                            <UserRound class="size-4" />
                        </span>
                        <div>
                            <h3 class="font-display text-lg font-semibold text-on-surface">
                                Miembro vinculado
                            </h3>
                            <p class="text-xs text-on-surface-variant">
                                Cada miembro puede tener una sola cuenta del sistema.
                            </p>
                        </div>
                    </div>

                    <div class="mt-5">
                        <label :class="labelClass" for="user-member-select">Miembro *</label>
                        <UiSearchSelect
                            id="user-member-select"
                            v-model="form.memberId"
                            :options="memberSelectOptions"
                            option-description="description"
                            placeholder="Busca por nombre, código o rol"
                            search-placeholder="Buscar miembro..."
                            empty-message="No hay miembros disponibles"
                            :disabled="!!user"
                            :invalid="!!errors.member"
                            content-class="!z-[80]"
                            data-testid="user-member-select"
                        >
                            <template #item="{ option }">
                                <p class="font-medium text-on-surface">{{ option.fullName }}</p>
                                <p class="mt-0.5 text-[11px] text-on-surface-variant">
                                    {{ option.code }} ·
                                    {{ option.communityRoles.join(', ') || 'Miembro' }}
                                </p>
                            </template>
                        </UiSearchSelect>
                        <p v-if="errors.member" class="mt-1.5 text-xs text-destructive">
                            {{ errors.member }}
                        </p>

                        <div
                            v-if="selectedMember"
                            class="mt-3 flex items-center gap-3 rounded border border-primary/25 bg-primary/5 p-3"
                        >
                            <div
                                class="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary/15 text-xs font-bold text-primary"
                            >
                                {{
                                    selectedMember.fullName
                                        .split(' ')
                                        .map((part) => part[0])
                                        .slice(0, 2)
                                        .join('')
                                }}
                            </div>
                            <div class="min-w-0 text-xs">
                                <p class="font-semibold text-on-surface">
                                    {{ selectedMember.fullName }}
                                </p>
                                <p class="mt-0.5 truncate text-on-surface-variant">
                                    {{ selectedMember.email || 'Sin correo registrado' }} ·
                                    {{ selectedMember.phone || 'Sin teléfono' }}
                                </p>
                            </div>
                        </div>
                    </div>
                </section>

                <UiSeparator class="my-7" />

                <section>
                    <h3 class="font-display text-lg font-semibold text-on-surface">Cuenta</h3>
                    <p class="mt-1 text-xs text-on-surface-variant">
                        El correo será el identificador principal para iniciar sesión.
                    </p>
                    <div class="mt-4 grid gap-4 sm:grid-cols-2">
                        <div>
                            <label :class="labelClass" for="user-username">Usuario *</label>
                            <input
                                id="user-username"
                                v-model="form.username"
                                :class="[inputClass, errors.username ? 'border-destructive' : '']"
                                autocomplete="off"
                                placeholder="mlopez"
                                maxlength="100"
                                data-testid="user-username"
                            />
                            <p v-if="errors.username" class="mt-1 text-xs text-destructive">
                                {{ errors.username }}
                            </p>
                        </div>
                        <div>
                            <label :class="labelClass" for="user-email">Correo de acceso *</label>
                            <input
                                id="user-email"
                                v-model="form.email"
                                type="email"
                                :class="[inputClass, errors.email ? 'border-destructive' : '']"
                                placeholder="persona@correo.com"
                                data-testid="user-email"
                            />
                            <p v-if="errors.email" class="mt-1 text-xs text-destructive">
                                {{ errors.email }}
                            </p>
                        </div>
                    </div>

                    <div
                        v-if="!user"
                        class="mt-4 rounded border border-primary/25 bg-primary/5 p-4"
                    >
                        <div class="flex items-start gap-3">
                            <MailCheck class="mt-0.5 size-5 shrink-0 text-primary" />
                            <div>
                                <p class="text-sm font-semibold text-on-surface">
                                    Credenciales enviadas por correo
                                </p>
                                <p class="mt-1 text-xs leading-relaxed text-on-surface-variant">
                                    El servidor generará una contraseña temporal segura y un enlace
                                    de invitación de un solo uso. Ninguna contraseña se mostrará ni
                                    se devolverá en esta pantalla.
                                </p>
                            </div>
                        </div>
                        <div class="mt-4">
                            <span :class="labelClass">Vigencia del enlace</span>
                            <UiSearchSelect
                                v-model="form.invitationExpiresInHours"
                                :options="invitationExpirationOptions"
                                :searchable="false"
                                content-class="!z-[80]"
                            />
                        </div>
                    </div>
                </section>

                <UiSeparator class="my-7" />

                <section>
                    <div class="flex items-center gap-3">
                        <ShieldCheck class="size-5 text-primary" />
                        <h3 class="font-display text-lg font-semibold text-on-surface">
                            Acceso y seguridad
                        </h3>
                    </div>
                    <div class="mt-4 space-y-4">
                        <div>
                            <span :class="labelClass">Roles del sistema *</span>
                            <UiSearchSelect
                                v-model="form.roles"
                                :options="roleOptions"
                                multiple
                                :max-items="8"
                                option-description="description"
                                placeholder="Selecciona uno o más roles"
                                search-placeholder="Buscar rol..."
                                :invalid="!!errors.roles"
                                content-class="!z-[80]"
                            />
                            <p v-if="errors.roles" class="mt-1 text-xs text-destructive">
                                {{ errors.roles }}
                            </p>
                        </div>
                        <div v-if="user">
                            <span :class="labelClass">Estado</span>
                            <UiSearchSelect
                                v-model="form.status"
                                :options="editableStatusOptions"
                                :searchable="false"
                                content-class="!z-[80]"
                            />
                        </div>

                        <div
                            v-if="!user || user.status === 'INVITED'"
                            class="rounded border border-outline-variant bg-surface p-4"
                        >
                            <label class="flex cursor-pointer items-start gap-3">
                                <input
                                    v-model="form.requirePasswordChange"
                                    type="checkbox"
                                    class="mt-0.5 size-4 accent-primary"
                                />
                                <span>
                                    <span class="block text-sm font-medium text-on-surface">
                                        Forzar cambio de contraseña temporal
                                    </span>
                                    <span class="mt-0.5 block text-xs text-on-surface-variant">
                                        Si está activo, al ingresar con la contraseña temporal solo
                                        podrá acceder a la pantalla para crear una contraseña
                                        propia.
                                    </span>
                                </span>
                            </label>
                        </div>
                        <div
                            v-else
                            class="rounded border border-outline-variant bg-surface px-4 py-3 text-xs leading-relaxed text-on-surface-variant"
                        >
                            Para volver a exigir una contraseña propia, usa
                            <strong>Restablecer y reenviar</strong> desde las acciones del usuario.
                        </div>

                        <div
                            v-if="!user"
                            class="flex items-start gap-3 rounded border border-outline-variant px-4 py-3"
                        >
                            <Clock3 class="mt-0.5 size-4 shrink-0 text-primary" />
                            <p class="text-xs leading-relaxed text-on-surface-variant">
                                La cuenta quedará como invitada hasta que el usuario abra el enlace
                                y valide la contraseña temporal dentro del tiempo configurado.
                            </p>
                        </div>
                    </div>
                </section>
            </form>

            <footer
                class="flex flex-col-reverse gap-3 border-t border-outline-variant bg-surface px-6 py-4 sm:flex-row sm:justify-end sm:px-8"
            >
                <UiButton
                    variant="outline"
                    type="button"
                    class="sm:w-28"
                    :disabled="saving"
                    @click="emit('close')"
                >
                    Cancelar
                </UiButton>
                <UiButton
                    type="button"
                    class="sm:min-w-44"
                    :loading="saving"
                    data-testid="user-save-button"
                    @click="submit"
                >
                    <Save class="size-4" /> {{ user ? 'Guardar cambios' : 'Crear y enviar' }}
                </UiButton>
            </footer>
        </aside>
    </template>
</template>

<style scoped>
.user-form-drawer {
    animation: user-form-in 0.25s ease;
}

@keyframes user-form-in {
    from {
        transform: translateX(28px);
        opacity: 0;
    }
    to {
        transform: translateX(0);
        opacity: 1;
    }
}
</style>
