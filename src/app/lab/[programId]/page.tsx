import { notFound } from "next/navigation"
import { redirect } from "next/navigation"
import { getProgramPresentation } from "@/lib/demoContent"
import { getProgramForLab } from "@/lib/server/queries"
import { ProgramLabConsole } from "./ProgramLabConsole"
import { getCurrentUserFromCookies } from "@/lib/auth/session"

export default async function ProgramLabPage({ params }: { params: { programId: string } }) {
  const [program, user] = await Promise.all([getProgramForLab(params.programId), getCurrentUserFromCookies()])
  if (!program) notFound()
  if (!user) redirect("/sign-in")
  if (user.role !== "researcher") redirect(`/programs/${params.programId}`)

  const presentation = getProgramPresentation(program)

  return <ProgramLabConsole params={params} program={program} presentation={presentation} />
}
