<script setup lang="ts">
import {
    ArrowRight,
    CalendarRange,
    CheckCircle2,
    CircleOff,
    Hash,
    Pencil,
    Plus,
    Sparkles,
    Trash2,
    X,
} from '@lucide/vue'
import { useAppToast } from '~/presentation/shared/composables/useAppToast'
import { useMeetingTypesQuery } from '../composables/useMeetingCatalogQueries'
import {
    useCreateMeetingTypeMutation,
    useDeleteMeetingTypeMutation,
    useUpdateMeetingTypeMutation,
} from '../composables/useMeetingTypeMutations'
import type { MeetingTypeOption } from '../interfaces/meeting.interface'
import { resolveHttpErrorMessage } from '~/utils/http/resolve-http-error-message.util'

defineOptions({ name: 'MeetingTypesView' })
useHead({ title: 'Tipos de reunión · Sistema' })

const toast = useAppToast()
const typesQuery = useMeetingTypesQuery()
const createMutation = useCreateMeetingTypeMutation()
const updateMutation = useUpdateMeetingTypeMutation()
const deleteMutation = useDeleteMeetingTypeMutation()
const types = computed(() => typesQuery.data.value ?? [])
const editingId = ref<number | null>(null)
const form = reactive({ name: '', codeSegment: '', isActive: true })
const stats = computed(() => ({
    total: types.value.length,
    active: types.value.filter((type) => type.isActive).length,
    inactive: types.value.filter((type) => !type.isActive).length,
}))
const previewCode = computed(() => `D1Z1S1${form.codeSegment.trim().toUpperCase() || 'C'}1`)

function resetForm() {
    editingId.value = null
    Object.assign(form, { name: '', codeSegment: '', isActive: true })
}

function edit(type: MeetingTypeOption) {
    editingId.value = type.id
    Object.assign(form, {
        name: type.name,
        codeSegment: type.codeSegment,
        isActive: type.isActive,
    })
}

async function save() {
    const input = {
        ...form,
        name: form.name.trim(),
        codeSegment: form.codeSegment.trim().toUpperCase(),
    }
    if (!input.name || !/^[A-Z]$/.test(input.codeSegment)) {
        toast.error('Indica un nombre y un segmento de una letra (A-Z).')
        return
    }
    try {
        if (editingId.value) {
            await updateMutation.mutateAsync({ id: editingId.value, input })
            toast.success('Tipo de reunión actualizado')
        } else {
            await createMutation.mutateAsync(input)
            toast.success('Tipo de reunión creado')
        }
        resetForm()
    } catch (error) {
        toast.error(resolveHttpErrorMessage(error, 'No fue posible guardar el tipo de reunión'))
    }
}

async function remove(type: MeetingTypeOption) {
    if (!window.confirm(`¿Eliminar el tipo “${type.name}”?`)) return
    try {
        await deleteMutation.mutateAsync(type.id)
        if (editingId.value === type.id) resetForm()
        toast.success('Tipo de reunión eliminado')
    } catch (error) {
        toast.error(resolveHttpErrorMessage(error, 'No fue posible eliminar el tipo de reunión'))
    }
}
</script>

