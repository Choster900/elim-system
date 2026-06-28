<script setup lang="ts">
import { CalendarDate, type DateValue, getLocalTimeZone, parseDate, today } from '@internationalized/date'
import { Calendar, ChevronLeft, ChevronRight, X } from '@lucide/vue'
import {
    CalendarCell,
    CalendarCellTrigger,
    CalendarGrid,
    CalendarGridBody,
    CalendarGridHead,
    CalendarGridRow,
    CalendarHeadCell,
    CalendarHeader,
    CalendarHeading,
    CalendarNext,
    CalendarPrev,
    CalendarRoot,
    PopoverContent,
    PopoverPortal,
    PopoverRoot,
    PopoverTrigger,
    RangeCalendarCell,
    RangeCalendarCellTrigger,
    RangeCalendarGrid,
    RangeCalendarGridBody,
    RangeCalendarGridHead,
    RangeCalendarGridRow,
    RangeCalendarHeadCell,
    RangeCalendarHeader,
    RangeCalendarHeading,
    RangeCalendarNext,
    RangeCalendarPrev,
    RangeCalendarRoot,
} from 'radix-vue'

export type DatePickerRange = { start: string | null; end: string | null }
export type DatePickerValue = string | null | DatePickerRange

const props = withDefaults(
    defineProps<{
        modelValue: DatePickerValue
        mode?: 'single' | 'range'
        placeholder?: string
        size?: 'sm' | 'md'
        clearable?: boolean
        disabled?: boolean
        invalid?: boolean
        locale?: string
        weekStartsOn?: 0 | 1 | 2 | 3 | 4 | 5 | 6
    }>(),
    {
        mode: 'single',
        placeholder: 'Selecciona fecha',
        size: 'md',
        clearable: true,
        disabled: false,
        invalid: false,
        locale: 'es-SV',
        weekStartsOn: 1,
    },
)

const emit = defineEmits<{
    'update:modelValue': [value: DatePickerValue]
}>()

const open = ref(false)

function toDateValue(iso: string | null | undefined): DateValue | undefined {
    if (!iso) return undefined
    try {
        return parseDate(iso)
    } catch {
        return undefined
    }
}

function fromDateValue(dv: DateValue | null | undefined): string | null {
    if (!dv) return null
    return dv.toString()
}

function isRange(v: DatePickerValue): v is DatePickerRange {
    return typeof v === 'object' && v !== null && 'start' in v
}

const singleValue = computed<DateValue | undefined>(() => {
    if (props.mode !== 'single') return undefined
    return toDateValue(typeof props.modelValue === 'string' ? props.modelValue : null)
})

const rangeValue = computed<{ start: DateValue | undefined; end: DateValue | undefined }>(() => {
    if (props.mode !== 'range') return { start: undefined, end: undefined }
    const v = isRange(props.modelValue) ? props.modelValue : { start: null, end: null }
    return {
        start: toDateValue(v.start),
        end: toDateValue(v.end),
    }
})

const hasValue = computed(() => {
    if (props.mode === 'single') {
        return typeof props.modelValue === 'string' && props.modelValue !== ''
    }
    const v = isRange(props.modelValue) ? props.modelValue : null
    return !!(v?.start || v?.end)
})

function formatDate(iso: string | null): string {
    if (!iso) return ''
    try {
        return new Date(iso + 'T00:00:00').toLocaleDateString(props.locale, {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
        })
    } catch {
        return iso
    }
}

const displayText = computed(() => {
    if (!hasValue.value) return props.placeholder

    if (props.mode === 'single') {
        return formatDate(typeof props.modelValue === 'string' ? props.modelValue : null)
    }

    const v = isRange(props.modelValue) ? props.modelValue : null
    if (!v) return props.placeholder
    if (v.start && v.end) {
        return `${formatDate(v.start)} → ${formatDate(v.end)}`
    }
    if (v.start) return `Desde ${formatDate(v.start)}`
    if (v.end) return `Hasta ${formatDate(v.end)}`
    return props.placeholder
})

function onSingleChange(val: DateValue | undefined) {
    emit('update:modelValue', fromDateValue(val))
    open.value = false
}

function onRangeChange(val: { start: DateValue | undefined; end: DateValue | undefined }) {
    emit('update:modelValue', {
        start: fromDateValue(val.start),
        end: fromDateValue(val.end),
    })
    if (val.start && val.end) {
        open.value = false
    }
}

