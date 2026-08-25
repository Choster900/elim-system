<script setup lang="ts">
import { LogOut, RefreshCw } from '@lucide/vue'
import { useQueryClient } from '@tanstack/vue-query'
import { useApiClient } from '~/presentation/shared/composables/useApiClient'
import { logoutRequest, refreshSessionRequest } from '../services/auth.service'
import { useAuthStore } from '../stores/auth.store'

defineOptions({ name: 'SessionExpiryModal' })

const WARNING_WINDOW_MS = 60_000
const TICK_MS = 250
const URGENT_SECONDS = 10
const RING_RADIUS = 54
const RING_CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS

const route = useRoute()
const apiClient = useApiClient()
const queryClient = useQueryClient()
const authStore = useAuthStore()

const now = ref(Date.now())
const renewing = ref(false)
let ticker: ReturnType<typeof window.setInterval> | null = null

const remainingMs = computed(() => Math.max(0, (authStore.sessionExpiresAt ?? 0) - now.value))
const showWarning = computed(
    () =>
        authStore.isAuthenticated &&
        !!authStore.sessionExpiresAt &&
        remainingMs.value <= WARNING_WINDOW_MS,
)
const remainingSeconds = computed(() => Math.ceil(remainingMs.value / 1000))
const isUrgent = computed(() => remainingSeconds.value <= URGENT_SECONDS)
const progress = computed(() => Math.min(1, Math.max(0, remainingMs.value / WARNING_WINDOW_MS)))
const ringOffset = computed(() => RING_CIRCUMFERENCE * (1 - progress.value))

function loginRedirect() {
    return route.fullPath.startsWith('/login') ? '/dashboard' : route.fullPath
}

async function expireSession() {
    if (!authStore.isAuthenticated) return

    try {
        await logoutRequest(apiClient)
    } catch {
        // La expiración debe limpiar la sesión local incluso si la cookie ya venció.
    } finally {
        queryClient.clear()
        authStore.clearUser()
        await navigateTo({
            path: '/login',
            query: { redirect: loginRedirect() },
        })
    }
}

async function renewSession() {
    if (renewing.value) return

    renewing.value = true
    try {
        const response = await refreshSessionRequest(apiClient)
        authStore.setUser(response.user, response.tokens.accessTokenExpiresIn)
    } catch {
        await expireSession()
    } finally {
        renewing.value = false
    }
}

watch(
    remainingMs,
    async (value) => {
        if (authStore.isAuthenticated && authStore.sessionExpiresAt && value <= 0) {
            await expireSession()
        }
    },
    { immediate: true },
)

onMounted(() => {
    ticker = window.setInterval(() => {
        now.value = Date.now()
    }, TICK_MS)
})

onBeforeUnmount(() => {
    if (ticker) window.clearInterval(ticker)
})
</script>

<template>
    <Teleport to="body">
        <Transition name="session-expiry">
            <div
                v-if="showWarning"
                class="session-expiry-backdrop fixed inset-0 z-[90] backdrop-blur-xl"
            >
                <div class="flex min-h-full items-center justify-center px-4 py-8">
                    <section
                        role="alertdialog"
                        aria-modal="true"
                        aria-labelledby="session-expiry-title"
                        aria-describedby="session-expiry-description"
                        :class="[
                            'session-expiry-card w-full max-w-2xl rounded-2xl border bg-surface-container-low p-8 text-on-surface shadow-2xl sm:p-10',
                            isUrgent ? 'border-destructive/35' : 'border-outline-variant',
                        ]"
                    >
                        <div
                            class="flex flex-col items-center gap-8 text-center sm:flex-row sm:items-center sm:gap-10 sm:text-left"
                        >
                            <div
                                :class="[
                                    'session-expiry-ring relative size-32 shrink-0',
                                    isUrgent ? 'is-urgent text-destructive' : 'text-primary',
                                ]"
                            >
                                <svg class="size-full -rotate-90" viewBox="0 0 128 128">
                                    <circle
                                        class="text-surface-container-high"
                                        cx="64"
                                        cy="64"
                                        :r="RING_RADIUS"
                                        fill="none"
                                        stroke="currentColor"
                                        stroke-width="6"
                                    />
                                    <circle
                                        class="session-expiry-ring-progress"
                                        cx="64"
                                        cy="64"
                                        :r="RING_RADIUS"
                                        fill="none"
                                        stroke="currentColor"
                                        stroke-width="6"
                                        stroke-linecap="round"
                                        :stroke-dasharray="RING_CIRCUMFERENCE"
                                        :stroke-dashoffset="ringOffset"
                                    />
                                </svg>

                                <div
                                    class="absolute inset-0 flex flex-col items-center justify-center"
                                >
                                    <span
                                        class="font-display text-[2.75rem] font-semibold leading-none tabular-nums"
                                    >
                                        {{ remainingSeconds }}
                                    </span>
                                    <span
                                        class="mt-1 text-[10px] font-semibold uppercase tracking-[0.22em] text-on-surface-variant"
                                    >
                                        segundos
                                    </span>
                                </div>
                            </div>

                            <div class="min-w-0 flex-1">
                                <h2
                                    id="session-expiry-title"
                                    class="font-display text-2xl font-semibold sm:text-3xl"
                                >
                                    Tu sesión está por vencer
                                </h2>
                                <p
                                    id="session-expiry-description"
                                    class="mt-3 text-sm leading-relaxed text-on-surface-variant"
                                >
                                    Renueva ahora para seguir trabajando. Si el contador llega a
                                    cero cerraremos tu sesión automáticamente.
                                </p>

                                <div class="mt-7 flex flex-col gap-2 sm:flex-row">
                                    <UiButton
                                        variant="outline"
                                        type="button"
                                        class="h-11 sm:px-6"
                                        @click="expireSession"
                                    >
                                        <LogOut class="size-4" />
                                        Cerrar sesión
                                    </UiButton>
                                    <UiButton
                                        type="button"
                                        class="h-11 sm:flex-1"
                                        :loading="renewing"
                                        @click="renewSession"
                                    >
                                        <RefreshCw class="size-4" />
                                        Renovar sesión
                                    </UiButton>
                                </div>
                            </div>
                        </div>
                    </section>
                </div>
            </div>
        </Transition>
    </Teleport>
</template>

<style scoped>
.session-expiry-backdrop {
    background: rgb(8 10 10 / 78%);
}

.session-expiry-ring-progress {
    transition: stroke-dashoffset 250ms linear;
}

.session-expiry-ring.is-urgent {
    animation: session-expiry-pulse 1s ease-in-out infinite;
}

@keyframes session-expiry-pulse {
    0%,
    100% {
        transform: scale(1);
    }

    50% {
        transform: scale(1.04);
    }
}

.session-expiry-enter-active,
.session-expiry-leave-active {
    transition: opacity 200ms ease;
}

.session-expiry-enter-from,
.session-expiry-leave-to {
    opacity: 0;
}

.session-expiry-enter-active .session-expiry-card {
    animation: session-expiry-in 260ms cubic-bezier(0.16, 1, 0.3, 1);
}

@keyframes session-expiry-in {
    from {
        opacity: 0;
        transform: translateY(12px) scale(0.97);
    }

    to {
        opacity: 1;
        transform: translateY(0) scale(1);
    }
}

@media (prefers-reduced-motion: reduce) {
    .session-expiry-ring.is-urgent,
    .session-expiry-enter-active .session-expiry-card {
        animation: none;
    }

    .session-expiry-ring-progress {
        transition: none;
    }
}
</style>
