import { useQuery } from '@tanstack/react-query'
import { getMyInquiries } from '../api/inquiries'
import InquiryList from '../components/InquiryList'
import { useAuth } from '../context/AuthContext'
import { requireToken } from '../lib/requireToken'
import { pageClass, pageTitleClass } from '../lib/styles'

function MyInquiriesPage() {
  const { token, user } = useAuth()
  const userId = user?.id ?? 0

  const { data: inquiries, isPending, isError, error } = useQuery({
    queryKey: ['my-inquiries', userId],
    queryFn: () => getMyInquiries({ token: requireToken(token), userId }),
    enabled: Boolean(user) && Boolean(token),
  })

  return (
    <div className={pageClass}>
      <h1 className={pageTitleClass}>הפניות שלי</h1>
      <InquiryList inquiries={inquiries} isPending={isPending} isError={isError} error={error} />
    </div>
  )
}

export default MyInquiriesPage
