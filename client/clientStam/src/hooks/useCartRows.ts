import { useQuery } from '@tanstack/react-query'
import { getCart } from '../api/cart'
import { useAuth } from '../context/AuthContext'
import { useGuestCart } from '../context/GuestCartContext'
import { requireToken } from '../lib/requireToken'
import type { ScriptChoice } from '../lib/inquiryLabels'

export type CartRow = {
  id: number
  name: string
  imageUrl: string
  quantity: number
  selected: boolean
  script: ScriptChoice | null
}

export function useCartRows() {
  const { token, user } = useAuth()
  const { items } = useGuestCart()

  const { data: cart, isPending, isError, error } = useQuery({
    queryKey: ['cart'],
    queryFn: () => getCart({ token: requireToken(token) }),
    enabled: Boolean(user) && Boolean(token),
  })

  let rows: CartRow[] = []

  if (user && cart) {
    rows = cart.items.map(({ id, quantity, selected, script, product }) => {
      return {
        id,
        name: product.name,
        imageUrl: product.imageUrl,
        quantity,
        selected,
        script,
      }
    })
  }

  if (!user) {
    rows = items.map(({ productId, name, imageUrl, quantity, selected, script }) => {
      return {
        id: productId,
        name,
        imageUrl,
        quantity,
        selected,
        script,
      }
    })
  }

  return {
    rows,
    isLoading: Boolean(user) && isPending,
    isError: Boolean(user) && isError,
    error,
  }
}
