<script setup lang="ts">
import { Check, LockKeyhole, Save, Search, ShieldCheck, X } from '@lucide/vue'
import { accessStatusOptions } from '../constants/access-control.constants'
import type {
    AccessPermission,
    AccessRecordStatus,
    AccessRole,
    RoleFormPayload,
} from '../interfaces/access-control.interface'

interface RoleFormState {
    name: string
    code: string
    description: string
    status: AccessRecordStatus
    permissionIds: number[]
}

const props = defineProps<{
    open: boolean
    role: AccessRole | null
    permissions: AccessPermission[]
}>()

const emit = defineEmits<{
    close: []
    save: [payload: RoleFormPayload]
}>()

const form = reactive<RoleFormState>({
    name: '',
    code: '',
    description: '',
    status: 'ACTIVE',
    permissionIds: [],
})
const errors = reactive({ name: '', code: '', permissions: '' })
const permissionSearch = ref('')
const codeWasEdited = ref(false)

const isProtectedRole = computed(() => !!props.role?.isSystem)

const filteredPermissions = computed(() => {
    const needle = permissionSearch.value.trim().toLocaleLowerCase('es')
    if (!needle) return props.permissions
    return props.permissions.filter((permission) =>
        [permission.name, permission.code, permission.module, permission.description]
            .join(' ')
            .toLocaleLowerCase('es')
            .includes(needle),
    )
})

const groupedPermissions = computed(() => {
    const groups = new Map<string, AccessPermission[]>()
    for (const permission of filteredPermissions.value) {
        const current = groups.get(permission.module) ?? []
        current.push(permission)
        groups.set(permission.module, current)
    }
    return Array.from(groups, ([module, permissions]) => ({ module, permissions }))
})

function toRoleCode(value: string) {
    return value
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-zA-Z0-9]+/g, '_')
        .replace(/^_|_$/g, '')
        .toUpperCase()
}

function clearErrors() {
    errors.name = ''
    errors.code = ''
    errors.permissions = ''
}

function resetForm() {
    Object.assign(form, {
        name: props.role?.name ?? '',
        code: props.role?.code ?? '',
        description: props.role?.description ?? '',
        status: props.role?.status ?? 'ACTIVE',
        permissionIds: props.role ? [...props.role.permissionIds] : [],
    })
    permissionSearch.value = ''
    codeWasEdited.value = !!props.role
    clearErrors()
}

watch(
    () => props.open,
    (isOpen) => isOpen && resetForm(),
    { immediate: true },
)

watch(
    () => form.name,
    (name) => {
        if (!props.role && !codeWasEdited.value) form.code = toRoleCode(name)
    },
)

function togglePermission(permissionId: number) {
    if (form.permissionIds.includes(permissionId)) {
        form.permissionIds = form.permissionIds.filter((id) => id !== permissionId)
    } else {
        form.permissionIds = [...form.permissionIds, permissionId]
    }
    errors.permissions = ''
}

function groupIsSelected(permissions: AccessPermission[]) {
    return permissions.every((permission) => form.permissionIds.includes(permission.id))
}

function toggleGroup(permissions: AccessPermission[]) {
    const ids = permissions.map((permission) => permission.id)
    if (groupIsSelected(permissions)) {
        form.permissionIds = form.permissionIds.filter((id) => !ids.includes(id))
    } else {
        form.permissionIds = Array.from(new Set([...form.permissionIds, ...ids]))
    }
    errors.permissions = ''
}

function selectAllPermissions() {
    form.permissionIds = props.permissions
        .filter((permission) => permission.status === 'ACTIVE')
        .map((permission) => permission.id)
    errors.permissions = ''
}

function validate() {
    clearErrors()
    if (!form.name.trim()) errors.name = 'El nombre del rol es obligatorio.'
    if (!/^[A-Z][A-Z0-9_]{2,99}$/.test(form.code.trim())) {
        errors.code = 'Usa mayúsculas, números y guion bajo; mínimo 3 caracteres.'
    }
    if (!form.permissionIds.length) errors.permissions = 'Selecciona al menos un permiso.'
    return !Object.values(errors).some(Boolean)
}

function submit() {
    if (!validate()) return
    emit('save', {
        name: form.name.trim(),
        code: form.code.trim().toUpperCase(),
        description: form.description.trim(),
        status: form.status,
        permissionIds: [...form.permissionIds],
    })
}

