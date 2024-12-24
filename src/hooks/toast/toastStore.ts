import { State, Action } from "./toastTypes"
import { reducer } from "./toastReducer"

export const listeners = new Set<(state: State) => void>()
let memoryState: State = { toasts: [] }

export function dispatch(action: Action) {
  console.log('[Toast Store] Dispatching action:', action.type);
  const nextState = reducer(memoryState, action)
  memoryState = nextState
  listeners.forEach((listener) => {
    listener(nextState)
  })
}