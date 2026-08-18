<script setup lang="ts">
import PendingOfferingsView from './PendingOfferingsView.vue'

// La vista del líder es la misma bandeja con alcance propio: el filtrado real lo
// hace el servidor, aquí solo se simplifica la presentación.
defineOptions({ name: 'MyMeetingsView' })
</script>

<template>
    <PendingOfferingsView personal-scope />
</template>
