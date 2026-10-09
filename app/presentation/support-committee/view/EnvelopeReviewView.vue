<script setup lang="ts">
import { AlertTriangle, ArrowLeft, Check, CheckCircle2, Loader2 } from '@lucide/vue'
import { useAppToast } from '~/presentation/shared/composables/useAppToast'
import { resolveHttpErrorMessage } from '~/utils/http/resolve-http-error-message.util'
import EnvelopeHeader from '../components/EnvelopeHeader.vue'
import ReceptionComparison from '../components/ReceptionComparison.vue'
import ReceptionSteps from '../components/ReceptionSteps.vue'
import { useSaveReceptionMutation } from '../composables/useReceptionMutations'
import { useEnvelopeComparisonQuery, useEnvelopeQuery } from '../composables/useReceptionQueries'
import { draftToCountInput, useReceptionDraftStore } from '../stores/reception-draft.store'
import {
    countPath,
    differenceLabel,
    envelopePath,
    formatMoney,
    toCents,
} from '../utils/reception-format.util'

defineOptions({ name: 'EnvelopeReviewView' })

const route = useRoute()
const toast = useAppToast()
const draftStore = useReceptionDraftStore()
const saveMutation = useSaveReceptionMutation()

const occurrenceId = computed(() => {
    const raw = Number(route.params.occurrenceId)
    return Number.isSafeInteger(raw) && raw > 0 ? raw : null
})
const isCorrection = computed(() => route.query.modo === 'corregir')

const isClientReady = ref(false)
const isFinishing = ref(false)
const formError = ref<string | null>(null)
const notesRef = ref<HTMLTextAreaElement | null>(null)

const draft = computed(() =>
    isClientReady.value && occurrenceId.value ? draftStore.draftFor(occurrenceId.value) : null,
)
const countInput = computed(() => (draft.value ? draftToCountInput(draft.value) : null))

const envelopeQuery = useEnvelopeQuery(occurrenceId)
const comparisonQuery = useEnvelopeComparisonQuery(occurrenceId, countInput)

const envelope = computed(() => envelopeQuery.data.value?.envelope ?? null)
const comparison = computed(() => comparisonQuery.data.value ?? null)
const needsNote = computed(() => comparison.value?.status === 'con_diferencia')
const totalMatches = computed(() =>
    comparison.value ? toCents(comparison.value.difference) === 0 : false,
)

useHead({
    title: computed(() =>
        envelope.value
            ? `Revisar · ${envelope.value.meetingTitle} · Sistema`
            : 'Revisar conteo · Sistema',
    ),
})

const loadError = computed(() => {
    const error = envelopeQuery.error.value ?? comparisonQuery.error.value
    return error ? resolveHttpErrorMessage(error, 'No fue posible comparar el conteo') : ''
})

onMounted(() => {
    draftStore.ensureLoaded()
    isClientReady.value = true
    if (occurrenceId.value && !draftStore.draftFor(occurrenceId.value)) {
        navigateTo(countPath(occurrenceId.value, isCorrection.value), { replace: true })
    }
})

watch(
    () => envelopeQuery.data.value,
    (detail) => {
        if (!detail || !occurrenceId.value || isFinishing.value) return
        if (detail.reception && !isCorrection.value) {
            draftStore.clearDraft(occurrenceId.value)
            navigateTo(envelopePath(occurrenceId.value), { replace: true })
        }
    },
)

function onNotesInput(event: Event) {
    if (!occurrenceId.value) return
    draftStore.setNotes(occurrenceId.value, (event.target as HTMLTextAreaElement).value)
    formError.value = null
}

async function onConfirm() {
    const id = occurrenceId.value
    const currentDraft = draft.value
    if (!id || !currentDraft || !countInput.value) return

    formError.value = null
    const notes = currentDraft.notes.trim()
    if (needsNote.value && !notes) {
        formError.value = 'Escribe una observación que explique la diferencia antes de confirmar.'
        notesRef.value?.focus()
        return
    }

    try {
        await saveMutation.mutateAsync({
            occurrenceId: id,
            input: { ...countInput.value, notes: notes || null },
            isCorrection: isCorrection.value,
        })
        isFinishing.value = true
        draftStore.clearDraft(id)
        toast.success(isCorrection.value ? 'Conteo corregido' : 'Sobre recibido')
        await navigateTo(
            `${envelopePath(id)}?listo=${isCorrection.value ? 'corregido' : 'recibido'}`,
            { replace: true },
        )
    } catch (error) {
        formError.value = resolveHttpErrorMessage(error, 'No fue posible guardar la recepción')
    }
}
</script>

