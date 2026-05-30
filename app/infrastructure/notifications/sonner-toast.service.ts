import type { ExternalToast } from 'vue-sonner'
import { toast } from 'vue-sonner'

export type AppToastMessage = Parameters<typeof toast>[0]
export type AppToastOptions = ExternalToast
export type AppToastPromiseInput<TData = unknown> = Parameters<typeof toast.promise<TData>>[0]
export type AppToastPromiseOptions<TData = unknown> = Parameters<typeof toast.promise<TData>>[1]

export interface AppToast {
    show: (message: AppToastMessage, options?: AppToastOptions) => string | number
    success: (message: AppToastMessage, options?: AppToastOptions) => string | number
    info: (message: AppToastMessage, options?: AppToastOptions) => string | number
    warning: (message: AppToastMessage, options?: AppToastOptions) => string | number
    error: (message: AppToastMessage, options?: AppToastOptions) => string | number
    loading: (message: AppToastMessage, options?: AppToastOptions) => string | number
    promise: <TData = unknown>(
        promise: AppToastPromiseInput<TData>,
        options?: AppToastPromiseOptions<TData>,
    ) => ReturnType<typeof toast.promise<TData>>
    dismiss: (id?: string | number) => string | number | undefined
}

export const appToast: AppToast = {
    show: (message, options) => toast(message, options),
    success: (message, options) => toast.success(message, options),
    info: (message, options) => toast.info(message, options),
    warning: (message, options) => toast.warning(message, options),
    error: (message, options) => toast.error(message, options),
    loading: (message, options) => toast.loading(message, options),
    promise: (promise, options) => toast.promise(promise, options),
    dismiss: (id) => toast.dismiss(id),
}
