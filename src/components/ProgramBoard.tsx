import { Bug, Coins, ShieldCheck, Sparkles } from "lucide-react"
import { Pill, PrimaryLink, SecondaryLink, SurfaceCard } from "./ui"

type Program = {
  id: string
  name: string
  description: string
  agentId: string
  company: { name: string }
  rewardPreview?: string | null
  poolBalanceLabel?: string | null
  scopeData?: { allowedCategories?: string[] }
}

export function ProgramBoard({ programs }: { programs: Program[] }) {
  return (
    <div className="card-grid">
      {programs.map((program) => (
        <SurfaceCard key={program.id} className="program-card">
          <div className="program-card__top">
            <div className="stack" style={{ gap: 12 }}>
              <div className="inline-pills">
                <Pill tone="accent">Active bounty</Pill>
                <Pill>{program.company.name}</Pill>
              </div>
              <div className="stack" style={{ gap: 8 }}>
                <h2>{program.name}</h2>
                <p className="program-card__description">{program.description}</p>
              </div>
            </div>
            <div className="stack" style={{ gap: 12, justifyItems: "end" }}>
              <MetricBadge icon={<Coins size={16} />} label="Top reward" value={program.rewardPreview ?? "—"} />
              <MetricBadge icon={<ShieldCheck size={16} />} label="Escrow pool" value={program.poolBalanceLabel ?? "—"} />
            </div>
          </div>

          <div className="inline-pills">
            <Pill><Bug size={14} /> {program.agentId}</Pill>
            {(program.scopeData?.allowedCategories ?? []).map((category) => (
              <Pill key={category} tone="warning">{category.replaceAll("_", " ")}</Pill>
            ))}
          </div>

          <div className="program-card__footer">
            <div className="stack" style={{ gap: 8 }}>
              <p className="muted" style={{ margin: 0 }}>
                Judges will see a full capture {"→"} replay {"→"} verify {"→"} proof flow from this program.
              </p>
            </div>
            <div className="page-header__actions">
              <PrimaryLink href={`/lab?programId=${program.id}`}>Launch sandbox</PrimaryLink>
              <SecondaryLink href="/verifier">Open verifier queue</SecondaryLink>
            </div>
          </div>
        </SurfaceCard>
      ))}
    </div>
  )
}

function MetricBadge({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="badge badge--neutral" style={{ gap: 8 }}>
      {icon}
      <span>{label}: <strong className="text-strong">{value}</strong></span>
      <Sparkles size={12} style={{ color: "var(--accent)" }} />
    </div>
  )
}
