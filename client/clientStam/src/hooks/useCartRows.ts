import { useQuery } from '@tanstack/react-query'
import { getCart } from '../api/cart'
import { useAuth } from '../context/AuthContext'
import { useGuestCart } from '../context/GuestCartContext'
import { requireToken } from '../lib/requireToken'

export type CartRow = {
  id: number
  name: string
  imageUrl: string
  quantity: number
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
    rows = cart.items.map(({ id, quantity, product }) => {
      return {
        id,
        name: product.name,
        imageUrl: product.imageUrl,
        quantity,
      }
    })
  }

  if (!user) {
    rows = items.map(({ productId, name, imageUrl, quantity }) => {
      return {
        id: productId,
        name,
        imageUrl,
        quantity,
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
