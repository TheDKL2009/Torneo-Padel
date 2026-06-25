function MatchCard({ match }) {
  const statusClass = match.estadoRaw.replaceAll('_', '-')
  const parejaA = match.parejaA?.nombre || 'Por definir'
  const parejaB = match.parejaB?.nombre || 'Por definir'
  const isWinnerA = match.ganadorId && match.ganadorId === match.parejaAId
  const isWinnerB = match.ganadorId && match.ganadorId === match.parejaBId

  return (
    <article className="match-card">
      <div className="match-card__header">
        <span className="match-card__round">{match.ronda}</span>
        <span className={`status-pill ${statusClass}`}>{match.estado}</span>
      </div>

      <div className="match-card__teams">
        <span className={`match-card__team${isWinnerA ? ' winner' : ''}`}>{parejaA}</span>
        <span className="match-card__vs">vs</span>
        <span className={`match-card__team${isWinnerB ? ' winner' : ''}`}>{parejaB}</span>
      </div>

      {match.marcador
        ? <p className="match-card__score">{match.marcador}</p>
        : <p className="match-card__score pending">Pendiente de disputar</p>
      }

      <div className="match-card__meta">
        {match.categoria?.nombre && <span>{match.categoria.nombre}</span>}
        {match.fecha !== 'Sin fecha' && <span>{match.fecha}</span>}
        {match.hora !== 'Sin hora' && <span>{match.hora}</span>}
        {match.pista !== 'Sin pista' && <span>{match.pista}</span>}
      </div>
    </article>
  )
}

export default MatchCard
