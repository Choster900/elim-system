import type { RouterConfig } from '@nuxt/schema'
import authRoutes from '~/presentation/auth/router.index'
import dashboardRoutes from '~/presentation/dashboard/router.index'
import landingRoutes from '~/presentation/landing/router.index'
import memberRoutes from '~/presentation/members/router.index'
import meetingsRoutes from '~/presentation/meetings/router.index'
import registerRoutes from '~/presentation/register/router.index'
import territoriesRoutes from '~/presentation/territories/router.index'

export default <RouterConfig>{
    routes: () => [
        ...landingRoutes,
        ...authRoutes,
        ...registerRoutes,
        ...dashboardRoutes,
        ...memberRoutes,
        ...meetingsRoutes,
        ...territoriesRoutes,
    ],
}
