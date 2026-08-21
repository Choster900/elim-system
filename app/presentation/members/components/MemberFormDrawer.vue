<script setup lang="ts">
import { Save, UserRound, X } from '@lucide/vue'
import {
    memberGenderOptions,
    memberMaritalStatusOptions,
    memberRoleOptions,
    memberStatusOptions,
} from '../constants/member.constants'
import { useMemberCatalogsQuery } from '../composables/useMemberCatalogsQuery'
import type {
    Member,
    MemberCommunityRole,
    MemberGender,
    MemberInput,
    MemberMaritalStatus,
    MemberStatus,
} from '../interfaces/member.interface'
import { toInputDate } from '../utils/member-format.util'

interface FormState {
    code: string
    firstName: string
    middleName: string
    lastName: string
    secondLastName: string
    preferredName: string
    documentNumber: string
    birthDate: string | null
    gender: MemberGender | ''
    maritalStatus: MemberMaritalStatus
    phone: string
    alternatePhone: string
    email: string
    address: string
    country: string
    municipality: string
    department: string
    occupation: string
    status: MemberStatus
    roles: MemberCommunityRole[]
    ministriesText: string
    joinedAt: string | null
    conversionDate: string | null
    baptismDate: string | null
    district: string
    zone: string
    sector: string
    smallGroup: string
    emergencyContactName: string
    emergencyContactPhone: string
    notes: string
}

const props = defineProps<{
    open: boolean
    member: Member | null
    saving: boolean
    variant?: 'drawer' | 'page'
}>()

const isPage = computed(() => props.variant === 'page')

const emit = defineEmits<{
    close: []
    save: [payload: MemberInput]
}>()

const catalogsQuery = useMemberCatalogsQuery()
const catalogs = computed(() => catalogsQuery.data.value)
const countryOptions = computed(() => catalogs.value?.countries ?? [])
const departmentOptions = computed(() =>
    (catalogs.value?.departments ?? []).filter((item) => item.countryCode === form.country),
)
const municipalityOptions = computed(() =>
    (catalogs.value?.municipalities ?? []).filter(
        (item) => item.departmentCode === form.department,
    ),
)
const districtOptions = computed(() => catalogs.value?.districts ?? [])
const zoneOptions = computed(() =>
    (catalogs.value?.zones ?? []).filter((item) => item.districtCode === form.district),
)
const sectorOptions = computed(() =>
    (catalogs.value?.sectors ?? []).filter((item) => item.zoneCode === form.zone),
)

function emptyForm(): FormState {
    return {
        code: '',
        firstName: '',
        middleName: '',
        lastName: '',
        secondLastName: '',
        preferredName: '',
        documentNumber: '',
        birthDate: null,
        gender: '',
        maritalStatus: 'UNSPECIFIED',
        phone: '',
        alternatePhone: '',
        email: '',
        address: '',
        country: 'SV',
        municipality: '',
        department: '',
        occupation: '',
        status: 'ACTIVE',
        roles: ['MEMBER'],
        ministriesText: '',
        joinedAt: new Date().toISOString().slice(0, 10),
        conversionDate: null,
        baptismDate: null,
        district: '',
        zone: '',
        sector: '',
        smallGroup: '',
        emergencyContactName: '',
        emergencyContactPhone: '',
        notes: '',
    }
}

const form = reactive<FormState>(emptyForm())
const errors = reactive({
    firstName: false,
    lastName: false,
    gender: false,
    sector: false,
    email: false,
})

function resetForm() {
    Object.assign(form, emptyForm())
    errors.firstName = false
    errors.lastName = false
    errors.gender = false
    errors.sector = false
    errors.email = false
    if (!props.member) return

    Object.assign(form, {
        code: props.member.code,
        firstName: props.member.firstName,
        middleName: props.member.middleName ?? '',
        lastName: props.member.lastName,
        secondLastName: props.member.secondLastName ?? '',
        preferredName: props.member.preferredName ?? '',
        documentNumber: props.member.documentNumber ?? '',
        birthDate: toInputDate(props.member.birthDate),
        gender: props.member.gender,
        maritalStatus: props.member.maritalStatus,
        phone: props.member.phone ?? '',
        alternatePhone: props.member.alternatePhone ?? '',
        email: props.member.email ?? '',
        address: props.member.address ?? '',
        country: props.member.countryCode ?? 'SV',
        municipality: props.member.municipalityCode ?? '',
        department: props.member.departmentCode ?? '',
        occupation: props.member.occupation ?? '',
        status: props.member.status,
        roles: normalizeMemberRoles(props.member.roles ?? []),
        ministriesText: (props.member.ministries ?? []).join('; '),
        joinedAt: toInputDate(props.member.joinedAt),
        conversionDate: toInputDate(props.member.conversionDate),
        baptismDate: toInputDate(props.member.baptismDate),
        district: props.member.districtCode ?? '',
        zone: props.member.zoneCode ?? '',
        sector: props.member.sectorCode ?? '',
        smallGroup: props.member.smallGroup ?? '',
        emergencyContactName: props.member.emergencyContactName ?? '',
        emergencyContactPhone: props.member.emergencyContactPhone ?? '',
        notes: props.member.notes ?? '',
    })
}

