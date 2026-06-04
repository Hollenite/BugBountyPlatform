import Link from "next/link"
import * as Accordion from "@radix-ui/react-accordion"
import { Shield, Sparkles, ArrowRight, ChevronDown } from "lucide-react"
import clsx from "clsx"

const FLOW_STEPS = ["Home", "Board", "Lab", "Submission", "Verifier Queue", "Verifier Review"]

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="app-shell">
      <div className="app-shell__gradient" />
      <header className="topbar">
        <div className="topbar__inner">
          <Link href="/" className="brand-link">
            <span className="brand-mark">
              <Shield size={18} />
            </span>
            <span>
              <span className="brand-title">FailBounty</span>
              <span className="brand-subtitle">Replayable AI-agent failure reports</span>
            </span>
          </Link>

          <nav className="topnav" aria-label="Primary">
            <Link href="/board">Bounty Board</Link>
            <Link href="/lab?programId=prog-refund-demo">Sandbox Lab</Link>
            <Link href="/verifier">Verifier Queue</Link>
          </nav>
        </div>

        <div className="flow-strip" aria-label="Product flow">
          {FLOW_STEPS.map((step, index) => (
            <div key={step} className="flow-step">
              <span className="flow-step__index">{index + 1}</span>
              <span>{step}</span>
            </div>
          ))}
        </div>
      </header>

      <div className="page-frame">{children}</div>
    </div>
  )
}

export function PageHeader({
  eyebrow,
  title,
  description,
  actions,
}: {
  eyebrow?: string
  title: string
  description?: string
  actions?: React.ReactNode
}) {
  return (
    <section className="page-header">
      <div>
        {eyebrow ? <p className="page-header__eyebrow">{eyebrow}</p> : null}
        <h1>{title}</h1>
        {description ? <p className="page-header__description">{description}</p> : null}
      </div>
      {actions ? <div className="page-header__actions">{actions}</div> : null}
    </section>
  )
}

export function SurfaceCard({
  className,
  children,
}: {
  className?: string
  children: React.ReactNode
}) {
  return <section className={clsx("surface-card", className)}>{children}</section>
}

export function MetricCard({
  label,
  value,
  hint,
}: {
  label: string
  value: string | number
  hint?: string
}) {
  return (
    <SurfaceCard className="metric-card">
      <p className="metric-card__label">{label}</p>
      <p className="metric-card__value">{value}</p>
      {hint ? <p className="metric-card__hint">{hint}</p> : null}
    </SurfaceCard>
  )
}

export function StatusBadge({ status }: { status: string | null | undefined }) {
  const normalized = (status ?? "unknown").replaceAll("_", " ")
  return <span className={clsx("badge", `badge--${(status ?? "unknown").toLowerCase()}`)}>{normalized}</span>
}

export function Pill({ tone = "neutral", children }: { tone?: "neutral" | "success" | "warning" | "danger" | "accent"; children: React.ReactNode }) {
  return <span className={clsx("badge", `badge--${tone}`)}>{children}</span>
}

export function PrimaryLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link href={href} className="button button--primary">
      {children}
      <ArrowRight size={16} />
    </Link>
  )
}

export function SecondaryLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link href={href} className="button button--secondary">
      {children}
    </Link>
  )
}

export function EmptyState({
  title,
  description,
  action,
}: {
  title: string
  description: string
  action?: React.ReactNode
}) {
  return (
    <SurfaceCard className="empty-state">
      <div className="empty-state__icon">
        <Sparkles size={18} />
      </div>
      <h3>{title}</h3>
      <p>{description}</p>
      {action ? <div>{action}</div> : null}
    </SurfaceCard>
  )
}

export function AdvancedSection({ title, children, defaultOpen = false }: { title: string; children: React.ReactNode; defaultOpen?: boolean }) {
  return (
    <Accordion.Root type="single" collapsible defaultValue={defaultOpen ? "details" : undefined}>
      <Accordion.Item value="details" className="advanced-section">
        <Accordion.Header>
          <Accordion.Trigger className="advanced-section__trigger">
            <span>{title}</span>
            <ChevronDown size={16} className="advanced-section__icon" />
          </Accordion.Trigger>
        </Accordion.Header>
        <Accordion.Content className="advanced-section__content">{children}</Accordion.Content>
      </Accordion.Item>
    </Accordion.Root>
  )
}
