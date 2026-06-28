<script setup lang="ts">
import { Church } from '@lucide/vue'
import AuthLoginForm from '../components/LoginForm.vue'

defineOptions({ name: 'LoginPage' })

useHead({
    title: 'Iniciar Sesión - Sistema',
})
</script>

<template>
    <section class="relative z-10 w-full max-w-[480px]">
        <div class="system-glass-panel rounded-lg p-8 md:p-12">
            <AuthLoginForm />
        </div>

        <div class="mt-8 flex justify-center gap-6 text-primary opacity-60">
            <div class="mt-2 h-px w-12 bg-outline" />
            <Church class="size-5" />
            <div class="mt-2 h-px w-12 bg-outline" />
        </div>
    </section>
</template>
