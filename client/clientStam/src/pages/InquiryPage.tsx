import { useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { createInquiry, createInquiryFromCart } from '../api/inquiries'
import { useAuth } from '../context/AuthContext'
import { useGuestCart } from '../context/GuestCartContext'
import { useCartRows } from '../hooks/useCartRows'
import { validateEmail } from '../lib/email'
import { notEmpty } from '../lib/notEmpty'
import { readServerMessage } from '../lib/serverMessage'
import { pageClass, pageTitleClass, buttonClass, inputClass, errorClass, formMessageClass, textLinkClass } from '../lib/styles'

type InquiryForm = {
  script: string
  contactEmail: string
  contactPhone: string
  message: string
}

type InquiryLocationState = {
  selectedIds?: number[]
}

function InquiryPage() {
  const location = useLocation()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { token, user } = useAuth()
  const { removeItem } = useGuestCart()
  const { rows, isLoading, isError, error } = useCartRows()
  const [serverMessage, setServerMessage] = useState('')
  const [sentMessage, setSentMessage] = useState('')
  const [isSending, setIsSending] = useState(false)
  const state = location.state as InquiryLocationState | null
  const selectedIds = state && Array.isArray(state.selectedIds) ? state.selectedIds : []
  const chosenItems = rows.filter((row) => selectedIds.includes(row.id))
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<InquiryForm>({
    defaultValues: {
      script: '',
      contactEmail: user?.email ?? '',
      contactPhone: user?.phone ?? '',
      message: '',
    },
  })

  async function sendInquiry({ script, contactEmail, contactPhone, message }: InquiryForm) {
    setServerMessage('')
    setSentMessage('')
    setIsSending(true)

    try {
      if (user && token) {
        await createInquiryFromCart({
          token,
          itemIds: chosenItems.map(({ id }) => id),
          script,
          contactEmail,
          contactPhone,
          message,
        })
        navigate('/inquiries')
        queryClient.invalidateQueries({ queryKey: ['cart'] })
        queryClient.invalidateQueries({ queryKey: ['my-inquiries'] })
        return
      }

      await createInquiry({
        script,
        contactEmail,
        contactPhone,
        message,
        items: chosenItems.map(({ id, quantity }) => ({ productId: id, quantity })),
      })

      for (const item of chosenItems) {
        removeItem({ productId: item.id })
      }

      setSentMessage('הפנייה נשלחה. נחזור אליך לפי האימייל והטלפון.')
      setIsSending(false)
    } catch (sendError) {
      setServerMessage(readServerMessage(sendError, 'לא הצלחנו לשלוח את הפנייה'))
      setIsSending(false)
    }
  }

  if (sentMessage) {
    return (
      <div className={pageClass}>
        <h1 className={pageTitleClass}>שליחת פנייה</h1>
        <p>{sentMessage}</p>
        <Link to="/" className={textLinkClass}>
          חזרה לבית
        </Link>
      </div>
    )
  }

  if (isLoading) {
    return <p className="page notice">טוען...</p>
  }

  if (isError) {
    return (
      <p className="page notice">{readServerMessage(error, 'לא הצלחנו לטעון את הסל')}</p>
    )
  }

  if (chosenItems.length === 0) {
    return (
      <div className={pageClass}>
        <h1 className={pageTitleClass}>שליחת פנייה</h1>
        <p>אין קולמוסים מסומנים.</p>
        <Link to="/cart" className={textLinkClass}>
          חזרה לסל
        </Link>
      </div>
    )
  }

  return (
    <div className={pageClass}>
      <h1 className={pageTitleClass}>שליחת פנייה</h1>
      <ul className="picked">
        {chosenItems.map((item) => (
          <li key={item.id}>
            {item.name} · כמות {item.quantity}
          </li>
        ))}
      </ul>
      <form noValidate onSubmit={handleSubmit(sendInquiry)}>
        <fieldset className="choice-group">
          <legend>כתב</legend>
          <label className="choice">
            <input
              type="radio"
              value="ASHKENAZI"
              {...register('script', { required: 'יש לבחור כתב אשכנזי או ספרדי.' })}
              className="radio"
            />
            כתב אשכנזי
          </label>
          <label className="choice">
            <input
              type="radio"
              value="SEPHARDI"
              {...register('script', { required: 'יש לבחור כתב אשכנזי או ספרדי.' })}
              className="radio"
            />
            כתב ספרדי
          </label>
          {errors.script ? <p className={errorClass}>{errors.script.message}</p> : null}
        </fieldset>
        <label className="field">
          אימייל
          <input
            type="email"
            {...register('contactEmail', {
              required: 'יש להזין אימייל',
              validate: validateEmail,
            })}
            className={inputClass}
          />
          {errors.contactEmail ? (
            <p className={errorClass}>{errors.contactEmail.message}</p>
          ) : null}
        </label>
        <label className="field">
          טלפון
          <input
            type="tel"
            {...register('contactPhone', { validate: notEmpty('יש להזין טלפון') })}
            className={inputClass}
          />
          {errors.contactPhone ? (
            <p className={errorClass}>{errors.contactPhone.message}</p>
          ) : null}
        </label>
        <label className="field">
          הערה לחנות
          <textarea
            {...register('message')}
            className={inputClass}
            rows={4}
          />
        </label>
        {serverMessage ? <p className={formMessageClass}>{serverMessage}</p> : null}
        <button
          type="submit"
          disabled={isSending}
          className={buttonClass}
        >
          {isSending ? 'שולחת...' : 'שליחת פנייה'}
        </button>
      </form>
    </div>
  )
}

export default InquiryPage
