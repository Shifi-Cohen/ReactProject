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

  return (
    <li className={`card card-pad inquiry-card ${tone}`}>
      <div className="inquiry-top">
        <p className={`status-badge ${tone}`}>{statusLabels[status] ?? status}</p>
        <p className="script-badge">{scriptLabels[script] ?? script}</p>
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
          </li>
        ))}
      </ul>
    </li>
  )
}

export default InquiryCard
