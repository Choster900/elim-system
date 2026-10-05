<script setup lang="ts">
import { VueQueryDevtools } from '@tanstack/vue-query-devtools'
import AppToaster from '~/presentation/shared/components/AppToaster.vue'

const shouldShowQueryDevtools = import.meta.dev
</script>

<template>
    <div id="app-root">
        <NuxtLayout>
            <NuxtPage />
        </NuxtLayout>
        <AppToaster />
        <ClientOnly>
            <VueQueryDevtools
                v-if="shouldShowQueryDevtools"
                button-position="top-left"
                position="bottom"
            />
        </ClientOnly>
    </div>
</template>
