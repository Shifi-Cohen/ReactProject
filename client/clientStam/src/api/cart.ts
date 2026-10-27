import http, { authHeader } from './http'
import type { ScriptChoice } from '../lib/inquiryLabels'

type MergeItem = {
  productId: number
  name: string
  quantity: number
  selected?: boolean
  script?: ScriptChoice | null
}

type MergeGuestItemsInput = {
  token: string
  items: MergeItem[]
}

type MergeResult = {
  missingProductIds: number[]
  unavailableProductIds: number[]
}

function readIdList(value: unknown) {
  if (!Array.isArray(value)) {
    return []
  }

  const ids: number[] = []

  for (const entry of value) {
    if (typeof entry === 'number' && Number.isInteger(entry)) {
      ids.push(entry)
    }
  }

  return ids
}

function namesFor(items: MergeItem[], ids: number[]) {
  const names: string[] = []

  for (const id of ids) {
    const item = items.find((entry) => entry.productId === id)
    names.push(item ? item.name : 'קולמוס')
  }

  return names
}

function skippedLine(names: string[], reason: string) {
  if (names.length === 1) {
    return `הקולמוס ${names[0]} לא נוסף לסל כי הוא ${reason}.`
  }

  return `הקולמוסים ${names.join(', ')} לא נוספו לסל כי הם ${reason}.`
}

export const mergeFailedMessage = 'לא הצלחנו להעביר את הסל לחשבון.'

export function skippedCartNotice(items: MergeItem[], result: MergeResult) {
  const lines: string[] = []
  const missingNames = namesFor(items, result.missingProductIds)
  const unavailableNames = namesFor(items, result.unavailableProductIds)

  if (missingNames.length > 0) {
    lines.push(skippedLine(missingNames, 'לא קיים יותר'))
  }

  if (unavailableNames.length > 0) {
    lines.push(skippedLine(unavailableNames, 'לא זמין'))
  }

  return lines.join(' ')
}

async function mergeGuestItems({ token, items }: MergeGuestItemsInput) {
  if (items.length === 0) {
    return {
      missingProductIds: [],
      unavailableProductIds: [],
    }
  }

  const response = await http.post(
    '/cart/merge',
    {
      items: items.map(({ productId, quantity, selected, script }) => ({
        productId,
        quantity,
        selected: selected !== false,
        script: script ?? null,
      })),
    },
    {
      headers: authHeader(token),
    },
  )

  return {
    missingProductIds: readIdList(response.data.missingProductIds),
    unavailableProductIds: readIdList(response.data.unavailableProductIds),
  }
}

type MoveGuestCartInput = {
  token: string
  items: MergeItem[]
  clearItems: () => void
  markMergeFailed: () => void
  clearMergeFailed: () => void
}

export async function moveGuestCart({
  token,
  items,
  clearItems,
  markMergeFailed,
  clearMergeFailed,
}: MoveGuestCartInput) {
  try {
    const result = await mergeGuestItems({ token, items })
    clearItems()
    clearMergeFailed()
    return {
      notice: skippedCartNotice(items, result),
      failed: false,
    }
  } catch {
    markMergeFailed()
    return {
      notice: mergeFailedMessage,
      failed: true,
    }
  }
}

export type CartItem = {
  id: number
  quantity: number
  selected: boolean
  script: ScriptChoice | null
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

type AddCartItemInput = {
  token: string
  productId: number
}

export async function addCartItem({ token, productId }: AddCartItemInput) {
  const response = await http.post(
    '/cart/items',
    { productId, quantity: 1 },
    {
      headers: authHeader(token),
    },
  )

  const cart: Cart = response.data.cart
  return cart
}

type UpdateCartItemInput = {
  token: string
  itemId: number
  quantity?: number
  selected?: boolean
  script?: ScriptChoice
}

export async function updateCartItem({ token, itemId, quantity, selected, script }: UpdateCartItemInput) {
  const body: { quantity?: number; selected?: boolean; script?: ScriptChoice } = {}

  if (quantity !== undefined) {
    body.quantity = quantity
  }

  if (selected !== undefined) {
    body.selected = selected
  }

  if (script !== undefined) {
    body.script = script
  }

  const response = await http.put(
    `/cart/items/${itemId}`,
    body,
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
