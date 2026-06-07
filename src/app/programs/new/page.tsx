import { redirect } from "next/navigation"
import { PageHeader, SecondaryLink } from "@/components/ui"
import { ProgramCreateForm } from "@/components/ProgramCreateForm"
import { getCurrentUserFromCookies } from "@/lib/auth/session"

export default async function NewProgramPage() {
  const user = await getCurrentUserFromCookies()
  if (!user) redirect("/sign-in")
  if (user.role !== "company") redirect("/programs")

  return (
    <main className="page-shell">
      <PageHeader
        title="Create hosted sandbox"
        description="Create a private program from the approved refund approval sandbox template."
        actions={<SecondaryLink href="/programs">Back to programs</SecondaryLink>}
      />
      <ProgramCreateForm />
    </main>
  )
}
