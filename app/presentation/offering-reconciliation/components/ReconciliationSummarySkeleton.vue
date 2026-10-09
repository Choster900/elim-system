<script setup lang="ts">
const bone = 'animate-pulse rounded bg-surface-container-high'
</script>

<template>
    <div aria-busy="true" aria-label="Cargando la conciliación">
        <section class="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <UiCard v-for="card in 4" :key="card" class="p-5">
                <div :class="[bone, 'mb-3 size-5']" />
                <div :class="[bone, 'h-3 w-28']" />
                <div :class="[bone, 'mt-2.5 h-8 w-36']" />
                <div :class="[bone, 'mt-2.5 h-3 w-44']" />
            </UiCard>
        </section>

        <section class="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
            <div
                v-for="chip in 4"
                :key="chip"
                class="flex items-center justify-between rounded-xl border border-outline-variant bg-surface-container-low px-4 py-3"
            >
                <div :class="[bone, 'h-3 w-24']" />
                <div :class="[bone, 'h-5 w-6']" />
            </div>
        </section>

        <section class="mt-8 grid gap-6 lg:grid-cols-2">
            <UiCard v-for="block in 2" :key="block" class="p-5">
                <div :class="[bone, 'mb-4 h-5 w-48']" />
                <div
                    v-for="row in 5"
                    :key="row"
                    class="flex items-center gap-3 border-b border-outline-variant py-2.5 last:border-b-0"
                >
                    <div :class="[bone, 'h-8 w-1']" />
                    <div class="flex-1">
                        <div :class="[bone, 'h-3.5 w-3/5']" />
                        <div :class="[bone, 'mt-1.5 h-3 w-2/5']" />
                    </div>
                    <div class="flex flex-col items-end">
                        <div :class="[bone, 'h-3.5 w-16']" />
                        <div :class="[bone, 'mt-1.5 h-3 w-10']" />
                    </div>
                </div>
            </UiCard>
        </section>

        <section class="mt-6 grid gap-6 lg:grid-cols-2">
            <UiCard class="p-5">
                <div :class="[bone, 'mb-4 h-5 w-40']" />
                <div
                    v-for="row in 5"
                    :key="row"
                    class="flex items-center justify-between gap-4 border-b border-outline-variant py-3 last:border-b-0"
                >
                    <div :class="[bone, 'h-3.5 w-28']" />
                    <div class="flex gap-6">
                        <div :class="[bone, 'h-3.5 w-16']" />
                        <div :class="[bone, 'h-3.5 w-16']" />
                        <div :class="[bone, 'h-3.5 w-14']" />
                    </div>
                </div>
            </UiCard>
            <UiCard class="p-5">
                <div :class="[bone, 'mb-4 h-5 w-40']" />
                <div v-for="bar in 5" :key="bar" class="mb-3.5 last:mb-0">
                    <div class="mb-1.5 flex justify-between">
                        <div :class="[bone, 'h-3.5 w-32']" />
                        <div :class="[bone, 'h-3.5 w-16']" />
                    </div>
                    <div
                        :class="[bone, 'h-2 rounded-full']"
                        :style="{ width: `${100 - bar * 14}%` }"
                    />
                </div>
            </UiCard>
        </section>
    </div>
</template>
