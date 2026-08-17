interface HttpErrorLike {
    message?: string
    details?: {
        message?: string
        error?: {
            details?: string | null
        }
    }
}

export function resolveHttpErrorMessage(error: unknown, fallbackMessage: string) {
    const httpError = error as HttpErrorLike | undefined
    return (
        httpError?.details?.error?.details ??
        httpError?.details?.message ??
        httpError?.message ??
        fallbackMessage
    )
}
