<script setup lang="ts">
import {
    AlertTriangle,
    ArrowLeft,
    CheckCircle2,
    Clock,
    Loader2,
    PackageX,
    ShieldCheck,
} from '@lucide/vue'
import { useAppToast } from '~/presentation/shared/composables/useAppToast'
import EnvelopeHeader from '~/presentation/support-committee/components/EnvelopeHeader.vue'
import ReceptionComparison from '~/presentation/support-committee/components/ReceptionComparison.vue'
import {
    categoryLabel,
    differenceLabel,
    formatDateTime,
    formatMoney,
} from '~/presentation/support-committee/utils/reception-format.util'
import { resolveHttpErrorMessage } from '~/utils/http/resolve-http-error-message.util'
import ReconciliationDetailSkeleton from '../components/ReconciliationDetailSkeleton.vue'
import ReconciliationStatusBadge from '../components/ReconciliationStatusBadge.vue'
import {
    useCloseDiscrepancyMutation,
    useEnvelopeReviewQuery,
} from '../composables/useReconciliationQueries'
import { RECONCILIATION_ENVELOPES, pendingLabel } from '../utils/reconciliation-format.util'

defineOptions({ name: 'ReconciliationEnvelopeDetailView' })

const route = useRoute()
const toast = useAppToast()

const occurrenceId = computed(() => {
    const raw = Number(route.params.occurrenceId)
    return Number.isSafeInteger(raw) && raw > 0 ? raw : null
})

const reviewQuery = useEnvelopeReviewQuery(occurrenceId)
const closeMutation = useCloseDiscrepancyMutation()

const review = computed(() => reviewQuery.data.value ?? null)
const reception = computed(() => review.value?.reception ?? null)
const closingNotes = ref('')
const formError = ref<string | null>(null)

const backLink = computed(() => ({ path: RECONCILIATION_ENVELOPES, query: route.query }))

useHead({
    title: computed(() =>
        review.value
            ? `${review.value.envelope.meetingTitle} · Conciliación · Sistema`
            : 'Sobre · Conciliación · Sistema',
    ),
})

const loadError = computed(() =>
    reviewQuery.error.value
        ? resolveHttpErrorMessage(reviewQuery.error.value, 'No fue posible abrir el sobre')
        : '',
)

async function onClose() {
    if (!occurrenceId.value) return
    formError.value = null
    const notes = closingNotes.value.trim()
    if (notes.length < 5) {
        formError.value = 'Escribe qué se resolvió con esta diferencia.'
        return
    }
    try {
        await closeMutation.mutateAsync({ occurrenceId: occurrenceId.value, notes })
        closingNotes.value = ''
        toast.success('Diferencia marcada como revisada')
    } catch (error) {
        formError.value = resolveHttpErrorMessage(error, 'No fue posible cerrar la diferencia')
    }
}
</script>

