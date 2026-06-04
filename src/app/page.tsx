import { ArrowRight, ShieldCheck, Sparkles, Wrench } from "lucide-react"
import { MetricCard, PageHeader, PrimaryLink, SecondaryLink, SurfaceCard } from "@/components/ui"

export default function HomePage() {
  return (
    <main className="page-shell">
      <SurfaceCard className="hero">
        <div className="hero-grid">
          <div className="hero-copy">
            <p className="page-header__eyebrow">Hackathon demo · replayable evidence</p>
            <h1>Capture unsafe agent-tool execution. Prove it. Reproduce it.</h1>
            <p>
              FailBounty turns fragile AI-agent failures into a structured verification flow: capture the exploit, preserve the trace,
              rerun reproduction-by-rerun, and hand a verifier proof artifacts they can trust.
            </p>
            <div className="hero-cta">
              <PrimaryLink href="/board">Start from the bounty board</PrimaryLink>
              <SecondaryLink href="/verifier">Watch the verifier flow</SecondaryLink>
            </div>
          </div>

          <div className="stack">
            <MetricCard label="Primary proof" value="Replayable traces" hint="Capture event-by-event evidence before verifier review." />
            <MetricCard label="Approval gate" value="Exact replay required" hint="Only reproduced_exact findings can be approved." />
            <MetricCard label="Output artifact" value="Report hash" hint="Structured proof lives beyond the raw demo screen." />
          </div>
        </div>
      </SurfaceCard>

      <section className="hero-proof-strip">
        <MetricCard label="1 · Capture" value="Unsafe execution" hint="Prompt an agent into an unsafe tool path." />
        <MetricCard label="2 · Inspect" value="Trace + policy checks" hint="Preserve the event stream and risk signals." />
        <MetricCard label="3 · Verify" value="Reproduction-by-rerun" hint="Re-run and compare the unsafe action precisely." />
        <MetricCard label="4 · Record proof" value="Evidence + report hash" hint="Close the loop with verifiable artifacts." />
      </section>

      <PageHeader
        eyebrow="Two demo paths"
        title="Run the same product from both sides of trust"
        description="Start as the researcher proving unsafe execution, or step straight into the verifier queue to inspect reproduction and approval gating."
      />

      <section className="card-grid">
        <SurfaceCard>
          <div className="stack" style={{ gap: 16 }}>
            <div className="inline-pills">
              <span className="badge badge--accent"><Sparkles size={14} /> Researcher flow</span>
            </div>
            <h2>Find the exploit. Preserve the evidence. Escalate the finding.</h2>
            <p className="muted" style={{ margin: 0 }}>
              Move from bounty selection into a guided exploit run, inspect the replayable trace, and create a verifier-ready submission with clean reproduction steps.
            </p>
            <PrimaryLink href="/board">Open bounty board</PrimaryLink>
          </div>
        </SurfaceCard>

        <SurfaceCard>
          <div className="stack" style={{ gap: 16 }}>
            <div className="inline-pills">
              <span className="badge badge--warning"><ShieldCheck size={14} /> Verifier flow</span>
            </div>
            <h2>Replay the evidence. Gate approval. Generate proof.</h2>
            <p className="muted" style={{ margin: 0 }}>
              Review the captured submission, compare replay outcomes, inspect the unsafe tool execution, and approve only when the rerun matches exactly.
            </p>
            <PrimaryLink href="/verifier">Open verifier queue</PrimaryLink>
          </div>
        </SurfaceCard>
      </section>

      <section className="metrics-row">
        <SurfaceCard>
          <div className="stack" style={{ gap: 12 }}>
            <span className="badge"><Wrench size={14} /> Unsafe execution focus</span>
            <p className="muted" style={{ margin: 0 }}>
              The product centers on unsafe agent-tool execution, not generic prompt injection theater.
            </p>
          </div>
        </SurfaceCard>
        <SurfaceCard>
          <div className="stack" style={{ gap: 12 }}>
            <span className="badge"><ShieldCheck size={14} /> Reproduction-by-rerun</span>
            <p className="muted" style={{ margin: 0 }}>
              Replay is framed as an operational rerun with explicit comparison checks, not perfect determinism claims.
            </p>
          </div>
        </SurfaceCard>
        <SurfaceCard>
          <div className="stack" style={{ gap: 12 }}>
            <span className="badge"><ArrowRight size={14} /> Optional chain anchoring</span>
            <p className="muted" style={{ margin: 0 }}>
              Off-chain proof and verifier trust stay primary; optional testnet anchoring remains secondary.
            </p>
          </div>
        </SurfaceCard>
      </section>
    </main>
  )
}
