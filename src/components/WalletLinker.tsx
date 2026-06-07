"use client"

import { useRouter } from "next/navigation"
import { useState } from "react"

declare global {
  interface Window {
    ethereum?: {
      request: (args: { method: string; params?: unknown[] }) => Promise<unknown>
    }
  }
}

export function WalletLinker({ currentWallet }: { currentWallet?: string | null }) {
  const router = useRouter()
  const [status, setStatus] = useState<string | null>(currentWallet ? `Linked wallet: ${currentWallet}` : null)
  const [busy, setBusy] = useState(false)

  async function linkWallet() {
    if (!window.ethereum) {
      setStatus("MetaMask is not available in this browser.")
      return
    }

    setBusy(true)
    setStatus(null)

    const accounts = await window.ethereum.request({ method: "eth_requestAccounts" }) as string[]
    const account = accounts[0]
    if (!account) {
      setBusy(false)
      setStatus("No wallet account selected.")
      return
    }

    const nonceResponse = await fetch("/api/wallet/nonce", { method: "POST" })
    const nonceData = await nonceResponse.json()
    if (!nonceResponse.ok) {
      setBusy(false)
      setStatus(nonceData.error ?? "Could not create wallet nonce.")
      return
    }

    const signature = await window.ethereum.request({
      method: "personal_sign",
      params: [nonceData.message, account],
    }) as string

    const verifyResponse = await fetch("/api/wallet/verify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ signature }),
    })
    const verifyData = await verifyResponse.json()
    setBusy(false)

    if (!verifyResponse.ok) {
      setStatus(verifyData.error ?? "Wallet verification failed.")
      return
    }

    setStatus(`Linked wallet: ${verifyData.wallet}`)
    router.refresh()
  }

  return (
    <div className="surface-card form-grid">
      <div className="stack" style={{ gap: 8 }}>
        <h3>Wallet is optional</h3>
        <p className="muted" style={{ margin: 0 }}>
          Link MetaMask only if you want wallet metadata attached to proof and reward records. It is not used for sign-in.
        </p>
      </div>

      <button type="button" className="button button--secondary" onClick={linkWallet} disabled={busy}>
        {busy ? "Linking..." : currentWallet ? "Relink MetaMask" : "Link MetaMask"}
      </button>

      {status ? <div className="notice notice--warning"><p>{status}</p></div> : null}
    </div>
  )
}
