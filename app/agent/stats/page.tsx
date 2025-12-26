"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { TrendingUp, Package, Clock, Star } from "lucide-react"

export default function AgentStats() {
  return (
    <div className="space-y-4 p-4">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">Performance</h1>
        <p className="text-sm text-muted-foreground">Your delivery statistics</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-3">
        <Card>
          <CardContent className="pt-4 space-y-1">
            <div className="flex items-center justify-between">
              <Package className="w-5 h-5 text-primary opacity-60" />
              <Badge className="bg-green-100 text-green-900 dark:bg-green-900 dark:text-green-100">+12%</Badge>
            </div>
            <p className="text-2xl font-bold">124</p>
            <p className="text-xs text-muted-foreground">Delivered Today</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4 space-y-1">
            <div className="flex items-center justify-between">
              <Clock className="w-5 h-5 text-secondary opacity-60" />
              <Badge className="bg-blue-100 text-blue-900 dark:bg-blue-900 dark:text-blue-100">On Track</Badge>
            </div>
            <p className="text-2xl font-bold">2.1h</p>
            <p className="text-xs text-muted-foreground">Avg Delivery Time</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4 space-y-1">
            <div className="flex items-center justify-between">
              <TrendingUp className="w-5 h-5 text-success opacity-60" />
              <Badge className="bg-green-100 text-green-900 dark:bg-green-900 dark:text-green-100">98%</Badge>
            </div>
            <p className="text-2xl font-bold">892</p>
            <p className="text-xs text-muted-foreground">This Month</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4 space-y-1">
            <div className="flex items-center justify-between">
              <Star className="w-5 h-5 text-yellow-500 opacity-60" />
              <Badge className="bg-yellow-100 text-yellow-900 dark:bg-yellow-900 dark:text-yellow-100">4.8</Badge>
            </div>
            <p className="text-2xl font-bold">4.8/5</p>
            <p className="text-xs text-muted-foreground">Customer Rating</p>
          </CardContent>
        </Card>
      </div>

      {/* Weekly Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle>This Week</CardTitle>
          <CardDescription>Daily delivery performance</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"].map((day, i) => (
              <div key={day} className="flex items-center justify-between">
                <span className="text-sm">{day}</span>
                <div className="flex-1 mx-3 bg-muted rounded-full h-2 overflow-hidden">
                  <div className="bg-primary h-full" style={{ width: `${60 + Math.random() * 40}%` }} />
                </div>
                <span className="text-sm font-medium">{100 + i * 10}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
