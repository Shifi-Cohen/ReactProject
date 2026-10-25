import { useState, type ChangeEvent } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { getAllInquiries, updateInquiryStatus, type Inquiry } from '../../api/inquiries'
import InquiryList from '../../components/InquiryList'
import { useAuth } from '../../context/AuthContext'
import { statusClassNames, statusLabels, statusOptions } from '../../lib/inquiryLabels'
import { requireToken } from '../../lib/requireToken'
import { readServerMessage } from '../../lib/serverMessage'
import { pageClass, pageTitleClass, inputClass, formMessageClass } from '../../lib/styles'

type StatusChange = {
  id: number
  status: string
}

function StatusOptions() {
  return (
    <>
      {statusOptions.map((option) => (
        <option key={option} value={option}>
          {statusLabels[option]}
        </option>
      ))}
    </>
  )
}

function AdminInquiriesPage() {
  const queryClient = useQueryClient()
  const { token } = useAuth()
  const [statusFilter, setStatusFilter] = useState('')

  const { data: inquiries, isPending, isError, error } = useQuery({
    queryKey: ['inquiries', statusFilter],
    queryFn: () => getAllInquiries({ token: requireToken(token), status: statusFilter }),
  })

  const changeStatus = useMutation({
    mutationFn: ({ id, status }: StatusChange) =>
      updateInquiryStatus({ token: requireToken(token), id, status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inquiries'] })
    },
  })

  function updateFilter({ target }: ChangeEvent<HTMLSelectElement>) {
    setStatusFilter(target.value)
  }

  function renderAdminDetails({ id, status, user }: Inquiry) {
    return (
      <>
        <p className="line">לקוח: {user ? user.fullName : 'אורח'}</p>
        <label className="field-tight">
          שינוי סטטוס
          <select
            value={status}
            onChange={({ target }) => changeStatus.mutate({ id, status: target.value })}
            disabled={changeStatus.isPending}
            className={`${inputClass} status-select ${statusClassNames[status] ?? ''}`}
          >
            <StatusOptions />
          </select>
        </label>
      </>
    )
  }

  return (
    <div className={pageClass}>
      <h1 className={pageTitleClass}>פניות</h1>
      <label className="field">
        סינון לפי סטטוס
        <select value={statusFilter} onChange={updateFilter} className={inputClass}>
          <option value="">הכל</option>
          <StatusOptions />
        </select>
      </label>
      {changeStatus.isError ? (
        <p className={formMessageClass}>
          {readServerMessage(changeStatus.error, 'לא הצלחנו לעדכן את הסטטוס')}
        </p>
      ) : null}
      <InquiryList
        inquiries={inquiries}
        isPending={isPending}
        isError={isError}
        error={error}
        renderExtra={renderAdminDetails}
      />
    </div>
  )
}

export default AdminInquiriesPage
