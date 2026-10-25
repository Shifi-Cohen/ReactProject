import http, { authHeader } from './http'

export type Category = {
  id: number
  name: string
  description: string | null
  productCount: number
}

export type CategoryInput = {
  name: string
  description: string
}

export async function getCategories() {
  const response = await http.get('/categories')
  const categories: Category[] = response.data.categories
  return categories
}

type CreateCategoryInput = {
  token: string
  category: CategoryInput
}

export async function createCategory({ token, category }: CreateCategoryInput) {
  await http.post('/categories', category, { headers: authHeader(token) })
}

type UpdateCategoryInput = {
  token: string
  id: number
  category: CategoryInput
}

export async function updateCategory({ token, id, category }: UpdateCategoryInput) {
  await http.put(`/categories/${id}`, category, { headers: authHeader(token) })
}

type DeleteCategoryInput = {
  token: string
  id: number
}

export async function deleteCategory({ token, id }: DeleteCategoryInput) {
  await http.delete(`/categories/${id}`, { headers: authHeader(token) })
}
