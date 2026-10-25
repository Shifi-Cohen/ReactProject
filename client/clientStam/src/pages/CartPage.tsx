import { useRef, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { Link, useNavigate } from 'react-router-dom'
import { deleteCartItem, updateCartItem } from '../api/cart'
import { useAuth } from '../context/AuthContext'
import { useGuestCart } from '../context/GuestCartContext'
import { useCartRows, type CartRow } from '../hooks/useCartRows'
import { readServerMessage } from '../lib/serverMessage'
import { pageClass, pageTitleClass, cardClass, cardTitleClass, buttonClass, smallButtonClass, goldTextClass, textLinkClass } from '../lib/styles'

function CartPage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { token, user } = useAuth()
  const { addItem, decreaseItem, removeItem } = useGuestCart()
  const { rows: shownItems, isLoading, isError, error } = useCartRows()
  const [cartMessage, setCartMessage] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [selectedIds, setSelectedIds] = useState<number[]>([])
  const knownIds = useRef<number[] | null>(null)

  function toggleRow({ id }: { id: number }) {
    const alreadySelected = selectedIds.includes(id)

    if (alreadySelected) {
      const nextIds = selectedIds.filter((selectedId) => selectedId !== id)
      setSelectedIds(nextIds)
      return
    }

    setSelectedIds([...selectedIds, id])
  }

  function openInquiry() {
    navigate('/inquiry', { state: { selectedIds } })
  }

  async function sendCartRequest(request: Promise<unknown>, fallback: string) {
    setCartMessage('')
    setIsSaving(true)

    try {
      await request
      await queryClient.invalidateQueries({ queryKey: ['cart'] })
      setIsSaving(false)
    } catch (requestError) {
      setCartMessage(readServerMessage(requestError, fallback))
      setIsSaving(false)
    }
  }

  function changeQuantity({ itemId, quantity }: { itemId: number; quantity: number }) {
    if (!token) {
      return
    }

    sendCartRequest(updateCartItem({ token, itemId, quantity }), 'לא הצלחנו לעדכן את הכמות')
  }

  function removeCartRow({ itemId }: { itemId: number }) {
    if (!token) {
      return
    }

    sendCartRequest(deleteCartItem({ token, itemId }), 'לא הצלחנו להסיר את הקולמוס')
  }

  function lowerQuantity({ id, quantity }: CartRow) {
    if (user) {
      changeQuantity({ itemId: id, quantity: quantity - 1 })
      return
    }

    decreaseItem({ productId: id })
  }

  function raiseQuantity({ id, name, imageUrl, quantity }: CartRow) {
    if (user) {
      changeQuantity({ itemId: id, quantity: quantity + 1 })
      return
    }

    addItem({ productId: id, name, imageUrl })
  }

  function removeShownRow({ id }: CartRow) {
    if (user) {
      removeCartRow({ itemId: id })
      return
    }

    removeItem({ productId: id })
  }

  const shownIds = shownItems.map(({ id }) => id).join(',')
  const ids = shownIds ? shownIds.split(',').map((value) => Number(value)) : []
  const previousIds = knownIds.current

  if (previousIds === null || previousIds.join(',') !== shownIds) {
    knownIds.current = ids

    if (previousIds === null || previousIds.length === 0) {
      setSelectedIds(ids)
    } else {
      const addedIds = ids.filter((id) => !previousIds.includes(id))
      setSelectedIds((currentIds) => {
        const keptIds = currentIds.filter((id) => ids.includes(id))
        return [...keptIds, ...addedIds]
      })
    }
  }

  let cartList = (
    <div>
      <p className="notice">הסל ריק</p>
      <Link to="/products" className={textLinkClass}>
        הקולמוסים שלנו
      </Link>
    </div>
  )

  if (isLoading) {
    cartList = <p className="notice">טוען...</p>
  } else if (isError) {
    cartList = <p className="notice">{readServerMessage(error, 'לא הצלחנו לטעון את הסל')}</p>
  } else if (shownItems.length > 0) {
    cartList = (
      <ul className="stack-loose">
        {shownItems.map(({ id, name, imageUrl, quantity }) => (
            <li key={id} className={cardClass}>
              <img src={imageUrl} alt={name} className="media-short" />
              <div className="card-body">
                <label className="check-row">
                  <input
                    type="checkbox"
                    checked={selectedIds.includes(id)}
                    onChange={() => toggleRow({ id })}
                    className="check"
                  />
                  לצרף לפנייה
                </label>
                <h2 className={cardTitleClass}>{name}</h2>
                <p className="line">כמות: {quantity}</p>
                <div className="actions">
                  <button
                    type="button"
                    onClick={() => lowerQuantity({ id, name, imageUrl, quantity })}
                    disabled={Boolean(user) && isSaving}
                    className={smallButtonClass}
                  >
                   -
                  </button>
                  <button
                    type="button"
                    onClick={() => raiseQuantity({ id, name, imageUrl, quantity })}
                    disabled={Boolean(user) && isSaving}
                    className={smallButtonClass}
                  >
                    +
                  </button>
                  <button
                    type="button"
                    onClick={() => removeShownRow({ id, name, imageUrl, quantity })}
                    disabled={Boolean(user) && isSaving}
                    className="btn-danger"
                  >
                    הסרה
                  </button>
                </div>
              </div>
            </li>
        ))}
      </ul>
    )
  }

  return (
    <div className={pageClass}>
      <h1 className={pageTitleClass}>הסל</h1>
      {cartList}
      {user && cartMessage ? <p className={`${goldTextClass} stack-top`}>{cartMessage}</p> : null}
      {shownItems.length > 0 ? (
        <div className="section-gap">
          <p className="lead">נבחרו {selectedIds.length} קולמוסים</p>
          <button
            type="button"
            onClick={openInquiry}
            disabled={selectedIds.length === 0}
            className={buttonClass}
          >
            המשך לפנייה
          </button>
          {selectedIds.length === 0 ? (
            <p className="hint">סמני לפחות קולמוס אחד</p>
          ) : null}
        </div>
      ) : null}
    </div>
  )
}

export default CartPage
