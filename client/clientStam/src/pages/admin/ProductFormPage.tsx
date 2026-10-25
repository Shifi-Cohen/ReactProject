import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useNavigate, useParams } from 'react-router-dom'
import { getCategories } from '../../api/categories'
import { createProduct, getProduct, updateProduct, type ProductInput } from '../../api/products'
import ProductForm, { type ProductFormValues } from '../../components/ProductForm'
import { useAuth } from '../../context/AuthContext'
import { requireToken } from '../../lib/requireToken'
import { readServerMessage } from '../../lib/serverMessage'
import { pageClass, pageTitleClass } from '../../lib/styles'

const emptyProduct: ProductFormValues = {
  name: '',
  description: '',
  categoryId: '',
  imageUrl: '',
  isAvailable: true,
}

function ProductFormPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { token } = useAuth()
  const isEdit = Boolean(id)

  const categoriesQuery = useQuery({
    queryKey: ['categories'],
    queryFn: () => getCategories(),
  })

  const productQuery = useQuery({
    queryKey: ['product', id, 'admin'],
    queryFn: () => getProduct(id ?? '', token),
    enabled: isEdit,
  })

  const saveProduct = useMutation({
    mutationFn: (product: ProductInput) => {
      const adminToken = requireToken(token)

      if (id) {
        return updateProduct({ token: adminToken, id: Number(id), product })
      }

      return createProduct({ token: adminToken, product })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] })
      queryClient.invalidateQueries({ queryKey: ['product'] })
      queryClient.invalidateQueries({ queryKey: ['categories'] })
      navigate('/admin/products')
    },
  })

  const title = isEdit ? 'עריכת קולמוס' : 'קולמוס חדש'
  let content = <p className="notice">טוען...</p>

  if (categoriesQuery.isError) {
    content = <p className="notice">{readServerMessage(categoriesQuery.error, 'לא הצלחנו לטעון את הקטגוריות')}</p>
  } else if (productQuery.isError) {
    content = <p className="notice">{readServerMessage(productQuery.error, 'לא הצלחנו לטעון את הקולמוס')}</p>
  } else if (categoriesQuery.data && categoriesQuery.data.length === 0) {
    content = <p className="notice">אין קטגוריות</p>
  } else if (categoriesQuery.data && (!isEdit || productQuery.data)) {
    let defaultValues = emptyProduct
    const existing = productQuery.data

    if (existing) {
      defaultValues = {
        name: existing.name,
        description: existing.description,
        categoryId: String(existing.categoryId),
        imageUrl: existing.imageUrl,
        isAvailable: existing.isAvailable,
      }
    }

    let serverMessage = ''

    if (saveProduct.isError) {
      serverMessage = readServerMessage(saveProduct.error, 'לא הצלחנו לשמור את הקולמוס')
    }

    content = (
      <ProductForm
        key={id ?? 'new'}
        defaultValues={defaultValues}
        categories={categoriesQuery.data}
        isSaving={saveProduct.isPending}
        serverMessage={serverMessage}
        onSave={(product) => saveProduct.mutate(product)}
      />
    )
  }

  return (
    <div className={pageClass}>
      <h1 className={pageTitleClass}>{title}</h1>
      {content}
    </div>
  )
}

export default ProductFormPage
