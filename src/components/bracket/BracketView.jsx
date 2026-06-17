import { getChampion } from '../../utils/bracketUtils.js'
import BracketChampion from './BracketChampion.jsx'
import BracketEmptyState from './BracketEmptyState.jsx'
import BracketRound from './BracketRound.jsx'

function BracketView({ rounds, validation, emptyMessage, onEdit }) {
  if (!rounds.length) {
    return <BracketEmptyState>{emptyMessage}</BracketEmptyState>
  }

  const champion = getChampion(rounds)

  return (
    <div className="bracket-shell">
      {validation?.warnings?.length > 0 && (
        <div className="bracket-warnings" role="status">
          {validation.warnings.map((warning) => (
            <p key={warning}>{warning}</p>
          ))}
        </div>
      )}

      <div className="bracket-scroll" tabIndex="0" aria-label="Cuadro eliminatorio con desplazamiento horizontal">
        <div className="professional-bracket">
          {rounds.map((round, index) => (
            <BracketRound
              key={round.key}
              round={round}
              isLastRound={index === rounds.length - 1}
              onEdit={onEdit}
            />
          ))}
          <BracketChampion champion={champion} />
        </div>
      </div>
    </div>
  )
}

export default BracketView
