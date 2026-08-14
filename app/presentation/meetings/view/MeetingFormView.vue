<script setup lang="ts">
import { ArrowLeft, CalendarDays, Info, MapPin, MapPinned, Save, Settings2, Trash2, Users } from '@lucide/vue'
import { useAppToast } from '~/presentation/shared/composables/useAppToast'
import {
  type LatLng,
  type MockMeeting,
  colorPalette,
  frequencyOptions,
  getMockMeetings,
  mockMeetingTypes,
  mockSectors,
  mockSupervisors,
  statusOptions,
} from '~/mock/meetings.mock'
import { ELSALVADOR_CENTER, mockTerritorySectors } from '~/mock/territories.mock'

defineOptions({ name: 'MeetingFormView' })

const route = useRoute()
const toast = useAppToast()

const STORAGE_KEY = 'meetings-catalog-v2'

const meetingId = computed(() => (route.params.id as string | undefined) ?? null)
const isEditing = computed(() => !!meetingId.value)

useHead({
  title: () => (isEditing.value ? 'Editar reunión · Sistema' : 'Nueva reunión · Sistema'),
})

function loadMeetings(): MockMeeting[] {
  if (!import.meta.client) return getMockMeetings()
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? (JSON.parse(raw) as MockMeeting[]) : getMockMeetings()
  }
  catch {
    return getMockMeetings()
  }
}

function emptyForm(): Omit<MockMeeting, 'id' | 'createdAt'> {
  return {
    title: '',
    description: '',
    typeId: mockMeetingTypes[0]!.id,
    sectorId: mockSectors[0]!.id,
    supervisorId: mockSupervisors[0]!.id,
    coSupervisorIds: [],
    date: new Date().toISOString().slice(0, 10),
    startTime: '19:00',
    endTime: '20:30',
    location: '',
    frequency: 'unica',
    expectedAttendees: 0,
    status: 'programada',
    isPublic: false,
    notes: '',
    color: colorPalette[0]!,
    position: null,
  }
}

const form = reactive(emptyForm())
const notFound = ref(false)

// ===== Map location picker (Leaflet) =====
const mapEl = ref<HTMLElement | null>(null)
let map: import('leaflet').Map | null = null
let marker: import('leaflet').Marker | null = null
let L: typeof import('leaflet') | null = null

function sectorCentroid(sectorId: string): LatLng | null {
  const polygon = mockTerritorySectors.find(s => s.id === sectorId)?.polygon
  if (!polygon || polygon.length === 0) return null
  const sum = polygon.reduce((acc, [lat, lng]) => [acc[0] + lat, acc[1] + lng], [0, 0])
  return [sum[0]! / polygon.length, sum[1]! / polygon.length]
}

function markerIcon() {
  return L!.divIcon({
    className: 'meeting-pin',
    html: `<span style="display:block;width:20px;height:20px;border-radius:50%;background:${form.color};border:2px solid #fff;box-shadow:0 0 0 4px rgba(0,0,0,.28)"></span>`,
    iconSize: [20, 20],
    iconAnchor: [10, 10],
  })
}

function syncMarkerFromForm() {
  if (!map || !L) return
  if (!form.position) {
    if (marker) {
      marker.remove()
      marker = null
    }
    return
  }
  const latlng = form.position
  if (marker) {
    marker.setLatLng(latlng)
    marker.setIcon(markerIcon())
  }
  else {
    marker = L.marker(latlng, { draggable: true, icon: markerIcon() }).addTo(map)
    marker.on('dragend', () => {
      const ll = marker!.getLatLng()
      form.position = [Number(ll.lat.toFixed(6)), Number(ll.lng.toFixed(6))]
    })
  }
}

function setPosition(lat: number, lng: number) {
  form.position = [Number(lat.toFixed(6)), Number(lng.toFixed(6))]
  syncMarkerFromForm()
}

function clearPosition() {
  form.position = null
  syncMarkerFromForm()
}

