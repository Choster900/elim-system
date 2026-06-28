<script setup lang="ts">
import {
    CalendarDays,
    CalendarPlus,
    Church,
    HeartHandshake,
    Landmark,
    MoreVertical,
    Send,
    UserPlus,
    UsersRound,
    WalletCards,
} from '@lucide/vue'
import MetricCard from '~/presentation/shared/components/MetricCard.vue'

defineOptions({ name: 'DashboardView' })

useHead({
    title: 'Dashboard - Sistema',
})

const metrics = [
    {
        icon: UsersRound,
        label: 'Miembros Totales',
        value: '1,248',
        meta: '+12 este mes',
        positive: true,
    },
    {
        icon: Landmark,
        label: 'Ministerios Activos',
        value: '14',
        meta: '2 nuevos en planificación',
    },
    {
        icon: CalendarDays,
        label: 'Próximos Eventos',
        value: '8',
        meta: 'Próximo: Vigilia de Oración',
    },
    {
        icon: HeartHandshake,
        label: 'Ofrendas Mensuales',
        value: '$24.5k',
        meta: 'Meta: 92% alcanzada',
    },
]

const chartBars = [
    { label: 'Semana 1', value: 60 },
    { label: 'Semana 2', value: 45 },
    { label: 'Semana 3', value: 85, active: true },
    { label: 'Semana 4', value: 70 },
    { label: 'Semana 5', value: 55 },
    { label: 'Semana 6', value: 90 },
]

const quickActions = [
    { label: 'Nuevo miembro', icon: UserPlus },
    { label: 'Crear evento', icon: CalendarPlus },
    { label: 'Gestionar finanzas', icon: WalletCards },
    { label: 'Enviar boletín', icon: Send },
]

const upcomingEvents = [
    {
        name: 'Servicio Dominical: Renovación',
        ministry: 'Ministerio de Adoración',
        date: '15 May, 10:00 AM',
        place: 'Sistema Principal',
        status: 'Confirmado',
        confirmed: true,
        icon: Church,
    },
    {
        name: 'Cena Comunitaria Mensual',
        ministry: 'Hospitalidad',
        date: '18 May, 07:30 PM',
        place: 'Salón Parroquial',
        status: 'En preparación',
        confirmed: false,
        icon: HeartHandshake,
    },
    {
        name: 'Taller de Liderazgo Espiritual',
        ministry: 'Educación Cristiana',
        date: '22 May, 09:00 AM',
        place: 'Aula Magna B',
        status: 'Confirmado',
        confirmed: true,
        icon: Landmark,
    },
]
</script>

