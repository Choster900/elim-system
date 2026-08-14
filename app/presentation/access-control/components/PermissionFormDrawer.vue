<script setup lang="ts">
import { KeyRound, LockKeyhole, Save, X } from '@lucide/vue'
import {
    accessModuleOptions,
    accessStatusOptions,
    permissionActionOptions,
} from '../constants/access-control.constants'
import type {
    AccessPermission,
    AccessRecordStatus,
    PermissionFormPayload,
} from '../interfaces/access-control.interface'

interface PermissionFormState {
    name: string
    code: string
    module: string
    resource: string
    action: string
    description: string
    status: AccessRecordStatus
}

const props = defineProps<{
    open: boolean
    permission: AccessPermission | null
}>()

const emit = defineEmits<{
    close: []
    save: [payload: PermissionFormPayload]
}>()

const form = reactive<PermissionFormState>({
    name: '',
    code: '',
    module: 'Comunidad',
    resource: '',
    action: 'view',
    description: '',
    status: 'ACTIVE',
})
const errors = reactive({ name: '', code: '', resource: '', action: '' })
const codeWasEdited = ref(false)

const isProtectedPermission = computed(() => !!props.permission?.isSystem)

function normalizeSegment(value: string) {
    return value
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '_')
        .replace(/^_|_$/g, '')
}

function suggestedCode() {
    const resource = normalizeSegment(form.resource)
    const action = normalizeSegment(form.action)
    return resource && action ? `${resource}.${action}` : ''
}

function clearErrors() {
    errors.name = ''
    errors.code = ''
    errors.resource = ''
    errors.action = ''
}

function resetForm() {
    Object.assign(form, {
        name: props.permission?.name ?? '',
        code: props.permission?.code ?? '',
        module: props.permission?.module ?? 'Comunidad',
        resource: props.permission?.resource ?? '',
        action: props.permission?.action ?? 'view',
        description: props.permission?.description ?? '',
        status: props.permission?.status ?? 'ACTIVE',
    })
    codeWasEdited.value = !!props.permission
    clearErrors()
}

watch(
    () => props.open,
    (isOpen) => isOpen && resetForm(),
    { immediate: true },
)

watch(
    () => [form.resource, form.action],
    () => {
        if (!props.permission && !codeWasEdited.value) form.code = suggestedCode()
    },
)

function validate() {
    clearErrors()
    if (!form.name.trim()) errors.name = 'El nombre es obligatorio.'
    if (!/^[a-z][a-z0-9_]*\.[a-z][a-z0-9_]*$/.test(form.code.trim())) {
        errors.code = 'Usa el formato recurso.accion en minúsculas.'
    }
    if (!form.resource.trim()) errors.resource = 'Indica el recurso protegido.'
    if (!form.action.trim()) errors.action = 'Indica la acción permitida.'
    return !Object.values(errors).some(Boolean)
}