function centerOnSector() {
  if (!map) return
  const c = sectorCentroid(form.sectorId)
  if (c) map.setView(c, 13)
}

async function initMap() {
  if (!import.meta.client || notFound.value) return
  if (!L) L = (await import('leaflet')).default ?? (await import('leaflet'))
  if (!mapEl.value || !L) return

  const center = form.position ?? sectorCentroid(form.sectorId) ?? ELSALVADOR_CENTER
  const zoom = form.position ? 15 : sectorCentroid(form.sectorId) ? 13 : 9

  map = L.map(mapEl.value, { zoomControl: true, attributionControl: false, scrollWheelZoom: false })
  map.zoomControl.setPosition('topright')
  L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
    subdomains: 'abcd',
    maxZoom: 20,
  }).addTo(map)
  map.on('click', e => setPosition(e.latlng.lat, e.latlng.lng))
  map.setView(center, zoom)
  syncMarkerFromForm()
  const current = map
  setTimeout(() => current?.invalidateSize(), 80)
}

// Re-center to the chosen sector while no explicit pin has been dropped yet.
watch(
  () => form.sectorId,
  () => {
    if (!form.position) centerOnSector()
  },
)
// Keep the pin colour in sync with the selected label colour.
watch(
  () => form.color,
  () => {
    if (marker) marker.setIcon(markerIcon())
  },
)

onMounted(async () => {
  if (isEditing.value) {
    const meetings = loadMeetings()
    const existing = meetings.find(m => m.id === meetingId.value)
    if (!existing) {
      notFound.value = true
      return
    }
    Object.assign(form, {
      title: existing.title,
      description: existing.description,
      typeId: existing.typeId,
      sectorId: existing.sectorId,
      supervisorId: existing.supervisorId,
      coSupervisorIds: [...existing.coSupervisorIds],
      date: existing.date,
      startTime: existing.startTime,
      endTime: existing.endTime,
      location: existing.location,
      frequency: existing.frequency,
      expectedAttendees: existing.expectedAttendees,
      status: existing.status,
      isPublic: existing.isPublic,
      notes: existing.notes,
      color: existing.color,
      position: existing.position ?? null,
    })
  }
  await nextTick()
  await initMap()
})

onBeforeUnmount(() => {
  if (map) {
    map.remove()
    map = null
  }
})

const formErrors = reactive<Record<string, string | null>>({
  title: null,
  date: null,
  startTime: null,
  endTime: null,
  sectorId: null,
  supervisorId: null,
})

function clearFormErrors() {
  for (const key of Object.keys(formErrors)) formErrors[key] = null
}

function validateForm() {
  clearFormErrors()
  let ok = true
  if (!form.title.trim()) {
    formErrors.title = 'El título es obligatorio'
    ok = false
  }
  if (!form.date) {
    formErrors.date = 'Selecciona una fecha'
    ok = false
  }
  if (!form.startTime) {
    formErrors.startTime = 'Hora de inicio obligatoria'
    ok = false
  }
  if (!form.endTime) {
    formErrors.endTime = 'Hora de fin obligatoria'
    ok = false
  }
  if (form.startTime && form.endTime && form.startTime >= form.endTime) {
    formErrors.endTime = 'Debe ser posterior al inicio'
    ok = false
  }
  if (!form.sectorId) {
    formErrors.sectorId = 'Asigna un sector'
    ok = false
  }
  if (!form.supervisorId) {
    formErrors.supervisorId = 'Asigna un supervisor'
    ok = false
  }
  return ok
}

const isSaving = ref(false)

