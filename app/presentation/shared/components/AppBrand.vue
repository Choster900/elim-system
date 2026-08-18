<script setup lang="ts">
import logoUrl from '~/assets/images/system/logo.png'

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

// Dimensiones reales del archivo: se declaran para que el navegador reserve el
// espacio antes de cargarlo y el encabezado no salte.
const INTRINSIC_WIDTH = 2120
const INTRINSIC_HEIGHT = 742
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
            :class="props.compact ? 'h-7' : 'h-8 md:h-9'"
        />
    </NuxtLink>
</template>
