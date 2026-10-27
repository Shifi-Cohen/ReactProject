import type { ReactNode } from 'react'
import type { Inquiry } from '../api/inquiries'
import { scriptLabels, statusClassNames, statusLabels } from '../lib/inquiryLabels'

type InquiryCardProps = {
  inquiry: Inquiry
  children?: ReactNode
}

function InquiryCard({ inquiry, children }: InquiryCardProps) {
  const { createdAt, status, script, contactEmail, contactPhone, message, items } = inquiry
  const tone = statusClassNames[status] ?? ''
  const lineScripts = items.map((item) => item.script).filter((value) => value)
  const uniqueScripts = [...new Set(lineScripts)]
  const scriptText = uniqueScripts.length > 1
    ? 'אשכנזי וספרדי'
    : scriptLabels[uniqueScripts[0] ?? script] ?? script

  return (
    <li className={`card card-pad inquiry-card ${tone}`}>
      <div className="inquiry-top">
        <p className={`status-badge ${tone}`}>{statusLabels[status] ?? status}</p>
        <p className="script-badge">{scriptText}</p>
      </div>
      <p className="inquiry-date">{new Date(createdAt).toLocaleDateString('he-IL')}</p>
      {children}
      <p className="line">אימייל: {contactEmail}</p>
      <p className="line">טלפון: {contactPhone}</p>
      <p className="line">הערה: {message ? message : 'אין'}</p>
      <ul className="lines">
        {items.map((item) => (
          <li key={item.id}>
            {item.product.name} · כמות {item.quantity}
            {item.script ? ` · ${scriptLabels[item.script] ?? item.script}` : ''}
          </li>
        ))}
      </ul>
    </li>
  )
}

export default InquiryCard
