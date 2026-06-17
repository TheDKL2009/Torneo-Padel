import { getPendingParticipantLabel } from '../../utils/participantLabels.js'

function getPairLabel(pair, tipoDeporte) {
  return pair?.nombre || getPendingParticipantLabel(tipoDeporte)
}

function getSetScores(match, side) {
  return [1, 2, 3]
    .map((setNumber) => match[`set${setNumber}_${side}`])
    .filter((value) => value !== null && value !== undefined)
}

function BracketMatchCard({ match, onEdit }) {
  const scoresA = getSetScores(match, 'a')
  const scoresB = getSetScores(match, 'b')
  const hasGoals = match.goles_a !== null && match.goles_a !== undefined && match.goles_b !== null && match.goles_b !== undefined
  const hasPenalties = match.penaltis_a !== null && match.penaltis_a !== undefined && match.penaltis_b !== null && match.penaltis_b !== undefined
  const scoreA = hasGoals ? `${match.goles_a}${hasPenalties ? ` (${match.penaltis_a})` : ''}` : scoresA.length ? scoresA.join(' ') : '-'
  const scoreB = hasGoals ? `${match.goles_b}${hasPenalties ? ` (${match.penaltis_b})` : ''}` : scoresB.length ? scoresB.join(' ') : '-'
  const winnerA = match.ganadorId && match.ganadorId === match.parejaAId
  const winnerB = match.ganadorId && match.ganadorId === match.parejaBId
  const estado = match.estadoRaw || match.estado || 'pendiente'
  const statusClass = estado.toLowerCase().replaceAll(' ', '-')
  const horario = match.fecha && match.hora ? `${match.fecha} / ${match.hora}` : 'Horario pendiente'

  return (
    <article className="bracket-match-card">
      <div className="bracket-match-card__meta">
        <span>{match.ronda || 'Ronda'}</span>
        <span>{match.pista || 'Pista pendiente'}</span>
      </div>

      <div className={winnerA ? 'bracket-player winner' : 'bracket-player'}>
        <span>{getPairLabel(match.parejaA, match.tipoDeporte)}</span>
        <strong>{scoreA}</strong>
      </div>
      <div className={winnerB ? 'bracket-player winner' : 'bracket-player'}>
        <span>{getPairLabel(match.parejaB, match.tipoDeporte)}</span>
        <strong>{scoreB}</strong>
      </div>

      <div className="bracket-match-card__footer">
        <span>{horario}</span>
        <span className={`status-pill ${statusClass}`}>{estado}</span>
        {onEdit && (
          <button
            type="button"
            className="secondary-button bracket-edit-button"
            aria-label={`Editar partido ${getPairLabel(match.parejaA, match.tipoDeporte)} contra ${getPairLabel(match.parejaB, match.tipoDeporte)}`}
            onClick={() => onEdit(match)}
          >
            Editar
          </button>
        )}
      </div>
    </article>
  )
}

export default BracketMatchCard