watch(
    () => props.open,
    (isOpen) => isOpen && resetForm(),
    { immediate: true },
)

watch(
    () => form.country,
    (countryCode) => {
        const department = catalogs.value?.departments.find(
            (item) => item.value === form.department,
        )
        if (department && department.countryCode !== countryCode) form.department = ''
    },
)

watch(
    () => form.department,
    (departmentCode) => {
        const municipality = catalogs.value?.municipalities.find(
            (item) => item.value === form.municipality,
        )
        if (municipality && municipality.departmentCode !== departmentCode) {
            form.municipality = ''
        }
    },
)

watch(
    () => form.district,
    (districtCode) => {
        const zone = catalogs.value?.zones.find((item) => item.value === form.zone)
        if (zone && zone.districtCode !== districtCode) form.zone = ''
    },
)

watch(
    () => form.zone,
    (zoneCode) => {
        const sector = catalogs.value?.sectors.find((item) => item.value === form.sector)
        if (sector && sector.zoneCode !== zoneCode) form.sector = ''
    },
)

function optional(value: string) {
    return value.trim() || null
}

function normalizeMemberRoles(roles: Array<MemberCommunityRole | string | null | undefined>) {
    const normalized = roles
        .filter((role): role is string => typeof role === 'string' && role.trim().length > 0)
        .map((role) => {
            const exactMatch = memberRoleOptions.find((option) => option.value === role)
            if (exactMatch) return exactMatch.value

            const labelMatch = memberRoleOptions.find((option) => option.label === role)
            if (labelMatch) return labelMatch.value

            return role as MemberCommunityRole
        })

    return [...new Set(normalized)] as MemberCommunityRole[]
}

function submit() {
    errors.firstName = !form.firstName.trim()
    errors.lastName = !form.lastName.trim()
    errors.gender = !form.gender
    errors.sector = !form.sector
    errors.email = !!form.email.trim() && !/^\S+@\S+\.\S+$/.test(form.email.trim())
    if (errors.firstName || errors.lastName || errors.gender || errors.sector || errors.email) {
        return
    }

    emit('save', {
        code: form.code.trim() || undefined,
        firstName: form.firstName.trim(),
        middleName: optional(form.middleName),
        lastName: form.lastName.trim(),
        secondLastName: optional(form.secondLastName),
        preferredName: optional(form.preferredName),
        documentNumber: optional(form.documentNumber),
        birthDate: form.birthDate,
        gender: form.gender as MemberGender,
        maritalStatus: form.maritalStatus,
        phone: optional(form.phone),
        alternatePhone: optional(form.alternatePhone),
        email: optional(form.email),
        address: optional(form.address),
        country: optional(form.country),
        municipality: optional(form.municipality),
        department: optional(form.department),
        occupation: optional(form.occupation),
        status: form.status,
        roles: normalizeMemberRoles(form.roles.length ? form.roles : ['MEMBER']),
        ministries: form.ministriesText
            .split(/[;,]/)
            .map((value) => value.trim())
            .filter(Boolean),
        joinedAt: form.joinedAt,
        conversionDate: form.conversionDate,
        baptismDate: form.baptismDate,
        sector: optional(form.sector),
        smallGroup: optional(form.smallGroup),
        emergencyContactName: optional(form.emergencyContactName),
        emergencyContactPhone: optional(form.emergencyContactPhone),
        notes: optional(form.notes),
    })
}

const inputClass =
    'h-11 w-full rounded border border-outline-variant bg-surface px-3 text-sm text-on-surface outline-none placeholder:text-on-surface-variant/60 focus:border-primary focus:ring-1 focus:ring-primary'
const labelClass =
    'mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-on-surface-variant'
const currentYear = new Date().getFullYear()
</script>

