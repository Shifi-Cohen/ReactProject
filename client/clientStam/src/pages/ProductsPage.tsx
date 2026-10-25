import { useState, type ChangeEvent } from 'react'
import { useQuery } from '@tanstack/react-query'
import { getCategories } from '../api/categories'
import { getProducts, type Product } from '../api/products'
import ProductCard from '../components/ProductCard'
import { readServerMessage } from '../lib/serverMessage'
import { pageTitleClass, inputClass } from '../lib/styles'

function compareByName({ name: firstName }: Product, { name: secondName }: Product) {
  return firstName.localeCompare(secondName, 'he')
}

function ProductsPage() {
  const [search, setSearch] = useState('')
  const [categoryId, setCategoryId] = useState<number | undefined>(undefined)
  const [sort, setSort] = useState('new')

  const { data: categories } = useQuery({
    queryKey: ['categories'],
    queryFn: () => getCategories(),
  })

  const { data: products, isPending, isError, error } = useQuery({
    queryKey: ['products', search, categoryId],
    queryFn: () => getProducts({ search, categoryId }),
  })

  function updateSearch({ target }: ChangeEvent<HTMLInputElement>) {
    setSearch(target.value)
  }

  function updateCategory({ target }: ChangeEvent<HTMLSelectElement>) {
    const nextCategoryId = Number(target.value)

    if (!nextCategoryId) {
      setCategoryId(undefined)
      return
    }

    setCategoryId(nextCategoryId)
  }

  function updateSort({ target }: ChangeEvent<HTMLSelectElement>) {
    setSort(target.value)
  }

  function resetFilters() {
    setSearch('')
    setCategoryId(undefined)
    setSort('new')
  }

  let content = <p className="empty-state">טוען...</p>

  if (isError) {
    content = <p className="empty-state">{readServerMessage(error, 'לא הצלחנו לטעון את הקולמוסים')}</p>
  } else if (!isPending && (!products || products.length === 0)) {
    content = <p className="empty-state">אין קולמוסים להצגה</p>
  } else if (!isPending && products) {
    let visibleProducts = products

    if (sort === 'name') {
      visibleProducts = [...products].sort(compareByName)
    }

    content = (
      <ul className="product-grid">
        {visibleProducts.map((product) => (
          <li key={product.id}>
            <ProductCard
              id={product.id}
              name={product.name}
              description={product.description}
              imageUrl={product.imageUrl}
              categoryName={product.category.name}
              isAvailable={product.isAvailable}
            />
          </li>
        ))}
      </ul>
    )
  }

  return (
    <div className="page-wide">
      <h1 className={pageTitleClass}>הקולמוסים שלנו</h1>
      <div className="filters">
      <label className="field">
        חיפוש לפי שם
        <input
          value={search}
          onChange={updateSearch}
          className={inputClass}
        />
      </label>
      <label className="field">
        קטגוריה
        <select
          value={categoryId ?? ''}
          onChange={updateCategory}
          className={inputClass}
        >
          <option value="">כל הקטגוריות</option>
          {categories?.map(({ id, name }) => (
            <option key={id} value={id}>
              {name}
            </option>
          ))}
        </select>
      </label>
      <label className="field">
        מיון לפי
        <select
          value={sort}
          onChange={updateSort}
          className={inputClass}
        >
          <option value="new">חדש</option>
          <option value="name">שם</option>
        </select>
      </label>
      <button
        type="button"
        onClick={resetFilters}
        className="btn"
      >
        איפוס
      </button>
      </div>
      {content}
    </div>
  )
}

export default ProductsPage
