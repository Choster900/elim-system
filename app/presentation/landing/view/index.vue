<script setup lang="ts">
import { ArrowDown, ArrowRight, Clock, Droplet, MapPin, Users } from '@lucide/vue'
import heroMainImage from '~/assets/images/system/hero-main.jpg'
import visionForestImage from '~/assets/images/system/vision-forest.png'
import { useAccessAction } from '~/presentation/auth/composables/useAccessAction'
import LandingHeroScene from '../components/LandingHeroScene.vue'
import LandingMap from '../components/LandingMap.vue'
import { landingContact, landingMinistries } from '../constants/landing.constants'

defineOptions({ name: 'HomePage' })

useHead({
    title: 'Elim · Misión Cristiana',
    meta: [
        {
            name: 'description',
            content:
                'Una iglesia contemporánea con una experiencia minimalista, reverente y profundamente comunitaria.',
        },
    ],
})

const accessAction = useAccessAction()

const values = [
    { title: 'Paz', description: 'Un lugar para descansar y escuchar.' },
    { title: 'Propósito', description: 'Fe aplicada a la vida diaria.' },
    { title: 'Comunidad', description: 'Relaciones reales, mesa compartida.' },
]

const eyebrowClass = 'block text-[11px] font-bold uppercase tracking-[0.22em] text-primary'
const sectionTitleClass =
    'font-display text-[clamp(2rem,3.6vw,2.9rem)] font-semibold leading-[1.12] text-on-surface'
</script>

