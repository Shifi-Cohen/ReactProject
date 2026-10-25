import { useState } from 'react'
import { ShoppingBag } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useGuestCart } from '../context/GuestCartContext'
import { cardClass, cardTitleClass, buttonClass } from '../lib/styles'

type ProductCardProps = {
  id: number
  name: string
  description: string
  imageUrl: string
  categoryName: string
  isAvailable: boolean
}

function ProductCard({ id, name, description, imageUrl, categoryName, isAvailable }: ProductCardProps) {
  const { addItem } = useGuestCart()
  const [addedMessage, setAddedMessage] = useState('')

  function addToCart() {
    if (!isAvailable) {
      return
    }

    addItem({ productId: id, name, imageUrl })
    setAddedMessage('המוצר נוסף בהצלחה')
  }

  let statusClass = 'product-status'

  if (!isAvailable) {
    statusClass = 'product-status is-off'
  }

  return (
    <div className={`${cardClass} product-card`}>
      <Link to={`/products/${id}`} className="card-link">
        <span className="product-frame">
          <img src={imageUrl} alt={name} />
        </span>
        <div className="card-body">
          <p className="product-tag">{categoryName}</p>
          <h2 className={cardTitleClass}>{name}</h2>
          <p className="product-copy">{description}</p>
          <p className={statusClass}>{isAvailable ? 'זמין' : 'לא זמין'}</p>
        </div>
      </Link>
      <div className="card-actions">
        <button
          type="button"
          onClick={addToCart}
          disabled={!isAvailable}
          className={buttonClass}
        >
          <ShoppingBag aria-hidden="true" />
          הוספה לסל
        </button>
        {addedMessage ? (
          <p className="status" role="status">
            {addedMessage}
          </p>
        ) : null}
      </div>
    </div>
  )
}

export default ProductCard
