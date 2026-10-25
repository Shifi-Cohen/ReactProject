export const statusLabels: Record<string, string> = {
  NEW: 'חדשה',
  IN_PROGRESS: 'בטיפול',
  COMPLETED: 'הושלמה',
  CANCELLED: 'בוטלה',
}

export const scriptLabels: Record<string, string> = {
  ASHKENAZI: 'אשכנזי',
  SEPHARDI: 'ספרדי',
}

export const statusOptions = Object.keys(statusLabels)

export const statusClassNames: Record<string, string> = {
  NEW: 'is-new',
  IN_PROGRESS: 'is-progress',
  COMPLETED: 'is-done',
  CANCELLED: 'is-stop',
}
