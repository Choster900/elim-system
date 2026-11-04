import 'vue-router'

declare module 'vue-router' {
    interface RouteMeta {
        requiresAuth?: boolean
        requiredPermission?: string
        requiredAnyPermissions?: string[]
        sectionPermissions?: Record<string, string>
        fixedViewport?: boolean
    }
}

export {}
