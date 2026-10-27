import { ShoppingBag } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useAddToCart } from '../hooks/useAddToCart'
import { cardClass, cardTitleClass, buttonClass, errorClass } from '../lib/styles'

type ProductCardProps = {
  id: number
  name: string
  description: string
  imageUrl: string
  categoryName: string
  isAvailable: boolean
}

function ProductCard({ id, name, description, imageUrl, categoryName, isAvailable }: ProductCardProps) {
  const { addToCart, addedMessage, errorMessage, isAdding } = useAddToCart()

  function addThisProduct() {
    addToCart({ productId: id, name, imageUrl, isAvailable })
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
          onClick={addThisProduct}
          disabled={!isAvailable || isAdding}
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
        {errorMessage ? <p className={errorClass}>{errorMessage}</p> : null}
      </div>
    </div>
  )
}

export default ProductCard
