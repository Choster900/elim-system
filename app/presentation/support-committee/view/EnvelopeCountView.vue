<script setup lang="ts">
import { AlertTriangle, ArrowLeft, ArrowRight, EyeOff, Plus, Trash2 } from '@lucide/vue'
import { resolveHttpErrorMessage } from '~/utils/http/resolve-http-error-message.util'
import CategoryStepper, { type CategoryStep } from '../components/CategoryStepper.vue'
import DenominationCountGrid from '../components/DenominationCountGrid.vue'
import EnvelopeHeader from '../components/EnvelopeHeader.vue'
import ReceptionSteps from '../components/ReceptionSteps.vue'
import { useDenominationsQuery, useEnvelopeQuery } from '../composables/useReceptionQueries'
import type { EnvelopeCategory } from '../interfaces/reception.interface'
import { useReceptionDraftStore } from '../stores/reception-draft.store'
import {
    SUPPORT_COMMITTEE_HOME,
    categoryLabel,
    countPath,
    countedCents,
    envelopePath,
    formatMoney,
    reviewPath,
} from '../utils/reception-format.util'

defineOptions({ name: 'EnvelopeCountView' })

const route = useRoute()
const draftStore = useReceptionDraftStore()

const occurrenceId = computed(() => {
    const raw = Number(route.params.occurrenceId)
    return Number.isSafeInteger(raw) && raw > 0 ? raw : null
})
const isCorrection = computed(() => route.query.modo === 'corregir')

const envelopeQuery = useEnvelopeQuery(occurrenceId)
const denominationsQuery = useDenominationsQuery()

const isClientReady = ref(false)
const gridRef = ref<InstanceType<typeof DenominationCountGrid> | null>(null)
const countSectionRef = ref<HTMLElement | null>(null)
const isAddingCategory = ref(false)

const detail = computed(() => envelopeQuery.data.value ?? null)
const envelope = computed(() => detail.value?.envelope ?? null)
const denominations = computed(() => denominationsQuery.data.value ?? [])
const draft = computed(() =>
    isClientReady.value && occurrenceId.value ? draftStore.draftFor(occurrenceId.value) : null,
)

useHead({
    title: computed(() =>
        envelope.value
            ? `Contar · ${envelope.value.meetingTitle} · Sistema`
            : 'Contar sobre · Sistema',
    ),
})

const isLoading = computed(
    () => envelopeQuery.isPending.value || denominationsQuery.isPending.value || !draft.value,
)
const loadError = computed(() => {
    const error = envelopeQuery.error.value ?? denominationsQuery.error.value
    return error ? resolveHttpErrorMessage(error, 'No fue posible abrir el sobre') : ''
})

const backPath = computed(() =>
    isCorrection.value && occurrenceId.value
        ? envelopePath(occurrenceId.value)
        : SUPPORT_COMMITTEE_HOME,
)

function initDraft() {
    const id = occurrenceId.value
    const current = detail.value
    if (!isClientReady.value || !id || !current) return

    if (current.reception && !isCorrection.value) {
        draftStore.clearDraft(id)
        navigateTo(envelopePath(id), { replace: true })
        return
    }
    if (!current.reception && isCorrection.value) {
        navigateTo(countPath(id), { replace: true })
        return
    }

    const mode = isCorrection.value ? 'corregir' : 'recibir'
    const existing = draftStore.draftFor(id)
    if (!existing || existing.mode !== mode) {
        if (current.reception) {
            draftStore.startCorrection(
                id,
                current.reception.categories,
                current.envelope.categories,
                current.reception.notes,
            )
        } else {
            draftStore.startDraft(id, current.envelope.categories)
        }
    }
    draftStore.syncCategories(id, current.envelope.categories)
}

onMounted(() => {
    draftStore.ensureLoaded()
    isClientReady.value = true
    initDraft()
})
watch([detail, isCorrection], initDraft)

const categories = computed(() => draft.value?.categories ?? [])
const currentIndex = computed(() => draft.value?.currentIndex ?? 0)
const currentCategory = computed(() => categories.value[currentIndex.value] ?? null)
const nextCategory = computed(() => categories.value[currentIndex.value + 1] ?? null)
const isLastCategory = computed(() => currentIndex.value >= categories.value.length - 1)

function categoryTotal(index: number) {
    const category = categories.value[index]
    return category ? countedCents(category.quantities, denominations.value) / 100 : 0
}

