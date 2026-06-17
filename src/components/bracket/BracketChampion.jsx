function BracketChampion({ champion }) {
  return (
    <section className="bracket-champion" aria-label="Campeon">
      <h4>Campeon</h4>
      <div className="bracket-champion__body">
        <div className={champion ? 'champion-card winner' : 'champion-card'}>
          <span>{champion?.nombre || 'Por definir'}</span>
        </div>
      </div>
    </section>
  )
}

export default BracketChampion
