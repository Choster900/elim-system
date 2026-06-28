<script setup lang="ts">
import PublicFooter from '~/presentation/shared/components/PublicFooter.vue'
import PublicNavbar from '~/presentation/shared/components/PublicNavbar.vue'
</script>

<template>
  <div class="min-h-screen overflow-x-hidden bg-background text-on-surface">
    <PublicNavbar />
    <slot />
    <PublicFooter />
  </div>
</template>
