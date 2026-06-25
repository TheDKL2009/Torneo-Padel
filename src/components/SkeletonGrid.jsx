function SkeletonCard() {
  return (
    <div className="skeleton-card" aria-hidden="true">
      <div className="skeleton skeleton--xs" />
      <div className="skeleton skeleton--lg" />
      <div className="skeleton skeleton--md" />
      <div className="skeleton skeleton--sm" />
    </div>
  )
}

function SkeletonGrid({ count = 3, className = 'match-grid' }) {
  return (
    <div className={className}>
      {Array.from({ length: count }, (_, i) => (
        <SkeletonCard key={i} />
      ))}
    </div>
  )
}

export default SkeletonGrid
