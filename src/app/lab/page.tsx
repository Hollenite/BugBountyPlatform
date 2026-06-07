import { redirect } from "next/navigation"

export default function LegacyLabPage({ searchParams }: { searchParams: { programId?: string } }) {
  const target = searchParams.programId ?? "prog-refund-demo"
  redirect(`/lab/${target}`)
}
