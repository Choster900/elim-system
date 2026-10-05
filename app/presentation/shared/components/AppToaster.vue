<template>
    <Toaster
        :theme="mode"
        :position="APP_TOAST_POSITION"
        :duration="APP_TOAST_DURATION_MS"
        :visible-toasts="APP_TOAST_VISIBLE_COUNT"
        close-button
    >
        <template #success-icon><Check :stroke-width="2.5" /></template>
        <template #error-icon><X :stroke-width="2.5" /></template>
        <template #warning-icon><TriangleAlert :stroke-width="2.25" /></template>
        <template #info-icon><Info :stroke-width="2.25" /></template>
        <template #loading-icon>
            <LoaderCircle class="animate-spin" :stroke-width="2.25" />
        </template>
        <template #close-icon><X :stroke-width="2" /></template>
    </Toaster>
</template>

<script setup lang="ts">
import { Check, Info, LoaderCircle, TriangleAlert, X } from '@lucide/vue'
import { Toaster } from 'vue-sonner'
import {
    APP_TOAST_DURATION_MS,
    APP_TOAST_POSITION,
    APP_TOAST_VISIBLE_COUNT,
} from '~/constants/ui/toast.constants'
import { useThemeMode } from '~/presentation/shared/composables/useThemeMode'

defineOptions({
    name: 'AppToaster',
})

const { mode } = useThemeMode()
</script>
