import { useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { useNavigate } from 'react-router-dom'
import { login } from '../api/auth'
import { moveGuestCart } from '../api/cart'
import { useAuth } from '../context/AuthContext'
import { useGuestCart } from '../context/GuestCartContext'
import { validateEmail } from '../lib/email'
import { readServerMessage } from '../lib/serverMessage'
import { pageClass, pageTitleClass, buttonClass, inputClass, errorClass, formMessageClass } from '../lib/styles'

type LoginForm = {
  email: string
  password: string
}

function LoginPage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { saveLogin } = useAuth()
  const { items, clearItems, markMergeFailed, clearMergeFailed } = useGuestCart()
  const [serverMessage, setServerMessage] = useState('')
  const [isSending, setIsSending] = useState(false)
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginForm>()

  async function sendLogin({ email, password }: LoginForm) {
    setServerMessage('')
    setIsSending(true)

    try {
      const { token, user } = await login({ email: email.trim(), password })
      saveLogin({ token, user })
      const { notice, failed } = await moveGuestCart({
        token,
        items,
        clearItems,
        markMergeFailed,
        clearMergeFailed,
      })
      await queryClient.invalidateQueries({ queryKey: ['cart'] })
      navigate('/', !failed && notice ? { state: { cartNotice: notice } } : undefined)
    } catch (error) {
      setServerMessage(readServerMessage(error, 'לא הצלחנו להתחבר'))
      setIsSending(false)
    }
  }

  return (
    <div className={pageClass}>
      <h1 className={pageTitleClass}>כניסה</h1>
      <form noValidate onSubmit={handleSubmit(sendLogin)}>
        <label className="field">
          אימייל
          <input
            type="email"
            {...register('email', {
              required: 'יש להזין אימייל',
              validate: validateEmail,
            })}
            className={inputClass}
          />
          {errors.email ? <p className={errorClass}>{errors.email.message}</p> : null}
        </label>
        <label className="field">
          סיסמה
          <input
            type="password"
            {...register('password', {
              required: 'יש להזין סיסמה',
            })}
            className={inputClass}
          />
          {errors.password ? (
            <p className={errorClass}>{errors.password.message}</p>
          ) : null}
        </label>
        {serverMessage ? <p className={formMessageClass}>{serverMessage}</p> : null}
        <button
          type="submit"
          disabled={isSending}
          className={buttonClass}
        >
          {isSending ? 'מתחבר...' : 'כניסה'}
        </button>
      </form>
    </div>
  )
}

export default LoginPage
