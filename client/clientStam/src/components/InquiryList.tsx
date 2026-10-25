import type { ReactNode } from 'react'
import type { Inquiry } from '../api/inquiries'
import { readServerMessage } from '../lib/serverMessage'
import InquiryCard from './InquiryCard'

type InquiryListProps = {
  inquiries: Inquiry[] | undefined
  isPending: boolean
  isError: boolean
  error: unknown
  renderExtra?: (inquiry: Inquiry) => ReactNode
}

function InquiryList({ inquiries, isPending, isError, error, renderExtra }: InquiryListProps) {
  if (isError) {
    return <p className="notice">{readServerMessage(error, 'לא הצלחנו לטעון את הפניות')}</p>
  }

  if (isPending) {
    return <p className="notice">טוען...</p>
  }

  if (!inquiries || inquiries.length === 0) {
    return <p className="notice">עדיין אין פניות</p>
  }

  return (
    <ul className="stack-loose">
      {inquiries.map((inquiry) => (
        <InquiryCard key={inquiry.id} inquiry={inquiry}>
          {renderExtra ? renderExtra(inquiry) : null}
        </InquiryCard>
      ))}
    </ul>
  )
}

export default InquiryList
