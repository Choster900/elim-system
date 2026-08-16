<script setup lang="ts">
import { ArrowLeft, HandCoins, Plus, Save, Trash2, Users } from '@lucide/vue'
import { useApiClient } from '~/presentation/shared/composables/useApiClient'
import { useAppToast } from '~/presentation/shared/composables/useAppToast'
import {
    createOffering,
    getMeetingOptions,
    getOffering,
    getOfferingCategories,
    updateOffering,
} from '~/presentation/finance/services/offering.service'
import type {
    MeetingOption,
    OfferingCategoryOption,
    OfferingInput,
} from '~/presentation/finance/interfaces/offering.interface'

defineOptions({ name: 'OfferingFormView' })

const route = useRoute()
const apiClient = useApiClient()
const toast = useAppToast()

const offeringId = computed(() => {
    const raw = route.params.id as string | undefined
    return raw ? Number(raw) : null
})
const isEditing = computed(() => offeringId.value !== null)

useHead({
    title: () => (isEditing.value ? 'Editar ofrenda · Sistema' : 'Registrar ofrenda · Sistema'),
})

interface DetailRow {
    categoryId: number | null
    amount: number
    notes: string
}

interface FormState {
    meetingId: number | null
    date: string | null
    attendance: number
    currency: string
    notes: string
    details: DetailRow[]
}

function emptyDetail(): DetailRow {
    return { categoryId: null, amount: 0, notes: '' }
}

function emptyForm(): FormState {
    return {
        meetingId: null,
        date: null,
        attendance: 0,
        currency: 'USD',
        notes: '',
        details: [emptyDetail()],
    }
}

const form = reactive<FormState>(emptyForm())
const errors = reactive({ meetingId: false, date: false, details: false })

const meetings = ref<MeetingOption[]>([])
const categories = ref<OfferingCategoryOption[]>([])
const notFound = ref(false)
const isLoading = ref(true)
const isSaving = ref(false)

// On create, default the date to the selected meeting's date.
watch(
    () => form.meetingId,
    (meetingId) => {
        if (isEditing.value || !meetingId) return
        const meeting = meetings.value.find((item) => item.id === meetingId)
        if (meeting && !form.date) form.date = meeting.date
    },
)

const total = computed(() =>
    form.details.reduce((sum, detail) => sum + (Number(detail.amount) || 0), 0),
)

function availableCategories(rowIndex: number) {
    const usedElsewhere = new Set(
        form.details
            .filter((_, index) => index !== rowIndex)
            .map((detail) => detail.categoryId)
            .filter((id): id is number => id !== null),
    )
    return categories.value
        .filter(
            (category) => category.isActive || form.details[rowIndex]?.categoryId === category.id,
        )
        .filter((category) => !usedElsewhere.has(category.id))
}

function addDetail() {
    form.details.push(emptyDetail())
}

function removeDetail(index: number) {
    form.details.splice(index, 1)
    if (form.details.length === 0) form.details.push(emptyDetail())
}

