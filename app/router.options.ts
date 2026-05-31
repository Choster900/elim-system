import type { RouterConfig } from '@nuxt/schema'

export default <RouterConfig>{
    routes: () => [
        {
            name: 'index',
            path: '/',
            component: () => import('~/presentation/landing/view/index.vue'),
        },
        {
            name: 'login',
            path: '/login',
            component: () => import('~/presentation/auth/view/index.vue'),
        },
    ],
}