function clearValue(e?: Event) {
    e?.stopPropagation()
    if (props.mode === 'single') {
        emit('update:modelValue', null)
    } else {
        emit('update:modelValue', { start: null, end: null })
    }
}

function setToday() {
    const t = today(getLocalTimeZone())
    if (props.mode === 'single') {
        emit('update:modelValue', t.toString())
        open.value = false
    } else {
        emit('update:modelValue', { start: t.toString(), end: t.toString() })
    }
}

function setThisWeek() {
    const t = today(getLocalTimeZone())
    const day = new Date(t.toString() + 'T00:00:00').getDay()
    const diffToMonday = (day + 6) % 7
    const startIso = new CalendarDate(t.year, t.month, t.day).subtract({ days: diffToMonday }).toString()
    const endIso = new CalendarDate(t.year, t.month, t.day).add({ days: 6 - diffToMonday }).toString()
    emit('update:modelValue', { start: startIso, end: endIso })
}

const triggerHeight = computed(() => (props.size === 'sm' ? 'h-8' : 'h-11'))
const triggerPad = computed(() => (props.size === 'sm' ? 'px-2' : 'px-3'))
const triggerText = computed(() => (props.size === 'sm' ? 'text-xs' : 'text-sm'))

const cellTriggerClass = [
    'flex size-9 items-center justify-center rounded text-sm text-on-surface transition-colors',
    'data-[disabled]:pointer-events-none data-[disabled]:opacity-40',
    'data-[outside-view]:opacity-30 data-[outside-view]:pointer-events-none',
    'hover:bg-primary/10 hover:text-primary',
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary',
    'data-[today]:font-bold data-[today]:text-primary',
    'data-[selected]:bg-primary data-[selected]:text-primary-foreground data-[selected]:hover:bg-primary data-[selected]:hover:text-primary-foreground',
    'data-[highlighted]:bg-primary/15 data-[highlighted]:text-primary',
    'data-[selection-start]:bg-primary data-[selection-start]:text-primary-foreground',
    'data-[selection-end]:bg-primary data-[selection-end]:text-primary-foreground',
].join(' ')

const navBtnClass =
    'flex size-7 items-center justify-center rounded text-on-surface-variant transition-colors hover:bg-surface-container-high hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary'
const headCellClass = 'h-8 w-9 text-center text-[10px] font-semibold uppercase tracking-wider text-on-surface-variant'
</script>

