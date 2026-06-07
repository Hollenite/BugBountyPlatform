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

const EVENT_LABELS: Record<string, { title: string; kind: string; icon: React.ReactNode; tone: "neutral" | "warning" | "danger" | "accent" | "success" }> = {
  user_message: { title: "Scenario input", kind: "Agent intent", icon: <Bot size={16} />, tone: "neutral" },
  assistant_message: { title: "Agent reasoning", kind: "Agent intent", icon: <Bot size={16} />, tone: "accent" },
  assistant_tool_use: { title: "Tool selected", kind: "Tool call", icon: <Wrench size={16} />, tone: "warning" },
  tool_call: { title: "Tool executed", kind: "Tool call", icon: <Wrench size={16} />, tone: "warning" },
  tool_result: { title: "Tool returned", kind: "Tool result", icon: <CheckCircle2 size={16} />, tone: "success" },
  risk_signal: { title: "Risk signal detected", kind: "Risk signal", icon: <ShieldAlert size={16} />, tone: "warning" },
  policy_check: { title: "Policy evaluated", kind: "Policy check", icon: <CheckCircle2 size={16} />, tone: "accent" },
  confirmed_violation: { title: "Unsafe execution confirmed", kind: "Confirmed violation", icon: <AlertTriangle size={16} />, tone: "danger" },
}

export function TraceViewer({ events, title = "Evidence Timeline" }: { events: EventItem[]; title?: string }) {
  return (
    <div className="stack">
      <div className="stack" style={{ gap: 6 }}>
        <h3 style={{ margin: 0 }}>{title}</h3>
        <p className="muted" style={{ margin: 0 }}>
          Human-readable evidence first. Raw event payloads stay available under collapsible details.
        </p>
      </div>

      <div className="timeline">
        {events.map((event) => {
          const config = EVENT_LABELS[event.type] ?? {
            title: event.type.replaceAll("_", " "),
            kind: "Trace event",
            icon: <Flag size={16} />,
            tone: "neutral" as const,
          }

          return (
            <article key={event.index} className={`timeline-event ${event.flagged ? "timeline-event--flagged" : ""}`}>
              <div className="timeline-event__top">
                <div className="stack" style={{ gap: 8 }}>
                  <div className="timeline-event__title">
                    {config.icon}
                    <span>Step {event.index + 1} · {config.title}</span>
                  </div>
                  <div className="inline-pills">
                    <Pill tone={config.tone}>{config.kind}</Pill>
                    {event.toolName ? <Pill>{event.toolName}</Pill> : null}
                    {event.flagged ? <Pill tone="danger">Flagged</Pill> : null}
                    {event.createdAt ? <span className="timeline-event__meta mono">{event.createdAt}</span> : null}
                  </div>
                </div>
              </div>

              <EventSummary event={event} />

              <AdvancedSection title="Raw event payload">
                <pre>{JSON.stringify(event.payload, null, 2)}</pre>
              </AdvancedSection>
            </article>
          )
        })}
      </div>
    </div>
  )
}

function EventSummary({ event }: { event: EventItem }) {
  const payload = event.payload
  const violation = isRecord(payload.violation) ? payload.violation : null
  const signal = isRecord(payload.signal) ? payload.signal : null
  const toolInput = isRecord(payload.toolInput) ? payload.toolInput : null
  const toolOutput = isRecord(payload.toolOutput) ? payload.toolOutput : null

  if (event.type === "confirmed_violation") {
    return (
      <p style={{ margin: 0, lineHeight: 1.7, color: "#f8d5da" }}>
        {getString(violation?.detail) ?? "Unsafe AI-agent tool execution was confirmed for this scenario."}
      </p>
    )
  }

  if (event.type === "risk_signal") {
    return (
      <p style={{ margin: 0, lineHeight: 1.7 }}>
        {getString(signal?.detail) ?? "A risk signal was raised while the scenario was running."}
      </p>
    )
  }

  if (event.type === "tool_call") {
    const amount = typeof toolInput?.amount_usd === "number" ? `$${toolInput.amount_usd}` : null
    const order = getString(toolInput?.order_id)
    return <p style={{ margin: 0, lineHeight: 1.7 }}>The agent executed <span className="mono">{event.toolName}</span>{order ? ` for ${order}` : ""}{amount ? ` at ${amount}` : ""}.</p>
  }

  if (event.type === "tool_result") {
    const message = getString(toolOutput?.message) ?? getString(payload.content)
    return <p style={{ margin: 0, lineHeight: 1.7 }}>{message ?? "The tool returned structured output for the scenario."}</p>
  }

  if (event.type === "policy_check") {
    const passed = typeof payload.passed === "boolean" ? payload.passed : null
    return <p style={{ margin: 0, lineHeight: 1.7 }}>{passed === true ? "A policy check passed." : passed === false ? "A policy check failed and contributed to the evidence chain." : "A policy check was evaluated."}</p>
  }

  const summary = getString(payload.content) || getString(payload.rule) || getString(payload.toolUseId)
  if (!summary) {
    return <p className="muted" style={{ margin: 0 }}>Open the raw event payload for deeper technical context.</p>
  }

  return <p style={{ margin: 0, lineHeight: 1.7 }}>{summary}</p>
}

function getString(value: unknown): string | null {
  return typeof value === "string" && value.trim().length > 0 ? value : null
}

function isRecord(value: unknown): value is Record<string, any> {
  return typeof value === "object" && value !== null
}
