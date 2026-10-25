import { isAxiosError } from 'axios'

export function readServerMessage(error: unknown, fallback: string) {
  if (isAxiosError<{ message?: string }>(error)) {
    const serverText = error.response?.data?.message

    if (serverText) {
      return serverText
    }
  }

  return fallback
}
