import Link from "next/link"
import { cardStyle, pageStyle } from "@/components/styles"

export default function HomePage() {
  return (
    <main style={pageStyle}>
      <h1 style={{ marginTop: 0 }}>FailBounty</h1>
      <p style={{ color: "#cbd5e1" }}>Capture → Submit → Replay → Verify → Record Proof</p>
      <div style={{ display: "grid", gap: 16, maxWidth: 800 }}>
        <div style={cardStyle}>
          <h2 style={{ marginTop: 0 }}>Researcher Flow</h2>
          <p>Open the bounty board, choose a program, run the sandbox exploit, inspect the trace, and submit a finding.</p>
          <Link href="/board">Open bounty board</Link>
        </div>
        <div style={cardStyle}>
          <h2 style={{ marginTop: 0 }}>Verifier Flow</h2>
          <p>Review submissions, rerun replay, check exact reproduction, and approve only when hashes and unsafe action match.</p>
          <Link href="/verifier">Open verifier queue</Link>
        </div>
      </div>
    </main>
  )
}
