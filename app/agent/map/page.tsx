"use client"

import { Card, CardContent } from "@/components/ui/card"
import { MapPin, Navigation } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function AgentMap() {
  return (
    <div className="space-y-4 p-4">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">Route Map</h1>
        <p className="text-sm text-muted-foreground">View your delivery route</p>
      </div>

      {/* Map Placeholder */}
      <Card className="overflow-hidden bg-white">
        <div className="aspect-video flex items-center justify-center border-b border-border bg-white">
          <div className="text-center space-y-2">
            <MapPin className="w-12 h-12 text-primary mx-auto opacity-50" />
            <p className="text-muted-foreground">Map integration coming soon</p>
          </div>
        </div>
        <CardContent className="pt-4 space-y-3">
          <div>
            <h3 className="font-semibold text-foreground mb-2">Route Summary</h3>
            <div className="space-y-2 text-sm">
              <p className="flex justify-between">
                <span className="text-muted-foreground">Stops</span>
                <span className="font-medium">4</span>
              </p>
              <p className="flex justify-between">
                <span className="text-muted-foreground">Total Distance</span>
                <span className="font-medium">12.5 km</span>
              </p>
              <p className="flex justify-between">
                <span className="text-muted-foreground">Est. Time</span>
                <span className="font-medium">45 min</span>
              </p>
            </div>
          </div>
          <Button className="w-full bg-secondary text-secondary-foreground hover:bg-secondary/90">
            <Navigation className="w-4 h-4 mr-2" />
            Start Navigation
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
