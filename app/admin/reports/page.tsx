"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Download, FileText } from "lucide-react"

export default function AdminReports() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">Reports</h1>
        <p className="text-muted-foreground">Generate and download business reports</p>
      </div>

      {/* Report Options */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-primary" />
              Bookings Report
            </CardTitle>
            <CardDescription>All parcel bookings and deliveries</CardDescription>
          </CardHeader>
          <CardContent className="flex gap-2">
            <Button variant="outline" className="flex-1 bg-transparent">
              <Download className="w-4 h-4 mr-2" />
              CSV
            </Button>
            <Button className="flex-1 bg-primary text-primary-foreground">
              <Download className="w-4 h-4 mr-2" />
              PDF
            </Button>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-primary" />
              Agent Performance
            </CardTitle>
            <CardDescription>Individual agent delivery metrics</CardDescription>
          </CardHeader>
          <CardContent className="flex gap-2">
            <Button variant="outline" className="flex-1 bg-transparent" disabled>
              <Download className="w-4 h-4 mr-2" />
              CSV
            </Button>
            <Button className="flex-1 bg-primary text-primary-foreground" disabled>
              <Download className="w-4 h-4 mr-2" />
              PDF
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