function submit() {
    if (!validate()) return
    emit('save', {
        name: form.name.trim(),
        code: form.code.trim().toLowerCase(),
        module: form.module,
        resource: normalizeSegment(form.resource),
        action: normalizeSegment(form.action),
        description: form.description.trim(),
        status: form.status,
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
            class="permission-form-drawer fixed inset-y-0 right-0 z-[61] flex w-[600px] max-w-[96vw] flex-col bg-surface-container-low shadow-2xl"
            data-testid="permission-form-drawer"
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
                            Seguridad · Permisos
                        </p>
                        <h2 class="mt-1 font-display text-2xl font-semibold text-on-surface">
                            {{ permission ? 'Editar permiso' : 'Nuevo permiso' }}
                        </h2>
                    </div>
                </div>
                <button
                    type="button"
                    class="text-on-surface-variant hover:text-on-surface"
                    aria-label="Cerrar formulario de permiso"
                    @click="emit('close')"
                >
                    <X class="size-5" />
                </button>
            </header>

            <form class="min-h-0 flex-1 overflow-y-auto px-6 py-6 sm:px-8" @submit.prevent="submit">
                <div
                    v-if="isProtectedPermission"
                    class="mb-6 flex items-start gap-3 rounded border border-primary/25 bg-primary/5 p-4 text-xs text-on-surface-variant"
                >
                    <LockKeyhole class="mt-0.5 size-4 shrink-0 text-primary" />
                    <p>
                        Este permiso forma parte del sistema. Su código, recurso y acción están
                        protegidos para evitar romper las reglas de autorización.
                    </p>
                </div>

                <section>
                    <h3 class="font-display text-lg font-semibold text-on-surface">
                        Identificación
                    </h3>
                    <p class="mt-1 text-xs text-on-surface-variant">
                        Define una acción concreta que posteriormente podrá asignarse a uno o más
                        roles.
                    </p>
                    <div class="mt-4 grid gap-4 sm:grid-cols-2">
                        <div class="sm:col-span-2">
                            <label :class="labelClass" for="permission-name">Nombre *</label>
                            <input
                                id="permission-name"
                                v-model="form.name"
                                :class="[inputClass, errors.name ? 'border-destructive' : '']"
                                placeholder="Administrar grupos pequeños"
                                maxlength="100"
                                data-testid="permission-name"
                            />
                            <p v-if="errors.name" class="mt-1 text-xs text-destructive">
                                {{ errors.name }}
                            </p>
                        </div>
                        <div>
                            <span :class="labelClass">Módulo *</span>
                            <UiSearchSelect
                                v-model="form.module"
                                :options="accessModuleOptions"
                                :searchable="false"
                                content-class="!z-[80]"
                            />
                        </div>
                        <div>
                            <span :class="labelClass">Estado</span>
                            <UiSearchSelect
                                v-model="form.status"
                                :options="accessStatusOptions"
                                :searchable="false"
                                content-class="!z-[80]"
                            />
                        </div>
                        <div>
                            <label :class="labelClass" for="permission-resource">Recurso *</label>
                            <input
                                id="permission-resource"
                                v-model="form.resource"
                                :class="[inputClass, errors.resource ? 'border-destructive' : '']"
                                :disabled="isProtectedPermission"
                                placeholder="small_groups"
                                maxlength="100"
                                data-testid="permission-resource"
                            />
                            <p v-if="errors.resource" class="mt-1 text-xs text-destructive">
                                {{ errors.resource }}
                            </p>
                        </div>
                        <div>
                            <span :class="labelClass">Acción *</span>
                            <UiSearchSelect
                                v-if="!isProtectedPermission"
                                v-model="form.action"
                                :options="permissionActionOptions"
                                content-class="!z-[80]"
                                placeholder="Selecciona o escribe una acción"
                            />
                            <input v-else v-model="form.action" :class="inputClass" disabled />
                            <p v-if="errors.action" class="mt-1 text-xs text-destructive">
                                {{ errors.action }}
                            </p>
                        </div>
                        <div class="sm:col-span-2">
                            <label :class="labelClass" for="permission-code">Código *</label>
                            <input
                                id="permission-code"
                                v-model="form.code"
                                :class="[inputClass, errors.code ? 'border-destructive' : '']"
                                :disabled="isProtectedPermission"
                                placeholder="small_groups.manage"
                                maxlength="100"
                                data-testid="permission-code"
                                @input="codeWasEdited = true"
                            />
                            <p v-if="errors.code" class="mt-1 text-xs text-destructive">
                                {{ errors.code }}
                            </p>
                            <p v-else class="mt-1 text-[11px] text-on-surface-variant">
                                Se genera automáticamente con el formato recurso.acción.
                            </p>
                        </div>
                        <div class="sm:col-span-2">
                            <label :class="labelClass" for="permission-description"
                                >Descripción</label
                            >
                            <textarea
                                id="permission-description"
                                v-model="form.description"
                                rows="4"
                                :class="[inputClass, 'h-auto resize-none py-2.5']"
                                placeholder="Explica exactamente qué operación autoriza este permiso."
                                maxlength="300"
                            />
                        </div>
                    </div>
                </section>

                <section class="mt-7 rounded border border-outline-variant bg-surface p-4">
                    <p
                        class="text-[11px] font-semibold uppercase tracking-wider text-on-surface-variant"
                    >
                        Vista previa de la regla
                    </p>
                    <div class="mt-3 flex flex-wrap items-center gap-2 text-xs">
                        <span class="rounded bg-primary/10 px-2 py-1 font-semibold text-primary">
                            {{ form.module }}
                        </span>
                        <code class="rounded bg-surface-container-high px-2 py-1 text-on-surface">
                            {{ form.code || 'recurso.accion' }}
                        </code>
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
                    data-testid="permission-save-button"
                    @click="submit"
                >
                    <Save class="size-4" /> {{ permission ? 'Guardar cambios' : 'Crear permiso' }}
                </UiButton>
            </footer>
        </aside>
    </template>
</template>

<style scoped>
.permission-form-drawer {
    animation: permission-form-in 0.25s ease;
}

@keyframes permission-form-in {
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