async function saveMeeting() {
  if (!validateForm()) {
    toast.error('Revisa los campos marcados en rojo')
    return
  }

  isSaving.value = true
  try {
    const meetings = loadMeetings()
    if (isEditing.value) {
      const idx = meetings.findIndex(m => m.id === meetingId.value)
      if (idx === -1) {
        toast.error('Reunión no encontrada')
        return
      }
      meetings[idx] = { ...meetings[idx]!, ...form }
      toast.success('Reunión actualizada')
    }
    else {
      meetings.unshift({
        ...form,
        id: crypto.randomUUID(),
        createdAt: new Date().toISOString(),
      })
      toast.success('Reunión creada')
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(meetings))
    await navigateTo('/catalogos/reuniones')
  }
  finally {
    isSaving.value = false
  }
}

function cancel() {
  navigateTo('/catalogos/reuniones')
}

const selectedType = computed(() => mockMeetingTypes.find(t => t.id === form.typeId))
const selectedSector = computed(() => mockSectors.find(s => s.id === form.sectorId))
const selectedSupervisor = computed(() => mockSupervisors.find(s => s.id === form.supervisorId))

function formatPreviewDate(iso: string) {
  if (!iso) return '—'
  return new Date(iso + 'T00:00:00').toLocaleDateString('es-SV', {
    weekday: 'long',
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  })
}

const inputClass
  = 'h-11 w-full rounded border border-outline-variant bg-surface-container px-3 text-sm text-on-surface placeholder:text-on-surface-variant/60 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary'
const labelClass = 'text-[11px] font-semibold uppercase tracking-wider text-on-surface-variant'
</script>

