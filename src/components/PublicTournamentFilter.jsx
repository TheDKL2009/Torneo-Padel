function PublicTournamentFilter({ torneos, value, onChange, hidden = false }) {
  if (hidden) return null

  return (
    <div className="filters">
      <label>
        Torneo
        <select value={value} onChange={(event) => onChange(event.target.value)}>
          <option value="todos">Todos</option>
          {torneos.map((torneo) => (
            <option key={torneo.id} value={torneo.id}>
              {torneo.nombre}
            </option>
          ))}
        </select>
      </label>
    </div>
  )
}

export default PublicTournamentFilter
