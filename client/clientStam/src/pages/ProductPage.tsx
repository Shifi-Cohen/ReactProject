import { useQuery } from '@tanstack/react-query'
import { isAxiosError } from 'axios'
import { useParams } from 'react-router-dom'
import { getProduct } from '../api/products'
import { useAddToCart } from '../hooks/useAddToCart'
import { readServerMessage } from '../lib/serverMessage'
import { pageClass, pageTitleClass, goldTextClass, errorClass } from '../lib/styles'

function ProductPage() {
  const { id } = useParams()
  const { addToCart, addedMessage, errorMessage, isAdding } = useAddToCart()

  const { data: product, isPending, isError, error } = useQuery({
    queryKey: ['product', id],
    queryFn: () => getProduct(id ?? ''),
    enabled: Boolean(id),
    retry: (failureCount, queryError) => {
      const status = isAxiosError(queryError) ? queryError.response?.status : undefined

      if (status && status < 500) {
        return false
      }

      return failureCount < 2
    },
  })

  if (!id) {
    return <p className="notice">המוצר לא נמצא</p>
  }

  if (isPending) {
    return <p className="notice">טוען...</p>
  }

  if (isError) {
    if (isAxiosError(error) && error.response?.status === 404) {
      return <p className="notice">המוצר לא נמצא</p>
    }

    return <p className="notice">{readServerMessage(error, 'לא הצלחנו לטעון את הקולמוס')}</p>
  }

  if (!product) {
    return <p className="notice">המוצר לא נמצא</p>
  }

  const { id: productId, name, imageUrl, description, isAvailable, category } = product

  function addThisProduct() {
    addToCart({ productId, name, imageUrl, isAvailable })
  }

  return (
    <article className={pageClass}>
      <img src={imageUrl} alt={name} className="media-tall" />
      <h1 className={`${pageTitleClass} product-title`}>{name}</h1>
      <p className={goldTextClass}>{category.name}</p>
      <p className="prose-gap">{description}</p>
      <p className="block-gap">{isAvailable ? 'זמין' : 'לא זמין'}</p>
      <button
        type="button"
        onClick={addThisProduct}
        disabled={!isAvailable || isAdding}
        className="btn btn-below"
      >
        הוספה לסל
      </button>
      {addedMessage ? (
        <p className="status" role="status">
          {addedMessage}
        </p>
      ) : null}
      {errorMessage ? <p className={errorClass}>{errorMessage}</p> : null}
    </article>
  )
}

export default ProductPage
