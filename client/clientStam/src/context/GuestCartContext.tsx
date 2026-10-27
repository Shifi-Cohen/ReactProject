import { createContext, useContext, useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import { isScriptChoice, type ScriptChoice } from '../lib/inquiryLabels'

const storageKey = 'stam-guest-cart'//השם של הסל בLS
const mergeFailedKey = 'stam-guest-cart-merge-failed'

export type GuestCartItem = {
  productId: number
  name: string
  imageUrl: string
  quantity: number
  selected: boolean
  script: ScriptChoice | null
}

type AddCartItem = {
  productId: number
  name: string
  imageUrl: string
}

type CartItemId = {
  productId: number
}

type SetSelectedInput = {
  productId: number
  selected: boolean
}

type SetScriptInput = {
  productId: number
  script: ScriptChoice
}

type GuestCartContextValue = {
  items: GuestCartItem[]
  mergeFailed: boolean
  addItem: (item: AddCartItem) => void
  decreaseItem: (item: CartItemId) => void
  removeItem: (item: CartItemId) => void
  setSelected: (item: SetSelectedInput) => void
  setScript: (item: SetScriptInput) => void
  clearItems: () => void
  markMergeFailed: () => void
  clearMergeFailed: () => void
}

type GuestCartProviderProps = {
  children: ReactNode
}

const GuestCartContext = createContext<GuestCartContextValue | null>(null)

function readGuestItem(value: unknown) {
  if (typeof value !== 'object' || value === null) {
    return null
  }

  const item = value as Partial<GuestCartItem>

  if (typeof item.productId !== 'number' || typeof item.name !== 'string') {
    return null
  }

  if (typeof item.imageUrl !== 'string' || typeof item.quantity !== 'number') {
    return null
  }

  const guestItem: GuestCartItem = {
    productId: item.productId,
    name: item.name,
    imageUrl: item.imageUrl,
    quantity: item.quantity,
    selected: item.selected !== false,
    script: isScriptChoice(item.script) ? item.script : null,
  }

  return guestItem
}

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

    const items: GuestCartItem[] = []

    for (const entry of parsed) {
      const item = readGuestItem(entry)

      if (item) {
        items.push(item)
      }
    }

    return items
  } catch {
    return []
  }
}

function readMergeFailed() {
  return sessionStorage.getItem(mergeFailedKey) === '1'
}

export function GuestCartProvider({ children }: GuestCartProviderProps) {
  const [items, setItems] = useState<GuestCartItem[]>(readGuestCart)
  const [mergeFailed, setMergeFailed] = useState(readMergeFailed)

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
          selected: true,
          script: null,
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

  function markMergeFailed() {
    sessionStorage.setItem(mergeFailedKey, '1')
    setMergeFailed(true)
  }

  function clearMergeFailed() {
    sessionStorage.removeItem(mergeFailedKey)
    setMergeFailed(false)
  }

  function setScript({ productId, script }: SetScriptInput) {
    setItems((currentItems) => {
      return currentItems.map((item) => {
        if (item.productId !== productId) {
          return item
        }

        return {
          ...item,
          script,
        }
      })
    })
  }

  function setSelected({ productId, selected }: SetSelectedInput) {
    setItems((currentItems) => {
      return currentItems.map((item) => {
        if (item.productId !== productId) {
          return item
        }

        return {
          ...item,
          selected,
        }
      })
    })
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
    <GuestCartContext.Provider
      value={{
        items,
        mergeFailed,
        addItem,
        decreaseItem,
        removeItem,
        setSelected,
        setScript,
        clearItems,
        markMergeFailed,
        clearMergeFailed,
      }}
    >
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
