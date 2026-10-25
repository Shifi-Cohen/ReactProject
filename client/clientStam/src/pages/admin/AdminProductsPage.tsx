import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { Pencil, Plus, Trash2 } from 'lucide-react'
import { deleteProduct, getProducts } from '../../api/products'
import { useAuth } from '../../context/AuthContext'
import { confirmDelete } from '../../lib/confirmDelete'
import { requireToken } from '../../lib/requireToken'
import { readServerMessage } from '../../lib/serverMessage'
import { pageTitleClass, cardTitleClass, smallButtonClass, formMessageClass } from '../../lib/styles'

function AdminProductsPage() {
  const queryClient = useQueryClient()
  const { token } = useAuth()

  const { data: products, isError, error } = useQuery({
    queryKey: ['products', 'admin'],
    queryFn: () => getProducts({ token: requireToken(token) }),
  })

  const removeProduct = useMutation({
    mutationFn: (id: number) => deleteProduct({ token: requireToken(token), id }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] })
      queryClient.invalidateQueries({ queryKey: ['categories'] })
    },
  })

  function askToDelete({ id, name }: { id: number; name: string }) {
    if (confirmDelete(name)) {
      removeProduct.mutate(id)
    }
  }

  let content = <p className="notice">טוען...</p>

  if (isError) {
    content = <p className="notice">{readServerMessage(error, 'לא הצלחנו לטעון את הקולמוסים')}</p>
  } else if (products && products.length === 0) {
    content = <p className="notice">אין קולמוסים</p>
  } else if (products) {
    content = (
      <ul className="admin-list">
        {products.map(({ id, name, category, isAvailable }) => (
          <li key={id} className="card card-pad admin-row">
            <div>
              <h2 className={cardTitleClass}>{name}</h2>
              <p className="line">{category.name}</p>
              <p className="line">{isAvailable ? 'זמין' : 'לא זמין'}</p>
            </div>
            <div className="actions-plain">
              <Link to={`/admin/products/${id}/edit`} className={smallButtonClass}>
                <Pencil aria-hidden="true" />
                עריכה
              </Link>
              <button
                type="button"
                onClick={() => askToDelete({ id, name })}
                disabled={removeProduct.isPending}
                className="btn-danger"
              >
                <Trash2 aria-hidden="true" />
                מחיקה
              </button>
            </div>
          </li>
        ))}
      </ul>
    )
  }

  return (
    <div className="page-wide">
      <div className="admin-head">
        <h1 className={pageTitleClass}>מוצרים</h1>
        <Link to="/admin/products/new" className="btn">
          <Plus aria-hidden="true" />
          קולמוס חדש
        </Link>
      </div>
      {removeProduct.isError ? (
        <p className={formMessageClass}>
          {readServerMessage(removeProduct.error, 'לא הצלחנו למחוק את הקולמוס')}
        </p>
      ) : null}
      {content}
    </div>
  )
}

export default AdminProductsPage
