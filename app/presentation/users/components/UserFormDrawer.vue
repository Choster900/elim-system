<script setup lang="ts">
import { Eye, EyeOff, KeyRound, Save, ShieldCheck, UserRound, X } from '@lucide/vue'
import { systemRoleOptions, systemUserStatusOptions } from '../constants/user.constants'
import type {
    SystemRole,
    SystemUser,
    SystemUserStatus,
    UserFormPayload,
    UserMemberOption,
} from '../interfaces/user.interface'

interface FormState {
    memberId: number | null
    username: string
    email: string
    password: string
    confirmPassword: string
    roles: SystemRole[]
    status: SystemUserStatus
    requirePasswordChange: boolean
    twoFactorEnabled: boolean
    sendWelcomeEmail: boolean
}

const props = defineProps<{
    open: boolean
    user: SystemUser | null
    members: UserMemberOption[]
}>()

const emit = defineEmits<{
    close: []
    save: [payload: UserFormPayload]
}>()

const showPassword = ref(false)
const showConfirmPassword = ref(false)

function emptyForm(): FormState {
    return {
        memberId: null,
        username: '',
        email: '',
        password: '',
        confirmPassword: '',
        roles: ['READ_ONLY'],
        status: 'ACTIVE',
        requirePasswordChange: true,
        twoFactorEnabled: false,
        sendWelcomeEmail: true,
    }
}

const form = reactive<FormState>(emptyForm())
const errors = reactive({
    member: '',
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    roles: '',
})

const memberSelectOptions = computed(() =>
    props.members.map((member) => ({
        ...member,
        value: member.id,
        label: member.fullName,
        description: `${member.code} · ${member.communityRoles.join(', ')}`,
    })),
)

const selectedMember = computed(() => props.members.find((member) => member.id === form.memberId))

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
    showPassword.value = false
    showConfirmPassword.value = false

    if (!props.user) return
    Object.assign(form, {
        memberId: props.user.memberId,
        username: props.user.username,
        email: props.user.email,
        roles: [...props.user.roles],
        status: props.user.status,
        requirePasswordChange: props.user.mustChangePassword,
        twoFactorEnabled: props.user.twoFactorEnabled,
        sendWelcomeEmail: false,
    })
}

watch(
    () => props.open,
    (isOpen) => isOpen && resetForm(),
    { immediate: true },
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
    if (!form.memberId) errors.member = 'Selecciona el miembro que recibirá acceso.'
    if (form.username.trim().length < 4) {
        errors.username = 'Usa al menos 4 caracteres.'
    }
    if (!/^\S+@\S+\.\S+$/.test(form.email.trim())) {
        errors.email = 'Ingresa un correo válido.'
    }
    if (!props.user && form.password.length < 8) {
        errors.password = 'La contraseña debe tener al menos 8 caracteres.'
    }
    if (form.password && form.password.length < 8) {
        errors.password = 'La contraseña debe tener al menos 8 caracteres.'
    }
    if (form.password !== form.confirmPassword) {
        errors.confirmPassword = 'Las contraseñas no coinciden.'
    }
    if (!form.roles.length) errors.roles = 'Asigna al menos un rol de acceso.'
    return !Object.values(errors).some(Boolean)
}