<template>
    <main class="mx-auto w-full max-w-system px-4 pb-24 pt-24 sm:px-6 lg:px-10">
        <div class="mb-6 flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
            <NuxtLink
                v-if="occurrenceId"
                :to="countPath(occurrenceId, isCorrection)"
                class="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-on-surface-variant transition-colors hover:text-on-surface"
            >
                <ArrowLeft class="size-4" />
                Volver a contar
            </NuxtLink>
            <ReceptionSteps :current="2" />
        </div>

        <div
            v-if="loadError"
            class="flex flex-col items-center gap-3 rounded-xl border border-destructive/40 bg-destructive/10 px-6 py-12 text-center"
        >
            <AlertTriangle class="size-8 text-destructive" />
            <p class="text-sm text-destructive">{{ loadError }}</p>
            <NuxtLink
                v-if="occurrenceId"
                :to="countPath(occurrenceId, isCorrection)"
                class="text-sm font-semibold text-primary hover:underline"
            >
                Volver a contar
            </NuxtLink>
        </div>

        <div
            v-else-if="isFinishing || !envelope || !comparison"
            class="rounded-xl border border-outline-variant bg-surface-container-low px-6 py-16 text-center text-sm text-on-surface-variant"
        >
            {{ isFinishing ? 'Guardando…' : 'Comparando con lo que registró el líder…' }}
        </div>

        <template v-else>
            <EnvelopeHeader :envelope="envelope" />

            <section
                class="mt-6 flex flex-col gap-4 rounded-2xl border p-6 sm:flex-row sm:items-center"
                :class="
                    needsNote
                        ? 'border-amber-500/40 bg-amber-500/10'
                        : 'border-emerald-500/40 bg-emerald-500/10'
                "
                role="status"
            >
                <AlertTriangle
                    v-if="needsNote"
                    class="size-12 shrink-0 text-amber-600 dark:text-amber-300"
                />
                <CheckCircle2
                    v-else
                    class="size-12 shrink-0 text-emerald-600 dark:text-emerald-300"
                />
                <div>
                    <h1
                        class="font-display text-3xl font-semibold"
                        :class="
                            needsNote
                                ? 'text-amber-800 dark:text-amber-200'
                                : 'text-emerald-800 dark:text-emerald-200'
                        "
                    >
                        <template v-if="!needsNote">¡Cuadra!</template>
                        <template v-else-if="totalMatches">El total cuadra, los tipos no</template>
                        <template v-else
                            >No cuadra:
                            {{ differenceLabel(comparison.difference).toLowerCase() }}</template
                        >
                    </h1>
                    <p class="mt-1 text-sm text-on-surface">
                        <template v-if="!needsNote">
                            Contaste {{ formatMoney(comparison.countedAmount) }}, igual a lo que
                            registró el líder.
                        </template>
                        <template v-else>
                            Contaste {{ formatMoney(comparison.countedAmount) }} y el líder registró
                            {{ formatMoney(comparison.registeredAmount) }}. Revisa la tabla: puedes
                            volver a contar o confirmar explicando qué pasó.
                        </template>
                    </p>
                </div>
            </section>

            <div class="mt-6">
                <ReceptionComparison
                    :categories="comparison.categories"
                    :registered-amount="comparison.registeredAmount"
                    :counted-amount="comparison.countedAmount"
                    :difference="comparison.difference"
                />
            </div>

            <section class="mt-6">
                <label for="reception-notes" class="block text-sm font-semibold text-on-surface">
                    Observación
                    <span v-if="needsNote" class="text-amber-700 dark:text-amber-300">
                        (obligatoria)
                    </span>
                    <span v-else class="font-normal text-on-surface-variant">(opcional)</span>
                </label>
                <p v-if="needsNote" class="mt-1 text-xs text-on-surface-variant">
                    Explica la diferencia: por ejemplo, el líder anotó mal un monto o faltaba dinero
                    en el sobre.
                </p>
                <textarea
                    id="reception-notes"
                    ref="notesRef"
                    :value="draft?.notes ?? ''"
                    rows="3"
                    maxlength="600"
                    class="mt-2 w-full rounded-lg border bg-surface px-3 py-2 text-sm text-on-surface outline-none transition-colors placeholder:text-on-surface-variant/50 focus:border-primary focus:ring-2 focus:ring-primary/40"
                    :class="
                        formError && needsNote ? 'border-destructive' : 'border-outline-variant'
                    "
                    placeholder="Escribe aquí cualquier detalle del sobre"
                    @input="onNotesInput"
                />
            </section>

            <p
                v-if="formError"
                role="alert"
                class="mt-4 flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive"
            >
                <AlertTriangle class="mt-0.5 size-4 shrink-0" />
                {{ formError }}
            </p>

            <div
                class="mt-8 flex flex-col-reverse gap-4 border-t border-outline-variant pt-6 sm:flex-row sm:items-center sm:justify-between"
            >
                <NuxtLink
                    v-if="occurrenceId"
                    :to="countPath(occurrenceId, isCorrection)"
                    class="inline-flex items-center justify-center gap-1.5 text-sm font-semibold text-on-surface-variant hover:text-on-surface"
                >
                    <ArrowLeft class="size-4" />
                    Volver a contar
                </NuxtLink>
                <UiButton
                    type="button"
                    class="h-12 rounded-lg px-8 text-sm"
                    :disabled="saveMutation.isPending.value"
                    @click="onConfirm"
                >
                    <Loader2 v-if="saveMutation.isPending.value" class="size-4 animate-spin" />
                    <Check v-else class="size-4" />
                    {{ isCorrection ? 'Guardar corrección' : 'Confirmar recepción' }}
                </UiButton>
            </div>
        </template>
    </main>
</template>
