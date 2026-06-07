import { EmptyState, PageHeader, PrimaryLink } from "@/components/ui"
import { ProgramBoard } from "@/components/ProgramBoard"
import { getProgramsForBoard } from "@/lib/server/queries"
import { getCurrentUserFromCookies } from "@/lib/auth/session"

export default async function ProgramsPage() {
  const [programs, user] = await Promise.all([getProgramsForBoard(), getCurrentUserFromCookies()])
  const action =
    user?.role === "company" ? (
      <PrimaryLink href="/programs/new">Create program</PrimaryLink>
    ) : user?.role === "verifier" ? (
      <PrimaryLink href="/submissions">Go to review queue</PrimaryLink>
    ) : (
      <PrimaryLink href="/lab/prog-refund-demo">Start with demo program</PrimaryLink>
    )

  return (
    <main className="page-shell">
      <PageHeader
        title="Programs"
        description="Programs are hosted AI-agent workflows that researchers can test."
        actions={action}
      />

      {programs.length === 0 ? (
        <EmptyState
          title="No programs available"
          description="Seed the demo data first, then return here to inspect the available AI-agent security programs."
        />
      ) : (
        <ProgramBoard programs={programs} />
      )}
    </main>
  )
}