function submit() {
    if (!validate() || !form.memberId) return
    emit('save', {
        memberId: form.memberId,
        username: form.username.trim().toLowerCase(),
        email: form.email.trim().toLowerCase(),
        password: form.password,
        roles: form.roles,
        status: form.status,
        requirePasswordChange: form.requirePasswordChange,
        twoFactorEnabled: form.twoFactorEnabled,
        sendWelcomeEmail: form.sendWelcomeEmail,
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
                                La cuenta usa los datos del miembro, pero mantiene acceso
                                independiente.
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
                                <p class="font-medium text-on-surface">
                                    {{ option.fullName }}
                                </p>
                                <p class="mt-0.5 text-[11px] text-on-surface-variant">
                                    {{ option.code }} · {{ option.communityRoles.join(', ') }}
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
                                    {{ selectedMember.phone }}
                                </p>
                            </div>
                        </div>
                    </div>
                </section>

                <UiSeparator class="my-7" />

                <section>
                    <h3 class="font-display text-lg font-semibold text-on-surface">Credenciales</h3>
                    <p class="mt-1 text-xs text-on-surface-variant">
                        El nombre de usuario y la contraseña serán exclusivos para iniciar sesión.
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
                        <div>
                            <label :class="labelClass" for="user-password">
                                {{ user ? 'Nueva contraseña' : 'Contraseña *' }}
                            </label>
                            <div class="relative">
                                <input
                                    id="user-password"
                                    v-model="form.password"
                                    :type="showPassword ? 'text' : 'password'"
                                    :class="[
                                        inputClass,
                                        'pr-11',
                                        errors.password ? 'border-destructive' : '',
                                    ]"
                                    autocomplete="new-password"
                                    :placeholder="
                                        user
                                            ? 'Déjala vacía para conservarla'
                                            : 'Mínimo 8 caracteres'
                                    "
                                    data-testid="user-password"
                                />
                                <button
                                    type="button"
                                    class="absolute right-0 top-0 flex size-11 items-center justify-center text-on-surface-variant hover:text-primary"
                                    :aria-label="
                                        showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'
                                    "
                                    @click="showPassword = !showPassword"
                                >
                                    <EyeOff v-if="showPassword" class="size-4" />
                                    <Eye v-else class="size-4" />
                                </button>
                            </div>
                            <p v-if="errors.password" class="mt-1 text-xs text-destructive">
                                {{ errors.password }}
                            </p>
                        </div>
                        <div>
                            <label :class="labelClass" for="user-confirm-password">
                                Confirmar contraseña{{ user ? '' : ' *' }}
                            </label>
                            <div class="relative">
                                <input
                                    id="user-confirm-password"
                                    v-model="form.confirmPassword"
                                    :type="showConfirmPassword ? 'text' : 'password'"
                                    :class="[
                                        inputClass,
                                        'pr-11',
                                        errors.confirmPassword ? 'border-destructive' : '',
                                    ]"
                                    autocomplete="new-password"
                                    placeholder="Repite la contraseña"
                                    data-testid="user-confirm-password"
                                />
                                <button
                                    type="button"
                                    class="absolute right-0 top-0 flex size-11 items-center justify-center text-on-surface-variant hover:text-primary"
                                    :aria-label="
                                        showConfirmPassword
                                            ? 'Ocultar confirmación'
                                            : 'Mostrar confirmación'
                                    "
                                    @click="showConfirmPassword = !showConfirmPassword"
                                >
                                    <EyeOff v-if="showConfirmPassword" class="size-4" />
                                    <Eye v-else class="size-4" />
                                </button>
                            </div>
                            <p v-if="errors.confirmPassword" class="mt-1 text-xs text-destructive">
                                {{ errors.confirmPassword }}
                            </p>
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
                                :options="systemRoleOptions"
                                multiple
                                :max-items="3"
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
                        <div>
                            <span :class="labelClass">Estado inicial</span>
                            <UiSearchSelect
                                v-model="form.status"
                                :options="systemUserStatusOptions"
                                :searchable="false"
                                content-class="!z-[80]"
                            />
                        </div>

                        <div
                            class="grid gap-3 rounded border border-outline-variant bg-surface p-4"
                        >
                            <label class="flex cursor-pointer items-start gap-3">
                                <input
                                    v-model="form.requirePasswordChange"
                                    type="checkbox"
                                    class="mt-0.5 size-4 accent-primary"
                                />
                                <span>
                                    <span class="block text-sm font-medium text-on-surface">
                                        Cambiar contraseña en el primer acceso
                                    </span>
                                    <span class="mt-0.5 block text-xs text-on-surface-variant">
                                        Recomendado cuando otra persona entrega la contraseña
                                        temporal.
                                    </span>
                                </span>
                            </label>
                            <label class="flex cursor-pointer items-start gap-3">
                                <input
                                    v-model="form.twoFactorEnabled"
                                    type="checkbox"
                                    class="mt-0.5 size-4 accent-primary"
                                />
                                <span>
                                    <span class="block text-sm font-medium text-on-surface">
                                        Requerir verificación en dos pasos
                                    </span>
                                    <span class="mt-0.5 block text-xs text-on-surface-variant">
                                        Añade una segunda validación al iniciar sesión.
                                    </span>
                                </span>
                            </label>
                            <label v-if="!user" class="flex cursor-pointer items-start gap-3">
                                <input
                                    v-model="form.sendWelcomeEmail"
                                    type="checkbox"
                                    class="mt-0.5 size-4 accent-primary"
                                />
                                <span>
                                    <span class="block text-sm font-medium text-on-surface">
                                        Enviar correo de bienvenida
                                    </span>
                                    <span class="mt-0.5 block text-xs text-on-surface-variant">
                                        Notifica al miembro que su acceso está listo.
                                    </span>
                                </span>
                            </label>
                        </div>
                    </div>
                </section>
            </form>

            <footer
                class="flex flex-col-reverse gap-3 border-t border-outline-variant bg-surface px-6 py-4 sm:flex-row sm:justify-end sm:px-8"
            >
                <UiButton variant="outline" type="button" class="sm:w-28" @click="emit('close')">
                    Cancelar
                </UiButton>
                <UiButton
                    type="button"
                    class="sm:min-w-44"
                    data-testid="user-save-button"
                    @click="submit"
                >
                    <Save class="size-4" /> {{ user ? 'Guardar cambios' : 'Crear usuario' }}
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
