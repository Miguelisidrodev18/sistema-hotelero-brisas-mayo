import { useState, useCallback } from 'react'
import ConfirmDialog from '../components/ui/ConfirmDialog'

export function useConfirm() {
  const [state, setState] = useState(null)

  const confirm = useCallback((options) => {
    return new Promise((resolve) => {
      setState({
        ...options,
        onConfirm: () => { setState(null); resolve(true) },
        onCancel:  () => { setState(null); resolve(false) },
      })
    })
  }, [])

  const dialog = state ? <ConfirmDialog {...state}/> : null

  return { confirm, dialog }
}
