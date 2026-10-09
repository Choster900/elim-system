<script setup lang="ts">
import {
    AlertTriangle,
    ArrowLeft,
    ArrowRight,
    CheckCircle2,
    PartyPopper,
    Pencil,
    ShieldCheck,
} from '@lucide/vue'
import { resolveHttpErrorMessage } from '~/utils/http/resolve-http-error-message.util'
import EnvelopeHeader from '../components/EnvelopeHeader.vue'
import ReceptionComparison from '../components/ReceptionComparison.vue'
import ReceptionStatusBadge from '../components/ReceptionStatusBadge.vue'
import ReceptionSteps from '../components/ReceptionSteps.vue'
import { useEnvelopeQuery, usePendingEnvelopesQuery } from '../composables/useReceptionQueries'
import {
    RECEIVED_ENVELOPES_PATH,
    SUPPORT_COMMITTEE_HOME,
    countPath,
    formatDateTime,
    formatMoney,
    shortDateLabel,
} from '../utils/reception-format.util'

defineOptions({ name: 'EnvelopeDetailView' })

const route = useRoute()

const occurrenceId = computed(() => {
    const raw = Number(route.params.occurrenceId)
    return Number.isSafeInteger(raw) && raw > 0 ? raw : null
})
const finishedAs = computed(() => {
    const value = route.query.listo
    return value === 'recibido' || value === 'corregido' ? value : null
})

const envelopeQuery = useEnvelopeQuery(occurrenceId)
const pendingQuery = usePendingEnvelopesQuery(computed(() => ({ page: 1, limit: 2 })))

const envelope = computed(() => envelopeQuery.data.value?.envelope ?? null)
const reception = computed(() => envelopeQuery.data.value?.reception ?? null)
const nextEnvelope = computed(
    () =>
        (pendingQuery.data.value?.items ?? []).find(
            (item) => item.occurrenceId !== occurrenceId.value,
        ) ?? null,
)

useHead({
    title: computed(() =>
        envelope.value ? `Sobre · ${envelope.value.meetingTitle} · Sistema` : 'Sobre · Sistema',
    ),
})

const loadError = computed(() =>
    envelopeQuery.error.value
        ? resolveHttpErrorMessage(envelopeQuery.error.value, 'No fue posible abrir el sobre')
        : '',
)

watch(
    () => envelopeQuery.data.value,
    (detail) => {
        if (detail && !detail.reception && occurrenceId.value) {
            navigateTo(countPath(occurrenceId.value), { replace: true })
        }
    },
    { immediate: true },
)
</script>