<template>
    <PopoverRoot v-model:open="open">
        <PopoverTrigger
            :disabled="disabled"
            :class="[
                'group inline-flex w-full items-center justify-between gap-2 rounded border bg-surface-container text-left text-on-surface transition-colors',
                triggerHeight,
                triggerPad,
                triggerText,
                invalid
                    ? 'border-destructive focus:border-destructive focus:ring-1 focus:ring-destructive'
                    : 'border-outline-variant focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary',
                disabled ? 'cursor-not-allowed opacity-60' : 'cursor-pointer hover:border-primary/60',
            ]"
        >
            <div class="flex min-w-0 flex-1 items-center gap-2">
                <Calendar class="size-4 shrink-0 text-on-surface-variant" />
                <span
                    class="truncate"
                    :class="hasValue ? 'text-on-surface' : 'text-on-surface-variant/70'"
                >
                    {{ displayText }}
                </span>
            </div>
            <button
                v-if="clearable && hasValue && !disabled"
                type="button"
                class="flex size-5 shrink-0 items-center justify-center rounded-sm text-on-surface-variant transition-colors hover:bg-surface-container-high hover:text-destructive"
                aria-label="Limpiar fecha"
                @click="clearValue($event)"
            >
                <X class="size-3.5" />
            </button>
        </PopoverTrigger>

        <PopoverPortal>
            <PopoverContent
                :side-offset="6"
                align="start"
                class="z-50 rounded-lg border border-outline-variant bg-surface-container p-3 shadow-xl focus:outline-none"
            >
                <div v-if="mode === 'range'" class="mb-2 flex items-center gap-1.5 border-b border-outline-variant pb-2">
                    <button
                        type="button"
                        class="rounded border border-outline-variant px-2 py-1 text-[11px] font-semibold uppercase tracking-wider text-on-surface-variant hover:border-primary hover:text-primary"
                        @click="setToday"
                    >
                        Hoy
                    </button>
                    <button
                        type="button"
                        class="rounded border border-outline-variant px-2 py-1 text-[11px] font-semibold uppercase tracking-wider text-on-surface-variant hover:border-primary hover:text-primary"
                        @click="setThisWeek"
                    >
                        Esta semana
                    </button>
                    <span class="flex-1" />
                    <button
                        v-if="hasValue"
                        type="button"
                        class="rounded px-2 py-1 text-[11px] font-semibold uppercase tracking-wider text-destructive hover:bg-destructive/10"
                        @click="clearValue($event)"
                    >
                        Limpiar
                    </button>
                </div>

                <CalendarRoot
                    v-if="mode === 'single'"
                    v-slot="{ weekDays, grid }"
                    :model-value="singleValue"
                    :locale="locale"
                    :week-starts-on="weekStartsOn"
                    class="select-none"
                    @update:model-value="onSingleChange"
                >
                    <CalendarHeader class="mb-2 flex items-center justify-between">
                        <CalendarPrev :class="navBtnClass" aria-label="Mes anterior">
                            <ChevronLeft class="size-4" />
                        </CalendarPrev>
                        <CalendarHeading class="text-sm font-semibold capitalize text-on-surface" />
                        <CalendarNext :class="navBtnClass" aria-label="Mes siguiente">
                            <ChevronRight class="size-4" />
                        </CalendarNext>
                    </CalendarHeader>
                    <CalendarGrid v-for="month in grid" :key="month.value.toString()">
                        <CalendarGridHead>
                            <CalendarGridRow class="grid grid-cols-7">
                                <CalendarHeadCell v-for="day in weekDays" :key="day" :class="headCellClass">
                                    {{ day.slice(0, 1).toUpperCase() }}
                                </CalendarHeadCell>
                            </CalendarGridRow>
                        </CalendarGridHead>
                        <CalendarGridBody>
                            <CalendarGridRow
                                v-for="(weekDates, index) in month.rows"
                                :key="`${month.value.toString()}-${index}`"
                                class="grid grid-cols-7"
                            >
                                <CalendarCell
                                    v-for="weekDate in weekDates"
                                    :key="weekDate.toString()"
                                    :date="weekDate"
                                    class="p-0"
                                >
                                    <CalendarCellTrigger
                                        :day="weekDate"
                                        :month="month.value"
                                        :class="cellTriggerClass"
                                    />
                                </CalendarCell>
                            </CalendarGridRow>
                        </CalendarGridBody>
                    </CalendarGrid>
                </CalendarRoot>

                <RangeCalendarRoot
                    v-else
                    v-slot="{ weekDays, grid }"
                    :model-value="rangeValue"
                    :locale="locale"
                    :week-starts-on="weekStartsOn"
                    :number-of-months="1"
                    class="select-none"
                    @update:model-value="onRangeChange as any"
                >
                    <RangeCalendarHeader class="mb-2 flex items-center justify-between">
                        <RangeCalendarPrev :class="navBtnClass" aria-label="Mes anterior">
                            <ChevronLeft class="size-4" />
                        </RangeCalendarPrev>
                        <RangeCalendarHeading class="text-sm font-semibold capitalize text-on-surface" />
                        <RangeCalendarNext :class="navBtnClass" aria-label="Mes siguiente">
                            <ChevronRight class="size-4" />
                        </RangeCalendarNext>
                    </RangeCalendarHeader>
                    <RangeCalendarGrid v-for="month in grid" :key="month.value.toString()">
                        <RangeCalendarGridHead>
                            <RangeCalendarGridRow class="grid grid-cols-7">
                                <RangeCalendarHeadCell v-for="day in weekDays" :key="day" :class="headCellClass">
                                    {{ day.slice(0, 1).toUpperCase() }}
                                </RangeCalendarHeadCell>
                            </RangeCalendarGridRow>
                        </RangeCalendarGridHead>
                        <RangeCalendarGridBody>
                            <RangeCalendarGridRow
                                v-for="(weekDates, index) in month.rows"
                                :key="`${month.value.toString()}-${index}`"
                                class="grid grid-cols-7"
                            >
                                <RangeCalendarCell
                                    v-for="weekDate in weekDates"
                                    :key="weekDate.toString()"
                                    :date="weekDate"
                                    class="p-0"
                                >
                                    <RangeCalendarCellTrigger
                                        :day="weekDate"
                                        :month="month.value"
                                        :class="cellTriggerClass"
                                    />
                                </RangeCalendarCell>
                            </RangeCalendarGridRow>
                        </RangeCalendarGridBody>
                    </RangeCalendarGrid>
                </RangeCalendarRoot>
            </PopoverContent>
        </PopoverPortal>
    </PopoverRoot>
</template>