<template>
    <main class="mx-auto w-full max-w-system px-5 pb-16 pt-24 sm:px-8 sm:pt-28 lg:px-10">
        <section
            class="relative overflow-hidden rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/15 via-surface-container to-surface-container-low px-6 py-7 sm:px-8"
        >
            <div class="absolute -right-16 -top-20 size-64 rounded-full bg-primary/10 blur-3xl" />
            <div class="relative flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
                <div class="max-w-2xl">
                    <div
                        class="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.24em] text-primary"
                    >
                        <Sparkles class="size-4" /> Catálogos ministeriales
                    </div>
                    <h1
                        class="mt-3 font-display text-3xl font-semibold text-on-surface sm:text-4xl"
                    >
                        Tipos de reunión
                    </h1>
                    <p class="mt-3 text-sm leading-relaxed text-on-surface-variant">
                        Define cómo se clasifican las reuniones y el segmento que identificará cada
                        una en su código.
                    </p>
                </div>
                <div class="flex flex-wrap gap-3">
                    <div
                        class="rounded-xl border border-outline-variant bg-surface/80 px-4 py-3 backdrop-blur"
                    >
                        <p
                            class="text-[10px] font-semibold uppercase tracking-wider text-on-surface-variant"
                        >
                            Formato
                        </p>
                        <p class="mt-1 font-mono text-sm font-bold text-primary">D1Z1S1C1</p>
                    </div>
                    <UiButton v-if="editingId" variant="outline" type="button" @click="resetForm">
                        <X class="size-4" /> Cancelar edición
                    </UiButton>
                </div>
            </div>
        </section>

        <section class="mt-5 grid gap-3 sm:grid-cols-3">
            <UiCard class="border-primary/15 bg-primary/5 p-4">
                <div class="flex items-center justify-between">
                    <span
                        class="text-xs font-semibold uppercase tracking-wider text-on-surface-variant"
                        >Tipos registrados</span
                    ><CalendarRange class="size-5 text-primary" />
                </div>
                <p class="mt-3 font-display text-3xl font-semibold text-on-surface">
                    {{ stats.total }}
                </p>
            </UiCard>
            <UiCard class="p-4"
                ><div class="flex items-center justify-between">
                    <span
                        class="text-xs font-semibold uppercase tracking-wider text-on-surface-variant"
                        >Activos</span
                    ><CheckCircle2 class="size-5 text-emerald-500" />
                </div>
                <p class="mt-3 font-display text-3xl font-semibold text-on-surface">
                    {{ stats.active }}
                </p></UiCard
            >
            <UiCard class="p-4"
                ><div class="flex items-center justify-between">
                    <span
                        class="text-xs font-semibold uppercase tracking-wider text-on-surface-variant"
                        >Inactivos</span
                    ><CircleOff class="size-5 text-on-surface-variant" />
                </div>
                <p class="mt-3 font-display text-3xl font-semibold text-on-surface">
                    {{ stats.inactive }}
                </p></UiCard
            >
        </section>

        <section class="mt-6 grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_23rem]">
            <UiCard class="overflow-hidden">
                <div
                    class="flex items-center justify-between border-b border-outline-variant px-5 py-4 sm:px-6"
                >
                    <div>
                        <h2 class="font-display text-lg font-semibold text-on-surface">
                            Catálogo disponible
                        </h2>
                        <p class="mt-1 text-xs text-on-surface-variant">
                            Los tipos inactivos se conservan en el historial, pero no se pueden
                            seleccionar al crear.
                        </p>
                    </div>
                    <UiBadge variant="sacred" class="hidden sm:inline-flex"
                        >{{ stats.total }} tipos</UiBadge
                    >
                </div>
                <div v-if="typesQuery.isPending.value" class="space-y-3 p-5">
                    <div
                        v-for="index in 4"
                        :key="index"
                        class="h-20 animate-pulse rounded-xl bg-surface-container"
                    />
                </div>
                <div v-else-if="types.length" class="divide-y divide-outline-variant">
                    <article
                        v-for="type in types"
                        :key="type.id"
                        class="group flex gap-4 px-5 py-4 transition-colors hover:bg-surface-container-low sm:px-6"
                    >
                        <div
                            class="flex size-12 shrink-0 items-center justify-center rounded-xl border border-primary/25 bg-primary/10 font-mono text-lg font-bold text-primary"
                        >
                            {{ type.codeSegment }}
                        </div>
                        <div class="min-w-0 flex-1">
                            <div class="flex flex-wrap items-center gap-2">
                                <h3 class="truncate font-semibold text-on-surface">
                                    {{ type.name }}
                                </h3>
                                <UiBadge
                                    :variant="type.isActive ? 'sacred' : 'outline'"
                                    class="text-[10px]"
                                    >{{ type.isActive ? 'Activo' : 'Inactivo' }}</UiBadge
                                >
                            </div>
                            <p class="mt-1 text-xs text-on-surface-variant">
                                Código resultante
                                <span class="font-mono text-primary"
                                    >D1Z1S1{{ type.codeSegment }}1</span
                                >
                            </p>
                        </div>
                        <div class="flex shrink-0 items-center gap-1">
                            <UiButton
                                variant="ghost"
                                size="icon"
                                type="button"
                                :aria-label="`Editar ${type.name}`"
                                @click="edit(type)"
                                ><Pencil class="size-4" /></UiButton
                            ><UiButton
                                variant="ghost"
                                size="icon"
                                type="button"
                                :aria-label="`Eliminar ${type.name}`"
                                @click="remove(type)"
                                ><Trash2 class="size-4 text-destructive"
                            /></UiButton>
                        </div>
                    </article>
                </div>
                <div v-else class="px-6 py-16 text-center">
                    <div
                        class="mx-auto flex size-12 items-center justify-center rounded-full bg-primary/10 text-primary"
                    >
                        <CalendarRange class="size-5" />
                    </div>
                    <h3 class="mt-4 font-semibold text-on-surface">Aún no hay tipos de reunión</h3>
                    <p class="mt-1 text-sm text-on-surface-variant">
                        Crea el primero desde el formulario.
                    </p>
                </div>
            </UiCard>

            <UiCard class="overflow-hidden xl:sticky xl:top-6">
                <div class="border-b border-outline-variant bg-surface-container-low px-5 py-5">
                    <div class="flex items-center justify-between">
                        <div>
                            <p class="text-xs font-semibold uppercase tracking-wider text-primary">
                                {{ editingId ? 'Edición' : 'Nuevo registro' }}
                            </p>
                            <h2 class="mt-1 font-display text-xl font-semibold text-on-surface">
                                {{ editingId ? 'Actualizar tipo' : 'Crear tipo' }}
                            </h2>
                        </div>
                        <Hash class="size-6 text-primary" />
                    </div>
                </div>
                <form class="grid gap-5 p-5" @submit.prevent="save">
                    <label class="grid gap-2 text-sm font-semibold text-on-surface"
                        >Nombre del tipo<input
                            v-model="form.name"
                            class="h-11 rounded-lg border border-outline-variant bg-surface px-3 outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
                            maxlength="100"
                            placeholder="Ej. Célula familiar"
                            required
                    /></label>
                    <label class="grid gap-2 text-sm font-semibold text-on-surface"
                        >Segmento de código
                        <div class="flex gap-2">
                            <input
                                v-model="form.codeSegment"
                                class="h-11 w-16 rounded-lg border border-outline-variant bg-surface px-3 text-center font-mono text-lg font-bold uppercase outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
                                maxlength="1"
                                pattern="[A-Za-z]"
                                placeholder="C"
                                required
                            />
                            <div
                                class="flex min-w-0 flex-1 items-center rounded-lg border border-primary/20 bg-primary/5 px-3 font-mono text-sm font-semibold text-primary"
                            >
                                {{ previewCode }}
                            </div>
                        </div>
                        <span class="text-xs font-normal leading-relaxed text-on-surface-variant"
                            >Una sola letra A-Z, única para cada tipo. Se inserta antes del
                            consecutivo.</span
                        ></label
                    >
                    <label
                        class="flex cursor-pointer items-center justify-between rounded-xl border border-outline-variant bg-surface-container-low px-4 py-3"
                        ><span
                            ><span class="block text-sm font-semibold text-on-surface"
                                >Disponible para nuevas reuniones</span
                            ><span class="mt-0.5 block text-xs text-on-surface-variant"
                                >Desactívalo para conservarlo sin permitir nuevas
                                asignaciones.</span
                            ></span
                        ><input
                            v-model="form.isActive"
                            class="size-4 accent-primary"
                            type="checkbox"
                    /></label>
                    <UiButton
                        type="submit"
                        class="w-full"
                        :disabled="createMutation.isPending.value || updateMutation.isPending.value"
                        ><Plus v-if="!editingId" class="size-4" /><ArrowRight
                            v-else
                            class="size-4"
                        />{{ editingId ? 'Guardar cambios' : 'Crear tipo de reunión' }}</UiButton
                    >
                </form>
            </UiCard>
        </section>
    </main>
</template>