<template>
  <div class="pb-24 pt-20">
    <div class="sticky top-16 z-30 border-b border-outline-variant bg-surface/80 backdrop-blur-md">
      <div class="mx-auto flex w-full max-w-system items-center justify-between gap-4 px-6 py-4 lg:px-10">
        <div class="flex items-center gap-4">
          <NuxtLink
            to="/catalogos/reuniones"
            class="flex size-9 items-center justify-center rounded-full border border-outline-variant text-on-surface-variant transition-colors hover:border-primary hover:text-primary"
            aria-label="Volver"
          >
            <ArrowLeft class="size-4" />
          </NuxtLink>
          <div>
            <p class="text-[11px] font-semibold uppercase tracking-[0.3em] text-on-surface-variant">
              Catálogos · Reuniones
            </p>
            <h1 class="font-display text-2xl font-semibold text-on-surface md:text-3xl">
              {{ isEditing ? 'Editar reunión' : 'Nueva reunión' }}
            </h1>
          </div>
        </div>
        <div class="flex items-center gap-2">
          <UiButton
            variant="outline"
            type="button"
            class="h-10 rounded px-4 text-xs uppercase tracking-wider"
            @click="cancel"
          >
            Cancelar
          </UiButton>
          <UiButton
            type="button"
            class="h-10 rounded px-5 text-xs uppercase tracking-wider"
            :loading="isSaving"
            :disabled="isSaving"
            @click="saveMeeting"
          >
            <Save class="mr-2 size-4" />
            {{ isEditing ? 'Guardar cambios' : 'Crear reunión' }}
          </UiButton>
        </div>
      </div>
    </div>

    <main class="mx-auto w-full max-w-system px-6 py-8 lg:px-10">
      <div
        v-if="notFound"
        class="mx-auto max-w-md rounded-lg border border-destructive/30 bg-destructive/10 p-6 text-center"
      >
        <p class="font-display text-lg font-semibold text-destructive">
          Reunión no encontrada
        </p>
        <p class="mt-2 text-sm text-on-surface-variant">
          La reunión que intentas editar ya no existe en el catálogo.
        </p>
        <NuxtLink
          to="/catalogos/reuniones"
          class="mt-4 inline-block text-xs font-semibold uppercase tracking-wider text-primary hover:underline"
        >
          Volver al listado
        </NuxtLink>
      </div>

      <form
        v-else
        class="grid gap-6 lg:grid-cols-[1fr_320px]"
        novalidate
        @submit.prevent="saveMeeting"
      >
        <div class="space-y-6">
          <UiCard class="p-6">
            <div class="mb-5 flex items-center gap-3">
              <Info class="size-5 text-primary" />
              <div>
                <h2 class="font-display text-lg font-semibold text-on-surface">
                  Información general
                </h2>
                <p class="text-xs text-on-surface-variant">
                  Identifica la reunión y su propósito.
                </p>
              </div>
            </div>

            <div class="grid gap-4 md:grid-cols-[1fr_240px]">
              <div>
                <label
                  :class="labelClass"
                  for="meeting-title"
                >Título *</label>
                <input
                  id="meeting-title"
                  v-model="form.title"
                  type="text"
                  placeholder="Ej. Reunión de líderes de jóvenes"
                  :class="[inputClass, 'mt-1', formErrors.title ? 'border-destructive focus:border-destructive focus:ring-destructive' : '']"
                >
                <p
                  v-if="formErrors.title"
                  class="mt-1 text-xs text-destructive"
                >
                  {{ formErrors.title }}
                </p>
              </div>
              <div>
                <label :class="labelClass">Tipo</label>
                <div class="mt-1">
                  <UiSearchSelect
                    v-model="form.typeId"
                    :options="mockMeetingTypes"
                    option-value="id"
                    option-label="label"
                    placeholder="Selecciona un tipo"
                    search-placeholder="Buscar tipo..."
                  />
                </div>
              </div>
            </div>

            <div class="mt-4">
              <label
                :class="labelClass"
                for="meeting-desc"
              >Descripción</label>
              <textarea
                id="meeting-desc"
                v-model="form.description"
                rows="3"
                placeholder="Propósito, agenda principal, o cualquier contexto relevante."
                :class="['mt-1', inputClass, 'h-auto resize-none py-2 leading-relaxed']"
              />
            </div>
          </UiCard>

          <UiCard class="p-6">
            <div class="mb-5 flex items-center gap-3">
              <CalendarDays class="size-5 text-primary" />
              <div>
                <h2 class="font-display text-lg font-semibold text-on-surface">
                  Programación
                </h2>
                <p class="text-xs text-on-surface-variant">
                  Fecha, horario y recurrencia.
                </p>
              </div>
            </div>

            <div class="grid gap-4 md:grid-cols-3">
              <div>
                <label :class="labelClass">Fecha *</label>
                <div class="mt-1">
                  <UiDatePicker
                    v-model="form.date"
                    mode="single"
                    placeholder="Selecciona fecha"
                    :invalid="!!formErrors.date"
                  />
                </div>
                <p
                  v-if="formErrors.date"
                  class="mt-1 text-xs text-destructive"
                >
                  {{ formErrors.date }}
                </p>
              </div>
              <div>
                <label
                  :class="labelClass"
                  for="meeting-start"
                >Inicio *</label>
                <input
                  id="meeting-start"
                  v-model="form.startTime"
                  type="time"
                  :class="[inputClass, 'mt-1', formErrors.startTime ? 'border-destructive' : '']"
                >
                <p
                  v-if="formErrors.startTime"
                  class="mt-1 text-xs text-destructive"
                >
                  {{ formErrors.startTime }}
                </p>
              </div>
              <div>
                <label
                  :class="labelClass"
                  for="meeting-end"
                >Fin *</label>
                <input
                  id="meeting-end"
                  v-model="form.endTime"
                  type="time"
                  :class="[inputClass, 'mt-1', formErrors.endTime ? 'border-destructive' : '']"
                >
                <p
                  v-if="formErrors.endTime"
                  class="mt-1 text-xs text-destructive"
                >
                  {{ formErrors.endTime }}
                </p>
              </div>
            </div>

            <div class="mt-4 grid gap-4 md:grid-cols-2">
              <div>
                <label
                  :class="labelClass"
                  for="meeting-location"
                >Ubicación</label>
                <div class="relative mt-1">
                  <MapPinned class="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-on-surface-variant" />
                  <input
                    id="meeting-location"
                    v-model="form.location"
                    type="text"
                    placeholder="Salón principal, casa de familia, dirección..."
                    :class="[inputClass, 'pl-9']"
                  >
                </div>
              </div>
              <div>
                <label :class="labelClass">Frecuencia</label>
                <div class="mt-1">
                  <UiSearchSelect
                    v-model="form.frequency"
                    :options="frequencyOptions"
                    placeholder="Selecciona frecuencia"
                    :searchable="false"
                  />
                </div>
              </div>
            </div>
          </UiCard>

          <UiCard class="p-6">
            <div class="mb-5 flex items-center gap-3">
              <MapPin class="size-5 text-primary" />
              <div>
                <h2 class="font-display text-lg font-semibold text-on-surface">
                  Ubicación en el mapa
                </h2>
                <p class="text-xs text-on-surface-variant">
                  Marca el punto exacto donde se realiza la reunión.
                </p>
              </div>
            </div>

            <div
              ref="mapEl"
              class="meeting-map h-72 w-full overflow-hidden rounded border border-outline-variant bg-surface-container"
            />

            <div class="mt-3 flex flex-wrap items-center justify-between gap-3">
              <p
                v-if="form.position"
                class="text-xs text-on-surface"
              >
                <span class="font-semibold text-on-surface-variant">Coordenadas:</span>
                {{ form.position[0].toFixed(5) }}, {{ form.position[1].toFixed(5) }}
              </p>
              <p
                v-else
                class="text-xs text-on-surface-variant"
              >
                Haz clic en el mapa para colocar el punto. Luego puedes arrastrarlo para ajustarlo.
              </p>
              <button
                v-if="form.position"
                type="button"
                class="inline-flex items-center gap-1.5 rounded border border-outline-variant px-3 py-1.5 text-xs font-semibold uppercase tracking-wider text-on-surface-variant transition-colors hover:border-destructive hover:text-destructive"
                @click="clearPosition"
              >
                <Trash2 class="size-3.5" />
                Quitar
              </button>
            </div>
          </UiCard>

          <UiCard class="p-6">
            <div class="mb-5 flex items-center gap-3">
              <Users class="size-5 text-primary" />
              <div>
                <h2 class="font-display text-lg font-semibold text-on-surface">
                  Asignación
                </h2>
                <p class="text-xs text-on-surface-variant">
                  Responsables y sector ministerial.
                </p>
              </div>
            </div>

            <div class="grid gap-4 md:grid-cols-3">
              <div>
                <label :class="labelClass">Sector *</label>
                <div class="mt-1">
                  <UiSearchSelect
                    v-model="form.sectorId"
                    :options="mockSectors"
                    option-value="id"
                    option-label="name"
                    placeholder="Selecciona un sector"
                    search-placeholder="Buscar sector..."
                    :invalid="!!formErrors.sectorId"
                  />
                </div>
                <p
                  v-if="formErrors.sectorId"
                  class="mt-1 text-xs text-destructive"
                >
                  {{ formErrors.sectorId }}
                </p>
              </div>
              <div>
                <label :class="labelClass">Supervisor *</label>
                <div class="mt-1">
                  <UiSearchSelect
                    v-model="form.supervisorId"
                    :options="mockSupervisors"
                    option-value="id"
                    option-label="name"
                    option-description="role"
                    placeholder="Selecciona un supervisor"
                    search-placeholder="Buscar por nombre o rol..."
                    :invalid="!!formErrors.supervisorId"
                  />
                </div>
                <p
                  v-if="formErrors.supervisorId"
                  class="mt-1 text-xs text-destructive"
                >
                  {{ formErrors.supervisorId }}
                </p>
              </div>
              <div>
                <label :class="labelClass">Co-supervisores</label>
                <div class="mt-1">
                  <UiSearchSelect
                    v-model="form.coSupervisorIds"
                    :options="mockSupervisors.filter(x => x.id !== form.supervisorId)"
                    option-value="id"
                    option-label="name"
                    option-description="role"
                    multiple
                    clearable
                    placeholder="Añade uno o varios"
                    search-placeholder="Buscar co-supervisor..."
                  />
                </div>
              </div>
            </div>
          </UiCard>

          <UiCard class="p-6">
            <div class="mb-5 flex items-center gap-3">
              <Settings2 class="size-5 text-primary" />
              <div>
                <h2 class="font-display text-lg font-semibold text-on-surface">
                  Detalles
                </h2>
                <p class="text-xs text-on-surface-variant">
                  Estado, asistencia y configuración.
                </p>
              </div>
            </div>

            <div class="grid gap-4 md:grid-cols-3">
              <div>
                <label
                  :class="labelClass"
                  for="meeting-attendees"
                >Asistentes esperados</label>
                <input
                  id="meeting-attendees"
                  v-model.number="form.expectedAttendees"
                  type="number"
                  min="0"
                  :class="[inputClass, 'mt-1']"
                >
              </div>
              <div>
                <label :class="labelClass">Estado</label>
                <div class="mt-1">
                  <UiSearchSelect
                    v-model="form.status"
                    :options="statusOptions"
                    placeholder="Selecciona estado"
                    :searchable="false"
                  />
                </div>
              </div>
              <div>
                <span :class="labelClass">Color de etiqueta</span>
                <div class="mt-2 flex flex-wrap items-center gap-2">
                  <button
                    v-for="c in colorPalette"
                    :key="c"
                    type="button"
                    class="size-7 rounded-full border-2 transition-transform hover:scale-110"
                    :style="{ backgroundColor: c, borderColor: form.color === c ? '#fff' : 'transparent' }"
                    :aria-label="`Color ${c}`"
                    @click="form.color = c"
                  />
                </div>
              </div>
            </div>

            <div class="mt-4 grid gap-4 md:grid-cols-[1fr_auto] md:items-end">
              <div>
                <label
                  :class="labelClass"
                  for="meeting-notes"
                >Notas internas</label>
                <textarea
                  id="meeting-notes"
                  v-model="form.notes"
                  rows="2"
                  placeholder="Detalles operativos, recordatorios, requisitos especiales..."
                  :class="['mt-1', inputClass, 'h-auto resize-none py-2 leading-relaxed']"
                />
              </div>
              <label class="flex h-11 items-center gap-3 rounded border border-outline-variant bg-surface-container px-4">
                <input
                  v-model="form.isPublic"
                  type="checkbox"
                  class="size-4 accent-primary"
                >
                <span class="text-xs font-semibold uppercase tracking-wider text-on-surface-variant">
                  Visible públicamente
                </span>
              </label>
            </div>
          </UiCard>
        </div>

        <aside class="lg:sticky lg:top-40 lg:self-start">
          <UiCard class="overflow-hidden">
            <div
              class="h-2"
              :style="{ backgroundColor: form.color }"
            />
            <div class="p-5">
              <p class="text-[10px] font-semibold uppercase tracking-[0.3em] text-on-surface-variant">
                Vista previa
              </p>
              <h3 class="mt-3 font-display text-lg font-semibold text-on-surface">
                {{ form.title || 'Título de la reunión' }}
              </h3>
              <p
                v-if="selectedType"
                class="mt-1 text-xs"
                :style="{ color: selectedType.accent }"
              >
                {{ selectedType.label }}
              </p>

              <div class="mt-5 space-y-3 border-t border-outline-variant pt-4 text-xs">
                <div class="flex items-start gap-2">
                  <CalendarDays class="mt-0.5 size-3.5 shrink-0 text-on-surface-variant" />
                  <div class="text-on-surface">
                    <p class="capitalize">
                      {{ formatPreviewDate(form.date) }}
                    </p>
                    <p class="text-on-surface-variant">
                      {{ form.startTime }} – {{ form.endTime }}
                    </p>
                  </div>
                </div>
                <div
                  v-if="form.location"
                  class="flex items-start gap-2"
                >
                  <MapPinned class="mt-0.5 size-3.5 shrink-0 text-on-surface-variant" />
                  <p class="text-on-surface">
                    {{ form.location }}
                  </p>
                </div>
                <div
                  v-if="form.position"
                  class="flex items-start gap-2"
                >
                  <MapPin class="mt-0.5 size-3.5 shrink-0 text-on-surface-variant" />
                  <div>
                    <p class="text-[10px] font-semibold uppercase tracking-wider text-on-surface-variant">
                      Punto en el mapa
                    </p>
                    <p class="text-on-surface">
                      {{ form.position[0].toFixed(4) }}, {{ form.position[1].toFixed(4) }}
                    </p>
                  </div>
                </div>
                <div
                  v-if="selectedSector"
                  class="flex items-start gap-2"
                >
                  <span class="mt-0.5 flex size-3.5 shrink-0 items-center justify-center text-on-surface-variant">·</span>
                  <div>
                    <p class="text-[10px] font-semibold uppercase tracking-wider text-on-surface-variant">
                      Sector
                    </p>
                    <p class="text-on-surface">
                      {{ selectedSector.name }}
                    </p>
                  </div>
                </div>
                <div
                  v-if="selectedSupervisor"
                  class="flex items-start gap-2"
                >
                  <Users class="mt-0.5 size-3.5 shrink-0 text-on-surface-variant" />
                  <div>
                    <p class="text-[10px] font-semibold uppercase tracking-wider text-on-surface-variant">
                      Supervisor
                    </p>
                    <p class="text-on-surface">
                      {{ selectedSupervisor.name }}
                    </p>
                    <p class="text-on-surface-variant">
                      {{ selectedSupervisor.role }}
                    </p>
                  </div>
                </div>
                <div
                  v-if="form.coSupervisorIds.length > 0"
                  class="flex items-start gap-2"
                >
                  <span class="mt-0.5 flex size-3.5 shrink-0 items-center justify-center text-on-surface-variant">+</span>
                  <div>
                    <p class="text-[10px] font-semibold uppercase tracking-wider text-on-surface-variant">
                      Co-supervisores ({{ form.coSupervisorIds.length }})
                    </p>
                    <p class="text-on-surface">
                      {{ form.coSupervisorIds.map(id => mockSupervisors.find(s => s.id === id)?.name).filter(Boolean).join(', ') }}
                    </p>
                  </div>
                </div>
              </div>

              <div class="mt-5 border-t border-outline-variant pt-4">
                <p class="text-[10px] font-semibold uppercase tracking-wider text-on-surface-variant">
                  Los campos con * son obligatorios
                </p>
              </div>
            </div>
          </UiCard>
        </aside>
      </form>
    </main>
  </div>
</template>

<style scoped>
/* Contain Leaflet's high z-index panes/controls in their own stacking context
   so they don't render over the sticky header while scrolling. */
.meeting-map {
    position: relative;
    z-index: 0;
    isolation: isolate;
}
.meeting-map :deep(.leaflet-container) {
    cursor: crosshair;
}
.meeting-map :deep(.leaflet-control-zoom) {
    margin: 10px;
    border: 1px solid var(--outline-variant);
    border-radius: 10px;
    overflow: hidden;
    box-shadow: 0 4px 12px rgb(0 0 0 / 35%);
}
.meeting-map :deep(.leaflet-control-zoom a) {
    width: 30px;
    height: 30px;
    line-height: 30px;
    background: var(--surface-container);
    color: var(--on-surface);
    border-bottom-color: var(--outline-variant);
}
.meeting-map :deep(.leaflet-control-zoom a:hover) {
    background: var(--surface-container-high);
    color: var(--primary);
}
</style>
