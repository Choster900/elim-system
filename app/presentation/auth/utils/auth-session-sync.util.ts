import type { AuthUser } from '../interfaces/login-response.interface'

const CHANNEL_NAME = 'elim-auth-session'
const STORAGE_KEY = 'elim-auth-session-event'
const MAX_REMEMBERED_EVENTS = 50

type AuthSessionSyncEventPayload =
    | {
          type: 'SIGNED_IN'
          user: AuthUser
          sessionExpiresAt: number | null
      }
    | {
          type: 'SIGNED_OUT'
      }

export type AuthSessionSyncEvent = AuthSessionSyncEventPayload & { id: string }

type Listener = (event: AuthSessionSyncEvent) => void

let channel: BroadcastChannel | null = null
const listeners = new Set<Listener>()
const receivedEventIds = new Set<string>()

function createEventId() {
    if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
        return crypto.randomUUID()
    }
    return `${Date.now()}-${Math.random().toString(36).slice(2)}`
}

function getChannel() {
    if (!import.meta.client || typeof BroadcastChannel === 'undefined') return null
    if (!channel) {
        channel = new BroadcastChannel(CHANNEL_NAME)
        channel.addEventListener('message', (event: MessageEvent<unknown>) => {
            notifyListeners(event.data)
        })
    }
    return channel
}

function isAuthSessionEvent(value: unknown): value is AuthSessionSyncEvent {
    if (!value || typeof value !== 'object') return false
    const event = value as Partial<AuthSessionSyncEvent>
    return (
        typeof event.id === 'string' &&
        (event.type === 'SIGNED_OUT' ||
            (event.type === 'SIGNED_IN' &&
                !!event.user &&
                (typeof event.sessionExpiresAt === 'number' || event.sessionExpiresAt === null)))
    )
}

function notifyListeners(value: unknown) {
    if (!isAuthSessionEvent(value) || receivedEventIds.has(value.id)) return

    receivedEventIds.add(value.id)
    if (receivedEventIds.size > MAX_REMEMBERED_EVENTS) {
        const oldestEventId = receivedEventIds.values().next().value
        if (oldestEventId) receivedEventIds.delete(oldestEventId)
    }
    listeners.forEach((listener) => listener(value))
}

export function publishAuthSessionEvent(event: AuthSessionSyncEventPayload) {
    if (!import.meta.client) return

    const eventWithId: AuthSessionSyncEvent = { ...event, id: createEventId() }
    getChannel()?.postMessage(eventWithId)

    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(eventWithId))
    } catch {
        // BroadcastChannel ya cubre navegadores que no permiten almacenamiento local.
    }
}

export function subscribeToAuthSessionEvents(listener: Listener) {
    if (!import.meta.client) return () => undefined

    const handleStorageEvent = (event: StorageEvent) => {
        if (event.key !== STORAGE_KEY || !event.newValue) return
        try {
            notifyListeners(JSON.parse(event.newValue))
        } catch {
            // Un valor externo inválido no debe interrumpir la sesión.
        }
    }

    getChannel()
    listeners.add(listener)
    window.addEventListener('storage', handleStorageEvent)

    return () => {
        listeners.delete(listener)
        window.removeEventListener('storage', handleStorageEvent)
    }
}
