"use client"

declare global {
  interface Window {
    io?: (url: string, options?: Record<string, unknown>) => any
  }
}

const SCRIPT_ID = "__socket_io_client"
let loaderPromise: Promise<void> | null = null

const loadScript = (src: string) =>
  new Promise<void>((resolve, reject) => {
    if (typeof document === "undefined") {
      reject(new Error("Document is not available"))
      return
    }

    const existing = document.getElementById(SCRIPT_ID)
    if (existing) {
      existing.addEventListener("load", () => resolve())
      existing.addEventListener("error", (event) => reject(event))
      return
    }

    const script = document.createElement("script")
    script.id = SCRIPT_ID
    script.src = src
    script.async = true
    script.crossOrigin = "anonymous"
    script.onload = () => resolve()
    script.onerror = (event) => reject(event)
    document.body.appendChild(script)
  })

export const ensureSocketClient = async (baseUrl: string) => {
  if (typeof window === "undefined") return null
  if (typeof window.io === "function") return window.io

  const normalized = baseUrl.replace(/\/$/, "")
  const scriptSrc = `${normalized}/socket.io/socket.io.js`

  if (!loaderPromise) {
    loaderPromise = loadScript(scriptSrc).catch((error) => {
      loaderPromise = null
      throw error
    })
  }

  try {
    await loaderPromise
    return window.io ?? null
  } catch (error) {
    console.error("Failed to load Socket.IO client", error)
    return null
  }
};
