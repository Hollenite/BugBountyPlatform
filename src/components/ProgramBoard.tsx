import Link from "next/link"
import { cardStyle } from "./styles"

type Program = {
  id: string
  name: string
  description: string
  agentId: string
  company: { name: string }
}

export function ProgramBoard({ programs }: { programs: Program[] }) {
  return (
    <div style={{ display: "grid", gap: 16 }}>
      {programs.map((program) => (
        <div key={program.id} style={cardStyle}>
          <div style={{ display: "flex", justifyContent: "space-between", gap: 16, alignItems: "start" }}>
            <div>
              <h2 style={{ margin: "0 0 8px" }}>{program.name}</h2>
              <p style={{ margin: "0 0 8px", color: "#cbd5e1" }}>{program.description}</p>
              <p style={{ margin: 0, color: "#94a3b8" }}>
                Company: {program.company.name} · Agent: {program.agentId}
              </p>
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <Link href={`/lab?programId=${program.id}`}>Open sandbox</Link>
              <Link href="/verifier">Verifier queue</Link>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
