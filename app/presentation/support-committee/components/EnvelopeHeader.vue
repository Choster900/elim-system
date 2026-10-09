<script setup lang="ts">
import { CalendarDays, MapPin, UserRound } from '@lucide/vue'
import { getMeetingScopeLabel } from '~/presentation/meetings/utils/meeting-format.util'
import type { Envelope } from '../interfaces/reception.interface'
import { longDateLabel } from '../utils/reception-format.util'

defineProps<{
    envelope: Envelope
}>()
</script>

<template>
    <section
        class="flex gap-3 rounded-xl border border-outline-variant bg-surface-container-low px-4 py-3"
        aria-label="Sobre que estás recibiendo"
    >
        <span
            class="w-1 shrink-0 self-stretch rounded-full"
            :style="{ backgroundColor: envelope.meetingColor }"
        />
        <div class="min-w-0 flex-1">
            <div class="flex flex-wrap items-baseline gap-x-3 gap-y-0.5">
                <h2 class="truncate text-lg font-semibold text-on-surface">
                    {{ envelope.meetingTitle }}
                </h2>
                <span
                    class="font-mono text-[11px] uppercase tracking-wider text-on-surface-variant"
                >
                    {{ envelope.meetingCode }}
                </span>
            </div>
            <div
                class="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-on-surface-variant"
            >
                <span
                    class="inline-flex items-center gap-1.5 font-semibold capitalize text-on-surface"
                >
                    <CalendarDays class="size-3.5 text-primary" />
                    {{ longDateLabel(envelope.date) }}
                </span>
                <span v-if="envelope.leaderName" class="inline-flex items-center gap-1.5">
                    <UserRound class="size-3.5" />
                    {{ envelope.leaderName }}
                </span>
                <span class="inline-flex items-center gap-1.5">
                    <MapPin class="size-3.5" />
                    {{ getMeetingScopeLabel(envelope) }}
                </span>
            </div>
        </div>
    </section>
</template>
