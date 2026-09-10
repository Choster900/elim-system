export interface RequestPasswordResetDto {
    email: string
}

export interface ValidatePasswordResetDto {
    resetToken: string
}

export interface ResetPasswordDto {
    resetToken: string
    newPassword: string
}
