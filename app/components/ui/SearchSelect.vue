<script setup lang="ts" generic="T extends Record<string, any>">
import { Check, ChevronDown, Search, X } from '@lucide/vue'
import {
    ComboboxAnchor,
    ComboboxContent,
    ComboboxEmpty,
    ComboboxInput,
    ComboboxItem,
    ComboboxItemIndicator,
    ComboboxPortal,
    ComboboxRoot,
    ComboboxTrigger,
    ComboboxViewport,
} from 'radix-vue'

type Value = string | number

const props = withDefaults(
    defineProps<{
        modelValue: Value | Value[] | null
        options: T[]
        optionValue?: keyof T
        optionLabel?: keyof T
        optionDescription?: keyof T
        placeholder?: string
        searchPlaceholder?: string
        emptyMessage?: string
        multiple?: boolean
        searchable?: boolean
        clearable?: boolean
        disabled?: boolean
        size?: 'sm' | 'md'
        contentClass?: string
        maxItems?: number
        invalid?: boolean
    }>(),
    {
        optionValue: 'value' as never,
        optionLabel: 'label' as never,
        placeholder: 'Selecciona una opción',
        searchPlaceholder: 'Buscar...',
        emptyMessage: 'Sin resultados',
        multiple: false,
        searchable: true,
        clearable: false,
        disabled: false,
        size: 'md' as const,
        maxItems: 4,
        invalid: false,
    },
)

const emit = defineEmits<{
    'update:modelValue': [value: Value | Value[] | null]
}>()

const open = ref(false)

const internalValue = computed({
    get: () => {
        if (props.multiple) {
            return Array.isArray(props.modelValue) ? props.modelValue : []
        }
        return props.modelValue ?? ''
    },
    set: (val) => {
        if (props.multiple) {
            emit('update:modelValue', Array.isArray(val) ? val : [])
        } else {
            emit('update:modelValue', (val as Value) ?? null)
        }
    },
})

function getValue(opt: T): Value {
    return opt[props.optionValue as string] as Value
}
function getLabel(opt: T): string {
    return String(opt[props.optionLabel as string] ?? '')
}
function getDescription(opt: T): string | null {
    if (!props.optionDescription) return null
    const v = opt[props.optionDescription as string]
    return v == null ? null : String(v)
}

function normalizeSearch(value: string) {
    return value
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLocaleLowerCase('es')
}

function displayValue(value: Value) {
    const option = props.options.find((item) => getValue(item) === value)
    return option ? getLabel(option) : ''
}

function filterValues(values: Value[], term: string) {
    const normalizedTerm = normalizeSearch(term.trim())
    if (!normalizedTerm) return values

    return values.filter((value) => {
        const option = props.options.find((item) => getValue(item) === value)
        if (!option) return false

        return normalizeSearch(
            [getLabel(option), getDescription(option)].filter(Boolean).join(' '),
        ).includes(normalizedTerm)
    })
}

const selectedOptions = computed<T[]>(() => {
    if (props.multiple) {
        const arr = Array.isArray(props.modelValue) ? props.modelValue : []
        return arr
            .map((v) => props.options.find((o) => getValue(o) === v))
            .filter((o): o is T => !!o)
    }
    const found = props.options.find((o) => getValue(o) === props.modelValue)
    return found ? [found] : []
})

const hasValue = computed(() => {
    if (props.multiple) {
        return Array.isArray(props.modelValue) && props.modelValue.length > 0
    }
    return props.modelValue != null && props.modelValue !== ''
})

const singleLabel = computed(() => {
    if (props.multiple || selectedOptions.value.length === 0) return ''
    return getLabel(selectedOptions.value[0]!)
})

function removeOne(val: Value, e?: Event) {
    e?.stopPropagation()
    if (!props.multiple) return
    const arr = Array.isArray(props.modelValue) ? props.modelValue : []
    emit(
        'update:modelValue',
        arr.filter((v) => v !== val),
    )
}

function clearAll(e?: Event) {
    e?.stopPropagation()
    if (props.multiple) {
        emit('update:modelValue', [])
    } else {
        emit('update:modelValue', null)
    }
}

const triggerHeight = computed(() => (props.size === 'sm' ? 'min-h-8' : 'min-h-11'))
const triggerPadding = computed(() => (props.size === 'sm' ? 'px-2 py-1' : 'px-3 py-2'))
const triggerText = computed(() => (props.size === 'sm' ? 'text-xs' : 'text-sm'))

const visibleChips = computed(() => selectedOptions.value.slice(0, props.maxItems))
const hiddenCount = computed(() => Math.max(0, selectedOptions.value.length - props.maxItems))
</script>

