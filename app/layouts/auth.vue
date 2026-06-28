<script setup lang="ts">
import { ArrowLeft } from '@lucide/vue'
import loginMainImage from '~/assets/images/system/login-main.png'
import AppBrand from '~/presentation/shared/components/AppBrand.vue'
</script>

<template>
  <div class="relative flex min-h-screen flex-col overflow-hidden bg-background text-on-surface">
    <header
      class="fixed inset-x-0 top-0 z-30 mx-auto flex max-w-system items-center justify-between px-6 py-7 lg:px-10"
    >
      <AppBrand />
      <NuxtLink
        to="/"
        class="flex items-center gap-2 text-xs font-semibold uppercase text-on-surface-variant transition-colors hover:text-primary"
      >
        <ArrowLeft class="size-4" />
        Volver al inicio
      </NuxtLink>
    </header>

    <main class="relative flex flex-1 items-center justify-center px-6 py-32">
      <div class="absolute inset-0">
        <img
          :src="loginMainImage"
          alt="Sistema moderno con luz cálida"
          class="size-full object-cover opacity-30 grayscale"
        />
        <div class="absolute inset-0 bg-gradient-to-b from-black/70 via-transparent to-black/85" />
      </div>

      <slot />
    </main>

    <footer class="relative z-10 px-6 py-8 text-center">
      <p class="text-xs font-medium uppercase text-on-surface-variant">
        © 2024 Sistema Moderno. Un espacio de paz y conexión.
      </p>
    </footer>
  </div>
</template>
