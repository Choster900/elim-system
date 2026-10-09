<script setup lang="ts">
import {
    CalendarDays,
    Check,
    Clock,
    ExternalLink,
    FilterX,
    LoaderCircle,
    MapPin,
    Plus,
    Search,
    Sparkles,
    User,
    X,
} from '@lucide/vue'
import type { AssignableMeeting } from '~/presentation/territories/interfaces/territory.interface'

type DayPeriod = 'manana' | 'tarde' | 'noche'

const props = defineProps<{
    open: boolean
    sectorName: string
    accent: string
    items: AssignableMeeting[]
    assign: (id: string) => Promise<boolean>
}>()

const emit = defineEmits<{
    (e: 'close'): void
    (e: 'go', id: string): void
}>()

const WEEKDAYS = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb']
const PERIODS: { value: DayPeriod; label: string }[] = [
    { value: 'manana', label: 'Mañana' },
    { value: 'tarde', label: 'Tarde' },
    { value: 'noche', label: 'Noche' },
]

const query = ref('')
const typeFilter = ref<number | null>(null)
const dayFilter = ref<number | null>(null)
const periodFilter = ref<DayPeriod | null>(null)
const pendingId = ref<string | null>(null)
const assignedIds = ref(new Set<string>())
const hiddenIds = ref(new Set<string>())
const ghosts = ref(new Map<string, { item: AssignableMeeting; index: number }>())
const assignedCount = ref(0)
const searchInput = ref<HTMLInputElement | null>(null)

watch(
    () => props.open,
    (isOpen) => {
        if (!isOpen) return
        query.value = ''
        typeFilter.value = null
        dayFilter.value = null
        periodFilter.value = null
        pendingId.value = null
        assignedIds.value = new Set()
        hiddenIds.value = new Set()
        ghosts.value = new Map()
        assignedCount.value = 0
        nextTick(() => searchInput.value?.focus())
    },
)

function normalize(value: string) {
    return value.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim()
}

function periodOf(startTime: string): DayPeriod {
    const hour = Number(startTime.slice(0, 2))
    if (hour < 12) return 'manana'
    if (hour < 18) return 'tarde'
    return 'noche'
}

const rows = computed(() => {
    const list = props.items.filter((item) => !hiddenIds.value.has(item.id))
    for (const [id, ghost] of ghosts.value) {
        if (hiddenIds.value.has(id) || list.some((item) => item.id === id)) continue
        list.splice(Math.min(ghost.index, list.length), 0, ghost.item)
    }
    return list
})

const typeOptions = computed(() => {
    const types = new Map<number, { id: number; name: string; count: number }>()
    for (const item of rows.value) {
        const current = types.get(item.typeId)
        if (current) current.count += 1
        else types.set(item.typeId, { id: item.typeId, name: item.typeName, count: 1 })
    }
    return [...types.values()].sort((a, b) => a.name.localeCompare(b.name))
})

const dayCounts = computed(() => {
    const counts = Array.from({ length: 7 }, () => 0)
    for (const item of rows.value) counts[item.weekday]! += 1
    return counts
})

const filtered = computed(() => {
    const terms = normalize(query.value).split(/\s+/).filter(Boolean)
    return rows.value.filter((item) => {
        if (assignedIds.value.has(item.id)) return true
        if (typeFilter.value !== null && item.typeId !== typeFilter.value) return false
        if (dayFilter.value !== null && item.weekday !== dayFilter.value) return false
        if (periodFilter.value && periodOf(item.startTime) !== periodFilter.value) return false
        if (!terms.length) return true
        const haystack = normalize(
            [
                item.title,
                item.code,
                item.typeName,
                item.leaderName ?? '',
                item.location,
                item.dayLabel,
                item.frequencyLabel,
            ].join(' '),
        )
        return terms.every((term) => haystack.includes(term))
    })
})

const hasFilters = computed(
    () =>
        !!query.value.trim() ||
        typeFilter.value !== null ||
        dayFilter.value !== null ||
        periodFilter.value !== null,
)

function clearFilters() {
    query.value = ''
    typeFilter.value = null
    dayFilter.value = null
    periodFilter.value = null
}

