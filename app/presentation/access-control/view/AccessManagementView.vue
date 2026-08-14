<script setup lang="ts">
import { KeyRound, ShieldCheck, UsersRound } from '@lucide/vue'
import type { Component } from 'vue'
import UsersView from '~/presentation/users/view/UsersView.vue'
import AccessControlNav from '../components/AccessControlNav.vue'
import type { AccessControlSection } from '../interfaces/access-control.interface'
import PermissionsView from './PermissionsView.vue'
import RolesView from './RolesView.vue'
import { useAuthStore } from '~/presentation/auth/stores/auth.store'
import { accessSectionPermissions } from '../constants/access-control.constants'

defineOptions({ name: 'AccessManagementView' })

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()

const validSections: AccessControlSection[] = ['users', 'roles', 'permissions']
const allowedSections = computed(() =>
    validSections.filter((section) => authStore.hasPermission(accessSectionPermissions[section])),
)

function resolveSection(value: unknown): AccessControlSection {
    const requested = value as AccessControlSection
    if (validSections.includes(requested) && allowedSections.value.includes(requested)) {
        return requested
    }

    return allowedSections.value[0] ?? 'users'
}

const activeSection = ref<AccessControlSection>(resolveSection(route.query.section))

const sectionContent: Record<
    AccessControlSection,
    { title: string; description: string; icon: Component; component: Component }
> = {
    users: {
        title: 'Usuarios',
        description:
            'Vincula miembros con cuentas del sistema y administra sus credenciales y seguridad.',
        icon: UsersRound,
        component: UsersView,
    },
    roles: {
        title: 'Roles',
        description:
            'Agrupa permisos en perfiles reutilizables para controlar el acceso de los usuarios.',
        icon: ShieldCheck,
        component: RolesView,
    },
    permissions: {
        title: 'Permisos',
        description: 'Mantén el catálogo de acciones autorizadas que pueden asignarse a cada rol.',
        icon: KeyRound,
        component: PermissionsView,
    },
}

const currentSection = computed(() => sectionContent[activeSection.value])

useHead(() => ({ title: `${currentSection.value.title} · Sistema` }))

watch(activeSection, (section) => {
    router.replace({ query: section === 'users' ? {} : { section } })
})

watch(
    () => route.query.section,
    (section) => {
        activeSection.value = resolveSection(section)
    },
)
</script>

<template>
    <main
        class="mx-auto w-full max-w-system px-6 pb-20 pt-24 lg:px-10"
        data-testid="access-management-page"
    >
        <header class="border-b border-outline-variant pb-9">
            <div class="flex items-start gap-4">
                <div
                    class="flex size-12 shrink-0 items-center justify-center rounded-full bg-primary/15 text-primary"
                >
                    <component :is="currentSection.icon" class="size-5" />
                </div>
                <div>
                    <p
                        class="text-xs font-semibold uppercase tracking-[0.4em] text-on-surface-variant"
                    >
                        Comunidad · Seguridad y acceso
                    </p>
                    <h1
                        class="mt-3 font-display text-4xl font-semibold text-on-surface md:text-5xl"
                    >
                        {{ currentSection.title }}
                    </h1>
                    <p class="mt-3 max-w-2xl text-sm leading-relaxed text-on-surface-variant">
                        {{ currentSection.description }}
                    </p>
                </div>
            </div>
        </header>

        <AccessControlNav
            v-model="activeSection"
            :allowed-sections="allowedSections"
            class="mt-7"
        />

        <KeepAlive>
            <component :is="currentSection.component" embedded />
        </KeepAlive>
    </main>
</template>
