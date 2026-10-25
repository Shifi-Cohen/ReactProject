import axios from 'axios'

const http = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
})

export function authHeader(token: string) {
  return {
    Authorization: `Bearer ${token}`,
  }
}

export default http
