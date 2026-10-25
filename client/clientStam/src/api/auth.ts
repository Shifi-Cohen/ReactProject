import type { AuthUser } from '../context/AuthContext'
import http from './http'

type LoginInput = {
  email: string
  password: string
}

type SigninInput = {
  email: string
  fullName: string
  phone: string
  password: string
}

export async function login({ email, password }: LoginInput) {
  const response = await http.post('/auth/login', { email, password })
  const token: string = response.data.token
  const user: AuthUser = response.data.user
  return { token, user }
}

export async function signin({ email, fullName, phone, password }: SigninInput) {
  await http.post('/auth/signin', {
    email,
    fullName,
    phone,
    password,
  })
}
