<script setup lang="ts">
import { ArrowLeft, UserPlus } from '@lucide/vue'
import MemberFormDrawer from '../components/MemberFormDrawer.vue'
import { useCreateMemberMutation } from '../composables/useMemberMutations'
import type { MemberInput } from '../interfaces/member.interface'
import { useAppToast } from '~/presentation/shared/composables/useAppToast'

defineOptions({ name: 'MemberFormView' })

useHead({ title: 'Nuevo miembro · Sistema' })

const toast = useAppToast()
const createMemberMutation = useCreateMemberMutation()
const saving = computed(() => createMemberMutation.isPending.value)

function returnToMembers() {
    return navigateTo('/comunidad/miembros')
}

async function saveMember(payload: MemberInput) {
    try {
        await createMemberMutation.mutateAsync(payload)
        toast.success('Miembro creado correctamente')
        await returnToMembers()
    } catch {
        toast.error('No fue posible guardar el miembro. Revisa el código, documento y correo.')
    }
}
</script>

<template>
    <main
        class="mx-auto w-full max-w-system px-6 pb-20 pt-24 lg:px-10"
        data-testid="member-create-page"
    >
        <header class="mb-8 border-b border-outline-variant pb-8">
            <NuxtLink
                to="/comunidad/miembros"
                class="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-on-surface-variant transition-colors hover:text-primary"
            >
                <ArrowLeft class="size-4" /> Volver al directorio
            </NuxtLink>
            <div class="mt-6 flex items-start gap-4">
                <div
                    class="flex size-12 shrink-0 items-center justify-center rounded-full bg-primary/15 text-primary"
                >
                    <UserPlus class="size-5" />
                </div>
                <div>
                    <p class="text-xs font-semibold uppercase tracking-[0.35em] text-primary">
                        Comunidad · Miembros
                    </p>
                    <h1
                        class="mt-2 font-display text-4xl font-semibold text-on-surface md:text-5xl"
                    >
                        Nuevo miembro
                    </h1>
                    <p class="mt-3 max-w-2xl text-sm leading-relaxed text-on-surface-variant">
                        Registra la información personal, comunitaria y pastoral. Este registro no
                        crea credenciales ni concede acceso al sistema.
                    </p>
                </div>
            </div>
        </header>

        <MemberFormDrawer
            open
            variant="page"
            :member="null"
            :saving="saving"
            @close="returnToMembers"
            @save="saveMember"
        />
    </main>
</template>
