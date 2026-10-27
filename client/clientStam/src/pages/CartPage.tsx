import { useState, type ReactNode } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { Link, useNavigate } from 'react-router-dom'
import { deleteCartItem, moveGuestCart, updateCartItem } from '../api/cart'
import { useAuth } from '../context/AuthContext'
import { useGuestCart } from '../context/GuestCartContext'
import { useCartRows, type CartRow } from '../hooks/useCartRows'
import { readServerMessage } from '../lib/serverMessage'
import { pageClass, pageTitleClass, cardClass, cardTitleClass, buttonClass, smallButtonClass, goldTextClass, textLinkClass } from '../lib/styles'

function CartPage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { token, user } = useAuth()
  const { items, mergeFailed, addItem, decreaseItem, removeItem, setSelected, clearItems, markMergeFailed, clearMergeFailed } = useGuestCart()
  const { rows: shownItems, isLoading, isError, error } = useCartRows()
  const [cartMessage, setCartMessage] = useState('')
  const [retryNotice, setRetryNotice] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [isRetrying, setIsRetrying] = useState(false)
  const pendingItems = user && mergeFailed ? items : []
  const selectedCount = shownItems.filter((item) => item.selected).length

  function toggleRow({ id, selected }: CartRow) {
    if (user) {
      if (!token) {
        return
      }

      sendCartRequest(
        updateCartItem({ token, itemId: id, selected: !selected }),
        'לא הצלחנו לעדכן את הבחירה',
      )
      return
    }

    setSelected({ productId: id, selected: !selected })
  }

  function openInquiry() {
    navigate('/inquiry')
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

  async function retryMerge() {
    if (!token || isRetrying) {
      return
    }

    setRetryNotice('')
    setIsRetrying(true)
    const { notice, failed } = await moveGuestCart({
      token,
      items,
      clearItems,
      markMergeFailed,
      clearMergeFailed,
    })
    await queryClient.invalidateQueries({ queryKey: ['cart'] })

    if (!failed && notice) {
      setRetryNotice(notice)
    }

    setIsRetrying(false)
  }

  function removeShownRow({ id }: CartRow) {
    if (user) {
      removeCartRow({ itemId: id })
      return
    }

    removeItem({ productId: id })
  }

  let cartList: ReactNode = (
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
  } else if (shownItems.length === 0 && pendingItems.length > 0) {
    cartList = null
  } else if (shownItems.length > 0) {
    cartList = (
      <ul className="stack-loose">
        {shownItems.map((item) => (
            <li key={item.id} className={cardClass}>
              <img src={item.imageUrl} alt={item.name} className="media-short" />
              <div className="card-body">
                <label className="check-row">
                  <input
                    type="checkbox"
                    checked={item.selected}
                    onChange={() => toggleRow(item)}
                    disabled={Boolean(user) && isSaving}
                    className="check"
                  />
                  לצרף לפנייה
                </label>
                <h2 className={cardTitleClass}>{item.name}</h2>
                <p className="line">כמות: {item.quantity}</p>
                <div className="actions">
                  <button
                    type="button"
                    onClick={() => lowerQuantity(item)}
                    disabled={Boolean(user) && isSaving}
                    className={smallButtonClass}
                  >
                   -
                  </button>
                  <button
                    type="button"
                    onClick={() => raiseQuantity(item)}
                    disabled={Boolean(user) && isSaving}
                    className={smallButtonClass}
                  >
                    +
                  </button>
                  <button
                    type="button"
                    onClick={() => removeShownRow(item)}
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
      {pendingItems.length > 0 ? (
        <div className="section-gap">
          <p className="lead">הפריטים האלה עדיין לא עברו לחשבון</p>
          <ul className="stack-loose">
            {pendingItems.map(({ productId, name, imageUrl, quantity }) => (
              <li key={productId} className={cardClass}>
                <img src={imageUrl} alt={name} className="media-short" />
                <div className="card-body">
                  <h2 className={cardTitleClass}>{name}</h2>
                  <p className="line">כמות: {quantity}</p>
                </div>
              </li>
            ))}
          </ul>
          <button
            type="button"
            onClick={retryMerge}
            disabled={isRetrying}
            className={`${buttonClass} stack-top`}
          >
            {isRetrying ? 'עובר...' : 'נסה שוב'}
          </button>
        </div>
      ) : null}
      {retryNotice ? <p className="status" role="status">{retryNotice}</p> : null}
      {cartList}
      {user && cartMessage ? <p className={`${goldTextClass} stack-top`}>{cartMessage}</p> : null}
      {shownItems.length > 0 ? (
        <div className="section-gap">
          <p className="lead">נבחרו {selectedCount} קולמוסים</p>
          <button
            type="button"
            onClick={openInquiry}
            disabled={selectedCount === 0 || (Boolean(user) && isSaving)}
            className={buttonClass}
          >
            המשך לפנייה
          </button>
          {selectedCount === 0 ? (
            <p className="hint">סמן לפחות קולמוס אחד</p>
          ) : null}
        </div>
      ) : null}
    </div>
  )
}

export default CartPage
