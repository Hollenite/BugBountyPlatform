import { redirect } from "next/navigation"
import { PageHeader, Pill, SecondaryLink, SurfaceCard } from "@/components/ui"
import { WalletLinker } from "@/components/WalletLinker"
import { getCurrentUserFromCookies } from "@/lib/auth/session"

function shortWallet(wallet: string | null | undefined) {
  if (!wallet) return "Not linked"
  if (wallet.length <= 14) return wallet
  return `${wallet.slice(0, 6)}...${wallet.slice(-4)}`
}

export default async function AccountPage() {
  const user = await getCurrentUserFromCookies()
  if (!user) redirect("/sign-in")

  return (
    <main className="page-shell">
      <PageHeader
        title="Account"
        description="Your seeded private-alpha identity controls the demo actions available in each workflow."
        actions={<SecondaryLink href="/programs">Back to programs</SecondaryLink>}
      />

      <section className="detail-grid">
        <SurfaceCard>
          <div className="stack" style={{ gap: 16 }}>
            <div className="inline-pills">
              <Pill tone="accent">{user.role}</Pill>
            </div>
            <h2>{user.name}</h2>
            <div className="kv-list">
              <div className="kv-row"><span className="kv-row__label">Email</span><span className="kv-row__value">{user.email}</span></div>
              <div className="kv-row"><span className="kv-row__label">Role</span><span className="kv-row__value">{user.role}</span></div>
              <div className="kv-row"><span className="kv-row__label">Wallet status</span><span className="kv-row__value">{shortWallet(user.wallet)}</span></div>
            </div>
          </div>
        </SurfaceCard>

        <SurfaceCard>
          <div className="stack" style={{ gap: 12 }}>
            <h2>Role permissions</h2>
            <p className="muted" style={{ margin: 0, lineHeight: 1.7 }}>
              Researchers can run test sessions and submit findings. Verifiers can rerun and approve or reject findings. Companies can create hosted programs.
            </p>
            <div className="notice notice--warning">
              <p>Wallet is optional and used only as proof or reward metadata.</p>
            </div>
          </div>
        </SurfaceCard>
      </section>

      <section className="card-grid">
        <WalletLinker currentWallet={user.wallet} />
      </section>
    </main>
  )
}