<template>
    <template v-if="open">
        <div
            v-if="!isPage"
            class="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm"
            @click="emit('close')"
        />
        <component
            :is="isPage ? 'section' : 'aside'"
            :class="
                isPage
                    ? 'flex flex-col rounded-lg border border-outline-variant bg-surface-container-low shadow-sm'
                    : 'member-form-drawer fixed inset-y-0 right-0 z-[61] flex w-[760px] max-w-[96vw] flex-col bg-surface-container-low shadow-2xl'
            "
        >
            <header
                v-if="!isPage"
                class="flex items-start justify-between border-b border-outline-variant px-6 py-5 sm:px-8"
            >
                <div class="flex items-center gap-4">
                    <div
                        class="flex size-11 items-center justify-center rounded-full bg-primary/15 text-primary"
                    >
                        <UserRound class="size-5" />
                    </div>
                    <div>
                        <p class="text-[11px] font-bold uppercase tracking-[0.2em] text-primary">
                            Comunidad · Miembros
                        </p>
                        <h2 class="mt-1 font-display text-2xl font-semibold text-on-surface">
                            {{ member ? 'Editar miembro' : 'Nuevo miembro' }}
                        </h2>
                    </div>
                </div>
                <button
                    type="button"
                    class="text-on-surface-variant hover:text-on-surface"
                    aria-label="Cerrar"
                    @click="emit('close')"
                >
                    <X class="size-5" />
                </button>
            </header>

            <form
                :class="
                    isPage
                        ? 'px-5 py-6 sm:px-8 lg:px-10 lg:py-9'
                        : 'min-h-0 flex-1 overflow-y-auto px-6 py-6 sm:px-8'
                "
                @submit.prevent="submit"
            >
                <section>
                    <h3 class="font-display text-lg font-semibold text-on-surface">
                        Información personal
                    </h3>
                    <p class="mt-1 text-xs text-on-surface-variant">
                        Datos de identidad del miembro, independientes de sus credenciales de
                        acceso.
                    </p>
                    <div class="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                        <div>
                            <label :class="labelClass" for="member-code">Código</label>
                            <input
                                id="member-code"
                                v-model="form.code"
                                :class="inputClass"
                                placeholder="Automático"
                                maxlength="30"
                            />
                        </div>
                        <div>
                            <label :class="labelClass" for="member-first-name">Nombres *</label>
                            <input
                                id="member-first-name"
                                v-model="form.firstName"
                                :class="[inputClass, errors.firstName ? 'border-destructive' : '']"
                                placeholder="María Elena"
                                maxlength="100"
                            />
                            <p v-if="errors.firstName" class="mt-1 text-xs text-destructive">
                                Los nombres son obligatorios.
                            </p>
                        </div>
                        <div>
                            <label :class="labelClass" for="member-middle-name"
                                >Segundo nombre</label
                            >
                            <input
                                id="member-middle-name"
                                v-model="form.middleName"
                                :class="inputClass"
                                maxlength="100"
                            />
                        </div>
                        <div>
                            <label :class="labelClass" for="member-last-name">Apellidos *</label>
                            <input
                                id="member-last-name"
                                v-model="form.lastName"
                                :class="[inputClass, errors.lastName ? 'border-destructive' : '']"
                                placeholder="González"
                                maxlength="100"
                            />
                            <p v-if="errors.lastName" class="mt-1 text-xs text-destructive">
                                Los apellidos son obligatorios.
                            </p>
                        </div>
                        <div>
                            <label :class="labelClass" for="member-second-last-name"
                                >Segundo apellido</label
                            >
                            <input
                                id="member-second-last-name"
                                v-model="form.secondLastName"
                                :class="inputClass"
                                maxlength="100"
                            />
                        </div>
                        <div>
                            <label :class="labelClass" for="member-preferred-name"
                                >Nombre preferido</label
                            >
                            <input
                                id="member-preferred-name"
                                v-model="form.preferredName"
                                :class="inputClass"
                                placeholder="Cómo desea ser llamado/a"
                                maxlength="100"
                            />
                        </div>
                        <div>
                            <label :class="labelClass" for="member-document">Documento</label>
                            <input
                                id="member-document"
                                v-model="form.documentNumber"
                                :class="inputClass"
                                placeholder="DUI, pasaporte…"
                                maxlength="50"
                            />
                        </div>
                        <div>
                            <span :class="labelClass">Fecha de nacimiento</span>
                            <UiDatePicker
                                v-model="form.birthDate"
                                placeholder="Selecciona fecha"
                                year-select
                                :min-year="1900"
                                :max-year="currentYear"
                            />
                        </div>
                        <div>
                            <span :class="labelClass">Género *</span>
                            <UiSearchSelect
                                v-model="form.gender"
                                :options="memberGenderOptions"
                                :searchable="false"
                                placeholder="Selecciona género"
                            />
                            <p v-if="errors.gender" class="mt-1 text-xs text-destructive">
                                Selecciona femenino o masculino.
                            </p>
                        </div>
                        <div>
                            <span :class="labelClass">Estado civil</span>
                            <UiSearchSelect
                                v-model="form.maritalStatus"
                                :options="memberMaritalStatusOptions"
                                :searchable="false"
                            />
                        </div>
                        <div class="sm:col-span-2">
                            <label :class="labelClass" for="member-occupation">Ocupación</label>
                            <input
                                id="member-occupation"
                                v-model="form.occupation"
                                :class="inputClass"
                                placeholder="Profesión u oficio"
                                maxlength="150"
                            />
                        </div>
                    </div>
                </section>

                <UiSeparator class="my-7" />

                <section>
                    <h3 class="font-display text-lg font-semibold text-on-surface">
                        Vida comunitaria y ministerial
                    </h3>
                    <div class="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                        <div>
                            <span :class="labelClass">Estado</span>
                            <UiSearchSelect
                                v-model="form.status"
                                :options="memberStatusOptions"
                                :searchable="false"
                            />
                        </div>
                        <div class="sm:col-span-2">
                            <span :class="labelClass">Roles comunitarios</span>
                            <UiSearchSelect
                                v-model="form.roles"
                                :options="memberRoleOptions"
                                multiple
                                :max-items="5"
                                placeholder="Selecciona uno o más roles"
                            />
                        </div>
                        <div class="sm:col-span-2 lg:col-span-3">
                            <label :class="labelClass" for="member-ministries">Ministerios</label>
                            <input
                                id="member-ministries"
                                v-model="form.ministriesText"
                                :class="inputClass"
                                placeholder="Jóvenes; Alabanza; Hospitalidad"
                            />
                            <p class="mt-1 text-[11px] text-on-surface-variant">
                                Separa múltiples ministerios con punto y coma.
                            </p>
                        </div>
                        <div>
                            <span :class="labelClass">Fecha de ingreso</span>
                            <UiDatePicker v-model="form.joinedAt" placeholder="Selecciona fecha" />
                        </div>
                        <div>
                            <span :class="labelClass">Fecha de conversión</span>
                            <UiDatePicker
                                v-model="form.conversionDate"
                                placeholder="Selecciona fecha"
                            />
                        </div>
                        <div>
                            <span :class="labelClass">Fecha de bautismo</span>
                            <UiDatePicker
                                v-model="form.baptismDate"
                                placeholder="Selecciona fecha"
                            />
                        </div>
                        <div class="sm:col-span-2 lg:col-span-3">
                            <div class="rounded border border-primary/20 bg-primary/5 px-4 py-3">
                                <p class="text-xs font-semibold text-on-surface">
                                    Asignación territorial
                                </p>
                                <p class="mt-1 text-xs leading-relaxed text-on-surface-variant">
                                    Distrito y zona solo ayudan a filtrar. El miembro queda asociado
                                    únicamente al sector seleccionado.
                                </p>
                            </div>
                        </div>
                        <div>
                            <span :class="labelClass">Distrito</span>
                            <UiSearchSelect
                                v-model="form.district"
                                :options="districtOptions"
                                clearable
                                placeholder="Selecciona distrito"
                                search-placeholder="Buscar distrito..."
                            />
                        </div>
                        <div>
                            <span :class="labelClass">Zona</span>
                            <UiSearchSelect
                                v-model="form.zone"
                                :options="zoneOptions"
                                :disabled="!form.district"
                                clearable
                                placeholder="Selecciona zona"
                                search-placeholder="Buscar zona..."
                                empty-message="Este distrito no tiene zonas activas"
                            />
                        </div>
                        <div>
                            <span :class="labelClass">Sector *</span>
                            <UiSearchSelect
                                v-model="form.sector"
                                :options="sectorOptions"
                                :disabled="!form.zone"
                                :invalid="errors.sector"
                                clearable
                                placeholder="Selecciona sector"
                                search-placeholder="Buscar sector..."
                                empty-message="Esta zona no tiene sectores activos"
                            />
                            <p v-if="errors.sector" class="mt-1 text-xs text-destructive">
                                Selecciona el sector al que pertenece el miembro.
                            </p>
                        </div>
                        <div class="sm:col-span-2 lg:col-span-3">
                            <label :class="labelClass" for="member-small-group"
                                >Grupo pequeño / célula</label
                            >
                            <input
                                id="member-small-group"
                                v-model="form.smallGroup"
                                :class="inputClass"
                                placeholder="Nombre del grupo al que pertenece"
                            />
                        </div>
                    </div>
                </section>

                <UiSeparator class="my-7" />

                <section>
                    <h3 class="font-display text-lg font-semibold text-on-surface">
                        Contacto y residencia
                    </h3>
                    <div class="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                        <div>
                            <label :class="labelClass" for="member-phone">Teléfono</label>
                            <input
                                id="member-phone"
                                v-model="form.phone"
                                type="tel"
                                :class="inputClass"
                                placeholder="+503 7000-0000"
                            />
                        </div>
                        <div>
                            <label :class="labelClass" for="member-alt-phone"
                                >Teléfono alterno</label
                            >
                            <input
                                id="member-alt-phone"
                                v-model="form.alternatePhone"
                                type="tel"
                                :class="inputClass"
                            />
                        </div>
                        <div>
                            <label :class="labelClass" for="member-email">Correo</label>
                            <input
                                id="member-email"
                                v-model="form.email"
                                type="email"
                                :class="[inputClass, errors.email ? 'border-destructive' : '']"
                                placeholder="persona@correo.com"
                            />
                            <p v-if="errors.email" class="mt-1 text-xs text-destructive">
                                Ingresa un correo válido.
                            </p>
                        </div>
                        <div>
                            <span :class="labelClass">País</span>
                            <UiSearchSelect
                                v-model="form.country"
                                :options="countryOptions"
                                clearable
                                placeholder="Selecciona país"
                                search-placeholder="Buscar país..."
                            />
                        </div>
                        <div>
                            <span :class="labelClass">Departamento</span>
                            <UiSearchSelect
                                v-model="form.department"
                                :options="departmentOptions"
                                :disabled="!form.country"
                                clearable
                                placeholder="Selecciona departamento"
                                search-placeholder="Buscar departamento..."
                            />
                        </div>
                        <div>
                            <span :class="labelClass">Municipio</span>
                            <UiSearchSelect
                                v-model="form.municipality"
                                :options="municipalityOptions"
                                :disabled="!form.department"
                                clearable
                                placeholder="Selecciona municipio"
                                search-placeholder="Buscar municipio..."
                                empty-message="Este departamento no tiene municipios configurados"
                            />
                        </div>
                        <div class="sm:col-span-2 lg:col-span-3">
                            <label :class="labelClass" for="member-address">Dirección</label>
                            <textarea
                                id="member-address"
                                v-model="form.address"
                                rows="2"
                                :class="[inputClass, 'h-auto py-2.5 resize-none']"
                                placeholder="Dirección residencial"
                            />
                        </div>
                    </div>
                </section>

                <UiSeparator class="my-7" />

                <section>
                    <h3 class="font-display text-lg font-semibold text-on-surface">
                        Emergencia y observaciones
                    </h3>
                    <div class="mt-4 grid gap-4 sm:grid-cols-2">
                        <div>
                            <label :class="labelClass" for="member-emergency-name"
                                >Contacto de emergencia</label
                            >
                            <input
                                id="member-emergency-name"
                                v-model="form.emergencyContactName"
                                :class="inputClass"
                            />
                        </div>
                        <div>
                            <label :class="labelClass" for="member-emergency-phone"
                                >Teléfono de emergencia</label
                            >
                            <input
                                id="member-emergency-phone"
                                v-model="form.emergencyContactPhone"
                                type="tel"
                                :class="inputClass"
                            />
                        </div>
                        <div class="sm:col-span-2">
                            <label :class="labelClass" for="member-notes"
                                >Notas pastorales / administrativas</label
                            >
                            <textarea
                                id="member-notes"
                                v-model="form.notes"
                                rows="4"
                                :class="[inputClass, 'h-auto py-2.5 resize-none']"
                                placeholder="Información relevante para el seguimiento del miembro"
                            />
                        </div>
                    </div>
                </section>
            </form>

            <footer
                class="flex flex-col-reverse gap-3 border-t border-outline-variant bg-surface px-6 py-4 sm:flex-row sm:justify-end sm:px-8"
            >
                <UiButton
                    variant="outline"
                    type="button"
                    class="sm:w-32"
                    :disabled="saving"
                    @click="emit('close')"
                >
                    Cancelar
                </UiButton>
                <UiButton type="button" class="sm:min-w-48" :loading="saving" @click="submit">
                    <Save class="size-4" />
                    {{ member ? 'Guardar cambios' : 'Crear miembro' }}
                </UiButton>
            </footer>
        </component>
    </template>
</template>

<style scoped>
.member-form-drawer {
    animation: member-form-in 0.25s ease;
}

@keyframes member-form-in {
    from {
        transform: translateX(28px);
        opacity: 0;
    }
    to {
        transform: translateX(0);
        opacity: 1;
    }
}
</style>