const steps = computed<CategoryStep[]>(() =>
    categories.value.map((category, index) => ({
        key: String(category.categoryId ?? 'sin-tipo'),
        label: categoryLabel(category.categoryName),
        amount: categoryTotal(index),
        hasCounts: Object.values(category.quantities).some((quantity) => !!quantity),
        isExtra: !!category.extra,
    })),
)

const remainingCategories = computed(() =>
    (detail.value?.availableCategories ?? []).filter(
        (category) => !categories.value.some((item) => item.categoryId === category.categoryId),
    ),
)

const envelopeTotal = computed(() => steps.value.reduce((sum, step) => sum + step.amount, 0))

function onQuantityChange(denominationId: number, quantity: number | null) {
    if (!occurrenceId.value) return
    draftStore.setQuantity(occurrenceId.value, currentIndex.value, denominationId, quantity)
}

function goToCategory(index: number) {
    if (!occurrenceId.value) return
    draftStore.setCurrentIndex(occurrenceId.value, index)
    nextTick(() => {
        const top = countSectionRef.value?.getBoundingClientRect().top ?? 0
        if (top < 0) countSectionRef.value?.scrollIntoView({ behavior: 'smooth', block: 'start' })
        if (window.matchMedia('(min-width: 1024px)').matches) gridRef.value?.focusFirst()
    })
}

function toggleAddCategory() {
    isAddingCategory.value = !isAddingCategory.value
}

function addCategory(category: EnvelopeCategory) {
    if (!occurrenceId.value) return
    draftStore.addCategory(occurrenceId.value, category)
    isAddingCategory.value = false
    goToCategory(draftStore.draftFor(occurrenceId.value)?.currentIndex ?? 0)
}

function removeCurrentCategory() {
    if (!occurrenceId.value || !currentCategory.value?.extra) return
    draftStore.removeCategory(occurrenceId.value, currentCategory.value.categoryId)
}

function goToReview() {
    if (!occurrenceId.value) return
    navigateTo(reviewPath(occurrenceId.value, isCorrection.value))
}

function onPrimaryAction() {
    if (isLastCategory.value) goToReview()
    else goToCategory(currentIndex.value + 1)
}
</script>