<template>
    <ComboboxRoot
        v-model="internalValue"
        v-model:open="open"
        :multiple="multiple"
        :disabled="disabled"
        :display-value="displayValue"
        :filter-function="filterValues"
        class="relative w-full"
    >
        <ComboboxAnchor as-child>
            <ComboboxTrigger
                :class="[
                    'group flex w-full items-center justify-between gap-2 rounded border bg-surface-container text-left text-on-surface transition-colors',
                    triggerHeight,
                    triggerPadding,
                    triggerText,
                    invalid
                        ? 'border-destructive focus:border-destructive focus:ring-1 focus:ring-destructive'
                        : 'border-outline-variant focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary',
                    disabled
                        ? 'cursor-not-allowed opacity-60'
                        : 'cursor-pointer hover:border-primary/60',
                ]"
            >
                <div class="flex min-w-0 flex-1 flex-wrap items-center gap-1.5">
                    <template v-if="multiple && hasValue">
                        <span
                            v-for="opt in visibleChips"
                            :key="String(getValue(opt))"
                            class="inline-flex items-center gap-1 rounded bg-primary/15 px-1.5 py-0.5 text-[11px] font-medium text-primary"
                            @click.stop
                        >
                            <slot name="chip" :option="opt" :label="getLabel(opt)">
                                {{ getLabel(opt) }}
                            </slot>
                            <button
                                v-if="!disabled"
                                type="button"
                                class="flex size-3.5 items-center justify-center rounded-sm text-primary/80 hover:bg-primary/20 hover:text-primary"
                                :aria-label="`Quitar ${getLabel(opt)}`"
                                @click="removeOne(getValue(opt), $event)"
                            >
                                <X class="size-2.5" />
                            </button>
                        </span>
                        <span
                            v-if="hiddenCount > 0"
                            class="inline-flex items-center rounded bg-surface-container-high px-1.5 py-0.5 text-[11px] font-medium text-on-surface-variant"
                        >
                            +{{ hiddenCount }}
                        </span>
                    </template>

                    <span v-else-if="!multiple && hasValue" class="truncate">
                        <slot name="selected" :option="selectedOptions[0]" :label="singleLabel">
                            {{ singleLabel }}
                        </slot>
                    </span>

                    <span v-else class="truncate text-on-surface-variant/70">{{
                        placeholder
                    }}</span>
                </div>

                <div class="flex shrink-0 items-center gap-1">
                    <button
                        v-if="clearable && hasValue && !disabled"
                        type="button"
                        class="flex size-5 items-center justify-center rounded-sm text-on-surface-variant transition-colors hover:bg-surface-container-high hover:text-destructive"
                        :aria-label="`Limpiar selección`"
                        @click="clearAll($event)"
                    >
                        <X class="size-3.5" />
                    </button>
                    <ChevronDown
                        class="size-4 text-on-surface-variant transition-transform"
                        :class="open ? 'rotate-180' : ''"
                    />
                </div>
            </ComboboxTrigger>
        </ComboboxAnchor>

        <ComboboxPortal>
            <ComboboxContent
                position="popper"
                :side-offset="6"
                :class="[
                    'z-50 max-h-[300px] w-[var(--radix-combobox-trigger-width)] min-w-[14rem] overflow-hidden rounded border border-outline-variant bg-surface-container shadow-xl focus:outline-none',
                    contentClass,
                ]"
            >
                <div
                    v-if="searchable"
                    class="flex items-center gap-2 border-b border-outline-variant bg-surface-container-low px-3 py-2"
                >
                    <Search class="size-4 shrink-0 text-on-surface-variant" />
                    <ComboboxInput
                        class="h-7 flex-1 bg-transparent text-sm text-on-surface placeholder:text-on-surface-variant/60 focus:outline-none"
                        :placeholder="searchPlaceholder"
                    />
                </div>

                <ComboboxEmpty class="px-4 py-6 text-center text-xs text-on-surface-variant">
                    {{ emptyMessage }}
                </ComboboxEmpty>

                <ComboboxViewport class="max-h-[240px] overflow-y-auto p-1">
                    <ComboboxItem
                        v-for="opt in options"
                        :key="String(getValue(opt))"
                        :value="getValue(opt)"
                        class="group/item flex w-full cursor-pointer items-center gap-2 rounded px-2.5 py-2 text-sm text-on-surface outline-none data-[highlighted]:bg-primary/10 data-[highlighted]:text-primary data-[disabled]:pointer-events-none data-[disabled]:opacity-50"
                    >
                        <div class="min-w-0 flex-1">
                            <slot name="item" :option="opt" :label="getLabel(opt)">
                                <p class="truncate">{{ getLabel(opt) }}</p>
                                <p
                                    v-if="getDescription(opt)"
                                    class="truncate text-[11px] text-on-surface-variant"
                                >
                                    {{ getDescription(opt) }}
                                </p>
                            </slot>
                        </div>
                        <ComboboxItemIndicator>
                            <Check class="size-4 text-primary" />
                        </ComboboxItemIndicator>
                    </ComboboxItem>
                </ComboboxViewport>
            </ComboboxContent>
        </ComboboxPortal>
    </ComboboxRoot>
</template>
