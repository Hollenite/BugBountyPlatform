"use client"

import { useRouter } from "next/navigation"
import { useState } from "react"

export function ProgramCreateForm() {
  const router = useRouter()
  const [status, setStatus] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  async function submit(formData: FormData) {
    setSubmitting(true)
    setStatus(null)

    const name = String(formData.get("name") ?? "")
    const id = String(formData.get("id") ?? "").trim()
    const description = String(formData.get("description") ?? "")

    const response = await fetch("/api/programs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: id || undefined,
        name,
        description,
        targetTemplateId: "refund-agent",
        visibility: "private",
        scope: {
          allowedCategories: ["overspend", "no_approval"],
          blockedTargets: ["external_api", "production_system"],
        },
        policy: {
          maxRefundUsd: 50,
          requiresConfirmedViolation: true,
        },
        reward: {
          display: "Symbolic testnet reward only",
        },
        active: true,
      }),
    })
    const data = await response.json()
    setSubmitting(false)

    if (!response.ok) {
      setStatus(data.error ?? "Program creation failed")
      return
    }

    router.push(`/programs/${data.id}`)
    router.refresh()
  }

  return (
    <form action={submit} className="surface-card form-grid">
      <div className="stack" style={{ gap: 8 }}>
        <h3>Program basics</h3>
        <p className="muted" style={{ margin: 0 }}>
          External targets are not supported in private alpha.
        </p>
      </div>

      <div className="progress-steps" aria-label="Program creation steps">
        <div className="progress-step progress-step--active">1. Program basics</div>
        <div className="progress-step">2. Template</div>
        <div className="progress-step">3. Scope</div>
        <div className="progress-step">4. Publish</div>
      </div>

      <div className="form-grid form-grid--two">
        <div className="field">
          <label htmlFor="name">Program name</label>
          <input id="name" name="name" className="input" defaultValue="Acme Refund Agent Alpha" required />
        </div>
        <div className="field">
          <label htmlFor="id">Optional slug</label>
          <input id="id" name="id" className="input" placeholder="acme-refund-alpha" />
        </div>
      </div>

      <div className="field">
        <label htmlFor="description">Description</label>
        <textarea
          id="description"
          name="description"
          className="textarea"
          defaultValue="A hosted refund-agent sandbox for testing approval confusion and over-limit unsafe tool execution."
          required
        />
      </div>

      <div className="spec-grid">
        <div className="notice">
          <p><strong>Template:</strong> Refund approval sandbox. This template is selected and locked for v1.</p>
        </div>
        <div className="notice">
          <p><strong>Scope:</strong> Private visibility with overspend and approval confusion findings enabled.</p>
        </div>
      </div>

      <button type="submit" className="button button--primary" disabled={submitting}>
        {submitting ? "Creating..." : "Create program"}
      </button>

      {status ? <div className="notice notice--danger"><p>{status}</p></div> : null}
    </form>
  )
}
