<script setup lang="ts">
import { Check, ExternalLink, Plus, Search, X } from '@lucide/vue'

interface AssignItem {
  id: string
  title: string
  meta: string
  color: string
  assigned: boolean
}

const props = defineProps<{
  open: boolean
  sectorName: string
  accent: string
  items: AssignItem[]
}>()

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'assign' | 'go', id: string): void
}>()

const query = ref('')

watch(
  () => props.open,
  (isOpen) => {
    if (isOpen) query.value = ''
  },
)

const filtered = computed(() => {
  const q = query.value.trim().toLowerCase()
  if (!q) return props.items
  return props.items.filter(it => it.title.toLowerCase().includes(q) || it.meta.toLowerCase().includes(q))
})
</script>

<template>
  <template v-if="open">
    <div
      class="fixed inset-0 z-[60] bg-black/50"
      @click="emit('close')"
    />
    <aside
      class="assign-drawer fixed inset-y-0 right-0 z-[61] flex w-[440px] max-w-[94vw] flex-col bg-surface-container-low shadow-2xl"
    >
      <div class="flex-none border-b border-outline-variant px-6 py-5">
        <div class="flex items-center justify-between">
          <span
            class="text-[11px] font-bold uppercase tracking-[0.2em]"
            :style="{ color: accent }"
          >
            Asignar reunión
          </span>
          <button
            type="button"
            class="text-on-surface-variant hover:text-on-surface"
            aria-label="Cerrar"
            @click="emit('close')"
          >
            <X class="size-4" />
          </button>
        </div>
        <p class="mt-2 text-sm text-on-surface-variant">
          Al sector <strong class="font-semibold text-on-surface">{{ sectorName }}</strong>
        </p>
        <div class="mt-4 flex items-center gap-2 rounded-full border border-outline-variant bg-surface px-3.5 py-2">
          <Search class="size-4 shrink-0 text-on-surface-variant" />
          <input
            v-model="query"
            type="text"
            placeholder="Buscar reunión del catálogo…"
            class="w-full bg-transparent text-sm text-on-surface outline-none placeholder:text-on-surface-variant"
          >
        </div>
      </div>

      <div class="min-h-0 flex-1 overflow-y-auto">
        <p
          v-if="filtered.length === 0"
          class="px-6 py-12 text-center text-sm italic text-on-surface-variant"
        >
          No hay reuniones en el catálogo que coincidan.
        </p>
        <div
          v-for="it in filtered"
          :key="it.id"
          class="flex items-center gap-3 border-b border-outline-variant/60 px-6 py-3.5"
        >
          <span
            class="size-2.5 shrink-0 rounded-full"
            :style="{ backgroundColor: it.color }"
          />
          <div class="min-w-0 flex-1">
            <p class="truncate text-sm font-semibold text-on-surface">
              {{ it.title }}
            </p>
            <p class="truncate text-xs text-on-surface-variant">
              {{ it.meta }}
            </p>
          </div>
          <button
            type="button"
            class="flex size-8 shrink-0 items-center justify-center rounded-md text-on-surface-variant transition-colors hover:bg-surface-container-high hover:text-primary"
            title="Ir a la reunión"
            @click="emit('go', it.id)"
          >
            <ExternalLink class="size-4" />
          </button>
          <button
            v-if="it.assigned"
            type="button"
            disabled
            class="inline-flex shrink-0 items-center gap-1 rounded-lg border border-outline-variant px-2.5 py-1.5 text-xs font-semibold text-on-surface-variant opacity-70"
          >
            <Check class="size-3.5" /> Asignada
          </button>
          <button
            v-else
            type="button"
            class="inline-flex shrink-0 items-center gap-1 rounded-lg bg-primary px-2.5 py-1.5 text-xs font-semibold text-primary-foreground transition-opacity hover:opacity-90"
            @click="emit('assign', it.id)"
          >
            <Plus class="size-3.5" /> Asignar
          </button>
        </div>
      </div>

      <div class="flex-none border-t border-outline-variant px-6 py-4">
        <NuxtLink
          to="/catalogos/reuniones/nueva"
          class="flex items-center justify-center gap-2 rounded-lg border border-outline-variant px-4 py-2.5 text-sm font-medium text-on-surface transition-colors hover:border-primary hover:text-primary"
        >
          <Plus class="size-4" /> Crear nueva reunión en el catálogo
        </NuxtLink>
      </div>
    </aside>
  </template>
</template>

<style scoped>
.assign-drawer {
    animation: assign-in 0.28s ease;
}
@keyframes assign-in {
    from {
        transform: translateX(26px);
        opacity: 0;
    }
    to {
        transform: translateX(0);
        opacity: 1;
    }
}
</style>
