<script setup lang="ts">
withDefaults(
    defineProps<{
        columns?: number
        rows?: number
    }>(),
    { columns: 7, rows: 8 },
)

const bone = 'animate-pulse rounded bg-surface-container-high'
</script>

<template>
    <div
        class="overflow-hidden rounded-xl border border-outline-variant bg-surface"
        aria-busy="true"
        aria-label="Cargando registros"
    >
        <div
            class="flex items-center justify-between gap-4 border-b border-outline-variant px-4 py-3"
        >
            <div :class="[bone, 'h-9 w-full max-w-sm rounded-md']" />
            <div :class="[bone, 'h-3.5 w-24']" />
        </div>
        <div
            class="grid gap-4 border-b border-outline-variant bg-surface-container-low px-4 py-3"
            :style="{ gridTemplateColumns: `2fr repeat(${columns - 1}, minmax(0, 1fr))` }"
        >
            <div v-for="column in columns" :key="column" :class="[bone, 'h-3 w-3/4']" />
        </div>
        <div
            v-for="row in rows"
            :key="row"
            class="grid items-center gap-4 border-b border-outline-variant px-4 py-3 last:border-b-0"
            :style="{ gridTemplateColumns: `2fr repeat(${columns - 1}, minmax(0, 1fr))` }"
        >
            <div class="flex items-center gap-2">
                <div :class="[bone, 'h-7 w-1']" />
                <div class="flex-1">
                    <div :class="[bone, 'h-3.5 w-4/5']" />
                    <div :class="[bone, 'mt-1.5 h-3 w-1/2']" />
                </div>
            </div>
            <div
                v-for="column in columns - 1"
                :key="column"
                :class="[bone, 'h-3.5']"
                :style="{ width: `${50 + ((row + column) % 4) * 12}%` }"
            />
        </div>
    </div>
</template>
