<script setup lang="ts">
import { Info, Save, UserRoundX, X } from '@lucide/vue'
import type { DatePickerValue } from '~/components/ui/DatePicker.vue'
import { useAppToast } from '~/presentation/shared/composables/useAppToast'
import { resolveHttpErrorMessage } from '~/utils/http/resolve-http-error-message.util'
import { useSaveTitheMutation } from '../composables/useTitheMutations'
import { useTithersQuery } from '../composables/useTitheQueries'
import type { TitheRecord } from '../interfaces/tithe.interface'
import { formatMoney, shortDateLabel, toCents } from '../utils/reception-format.util'
import { memberMeta, timeLabel } from '../utils/tithe-format.util'

const props = defineProps<{
    editing: TitheRecord | null
    tithes: TitheRecord[]
    today: string
}>()

const emit = defineEmits<{
    saved: [tithe: TitheRecord]
    cancel: []
}>()

const MAX_WHOLE_DIGITS = 7
const FOCUS_AFTER_SELECT_MS = 60

const toast = useAppToast()
const saveMutation = useSaveTitheMutation()
const tithersQuery = useTithersQuery()

const selectWrapperRef = ref<HTMLElement | null>(null)
const amountRef = ref<HTMLInputElement | null>(null)

const memberId = ref<number | null>(null)
const amountText = ref('')
const date = ref(props.today)
const notes = ref('')
const attempted = ref(false)
let focusTimer: ReturnType<typeof setTimeout> | undefined

const isEditing = computed(() => props.editing !== null)
const isSaving = computed(() => saveMutation.isPending.value)

const tithers = computed(() => tithersQuery.data.value ?? [])
const noTithers = computed(() => tithersQuery.isSuccess.value && tithers.value.length === 0)

const selectableMembers = computed(() => {
    const current = props.editing?.member
    if (!current || tithers.value.some((member) => member.id === current.id)) return tithers.value
    return [current, ...tithers.value]
})

const memberOptions = computed(() =>
    selectableMembers.value.map((member) => ({
        id: member.id,
        label: member.fullName,
        description: memberMeta(member),
        code: member.code,
        documentNumber: member.documentNumber ?? '',
    })),
)

const selectedMember = computed(
    () => selectableMembers.value.find((member) => member.id === memberId.value) ?? null,
)

const dateModel = computed<DatePickerValue>({
    get: () => date.value,
    set: (value) => {
        if (typeof value !== 'string' || !value) return
        date.value = value > props.today ? props.today : value
    },
})

const amountCents = computed(() => {
    const value = Number(amountText.value)
    return amountText.value && Number.isFinite(value) ? toCents(value) : 0
})
const amountValid = computed(() => amountCents.value > 0)

const errors = computed(() =>
    attempted.value
        ? [
              ...(memberId.value === null ? ['Elige al diezmador.'] : []),
              ...(amountValid.value ? [] : ['Escribe un monto mayor que $0.00.']),
          ]
        : [],
)

const previousFromMember = computed(() =>
    memberId.value === null
        ? []
        : props.tithes.filter(
              (tithe) =>
                  tithe.member.id === memberId.value &&
                  tithe.date === date.value &&
                  tithe.id !== props.editing?.id,
          ),
)

const previousSummary = computed(() =>
    previousFromMember.value
        .map((tithe) => `${formatMoney(tithe.amount)} a las ${timeLabel(tithe.receivedAt)}`)
        .join('; '),
)

function focusMember() {
    nextTick(() => selectWrapperRef.value?.querySelector<HTMLButtonElement>('button')?.focus())
}

function focusAmount() {
    clearTimeout(focusTimer)
    focusTimer = setTimeout(() => {
        amountRef.value?.focus()
        amountRef.value?.select()
    }, FOCUS_AFTER_SELECT_MS)
}

function reset() {
    memberId.value = null
    amountText.value = ''
    notes.value = ''
    attempted.value = false
}

function onMemberChange(value: unknown) {
    const next = typeof value === 'number' ? value : null
    const changed = next !== memberId.value
    memberId.value = next
    if (next !== null && changed) focusAmount()
}

watch(
    () => props.editing,
    (tithe) => {
        if (!tithe) {
            reset()
            return
        }
        memberId.value = tithe.member.id
        amountText.value = tithe.amount.toFixed(2)
        date.value = tithe.date
        notes.value = tithe.notes ?? ''
        attempted.value = false
        focusAmount()
    },
)

function sanitizeAmount(raw: string) {
    const [whole = '', ...fraction] = raw.replace(/[^\d.]/g, '').split('.')
    const digits = whole.replace(/^0+(?=\d)/, '').slice(0, MAX_WHOLE_DIGITS)
    return fraction.length > 0 ? `${digits || '0'}.${fraction.join('').slice(0, 2)}` : digits
}

function onAmountInput(event: Event) {
    const input = event.currentTarget as HTMLInputElement
    const clean = sanitizeAmount(input.value)
    if (clean !== input.value) input.value = clean
    amountText.value = clean
}

async function submit() {
    attempted.value = true
    if (isSaving.value) return
    if (memberId.value === null) {
        focusMember()
        return
    }
    if (!amountValid.value) {
        focusAmount()
        return
    }

    const savedName = selectedMember.value?.fullName ?? 'el diezmador'
    const wasEditing = isEditing.value
    try {
        const tithe = await saveMutation.mutateAsync({
            id: props.editing?.id ?? null,
            input: {
                memberId: memberId.value,
                amount: amountCents.value / 100,
                date: date.value,
                notes: notes.value.trim() || null,
            },
        })
        toast.success(
            wasEditing
                ? `Diezmo de ${savedName} actualizado`
                : `Diezmo de ${savedName} registrado · ${formatMoney(tithe.amount)}`,
        )
        emit('saved', tithe)
        reset()
        if (wasEditing) date.value = props.today
        focusMember()
    } catch (error) {
        toast.error(resolveHttpErrorMessage(error, 'No fue posible guardar el diezmo'))
    }
}

