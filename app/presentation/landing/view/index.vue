<script setup lang="ts">
import { ArrowDown, ArrowRight, ChevronLeft, ChevronRight } from '@lucide/vue'
import communityDinnerImage from '~/assets/images/system/community-dinner.png'
import heroMainImage from '~/assets/images/system/hero-main.jpg'
import lifeSchoolImage from '~/assets/images/system/life-school.png'
import visionForestImage from '~/assets/images/system/vision-forest.png'
import worshipServiceImage from '~/assets/images/system/worship-service.png'
import youthMinistryImage from '~/assets/images/system/youth-ministry.png'

defineOptions({ name: 'HomePage' })

useHead({
    title: 'Sistema - Landing Page Iglesia',
    meta: [
        {
            name: 'description',
            content:
                'Una iglesia contemporánea con una experiencia minimalista, reverente y profundamente comunitaria.',
        },
    ],
})

const slider = ref<HTMLElement | null>(null)

const ministryCards = [
    {
        title: 'Jóvenes en Acción',
        label: 'Ministerio',
        image: youthMinistryImage,
        description:
            'Un espacio dinámico para que las nuevas generaciones exploren su fe en un lenguaje actual.',
    },
    {
        title: 'Cena de Comunidad',
        label: 'Evento Próximo',
        image: communityDinnerImage,
        description:
            'Compartimos la mesa y la vida. Un encuentro mensual para fortalecer nuestros lazos fraternales.',
    },
    {
        title: 'Escuela de Vida',
        label: 'Clases Dominicales',
        image: lifeSchoolImage,
        description:
            'Clases diseñadas para aplicar la sabiduría bíblica a los desafíos de la vida moderna cotidiana.',
    },
    {
        title: 'Celebración de Fe',
        label: 'Servicio Dominical',
        image: worshipServiceImage,
        description:
            'Experiencias de adoración inmersivas que combinan liturgia clásica con expresión contemporánea.',
    },
]

function scrollSlider(direction: 'prev' | 'next') {
    slider.value?.scrollBy({
        left: direction === 'next' ? 432 : -432,
        behavior: 'smooth',
    })
}

function scrollToId(id: string) {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' })
}
</script>

