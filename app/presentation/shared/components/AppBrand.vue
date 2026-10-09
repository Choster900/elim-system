<script setup lang="ts">
import logoUrl from '~/assets/images/system/logo-trimmed.png'

const props = withDefaults(
    defineProps<{
        to?: string
        compact?: boolean
    }>(),
    {
        to: '/',
        compact: false,
    },
)

const INTRINSIC_WIDTH = 1195
const INTRINSIC_HEIGHT = 687
</script>

<template>
    <NuxtLink
        :to="props.to"
        class="inline-flex shrink-0 items-center transition-opacity hover:opacity-80"
    >
        <img
            :src="logoUrl"
            :width="INTRINSIC_WIDTH"
            :height="INTRINSIC_HEIGHT"
            alt="Elim · Misión Cristiana"
            decoding="async"
            class="w-auto object-contain"
            :class="props.compact ? 'h-8' : 'h-10 md:h-11'"
        />
    </NuxtLink>
</template>
