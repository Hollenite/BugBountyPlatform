import { Building2, ClipboardCheck, FlaskConical, SearchCheck } from "lucide-react"
import { PrimaryLink, SecondaryLink, SurfaceCard } from "@/components/ui"

const roles = [
  {
    title: "Researcher",
    description: "Run a test and submit evidence.",
    icon: FlaskConical,
  },
  {
    title: "Verifier",
    description: "Rerun the scenario and approve only exact matches.",
    icon: SearchCheck,
  },
  {
    title: "Company",
    description: "Create hosted sandbox programs.",
    icon: Building2,
  },
]

const steps = [
  "Company creates a hosted sandbox.",
  "Researcher runs a test.",
  "Evidence timeline captures unsafe tool execution.",
  "Verifier reruns and approves or rejects.",
]

export default function HomePage() {
  return (
    <main className="page-shell">
      <section className="hero">
        <div className="hero-grid">
          <div className="hero-copy">
            <p className="page-header__eyebrow">Private alpha demo</p>
            <h1>Test AI agents before unsafe tool actions reach production.</h1>
            <p>
              FailBounty helps teams run hosted security test sessions, capture evidence, and let verifiers approve only findings that can be rerun.
            </p>
            <div className="hero-cta">
              <PrimaryLink href="/sign-in">Sign in</PrimaryLink>
              <SecondaryLink href="/programs/prog-refund-demo">View demo program</SecondaryLink>
            </div>
          </div>

          <SurfaceCard>
            <div className="stack" style={{ gap: 18 }}>
              <div className="inline-pills">
                <span className="badge badge--accent"><ClipboardCheck size={14} /> Guided workflow</span>
              </div>
              <h2>One demo loop, three clear roles</h2>
              <p className="muted" style={{ margin: 0, lineHeight: 1.7 }}>
                The app walks from program setup to test run, evidence timeline, verifier rerun, and proof hash without making blockchain or payout mechanics the center of the product.
              </p>
              <div className="kv-list">
                <div className="kv-row"><span className="kv-row__label">Primary evidence</span><span className="kv-row__value">Evidence timeline</span></div>
                <div className="kv-row"><span className="kv-row__label">Approval gate</span><span className="kv-row__value">Exact rerun match</span></div>
                <div className="kv-row"><span className="kv-row__label">Proof artifact</span><span className="kv-row__value">Evidence and report hashes</span></div>
              </div>
            </div>
          </SurfaceCard>
        </div>
      </section>

      <section className="role-grid" aria-label="Role paths">
        {roles.map(({ title, description, icon: Icon }) => (
          <SurfaceCard key={title}>
            <div className="stack" style={{ gap: 12 }}>
              <span className="badge badge--accent"><Icon size={14} /> {title}</span>
              <h2>{description}</h2>
            </div>
          </SurfaceCard>
        ))}
      </section>

      <section className="page-shell" aria-labelledby="how-it-works">
        <div>
          <p className="page-header__eyebrow">How it works</p>
          <h2 id="how-it-works" style={{ margin: "6px 0 0", fontSize: "2rem" }}>From sandbox to verifier review</h2>
        </div>
        <div className="steps-grid">
          {steps.map((step, index) => (
            <SurfaceCard key={step}>
              <div className="stack" style={{ gap: 10 }}>
                <span className="badge">{index + 1}</span>
                <p style={{ margin: 0, lineHeight: 1.6 }}>{step}</p>
              </div>
            </SurfaceCard>
          ))}
        </div>
      </section>
    </main>
  )
}
