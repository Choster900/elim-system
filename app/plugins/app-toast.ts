import { appToast } from '~/infrastructure/notifications'

export default defineNuxtPlugin(() => {
    return {
        provide: {
            appToast,
        },
    }
})