const inputClass =
    'h-11 w-full rounded border border-outline-variant bg-surface px-3 text-sm text-on-surface outline-none placeholder:text-on-surface-variant/60 focus:border-primary focus:ring-1 focus:ring-primary disabled:cursor-not-allowed disabled:opacity-60'
const labelClass =
    'mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-on-surface-variant'
</script>

<template>
    <template v-if="open">
        <div class="fixed inset-0 z-[60] bg-black/65 backdrop-blur-sm" @click="emit('close')" />
        <aside
            class="role-form-drawer fixed inset-y-0 right-0 z-[61] flex w-[760px] max-w-[96vw] flex-col bg-surface-container-low shadow-2xl"
            data-testid="role-form-drawer"
        >
            <header
                class="flex items-start justify-between border-b border-outline-variant px-6 py-5 sm:px-8"
            >
                <div class="flex items-center gap-4">
                    <div
                        class="flex size-11 items-center justify-center rounded-full bg-primary/15 text-primary"
                    >
                        <ShieldCheck class="size-5" />
                    </div>
                    <div>
                        <p class="text-[11px] font-bold uppercase tracking-[0.2em] text-primary">
                            Seguridad · Roles
                        </p>
                        <h2 class="mt-1 font-display text-2xl font-semibold text-on-surface">
                            {{ role ? 'Editar rol' : 'Nuevo rol' }}
                        </h2>
                    </div>
                </div>
                <button
                    type="button"
                    class="text-on-surface-variant hover:text-on-surface"
                    aria-label="Cerrar formulario de rol"
                    @click="emit('close')"
                >
                    <X class="size-5" />
                </button>
            </header>

            <form class="min-h-0 flex-1 overflow-y-auto px-6 py-6 sm:px-8" @submit.prevent="submit">
                <div
                    v-if="isProtectedRole"
                    class="mb-6 flex items-start gap-3 rounded border border-primary/25 bg-primary/5 p-4 text-xs text-on-surface-variant"
                >
                    <LockKeyhole class="mt-0.5 size-4 shrink-0 text-primary" />
                    <p>
                        Es un rol protegido del sistema. Puedes ajustar sus permisos, pero su nombre
                        y código no pueden modificarse.
                    </p>
                </div>

                <section>
                    <h3 class="font-display text-lg font-semibold text-on-surface">
                        Información del rol
                    </h3>
                    <div class="mt-4 grid gap-4 sm:grid-cols-2">
                        <div>
                            <label :class="labelClass" for="role-name">Nombre *</label>
                            <input
                                id="role-name"
                                v-model="form.name"
                                :class="[inputClass, errors.name ? 'border-destructive' : '']"
                                :disabled="isProtectedRole"
                                placeholder="Coordinador de grupos"
                                maxlength="100"
                                data-testid="role-name"
                            />
                            <p v-if="errors.name" class="mt-1 text-xs text-destructive">
                                {{ errors.name }}
                            </p>
                        </div>
                        <div>
                            <label :class="labelClass" for="role-code">Código *</label>
                            <input
                                id="role-code"
                                v-model="form.code"
                                :class="[inputClass, errors.code ? 'border-destructive' : '']"
                                :disabled="isProtectedRole"
                                placeholder="GROUP_COORDINATOR"
                                maxlength="100"
                                data-testid="role-code"
                                @input="codeWasEdited = true"
                            />
                            <p v-if="errors.code" class="mt-1 text-xs text-destructive">
                                {{ errors.code }}
                            </p>
                        </div>
                        <div class="sm:col-span-2">
                            <label :class="labelClass" for="role-description">Descripción</label>
                            <textarea
                                id="role-description"
                                v-model="form.description"
                                rows="3"
                                :class="[inputClass, 'h-auto resize-none py-2.5']"
                                placeholder="Explica el alcance y las responsabilidades de este rol."
                                maxlength="300"
                            />
                        </div>
                        <div>
                            <span :class="labelClass">Estado</span>
                            <UiSearchSelect
                                v-model="form.status"
                                :options="accessStatusOptions"
                                :searchable="false"
                                :disabled="isProtectedRole"
                                content-class="!z-[80]"
                            />
                        </div>
                    </div>
                </section>

                <UiSeparator class="my-7" />

                <section>
                    <div class="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                        <div>
                            <h3 class="font-display text-lg font-semibold text-on-surface">
                                Permisos asignados
                            </h3>
                            <p class="mt-1 text-xs text-on-surface-variant">
                                {{ form.permissionIds.length }} de {{ permissions.length }} permisos
                                seleccionados
                            </p>
                        </div>
                        <div class="flex gap-3 text-xs font-semibold">
                            <button
                                type="button"
                                class="text-primary hover:underline"
                                @click="selectAllPermissions"
                            >
                                Seleccionar todos
                            </button>
                            <button
                                type="button"
                                class="text-on-surface-variant hover:text-primary"
                                @click="form.permissionIds = []"
                            >
                                Limpiar
                            </button>
                        </div>
                    </div>

                    <div class="relative mt-4">
                        <Search
                            class="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-on-surface-variant"
                        />
                        <input
                            v-model="permissionSearch"
                            type="search"
                            class="h-10 w-full rounded border border-outline-variant bg-surface pl-10 pr-3 text-sm text-on-surface outline-none placeholder:text-on-surface-variant/60 focus:border-primary focus:ring-1 focus:ring-primary"
                            placeholder="Buscar permiso por nombre, código o módulo..."
                        />
                    </div>

                    <p v-if="errors.permissions" class="mt-2 text-xs text-destructive">
                        {{ errors.permissions }}
                    </p>

                    <div class="mt-4 space-y-4">
                        <article
                            v-for="group in groupedPermissions"
                            :key="group.module"
                            class="overflow-hidden rounded border border-outline-variant bg-surface"
                        >
                            <div
                                class="flex items-center justify-between border-b border-outline-variant bg-surface-container-high px-4 py-3"
                            >
                                <div>
                                    <p
                                        class="text-xs font-bold uppercase tracking-wider text-on-surface"
                                    >
                                        {{ group.module }}
                                    </p>
                                    <p class="mt-0.5 text-[11px] text-on-surface-variant">
                                        {{
                                            group.permissions.filter((permission) =>
                                                form.permissionIds.includes(permission.id),
                                            ).length
                                        }}/{{ group.permissions.length }} seleccionados
                                    </p>
                                </div>
                                <button
                                    type="button"
                                    class="inline-flex items-center gap-1.5 text-xs font-semibold text-primary"
                                    @click="toggleGroup(group.permissions)"
                                >
                                    <Check
                                        v-if="groupIsSelected(group.permissions)"
                                        class="size-3.5"
                                    />
                                    {{
                                        groupIsSelected(group.permissions)
                                            ? 'Quitar módulo'
                                            : 'Asignar módulo'
                                    }}
                                </button>
                            </div>
                            <div class="grid gap-px bg-outline-variant sm:grid-cols-2">
                                <label
                                    v-for="permission in group.permissions"
                                    :key="permission.id"
                                    class="flex cursor-pointer items-start gap-3 bg-surface px-4 py-3 transition-colors hover:bg-surface-container-high"
                                >
                                    <input
                                        type="checkbox"
                                        class="mt-0.5 size-4 accent-primary"
                                        :checked="form.permissionIds.includes(permission.id)"
                                        :disabled="permission.status === 'INACTIVE'"
                                        @change="togglePermission(permission.id)"
                                    />
                                    <span class="min-w-0">
                                        <span class="block text-xs font-semibold text-on-surface">
                                            {{ permission.name }}
                                        </span>
                                        <code
                                            class="mt-0.5 block truncate text-[10px] text-primary"
                                        >
                                            {{ permission.code }}
                                        </code>
                                    </span>
                                </label>
                            </div>
                        </article>
                        <div
                            v-if="!groupedPermissions.length"
                            class="rounded border border-dashed border-outline-variant px-5 py-10 text-center text-sm text-on-surface-variant"
                        >
                            No hay permisos que coincidan con la búsqueda.
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
                    class="sm:min-w-40"
                    data-testid="role-save-button"
                    @click="submit"
                >
                    <Save class="size-4" /> {{ role ? 'Guardar cambios' : 'Crear rol' }}
                </UiButton>
            </footer>
        </aside>
    </template>
</template>

<style scoped>
.role-form-drawer {
    animation: role-form-in 0.25s ease;
}

@keyframes role-form-in {
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
