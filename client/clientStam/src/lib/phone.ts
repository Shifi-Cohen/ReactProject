function localIsraeliPhone(phone: string) {
  let text = phone.trim().replace(/[\s().-]/g, '')

  if (text.startsWith('+')) {
    text = text.slice(1)
  }

  if (text.startsWith('00')) {
    text = text.slice(2)
  }

  if (text.startsWith('972')) {
    text = `0${text.slice(3)}`
  }

  return text
}

export function isValidIsraeliPhone(phone: string) {
  const local = localIsraeliPhone(phone)
  return /^0(?:[23489]\d{7}|5\d{8}|7[2-9]\d{7})$/.test(local)
}

export function validatePhone(phone: string) {
  if (!phone.trim()) {
    return 'יש להזין טלפון.'
  }

  if (isValidIsraeliPhone(phone)) {
    return true
  }

  return 'יש להזין טלפון ישראלי תקין.'
}
