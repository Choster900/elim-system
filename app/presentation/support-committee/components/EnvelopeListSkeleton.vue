<script setup lang="ts">
withDefaults(defineProps<{ rows?: number }>(), { rows: 6 })

const bone = 'animate-pulse rounded bg-surface-container-high'
</script>

<template>
    <div aria-busy="true" aria-label="Cargando sobres">
        <div :class="[bone, 'mb-4 h-4 w-72 max-w-full']" />
        <ul class="flex flex-col gap-2">
            <li
                v-for="row in rows"
                :key="row"
                class="flex items-center gap-4 rounded-xl border border-outline-variant bg-surface-container-low px-4 py-4 sm:px-5"
            >
                <div :class="[bone, 'h-12 w-1 shrink-0']" />
                <div class="min-w-0 flex-1">
                    <div :class="[bone, 'h-4']" :style="{ width: `${45 + (row % 3) * 12}%` }" />
                    <div :class="[bone, 'mt-2 h-3 w-1/3']" />
                    <div :class="[bone, 'mt-2 h-2.5 w-1/4']" />
                </div>
                <div class="flex shrink-0 flex-col items-end gap-2">
                    <div :class="[bone, 'h-5 w-24 rounded-full']" />
                    <div :class="[bone, 'h-4 w-16']" />
                </div>
                <div :class="[bone, 'size-5 shrink-0']" />
            </li>
        </ul>
    </div>
</template>
