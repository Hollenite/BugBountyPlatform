import { Wrench } from "lucide-react"
import { Pill, PrimaryLink, SurfaceCard } from "./ui"
import { getProgramPresentation } from "@/lib/demoContent"

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
    <div className="queue-list">
      {programs.map((program) => {
        const presentation = getProgramPresentation(program)

        return (
          <SurfaceCard key={program.id} className="program-row">
            <div className="stack" style={{ gap: 10 }}>
              <div className="inline-pills">
                <Pill tone="accent">{presentation.companyName}</Pill>
                <Pill>{presentation.modelMode}</Pill>
                <Pill tone="success">Active</Pill>
              </div>
              <div className="stack" style={{ gap: 6 }}>
                <h2>{presentation.displayName}</h2>
                <p className="program-card__description">{presentation.shortDescription}</p>
              </div>
              <div className="inline-pills">
                <Pill><Wrench size={14} /> {presentation.tools.join(", ")}</Pill>
                {(presentation.scopeLabels ?? []).map((category) => (
                  <Pill key={category}>{category.replaceAll("_", " ")}</Pill>
                ))}
              </div>
            </div>

            <div className="stack" style={{ gap: 10, justifyItems: "end" }}>
              <span className="muted">What can be tested</span>
              <strong>{presentation.riskClass}</strong>
              <PrimaryLink href={`/programs/${program.id}`}>Open</PrimaryLink>
            </div>
          </SurfaceCard>
        )
      })}
    </div>
  )
}
