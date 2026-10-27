import { useForm } from 'react-hook-form'
import type { Category } from '../api/categories'
import type { ProductInput } from '../api/products'
import { notEmpty } from '../lib/notEmpty'
import { buttonClass, inputClass, errorClass, formMessageClass } from '../lib/styles'

export type ProductFormValues = {
  name: string
  description: string
  categoryId: string
  imageUrl: string
  isAvailable: boolean
}

type ProductFormProps = {
  defaultValues: ProductFormValues
  categories: Category[]
  isSaving: boolean
  serverMessage: string
  onSave: (product: ProductInput) => void
}

function ProductForm({ defaultValues, categories, isSaving, serverMessage, onSave }: ProductFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ProductFormValues>({ defaultValues })

  function sendForm({ name, description, categoryId, imageUrl, isAvailable }: ProductFormValues) {
    onSave({
      name: name.trim(),
      description: description.trim(),
      categoryId: Number(categoryId),
      imageUrl: imageUrl.trim(),
      isAvailable,
    })
  }

  return (
    <form noValidate onSubmit={handleSubmit(sendForm)}>
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
        <textarea
          {...register('description', { validate: notEmpty('יש להזין תיאור') })}
          className={inputClass}
          rows={4}
        />
        {errors.description ? <p className={errorClass}>{errors.description.message}</p> : null}
      </label>
      <label className="field">
        קטגוריה
        <select
          {...register('categoryId', { validate: notEmpty('יש לבחור קטגוריה') })}
          className={inputClass}
        >
          <option value="">בחר קטגוריה</option>
          {categories.map(({ id, name }) => (
            <option key={id} value={String(id)}>
              {name}
            </option>
          ))}
        </select>
        {errors.categoryId ? <p className={errorClass}>{errors.categoryId.message}</p> : null}
      </label>
      <label className="field">
        כתובת תמונה
        <input
          type="url"
          {...register('imageUrl', { validate: notEmpty('יש להזין כתובת תמונה') })}
          className={inputClass}
        />
        {errors.imageUrl ? <p className={errorClass}>{errors.imageUrl.message}</p> : null}
      </label>
      <label className="check-row">
        <input type="checkbox" {...register('isAvailable')} className="check" />
        זמין
      </label>
      {serverMessage ? <p className={formMessageClass}>{serverMessage}</p> : null}
      <button type="submit" disabled={isSaving} className={buttonClass}>
        {isSaving ? 'שומר...' : 'שמירה'}
      </button>
    </form>
  )
}

export default ProductForm
