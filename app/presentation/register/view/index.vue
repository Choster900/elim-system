<script setup lang="ts">
import { Church, Lock, Mail, UserRound } from '@lucide/vue'

defineOptions({ name: 'RegisterPage' })

useHead({
    title: 'Crear Cuenta - Sistema',
})

const form = reactive({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
})
</script>

<template>
    <section class="relative z-10 w-full max-w-[520px]">
        <div class="system-glass-panel rounded-lg p-8 md:p-12">
            <form class="space-y-6" novalidate @submit.prevent>
                <div class="mb-10 text-center">
                    <h1 class="font-display text-4xl font-semibold text-on-surface">Crear cuenta</h1>
                    <p class="mt-2 text-on-surface-variant">Únete a la comunidad Sistema</p>
                </div>

                <div class="space-y-2">
                    <UiLabel for="name" class="text-xs uppercase text-on-surface-variant">
                        Nombre completo
                    </UiLabel>
                    <div class="relative">
                        <UserRound class="pointer-events-none absolute left-0 top-1/2 size-5 -translate-y-1/2 text-on-surface-variant" />
                        <UiInput
                            id="name"
                            v-model="form.name"
                            type="text"
                            placeholder="Tu nombre"
                            autocomplete="name"
                            class="h-12 rounded-none border-x-0 border-t-0 bg-transparent pl-8 text-on-surface placeholder:text-[#d1c5b4]/40 focus-visible:border-primary focus-visible:ring-0 focus-visible:ring-offset-0"
                        />
                    </div>
                </div>

                <div class="space-y-2">
                    <UiLabel for="register-email" class="text-xs uppercase text-on-surface-variant">
                        Correo electrónico
                    </UiLabel>
                    <div class="relative">
                        <Mail class="pointer-events-none absolute left-0 top-1/2 size-5 -translate-y-1/2 text-on-surface-variant" />
                        <UiInput
                            id="register-email"
                            v-model="form.email"
                            type="email"
                            placeholder="tu@ejemplo.com"
                            autocomplete="email"
                            class="h-12 rounded-none border-x-0 border-t-0 bg-transparent pl-8 text-on-surface placeholder:text-[#d1c5b4]/40 focus-visible:border-primary focus-visible:ring-0 focus-visible:ring-offset-0"
                        />
                    </div>
                </div>

                <div class="grid gap-6 md:grid-cols-2">
                    <div class="space-y-2">
                        <UiLabel for="register-password" class="text-xs uppercase text-on-surface-variant">
                            Contraseña
                        </UiLabel>
                        <div class="relative">
                            <Lock class="pointer-events-none absolute left-0 top-1/2 size-5 -translate-y-1/2 text-on-surface-variant" />
                            <UiInput
                                id="register-password"
                                v-model="form.password"
                                type="password"
                                placeholder="••••••••"
                                autocomplete="new-password"
                                class="h-12 rounded-none border-x-0 border-t-0 bg-transparent pl-8 text-on-surface placeholder:text-[#d1c5b4]/40 focus-visible:border-primary focus-visible:ring-0 focus-visible:ring-offset-0"
                            />
                        </div>
                    </div>

                    <div class="space-y-2">
                        <UiLabel for="confirm-password" class="text-xs uppercase text-on-surface-variant">
                            Confirmar
                        </UiLabel>
                        <div class="relative">
                            <Lock class="pointer-events-none absolute left-0 top-1/2 size-5 -translate-y-1/2 text-on-surface-variant" />
                            <UiInput
                                id="confirm-password"
                                v-model="form.confirmPassword"
                                type="password"
                                placeholder="••••••••"
                                autocomplete="new-password"
                                class="h-12 rounded-none border-x-0 border-t-0 bg-transparent pl-8 text-on-surface placeholder:text-[#d1c5b4]/40 focus-visible:border-primary focus-visible:ring-0 focus-visible:ring-offset-0"
                            />
                        </div>
                    </div>
                </div>

                <UiButton type="submit" class="h-12 w-full rounded text-xs uppercase">
                    Crear cuenta
                </UiButton>

                <p class="text-center text-sm text-on-surface-variant">
                    ¿Ya tienes cuenta?
                    <NuxtLink to="/login" class="font-semibold text-primary underline-offset-4 hover:underline">
                        Iniciar sesión
                    </NuxtLink>
                </p>
            </form>
        </div>

        <div class="mt-8 flex justify-center gap-6 text-primary opacity-60">
            <div class="mt-2 h-px w-12 bg-outline" />
            <Church class="size-5" />
            <div class="mt-2 h-px w-12 bg-outline" />
        </div>
    </section>
</template>
