<script setup lang="ts">
import { VueQueryDevtools } from '@tanstack/vue-query-devtools'

const shouldShowQueryDevtools = import.meta.dev
</script>

<template>
    <div id="app-root">
        <NuxtLayout>
            <NuxtPage />
        </NuxtLayout>
        <ClientOnly>
            <VueQueryDevtools
                v-if="shouldShowQueryDevtools"
                button-position="top-left"
                position="bottom"
            />
        </ClientOnly>
    </div>
</template>
