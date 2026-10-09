<script setup lang="ts">
import { ArrowUp, Mail } from '@lucide/vue'
import { useAccessAction } from '~/presentation/auth/composables/useAccessAction'
import { landingContact } from '~/presentation/landing/constants/landing.constants'
import AppBrand from './AppBrand.vue'

const accessAction = useAccessAction()
const currentYear = new Date().getFullYear()

const socialLinks = computed(() =>
    [
        {
            label: 'Instagram',
            href: landingContact.socials.instagram,
            paths: [
                'M7 2h10a5 5 0 0 1 5 5v10a5 5 0 0 1-5 5H7a5 5 0 0 1-5-5V7a5 5 0 0 1 5-5Z',
                'M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37Z',
                'M17.5 6.5h.01',
            ],
        },
        {
            label: 'Facebook',
            href: landingContact.socials.facebook,
            paths: ['M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z'],
        },
        {
            label: 'YouTube',
            href: landingContact.socials.youtube,
            paths: [
                'M2.5 17a24.1 24.1 0 0 1 0-10 2 2 0 0 1 1.4-1.4 49.6 49.6 0 0 1 16.2 0A2 2 0 0 1 21.5 7a24.1 24.1 0 0 1 0 10 2 2 0 0 1-1.4 1.4 49.6 49.6 0 0 1-16.2 0A2 2 0 0 1 2.5 17',
                'm10 15 5-3-5-3z',
            ],
        },
    ].filter((social) => social.href),
)

const exploreLinks = [
    { label: 'Inicio', to: '/#inicio' },
    { label: 'Ministerios', to: '/#ministerios' },
    { label: 'Nuestra visión', to: '/#vision' },
    { label: 'Por qué Elim', to: '/#elim' },
]

const columnTitleClass = 'text-[11px] font-bold uppercase tracking-[0.2em] text-primary'
const linkClass = 'text-[15px] text-on-surface-variant transition-colors hover:text-primary'
const socialClass =
    'inline-flex size-11 items-center justify-center rounded-full border border-outline-variant text-on-surface-variant transition-colors hover:border-primary hover:bg-[rgba(233,193,118,0.06)] hover:text-primary'
</script>

<template>
    <footer
        id="contacto"
        class="scroll-mt-20 border-t border-[rgba(78,70,57,0.6)] bg-surface-container-lowest px-6 pt-[clamp(56px,7vw,88px)]"
    >
        <div class="mx-auto flex max-w-[1240px] flex-wrap gap-x-10 gap-y-12">
            <div class="min-w-0 max-w-[400px] flex-[2_1_300px]">
                <AppBrand />
                <p class="mt-[22px] text-[15px] leading-[1.75] text-on-surface-variant">
                    Una expresión contemporánea de la fe milenaria. Encuéntranos en el corazón de la
                    ciudad.
                </p>
                <div class="mt-6 flex gap-2.5">
                    <a
                        v-for="social in socialLinks"
                        :key="social.label"
                        :href="social.href"
                        :aria-label="social.label"
                        target="_blank"
                        rel="noopener noreferrer"
                        :class="socialClass"
                    >
                        <svg
                            class="size-[18px]"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            stroke-width="2"
                            stroke-linecap="round"
                            stroke-linejoin="round"
                            aria-hidden="true"
                        >
                            <path v-for="path in social.paths" :key="path" :d="path" />
                        </svg>
                    </a>
                    <a
                        v-if="!landingContact.email.startsWith('[')"
                        :href="`mailto:${landingContact.email}`"
                        aria-label="Correo"
                        :class="socialClass"
                    >
                        <Mail class="size-[18px]" />
                    </a>
                </div>
            </div>

            <nav aria-label="Explorar" class="flex min-w-0 flex-[1_1_160px] flex-col gap-3.5">
                <span :class="columnTitleClass">Explorar</span>
                <NuxtLink
                    v-for="link in exploreLinks"
                    :key="link.to"
                    :to="link.to"
                    :class="linkClass"
                >
                    {{ link.label }}
                </NuxtLink>
            </nav>

            <div class="flex min-w-0 flex-[1_1_200px] flex-col gap-3.5">
                <span :class="columnTitleClass">Visítanos</span>
                <span class="text-[15px] leading-relaxed text-on-surface-variant">
                    {{ landingContact.address }}
                </span>
                <span class="text-[15px] leading-relaxed text-on-surface-variant">
                    {{ landingContact.serviceSchedule }}
                </span>
                <NuxtLink to="/#ubicacion" :class="linkClass">Cómo llegar</NuxtLink>
            </div>

            <div class="flex min-w-0 flex-[1_1_160px] flex-col gap-3.5">
                <span :class="columnTitleClass">Comunidad</span>
                <NuxtLink :to="accessAction.to" :class="linkClass">
                    {{ accessAction.label }}
                </NuxtLink>
                <span class="text-[15px] text-on-surface-variant">{{ landingContact.phone }}</span>
                <span class="text-[15px] text-on-surface-variant">{{ landingContact.email }}</span>
            </div>
        </div>

        <div
            class="mx-auto mt-14 flex max-w-[1240px] flex-wrap items-center justify-between gap-3 border-t border-[rgba(78,70,57,0.6)] pb-7 pt-6 text-[13px] text-[rgba(209,197,180,0.8)]"
        >
            <span>© {{ currentYear }} Elim · Misión Cristiana. Todos los derechos reservados.</span>
            <NuxtLink
                to="/#inicio"
                class="inline-flex items-center gap-2 transition-colors hover:text-primary"
            >
                Volver arriba
                <ArrowUp class="size-3.5" />
            </NuxtLink>
        </div>
    </footer>
</template>
