import { AlertTriangle, Bot, CheckCircle2, Flag, ShieldAlert, Wrench } from "lucide-react"
import { AdvancedSection, Pill } from "./ui"

type EventItem = {
  index: number
  type: string
  toolName?: string | null
  payload: Record<string, unknown>
  flagged: boolean
  createdAt?: string
}

const EVENT_LABELS: Record<string, { title: string; icon: React.ReactNode; tone: "neutral" | "warning" | "danger" | "accent" | "success" }> = {
  user_message: { title: "Researcher prompt", icon: <Bot size={16} />, tone: "neutral" },
  assistant_message: { title: "Agent response", icon: <Bot size={16} />, tone: "accent" },
  assistant_tool_use: { title: "Agent tool intent", icon: <Wrench size={16} />, tone: "warning" },
  tool_call: { title: "Tool call executed", icon: <Wrench size={16} />, tone: "warning" },
  tool_result: { title: "Tool output", icon: <CheckCircle2 size={16} />, tone: "success" },
  risk_signal: { title: "Risk signal", icon: <ShieldAlert size={16} />, tone: "warning" },
  policy_check: { title: "Policy check", icon: <CheckCircle2 size={16} />, tone: "accent" },
  confirmed_violation: { title: "Confirmed violation", icon: <AlertTriangle size={16} />, tone: "danger" },
}

export function TraceViewer({ events, title = "Replayable event trace" }: { events: EventItem[]; title?: string }) {
  return (
    <div className="stack">
      <div className="stack" style={{ gap: 6 }}>
        <h3 style={{ margin: 0 }}>{title}</h3>
        <p className="muted" style={{ margin: 0 }}>
          Structured evidence first. Raw payloads stay available inside advanced sections.
        </p>
      </div>

      <div className="timeline">
        {events.map((event) => {
          const config = EVENT_LABELS[event.type] ?? {
            title: event.type.replaceAll("_", " "),
            icon: <Flag size={16} />,
            tone: "neutral" as const,
          }

          return (
            <article key={event.index} className={`timeline-event ${event.flagged ? "timeline-event--flagged" : ""}`}>
              <div className="timeline-event__top">
                <div className="stack" style={{ gap: 8 }}>
                  <div className="timeline-event__title">
                    {config.icon}
                    <span>#{event.index} · {config.title}</span>
                  </div>
                  <div className="inline-pills">
                    <Pill tone={config.tone}>{event.toolName ?? event.type.replaceAll("_", " ")}</Pill>
                    {event.flagged ? <Pill tone="danger">Flagged</Pill> : null}
                    {event.createdAt ? <span className="timeline-event__meta mono">{event.createdAt}</span> : null}
                  </div>
                </div>
              </div>

              <EventSummary payload={event.payload} />

              <AdvancedSection title="Advanced event payload">
                <pre>{JSON.stringify(event.payload, null, 2)}</pre>
              </AdvancedSection>
            </article>
          )
        })}
      </div>
    </div>
  )
}

function EventSummary({ payload }: { payload: Record<string, unknown> }) {
  const violation = isRecord(payload.violation) ? payload.violation : null
  const signal = isRecord(payload.signal) ? payload.signal : null

  const summary =
    getString(payload.content) ||
    getString(payload.rule) ||
    getString(payload.toolUseId) ||
    getString(violation?.detail) ||
    getString(signal?.detail)

  if (!summary) {
    return <p className="muted" style={{ margin: 0 }}>Open advanced details to inspect the full payload.</p>
  }

  return <p style={{ margin: 0, lineHeight: 1.7, color: "#d8e4f7" }}>{summary}</p>
}

function getString(value: unknown): string | null {
  return typeof value === "string" && value.trim().length > 0 ? value : null
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null
}
