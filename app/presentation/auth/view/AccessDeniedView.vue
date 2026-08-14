<script setup lang="ts">
import { ArrowLeft, House, ShieldX } from '@lucide/vue'
import { routePermissionCodes } from '../constants/permission.constants'
import { useAuthStore } from '../stores/auth.store'

defineOptions({ name: 'AccessDeniedView' })

useHead({ title: 'Acceso denegado · Sistema' })

const router = useRouter()
const authStore = useAuthStore()
const homePath = computed(() =>
    authStore.hasPermission(routePermissionCodes.dashboard) ? '/dashboard' : '/',
)

function goBack() {
    if (window.history.length > 1) router.back()
    else navigateTo(homePath.value)
}
</script>

<template>
    <main class="mx-auto flex min-h-[72vh] max-w-2xl items-center px-6 pb-20 pt-28">
        <UiCard class="w-full p-8 text-center sm:p-12">
            <div
                class="mx-auto flex size-16 items-center justify-center rounded-full bg-destructive/10 text-destructive"
            >
                <ShieldX class="size-8" />
            </div>
            <p class="mt-7 text-xs font-semibold uppercase tracking-[0.35em] text-destructive">
                Código 403
            </p>
            <h1 class="mt-3 font-display text-4xl font-semibold text-on-surface">
                Acceso denegado
            </h1>
            <p class="mx-auto mt-4 max-w-lg text-sm leading-relaxed text-on-surface-variant">
                Tu cuenta no tiene el permiso necesario para consultar esta sección. Si consideras
                que debes tener acceso, comunícate con un administrador.
            </p>
            <div class="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
                <UiButton type="button" variant="outline" @click="goBack">
                    <ArrowLeft class="size-4" /> Volver
                </UiButton>
                <UiButton type="button" @click="navigateTo(homePath)">
                    <House class="size-4" /> Ir al inicio
                </UiButton>
            </div>
        </UiCard>
    </main>
</template>
