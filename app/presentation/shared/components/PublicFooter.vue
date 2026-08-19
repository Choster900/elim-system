<script setup lang="ts">
import { AtSign, Globe2, Share2 } from '@lucide/vue'
import AppBrand from './AppBrand.vue'
</script>

<template>
    <footer
        id="contacto"
        class="border-t border-outline-variant bg-surface-container-lowest px-6 py-24 lg:px-10"
    >
        <div class="mx-auto flex max-w-system flex-col justify-between gap-12 md:flex-row">
            <div class="max-w-xs">
                <AppBrand class="mb-6" />
                <p class="mt-6 text-base leading-7 text-on-surface-variant">
                    Una expresión contemporánea de la fe milenaria. Encuéntranos en el corazón de la
                    ciudad.
                </p>
                <div class="mt-8 flex gap-4">
                    <NuxtLink
                        to="#"
                        aria-label="Sitio web"
                        class="text-on-surface-variant transition-colors hover:text-primary"
                    >
                        <Globe2 class="size-5" />
                    </NuxtLink>
                    <NuxtLink
                        to="#"
                        aria-label="Correo"
                        class="text-on-surface-variant transition-colors hover:text-primary"
                    >
                        <AtSign class="size-5" />
                    </NuxtLink>
                    <NuxtLink
                        to="#"
                        aria-label="Compartir"
                        class="text-on-surface-variant transition-colors hover:text-primary"
                    >
                        <Share2 class="size-5" />
                    </NuxtLink>
                </div>
            </div>

            <div class="grid grid-cols-2 gap-12 md:gap-24">
                <div class="flex flex-col gap-4">
                    <span class="text-xs font-semibold uppercase text-primary">Recursos</span>
                    <NuxtLink
                        to="#"
                        class="text-on-surface-variant underline-offset-4 hover:text-primary hover:underline"
                    >
                        Ubicación
                    </NuxtLink>
                    <NuxtLink
                        to="#"
                        class="text-on-surface-variant underline-offset-4 hover:text-primary hover:underline"
                    >
                        Horarios de Servicio
                    </NuxtLink>
                    <NuxtLink
                        to="#"
                        class="text-on-surface-variant underline-offset-4 hover:text-primary hover:underline"
                    >
                        Privacidad
                    </NuxtLink>
                    <NuxtLink
                        to="#"
                        class="text-on-surface-variant underline-offset-4 hover:text-primary hover:underline"
                    >
                        Contacto
                    </NuxtLink>
                </div>
                <div class="flex max-w-56 flex-col gap-4">
                    <span class="text-xs font-semibold uppercase text-primary">Legal</span>
                    <p class="text-sm leading-6 text-on-surface-variant">
                        © 2024 Sistema Moderno. Todos los derechos reservados.
                    </p>
                </div>
            </div>
        </div>
    </footer>
</template>