<template>
    <main class="mx-auto w-full max-w-5xl px-4 pb-24 pt-24 sm:px-6">
        <NuxtLink
            :to="backLink"
            class="mb-5 inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-on-surface-variant transition-colors hover:text-on-surface"
        >
            <ArrowLeft class="size-4" />
            Volver a los sobres
        </NuxtLink>

        <div
            v-if="loadError"
            class="rounded-xl border border-destructive/40 bg-destructive/10 px-6 py-10 text-center text-sm text-destructive"
        >
            {{ loadError }}
        </div>

        <ReconciliationDetailSkeleton v-else-if="!review" />

        <template v-else>
            <EnvelopeHeader :envelope="review.envelope" />

            <section
                class="mt-4 flex flex-col gap-4 rounded-xl border p-5 sm:flex-row sm:items-center"
                :class="{
                    'border-emerald-500/40 bg-emerald-500/10': review.status === 'cuadra',
                    'border-amber-500/40 bg-amber-500/10': review.status === 'diferencia_abierta',
                    'border-sky-500/40 bg-sky-500/10': review.status === 'diferencia_cerrada',
                    'border-rose-500/40 bg-rose-500/10': review.status === 'sin_entregar',
                }"
            >
                <CheckCircle2
                    v-if="review.status === 'cuadra'"
                    class="size-10 shrink-0 text-emerald-600 dark:text-emerald-300"
                />
                <AlertTriangle
                    v-else-if="review.status === 'diferencia_abierta'"
                    class="size-10 shrink-0 text-amber-600 dark:text-amber-300"
                />
                <ShieldCheck
                    v-else-if="review.status === 'diferencia_cerrada'"
                    class="size-10 shrink-0 text-sky-600 dark:text-sky-300"
                />
                <PackageX v-else class="size-10 shrink-0 text-rose-600 dark:text-rose-300" />
                <div class="min-w-0 flex-1">
                    <div class="flex flex-wrap items-center gap-2">
                        <h1 class="font-display text-2xl font-semibold text-on-surface">
                            <template v-if="review.status === 'sin_entregar'">
                                El comité aún no recibe este sobre
                            </template>
                            <template v-else-if="reception">
                                {{ differenceLabel(reception.difference) }}
                            </template>
                        </h1>
                        <ReconciliationStatusBadge :status="review.status" />
                    </div>
                    <p class="mt-1 text-sm text-on-surface">
                        <template v-if="review.status === 'sin_entregar'">
                            El líder registró {{ formatMoney(review.registeredAmount) }}
                            <template v-if="review.envelope.recordedAt">
                                el {{ formatDateTime(review.envelope.recordedAt) }}
                            </template>
                        </template>
                        <template v-else-if="reception">
                            El líder registró {{ formatMoney(reception.registeredAmount) }} y el
                            comité contó {{ formatMoney(reception.countedAmount) }}.
                        </template>
                    </p>
                </div>
                <p
                    v-if="review.pendingDays !== null"
                    class="inline-flex shrink-0 items-center gap-1.5 text-sm font-semibold text-on-surface"
                >
                    <Clock class="size-4" />
                    {{
                        review.status === 'sin_entregar'
                            ? `Pendiente hace ${pendingLabel(review.pendingDays)}`
                            : `Sin revisar hace ${pendingLabel(review.pendingDays)}`
                    }}
                </p>
            </section>

            <template v-if="reception">
                <div class="mt-6">
                    <ReceptionComparison
                        :categories="reception.categories"
                        :registered-amount="reception.registeredAmount"
                        :counted-amount="reception.countedAmount"
                        :difference="reception.difference"
                    />
                </div>

                <section class="mt-4 grid gap-4 sm:grid-cols-2">
                    <div class="rounded-xl border border-outline-variant bg-surface px-5 py-4">
                        <h2
                            class="text-[10px] font-bold uppercase tracking-[0.18em] text-on-surface-variant"
                        >
                            Comité de apoyo
                        </h2>
                        <p class="mt-1 text-sm text-on-surface">
                            Recibió {{ reception.receivedByName ?? 'sin usuario' }} ·
                            {{ formatDateTime(reception.receivedAt) }}
                        </p>
                        <p v-if="reception.reviewedAt" class="text-xs text-on-surface-variant">
                            Corrigió {{ reception.reviewedByName ?? 'sin usuario' }} ·
                            {{ formatDateTime(reception.reviewedAt) }}
                        </p>
                    </div>
                    <div class="rounded-xl border border-outline-variant bg-surface px-5 py-4">
                        <h2
                            class="text-[10px] font-bold uppercase tracking-[0.18em] text-on-surface-variant"
                        >
                            Observación del comité
                        </h2>
                        <p class="mt-1 whitespace-pre-line text-sm text-on-surface">
                            {{ reception.notes || 'Sin observación.' }}
                        </p>
                    </div>
                </section>

                <section
                    v-if="review.status === 'diferencia_cerrada'"
                    class="mt-4 rounded-xl border border-sky-500/40 bg-sky-500/10 px-5 py-4"
                >
                    <h2 class="flex items-center gap-2 text-sm font-semibold text-on-surface">
                        <ShieldCheck class="size-4 text-sky-600 dark:text-sky-300" />
                        Revisado por {{ reception.closedByName ?? 'sin usuario' }} ·
                        {{ formatDateTime(reception.closedAt) }}
                    </h2>
                    <p class="mt-1 whitespace-pre-line text-sm text-on-surface">
                        {{ reception.closingNotes }}
                    </p>
                </section>

                <section
                    v-if="review.status === 'diferencia_abierta'"
                    class="mt-6 rounded-xl border border-outline-variant bg-surface p-5"
                >
                    <label
                        for="closing-notes"
                        class="block font-display text-lg font-semibold text-on-surface"
                    >
                        Cerrar esta diferencia
                    </label>
                    <p class="mt-1 text-sm text-on-surface-variant">
                        Escribe qué se averiguó y cómo se resolvió (por ejemplo: el líder entregó el
                        faltante, fue un error de registro, se reportó a pastoría). Después de
                        cerrarla, el comité ya no podrá corregir el conteo.
                    </p>
                    <textarea
                        id="closing-notes"
                        v-model="closingNotes"
                        rows="3"
                        maxlength="600"
                        class="mt-3 w-full rounded-lg border bg-surface px-3 py-2 text-sm text-on-surface outline-none transition-colors placeholder:text-on-surface-variant/50 focus:border-primary focus:ring-2 focus:ring-primary/40"
                        :class="formError ? 'border-destructive' : 'border-outline-variant'"
                        placeholder="¿Qué se resolvió?"
                        @input="formError = null"
                    />
                    <p v-if="formError" role="alert" class="mt-2 text-sm text-destructive">
                        {{ formError }}
                    </p>
                    <div class="mt-4 flex justify-end">
                        <UiButton
                            type="button"
                            class="h-11 rounded-lg px-6 text-sm"
                            :disabled="closeMutation.isPending.value"
                            @click="onClose"
                        >
                            <Loader2
                                v-if="closeMutation.isPending.value"
                                class="size-4 animate-spin"
                            />
                            <ShieldCheck v-else class="size-4" />
                            Marcar como revisado
                        </UiButton>
                    </div>
                </section>
            </template>

            <section
                v-else
                class="mt-6 overflow-hidden rounded-xl border border-outline-variant bg-surface"
            >
                <h2
                    class="border-b border-outline-variant bg-surface-container-low px-5 py-3 text-[10px] font-bold uppercase tracking-[0.16em] text-on-surface-variant"
                >
                    Lo que registró el líder
                </h2>
                <ul>
                    <li
                        v-for="item in review.registered"
                        :key="item.categoryId ?? 'sin-tipo'"
                        class="flex items-center justify-between border-b border-outline-variant px-5 py-3 text-sm last:border-b-0"
                    >
                        <span class="text-on-surface">{{ categoryLabel(item.categoryName) }}</span>
                        <span class="font-semibold tabular-nums text-on-surface">
                            {{ formatMoney(item.amount) }}
                        </span>
                    </li>
                </ul>
                <p
                    class="flex items-center justify-between bg-surface-container-low px-5 py-3 text-sm font-bold text-on-surface"
                >
                    <span>Total</span>
                    <span class="tabular-nums">{{ formatMoney(review.registeredAmount) }}</span>
                </p>
            </section>
        </template>
    </main>
</template>
