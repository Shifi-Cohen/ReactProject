import axios, { isAxiosError } from 'axios'
import type { AxiosError } from 'axios'

const http = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
})

type UnauthorizedHandler = (token: string) => void

let onUnauthorized: UnauthorizedHandler = () => {}

export function setUnauthorizedHandler(handler: UnauthorizedHandler) {
  onUnauthorized = handler
}

function readBearerToken(error: AxiosError) {
  const headers = error.config?.headers
  if (!headers) {
    return ''
  }

  const authorization = typeof headers.get === 'function'
    ? headers.get('Authorization')
    : headers.Authorization

  if (typeof authorization !== 'string' || !authorization.startsWith('Bearer ')) {
    return ''
  }

  return authorization.slice('Bearer '.length).trim()
}

http.interceptors.response.use(
  (response) => response,
  (error: unknown) => {
    if (isAxiosError(error) && error.response?.status === 401) {
      const token = readBearerToken(error)
      if (token) {
        onUnauthorized(token)
      }
    }

    return Promise.reject(error)
  },
)

export function authHeader(token: string) {
  return {
    Authorization: `Bearer ${token}`,
  }
}

export default http
