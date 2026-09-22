<script setup lang="ts">
import { MapPin } from '@lucide/vue'
import type { TerritoryAssignment } from '../interfaces/territory-assignment.interface'

withDefaults(
    defineProps<{
        territory: TerritoryAssignment | null | undefined
        variant?: 'inline' | 'menu' | 'card'
    }>(),
    { variant: 'inline' },
)
</script>

<template>
    <div
        v-if="variant === 'inline'"
        class="mt-4 flex items-start gap-2 text-sm text-on-surface-variant"
    >
        <MapPin class="mt-0.5 size-4 shrink-0 text-primary" />
        <p>
            <span class="font-semibold text-on-surface">Tu asignación:</span>
            {{
                territory
                    ? `${territory.districtName} / ${territory.zoneName} / ${territory.sectorName}`
                    : 'Sin asignación territorial'
            }}
        </p>
    </div>

    <div
        v-else-if="variant === 'menu'"
        class="flex gap-2 border-t border-outline-variant px-4 py-3 text-xs"
    >
        <MapPin class="mt-0.5 size-4 shrink-0 text-primary" />
        <div class="min-w-0">
            <p class="font-semibold uppercase tracking-wider text-on-surface-variant">
                Asignación territorial
            </p>
            <p class="mt-1 leading-5 text-on-surface">
                {{
                    territory
                        ? `${territory.districtName} · ${territory.zoneName} · ${territory.sectorName}`
                        : 'Sin asignación territorial'
                }}
            </p>
        </div>
    </div>

    <section v-else class="rounded-lg border border-outline-variant bg-surface-container-low p-5">
        <div class="flex items-start gap-3">
            <span class="rounded-md bg-primary/10 p-2 text-primary">
                <MapPin class="size-5" />
            </span>
            <div>
                <p class="text-xs font-semibold uppercase tracking-[0.2em] text-primary">
                    Perfil territorial
                </p>
                <h2 class="mt-1 font-display text-xl font-semibold text-on-surface">
                    Tu asignación territorial
                </h2>
            </div>
        </div>
        <dl v-if="territory" class="mt-5 grid gap-4 sm:grid-cols-3">
            <div>
                <dt class="text-xs text-on-surface-variant">Distrito</dt>
                <dd class="mt-1 font-semibold text-on-surface">{{ territory.districtName }}</dd>
            </div>
            <div>
                <dt class="text-xs text-on-surface-variant">Zona</dt>
                <dd class="mt-1 font-semibold text-on-surface">{{ territory.zoneName }}</dd>
            </div>
            <div>
                <dt class="text-xs text-on-surface-variant">Sector</dt>
                <dd class="mt-1 font-semibold text-on-surface">{{ territory.sectorName }}</dd>
            </div>
        </dl>
        <p v-else class="mt-4 text-sm leading-6 text-on-surface-variant">
            Tu cuenta todavía no tiene un sector asignado. Solicita el cambio a un administrador.
        </p>
    </section>
</template>
