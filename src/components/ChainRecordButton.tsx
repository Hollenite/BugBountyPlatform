"use client"

import { useRouter } from "next/navigation"
import { useMemo, useState } from "react"
import { BrowserProvider, Contract } from "ethers"
import { FAILBOUNTY_PROOF_REGISTRY_ABI } from "@/lib/chain/abi"
import { buildProofRecord } from "@/lib/chain/proofRegistry"
import { MONAD_TESTNET_CHAIN_ID, MONAD_TESTNET_EXPLORER_URL, monadTxUrl } from "@/lib/chain/monad"

declare global {
  interface Window {
    ethereum?: {
      request: (args: { method: string; params?: unknown[] }) => Promise<unknown>
    }
  }
}

type Props = {
  submissionId: string
  status: string
  replayResult: string | null
  chainProgramIndex: number | null
  chainFindingId: number | null
  submitFindingTx: string | null
  reportHash: string | null
  evidenceHash: string | null
  researcherWallet: string | null
}

const CHAIN_ID_HEX = `0x${MONAD_TESTNET_CHAIN_ID.toString(16)}`
const CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_FAILBOUNTY_CONTRACT_ADDRESS ?? ""

export function ChainRecordButton({
  submissionId,
  status,
  replayResult,
  chainProgramIndex,
  chainFindingId,
  submitFindingTx,
  reportHash,
  evidenceHash,
  researcherWallet,
}: Props) {
  const router = useRouter()
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState<{ tone: "success" | "warning" | "danger"; text: string } | null>(null)

  const disabledReason = useMemo(() => {
    if (chainFindingId !== null) return "This finding is already recorded on Monad testnet."
    if (status !== "accepted") return "Approve the finding before recording proof on Monad testnet."
    if (replayResult !== "reproduced_exact") return "On-chain proof requires an exact verifier rerun."
    if (chainProgramIndex === null) return "This program has not been configured on Monad testnet."
    if (!CONTRACT_ADDRESS) return "The Monad proof registry contract address is not configured."
    if (!reportHash || !evidenceHash) return "This submission is missing proof hashes."
    if (!researcherWallet) return "This submission is missing researcher wallet metadata."
    return null
  }, [chainFindingId, status, replayResult, chainProgramIndex, reportHash, evidenceHash, researcherWallet])

  async function ensureMonadTestnet() {
    if (!window.ethereum) throw new Error("MetaMask or another EVM wallet is required.")

    try {
      await window.ethereum.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: CHAIN_ID_HEX }],
      })
    } catch (error) {
      const code = typeof error === "object" && error && "code" in error ? (error as { code: number }).code : null
      if (code !== 4902) throw error

      await window.ethereum.request({
        method: "wallet_addEthereumChain",
        params: [
          {
            chainId: CHAIN_ID_HEX,
            chainName: "Monad Testnet",
            nativeCurrency: { name: "Monad", symbol: "MON", decimals: 18 },
            rpcUrls: ["https://testnet-rpc.monad.xyz"],
            blockExplorerUrls: [MONAD_TESTNET_EXPLORER_URL],
          },
        ],
      })
    }
  }

  async function recordProof() {
    if (disabledReason || chainProgramIndex === null || !reportHash || !evidenceHash || !researcherWallet) return

    setBusy(true)
    setMessage(null)

    try {
      await ensureMonadTestnet()

      const proofRecord = buildProofRecord({
        submissionId,
        chainProgramIndex,
        reportHash,
        evidenceHash,
        researcherWallet,
      })
      const provider = new BrowserProvider(window.ethereum!)
      const signer = await provider.getSigner()
      const contract = new Contract(CONTRACT_ADDRESS, FAILBOUNTY_PROOF_REGISTRY_ABI, signer)
      const args = [
        BigInt(proofRecord.chainProgramIndex),
        proofRecord.reportHash,
        proofRecord.evidenceHash,
        proofRecord.submissionId,
        proofRecord.researcherWallet,
      ] as const
      const gasEstimate = await contract.submitFindingFor.estimateGas(...args)
      const tx = await contract.submitFindingFor(...args, {
        gasLimit: gasEstimate + gasEstimate / 10n,
      })
      const receipt = await tx.wait()
      if (!receipt || receipt.status !== 1) throw new Error("Monad transaction did not succeed.")

      const response = await fetch(`/api/submissions/${submissionId}/chain-record`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ submitFindingTx: receipt.hash }),
      })
      const data = await response.json()
      if (!response.ok) {
        throw new Error(typeof data.error === "string" ? data.error : "Could not verify the Monad proof transaction.")
      }

      setMessage({ tone: "success", text: `Proof recorded on Monad testnet as finding #${data.chainFindingId}.` })
      router.refresh()
    } catch (error) {
      setMessage({ tone: "danger", text: error instanceof Error ? error.message : "Could not record proof on Monad testnet." })
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="surface-card form-grid">
      <div className="stack" style={{ gap: 8 }}>
        <h3>Monad proof</h3>
        <p className="muted" style={{ margin: 0 }}>
          Record the verifier-approved report hash and evidence hash on Monad testnet.
        </p>
      </div>

      {submitFindingTx ? (
        <a className="button button--secondary" href={monadTxUrl(submitFindingTx)} target="_blank" rel="noreferrer">
          View Monad transaction
        </a>
      ) : (
        <button type="button" className="button button--secondary" onClick={recordProof} disabled={busy || disabledReason !== null}>
          {busy ? "Recording on Monad..." : "Record proof on Monad testnet"}
        </button>
      )}

      {disabledReason ? <div className="notice notice--warning"><p>{disabledReason}</p></div> : null}
      {message ? <div className={`notice notice--${message.tone}`}><p>{message.text}</p></div> : null}
    </div>
  )
}
