<script setup lang="ts">
import {
    AlertTriangle,
    ArrowLeft,
    ArrowRight,
    ArrowRightLeft,
    Coins,
    EyeOff,
    Plus,
    Trash2,
} from '@lucide/vue'
import { useAuthStore } from '~/presentation/auth/stores/auth.store'
import { useAppToast } from '~/presentation/shared/composables/useAppToast'
import { resolveHttpErrorMessage } from '~/utils/http/resolve-http-error-message.util'
import CategoryTabs, { type CategoryStep } from '../components/CategoryTabs.vue'
import DenominationCountGrid from '../components/DenominationCountGrid.vue'
import EnvelopeAmountForm from '../components/EnvelopeAmountForm.vue'
import EnvelopeHeader from '../components/EnvelopeHeader.vue'
import ReceptionSteps from '../components/ReceptionSteps.vue'
import { useDenominationsQuery, useEnvelopeQuery } from '../composables/useReceptionQueries'
import type { EnvelopeCategory } from '../interfaces/reception.interface'
import { useReceptionDraftStore } from '../stores/reception-draft.store'
import {
    GENERAL_SERVICES_PATH,
    SUPPORT_COMMITTEE_HOME,
    categoryLabel,
    countPath,
    countedCents,
    envelopePath,
    formatMoney,
    reviewPath,
    toCents,
} from '../utils/reception-format.util'
import { resolveSupportCommitteeHome } from '../utils/support-committee-access.util'

defineOptions({ name: 'EnvelopeCountView' })

interface MoveTarget {
    key: string
    label: string
    index: number | null
    category: EnvelopeCategory | null
    total: number
}

const route = useRoute()
const toast = useAppToast()
const draftStore = useReceptionDraftStore()
const authStore = useAuthStore()
const committeeHome = computed(() => resolveSupportCommitteeHome(authStore.hasPermission))

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
const isMovingCounts = ref(false)

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

const isDirectEntry = computed(
    () => !!(detail.value?.envelope.directEntry || detail.value?.reception?.directEntry),
)
const isNotReady = computed(() => detail.value?.envelope.isReady === false)

const isLoading = computed(
    () =>
        envelopeQuery.isPending.value ||
        (isDirectEntry.value && denominationsQuery.isPending.value) ||
        (!draft.value && !isNotReady.value),
)
const loadError = computed(() => {
    const error =
        envelopeQuery.error.value ?? (isDirectEntry.value ? denominationsQuery.error.value : null)
    return error ? resolveHttpErrorMessage(error, 'No fue posible abrir el sobre') : ''
})

