<script setup lang="ts">
import DashboardNavbar from '~/presentation/shared/components/DashboardNavbar.vue'
</script>

<template>
  <div class="min-h-screen bg-surface-container-lowest text-on-surface">
    <DashboardNavbar />

    <slot />

    <footer class="border-t border-outline-variant bg-surface-container-lowest">
      <div class="mx-auto flex max-w-system flex-col items-center justify-between gap-4 px-6 py-8 md:flex-row lg:px-10">
        <span class="font-display text-2xl font-semibold text-primary">Sistema</span>
        <p class="text-xs font-semibold uppercase text-on-surface-variant">
          © 2024 Sistema. Minimalismo Sagrado.
        </p>
        <div class="flex gap-6">
          <NuxtLink
            to="#"
            class="text-xs font-semibold uppercase text-on-surface-variant hover:text-on-surface"
          >
            Soporte
          </NuxtLink>
          <NuxtLink
            to="#"
            class="text-xs font-semibold uppercase text-on-surface-variant hover:text-on-surface"
          >
            Privacidad
          </NuxtLink>
          <NuxtLink
            to="#"
            class="text-xs font-semibold uppercase text-on-surface-variant hover:text-on-surface"
          >
            Términos
          </NuxtLink>
        </div>
      </div>
    </footer>
  </div>
</template>
