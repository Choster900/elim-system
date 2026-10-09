<script setup lang="ts">
const bone = 'animate-pulse rounded bg-surface-container-high'
</script>

<template>
    <div aria-busy="true" aria-label="Cargando el sobre">
        <div
            class="flex gap-3 rounded-xl border border-outline-variant bg-surface-container-low px-4 py-3"
        >
            <div :class="[bone, 'w-1 self-stretch']" />
            <div class="flex-1">
                <div :class="[bone, 'h-5 w-56']" />
                <div class="mt-2 flex gap-4">
                    <div :class="[bone, 'h-3 w-40']" />
                    <div :class="[bone, 'h-3 w-28']" />
                    <div :class="[bone, 'h-3 w-24']" />
                </div>
            </div>
        </div>

        <div
            class="mt-4 flex items-center gap-4 rounded-xl border border-outline-variant bg-surface-container-low p-5"
        >
            <div :class="[bone, 'size-10 rounded-full']" />
            <div class="flex-1">
                <div :class="[bone, 'h-6 w-48']" />
                <div :class="[bone, 'mt-2 h-3.5 w-72 max-w-full']" />
            </div>
        </div>

        <div class="mt-6 overflow-hidden rounded-xl border border-outline-variant bg-surface">
            <div class="border-b border-outline-variant bg-surface-container-low px-5 py-3">
                <div :class="[bone, 'h-3 w-2/3']" />
            </div>
            <div
                v-for="row in 3"
                :key="row"
                class="flex items-center justify-between gap-4 border-b border-outline-variant px-5 py-4 last:border-b-0"
            >
                <div :class="[bone, 'h-4 w-32']" />
                <div class="flex gap-8">
                    <div :class="[bone, 'h-4 w-16']" />
                    <div :class="[bone, 'h-4 w-16']" />
                    <div :class="[bone, 'h-4 w-20']" />
                </div>
            </div>
        </div>

        <div class="mt-4 grid gap-4 sm:grid-cols-2">
            <div
                v-for="box in 2"
                :key="box"
                class="rounded-xl border border-outline-variant bg-surface px-5 py-4"
            >
                <div :class="[bone, 'h-3 w-28']" />
                <div :class="[bone, 'mt-2 h-3.5 w-4/5']" />
            </div>
        </div>
    </div>
</template>