const backPath = computed(() =>
    isCorrection.value && occurrenceId.value
        ? envelopePath(occurrenceId.value)
        : isDirectEntry.value
          ? GENERAL_SERVICES_PATH
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

    if (!current.envelope.isReady) return

    const registered =
        current.envelope.directEntry || current.reception?.directEntry
            ? current.availableCategories
            : current.envelope.categories
    const mode = isCorrection.value ? 'corregir' : 'recibir'
    const existing = draftStore.draftFor(id)
    if (!existing || existing.mode !== mode) {
        if (current.reception) {
            draftStore.startCorrection(
                id,
                current.reception.categories,
                registered,
                current.reception.notes,
            )
        } else {
            draftStore.startDraft(id, registered)
        }
    }
    draftStore.syncCategories(id, registered)
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
    if (!category) return 0
    return isDirectEntry.value
        ? countedCents(category.quantities, denominations.value) / 100
        : toCents(category.amount ?? 0) / 100
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

const envelopeTotal = computed(() =>
    categories.value.reduce((sum, _category, index) => sum + categoryTotal(index), 0),
)

const currentHasCounts = computed(() => !!steps.value[currentIndex.value]?.hasCounts)

const moveTargets = computed<MoveTarget[]>(() => [
    ...categories.value.flatMap((category, index) =>
        index === currentIndex.value
            ? []
            : [
                  {
                      key: `draft-${category.categoryId ?? 'sin-tipo'}`,
                      label: categoryLabel(category.categoryName),
                      index,
                      category: null,
                      total: categoryTotal(index),
                  },
              ],
    ),
    ...remainingCategories.value.map((category) => ({
        key: `new-${category.categoryId ?? 'sin-tipo'}`,
        label: categoryLabel(category.categoryName),
        index: null,
        category,
        total: 0,
    })),
])

watch(currentIndex, () => {
    isMovingCounts.value = false
})

function moveCurrentTo(target: MoveTarget) {
    const id = occurrenceId.value
    const source = currentCategory.value
    if (!id || !source) return
    const fromIndex = currentIndex.value
    const movedAmount = categoryTotal(fromIndex)
    let toIndex = target.index
    if (toIndex === null && target.category) {
        draftStore.addCategory(id, target.category)
        toIndex = draftStore.draftFor(id)?.currentIndex ?? null
    }
    if (toIndex === null) return
    draftStore.moveCounts(id, fromIndex, toIndex)
    isMovingCounts.value = false
    toast.success(
        `Se movieron ${formatMoney(movedAmount)} de ${categoryLabel(source.categoryName)} a ${target.label}`,
    )
    goToCategory(toIndex)
}

const countHint = computed(() =>
    isCorrection.value ? 'Corrigiendo un conteo guardado' : 'Lo del líder lo verás al revisar',
)

function onAmountChange(index: number, amount: number | null) {
    if (!occurrenceId.value) return
    draftStore.setAmount(occurrenceId.value, index, amount)
}

function onAmountCategoryAdd(category: EnvelopeCategory) {
    if (!occurrenceId.value) return
    draftStore.addCategory(occurrenceId.value, category)
}

function onAmountCategoryRemove(categoryId: number | null) {
    if (!occurrenceId.value) return
    draftStore.removeCategory(occurrenceId.value, categoryId)
}

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
    <main class="mx-auto flex w-full max-w-5xl flex-1 flex-col px-4 pb-4 pt-24 sm:px-6">
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
                :to="committeeHome"
                class="text-sm font-semibold text-primary hover:underline"
            >
                Volver al comité
            </NuxtLink>
        </div>

        <div
            v-else-if="isNotReady && envelope"
            class="flex flex-col items-center gap-3 rounded-xl border border-outline-variant bg-surface-container-low px-6 py-12 text-center"
        >
            <p class="font-display text-xl font-semibold text-on-surface">
                {{ envelope.meetingTitle }} todavía no termina
            </p>
            <p class="text-sm text-on-surface-variant">
                Podrás registrar su ofrenda después de las {{ envelope.endTime }}.
            </p>
            <NuxtLink
                :to="GENERAL_SERVICES_PATH"
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

            <EnvelopeAmountForm
                v-if="!isDirectEntry"
                :categories="categories"
                :remaining="remainingCategories"
                :hint="countHint"
                @change="onAmountChange"
                @add="onAmountCategoryAdd"
                @remove="onAmountCategoryRemove"
                @submit="goToReview"
            />

            <section
                v-else
                ref="countSectionRef"
                class="mt-4 scroll-mt-24 overflow-hidden rounded-xl border border-outline-variant bg-surface"
            >
                <div class="border-b border-outline-variant bg-surface-container-low px-3 py-3">
                    <p
                        class="mb-2 px-1 text-[11px] font-bold uppercase tracking-[0.16em] text-on-surface-variant"
                    >
                        Elige el tipo de ofrenda que vas a contar
                    </p>
                    <CategoryTabs
                        :steps="steps"
                        :current="currentIndex"
                        :can-add="remainingCategories.length > 0"
                        :is-adding="isAddingCategory"
                        panel-id="category-count-panel"
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

                <div
                    id="category-count-panel"
                    role="tabpanel"
                    :aria-labelledby="`category-tab-${currentCategory.categoryId ?? 'sin-tipo'}`"
                    class="p-4 sm:p-5"
                >
                    <div
                        class="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border-2 border-primary bg-primary/10 px-4 py-3"
                    >
                        <div class="flex min-w-0 items-center gap-3">
                            <span
                                class="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground"
                                aria-hidden="true"
                            >
                                <Coins class="size-5" />
                            </span>
                            <div class="min-w-0">
                                <p
                                    class="text-[11px] font-bold uppercase tracking-[0.16em] text-primary"
                                >
                                    Estás contando en
                                </p>
                                <h1
                                    class="truncate font-display text-2xl font-semibold text-on-surface"
                                >
                                    {{ categoryLabel(currentCategory.categoryName) }}
                                </h1>
                            </div>
                        </div>
                        <div class="flex items-center gap-4">
                            <div class="text-right">
                                <p
                                    class="text-[11px] font-bold uppercase tracking-[0.16em] text-on-surface-variant"
                                >
                                    Llevas
                                </p>
                                <p class="text-xl font-semibold tabular-nums text-on-surface">
                                    {{ formatMoney(categoryTotal(currentIndex)) }}
                                </p>
                            </div>
                            <button
                                v-if="currentHasCounts && moveTargets.length > 0"
                                type="button"
                                class="inline-flex items-center gap-1.5 rounded-lg border border-primary/60 bg-surface px-3 py-2 text-sm font-semibold text-primary transition-colors hover:bg-primary hover:text-primary-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                                :aria-expanded="isMovingCounts"
                                @click="isMovingCounts = !isMovingCounts"
                            >
                                <ArrowRightLeft class="size-4" aria-hidden="true" />
                                Mover a otra categoría
                            </button>
                        </div>
                    </div>

                    <div
                        v-if="isMovingCounts"
                        class="mb-4 rounded-xl border border-outline-variant bg-surface-container-low p-4"
                    >
                        <div class="flex flex-wrap items-start justify-between gap-2">
                            <div>
                                <p class="text-sm font-semibold text-on-surface">
                                    ¿A qué categoría pasas los
                                    {{ formatMoney(categoryTotal(currentIndex)) }} de
                                    {{ categoryLabel(currentCategory.categoryName) }}?
                                </p>
                                <p class="mt-0.5 text-xs text-on-surface-variant">
                                    Se mueven todos los billetes y monedas de una vez. Si la otra
                                    categoría ya tiene dinero, se suma.
                                </p>
                            </div>
                            <button
                                type="button"
                                class="text-xs font-semibold text-on-surface-variant hover:text-on-surface"
                                @click="isMovingCounts = false"
                            >
                                Cancelar
                            </button>
                        </div>
                        <div class="mt-3 flex flex-wrap gap-2">
                            <button
                                v-for="target in moveTargets"
                                :key="target.key"
                                type="button"
                                class="inline-flex items-center gap-1.5 rounded-full border border-primary/40 bg-surface px-3 py-1.5 text-sm font-semibold text-primary transition-colors hover:bg-primary hover:text-primary-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                                @click="moveCurrentTo(target)"
                            >
                                <ArrowRight class="size-3.5" aria-hidden="true" />
                                {{ target.label }}
                                <span v-if="target.total > 0" class="text-xs font-normal">
                                    (ya tiene {{ formatMoney(target.total) }})
                                </span>
                            </button>
                        </div>
                    </div>

                    <div class="mb-4 flex flex-wrap items-end justify-between gap-x-4 gap-y-1">
                        <p class="text-sm text-on-surface-variant">
                            Escribe cuántos billetes y monedas de
                            <strong class="text-on-surface">
                                {{ categoryLabel(currentCategory.categoryName) }}
                            </strong>
                            vienen. Deja vacío lo que no venga. Si el dinero es de otro tipo,
                            cámbialo arriba antes de escribir.
                        </p>
                        <div class="flex flex-col items-start gap-1 sm:items-end">
                            <p
                                class="inline-flex items-center gap-1.5 text-xs text-on-surface-variant"
                            >
                                <EyeOff class="size-3.5 text-primary" />
                                {{
                                    isCorrection
                                        ? 'Corrigiendo un conteo guardado'
                                        : 'Culto general: lo que cuentes será la ofrenda registrada'
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

            <div class="pointer-events-none sticky bottom-0 z-40 mt-auto pb-4 pt-6">
                <div
                    class="pointer-events-auto flex w-full items-center justify-between gap-3 rounded-xl border border-outline-variant bg-surface/95 px-4 py-3 shadow-[0_-8px_24px_rgba(0,0,0,0.08)] backdrop-blur sm:px-5"
                >
                    <div class="flex min-w-0 items-center gap-4">
                        <template v-if="isDirectEntry">
                            <div class="min-w-0">
                                <p
                                    class="truncate text-[10px] font-bold uppercase tracking-[0.16em] text-on-surface-variant"
                                >
                                    <span class="hidden sm:mr-1 sm:inline">Contando en</span>
                                    <span class="text-primary">
                                        {{ categoryLabel(currentCategory.categoryName) }}
                                    </span>
                                </p>
                                <p class="text-lg font-semibold tabular-nums text-on-surface">
                                    {{ formatMoney(categoryTotal(currentIndex)) }}
                                </p>
                            </div>
                            <span class="h-8 w-px bg-outline-variant" />
                        </template>
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
                        <UiButton
                            v-if="!isDirectEntry"
                            type="button"
                            class="h-11 rounded-lg px-5 text-sm"
                            @click="goToReview"
                        >
                            Revisar
                            <ArrowRight class="size-4" />
                        </UiButton>
                        <template v-else>
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
                        </template>
                    </div>
                </div>
            </div>
        </template>
    </main>
</template>
