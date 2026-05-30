<template>
    <Toaster
        :theme="mode"
        :position="APP_TOAST_POSITION"
        :duration="APP_TOAST_DURATION_MS"
        :visible-toasts="APP_TOAST_VISIBLE_COUNT"
        close-button
        rich-colors
    />
</template>

<script setup lang="ts">
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
