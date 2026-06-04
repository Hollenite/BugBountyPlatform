"use client"

import { useState } from "react"
import { buttonStyle, cardStyle, inputStyle } from "./styles"

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
    <form action={handleSubmit} style={{ ...cardStyle, display: "grid", gap: 10 }}>
      <h3 style={{ margin: 0 }}>Submit finding</h3>
      <input name="title" placeholder="Title" style={inputStyle} required />
      <textarea name="description" placeholder="Description" style={{ ...inputStyle, minHeight: 90 }} required />
      <textarea name="stepsToRepro" placeholder="Steps to reproduce" style={{ ...inputStyle, minHeight: 90 }} required />
      <textarea name="expectedBehavior" placeholder="Expected behavior" style={{ ...inputStyle, minHeight: 70 }} required />
      <textarea name="actualBehavior" placeholder="Actual behavior" style={{ ...inputStyle, minHeight: 70 }} required />
      <button type="submit" style={buttonStyle} disabled={submitting}>
        {submitting ? "Submitting..." : "Create submission"}
      </button>
      {error ? <p style={{ color: "#fca5a5", margin: 0 }}>{error}</p> : null}
    </form>
  )
}
