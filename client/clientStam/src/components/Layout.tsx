import { useEffect, useState } from 'react'
import { Feather, Home, Inbox, LogIn, LogOut, Mail, MapPin, Menu, Package, Phone, ShoppingBag, Tags, User, UserPlus, X } from 'lucide-react'
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { mergeFailedMessage } from '../api/cart'
import { useAuth } from '../context/AuthContext'
import { useGuestCart } from '../context/GuestCartContext'
import { useCartRows } from '../hooks/useCartRows'

const logoUrl = 'https://res.cloudinary.com/dj01kpiv/image/upload/v1792959159/%D7%9C%D7%95%D7%92%D7%95_%D7%94%D7%99%D7%99%D7%98%D7%A7%D7%95%D7%9C%D7%9E%D7%95%D7%AA_%D7%A2%D7%9D_%D7%A7%D7%95%D7%9C%D7%9E%D7%95%D7%A1_%D7%95%D7%A0%D7%95%D7%A6%D7%94.png'

function Layout() {
  const navigate = useNavigate()
  const location = useLocation()
  const { user, logout, sessionMessage, clearLeaving } = useAuth()
  const pageState = location.state as { cartNotice?: unknown } | null
  const cartNotice = pageState && typeof pageState.cartNotice === 'string' ? pageState.cartNotice : ''
  const { rows } = useCartRows()
  const { items, mergeFailed } = useGuestCart()
  const showMergeFailure = Boolean(user) && mergeFailed && items.length > 0
  const [menuOpen, setMenuOpen] = useState(false)

  useEffect(() => {
    if (!user && location.pathname === '/') {
      clearLeaving()
    }
  }, [user, location.pathname, clearLeaving])

  useEffect(() => {
    setMenuOpen(false)
  }, [location.pathname])

  function exit() {
    logout()
    navigate('/')
  }

  function toggleMenu() {
    setMenuOpen(!menuOpen)
  }

  function navClass(path: string) {
    let active = location.pathname === path

    if (path !== '/' && location.pathname.startsWith(path)) {
      active = true
    }

    if (active) {
      return 'nav-link is-active'
    }

    return 'nav-link'
  }

  let cartCount = 0

  for (const row of rows) {
    cartCount = cartCount + row.quantity
  }

  if (showMergeFailure) {
    for (const item of items) {
      cartCount = cartCount + item.quantity
    }
  }

  let menuClass = 'site-nav'

  if (menuOpen) {
    menuClass = 'site-nav is-open'
  }

  return (
    <div className="site">
      <header className="site-header">
        <p className="top-bar">קולמוסים קרמיים לסופרי סת״ם</p>
        <div className="header-inner">
          <div className="logo">
            <Link to="/" className="logo-link">
              <span className="logo-mark">
                <img className="logo-image" src={logoUrl} alt="" />
              </span>
              <span>
                <span className="logo-name">היטקולמוס</span>
                <span className="logo-slogan">כשהיטק פוגש קולמוס</span>
              </span>
            </Link>
          </div>

          <div className="header-tools">
            <button
              type="button"
              className="nav-toggle"
              aria-expanded={menuOpen}
              aria-controls="site-menu"
              aria-label={menuOpen ? 'סגירת תפריט' : 'פתיחת תפריט'}
              onClick={toggleMenu}
            >
              {menuOpen ? <X aria-hidden="true" /> : <Menu aria-hidden="true" />}
            </button>
          </div>

          <nav id="site-menu" className={menuClass}>
            <Link to="/" className={navClass('/')}>
              <Home aria-hidden="true" />
              בית
            </Link>
            <Link to="/products" className={navClass('/products')}>
              <Feather aria-hidden="true" />
              קולמוסים
            </Link>
            <Link to="/cart" className={navClass('/cart')}>
              <ShoppingBag aria-hidden="true" />
              סל
              <span className="cart-count">{cartCount}</span>
            </Link>
            {user ? (
              <>
                {user.role !== 'ADMIN' ? (
                  <Link to="/inquiries" className={navClass('/inquiries')}>
                    <Inbox aria-hidden="true" />
                    הפניות שלי
                  </Link>
                ) : null}
                <Link to="/account" className={navClass('/account')}>
                  <User aria-hidden="true" />
                  הפרטים שלי
                </Link>
                {user.role === 'ADMIN' ? (
                  <>
                    <Link to="/admin/products" className={navClass('/admin/products')}>
                      <Package aria-hidden="true" />
                      מוצרים
                    </Link>
                    <Link to="/admin/categories" className={navClass('/admin/categories')}>
                      <Tags aria-hidden="true" />
                      קטגוריות
                    </Link>
                    <Link to="/admin/inquiries" className={navClass('/admin/inquiries')}>
                      <Inbox aria-hidden="true" />
                      פניות
                    </Link>
                  </>
                ) : null}
                <button type="button" onClick={exit} className="nav-link">
                  <LogOut aria-hidden="true" />
                  יציאה
                </button>
              </>
            ) : (
              <>
                <Link to="/login" className={navClass('/login')}>
                  <LogIn aria-hidden="true" />
                  כניסה
                </Link>
                <Link to="/signin" className={navClass('/signin')}>
                  <UserPlus aria-hidden="true" />
                  הרשמה
                </Link>
              </>
            )}
          </nav>
        </div>
      </header>

      {sessionMessage ? (
        <p className="session-note">
          {sessionMessage}
        </p>
      ) : null}

      {cartNotice ? (
        <p className="session-note" role="status">
          {cartNotice}
        </p>
      ) : null}

      {showMergeFailure ? (
        <p className="session-note" role="status">
          {mergeFailedMessage} אפשר לנסות שוב בעמוד הסל.
        </p>
      ) : null}

      <main className="site-main">
        <Outlet />
      </main>

      <footer className="site-footer">
        <div className="footer-grid">
          <div>
            <p className="footer-title">היטקולמוס</p>
            <p>כשהיטק פוגש קולמוס</p>
            <p className="line">קולמוסים קרמיים לסופרי סת״ם.</p>
          </div>
          <div>
            <p className="footer-title">החנות</p>
            <Link to="/products" className="footer-link">
              <Feather aria-hidden="true" />
              קולמוסים
            </Link>
            <Link to="/cart" className="footer-link">
              <ShoppingBag aria-hidden="true" />
              סל
            </Link>
            <Link to="/login" className="footer-link">
              <LogIn aria-hidden="true" />
              כניסה
            </Link>
          </div>
          <div>
            <p className="footer-title">שירות</p>
            <Link to="/account" className="footer-link">
              <User aria-hidden="true" />
              הפרטים שלי
            </Link>
            <Link to="/inquiries" className="footer-link">
              <Inbox aria-hidden="true" />
              הפניות שלי
            </Link>
          </div>
          <div>
            <p className="footer-title">יצירת קשר</p>
            <p className="footer-link">
              <MapPin aria-hidden="true" />
              פוקס אהרון דב 7 בני ברק
            </p>
            <a className="footer-link" href="tel:0504151493">
              <Phone aria-hidden="true" />
              0504151493
            </a>
            <a className="footer-link" href="mailto:av4151@gmail.com">
              <Mail aria-hidden="true" />
              av4151@gmail.com
            </a>
          </div>
        </div>
        <p className="footer-bottom">תכנון ופיתוח: שיפי כהן, כל הזכויות שמורות</p>
      </footer>
    </div>
  )
}

export default Layout
