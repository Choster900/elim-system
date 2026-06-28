import type { RouterConfig } from '@nuxt/schema'
import authRoutes from '~/presentation/auth/router.index'
import dashboardRoutes from '~/presentation/dashboard/router.index'
import landingRoutes from '~/presentation/landing/router.index'
import meetingsRoutes from '~/presentation/meetings/router.index'
import registerRoutes from '~/presentation/register/router.index'

export default <RouterConfig>{
    routes: () => [
        ...landingRoutes,
        ...authRoutes,
        ...registerRoutes,
        ...dashboardRoutes,
        ...meetingsRoutes,
    ],
}
