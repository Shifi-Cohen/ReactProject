export function isValidEmail(email: string) {
  const text = email.trim()
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(text)
}

export function validateEmail(email: string) {
  if (isValidEmail(email)) {
    return true
  }

  return 'יש להזין כתובת מייל תקינה'
}
