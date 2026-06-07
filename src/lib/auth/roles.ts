export const USER_ROLES = ["company", "researcher", "verifier"] as const

export type UserRole = (typeof USER_ROLES)[number]

export type RoleUser = {
  id: string
  role: string
}

export class AuthError extends Error {
  status: number

  constructor(message: string, status: number) {
    super(message)
    this.name = "AuthError"
    this.status = status
  }
}

export function isRole(value: unknown): value is UserRole {
  return typeof value === "string" && USER_ROLES.includes(value as UserRole)
}

export function assertUserRole<T extends RoleUser>(
  user: T | null | undefined,
  allowedRoles: UserRole | UserRole[],
): T {
  if (!user) throw new AuthError("Authentication required", 401)

  const roles = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles]
  if (!isRole(user.role) || !roles.includes(user.role)) {
    throw new AuthError("Insufficient role for this action", 403)
  }

  return user
}
