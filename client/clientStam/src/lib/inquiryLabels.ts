export const statusLabels: Record<string, string> = {
  NEW: 'חדשה',
  IN_PROGRESS: 'בטיפול',
  COMPLETED: 'הושלמה',
  CANCELLED: 'בוטלה',
}

export type ScriptChoice = 'ASHKENAZI' | 'SEPHARDI'

export const scriptLabels: Record<string, string> = {
  ASHKENAZI: 'אשכנזי',
  SEPHARDI: 'ספרדי',
  MIXED: 'אשכנזי וספרדי',
}

export function isScriptChoice(value: unknown): value is ScriptChoice {
  return value === 'ASHKENAZI' || value === 'SEPHARDI'
}

export const statusOptions = Object.keys(statusLabels)

export const statusClassNames: Record<string, string> = {
  NEW: 'is-new',
  IN_PROGRESS: 'is-progress',
  COMPLETED: 'is-done',
  CANCELLED: 'is-stop',
}
