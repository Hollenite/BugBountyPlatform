import { redirect } from "next/navigation"

export default function LegacyVerifierReviewPage({ params }: { params: { submissionId: string } }) {
  redirect(`/submissions/${params.submissionId}`)
}
