import { useAdminData } from '../hooks/useAdminData.js'

function AdminDashboard() {
  const { categorias, parejas, partidos, patrocinadores, pistas, grupos, loading, error } = useAdminData()
  const stats = [
    { label: 'Categorias', value: categorias.length },
    { label: 'Participantes', value: parejas.length },
    { label: 'Grupos', value: grupos.length },
    { label: 'Partidos', value: partidos.length },
    { label: 'Pistas', value: pistas.length },
    { label: 'Patrocinadores', value: patrocinadores.length },
  ]

  return (
    <div className="admin-page">
      <div className="section-heading">
        <p className="eyebrow">Resumen</p>
        <h2>Dashboard</h2>
      </div>
      {loading && <p className="info-state">Cargando resumen...</p>}
      {error && <p className="error-state">{error}</p>}
      <div className="summary-grid compact">
        {stats.map((stat) => (
          <article key={stat.label} className="summary-card">
            <span>{stat.label}</span>
            <strong>{stat.value}</strong>
          </article>
        ))}
      </div>
    </div>
  )
}

export default AdminDashboard
