"use client"

import { useRouter } from "next/navigation"
import { useMemo, useState } from "react"

type Props = {
  submissionId: string
  currentStatus: string
  replayResult: string | null
}

export function VerifierActions({ submissionId, currentStatus, replayResult }: Props) {
  const router = useRouter()
  const [severity, setSeverity] = useState("high")
  const [note, setNote] = useState("Verifier rerun reproduced the same unsafe execution path with matching violation, tool selection, and environment metadata.")
  const [result, setResult] = useState<{ tone: "success" | "warning" | "danger"; text: string } | null>(null)
  const [busyAction, setBusyAction] = useState<string | null>(null)

  const canApprove = currentStatus === "pending" && replayResult === "reproduced_exact"
  const canReplay = currentStatus === "pending"
  const canReject = currentStatus === "pending"

  const helperText = useMemo(() => {
    if (currentStatus !== "pending") return "This finding is already resolved in the verifier workspace."
    if (replayResult !== "reproduced_exact") return "Approval remains locked until the verifier rerun is an exact match."
    return "The reproduction is exact. Approval can now record the accepted finding as a proof hash."
  }, [currentStatus, replayResult])

  async function act(action: "replay" | "approve" | "reject") {
    setBusyAction(action)
    setResult(null)

    const payload: Record<string, unknown> = { action }
    if (action !== "replay") payload.verifierNote = note
    if (action === "approve") payload.severity = severity

    const res = await fetch(`/api/verify/${submissionId}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    })

    const contentType = res.headers.get("content-type") ?? ""
    const data = contentType.includes("application/json") ? await res.json() : { error: await res.text() }
    setBusyAction(null)

    if (!res.ok) {
      setResult({ tone: "danger", text: typeof data.error === "string" ? data.error : "Verifier action failed" })
      return
    }

    const message =
      action === "replay"
        ? `Reproduction completed with ${data.replayStatus}.`
        : action === "approve"
          ? "Finding approved. Report hash is available in Technical details."
          : "Finding rejected with verifier note."

    setResult({ tone: action === "reject" ? "warning" : "success", text: message })
    router.refresh()
  }

  return (
    <div className="surface-card form-grid">
      <div className="stack" style={{ gap: 8 }}>
        <h3>Review decision</h3>
        <p className="muted" style={{ margin: 0 }}>{helperText}</p>
      </div>

      <div className="field">
        <label htmlFor="severity">Severity</label>
        <select id="severity" value={severity} onChange={(event) => setSeverity(event.target.value)} className="select">
          <option value="critical">critical</option>
          <option value="high">high</option>
          <option value="medium">medium</option>
          <option value="low">low</option>
        </select>
      </div>

      <div className="field">
        <label htmlFor="note">Verifier note</label>
        <textarea id="note" value={note} onChange={(event) => setNote(event.target.value)} className="textarea" />
      </div>

      <div className="stack" style={{ gap: 10 }}>
        <button type="button" className="button button--secondary" onClick={() => act("replay")} disabled={!canReplay || busyAction !== null}>
          {busyAction === "replay" ? "Running rerun..." : "Run verifier rerun"}
        </button>
        <button type="button" className="button button--primary" onClick={() => act("approve")} disabled={!canApprove || busyAction !== null}>
          {busyAction === "approve" ? "Recording proof..." : "Approve finding"}
        </button>
        <button type="button" className="button button--danger" onClick={() => act("reject")} disabled={!canReject || busyAction !== null}>
          {busyAction === "reject" ? "Rejecting..." : "Reject finding"}
        </button>
      </div>

      {result ? <div className={`notice notice--${result.tone}`}><p>{result.text}</p></div> : null}
    </div>
  )
}
