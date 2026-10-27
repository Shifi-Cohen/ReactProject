import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { updateUser } from '../api/users'
import { useAuth } from '../context/AuthContext'
import { validateEmail } from '../lib/email'
import { notEmpty } from '../lib/notEmpty'
import { readServerMessage } from '../lib/serverMessage'
import { pageClass, pageTitleClass, buttonClass, inputClass, errorClass, formMessageClass } from '../lib/styles'

type AccountForm = {
  fullName: string
  email: string
  phone: string
  currentPassword: string
  password: string
}

function AccountPage() {
  const { token, user, saveUser } = useAuth()
  const [serverMessage, setServerMessage] = useState('')
  const [savedMessage, setSavedMessage] = useState('')
  const [isSending, setIsSending] = useState(false)
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<AccountForm>({
    defaultValues: {
      fullName: user?.fullName ?? '',
      email: user?.email ?? '',
      phone: user?.phone ?? '',
      currentPassword: '',
      password: '',
    },
  })

  async function sendAccount({ fullName, email, phone, currentPassword, password }: AccountForm) {
    if (!token || !user) {
      return
    }

    setServerMessage('')
    setSavedMessage('')
    setIsSending(true)

    try {
      const nextUser = await updateUser({
        token,
        id: user.id,
        fullName,
        email,
        phone,
        password,
        currentPassword,
      })
      saveUser(nextUser)
      reset({
        fullName: nextUser.fullName,
        email: nextUser.email,
        phone: nextUser.phone ?? '',
        currentPassword: '',
        password: '',
      })
      setSavedMessage('הפרטים נשמרו')
      setIsSending(false)
    } catch (error) {
      setServerMessage(readServerMessage(error, 'לא הצלחנו לשמור את הפרטים'))
      setIsSending(false)
    }
  }

  return (
    <div className={pageClass}>
      <h1 className={pageTitleClass}>הפרטים שלי</h1>
      <form
        noValidate
        onSubmit={(event) => {
          setServerMessage('')
          setSavedMessage('')
          handleSubmit(sendAccount)(event)
        }}
      >
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
            {...register('phone')}
            className={inputClass}
          />
        </label>
        <label className="field">
          סיסמה נוכחית
          <input
            type="password"
            autoComplete="current-password"
            {...register('currentPassword', {
              validate: (currentPassword, form) => {
                if (!form.password) {
                  return true
                }
                if (currentPassword) {
                  return true
                }
                return 'יש להזין את הסיסמה הנוכחית.'
              },
            })}
            className={inputClass}
          />
          <p className="hint">נדרשת רק כשמחליפים סיסמה.</p>
          {errors.currentPassword ? (
            <p className={errorClass}>{errors.currentPassword.message}</p>
          ) : null}
        </label>
        <label className="field">
          סיסמה חדשה
          <input
            type="password"
            autoComplete="new-password"
            {...register('password', {
              validate: (password) => {
                if (!password || password.length >= 6) {
                  return true
                }

                return 'סיסמה חייבת להכיל לפחות 6 תווים.'
              },
            })}
            className={inputClass}
          />
          <p className="hint">אם משאירים ריק, הסיסמה לא משתנה.</p>
          {errors.password ? (
            <p className={errorClass}>{errors.password.message}</p>
          ) : null}
        </label>
        {serverMessage ? <p className={formMessageClass}>{serverMessage}</p> : null}
        {savedMessage ? <p className="note">{savedMessage}</p> : null}
        <button
          type="submit"
          disabled={isSending}
          className={buttonClass}
        >
          {isSending ? 'שומר...' : 'שמירה'}
        </button>
      </form>
    </div>
  )
}

export default AccountPage
