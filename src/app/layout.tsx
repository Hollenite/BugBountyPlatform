export const metadata = {
  title: "FailBounty",
  description: "Replayable AI-agent failure reports",
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
