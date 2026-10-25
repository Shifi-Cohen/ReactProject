import type { AuthUser } from '../context/AuthContext'
import http, { authHeader } from './http'

type UpdateUserInput = {
  token: string
  id: number
  fullName: string
  email: string
  phone: string
  password: string
}

type UserBody = {
  fullName?: string
  email?: string
  phone?: string
  password?: string
}

export async function updateUser({ token, id, fullName, email, phone, password }: UpdateUserInput) {
  const body: UserBody = {}
  const cleanName = fullName.trim()
  const cleanEmail = email.trim()
  const cleanPhone = phone.trim()

  if (cleanName) {
    body.fullName = cleanName
  }

  if (cleanEmail) {
    body.email = cleanEmail
  }

  if (cleanPhone) {
    body.phone = cleanPhone
  }

  if (password) {
    body.password = password
  }

  const response = await http.put(`/users/${id}`, body, {
    headers: authHeader(token),
  })

  const data = response.data.user
  const user: AuthUser = {
    id: data.id,
    email: data.email,
    fullName: data.fullName,
    phone: data.phone,
    role: data.role,
  }

  return user
}
