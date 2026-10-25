import { useState } from 'react'
import { Pencil, Trash2 } from 'lucide-react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import {
  createCategory,
  deleteCategory,
  getCategories,
  updateCategory,
  type Category,
  type CategoryInput,
} from '../../api/categories'
import { useAuth } from '../../context/AuthContext'
import { confirmDelete } from '../../lib/confirmDelete'
import { notEmpty } from '../../lib/notEmpty'
import { requireToken } from '../../lib/requireToken'
import { readServerMessage } from '../../lib/serverMessage'
import { pageTitleClass, cardTitleClass, buttonClass, smallButtonClass, inputClass, errorClass, formMessageClass } from '../../lib/styles'

const emptyCategory: CategoryInput = {
  name: '',
  description: '',
}

function AdminCategoriesPage() {
  const queryClient = useQueryClient()
  const { token } = useAuth()
  const [editingId, setEditingId] = useState<number | null>(null)
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CategoryInput>({ defaultValues: emptyCategory })

  const { data: categories, isError, error } = useQuery({
    queryKey: ['categories'],
    queryFn: () => getCategories(),
  })

  function refreshCategories() {
    queryClient.invalidateQueries({ queryKey: ['categories'] })
  }

  function startEditing({ id, name, description }: Category) {
    setEditingId(id)
    reset({ name, description: description ?? '' })
  }

  function stopEditing() {
    setEditingId(null)
    reset(emptyCategory)
  }

  const saveCategory = useMutation({
    mutationFn: (category: CategoryInput) => {
      const adminToken = requireToken(token)

      if (editingId) {
        return updateCategory({ token: adminToken, id: editingId, category })
      }

      return createCategory({ token: adminToken, category })
    },
    onSuccess: () => {
      refreshCategories()
      stopEditing()
    },
  })

  const removeCategory = useMutation({
    mutationFn: (id: number) => deleteCategory({ token: requireToken(token), id }),
    onSuccess: refreshCategories,
  })

  function sendForm({ name, description }: CategoryInput) {
    saveCategory.mutate({ name: name.trim(), description: description.trim() })
  }

  function askToDelete({ id, name }: Category) {
    if (confirmDelete(name)) {
      removeCategory.mutate(id)
    }
  }

  let list = <p className="notice">טוען...</p>

  if (isError) {
    list = <p className="notice">{readServerMessage(error, 'לא הצלחנו לטעון את הקטגוריות')}</p>
  } else if (categories && categories.length === 0) {
    list = <p className="notice">אין קטגוריות</p>
  } else if (categories) {
    list = (
      <ul className="admin-list">
        {categories.map((category) => (
          <li key={category.id} className="card card-pad admin-row">
            <div>
              <h2 className={cardTitleClass}>{category.name}</h2>
              {category.description ? <p className="line">{category.description}</p> : null}
              <p className="line">{category.productCount} קולמוסים</p>
            </div>
            <div className="actions-plain">
              <button type="button" onClick={() => startEditing(category)} className={smallButtonClass}>
                <Pencil aria-hidden="true" />
                עריכה
              </button>
              <button
                type="button"
                onClick={() => askToDelete(category)}
                disabled={removeCategory.isPending}
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
      <h1 className={pageTitleClass}>קטגוריות</h1>
      <form noValidate onSubmit={handleSubmit(sendForm)} className="form-block page">
        <h2 className="sub-title">{editingId ? 'עריכת קטגוריה' : 'קטגוריה חדשה'}</h2>
        <label className="field">
          שם
          <input
            {...register('name', { validate: notEmpty('יש להזין שם') })}
            className={inputClass}
          />
          {errors.name ? <p className={errorClass}>{errors.name.message}</p> : null}
        </label>
        <label className="field">
          תיאור
          <textarea {...register('description')} className={inputClass} rows={3} />
        </label>
        {saveCategory.isError ? (
          <p className={formMessageClass}>
            {readServerMessage(saveCategory.error, 'לא הצלחנו לשמור את הקטגוריה')}
          </p>
        ) : null}
        <div className="actions-plain">
          <button type="submit" disabled={saveCategory.isPending} className={buttonClass}>
            {editingId ? 'שמירת שינויים' : 'הוספה'}
          </button>
          {editingId ? (
            <button type="button" onClick={stopEditing} className={buttonClass}>
              ביטול
            </button>
          ) : null}
        </div>
      </form>
      {removeCategory.isError ? (
        <p className={formMessageClass}>
          {readServerMessage(removeCategory.error, 'לא הצלחנו למחוק את הקטגוריה')}
        </p>
      ) : null}
      {list}
    </div>
  )
}

export default AdminCategoriesPage