<template>
    <main>
        <header
            class="relative flex min-h-[92vh] items-center justify-center overflow-hidden px-6 pb-24 pt-32"
        >
            <img
                :src="heroMainImage"
                alt="Interior moderno de iglesia con luz cálida"
                class="absolute inset-0 size-full object-cover"
            />
            <div class="system-hero-overlay absolute inset-0" />

            <div class="relative z-10 mx-auto max-w-4xl text-center">
                <h1
                    class="font-display text-4xl font-bold leading-tight text-on-background md:text-6xl"
                >
                    Donde la tradición se encuentra con la modernidad
                </h1>
                <p class="mx-auto mt-6 max-w-2xl text-lg leading-8 text-on-surface-variant">
                    Únete a nuestra comunidad y descubre un espacio de paz y propósito diseñado para
                    el alma contemporánea.
                </p>

                <div class="mt-10 flex flex-col justify-center gap-4 sm:flex-row">
                    <UiButton
                        type="button"
                        class="h-12 rounded px-10 text-xs uppercase"
                        @click="scrollToId('vision')"
                    >
                        Conócenos
                    </UiButton>
                    <UiButton
                        variant="outline"
                        type="button"
                        class="h-12 rounded border-primary px-10 text-xs uppercase text-primary"
                        @click="scrollToId('ministerios')"
                    >
                        Ver Servicios
                    </UiButton>
                </div>
            </div>

            <button
                type="button"
                class="absolute bottom-8 left-1/2 flex -translate-x-1/2 flex-col items-center text-xs font-semibold uppercase text-on-surface-variant transition-colors hover:text-primary"
                @click="scrollToId('ministerios')"
            >
                Descubre más
                <ArrowDown class="mt-2 size-5" />
            </button>
        </header>

        <section id="ministerios" class="bg-background py-24 lg:py-32">
            <div class="mx-auto mb-14 flex max-w-system items-end justify-between px-6 lg:px-10">
                <div>
                    <span class="mb-4 block text-xs font-semibold uppercase text-primary"
                        >Comunidad activa</span
                    >
                    <h2 class="font-display text-3xl font-semibold text-on-background md:text-4xl">
                        Ministerios y Eventos
                    </h2>
                </div>

                <div class="hidden gap-3 md:flex">
                    <UiButton
                        variant="outline"
                        size="icon"
                        type="button"
                        class="rounded-full"
                        aria-label="Ver tarjeta anterior"
                        @click="scrollSlider('prev')"
                    >
                        <ChevronLeft class="size-5" />
                    </UiButton>
                    <UiButton
                        variant="outline"
                        size="icon"
                        type="button"
                        class="rounded-full"
                        aria-label="Ver tarjeta siguiente"
                        @click="scrollSlider('next')"
                    >
                        <ChevronRight class="size-5" />
                    </UiButton>
                </div>
            </div>

            <div
                ref="slider"
                class="hide-scrollbar flex gap-8 overflow-x-auto scroll-smooth px-6 pb-8 lg:px-10"
            >
                <article
                    v-for="card in ministryCards"
                    :key="card.title"
                    class="group min-w-[320px] cursor-pointer md:min-w-[400px]"
                >
                    <div class="relative mb-6 h-[420px] overflow-hidden md:h-[500px]">
                        <img
                            :src="card.image"
                            :alt="card.title"
                            class="size-full object-cover grayscale transition duration-700 group-hover:scale-105 group-hover:grayscale-0"
                        />
                        <div class="absolute left-4 top-4">
                            <UiBadge variant="sacred" class="uppercase">
                                {{ card.label }}
                            </UiBadge>
                        </div>
                    </div>
                    <h3 class="mb-2 font-display text-2xl font-semibold text-on-background">
                        {{ card.title }}
                    </h3>
                    <p class="line-clamp-2 leading-7 text-on-surface-variant">
                        {{ card.description }}
                    </p>
                </article>
            </div>
        </section>

        <section
            id="vision"
            class="relative overflow-hidden bg-surface-container-lowest py-24 lg:py-32"
        >
            <div
                class="pointer-events-none absolute -right-20 top-0 hidden opacity-[0.05] lg:block"
            >
                <span class="font-display text-[360px] font-bold leading-none text-primary">R</span>
            </div>

            <div class="mx-auto grid max-w-system items-center gap-12 px-6 md:grid-cols-2 lg:px-10">
                <div class="relative order-2 h-[520px] md:order-1">
                    <img
                        :src="visionForestImage"
                        alt="Bosque sereno con luz cálida"
                        class="size-full rounded-sm object-cover grayscale transition duration-700 hover:grayscale-0"
                    />
                    <div
                        class="absolute -bottom-8 -right-8 hidden w-48 border border-primary bg-[rgba(233,193,118,0.08)] p-6 backdrop-blur md:block"
                    >
                        <p class="mb-2 text-xs font-semibold uppercase text-primary">Valores</p>
                        <p class="leading-7 text-on-surface">Paz, Propósito y Comunidad Real.</p>
                    </div>
                </div>

                <div class="order-1 md:order-2">
                    <span class="mb-6 block text-xs font-semibold uppercase text-primary"
                        >Nuestra visión</span
                    >
                    <h2
                        class="mb-8 font-display text-4xl font-semibold leading-tight text-on-background"
                    >
                        Un refugio para el alma en el ruido de la ciudad.
                    </h2>
                    <p class="mb-6 text-lg leading-8 text-on-surface-variant">
                        En SISTEMA, creemos que la espiritualidad no es algo del pasado, sino una
                        brújula esencial para navegar el presente. Somos una comunidad que valora la
                        profundidad teológica, la estética moderna y la inclusión radical.
                    </p>
                    <p class="mb-10 leading-8 text-on-surface-variant">
                        Nuestro espacio está diseñado para ser acogedor y contemporáneo, permitiendo
                        que cada persona encuentre su propio ritmo de conexión con lo divino y con
                        los demás.
                    </p>
                    <NuxtLink
                        to="#"
                        class="inline-flex items-center gap-3 border-b border-primary pb-1 text-xs font-semibold uppercase text-primary transition-opacity hover:opacity-75"
                    >
                        Leer nuestro manifiesto
                        <ArrowRight class="size-4" />
                    </NuxtLink>
                </div>
            </div>
        </section>

        <section id="boletin" class="border-t border-outline-variant bg-background px-6 py-24">
            <div class="mx-auto max-w-4xl text-center">
                <h3 class="mb-6 font-display text-3xl font-semibold text-on-background">
                    ¿Buscas algo más profundo?
                </h3>
                <p class="mx-auto mb-10 max-w-2xl leading-7 text-on-surface-variant">
                    Suscríbete a nuestro boletín semanal de reflexiones y mantente al tanto de
                    nuestros próximos eventos.
                </p>
                <form class="mx-auto flex max-w-xl flex-col gap-4 md:flex-row" @submit.prevent>
                    <UiInput
                        type="email"
                        placeholder="Tu correo electrónico"
                        class="h-12 rounded-none border-x-0 border-t-0 bg-surface-container text-on-surface"
                    />
                    <UiButton type="submit" class="h-12 rounded px-8 text-xs uppercase">
                        Suscribirse
                    </UiButton>
                </form>
            </div>
        </section>
    </main>
</template>
