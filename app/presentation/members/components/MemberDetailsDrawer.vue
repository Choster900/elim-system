<script setup lang="ts">
import { CalendarDays, Mail, MapPin, Phone, ShieldCheck, UserRound, X } from '@lucide/vue'
import type { Member } from '../interfaces/member.interface'
import {
    getMemberAge,
    getMemberFullName,
    getMemberGenderLabel,
    getMemberMaritalStatusLabel,
    getMemberRoleLabel,
    getMemberStatusLabel,
} from '../utils/member-format.util'

const props = defineProps<{
    open: boolean
    member: Member | null
}>()
const emit = defineEmits<{
    close: []
    edit: [member: Member]
}>()

function formatDate(value: string | null) {
    if (!value) return 'No registrada'
    return new Intl.DateTimeFormat('es-SV', { dateStyle: 'medium' }).format(
        new Date(`${value.slice(0, 10)}T00:00:00`),
    )
}

const age = computed(() => (props.member ? getMemberAge(props.member.birthDate) : null))
</script>

<template>
    <template v-if="open && member">
        <div class="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm" @click="emit('close')" />
        <aside
            class="fixed inset-y-0 right-0 z-[61] flex w-[520px] max-w-[96vw] flex-col bg-surface-container-low shadow-2xl"
        >
            <header class="border-b border-outline-variant px-7 py-6">
                <div class="flex items-start justify-between gap-4">
                    <div class="flex min-w-0 items-center gap-4">
                        <div
                            class="flex size-14 shrink-0 items-center justify-center rounded-full bg-primary/15 font-display text-lg font-semibold text-primary"
                        >
                            {{ member.firstName.charAt(0) }}{{ member.lastName.charAt(0) }}
                        </div>
                        <div class="min-w-0">
                            <p
                                class="text-[11px] font-semibold uppercase tracking-wider text-primary"
                            >
                                {{ member.code }}
                            </p>
                            <h2
                                class="truncate font-display text-2xl font-semibold text-on-surface"
                            >
                                {{ getMemberFullName(member) }}
                            </h2>
                            <p v-if="member.preferredName" class="text-sm text-on-surface-variant">
                                Conocido/a como {{ member.preferredName }}
                            </p>
                        </div>
                    </div>
                    <button
                        type="button"
                        aria-label="Cerrar"
                        class="text-on-surface-variant hover:text-on-surface"
                        @click="emit('close')"
                    >
                        <X class="size-5" />
                    </button>
                </div>
                <div class="mt-5 flex flex-wrap gap-2">
                    <span
                        class="rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-[11px] font-semibold text-primary"
                        >{{ getMemberStatusLabel(member.status) }}</span
                    >
                    <span
                        v-for="role in member.roles"
                        :key="role"
                        class="rounded-full border border-outline-variant bg-surface-container px-3 py-1 text-[11px] text-on-surface-variant"
                        >{{ getMemberRoleLabel(role) }}</span
                    >
                </div>
            </header>

            <div class="min-h-0 flex-1 space-y-7 overflow-y-auto px-7 py-6">
                <section>
                    <h3
                        class="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-on-surface"
                    >
                        <UserRound class="size-4 text-primary" /> Información personal
                    </h3>
                    <dl class="grid grid-cols-2 gap-x-5 gap-y-4 text-sm">
                        <div>
                            <dt class="text-xs text-on-surface-variant">Documento</dt>
                            <dd class="mt-1 text-on-surface">
                                {{ member.documentNumber || 'No registrado' }}
                            </dd>
                        </div>
                        <div>
                            <dt class="text-xs text-on-surface-variant">Nacimiento</dt>
                            <dd class="mt-1 text-on-surface">
                                {{ formatDate(member.birthDate)
                                }}<span v-if="age !== null"> · {{ age }} años</span>
                            </dd>
                        </div>
                        <div>
                            <dt class="text-xs text-on-surface-variant">Género</dt>
                            <dd class="mt-1 text-on-surface">
                                {{ getMemberGenderLabel(member.gender) }}
                            </dd>
                        </div>
                        <div>
                            <dt class="text-xs text-on-surface-variant">Estado civil</dt>
                            <dd class="mt-1 text-on-surface">
                                {{ getMemberMaritalStatusLabel(member.maritalStatus) }}
                            </dd>
                        </div>
                        <div class="col-span-2">
                            <dt class="text-xs text-on-surface-variant">Ocupación</dt>
                            <dd class="mt-1 text-on-surface">
                                {{ member.occupation || 'No registrada' }}
                            </dd>
                        </div>
                    </dl>
                </section>

                <section>
                    <h3
                        class="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-on-surface"
                    >
                        <Phone class="size-4 text-primary" /> Contacto
                    </h3>
                    <div class="space-y-3 text-sm text-on-surface">
                        <p class="flex items-center gap-3">
                            <Phone class="size-4 text-on-surface-variant" />
                            {{ member.phone || 'Sin teléfono'
                            }}<span v-if="member.alternatePhone" class="text-on-surface-variant"
                                >· {{ member.alternatePhone }}</span
                            >
                        </p>
                        <p class="flex items-center gap-3">
                            <Mail class="size-4 text-on-surface-variant" />
                            {{ member.email || 'Sin correo' }}
                        </p>
                        <p class="flex items-start gap-3">
                            <MapPin class="mt-0.5 size-4 shrink-0 text-on-surface-variant" />
                            {{
                                [
                                    member.address,
                                    member.municipality,
                                    member.department,
                                    member.country,
                                ]
                                    .filter(Boolean)
                                    .join(', ') || 'Sin dirección'
                            }}
                        </p>
                    </div>
                </section>

                <section>
                    <h3
                        class="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-on-surface"
                    >
                        <ShieldCheck class="size-4 text-primary" /> Comunidad
                    </h3>
                    <dl class="grid grid-cols-2 gap-x-5 gap-y-4 text-sm">
                        <div>
                            <dt class="text-xs text-on-surface-variant">Ingreso</dt>
                            <dd class="mt-1 text-on-surface">
                                {{ formatDate(member.joinedAt) }}
                            </dd>
                        </div>
                        <div>
                            <dt class="text-xs text-on-surface-variant">Bautismo</dt>
                            <dd class="mt-1 text-on-surface">
                                {{ formatDate(member.baptismDate) }}
                            </dd>
                        </div>
                        <div>
                            <dt class="text-xs text-on-surface-variant">Conversión</dt>
                            <dd class="mt-1 text-on-surface">
                                {{ formatDate(member.conversionDate) }}
                            </dd>
                        </div>
                        <div>
                            <dt class="text-xs text-on-surface-variant">Grupo pequeño</dt>
                            <dd class="mt-1 text-on-surface">
                                {{ member.smallGroup || 'No asignado' }}
                            </dd>
                        </div>
                        <div class="col-span-2">
                            <dt class="text-xs text-on-surface-variant">Territorio</dt>
                            <dd class="mt-1 text-on-surface">
                                {{
                                    [member.district, member.zone, member.sector]
                                        .filter(Boolean)
                                        .join(' · ') || 'No asignado'
                                }}
                            </dd>
                        </div>
                        <div class="col-span-2">
                            <dt class="text-xs text-on-surface-variant">Ministerios</dt>
                            <dd class="mt-1 text-on-surface">
                                {{ (member.ministries ?? []).join(', ') || 'Ninguno registrado' }}
                            </dd>
                        </div>
                    </dl>
                </section>

                <section
                    v-if="
                        member.emergencyContactName || member.emergencyContactPhone || member.notes
                    "
                >
                    <h3
                        class="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-on-surface"
                    >
                        <CalendarDays class="size-4 text-primary" /> Seguimiento
                    </h3>
                    <p
                        v-if="member.emergencyContactName || member.emergencyContactPhone"
                        class="text-sm text-on-surface"
                    >
                        Emergencia: {{ member.emergencyContactName || 'Sin nombre' }} ·
                        {{ member.emergencyContactPhone || 'Sin teléfono' }}
                    </p>
                    <p
                        v-if="member.notes"
                        class="mt-3 whitespace-pre-line rounded border border-outline-variant bg-surface-container p-4 text-sm leading-relaxed text-on-surface-variant"
                    >
                        {{ member.notes }}
                    </p>
                </section>
            </div>

            <footer class="flex gap-3 border-t border-outline-variant bg-surface px-7 py-4">
                <UiButton variant="outline" type="button" class="flex-1" @click="emit('close')">
                    Cerrar
                </UiButton>
                <UiButton type="button" class="flex-1" @click="emit('edit', member)">
                    Editar miembro
                </UiButton>
            </footer>
        </aside>
    </template>
</template>
