import http, { authHeader } from './http'

export type Product = {
  id: number
  name: string
  description: string
  categoryId: number
  imageUrl: string
  isAvailable: boolean
  createdAt: string
  category: {
    id: number
    name: string
    description: string | null
  }
}

export type ProductInput = {
  name: string
  description: string
  categoryId: number
  imageUrl: string
  isAvailable: boolean
}

type ProductFilters = {
  search?: string
  categoryId?: number
  token?: string | null
}

type Params = {
  search?: string
  categoryId?: number
}

function tokenHeaders(token?: string | null) {
  if (!token) {
    return {}
  }

  return authHeader(token)
}

export async function getProducts({ search, categoryId, token }: ProductFilters = {}) {
  const params: Params = {}

  if (search) {
    params.search = search
  }

  if (categoryId) {
    params.categoryId = categoryId
  }

  const response = await http.get('/products', { params, headers: tokenHeaders(token) })
  const products: Product[] = response.data.products
  return products
}

export async function getProduct(id: string, token?: string | null) {
  const response = await http.get(`/products/${id}`, { headers: tokenHeaders(token) })
  const product: Product = response.data.product
  return product
}

type CreateProductInput = {
  token: string
  product: ProductInput
}

export async function createProduct({ token, product }: CreateProductInput) {
  const response = await http.post('/products', product, { headers: authHeader(token) })
  const created: Product = response.data.product
  return created
}

type UpdateProductInput = {
  token: string
  id: number
  product: ProductInput
}

export async function updateProduct({ token, id, product }: UpdateProductInput) {
  const response = await http.put(`/products/${id}`, product, { headers: authHeader(token) })
  const updated: Product = response.data.product
  return updated
}

type DeleteProductInput = {
  token: string
  id: number
}

export async function deleteProduct({ token, id }: DeleteProductInput) {
  await http.delete(`/products/${id}`, { headers: authHeader(token) })
}
