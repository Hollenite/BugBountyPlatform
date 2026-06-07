import type { Metadata, Viewport } from "next"
import "./globals.css"
import { AppShell } from "@/components/ui"

export const metadata: Metadata = {
  title: "FailBounty",
  description:
    "FailBounty captures unsafe AI-agent tool executions as structured traces, lets verifiers reproduce the failure by rerunning the same scenario, and records an accepted finding as a proof hash.",
  icons: {
    icon: "/icon.svg",
  },
}

export const viewport: Viewport = {
  themeColor: "#ffffff",
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <AppShell>{children}</AppShell>
      </body>
    </html>
  )
}
