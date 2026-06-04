import { ProgramBoard } from "@/components/ProgramBoard"
import { pageStyle } from "@/components/styles"

async function getPrograms() {
  const res = await fetch("http://localhost:3000/api/programs", { cache: "no-store" })
  if (!res.ok) return []
  return res.json()
}

export default async function BoardPage() {
  const programs = await getPrograms()

  return (
    <main style={pageStyle}>
      <h1 style={{ marginTop: 0 }}>FailBounty Board</h1>
      <p style={{ color: "#cbd5e1" }}>Terminal-proven programs ready for sandbox testing.</p>
      <ProgramBoard programs={programs} />
    </main>
  )
}
