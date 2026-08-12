interface HttpErrorLike {
    message?: string
    details?: {
        message?: string
    }
}

export function resolveHttpErrorMessage(error: unknown, fallbackMessage: string) {
    const httpError = error as HttpErrorLike | undefined
    return httpError?.details?.message ?? httpError?.message ?? fallbackMessage
}
