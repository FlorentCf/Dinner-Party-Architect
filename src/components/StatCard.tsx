function StatCard({
  label,
  value,
  accent = false,
}: {
  label: string
  value: string
  accent?: boolean
}) {
  return (
    <article className={`stat-card${accent ? ' accent' : ''}`}>
      <span>{label}</span>
      <strong>{value}</strong>
    </article>
  )
}

export default StatCard
