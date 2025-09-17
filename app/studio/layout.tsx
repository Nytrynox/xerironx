export default function StudioLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-[var(--bg)]">
      {children}
    </div>
  )
}
