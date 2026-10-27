import { useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { useNavigate } from 'react-router-dom'
import { login, signin } from '../api/auth'
import { moveGuestCart } from '../api/cart'
import { useAuth } from '../context/AuthContext'
import { useGuestCart } from '../context/GuestCartContext'
import { validateEmail } from '../lib/email'
import { notEmpty } from '../lib/notEmpty'
import { validatePhone } from '../lib/phone'
import { readServerMessage } from '../lib/serverMessage'
import { pageClass, pageTitleClass, buttonClass, inputClass, errorClass, formMessageClass } from '../lib/styles'

type SigninForm = {
  fullName: string
  email: string
  phone: string
  password: string
}

function SigninPage() {
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
  } = useForm<SigninForm>({
    defaultValues: {
      fullName: '',
      email: '',
      phone: '',
      password: '',
    },
  })

  async function sendSignin({ fullName, email, phone, password }: SigninForm) {
    setServerMessage('')
    setIsSending(true)

    const cleanEmail = email.trim()

    try {
      await signin({
        fullName: fullName.trim(),
        email: cleanEmail,
        phone: phone.trim(),
        password,
      })
      const { token, user } = await login({ email: cleanEmail, password })
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
      setServerMessage(readServerMessage(error, 'לא הצלחנו להירשם'))
      setIsSending(false)
    }
  }

  return (
    <div className={pageClass}>
      <h1 className={pageTitleClass}>הרשמה</h1>
      <form noValidate onSubmit={handleSubmit(sendSignin)}>
        <label className="field">
          שם מלא
          <input
            type="text"
            {...register('fullName', {
              validate: notEmpty('יש להזין שם מלא'),
            })}
            className={inputClass}
          />
          {errors.fullName ? (
            <p className={errorClass}>{errors.fullName.message}</p>
          ) : null}
        </label>
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
          טלפון
          <input
            type="tel"
            {...register('phone', {
              validate: validatePhone,
            })}
            className={inputClass}
          />
          {errors.phone ? <p className={errorClass}>{errors.phone.message}</p> : null}
        </label>
        <label className="field">
          סיסמה
          <input
            type="password"
            {...register('password', {
              required: 'יש להזין סיסמה',
              minLength: {
                value: 6,
                message: 'סיסמה חייבת להכיל לפחות 6 תווים.',
              },
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
          {isSending ? 'נרשם...' : 'הרשמה'}
        </button>
      </form>
    </div>
  )
}

export default SigninPage
