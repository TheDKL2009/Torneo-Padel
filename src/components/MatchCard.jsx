import { getPendingParticipantLabel } from '../utils/participantLabels.js'

function MatchCard({ match, onEdit, tipoDeporte }) {
  const resolvedTipoDeporte = tipoDeporte || match.tipoDeporte
  const statusClass = (match.estado || 'pendiente').toLowerCase().replaceAll(' ', '-')
  const parejaA = match.parejaA?.nombre || getPendingParticipantLabel(resolvedTipoDeporte, 'A')
  const parejaB = match.parejaB?.nombre || getPendingParticipantLabel(resolvedTipoDeporte, 'B')
  const hasHorario = Boolean(match.fecha && match.hora)
  const pista = match.pista || 'Pista pendiente'

  return (
    <article className="match-card">
      <div className="match-card__top">
        <span className={`status-pill ${statusClass}`}>{match.estado}</span>
        <span className="phase-pill">{match.fase === 'grupos' ? 'Grupos' : 'Eliminatoria'}</span>
        <span>{match.ronda}</span>
      </div>
      <h3>
        {parejaA} <span>vs</span> {parejaB}
      </h3>
      <div className="match-card__meta">
        <span>{match.categoria?.nombre}</span>
        <span>{hasHorario ? match.fecha : 'Horario pendiente'}</span>
        {hasHorario && <span>{match.hora}</span>}
        <span>{pista}</span>
      </div>
      <p className="match-card__score">{match.marcador || 'Pendiente de disputar'}</p>
      {onEdit && (
        <button type="button" className="secondary-button" onClick={() => onEdit(match)}>
          Editar
        </button>
      )}
    </article>
  )
}

export default MatchCard
