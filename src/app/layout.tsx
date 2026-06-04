import type { Metadata, Viewport } from "next"
import "./globals.css"
import { AppShell } from "@/components/ui"

export const metadata: Metadata = {
  title: "FailBounty",
  description: "Replayable AI-agent failure reports",
}

export const viewport: Viewport = {
  themeColor: "#07111f",
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
