import 'vue-router'

declare module 'vue-router' {
    interface RouteMeta {
        requiresAuth?: boolean
        requiredPermission?: string
        sectionPermissions?: Record<string, string>
    }
}

export {}
