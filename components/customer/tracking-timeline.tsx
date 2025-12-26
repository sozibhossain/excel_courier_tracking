"use client"

import { CheckCircle2, Circle, Clock } from "lucide-react"

export interface TrackingEvent {
  status: string
  timestamp: string
  location: string
  description: string
  completed: boolean
}

interface TrackingTimelineProps {
  events: TrackingEvent[]
}

export function TrackingTimeline({ events }: TrackingTimelineProps) {
  return (
    <div className="space-y-4">
      {events.map((event, index) => (
        <div key={index} className="flex gap-4">
          {/* Timeline Marker */}
          <div className="flex flex-col items-center">
            {event.completed ? (
              <CheckCircle2 className="w-8 h-8 text-success flex-shrink-0" />
            ) : index === events.findIndex((e) => !e.completed) ? (
              <Clock className="w-8 h-8 text-primary flex-shrink-0 animate-pulse" />
            ) : (
              <Circle className="w-8 h-8 text-muted flex-shrink-0" />
            )}
            {index < events.length - 1 && (
              <div className={`w-1 h-12 mt-2 ${event.completed ? "bg-success" : "bg-muted"}`} />
            )}
          </div>

          {/* Event Content */}
          <div className="flex-1 pb-4">
            <div className="flex items-start justify-between gap-2">
              <div>
                <h3 className="font-semibold text-foreground">{event.status}</h3>
                <p className="text-sm text-muted-foreground">{event.location}</p>
              </div>
              <span className="text-xs text-muted-foreground whitespace-nowrap">{event.timestamp}</span>
            </div>
            <p className="text-sm text-muted-foreground mt-1">{event.description}</p>
          </div>
        </div>
      ))}
    </div>
  )
}
