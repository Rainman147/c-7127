import { State, Action } from "./toastTypes"
import { reducer } from "./toastReducer"

export const listeners = new Set<(state: State) => void>()
let memoryState: State = { toasts: [] }

export function dispatch(action: Action) {
  console.log('[Toast Store] Dispatching action:', action.type);
  const nextState = reducer(memoryState, action)
  
  // Use Object.assign to update memoryState immutably
  Object.assign(memoryState, nextState)
  
  console.log('[Toast Store] Updated state:', memoryState);
  
  // Notify listeners with a new state object
  listeners.forEach((listener) => {
    listener({ ...memoryState })
  })
}