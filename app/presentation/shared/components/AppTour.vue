<script setup lang="ts">
import { ArrowLeft, ArrowRight, Check, X } from '@lucide/vue'
import type { TourStep } from '../interfaces/tour.interface'

const props = defineProps<{
    open: boolean
    steps: TourStep[]
}>()

const emit = defineEmits<{
    close: []
    complete: []
}>()

const dialog = ref<HTMLElement | null>(null)
const title = ref<HTMLElement | null>(null)
const visibleSteps = ref<TourStep[]>([])
const currentIndex = ref(0)
const spotlightStyle = ref<Record<string, string>>({})
const cardStyle = ref<Record<string, string>>({})
let previousFocus: HTMLElement | null = null
let positionFrame = 0

const currentStep = computed(() => visibleSteps.value[currentIndex.value])
const isLastStep = computed(() => currentIndex.value === visibleSteps.value.length - 1)

function targetFor(step: TourStep) {
    const target = document.querySelector<HTMLElement>(step.target)
    return target && target.getClientRects().length ? target : null
}

function updatePosition() {
    const step = currentStep.value
    if (!step) return
    const target = targetFor(step)
    if (!target) return

    const rect = target.getBoundingClientRect()
    const gap = 8
    const top = Math.max(gap, rect.top - gap)
    const left = Math.max(gap, rect.left - gap)
    const right = Math.min(window.innerWidth - gap, rect.right + gap)
    const bottom = Math.min(window.innerHeight - gap, rect.bottom + gap)

    spotlightStyle.value = {
        top: `${top}px`,
        left: `${left}px`,
        width: `${Math.max(0, right - left)}px`,
        height: `${Math.max(0, bottom - top)}px`,
    }

    const cardWidth = Math.min(384, window.innerWidth - 32)
    const cardHeight = dialog.value?.offsetHeight ?? 260
    const spaceBelow = window.innerHeight - bottom
    const spaceAbove = top
    const cardTop =
        spaceBelow >= cardHeight + 20 || spaceBelow >= spaceAbove
            ? Math.min(window.innerHeight - cardHeight - 16, bottom + 16)
            : Math.max(16, top - cardHeight - 16)

    cardStyle.value = {
        top: `${Math.max(16, cardTop)}px`,
        left: `${Math.min(Math.max(16, left), window.innerWidth - cardWidth - 16)}px`,
        width: `${cardWidth}px`,
    }
}

function schedulePosition() {
    cancelAnimationFrame(positionFrame)
    positionFrame = requestAnimationFrame(updatePosition)
}

async function showStep(index: number) {
    currentIndex.value = index
    await nextTick()
    const step = currentStep.value
    if (!step) return
    targetFor(step)?.scrollIntoView({ block: 'center', inline: 'nearest', behavior: 'auto' })
    schedulePosition()
    title.value?.focus({ preventScroll: true })
}

function finish(completed: boolean) {
    if (completed) emit('complete')
    else emit('close')
}

function onKeydown(event: KeyboardEvent) {
    if (!props.open) return
    if (event.key === 'Escape') {
        event.preventDefault()
        finish(false)
        return
    }
    if (event.key !== 'Tab' || !dialog.value) return

    const focusable = Array.from(
        dialog.value.querySelectorAll<HTMLElement>('button:not([disabled])'),
    )
    const first = focusable[0]
    const last = focusable[focusable.length - 1]
    if (!first || !last) return
    if (
        event.shiftKey &&
        (document.activeElement === first || document.activeElement === title.value)
    ) {
        event.preventDefault()
        last.focus()
    } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault()
        first.focus()
    }
}

watch(
    () => props.open,
    async (open) => {
        if (!import.meta.client) return
        if (open) {
            previousFocus = document.activeElement as HTMLElement | null
            await nextTick()
            visibleSteps.value = props.steps.filter((step) => targetFor(step))
            if (!visibleSteps.value.length) {
                finish(false)
                return
            }
            window.addEventListener('resize', schedulePosition)
            window.addEventListener('scroll', schedulePosition, true)
            document.addEventListener('keydown', onKeydown)
            await showStep(0)
        } else {
            window.removeEventListener('resize', schedulePosition)
            window.removeEventListener('scroll', schedulePosition, true)
            document.removeEventListener('keydown', onKeydown)
            cancelAnimationFrame(positionFrame)
            previousFocus?.focus({ preventScroll: true })
        }
    },
)

onBeforeUnmount(() => {
    if (!import.meta.client) return
    window.removeEventListener('resize', schedulePosition)
    window.removeEventListener('scroll', schedulePosition, true)
    document.removeEventListener('keydown', onKeydown)
    cancelAnimationFrame(positionFrame)
    previousFocus?.focus({ preventScroll: true })
})
</script>

<template>
    <Teleport to="body">
        <div v-if="open && currentStep" class="fixed inset-0 z-[80]">
            <div class="absolute inset-0" aria-hidden="true" />
            <div
                class="pointer-events-none fixed rounded-xl ring-2 ring-primary shadow-[0_0_0_9999px_rgba(15,23,42,0.68)] transition-[top,left,width,height] duration-150"
                :style="spotlightStyle"
                aria-hidden="true"
            />
            <section
                ref="dialog"
                role="dialog"
                aria-modal="true"
                aria-labelledby="app-tour-title"
                aria-describedby="app-tour-description"
                class="fixed max-h-[calc(100dvh-32px)] overflow-y-auto rounded-2xl border border-outline-variant bg-surface p-5 text-on-surface shadow-2xl sm:p-6"
                :style="cardStyle"
            >
                <div class="flex items-center justify-between gap-3">
                    <span class="text-[11px] font-semibold uppercase tracking-widest text-primary">
                        Recorrido · {{ currentIndex + 1 }} de {{ visibleSteps.length }}
                    </span>
                    <button
                        type="button"
                        class="rounded-md p-1 text-on-surface-variant hover:bg-surface-container focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                        aria-label="Cerrar recorrido"
                        @click="finish(false)"
                    >
                        <X class="size-4" />
                    </button>
                </div>
                <h2
                    id="app-tour-title"
                    ref="title"
                    tabindex="-1"
                    class="mt-4 font-display text-xl font-semibold outline-none"
                >
                    {{ currentStep.title }}
                </h2>
                <p id="app-tour-description" class="mt-2 text-sm leading-6 text-on-surface-variant">
                    {{ currentStep.description }}
                </p>
                <div
                    class="mt-5 flex items-center justify-between gap-2 border-t border-outline-variant pt-4"
                >
                    <button
                        type="button"
                        class="text-xs font-semibold text-on-surface-variant hover:text-on-surface focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                        @click="finish(false)"
                    >
                        Saltar recorrido
                    </button>
                    <div class="flex gap-2">
                        <UiButton
                            v-if="currentIndex > 0"
                            variant="outline"
                            size="sm"
                            type="button"
                            @click="showStep(currentIndex - 1)"
                        >
                            <ArrowLeft /> Anterior
                        </UiButton>
                        <UiButton
                            size="sm"
                            type="button"
                            @click="isLastStep ? finish(true) : showStep(currentIndex + 1)"
                        >
                            <Check v-if="isLastStep" />
                            <ArrowRight v-else />
                            {{ isLastStep ? 'Finalizar' : 'Siguiente' }}
                        </UiButton>
                    </div>
                </div>
            </section>
        </div>
    </Teleport>
</template>
