import { createContext, useContext, useEffect, useState } from 'react'
import type { ReactNode } from 'react'

const storageKey = 'stam-guest-cart'//השם של הסל בLS

export type GuestCartItem = {
  productId: number
  name: string
  imageUrl: string
  quantity: number
}

type AddCartItem = {
  productId: number
  name: string
  imageUrl: string
}

type CartItemId = {
  productId: number
}

type GuestCartContextValue = {
  items: GuestCartItem[]
  addItem: (item: AddCartItem) => void
  decreaseItem: (item: CartItemId) => void
  removeItem: (item: CartItemId) => void
  clearItems: () => void
}

type GuestCartProviderProps = {
  children: ReactNode
}

const GuestCartContext = createContext<GuestCartContextValue | null>(null)

function readGuestCart() {
  const text = localStorage.getItem(storageKey)

  if (!text) {
    return []
  }

  try {
    const parsed: unknown = JSON.parse(text)

    if (!Array.isArray(parsed)) {
      return []
    }

    return parsed as GuestCartItem[]
  } catch {
    return []
  }
}

export function GuestCartProvider({ children }: GuestCartProviderProps) {
  const [items, setItems] = useState<GuestCartItem[]>(readGuestCart)

  useEffect(() => {
    localStorage.setItem(storageKey, JSON.stringify(items))
  }, [items])

  function addItem({ productId, name, imageUrl }: AddCartItem) {
    setItems((currentItems) => {
      const alreadyInCart = currentItems.find((item) => item.productId === productId)

      if (!alreadyInCart) {
        const newItem: GuestCartItem = {
          productId,
          name,
          imageUrl,
          quantity: 1,
        }

        return [...currentItems, newItem]
      }

      return currentItems.map((item) => {
        if (item.productId !== productId) {
          return item
        }

        return {
          ...item,
          quantity: item.quantity + 1,
        }
      })
    })
  }

  function decreaseItem({ productId }: CartItemId) {
    setItems((currentItems) => {
      const nextItems: GuestCartItem[] = []

      for (const item of currentItems) {
        if (item.productId !== productId) {
          nextItems.push(item)
          continue
        }

        if (item.quantity > 1) {
          nextItems.push({
            ...item,
            quantity: item.quantity - 1,
          })
        }
      }

      return nextItems
    })
  }

  function clearItems() {
    localStorage.setItem(storageKey, '[]')
    setItems([])
  }

  function removeItem({ productId }: CartItemId) {
    setItems((currentItems) => {
      const nextItems: GuestCartItem[] = []

      for (const item of currentItems) {
        if (item.productId !== productId) {
          nextItems.push(item)
        }
      }

      return nextItems
    })
  }

  return (
    <GuestCartContext.Provider value={{ items, addItem, decreaseItem, removeItem, clearItems }}>
      {children}
    </GuestCartContext.Provider>
  )
}

export function useGuestCart() {
  const cart = useContext(GuestCartContext)

  if (!cart) {
    throw new Error('useGuestCart צריך לשבת בתוך GuestCartProvider')
  }

  return cart
}
