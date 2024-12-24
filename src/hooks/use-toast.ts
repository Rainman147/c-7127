import * as React from "react"
import type { Toast, ToasterToast } from "./toast/toastTypes"
import { listeners, dispatch } from "./toast/toastStore"
import { addToRemoveQueue } from "./toast/toastReducer"

let count = 0

function genId() {
  count = (count + 1) % Number.MAX_SAFE_INTEGER
  return count.toString()
}

function toast({ ...props }: Toast) {
  const id = genId()
  console.log('[Toast] Creating new toast with ID:', id);

  const update = (props: ToasterToast) => {
    console.log('[Toast] Updating toast:', id);
    dispatch({
      type: "UPDATE_TOAST",
      toast: { ...props, id },
    })
  }

  const dismiss = () => {
    console.log('[Toast] Dismissing toast:', id);
    dispatch({ type: "DISMISS_TOAST", toastId: id })
  }

  dispatch({
    type: "ADD_TOAST",
    toast: {
      ...props,
      id,
      open: true,
      onOpenChange: (open) => {
        if (!open) {
          console.log('[Toast] Toast closed:', id);
          dismiss()
        }
      },
    },
  })

  return {
    id,
    dismiss,
    update,
  }
}

function useToast() {
  const [state, setState] = React.useState({ toasts: [] })

  React.useEffect(() => {
    console.log('[useToast] Setting up listener');
    listeners.add(setState)
    return () => {
      console.log('[useToast] Cleaning up listener');
      listeners.delete(setState)
    }
  }, [])

  return {
    ...state,
    toast,
    dismiss: (toastId?: string) => {
      console.log('[useToast] Dismissing toast:', toastId || 'all');
      dispatch({ type: "DISMISS_TOAST", toastId })
    },
  }
}

export { useToast, toast }