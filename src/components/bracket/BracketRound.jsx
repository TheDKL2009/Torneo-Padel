import BracketMatchCard from './BracketMatchCard.jsx'

function BracketRound({ round, onEdit }) {
  return (
    <section className="bracket-round-column" aria-label={round.label}>
      <h3>{round.label}</h3>
      <div className="bracket-round-column__matches">
        {round.matches.map((match) => (
          <div key={match.id} className="bracket-slot">
            <BracketMatchCard match={match} onEdit={onEdit} />
          </div>
        ))}
      </div>
    </section>
  )
}

export default BracketRound
