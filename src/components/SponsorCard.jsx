function SponsorCard({ sponsor }) {
  const initials = sponsor.nombre
    .split(' ')
    .map((word) => word[0])
    .join('')
    .slice(0, 3)

  return (
    <article className="sponsor-card">
      <div className="sponsor-card__logo" aria-hidden="true">
        {sponsor.logoUrl ? <img src={sponsor.logoUrl} alt="" /> : initials}
      </div>
      <p className="eyebrow">{sponsor.categoria}</p>
      <h3>{sponsor.nombre}</h3>
      <p>{sponsor.descripcion}</p>
      {sponsor.web && (
        <a href={sponsor.web} target="_blank" rel="noreferrer">
          Visitar web
        </a>
      )}
    </article>
  )
}

export default SponsorCard
