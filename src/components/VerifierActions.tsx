"use client"

import { useRouter } from "next/navigation"
import { useMemo, useState } from "react"

type Props = {
  submissionId: string
  currentStatus: string
  replayResult: string | null
  defaultVerifierId: string
}

export function VerifierActions({ submissionId, currentStatus, replayResult, defaultVerifierId }: Props) {
  const router = useRouter()
  const [verifierId, setVerifierId] = useState(defaultVerifierId)
  const [severity, setSeverity] = useState("high")
  const [note, setNote] = useState("Replay reproduced the same unsafe issue_refund execution with matching prompt, tool config, and environment checks.")
  const [result, setResult] = useState<{ tone: "success" | "warning" | "danger"; text: string } | null>(null)
  const [busyAction, setBusyAction] = useState<string | null>(null)

  const canApprove = currentStatus === "pending" && replayResult === "reproduced_exact"
  const canReplay = currentStatus === "pending"
  const canReject = currentStatus === "pending"

  const helperText = useMemo(() => {
    if (currentStatus !== "pending") return "This submission is already resolved."
    if (replayResult !== "reproduced_exact") return "Approval stays locked until replay returns reproduced_exact."
    return "Replay is exact. Approval can now generate the final proof artifact."
  }, [currentStatus, replayResult])

  async function act(action: "replay" | "approve" | "reject") {
    setBusyAction(action)
    setResult(null)

    const payload: Record<string, unknown> = { action, verifierId }
    if (action !== "replay") payload.verifierNote = note
    if (action === "approve") payload.severity = severity

    const res = await fetch(`/api/verify/${submissionId}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    })

    const data = await res.json()
    setBusyAction(null)

    if (!res.ok) {
      setResult({ tone: "danger", text: data.error ?? "Verifier action failed" })
      return
    }

    const message =
      action === "replay"
        ? `Replay finished with ${data.replayStatus}.`
        : action === "approve"
          ? `Submission approved. Report hash: ${data.reportHash ?? "generated"}.`
          : "Submission rejected with verifier note."

    setResult({ tone: action === "reject" ? "warning" : "success", text: message })
    router.refresh()
  }

  return (
    <div className="surface-card form-grid">
      <div className="stack" style={{ gap: 8 }}>
        <h3>Verifier actions</h3>
        <p className="muted" style={{ margin: 0 }}>{helperText}</p>
      </div>

      <div className="field">
        <label htmlFor="verifierId">Verifier ID</label>
        <input id="verifierId" value={verifierId} onChange={(event) => setVerifierId(event.target.value)} className="input mono" />
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
          {busyAction === "replay" ? "Running replay…" : "Run replay"}
        </button>
        <button type="button" className="button button--primary" onClick={() => act("approve")} disabled={!canApprove || busyAction !== null}>
          {busyAction === "approve" ? "Approving…" : "Approve and generate proof"}
        </button>
        <button type="button" className="button button--danger" onClick={() => act("reject")} disabled={!canReject || busyAction !== null}>
          {busyAction === "reject" ? "Rejecting…" : "Reject finding"}
        </button>
      </div>

      {result ? <div className={`notice notice--${result.tone}`}><p>{result.text}</p></div> : null}
    </div>
  )
}
