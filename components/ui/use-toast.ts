"use client"

import * as React from "react"

type ToastVariant = "default" | "destructive"

type Toast = {
  id: string
  title?: string
  description?: string
  variant?: ToastVariant
  duration?: number
}

type ToastState = { toasts: Toast[] }

type ToastAction =
  | { type: "ADD_TOAST"; toast: Toast }
  | { type: "DISMISS_TOAST"; toastId?: string }
  | { type: "REMOVE_TOAST"; toastId?: string }

const TOAST_LIMIT = 5
const TOAST_REMOVE_DELAY = 1000

let toastCount = 0
const toastTimeouts = new Map<string, ReturnType<typeof setTimeout>>()

function genId() {
  toastCount = (toastCount + 1) % Number.MAX_SAFE_INTEGER
  return toastCount.toString()
}

function reducer(state: ToastState, action: ToastAction): ToastState {
  switch (action.type) {
    case "ADD_TOAST":
      return { ...state, toasts: [action.toast, ...state.toasts].slice(0, TOAST_LIMIT) }

    case "DISMISS_TOAST": {
      const { toastId } = action
      const ids = toastId ? [toastId] : state.toasts.map((t) => t.id)

      ids.forEach((id) => {
        if (toastTimeouts.has(id)) return
        const timeout = setTimeout(() => {
          toastTimeouts.delete(id)
          dispatch({ type: "REMOVE_TOAST", toastId: id })
        }, TOAST_REMOVE_DELAY)
        toastTimeouts.set(id, timeout)
      })

      return state
    }

    case "REMOVE_TOAST":
      return { ...state, toasts: action.toastId ? state.toasts.filter((t) => t.id !== action.toastId) : [] }

    default:
      return state
  }
}

const listeners: Array<(state: ToastState) => void> = []
let memoryState: ToastState = { toasts: [] }

function dispatch(action: ToastAction) {
  memoryState = reducer(memoryState, action)
  listeners.forEach((l) => l(memoryState))
}

export function toast(input: Omit<Toast, "id">) {
  const id = genId()

  dispatch({
    type: "ADD_TOAST",
    toast: {
      id,
      title: input.title,
      description: input.description,
      variant: input.variant ?? "default",
      duration: input.duration ?? 4000,
    },
  })

  return { id, dismiss: () => dispatch({ type: "DISMISS_TOAST", toastId: id }) }
}

export function useToast() {
  const [state, setState] = React.useState<ToastState>(memoryState)

  React.useEffect(() => {
    listeners.push(setState)
    return () => {
      const index = listeners.indexOf(setState)
      if (index > -1) listeners.splice(index, 1)
    }
  }, [])

  return { ...state, toast, dismiss: (toastId?: string) => dispatch({ type: "DISMISS_TOAST", toastId }) }
}
