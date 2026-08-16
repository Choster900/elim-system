export const ACCESS_TOKEN_TTL_SECONDS = 60 * 15
export const REFRESH_TOKEN_TTL_SECONDS = 60 * 60 * 24 * 7
export const BCRYPT_SALT_ROUNDS = 12
export const ACCESS_TOKEN_COOKIE_NAME = 'access_token'
export const REFRESH_TOKEN_COOKIE_NAME = 'refresh_token'

// Roles that bypass the sector-scoped filtering on offerings/meetings.
export const OFFERING_SEES_ALL_ROLE_CODES = ['SUPER_ADMIN', 'ADMINISTRATOR', 'FINANCE']
export const SUPERVISOR_ROLE_CODE = 'SUPERVISOR'
