<template>
    <div class="min-h-screen">
        <slot />
        <AppToaster />
    </div>
</template>

<script setup lang="ts">
import AppToaster from '~/presentation/shared/components/AppToaster.vue'
</script>
