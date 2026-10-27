import { useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { Link, useNavigate } from 'react-router-dom'
import { updateCartItem, type Cart } from '../api/cart'
import { createInquiry, createInquiryFromCart } from '../api/inquiries'
import { useAuth } from '../context/AuthContext'
import { useGuestCart } from '../context/GuestCartContext'
import { useCartRows, type CartRow } from '../hooks/useCartRows'
import { validateEmail } from '../lib/email'
import { isScriptChoice, type ScriptChoice } from '../lib/inquiryLabels'
import { validatePhone } from '../lib/phone'
import { readServerMessage } from '../lib/serverMessage'
import { pageClass, pageTitleClass, buttonClass, inputClass, errorClass, formMessageClass, textLinkClass } from '../lib/styles'

type InquiryForm = {
  contactEmail: string
  contactPhone: string
  message: string
}

function InquiryPage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { token, user, saveUser } = useAuth()
  const { removeItem, setScript } = useGuestCart()
  const { rows, isLoading, isError, error } = useCartRows()
  const [serverMessage, setServerMessage] = useState('')
  const [sentMessage, setSentMessage] = useState('')
  const [isSending, setIsSending] = useState(false)
  const chosenItems = rows.filter((row) => row.selected)
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<InquiryForm>({
    defaultValues: {
      contactEmail: user?.email ?? '',
      contactPhone: user?.phone ?? '',
      message: '',
    },
  })

  const scriptsReady = chosenItems.every((item) => isScriptChoice(item.script))

  async function chooseScript(item: CartRow, script: ScriptChoice) {
    setServerMessage('')

    if (user && token) {
      queryClient.setQueryData<Cart>(['cart'], (current) => {
        if (!current) {
          return current
        }

        return {
          ...current,
          items: current.items.map((entry) => {
            if (entry.id !== item.id) {
              return entry
            }

            return {
              ...entry,
              script,
            }
          }),
        }
      })

      try {
        await updateCartItem({ token, itemId: item.id, script })
      } catch (chooseError) {
        await queryClient.invalidateQueries({ queryKey: ['cart'] })
        setServerMessage(readServerMessage(chooseError, 'לא הצלחנו לשמור את הכתב'))
      }

      return
    }

    setScript({ productId: item.id, script })
  }

  async function sendInquiry({ contactEmail, contactPhone, message }: InquiryForm) {
    if (!scriptsReady) {
      setServerMessage('יש לבחור כתב לכל קולמוס.')
      return
    }

    setServerMessage('')
    setSentMessage('')
    setIsSending(true)

    try {
      if (user && token) {
        const inquiry = await createInquiryFromCart({
          token,
          items: chosenItems.map((item) => ({
            id: item.id,
            script: item.script as ScriptChoice,
          })),
          contactEmail,
          contactPhone,
          message,
        })
        if (inquiry.user) {
          saveUser({
            ...user,
            phone: inquiry.user.phone,
          })
        }
        navigate('/inquiries')
        queryClient.invalidateQueries({ queryKey: ['cart'] })
        queryClient.invalidateQueries({ queryKey: ['my-inquiries'] })
        return
      }

      await createInquiry({
        contactEmail,
        contactPhone,
        message,
        items: chosenItems.map((item) => ({
          productId: item.id,
          quantity: item.quantity,
          script: item.script as ScriptChoice,
        })),
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
          <li key={item.id} className="picked-row">
            <p>
              {item.name} · כמות {item.quantity}
            </p>
            <fieldset className="script-choices">
              <legend>כתב</legend>
              <label className="choice">
                <input
                  type="radio"
                  name={`script-${item.id}`}
                  checked={item.script === 'ASHKENAZI'}
                  onChange={() => chooseScript(item, 'ASHKENAZI')}
                  className="radio"
                />
                אשכנזי
              </label>
              <label className="choice">
                <input
                  type="radio"
                  name={`script-${item.id}`}
                  checked={item.script === 'SEPHARDI'}
                  onChange={() => chooseScript(item, 'SEPHARDI')}
                  className="radio"
                />
                ספרדי
              </label>
            </fieldset>
          </li>
        ))}
      </ul>
      {scriptsReady ? null : <p className="hint">יש לבחור כתב לכל קולמוס.</p>}
      <form noValidate onSubmit={handleSubmit(sendInquiry)}>
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
            {...register('contactPhone', { validate: validatePhone })}
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
          disabled={isSending || !scriptsReady}
          className={buttonClass}
        >
          {isSending ? 'שולח...' : 'שליחת פנייה'}
        </button>
      </form>
    </div>
  )
}

export default InquiryPage
