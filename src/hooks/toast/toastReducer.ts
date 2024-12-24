import { State, Action, ToasterToast } from "./toastTypes"

const TOAST_LIMIT = 1
const TOAST_REMOVE_DELAY = 3000

export const toastTimeouts = new Map<string, ReturnType<typeof setTimeout>>()

export const addToRemoveQueue = (toastId: string, dispatch: (action: Action) => void) => {
  if (toastTimeouts.has(toastId)) {
    return
  }

  const timeout = setTimeout(() => {
    toastTimeouts.delete(toastId)
    dispatch({
      type: "REMOVE_TOAST",
      toastId: toastId,
    })
  }, TOAST_REMOVE_DELAY)

  toastTimeouts.set(toastId, timeout)
}

export const reducer = (state: State, action: Action): State => {
  switch (action.type) {
    case "ADD_TOAST":
      console.log('[Toast Reducer] Adding toast');
      return {
        ...state,
        toasts: [action.toast, ...state.toasts].slice(0, TOAST_LIMIT),
      }

    case "UPDATE_TOAST":
      console.log('[Toast Reducer] Updating toast');
      return {
        ...state,
        toasts: state.toasts.map((t) =>
          t.id === action.toast.id ? { ...t, ...action.toast } : t
        ),
      }

    case "DISMISS_TOAST": {
      const { toastId } = action
      console.log('[Toast Reducer] Dismissing toast:', toastId);

      return {
        ...state,
        toasts: state.toasts.map((t) =>
          t.id === toastId || toastId === undefined
            ? {
                ...t,
                open: false,
              }
            : t
        ),
      }
    }
    
    case "REMOVE_TOAST":
      console.log('[Toast Reducer] Removing toast:', action.toastId);
      if (action.toastId === undefined) {
        return {
          ...state,
          toasts: [],
        }
      }
      return {
        ...state,
        toasts: state.toasts.filter((t) => t.id !== action.toastId),
      }
  }
}