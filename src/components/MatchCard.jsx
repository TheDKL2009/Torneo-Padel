function MatchCard({ match }) {
  const statusClass = match.estado.toLowerCase().replaceAll(' ', '-')
  const parejaA = match.parejaA?.nombre || 'Pareja A pendiente'
  const parejaB = match.parejaB?.nombre || 'Pareja B pendiente'

  return (
    <article className="match-card">
      <div className="match-card__top">
        <span className={`status-pill ${statusClass}`}>{match.estado}</span>
        <span>{match.ronda}</span>
      </div>
      <h3>
        {parejaA} <span>vs</span> {parejaB}
      </h3>
      <div className="match-card__meta">
        <span>{match.categoria?.nombre}</span>
        <span>{match.fecha}</span>
        <span>{match.hora}</span>
        <span>{match.pista}</span>
      </div>
      <p className="match-card__score">{match.marcador || 'Pendiente de disputar'}</p>
    </article>
  )
}

export default MatchCard