<template>
    <main class="mx-auto max-w-system px-6 pb-24 pt-32 lg:px-10">
            <header class="fade-in mb-16">
                <p class="mb-2 text-xs font-semibold uppercase text-primary">Gestión eclesiástica</p>
                <h1 class="font-display text-4xl font-bold leading-tight text-on-surface md:text-6xl">
                    Panel de Control – Sistema
                </h1>
                <p class="mt-4 max-w-2xl text-lg leading-8 text-on-surface-variant">
                    Bienvenido, Administrador. La paz sea con usted. Aquí encontrará una vista unificada del pulso de su comunidad y ministerios.
                </p>
            </header>

            <section class="fade-in mb-20 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
                <MetricCard
                    v-for="metric in metrics"
                    :key="metric.label"
                    :icon="metric.icon"
                    :label="metric.label"
                    :value="metric.value"
                    :meta="metric.meta"
                    :positive="metric.positive"
                />
            </section>

            <section class="grid grid-cols-12 gap-8">
                <UiCard class="fade-in col-span-12 rounded p-6 md:p-10 lg:col-span-8">
                    <div class="mb-10 flex flex-col justify-between gap-4 md:flex-row md:items-center">
                        <div>
                            <h2 class="font-display text-2xl font-semibold text-on-surface">
                                Actividad de la Comunidad
                            </h2>
                            <p class="mt-1 text-sm text-on-surface-variant">
                                Participación en servicios y grupos pequeños (últimos 30 días)
                            </p>
                        </div>
                        <UiButton variant="link" type="button" class="justify-start px-0 text-xs uppercase">
                            Ver reporte completo
                        </UiButton>
                    </div>

                    <div class="flex h-64 w-full items-end gap-4">
                        <div
                            v-for="bar in chartBars"
                            :key="bar.label"
                            class="group relative flex-1 cursor-help"
                            :style="{ height: `${bar.value}%` }"
                        >
                            <div
                                :class="[
                                    'size-full transition-colors',
                                    bar.active ? 'bg-primary' : 'bg-surface-container-highest group-hover:bg-surface-bright',
                                ]"
                            />
                            <span
                                class="absolute -top-8 left-1/2 -translate-x-1/2 text-xs font-semibold text-primary opacity-0 transition-opacity group-hover:opacity-100"
                            >
                                {{ bar.value }}%
                            </span>
                        </div>
                    </div>
                    <div class="mt-6 grid grid-cols-3 gap-3 text-xs font-semibold uppercase text-on-surface-variant md:grid-cols-6">
                        <span v-for="bar in chartBars" :key="bar.label">{{ bar.label }}</span>
                    </div>
                </UiCard>

                <UiCard class="fade-in col-span-12 rounded p-6 md:p-8 lg:col-span-4">
                    <h2 class="mb-6 font-display text-2xl font-semibold text-on-surface">Accesos Rápidos</h2>
                    <div class="grid gap-4">
                        <button
                            v-for="action in quickActions"
                            :key="action.label"
                            type="button"
                            class="flex items-center gap-4 border border-outline-variant p-4 text-left transition-all hover:border-primary hover:bg-surface-container-high"
                        >
                            <component :is="action.icon" class="size-5 text-primary" />
                            <span class="text-xs font-semibold uppercase">{{ action.label }}</span>
                        </button>
                    </div>
                </UiCard>

                <UiCard class="fade-in col-span-12 rounded p-6 md:p-10">
                    <div class="mb-10 flex flex-col justify-between gap-4 md:flex-row md:items-end">
                        <div>
                            <h2 class="font-display text-2xl font-semibold text-on-surface">Próximos Eventos</h2>
                            <p class="mt-1 text-sm text-on-surface-variant">
                                Reuniones de comunidad programadas para las próximas semanas.
                            </p>
                        </div>
                        <UiButton
                            variant="outline"
                            type="button"
                            class="h-10 rounded border-primary px-6 text-xs uppercase text-primary"
                        >
                            Gestionar calendario
                        </UiButton>
                    </div>

                    <div class="overflow-x-auto">
                        <table class="w-full min-w-[780px] text-left">
                            <thead>
                                <tr class="border-b border-outline-variant">
                                    <th class="pb-4 text-xs font-semibold uppercase text-on-surface-variant">Evento</th>
                                    <th class="pb-4 text-center text-xs font-semibold uppercase text-on-surface-variant">
                                        Fecha
                                    </th>
                                    <th class="pb-4 text-center text-xs font-semibold uppercase text-on-surface-variant">
                                        Lugar
                                    </th>
                                    <th class="pb-4 text-center text-xs font-semibold uppercase text-on-surface-variant">
                                        Estado
                                    </th>
                                    <th class="pb-4" />
                                </tr>
                            </thead>
                            <tbody class="divide-y divide-outline-variant">
                                <tr
                                    v-for="event in upcomingEvents"
                                    :key="event.name"
                                    class="group transition-colors hover:bg-surface-container-high"
                                >
                                    <td class="py-6">
                                        <div class="flex items-center gap-4">
                                            <div
                                                class="flex size-12 items-center justify-center border border-outline-variant bg-surface-container-highest"
                                            >
                                                <component :is="event.icon" class="size-5 text-primary" />
                                            </div>
                                            <div>
                                                <p class="font-semibold text-on-surface">{{ event.name }}</p>
                                                <p class="text-xs text-on-surface-variant">{{ event.ministry }}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td class="py-6 text-center text-sm font-semibold uppercase">{{ event.date }}</td>
                                    <td class="py-6 text-center text-sm">{{ event.place }}</td>
                                    <td class="py-6 text-center">
                                        <UiBadge
                                            :variant="event.confirmed ? 'sacred' : 'outline'"
                                            class="uppercase"
                                        >
                                            {{ event.status }}
                                        </UiBadge>
                                    </td>
                                    <td class="py-6 text-right">
                                        <UiButton variant="ghost" size="icon" type="button" aria-label="Más opciones">
                                            <MoreVertical class="size-5" />
                                        </UiButton>
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </UiCard>
            </section>
    </main>
</template>
