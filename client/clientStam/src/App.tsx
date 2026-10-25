import { Route, Routes } from 'react-router-dom'
import Layout from './components/Layout'
import RequireAdmin from './components/RequireAdmin'
import RequireAuth from './components/RequireAuth'
import AccountPage from './pages/AccountPage'
import AdminCategoriesPage from './pages/admin/AdminCategoriesPage'
import AdminInquiriesPage from './pages/admin/AdminInquiriesPage'
import AdminProductsPage from './pages/admin/AdminProductsPage'
import ProductFormPage from './pages/admin/ProductFormPage'
import CartPage from './pages/CartPage'
import HomePage from './pages/HomePage'
import InquiryPage from './pages/InquiryPage'
import LoginPage from './pages/LoginPage'
import MyInquiriesPage from './pages/MyInquiriesPage'
import ProductPage from './pages/ProductPage'
import SigninPage from './pages/SigninPage'
import ProductsPage from './pages/ProductsPage'

function App() {
  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<HomePage />} />
        <Route path="products" element={<ProductsPage />} />
        <Route path="products/:id" element={<ProductPage />} />
        <Route path="cart" element={<CartPage />} />
        <Route path="inquiry" element={<InquiryPage />} />
        <Route path="login" element={<LoginPage />} />
        <Route path="signin" element={<SigninPage />} />
        <Route element={<RequireAuth />}>
          <Route path="inquiries" element={<MyInquiriesPage />} />
          <Route path="account" element={<AccountPage />} />
        </Route>
        <Route path="admin" element={<RequireAdmin />}>
          <Route path="products" element={<AdminProductsPage />} />
          <Route path="products/new" element={<ProductFormPage />} />
          <Route path="products/:id/edit" element={<ProductFormPage />} />
          <Route path="categories" element={<AdminCategoriesPage />} />
          <Route path="inquiries" element={<AdminInquiriesPage />} />
        </Route>
      </Route>
    </Routes>
  )
}

export default App