<template>
    <main class="overflow-x-clip bg-background text-on-surface">
        <section
            id="inicio"
            class="relative flex min-h-[46rem] items-center justify-center overflow-hidden bg-surface-container-lowest px-6 pb-36 pt-40"
        >
            <img
                :src="heroMainImage"
                alt=""
                aria-hidden="true"
                fetchpriority="high"
                class="absolute inset-0 size-full object-cover opacity-[0.22] grayscale-[0.4]"
            />
            <div
                aria-hidden="true"
                class="absolute inset-0 bg-[radial-gradient(ellipse_70%_55%_at_50%_38%,rgba(12,15,15,0.15)_0%,rgba(12,15,15,0.85)_70%,var(--surface-container-lowest)_100%)]"
            />
            <LandingHeroScene />
            <div
                aria-hidden="true"
                class="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-b from-transparent to-background"
            />

            <div class="relative z-10 flex max-w-[880px] flex-col items-center text-center">
                <h1
                    class="font-display text-[clamp(2.5rem,6.2vw,4.75rem)] font-bold leading-[1.05] tracking-[-0.015em] text-on-surface"
                >
                    Donde la tradición se encuentra con la
                    <em class="font-semibold italic text-primary">modernidad</em>
                </h1>
                <p
                    class="mt-6 max-w-[620px] text-[clamp(1rem,1.6vw,1.15rem)] leading-[1.75] text-on-surface-variant"
                >
                    Únete a nuestra comunidad y descubre un espacio de paz y propósito diseñado para
                    el alma contemporánea.
                </p>

                <div class="mt-10 flex flex-wrap justify-center gap-3.5">
                    <a
                        href="#vision"
                        class="landing-btn-gold inline-flex h-[52px] items-center gap-2.5 rounded-md bg-primary px-[30px] text-xs font-bold uppercase tracking-[0.14em] text-primary-foreground"
                    >
                        Conócenos
                        <ArrowRight class="size-4" />
                    </a>
                    <a
                        href="#ministerios"
                        class="inline-flex h-[52px] items-center rounded-md border border-[rgba(233,193,118,0.45)] px-[30px] text-xs font-bold uppercase tracking-[0.14em] text-on-surface transition-colors hover:border-primary hover:bg-[rgba(233,193,118,0.08)] hover:text-primary"
                    >
                        Ver ministerios
                    </a>
                </div>

                <div
                    class="mt-12 inline-flex flex-wrap items-center justify-center gap-x-6 gap-y-2.5 rounded-xl border border-[rgba(78,70,57,0.7)] bg-[rgba(26,28,28,0.6)] px-[22px] py-3.5 text-[13px] text-on-surface-variant backdrop-blur-md"
                >
                    <span class="inline-flex items-center gap-2">
                        <Clock class="size-4 text-primary" />
                        Servicio · {{ landingContact.serviceSchedule }}
                    </span>
                    <span aria-hidden="true" class="hidden h-4 w-px bg-outline-variant sm:block" />
                    <span class="inline-flex items-center gap-2">
                        <MapPin class="size-4 text-primary" />
                        {{ landingContact.address }}
                    </span>
                </div>
            </div>

            <a
                href="#ministerios"
                class="absolute bottom-7 left-1/2 z-10 flex -translate-x-1/2 flex-col items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-on-surface-variant transition-colors hover:text-primary"
            >
                Descubre más
                <ArrowDown class="landing-cue size-[18px]" />
            </a>
        </section>

        <section id="ministerios" class="scroll-mt-20 px-6 py-[clamp(72px,9vw,128px)]">
            <div class="mx-auto max-w-[1240px]">
                <div class="mb-12 flex flex-wrap items-end justify-between gap-6">
                    <div class="max-w-[560px]">
                        <span :class="eyebrowClass">Comunidad activa</span>
                        <h2 :class="['mt-4', sectionTitleClass]">Ministerios y eventos</h2>
                    </div>
                    <p class="max-w-[420px] text-[15px] leading-[1.7] text-on-surface-variant">
                        Espacios para crecer en la fe, compartir la mesa y servir juntos durante
                        toda la semana.
                    </p>
                </div>

                <div class="grid grid-cols-[repeat(auto-fit,minmax(250px,1fr))] gap-7">
                    <article
                        v-for="ministry in landingMinistries"
                        :key="ministry.title"
                        class="group flex flex-col transition-transform duration-300 ease-out hover:-translate-y-1.5 motion-reduce:transition-none motion-reduce:hover:translate-y-0"
                    >
                        <div
                            class="relative aspect-[4/5] overflow-hidden rounded-[10px] bg-surface-container"
                        >
                            <img
                                :src="ministry.image"
                                :alt="ministry.title"
                                loading="lazy"
                                decoding="async"
                                class="size-full object-cover grayscale-[0.85] transition duration-[900ms] ease-out group-hover:scale-[1.06] group-hover:grayscale-0 motion-reduce:transition-none"
                            />
                            <div
                                aria-hidden="true"
                                class="absolute inset-0 bg-gradient-to-b from-transparent from-55% to-[rgba(12,15,15,0.7)]"
                            />
                        </div>
                        <h3
                            class="mt-5 font-display text-[22px] font-semibold leading-tight text-on-surface"
                        >
                            {{ ministry.title }}
                        </h3>
                        <p class="mt-2.5 text-[15px] leading-[1.7] text-on-surface-variant">
                            {{ ministry.description }}
                        </p>
                    </article>
                </div>
            </div>
        </section>

        <section
            id="elim"
            class="relative scroll-mt-20 overflow-hidden border-y border-[rgba(78,70,57,0.5)] bg-surface-container-lowest px-6 py-[clamp(80px,10vw,144px)]"
        >
            <div
                aria-hidden="true"
                class="absolute left-1/2 top-1/2 size-[720px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(circle,rgba(233,193,118,0.10)_0%,rgba(233,193,118,0)_65%)]"
            />
            <figure class="relative mx-auto max-w-[900px] text-center">
                <Droplet class="mx-auto size-9 text-primary" :stroke-width="1.6" />
                <blockquote
                    class="mt-7 font-display text-[clamp(1.6rem,3.4vw,2.6rem)] font-semibold italic leading-[1.35] text-on-surface"
                >
                    “Y llegaron a Elim, donde había doce fuentes de aguas, y setenta palmeras; y
                    acamparon allí junto a las aguas.”
                </blockquote>
                <figcaption class="mt-6 text-xs font-bold uppercase tracking-[0.22em] text-primary">
                    Éxodo 15:27
                </figcaption>
                <p
                    class="mx-auto mt-7 max-w-[560px] text-base leading-[1.75] text-on-surface-variant"
                >
                    Nuestro nombre recuerda un lugar de descanso y agua viva en medio del desierto.
                    Eso queremos ser para nuestra ciudad.
                </p>
            </figure>
        </section>

        <section id="vision" class="scroll-mt-20 px-6 py-[clamp(80px,10vw,140px)]">
            <div
                class="mx-auto flex max-w-[1240px] flex-wrap items-center gap-[clamp(40px,6vw,88px)]"
            >
                <div class="relative min-w-0 flex-[1_1_380px]">
                    <div
                        class="aspect-[4/5] max-h-[600px] overflow-hidden rounded-xl bg-surface-container"
                    >
                        <img
                            :src="visionForestImage"
                            alt="Bosque sereno con luz cálida"
                            loading="lazy"
                            decoding="async"
                            class="size-full object-cover grayscale-[0.5]"
                        />
                    </div>
                    <div
                        class="absolute -bottom-6 right-3 max-w-[220px] rounded-xl border border-[rgba(233,193,118,0.45)] bg-[rgba(26,28,28,0.85)] px-6 py-[22px] backdrop-blur-md sm:-right-3"
                    >
                        <span
                            class="block text-[10px] font-bold uppercase tracking-[0.2em] text-primary"
                        >
                            Valores
                        </span>
                        <p class="mt-2 font-display text-[19px] leading-snug text-on-surface">
                            Paz, propósito y comunidad real.
                        </p>
                    </div>
                </div>

                <div class="min-w-0 flex-[1_1_420px]">
                    <span :class="eyebrowClass">Nuestra visión</span>
                    <h2 :class="['mt-[18px]', sectionTitleClass]">
                        Un refugio para el alma en el ruido de la ciudad.
                    </h2>
                    <p class="mt-[26px] text-[17px] leading-[1.8] text-on-surface-variant">
                        En Elim creemos que la espiritualidad no es algo del pasado, sino una
                        brújula esencial para navegar el presente. Somos una comunidad que valora la
                        profundidad teológica, la estética moderna y la inclusión radical.
                    </p>
                    <p class="mt-[18px] text-base leading-[1.8] text-on-surface-variant">
                        Nuestro espacio está diseñado para ser acogedor y contemporáneo, permitiendo
                        que cada persona encuentre su propio ritmo de conexión con lo divino y con
                        los demás.
                    </p>
                    <div class="mt-8 grid grid-cols-[repeat(auto-fit,minmax(150px,1fr))] gap-3.5">
                        <div
                            v-for="value in values"
                            :key="value.title"
                            class="rounded-[10px] border border-outline-variant bg-surface-container-low p-[18px]"
                        >
                            <span class="block font-display text-lg text-on-surface">
                                {{ value.title }}
                            </span>
                            <span
                                class="mt-1.5 block text-[13px] leading-[1.55] text-on-surface-variant"
                            >
                                {{ value.description }}
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        </section>

        <section id="ubicacion" class="scroll-mt-20 px-6 pb-[clamp(72px,9vw,120px)]">
            <div class="mx-auto max-w-[1240px]">
                <LandingMap />

                <div
                    class="mt-7 flex flex-wrap items-center justify-between gap-[18px] rounded-[14px] border border-dashed border-[rgba(233,193,118,0.4)] px-[clamp(20px,4vw,36px)] py-6"
                >
                    <div class="flex min-w-0 items-center gap-4">
                        <span
                            class="flex size-11 shrink-0 items-center justify-center rounded-xl bg-[rgba(233,193,118,0.1)] text-primary"
                        >
                            <Users class="size-5" />
                        </span>
                        <span>
                            <span class="block text-base font-semibold text-on-surface">
                                ¿Ya sirves en Elim?
                            </span>
                            <span class="mt-0.5 block text-sm text-on-surface-variant">
                                Ingresa al sistema con la invitación que recibiste de tu líder.
                            </span>
                        </span>
                    </div>
                    <NuxtLink
                        :to="accessAction.to"
                        class="inline-flex h-[46px] items-center gap-2 rounded-md border border-[rgba(233,193,118,0.5)] px-[22px] text-xs font-bold uppercase tracking-[0.12em] text-on-surface transition-colors hover:border-primary hover:bg-[rgba(233,193,118,0.08)] hover:text-primary"
                    >
                        {{ accessAction.label }}
                        <ArrowRight class="size-4" />
                    </NuxtLink>
                </div>
            </div>
        </section>
    </main>
</template>
