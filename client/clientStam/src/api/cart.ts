import http, { authHeader } from './http'

type MergeItem = {
  productId: number
  quantity: number
}

type MergeGuestItemsInput = {
  token: string
  items: MergeItem[]
}

async function mergeGuestItems({ token, items }: MergeGuestItemsInput) {
  if (items.length === 0) {
    return
  }

  await http.post(
    '/cart/merge',
    { items },
    {
      headers: authHeader(token),
    },
  )
}

type MoveGuestCartInput = {
  token: string
  items: MergeItem[]
  clearItems: () => void
}

export async function moveGuestCart({ token, items, clearItems }: MoveGuestCartInput) {
  try {
    await mergeGuestItems({
      token,
      items: items.map(({ productId, quantity }) => ({ productId, quantity })),
    })
    clearItems()
  } catch {
    // הסל המקומי נשאר אם המיזוג נכשל
  }
}

export type CartItem = {
  id: number
  quantity: number
  product: {
    id: number
    name: string
    imageUrl: string
  }
}

export type Cart = {
  id: number
  items: CartItem[]
}

type GetCartInput = {
  token: string
}

export async function getCart({ token }: GetCartInput) {
  const response = await http.get('/cart', {
    headers: authHeader(token),
  })

  const cart: Cart = response.data.cart
  return cart
}

type UpdateCartItemInput = {
  token: string
  itemId: number
  quantity: number
}

export async function updateCartItem({ token, itemId, quantity }: UpdateCartItemInput) {
  const response = await http.put(
    `/cart/items/${itemId}`,
    { quantity },
    {
      headers: authHeader(token),
    },
  )

  const cart: Cart = response.data.cart
  return cart
}

type DeleteCartItemInput = {
  token: string
  itemId: number
}

export async function deleteCartItem({ token, itemId }: DeleteCartItemInput) {
  const response = await http.delete(`/cart/items/${itemId}`, {
    headers: authHeader(token),
  })

  const cart: Cart = response.data.cart
  return cart
}