<template>
    <main class="mx-auto w-full max-w-5xl px-4 pb-32 pt-24 sm:px-6">
        <div class="mb-4 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <NuxtLink
                :to="backPath"
                class="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-on-surface-variant transition-colors hover:text-on-surface"
            >
                <ArrowLeft class="size-4" />
                {{ isCorrection ? 'Volver al sobre' : 'Volver a la bandeja' }}
            </NuxtLink>
            <ReceptionSteps :current="1" />
        </div>

        <div
            v-if="loadError"
            class="flex flex-col items-center gap-3 rounded-xl border border-destructive/40 bg-destructive/10 px-6 py-12 text-center"
        >
            <AlertTriangle class="size-8 text-destructive" />
            <p class="text-sm text-destructive">{{ loadError }}</p>
            <NuxtLink
                :to="SUPPORT_COMMITTEE_HOME"
                class="text-sm font-semibold text-primary hover:underline"
            >
                Volver a la bandeja
            </NuxtLink>
        </div>

        <div
            v-else-if="isLoading || !envelope || !currentCategory"
            class="rounded-xl border border-outline-variant bg-surface-container-low px-6 py-16 text-center text-sm text-on-surface-variant"
        >
            Abriendo el sobre…
        </div>

        <template v-else>
            <EnvelopeHeader :envelope="envelope" />

            <section
                ref="countSectionRef"
                class="mt-4 scroll-mt-24 overflow-hidden rounded-xl border border-outline-variant bg-surface"
            >
                <div
                    class="border-b border-outline-variant bg-surface-container-low px-3 pb-2 pt-4"
                >
                    <CategoryStepper
                        :steps="steps"
                        :current="currentIndex"
                        :can-add="remainingCategories.length > 0"
                        :is-adding="isAddingCategory"
                        @select="goToCategory"
                        @add="toggleAddCategory"
                        @review="goToReview"
                    />
                </div>

                <div
                    v-if="isAddingCategory"
                    class="flex flex-col gap-3 border-b border-outline-variant bg-primary/[0.04] px-4 py-3 sm:flex-row sm:items-center"
                >
                    <p class="text-sm font-semibold text-on-surface">
                        ¿Qué otro tipo de ofrenda vino en el sobre?
                    </p>
                    <div class="flex flex-wrap gap-2">
                        <button
                            v-for="category in remainingCategories"
                            :key="category.categoryId ?? 'sin-tipo'"
                            type="button"
                            class="inline-flex items-center gap-1.5 rounded-full border border-primary/40 bg-surface px-3 py-1.5 text-sm font-semibold text-primary transition-colors hover:bg-primary hover:text-primary-foreground"
                            @click="addCategory(category)"
                        >
                            <Plus class="size-3.5" />
                            {{ categoryLabel(category.categoryName) }}
                        </button>
                    </div>
                    <button
                        type="button"
                        class="text-xs font-semibold text-on-surface-variant hover:text-on-surface sm:ml-auto"
                        @click="isAddingCategory = false"
                    >
                        Cancelar
                    </button>
                </div>

                <div class="p-4 sm:p-5">
                    <div class="mb-4 flex flex-wrap items-end justify-between gap-x-4 gap-y-1">
                        <div>
                            <h1 class="font-display text-2xl font-semibold text-on-surface">
                                {{ categoryLabel(currentCategory.categoryName) }}
                            </h1>
                            <p class="text-sm text-on-surface-variant">
                                ¿Cuántos billetes y monedas vienen? Deja vacío lo que no venga.
                            </p>
                        </div>
                        <div class="flex flex-col items-start gap-1 sm:items-end">
                            <p
                                class="inline-flex items-center gap-1.5 text-xs text-on-surface-variant"
                            >
                                <EyeOff class="size-3.5 text-primary" />
                                {{
                                    isCorrection
                                        ? 'Corrigiendo un conteo guardado'
                                        : 'Lo del líder lo verás al revisar'
                                }}
                            </p>
                            <button
                                v-if="currentCategory.extra"
                                type="button"
                                class="inline-flex items-center gap-1 text-xs font-semibold text-on-surface-variant hover:text-destructive"
                                @click="removeCurrentCategory"
                            >
                                <Trash2 class="size-3.5" />
                                Quitar este tipo
                            </button>
                        </div>
                    </div>

                    <DenominationCountGrid
                        ref="gridRef"
                        :key="`${currentIndex}-${currentCategory.categoryId}`"
                        :denominations="denominations"
                        :quantities="currentCategory.quantities"
                        :category-name="categoryLabel(currentCategory.categoryName)"
                        @change="onQuantityChange"
                    />
                </div>
            </section>

            <div
                class="fixed inset-x-0 bottom-0 z-40 border-t border-outline-variant bg-surface/95 shadow-[0_-8px_24px_rgba(0,0,0,0.08)] backdrop-blur"
            >
                <div
                    class="mx-auto flex w-full max-w-5xl items-center justify-between gap-3 px-4 py-3 sm:px-6"
                >
                    <div class="flex min-w-0 items-center gap-4">
                        <div class="min-w-0">
                            <p
                                class="truncate text-[10px] font-bold uppercase tracking-[0.16em] text-on-surface-variant"
                            >
                                {{ categoryLabel(currentCategory.categoryName) }}
                            </p>
                            <p class="text-lg font-semibold tabular-nums text-on-surface">
                                {{ formatMoney(categoryTotal(currentIndex)) }}
                            </p>
                        </div>
                        <span class="h-8 w-px bg-outline-variant" />
                        <div>
                            <p
                                class="text-[10px] font-bold uppercase tracking-[0.16em] text-on-surface-variant"
                            >
                                Sobre
                            </p>
                            <p class="text-lg font-semibold tabular-nums text-primary">
                                {{ formatMoney(envelopeTotal) }}
                            </p>
                        </div>
                    </div>

                    <div class="flex shrink-0 items-center gap-3">
                        <button
                            v-if="currentIndex > 0"
                            type="button"
                            class="hidden items-center gap-1 text-sm font-semibold text-on-surface-variant hover:text-on-surface sm:inline-flex"
                            @click="goToCategory(currentIndex - 1)"
                        >
                            <ArrowLeft class="size-4" />
                            Anterior
                        </button>
                        <UiButton
                            type="button"
                            class="h-11 rounded-lg px-5 text-sm"
                            @click="onPrimaryAction"
                        >
                            <template v-if="isLastCategory">Revisar conteo</template>
                            <template v-else>
                                <span class="hidden sm:inline">Siguiente:</span>
                                {{ categoryLabel(nextCategory?.categoryName ?? null) }}
                            </template>
                            <ArrowRight class="size-4" />
                        </UiButton>
                    </div>
                </div>
            </div>
        </template>
    </main>
</template>
