import Link from "next/link"
import * as Accordion from "@radix-ui/react-accordion"
import { ChevronDown, Circle, FlaskConical, Home, LayoutGrid, LogIn, SearchCheck, Shield, Sparkles, UserRound, ArrowRight } from "lucide-react"
import clsx from "clsx"

const NAV_ITEMS = [
  { href: "/", label: "Home", icon: Home },
  { href: "/programs", label: "Programs", icon: LayoutGrid },
  { href: "/lab/prog-refund-demo", label: "Test Lab", icon: FlaskConical },
  { href: "/submissions", label: "Verifier Review", icon: SearchCheck },
  { href: "/account", label: "Account", icon: UserRound },
]

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="workspace-shell">
      <header className="top-nav">
        <div className="top-nav__inner">
          <Link href="/" className="brand-link">
            <span className="brand-mark">
              <Shield size={18} />
            </span>
            <span className="brand-title">FailBounty</span>
          </Link>

          <nav className="top-nav__links" aria-label="Primary">
            {NAV_ITEMS.map(({ href, label, icon: Icon }) => (
              <Link key={href} href={href} className="top-nav__link">
                <Icon size={15} />
                <span>{label}</span>
              </Link>
            ))}
          </nav>

          <Link href="/sign-in" className="button button--secondary top-nav__signin">
            <LogIn size={15} />
            Sign in
          </Link>
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

export function SurfaceCard({ className, children }: { className?: string; children: React.ReactNode }) {
  return <section className={clsx("surface-card", className)}>{children}</section>
}

export function MetricCard({ label, value, hint }: { label: string; value: string | number; hint?: string }) {
  return (
    <SurfaceCard className="metric-card">
      <p className="metric-card__label">{label}</p>
      <p className="metric-card__value">{value}</p>
      {hint ? <p className="metric-card__hint">{hint}</p> : null}
    </SurfaceCard>
  )
}

export function StatusBadge({ status }: { status: string | null | undefined }) {
  const key = status ?? "unknown"
  const labels: Record<string, string> = {
    pending: "Waiting for review",
    reproduced_exact: "Exact rerun match",
    reproduced_with_mismatch: "Rerun mismatch",
    not_reproduced: "Not reproduced",
    accepted: "Approved",
    rejected: "Rejected",
    unknown: "Not started",
  }
  const tones: Record<string, string> = {
    pending: "badge--warning",
    reproduced_exact: "badge--success",
    reproduced_with_mismatch: "badge--warning",
    not_reproduced: "badge--danger",
    accepted: "badge--success",
    rejected: "badge--danger",
    unknown: "badge--neutral",
  }
  return (
    <span className={clsx("badge", tones[key] ?? "badge--neutral")}>
      <Circle size={7} fill="currentColor" />
      {labels[key] ?? key.replaceAll("_", " ")}
    </span>
  )
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

export function EmptyState({ title, description, action }: { title: string; description: string; action?: React.ReactNode }) {
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