function cancel() {
    emit('cancel')
    date.value = props.today
    focusMember()
}

onMounted(() => {
    if (window.matchMedia('(min-width: 1024px)').matches) focusMember()
})

onBeforeUnmount(() => clearTimeout(focusTimer))

const labelClass =
    'mb-1 block text-[11px] font-semibold uppercase tracking-wider text-on-surface-variant'
</script>

<template>
    <section
        class="rounded-xl border bg-surface"
        :class="isEditing ? 'border-primary' : 'border-outline-variant'"
    >
        <div
            v-if="editing"
            class="flex items-center justify-between gap-3 border-b border-outline-variant bg-primary/5 px-4 py-2 text-xs"
        >
            <p class="text-on-surface">
                Corrigiendo el diezmo de
                <strong>{{ editing.member.fullName }}</strong>
                del {{ shortDateLabel(editing.date) }}
            </p>
            <button
                type="button"
                class="inline-flex items-center gap-1 font-semibold text-on-surface-variant hover:text-on-surface"
                @click="cancel"
            >
                <X class="size-3.5" />
                Cancelar
            </button>
        </div>

        <form
            class="grid gap-3 p-4 md:grid-cols-[minmax(0,1fr)_9rem] xl:grid-cols-[minmax(0,1.5fr)_9rem_11rem_minmax(0,1fr)_auto] xl:items-end"
            novalidate
            @submit.prevent="submit"
        >
            <div class="md:col-span-2 xl:col-span-1">
                <span :class="labelClass">Diezmador</span>
                <div ref="selectWrapperRef">
                    <UiSearchSelect
                        :model-value="memberId"
                        :options="memberOptions"
                        option-value="id"
                        option-label="label"
                        option-description="description"
                        :search-fields="['code', 'documentNumber', 'description']"
                        placeholder="Selecciona al diezmador"
                        search-placeholder="Buscar por nombre, código o DUI..."
                        empty-message="Ningún diezmador coincide"
                        aria-label="Diezmador"
                        :invalid="attempted && memberId === null"
                        :disabled="isSaving || noTithers"
                        @update:model-value="onMemberChange"
                    />
                </div>
            </div>

            <div>
                <label for="tithe-amount" :class="labelClass">Monto</label>
                <div class="relative">
                    <span
                        class="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-on-surface-variant/60"
                    >
                        $
                    </span>
                    <input
                        id="tithe-amount"
                        ref="amountRef"
                        :value="amountText"
                        type="text"
                        inputmode="decimal"
                        placeholder="0.00"
                        autocomplete="off"
                        :disabled="isSaving"
                        :aria-invalid="(attempted && !amountValid) || undefined"
                        class="h-11 w-full rounded border bg-surface-container pl-7 pr-3 text-right text-base font-semibold tabular-nums text-on-surface outline-none transition-colors placeholder:text-on-surface-variant/40 focus:border-primary focus:ring-1 focus:ring-primary disabled:opacity-60"
                        :class="
                            attempted && !amountValid
                                ? 'border-destructive'
                                : 'border-outline-variant'
                        "
                        @input="onAmountInput"
                    />
                </div>
            </div>

            <div>
                <span :class="labelClass">Fecha</span>
                <UiDatePicker v-model="dateModel" :clearable="false" :disabled="isSaving" />
            </div>

            <div>
                <label for="tithe-notes" :class="labelClass">Nota (opcional)</label>
                <UiInput
                    id="tithe-notes"
                    v-model="notes"
                    maxlength="300"
                    placeholder="Ej. sobre sin nombre"
                    :disabled="isSaving"
                    class="h-11"
                />
            </div>

            <UiButton type="submit" class="h-11 md:col-span-2 xl:col-span-1" :loading="isSaving">
                <Save v-if="!isSaving" />
                {{ isEditing ? 'Guardar cambios' : 'Registrar' }}
            </UiButton>
        </form>

        <div
            v-if="errors.length > 0 || noTithers || previousFromMember.length > 0"
            class="flex flex-col gap-1.5 px-4 pb-3 text-xs"
        >
            <p v-if="errors.length > 0" class="text-destructive">{{ errors.join(' ') }}</p>
            <p v-if="noTithers" class="flex items-start gap-2 text-on-surface-variant">
                <UserRoundX class="mt-px size-3.5 shrink-0 text-primary" />
                Ningún miembro tiene el rol Diezmador. Asígnalo en Comunidad › Miembros (Editar →
                Roles) para que aparezca aquí.
            </p>
            <p
                v-if="previousFromMember.length > 0"
                class="flex items-start gap-2 rounded-md border border-amber-500/40 bg-amber-500/10 px-3 py-1.5 text-on-surface"
            >
                <Info class="mt-px size-3.5 shrink-0 text-amber-500" />
                <span>
                    {{ selectedMember?.fullName.split(/\s+/)[0] }} ya entregó
                    {{
                        previousFromMember.length === 1
                            ? 'un sobre'
                            : `${previousFromMember.length} sobres`
                    }}
                    ese día ({{ previousSummary }}). Si trae otro, regístralo igual.
                </span>
            </p>
        </div>
    </section>
</template>
