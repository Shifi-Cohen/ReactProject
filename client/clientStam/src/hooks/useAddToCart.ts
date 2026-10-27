import { useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { addCartItem } from '../api/cart'
import { useAuth } from '../context/AuthContext'
import { useGuestCart } from '../context/GuestCartContext'
import { readServerMessage } from '../lib/serverMessage'

type AddToCartInput = {
  productId: number
  name: string
  imageUrl: string
  isAvailable: boolean
}

export function useAddToCart() {
  const queryClient = useQueryClient()
  const { token, user } = useAuth()
  const { addItem } = useGuestCart()
  const [addedMessage, setAddedMessage] = useState('')
  const [errorMessage, setErrorMessage] = useState('')
  const [isAdding, setIsAdding] = useState(false)

  async function addToCart({ productId, name, imageUrl, isAvailable }: AddToCartInput) {
    if (!isAvailable || isAdding) {
      return
    }

    setAddedMessage('')
    setErrorMessage('')

    if (!user) {
      addItem({ productId, name, imageUrl })
      setAddedMessage('המוצר נוסף בהצלחה')
      return
    }

    if (!token) {
      setErrorMessage('אין התחברות')
      return
    }

    setIsAdding(true)

    try {
      await addCartItem({ token, productId })
      await queryClient.invalidateQueries({ queryKey: ['cart'] })
      setAddedMessage('המוצר נוסף בהצלחה')
    } catch (error) {
      setErrorMessage(readServerMessage(error, 'לא הצלחנו להוסיף לסל'))
    }

    setIsAdding(false)
  }

  return {
    addToCart,
    addedMessage,
    errorMessage,
    isAdding,
  }
}