function formatMoney(value: number) {
    return value.toLocaleString('es-SV', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

onMounted(async () => {
    try {
        const [meetingList, categoryList] = await Promise.all([
            getMeetingOptions(apiClient),
            getOfferingCategories(apiClient),
        ])
        meetings.value = meetingList
        categories.value = categoryList

        if (isEditing.value && offeringId.value !== null) {
            const existing = await getOffering(apiClient, offeringId.value)
            Object.assign(form, {
                meetingId: existing.meetingId,
                date: existing.date,
                attendance: existing.attendance,
                currency: existing.currency,
                notes: existing.notes ?? '',
                details: existing.details.length
                    ? existing.details.map((detail) => ({
                          categoryId: detail.categoryId,
                          amount: detail.amount,
                          notes: detail.notes ?? '',
                      }))
                    : [emptyDetail()],
            })
        }
    } catch (error) {
        if (isEditing.value) notFound.value = true
        toast.error(error instanceof Error ? error.message : 'No fue posible cargar la ofrenda')
    } finally {
        isLoading.value = false
    }
})

async function submit() {
    errors.meetingId = form.meetingId === null
    errors.date = !form.date
    const validDetails = form.details.filter(
        (detail) => detail.categoryId !== null && Number(detail.amount) >= 0,
    )
    errors.details = validDetails.length === 0

    if (errors.meetingId || errors.date || errors.details) {
        toast.error('Revisa los campos marcados en rojo')
        return
    }

    const payload: OfferingInput = {
        meetingId: form.meetingId as number,
        date: form.date as string,
        attendance: Number(form.attendance) || 0,
        currency: form.currency || 'USD',
        notes: form.notes.trim() || null,
        details: validDetails.map((detail) => ({
            categoryId: detail.categoryId as number,
            amount: Number(detail.amount) || 0,
            notes: detail.notes.trim() || null,
        })),
    }

    isSaving.value = true
    try {
        if (isEditing.value && offeringId.value !== null) {
            await updateOffering(apiClient, offeringId.value, payload)
            toast.success('Ofrenda actualizada')
        } else {
            await createOffering(apiClient, payload)
            toast.success('Ofrenda registrada')
        }
        await navigateTo('/finanzas/ofrendas')
    } catch (error) {
        toast.error(error instanceof Error ? error.message : 'No fue posible guardar la ofrenda')
    } finally {
        isSaving.value = false
    }
}

function cancel() {
    navigateTo('/finanzas/ofrendas')
}

const inputClass =
    'h-11 w-full rounded border border-outline-variant bg-surface-container px-3 text-sm text-on-surface placeholder:text-on-surface-variant/60 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary'
const labelClass = 'text-[11px] font-semibold uppercase tracking-wider text-on-surface-variant'
</script>

<template>
    <div class="pb-24 pt-20">
        <div
            class="sticky top-16 z-30 border-b border-outline-variant bg-surface/80 backdrop-blur-md"
        >
            <div
                class="mx-auto flex w-full max-w-system items-center justify-between gap-4 px-6 py-4 lg:px-10"
            >
                <div class="flex items-center gap-4">
                    <NuxtLink
                        to="/finanzas/ofrendas"
                        class="flex size-9 items-center justify-center rounded-full border border-outline-variant text-on-surface-variant transition-colors hover:border-primary hover:text-primary"
                        aria-label="Volver"
                    >
                        <ArrowLeft class="size-4" />
                    </NuxtLink>
                    <div>
                        <p
                            class="text-[11px] font-semibold uppercase tracking-[0.3em] text-on-surface-variant"
                        >
                            Finanzas · Ofrendas
                        </p>
                        <h1 class="font-display text-2xl font-semibold text-on-surface md:text-3xl">
                            {{ isEditing ? 'Editar ofrenda' : 'Registrar ofrenda' }}
                        </h1>
                    </div>
                </div>
                <div class="flex items-center gap-2">
                    <UiButton
                        variant="outline"
                        type="button"
                        class="h-10 rounded px-4 text-xs uppercase tracking-wider"
                        @click="cancel"
                    >
                        Cancelar
                    </UiButton>
                    <UiButton
                        type="button"
                        class="h-10 rounded px-5 text-xs uppercase tracking-wider"
                        :loading="isSaving"
                        :disabled="isSaving"
                        @click="submit"
                    >
                        <Save class="mr-2 size-4" />
                        {{ isEditing ? 'Guardar cambios' : 'Registrar' }}
                    </UiButton>
                </div>
            </div>
        </div>

        <main class="mx-auto w-full max-w-system px-6 py-8 lg:px-10">
            <div
                v-if="notFound"
                class="mx-auto max-w-md rounded-lg border border-destructive/30 bg-destructive/10 p-6 text-center"
            >
                <p class="font-display text-lg font-semibold text-destructive">
                    Ofrenda no encontrada
                </p>
                <p class="mt-2 text-sm text-on-surface-variant">
                    El registro de ofrenda que intentas editar ya no existe.
                </p>
                <NuxtLink
                    to="/finanzas/ofrendas"
                    class="mt-4 inline-block text-xs font-semibold uppercase tracking-wider text-primary hover:underline"
                >
                    Volver al listado
                </NuxtLink>
            </div>

            <form v-else class="mx-auto grid max-w-3xl gap-6" novalidate @submit.prevent="submit">
                <UiCard class="p-6">
                    <div class="mb-5 flex items-center gap-3">
                        <Users class="size-5 text-primary" />
                        <div>
                            <h2 class="font-display text-lg font-semibold text-on-surface">
                                Reunión y asistencia
                            </h2>
                            <p class="text-xs text-on-surface-variant">
                                Documenta la asistencia real y la fecha en que se recogió la
                                ofrenda.
                            </p>
                        </div>
                    </div>

                    <div class="grid gap-4 sm:grid-cols-2">
                        <div class="sm:col-span-2">
                            <label :class="labelClass">Reunión *</label>
                            <div class="mt-1">
                                <UiSearchSelect
                                    v-model="form.meetingId"
                                    :options="meetings"
                                    option-value="id"
                                    option-label="title"
                                    option-description="date"
                                    placeholder="Selecciona la reunión"
                                    search-placeholder="Buscar reunión..."
                                    :invalid="errors.meetingId"
                                    :disabled="isEditing"
                                />
                            </div>
                            <p v-if="errors.meetingId" class="mt-1 text-xs text-destructive">
                                Selecciona una reunión
                            </p>
                        </div>
                        <div>
                            <label :class="labelClass">Fecha *</label>
                            <div class="mt-1">
                                <UiDatePicker
                                    v-model="form.date"
                                    mode="single"
                                    placeholder="Selecciona fecha"
                                    :invalid="errors.date"
                                />
                            </div>
                            <p v-if="errors.date" class="mt-1 text-xs text-destructive">
                                Selecciona una fecha
                            </p>
                        </div>
                        <div>
                            <label :class="labelClass" for="offering-attendance">Asistencia</label>
                            <div class="relative mt-1">
                                <Users
                                    class="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-on-surface-variant"
                                />
                                <input
                                    id="offering-attendance"
                                    v-model.number="form.attendance"
                                    type="number"
                                    min="0"
                                    :class="[inputClass, 'pl-9']"
                                />
                            </div>
                        </div>
                    </div>
                </UiCard>

                <UiCard class="p-6">
                    <div class="mb-5 flex items-center justify-between gap-3">
                        <div class="flex items-center gap-3">
                            <HandCoins class="size-5 text-primary" />
                            <div>
                                <h2 class="font-display text-lg font-semibold text-on-surface">
                                    Desglose de la ofrenda
                                </h2>
                                <p class="text-xs text-on-surface-variant">
                                    Registra cuánto se recogió por categoría.
                                </p>
                            </div>
                        </div>
                        <button
                            type="button"
                            class="inline-flex items-center gap-1.5 rounded border border-outline-variant px-3 py-2 text-xs font-semibold uppercase tracking-wider text-on-surface-variant transition-colors hover:border-primary hover:text-primary"
                            @click="addDetail"
                        >
                            <Plus class="size-3.5" />
                            Categoría
                        </button>
                    </div>

                    <p v-if="errors.details" class="mb-2 text-xs text-destructive">
                        Agrega al menos una categoría con su monto.
                    </p>

                    <div class="space-y-3">
                        <div
                            v-for="(detail, index) in form.details"
                            :key="index"
                            class="grid grid-cols-[1fr_150px_auto] items-start gap-3"
                        >
                            <div>
                                <UiSearchSelect
                                    v-model="detail.categoryId"
                                    :options="availableCategories(index)"
                                    option-value="id"
                                    option-label="name"
                                    placeholder="Categoría"
                                    search-placeholder="Buscar categoría..."
                                />
                            </div>
                            <div class="relative">
                                <span
                                    class="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-on-surface-variant"
                                >
                                    $
                                </span>
                                <input
                                    v-model.number="detail.amount"
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    placeholder="0.00"
                                    :class="[inputClass, 'pl-7 text-right']"
                                />
                            </div>
                            <button
                                type="button"
                                class="flex size-11 items-center justify-center rounded border border-outline-variant text-on-surface-variant transition-colors hover:border-destructive hover:text-destructive"
                                aria-label="Quitar categoría"
                                @click="removeDetail(index)"
                            >
                                <Trash2 class="size-4" />
                            </button>
                        </div>
                    </div>

                    <div
                        class="mt-4 flex items-center justify-between rounded border border-outline-variant bg-surface-container px-4 py-3"
                    >
                        <span
                            class="text-[11px] font-semibold uppercase tracking-wider text-on-surface-variant"
                        >
                            Total recogido
                        </span>
                        <span class="font-display text-xl font-semibold text-on-surface">
                            {{ form.currency }} {{ formatMoney(total) }}
                        </span>
                    </div>
                </UiCard>

                <UiCard class="p-6">
                    <label :class="labelClass" for="offering-notes">Notas</label>
                    <textarea
                        id="offering-notes"
                        v-model="form.notes"
                        rows="3"
                        placeholder="Observaciones sobre la ofrenda de ese día."
                        :class="['mt-1', inputClass, 'h-auto resize-none py-2 leading-relaxed']"
                    />
                </UiCard>
            </form>
        </main>
    </div>
</template>