function chipClass(active: boolean) {
    return [
        'inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[11px] font-semibold transition-all hover:-translate-y-px disabled:cursor-not-allowed disabled:opacity-35 disabled:hover:translate-y-0',
        active
            ? 'border-transparent bg-primary text-primary-foreground shadow-sm'
            : 'border-outline-variant text-on-surface-variant hover:border-primary hover:text-primary',
    ]
}

function toggle<T>(target: Ref<T | null>, value: T) {
    target.value = target.value === value ? null : value
}

async function assignItem(item: AssignableMeeting) {
    if (pendingId.value) return
    pendingId.value = item.id
    const index = props.items.findIndex((candidate) => candidate.id === item.id)
    ghosts.value.set(item.id, { item, index: Math.max(index, 0) })
    const ok = await props.assign(item.id)
    pendingId.value = null
    if (!ok) {
        ghosts.value.delete(item.id)
        return
    }
    assignedIds.value.add(item.id)
    assignedCount.value += 1
    window.setTimeout(() => {
        hiddenIds.value.add(item.id)
        assignedIds.value.delete(item.id)
        ghosts.value.delete(item.id)
    }, 900)
}
</script>

<template>
    <template v-if="open">
        <div class="fixed inset-0 z-[60] bg-black/50" @click="emit('close')" />
        <aside
            class="assign-drawer fixed inset-y-0 right-0 z-[61] flex w-[680px] max-w-[96vw] flex-col bg-surface-container-low shadow-2xl"
            role="dialog"
            aria-modal="true"
            aria-labelledby="assign-meeting-title"
        >
            <div class="flex-none border-b border-outline-variant px-6 py-5">
                <div class="flex items-center justify-between">
                    <span
                        id="assign-meeting-title"
                        class="text-[11px] font-bold uppercase tracking-[0.2em]"
                        :style="{ color: accent }"
                    >
                        Asignar reunión
                    </span>
                    <button
                        type="button"
                        class="text-on-surface-variant hover:text-on-surface"
                        aria-label="Cerrar"
                        @click="emit('close')"
                    >
                        <X class="size-4" />
                    </button>
                </div>
                <div class="mt-2 flex flex-wrap items-center justify-between gap-2">
                    <p class="text-sm text-on-surface-variant">
                        Al sector
                        <strong class="font-semibold text-on-surface">{{ sectorName }}</strong>
                    </p>
                    <Transition name="assign-badge" mode="out-in">
                        <span
                            v-if="assignedCount"
                            :key="assignedCount"
                            class="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 px-2.5 py-1 text-xs font-semibold text-emerald-700 dark:text-emerald-300"
                        >
                            <Sparkles class="size-3.5" />
                            {{ assignedCount }}
                            {{ assignedCount === 1 ? 'asignada' : 'asignadas' }}
                        </span>
                    </Transition>
                </div>

                <div
                    class="mt-4 flex items-center gap-2 rounded-full border border-outline-variant bg-surface px-3.5 py-2 transition-colors focus-within:border-primary"
                >
                    <Search class="size-4 shrink-0 text-on-surface-variant" />
                    <input
                        ref="searchInput"
                        v-model="query"
                        type="search"
                        placeholder="Buscar por título, código, líder, lugar o día…"
                        class="w-full bg-transparent text-sm text-on-surface outline-none placeholder:text-on-surface-variant"
                        @keydown.esc.stop="query ? (query = '') : emit('close')"
                    />
                    <button
                        v-if="query"
                        type="button"
                        class="text-on-surface-variant hover:text-on-surface"
                        aria-label="Borrar búsqueda"
                        @click="query = ''"
                    >
                        <X class="size-3.5" />
                    </button>
                </div>

                <div v-if="rows.length" class="mt-3 space-y-2">
                    <div v-if="typeOptions.length > 1" class="flex flex-wrap gap-1.5">
                        <button
                            v-for="type in typeOptions"
                            :key="type.id"
                            type="button"
                            :class="chipClass(typeFilter === type.id)"
                            :aria-pressed="typeFilter === type.id"
                            @click="toggle(typeFilter, type.id)"
                        >
                            {{ type.name }}
                            <span class="opacity-60">{{ type.count }}</span>
                        </button>
                    </div>
                    <div class="flex flex-wrap items-center gap-1.5">
                        <CalendarDays class="mr-0.5 size-3.5 text-on-surface-variant" />
                        <button
                            v-for="(day, index) in WEEKDAYS"
                            :key="day"
                            type="button"
                            :class="chipClass(dayFilter === index)"
                            :disabled="!dayCounts[index]"
                            :aria-pressed="dayFilter === index"
                            @click="toggle(dayFilter, index)"
                        >
                            {{ day }}
                        </button>
                        <span class="mx-1 h-4 w-px bg-outline-variant" />
                        <Clock class="mr-0.5 size-3.5 text-on-surface-variant" />
                        <button
                            v-for="period in PERIODS"
                            :key="period.value"
                            type="button"
                            :class="chipClass(periodFilter === period.value)"
                            :aria-pressed="periodFilter === period.value"
                            @click="toggle(periodFilter, period.value)"
                        >
                            {{ period.label }}
                        </button>
                    </div>
                    <div class="flex items-center justify-between text-xs text-on-surface-variant">
                        <span>
                            {{ filtered.length }} de {{ rows.length }}
                            {{
                                rows.length === 1 ? 'reunión sin asignar' : 'reuniones sin asignar'
                            }}
                        </span>
                        <button
                            v-if="hasFilters"
                            type="button"
                            class="inline-flex items-center gap-1 font-medium text-primary hover:underline"
                            @click="clearFilters"
                        >
                            <FilterX class="size-3.5" /> Limpiar filtros
                        </button>
                    </div>
                </div>
            </div>

            <div class="relative min-h-0 flex-1 overflow-y-auto">
                <div v-if="!rows.length" class="flex flex-col items-center px-8 py-14 text-center">
                    <span
                        class="flex size-12 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-300"
                    >
                        <Check class="size-6" />
                    </span>
                    <p class="mt-4 text-sm font-semibold text-on-surface">
                        No hay reuniones sin asignar
                    </p>
                    <p class="mt-1 max-w-sm text-xs text-on-surface-variant">
                        Crea una reunión en el catálogo con el sector «Sin asignar» y aparecerá aquí
                        para asignarla a cualquier sector.
                    </p>
                </div>
                <p
                    v-else-if="!filtered.length"
                    class="px-6 py-12 text-center text-sm italic text-on-surface-variant"
                >
                    Ninguna reunión sin asignar coincide con los filtros.
                </p>

                <TransitionGroup tag="div" name="assign-row">
                    <div
                        v-for="it in filtered"
                        :key="it.id"
                        class="assign-row flex items-center gap-3 border-b border-outline-variant/60 px-6 py-3.5"
                        :class="{ 'assign-row--done': assignedIds.has(it.id) }"
                    >
                        <span
                            class="size-2.5 shrink-0 rounded-full"
                            :style="{ backgroundColor: it.color }"
                        />
                        <div class="min-w-0 flex-1">
                            <div class="flex items-center gap-2">
                                <p class="truncate text-sm font-semibold text-on-surface">
                                    {{ it.title }}
                                </p>
                                <span
                                    class="shrink-0 rounded bg-surface-container-high px-1.5 py-0.5 font-mono text-[10px] text-on-surface-variant"
                                >
                                    {{ it.code }}
                                </span>
                            </div>
                            <p
                                class="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-on-surface-variant"
                            >
                                <span>{{ it.typeName }}</span>
                                <span class="inline-flex items-center gap-1">
                                    <CalendarDays class="size-3" />
                                    {{ it.dayLabel }} · {{ it.timeLabel }} · {{ it.frequencyLabel }}
                                </span>
                                <span v-if="it.leaderName" class="inline-flex items-center gap-1">
                                    <User class="size-3" /> {{ it.leaderName }}
                                </span>
                                <span class="inline-flex min-w-0 items-center gap-1">
                                    <MapPin class="size-3 shrink-0" />
                                    <span class="truncate">{{ it.location }}</span>
                                </span>
                            </p>
                        </div>
                        <button
                            type="button"
                            class="flex size-8 shrink-0 items-center justify-center rounded-md text-on-surface-variant transition-colors hover:bg-surface-container-high hover:text-primary"
                            title="Ir a la reunión"
                            @click="emit('go', it.id)"
                        >
                            <ExternalLink class="size-4" />
                        </button>
                        <span
                            v-if="assignedIds.has(it.id)"
                            class="assign-done inline-flex shrink-0 items-center gap-1 rounded-lg bg-emerald-500 px-2.5 py-1.5 text-xs font-semibold text-white"
                        >
                            <Check class="size-3.5" /> ¡Asignada!
                        </span>
                        <button
                            v-else
                            type="button"
                            class="inline-flex shrink-0 items-center gap-1 rounded-lg bg-primary px-2.5 py-1.5 text-xs font-semibold text-primary-foreground transition-all hover:opacity-90 active:scale-95 disabled:cursor-wait disabled:opacity-60"
                            :disabled="pendingId !== null"
                            @click="assignItem(it)"
                        >
                            <LoaderCircle
                                v-if="pendingId === it.id"
                                class="size-3.5 animate-spin"
                            />
                            <Plus v-else class="size-3.5" />
                            {{ pendingId === it.id ? 'Asignando…' : 'Asignar' }}
                        </button>
                    </div>
                </TransitionGroup>
            </div>

            <div class="flex-none border-t border-outline-variant px-6 py-4">
                <NuxtLink
                    to="/catalogos/reuniones/nueva"
                    class="flex items-center justify-center gap-2 rounded-lg border border-outline-variant px-4 py-2.5 text-sm font-medium text-on-surface transition-colors hover:border-primary hover:text-primary"
                >
                    <Plus class="size-4" /> Crear nueva reunión en el catálogo
                </NuxtLink>
            </div>
        </aside>
    </template>
