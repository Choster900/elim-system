<script setup lang="ts">
import { ChevronDown, Clock3 } from '@lucide/vue'
import { cn } from '@lib/utils'

type Period = 'AM' | 'PM'

interface ParsedTime {
    hour: number
    minute: number
}

const props = withDefaults(
    defineProps<{
        modelValue: string
        id?: string
        disabled?: boolean
        invalid?: boolean
        ariaLabel?: string
        class?: string
    }>(),
    {
        id: undefined,
        disabled: false,
        invalid: false,
        ariaLabel: 'Seleccionar hora',
        class: undefined,
    },
)

const emit = defineEmits<{
    'update:modelValue': [value: string]
}>()

const open = ref(false)
const root = ref<HTMLElement | null>(null)
const draftHour = ref('')
const draftMinute = ref('')
const draftPeriod = ref<Period>('AM')

function parseTime(value: string): ParsedTime | null {
    const match = /^(\d{2}):(\d{2})$/.exec(value)
    if (!match) return null

    const hour = Number(match[1])
    const minute = Number(match[2])
    if (hour > 23 || minute > 59) return null
    return { hour, minute }
}

function getTwelveHourValue(value: string) {
    const time = parseTime(value)
    if (!time) return { hour: 12, minute: 0, period: 'AM' as Period }

    return {
        hour: time.hour % 12 || 12,
        minute: time.minute,
        period: time.hour >= 12 ? ('PM' as Period) : ('AM' as Period),
    }
}

function syncDraft(value: string) {
    const time = getTwelveHourValue(value)
    draftHour.value = String(time.hour)
    draftMinute.value = String(time.minute).padStart(2, '0')
    draftPeriod.value = time.period
}

function commitTime() {
    const hour = Number(draftHour.value)
    const minute = Number(draftMinute.value)
    if (!Number.isInteger(hour) || hour < 1 || hour > 12) return
    if (!Number.isInteger(minute) || minute < 0 || minute > 59) return

    const hour24 = (hour % 12) + (draftPeriod.value === 'PM' ? 12 : 0)
    emit(
        'update:modelValue',
        `${String(hour24).padStart(2, '0')}:${String(minute).padStart(2, '0')}`,
    )
}

function setPeriod(period: Period) {
    draftPeriod.value = period
    commitTime()
}

const displayValue = computed(() => {
    const time = parseTime(props.modelValue)
    if (!time) return 'Selecciona hora'

    const hour = time.hour % 12 || 12
    const period = time.hour >= 12 ? 'PM' : 'AM'
    return `${String(hour).padStart(2, '0')}:${String(time.minute).padStart(2, '0')} ${period}`
})

watch(
    () => props.modelValue,
    (value) => syncDraft(value),
    { immediate: true },
)

watch(open, (isOpen) => {
    if (isOpen) syncDraft(props.modelValue)
})

function closeWhenClickingOutside(event: PointerEvent) {
    if (open.value && event.target instanceof Node && !root.value?.contains(event.target)) {
        open.value = false
    }
}

onMounted(() => document.addEventListener('pointerdown', closeWhenClickingOutside))
onBeforeUnmount(() => document.removeEventListener('pointerdown', closeWhenClickingOutside))
</script>

<template>
    <div ref="root" class="relative">
        <button
            :id="id"
            type="button"
            :disabled="disabled"
            :aria-label="ariaLabel"
            :aria-expanded="open"
            :aria-invalid="invalid || undefined"
            :class="
                cn(
                    'group flex h-11 w-full items-center gap-2 rounded border bg-surface-container px-3 text-left text-sm tabular-nums text-on-surface transition-colors focus:outline-none focus:ring-1 disabled:cursor-not-allowed disabled:opacity-60',
                    invalid
                        ? 'border-destructive focus:border-destructive focus:ring-destructive'
                        : 'border-outline-variant focus:border-primary focus:ring-primary hover:border-primary/60',
                    props.class,
                )
            "
            @click="open = !open"
        >
            <span
                class="flex size-6 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary"
            >
                <Clock3 class="size-3.5" />
            </span>
            <span class="min-w-0 flex-1 font-medium">{{ displayValue }}</span>
            <ChevronDown
                class="size-4 shrink-0 text-on-surface-variant transition-transform"
                :class="open ? 'rotate-180' : ''"
            />
        </button>

        <div
            v-if="open"
            role="dialog"
            aria-label="Selecciona la hora"
            class="absolute left-0 top-[calc(100%+6px)] z-50 w-[272px] rounded-xl border border-outline-variant bg-surface-container p-3 shadow-xl"
        >
            <div class="mb-3 flex items-center gap-2 border-b border-outline-variant pb-3">
                <span
                    class="flex size-7 items-center justify-center rounded-md bg-primary/10 text-primary"
                >
                    <Clock3 class="size-4" />
                </span>
                <div>
                    <p class="text-xs font-semibold text-on-surface">Selecciona la hora</p>
                    <p class="text-[11px] text-on-surface-variant">Formato de 12 horas</p>
                </div>
            </div>

            <div class="grid grid-cols-[1fr_auto_1fr] items-end gap-2">
                <label class="grid gap-1.5">
                    <span
                        class="text-[10px] font-semibold uppercase tracking-wider text-on-surface-variant"
                    >
                        Hora
                    </span>
                    <input
                        v-model="draftHour"
                        type="number"
                        min="1"
                        max="12"
                        inputmode="numeric"
                        class="h-10 rounded-md border border-outline-variant bg-surface px-2 text-center text-sm font-semibold tabular-nums text-on-surface outline-none transition-colors focus:border-primary focus:ring-1 focus:ring-primary"
                        aria-label="Hora"
                        @blur="commitTime"
                        @keydown.enter.prevent="commitTime"
                    />
                </label>
                <span class="mb-2 text-lg font-semibold text-on-surface-variant">:</span>
                <label class="grid gap-1.5">
                    <span
                        class="text-[10px] font-semibold uppercase tracking-wider text-on-surface-variant"
                    >
                        Minutos
                    </span>
                    <input
                        v-model="draftMinute"
                        type="number"
                        min="0"
                        max="59"
                        inputmode="numeric"
                        class="h-10 rounded-md border border-outline-variant bg-surface px-2 text-center text-sm font-semibold tabular-nums text-on-surface outline-none transition-colors focus:border-primary focus:ring-1 focus:ring-primary"
                        aria-label="Minutos"
                        @blur="commitTime"
                        @keydown.enter.prevent="commitTime"
                    />
                </label>
            </div>

            <div class="mt-3 grid grid-cols-2 rounded-lg bg-surface p-1">
                <button
                    type="button"
                    class="h-8 rounded-md text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-primary"
                    :class="
                        draftPeriod === 'AM'
                            ? 'bg-primary text-primary-foreground shadow-sm'
                            : 'text-on-surface-variant hover:text-on-surface'
                    "
                    @click="setPeriod('AM')"
                >
                    AM
                </button>
                <button
                    type="button"
                    class="h-8 rounded-md text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-primary"
                    :class="
                        draftPeriod === 'PM'
                            ? 'bg-primary text-primary-foreground shadow-sm'
                            : 'text-on-surface-variant hover:text-on-surface'
                    "
                    @click="setPeriod('PM')"
                >
                    PM
                </button>
            </div>
        </div>
    </div>
</template>
