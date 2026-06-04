import { EmptyState, MetricCard, PageHeader, PrimaryLink } from "@/components/ui"
import { ProgramBoard } from "@/components/ProgramBoard"
import { getProgramsForBoard } from "@/lib/server/queries"

export default async function BoardPage() {
  const programs = await getProgramsForBoard()

  return (
    <main className="page-shell">
      <PageHeader
        eyebrow="Researcher flow"
        title="Bounty board"
        description="Choose a verified program, launch the exploit run, and walk judges through the full evidence capture -> replay -> proof loop."
        actions={<PrimaryLink href="/lab?programId=prog-refund-demo">Jump into demo sandbox</PrimaryLink>}
      />

      <section className="metrics-row">
        <MetricCard label="Active programs" value={String(programs.length)} hint="Curated for replayable AI-agent failure reports." />
        <MetricCard label="Primary target" value="Unsafe tool execution" hint="Programs focus on agent actions that cross policy boundaries." />
        <MetricCard label="Reward framing" value="Testnet ETH" hint="Judge-facing incentives stay explicit but secondary to proof quality." />
      </section>

      {programs.length === 0 ? (
        <EmptyState
          title="No programs ready"
          description="Seed the demo program first, then return to the board to launch the sandbox flow."
        />
      ) : (
        <ProgramBoard programs={programs} />
      )}
    </main>
  )
}