</template>

<style scoped>
.assign-drawer {
    animation: assign-in 0.28s ease;
}

.assign-row {
    max-height: 9rem;
    overflow: hidden;
    transition: background-color 0.35s ease;
}
.assign-row--done {
    background-color: rgb(16 185 129 / 0.12);
}
.assign-done {
    animation: assign-pop 0.45s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.assign-row-enter-active {
    transition:
        opacity 0.3s ease,
        transform 0.3s ease;
}
.assign-row-enter-from {
    opacity: 0;
    transform: translateY(-6px);
}
.assign-row-leave-active {
    transition:
        opacity 0.45s ease,
        transform 0.45s cubic-bezier(0.4, 0, 0.2, 1),
        max-height 0.45s ease 0.15s,
        padding 0.45s ease 0.15s,
        border-color 0.45s ease;
}
.assign-row-leave-to {
    opacity: 0;
    transform: translateX(72px) scale(0.97);
    max-height: 0;
    padding-top: 0;
    padding-bottom: 0;
    border-color: transparent;
}
.assign-row-move {
    transition: transform 0.35s ease;
}

.assign-badge-enter-active,
.assign-badge-leave-active {
    transition:
        opacity 0.2s ease,
        transform 0.25s cubic-bezier(0.34, 1.56, 0.64, 1);
}
.assign-badge-enter-from {
    opacity: 0;
    transform: scale(0.6);
}
.assign-badge-leave-to {
    opacity: 0;
    transform: scale(1.15);
}

@keyframes assign-in {
    from {
        transform: translateX(26px);
        opacity: 0;
    }
    to {
        transform: translateX(0);
        opacity: 1;
    }
}
@keyframes assign-pop {
    0% {
        transform: scale(0.4) rotate(-8deg);
        opacity: 0;
    }
    60% {
        transform: scale(1.12) rotate(2deg);
        opacity: 1;
    }
    100% {
        transform: scale(1) rotate(0);
    }
}

@media (prefers-reduced-motion: reduce) {
    .assign-drawer,
    .assign-done,
    .assign-row-enter-active,
    .assign-row-leave-active,
    .assign-row-move,
    .assign-badge-enter-active,
    .assign-badge-leave-active {
        animation: none;
        transition: none;
    }
}
</style>