<template>
    <main class="mx-auto w-full max-w-system px-4 pb-24 pt-24 sm:px-6 lg:px-10">
        <div class="mb-6 flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
            <NuxtLink
                :to="finishedAs ? SUPPORT_COMMITTEE_HOME : RECEIVED_ENVELOPES_PATH"
                class="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-on-surface-variant transition-colors hover:text-on-surface"
            >
                <ArrowLeft class="size-4" />
                {{ finishedAs ? 'Volver a la bandeja' : 'Volver a recibidos' }}
            </NuxtLink>
            <ReceptionSteps v-if="finishedAs" :current="3" />
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
            v-else-if="!envelope || !reception"
            class="rounded-xl border border-outline-variant bg-surface-container-low px-6 py-16 text-center text-sm text-on-surface-variant"
        >
            Cargando el sobre…
        </div>

        <template v-else>
            <section
                v-if="finishedAs"
                class="mb-8 flex flex-col gap-5 rounded-2xl border border-primary/30 bg-primary/[0.06] p-6 sm:flex-row sm:items-center sm:justify-between"
            >
                <div class="flex items-start gap-4">
                    <CheckCircle2 class="size-10 shrink-0 text-primary" />
                    <div>
                        <h1 class="font-display text-3xl font-semibold text-on-surface">
                            {{
                                finishedAs === 'corregido'
                                    ? 'Conteo corregido'
                                    : 'Sobre recibido y guardado'
                            }}
                        </h1>
                        <p class="mt-1 text-sm text-on-surface-variant">
                            <template v-if="nextEnvelope">
                                Sigue:
                                <strong class="text-on-surface">
                                    {{ nextEnvelope.meetingTitle }}
                                </strong>
                                <span class="capitalize">
                                    · {{ shortDateLabel(nextEnvelope.date) }}
                                </span>
                            </template>
                            <template v-else-if="!pendingQuery.isPending.value">
                                Ya no quedan sobres por recibir.
                            </template>
                        </p>
                    </div>
                </div>
                <NuxtLink
                    v-if="nextEnvelope"
                    :to="countPath(nextEnvelope.occurrenceId)"
                    class="inline-flex h-12 shrink-0 items-center justify-center gap-2 rounded-lg bg-primary px-6 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90"
                >
                    Recibir el siguiente sobre
                    <ArrowRight class="size-4" />
                </NuxtLink>
                <NuxtLink
                    v-else-if="!pendingQuery.isPending.value"
                    :to="SUPPORT_COMMITTEE_HOME"
                    class="inline-flex h-12 shrink-0 items-center justify-center gap-2 rounded-lg bg-primary px-6 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90"
                >
                    <PartyPopper class="size-4" />
                    Volver a la bandeja
                </NuxtLink>
            </section>

            <EnvelopeHeader :envelope="envelope" />

            <section
                class="mt-6 flex flex-col gap-4 rounded-xl border border-outline-variant bg-surface-container-low px-5 py-4 sm:flex-row sm:items-center sm:justify-between"
            >
                <div class="flex flex-wrap items-center gap-3">
                    <ReceptionStatusBadge :status="reception.status" />
                    <span class="text-sm text-on-surface">
                        Contado
                        <strong class="tabular-nums">
                            {{ formatMoney(reception.countedAmount) }}
                        </strong>
                    </span>
                </div>
                <div class="text-xs text-on-surface-variant sm:text-right">
                    <p>
                        Recibió {{ reception.receivedByName ?? 'sin usuario' }} ·
                        {{ formatDateTime(reception.receivedAt) }}
                    </p>
                    <p v-if="reception.reviewedAt">
                        Corrigió {{ reception.reviewedByName ?? 'sin usuario' }} ·
                        {{ formatDateTime(reception.reviewedAt) }}
                    </p>
                </div>
            </section>

            <section
                v-if="reception.notes"
                class="mt-4 rounded-xl border border-outline-variant bg-surface px-5 py-4"
            >
                <h2
                    class="text-[10px] font-bold uppercase tracking-[0.18em] text-on-surface-variant"
                >
                    Observación
                </h2>
                <p class="mt-1 whitespace-pre-line text-sm text-on-surface">
                    {{ reception.notes }}
                </p>
            </section>

            <div class="mt-6">
                <ReceptionComparison
                    :categories="reception.categories"
                    :registered-amount="reception.registeredAmount"
                    :counted-amount="reception.countedAmount"
                    :difference="reception.difference"
                />
            </div>

            <section
                v-if="reception.closedAt"
                class="mt-6 rounded-xl border border-sky-500/40 bg-sky-500/10 px-5 py-4"
            >
                <h2 class="flex items-center gap-2 text-sm font-semibold text-on-surface">
                    <ShieldCheck class="size-4 text-sky-600 dark:text-sky-300" />
                    Revisado por Finanzas · {{ reception.closedByName ?? 'sin usuario' }} ·
                    {{ formatDateTime(reception.closedAt) }}
                </h2>
                <p class="mt-1 whitespace-pre-line text-sm text-on-surface">
                    {{ reception.closingNotes }}
                </p>
                <p class="mt-2 text-xs text-on-surface-variant">
                    Este sobre ya está cerrado y su conteo no se puede corregir.
                </p>
            </section>

            <div v-else class="mt-6 flex justify-end">
                <NuxtLink
                    :to="countPath(reception.occurrenceId, true)"
                    class="inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:underline"
                >
                    <Pencil class="size-4" />
                    Corregir conteo
                </NuxtLink>
            </div>
        </template>
    </main>
</template>
