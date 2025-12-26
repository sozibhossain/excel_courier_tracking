"use client"

import { Spinner } from "@/components/ui/spinner"

export default function Loading() {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center space-y-4">
        <Spinner className="w-8 h-8 mx-auto" />
        <p className="text-muted-foreground">Loading...</p>
      </div>
    </div>
  )
}
