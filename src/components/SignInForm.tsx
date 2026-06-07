"use client"

import { useRouter } from "next/navigation"
import { useState } from "react"

const PRESET_EMAILS = [
  { label: "Continue as Researcher", email: "researcher@demo.com" },
  { label: "Continue as Verifier", email: "verifier@demo.com" },
  { label: "Continue as Company", email: "acme@demo.com" },
]

export function SignInForm() {
  const router = useRouter()
  const [email, setEmail] = useState(PRESET_EMAILS[0].email)
  const [status, setStatus] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  async function submit(nextEmail = email) {
    setSubmitting(true)
    setStatus(null)

    const response = await fetch("/api/auth/sign-in", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: nextEmail }),
    })
    const data = await response.json()
    setSubmitting(false)

    if (!response.ok) {
      setStatus(data.error ?? "Sign-in failed")
      return
    }

    const role = data.user?.role
    const destination = role === "verifier" ? "/submissions" : role === "company" ? "/programs/new" : "/programs"

    setStatus(`Signed in as ${data.user.name}`)
    router.refresh()
    router.push(destination)
  }

  return (
    <div className="surface-card sign-in-panel">
      <div className="stack" style={{ gap: 8 }}>
        <h3>Sign in to FailBounty</h3>
        <p className="muted" style={{ margin: 0 }}>
          Choose a seeded private-alpha role to try the workflow.
        </p>
      </div>

      <div className="role-button-grid">
        {PRESET_EMAILS.map((preset) => (
          <button key={preset.email} type="button" className="button button--primary" onClick={() => submit(preset.email)} disabled={submitting}>
            {preset.label}
          </button>
        ))}
      </div>

      <div className="field">
        <label htmlFor="email">Manual email</label>
        <input id="email" className="input" type="email" value={email} onChange={(event) => setEmail(event.target.value)} />
      </div>

      <button type="button" className="button button--secondary" onClick={() => submit()} disabled={submitting}>
        {submitting ? "Signing in..." : "Sign in"}
      </button>

      {status ? <div className="notice notice--warning"><p>{status}</p></div> : null}
    </div>
  )
}
