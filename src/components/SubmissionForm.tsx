"use client"

import { useState } from "react"

type Props = {
  sessionId: string
  researcherId: string
  onSubmitted: (submissionId: string) => void
}

export function SubmissionForm({ sessionId, researcherId, onSubmitted }: Props) {
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(formData: FormData) {
    setSubmitting(true)
    setError(null)

    const payload = {
      sessionId,
      researcherId,
      title: String(formData.get("title") ?? ""),
      description: String(formData.get("description") ?? ""),
      stepsToRepro: String(formData.get("stepsToRepro") ?? ""),
      expectedBehavior: String(formData.get("expectedBehavior") ?? ""),
      actualBehavior: String(formData.get("actualBehavior") ?? ""),
      researcherWallet: String(formData.get("researcherWallet") ?? ""),
    }

    const res = await fetch("/api/submissions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    })

    const data = await res.json()
    setSubmitting(false)

    if (!res.ok) {
      setError(data.error ?? "Submission failed")
      return
    }

    onSubmitted(data.id)
  }

  return (
    <form action={handleSubmit} className="surface-card form-grid">
      <div className="stack" style={{ gap: 8 }}>
        <h3>Escalate to verifier</h3>
        <p className="muted" style={{ margin: 0 }}>
          Turn the captured unsafe execution into a judge-ready report with clean reproduction steps and expected vs actual behavior.
        </p>
      </div>

      <div className="form-grid form-grid--two">
        <div className="field">
          <label htmlFor="title">Finding title</label>
          <input id="title" name="title" className="input" placeholder="Refund agent exceeds policy cap after approval output" required />
        </div>
        <div className="field">
          <label htmlFor="researcherWallet">Researcher wallet (optional)</label>
          <input id="researcherWallet" name="researcherWallet" className="input" placeholder="0x..." />
        </div>
      </div>

      <div className="field">
        <label htmlFor="description">Impact summary</label>
        <textarea id="description" name="description" className="textarea" placeholder="Explain the unsafe agent-tool execution clearly and crisply." required />
      </div>

      <div className="field">
        <label htmlFor="stepsToRepro">Reproduction by rerun</label>
        <textarea id="stepsToRepro" name="stepsToRepro" className="textarea" placeholder="List the exact exploit prompt and sequence needed to reproduce the behavior." required />
      </div>

      <div className="form-grid form-grid--two">
        <div className="field">
          <label htmlFor="expectedBehavior">Expected behavior</label>
          <textarea id="expectedBehavior" name="expectedBehavior" className="textarea" placeholder="The agent should refuse unsafe execution above policy limits." required />
        </div>
        <div className="field">
          <label htmlFor="actualBehavior">Actual behavior</label>
          <textarea id="actualBehavior" name="actualBehavior" className="textarea" placeholder="The agent issues the unsafe tool action after approval output." required />
        </div>
      </div>

      <button type="submit" className="button button--primary" disabled={submitting}>
        {submitting ? "Submitting finding…" : "Create verifier submission"}
      </button>
      {error ? <div className="notice notice--danger"><p>{error}</p></div> : null}
    </form>
  )
}
