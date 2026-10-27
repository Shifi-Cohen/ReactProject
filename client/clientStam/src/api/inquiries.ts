import http, { authHeader } from './http'
import type { ScriptChoice } from '../lib/inquiryLabels'

export type Inquiry = {
  id: number
  script: string
  contactEmail: string
  contactPhone: string
  message: string | null
  status: string
  createdAt: string
  user: {
    fullName: string
    phone: string | null
  } | null
  items: {
    id: number
    quantity: number
    script: string
    product: {
      name: string
    }
  }[]
}

type InquiryItemInput = {
  productId: number
  quantity: number
  script: ScriptChoice
}

type CreateInquiryInput = {
  contactEmail: string
  contactPhone: string
  message: string
  items: InquiryItemInput[]
}

export async function createInquiry({
  contactEmail,
  contactPhone,
  message,
  items,
}: CreateInquiryInput) {
  const response = await http.post('/inquiries', {
    contactEmail,
    contactPhone,
    message,
    items,
  })

  return response.data.inquiry
}

type CreateInquiryFromCartInput = {
  token: string
  items: {
    id: number
    script: ScriptChoice
  }[]
  contactEmail: string
  contactPhone: string
  message: string
}

export async function createInquiryFromCart({
  token,
  items,
  contactEmail,
  contactPhone,
  message,
}: CreateInquiryFromCartInput) {
  const response = await http.post(
    '/inquiries/from-cart',
    { items, contactEmail, contactPhone, message },
    {
      headers: authHeader(token),
    },
  )

  const inquiry: Inquiry = response.data.inquiry
  return inquiry
}

type GetMyInquiriesInput = {
  token: string
  userId: number
}

export async function getMyInquiries({ token, userId }: GetMyInquiriesInput) {
  const response = await http.get(`/inquiries/my-inquiries/${userId}`, {
    headers: authHeader(token),
  })

  const inquiries: Inquiry[] = response.data.inquiries
  return inquiries
}

type GetAllInquiriesInput = {
  token: string
  status: string
}

type StatusParams = {
  status?: string
}

export async function getAllInquiries({ token, status }: GetAllInquiriesInput) {
  const params: StatusParams = {}

  if (status) {
    params.status = status
  }

  const response = await http.get('/inquiries', { params, headers: authHeader(token) })
  const inquiries: Inquiry[] = response.data.inquiries
  return inquiries
}

type UpdateInquiryStatusInput = {
  token: string
  id: number
  status: string
}

export async function updateInquiryStatus({ token, id, status }: UpdateInquiryStatusInput) {
  await http.put(`/inquiries/${id}/status`, { status }, { headers: authHeader(token) })
}
