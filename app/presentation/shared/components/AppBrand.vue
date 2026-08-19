<script setup lang="ts">
// Versión recortada de `logo.png`: el archivo original lleva el 45% de su alto en
// transparencia (215 px arriba y 352 px abajo), y ese vacío escalaba con la imagen
// y engordaba el encabezado. El arte es idéntico, solo sin el margen.
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

// Dimensiones reales del archivo: se declaran para que el navegador reserve el
// espacio antes de cargarlo y el encabezado no salte.
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
