"use client"

import type React from "react"

export function AuthPageLayout({
  children,
  title,
  subtitle,
}: {
  children: React.ReactNode
  title: string
  subtitle: string
}) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4 py-12">
      <div className="w-full max-w-md space-y-8">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="flex justify-center mb-4">
            <div className="w-full h-12 rounded-lg bg-primary flex items-center justify-center text-white font-bold text-xl">
              Excel courier tracking
            </div>
          </div>
          <h1 className="text-3xl font-bold text-foreground">{title}</h1>
          <p className="text-muted-foreground">{subtitle}</p>
        </div>

        {/* Form */}
        <div className="space-y-6">{children}</div>
      </div>
    </div>
  )
}
