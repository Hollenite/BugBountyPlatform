import Link from "next/link"
import { cardStyle, pageStyle } from "@/components/styles"

async function getSubmissions() {
  const res = await fetch("http://localhost:3000/api/submissions", { cache: "no-store" })
  if (!res.ok) return []
  return res.json()
}

export default async function VerifierQueuePage() {
  const submissions = await getSubmissions()

  return (
    <main style={pageStyle}>
      <h1 style={{ marginTop: 0 }}>Verifier Queue</h1>
      <div style={{ display: "grid", gap: 16 }}>
        {submissions.map((submission: any) => (
          <div key={submission.id} style={cardStyle}>
            <h2 style={{ marginTop: 0 }}>{submission.title}</h2>
            <p style={{ color: "#cbd5e1" }}>{submission.description}</p>
            <p style={{ margin: 0 }}>
              Status: {submission.status} · Replay: {submission.replayResult}
            </p>
            <Link href={`/verifier/${submission.id}`}>Open review</Link>
          </div>
        ))}
      </div>
    </main>
  )
}
