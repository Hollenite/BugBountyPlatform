"use client"

import { useState } from "react"
import { buttonStyle, cardStyle, inputStyle } from "./styles"

const DEFAULT_VERIFIER_ID = "d2a00e4c-4eec-4777-b4f2-18c5475321b4"

export function VerifierActions({ submissionId, currentStatus, replayResult }: { submissionId: string; currentStatus: string; replayResult: string | null }) {
  const [verifierId, setVerifierId] = useState(DEFAULT_VERIFIER_ID)
  const [severity, setSeverity] = useState("high")
  const [note, setNote] = useState("Replay reproduced the same issue_refund call for ORD-8821 at $250 with matching prompt, tool config, and environment hashes.")
  const [result, setResult] = useState<string>("")

  async function act(action: "replay" | "approve" | "reject") {
    const payload: Record<string, unknown> = { action, verifierId }
    if (action !== "replay") payload.verifierNote = note
    if (action === "approve") payload.severity = severity

    const res = await fetch(`/api/verify/${submissionId}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    })
    const data = await res.json()
    setResult(JSON.stringify(data, null, 2))
  }

  return (
    <div style={{ ...cardStyle, display: "grid", gap: 10 }}>
      <h3 style={{ margin: 0 }}>Verifier actions</h3>
      <p style={{ margin: 0 }}>Submission status: {currentStatus} · Replay result: {replayResult ?? "pending"}</p>
      <label>
        Verifier ID
        <input value={verifierId} onChange={(e) => setVerifierId(e.target.value)} style={inputStyle} />
      </label>
      <label>
        Severity
        <select value={severity} onChange={(e) => setSeverity(e.target.value)} style={inputStyle}>
          <option value="critical">critical</option>
          <option value="high">high</option>
          <option value="medium">medium</option>
          <option value="low">low</option>
        </select>
      </label>
      <label>
        Verifier note
        <textarea value={note} onChange={(e) => setNote(e.target.value)} style={{ ...inputStyle, minHeight: 100 }} />
      </label>
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
        <button style={buttonStyle} onClick={() => act("replay")}>Run replay</button>
        <button style={buttonStyle} onClick={() => act("approve")}>Approve</button>
        <button style={{ ...buttonStyle, background: "#7f1d1d", borderColor: "#7f1d1d" }} onClick={() => act("reject")}>Reject</button>
      </div>
      {result ? <pre style={{ margin: 0, whiteSpace: "pre-wrap" }}>{result}</pre> : null}
    </div>
  )
}
