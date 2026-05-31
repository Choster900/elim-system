import type { AuthenticatedUserContext } from './auth.types'

declare module 'h3' {
    interface H3EventContext {
        auth?: AuthenticatedUserContext
    }
}

export {}
