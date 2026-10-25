export function requireToken(token: string | null) {
  if (!token) {
    throw new Error('אין התחברות')
  }

  return token
}
