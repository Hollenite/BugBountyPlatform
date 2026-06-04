type EventItem = {
  index: number
  type: string
  toolName?: string | null
  payload: Record<string, unknown>
  flagged: boolean
}

export function TraceViewer({ events }: { events: EventItem[] }) {
  return (
    <div style={{ display: "grid", gap: 12 }}>
      {events.map((event) => (
        <div
          key={event.index}
          style={{
            border: `1px solid ${event.flagged ? "#ef4444" : "#334155"}`,
            background: "#0f172a",
            borderRadius: 10,
            padding: 12,
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", gap: 12, marginBottom: 8 }}>
            <strong>
              #{event.index} · {event.type}
            </strong>
            <span style={{ color: event.flagged ? "#fca5a5" : "#94a3b8" }}>{event.toolName ?? "-"}</span>
          </div>
          <pre style={{ margin: 0, whiteSpace: "pre-wrap", wordBreak: "break-word", color: "#cbd5e1" }}>
            {JSON.stringify(event.payload, null, 2)}
          </pre>
        </div>
      ))}
    </div>
  )
}
