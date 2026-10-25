export function notEmpty(message: string) {
  return (value: string) => {
    if (value.trim()) {
      return true
    }

    return message
  }
}
