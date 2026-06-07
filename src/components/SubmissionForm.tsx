"use client"

import { useState } from "react"

type Props = {
  sessionId: string
  onSubmitted: (submissionId: string) => void
  defaultValues?: {
    title?: string
    description?: string
    stepsToRepro?: string
    expectedBehavior?: string
    actualBehavior?: string
  }
}

export function SubmissionForm({ sessionId, onSubmitted, defaultValues }: Props) {
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(formData: FormData) {
    setSubmitting(true)
    setError(null)

    const payload = {
      sessionId,
      title: String(formData.get("title") ?? ""),
      description: String(formData.get("description") ?? ""),
      stepsToRepro: String(formData.get("stepsToRepro") ?? ""),
      expectedBehavior: String(formData.get("expectedBehavior") ?? ""),
      actualBehavior: String(formData.get("actualBehavior") ?? ""),
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
        <h3>Submit finding</h3>
        <p className="muted" style={{ margin: 0 }}>
          Keep the write-up short. The evidence timeline and technical details are attached automatically.
        </p>
      </div>

      <div className="field">
        <label htmlFor="title">Finding title</label>
        <input id="title" name="title" className="input" defaultValue={defaultValues?.title} placeholder="Approval confusion triggers an unsafe refund execution above policy cap" required />
      </div>

      <div className="field">
        <label htmlFor="description">Summary</label>
        <textarea id="description" name="description" className="textarea" defaultValue={defaultValues?.description} placeholder="Describe the unsafe tool execution crisply for the verifier workspace." required />
      </div>

      <div className="field">
        <label htmlFor="stepsToRepro">Reproduction steps</label>
        <textarea id="stepsToRepro" name="stepsToRepro" className="textarea" defaultValue={defaultValues?.stepsToRepro} placeholder="List the exact scenario steps required to reproduce the behavior." required />
      </div>

      <div className="form-grid form-grid--two">
        <div className="field">
          <label htmlFor="expectedBehavior">Expected behavior</label>
          <textarea id="expectedBehavior" name="expectedBehavior" className="textarea" defaultValue={defaultValues?.expectedBehavior} placeholder="The agent should escalate but never execute refunds above $50 automatically." required />
        </div>
        <div className="field">
          <label htmlFor="actualBehavior">Actual behavior</label>
          <textarea id="actualBehavior" name="actualBehavior" className="textarea" defaultValue={defaultValues?.actualBehavior} placeholder="The agent executes the refund after approval output even though the policy cap should still apply." required />
        </div>
      </div>

      <button type="submit" className="button button--primary" disabled={submitting}>
        {submitting ? "Submitting finding…" : "Submit finding"}
      </button>
      {error ? <div className="notice notice--danger"><p>{error}</p></div> : null}
    </form>
  )
}
