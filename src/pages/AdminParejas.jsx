import { useEffect, useMemo, useState } from 'react'
import { useParams } from 'react-router-dom'
import { getPairName, savePareja } from '../services/adminData.js'
import { getDeporteLabel, getTorneoById, getTorneosAdmin } from '../services/torneoService.js'
import { useAdminData } from '../services/useAdminData.js'
import { getParticipantLabels, isFutbolSala, resolveTipoDeporte } from '../utils/participantLabels.js'

const emptyForm = {
  id: '',
  categoria_id: '',
  jugador_1: '',
  jugador_2: '',
  nombre_equipo: '',
  contacto: '',
  telefono: '',
  email: '',
  activo: true,
}

function AdminParejas() {
  const { torneoId } = useParams()
  const { categorias, parejas, loading, error, refresh } = useAdminData(torneoId)
  const [form, setForm] = useState(emptyForm)
  const [tournamentFilter, setTournamentFilter] = useState('todos')
  const [categoryFilter, setCategoryFilter] = useState('todas')
  const [saving, setSaving] = useState(false)
  const [actionError, setActionError] = useState('')
  const [torneo, setTorneo] = useState(null)
  const [torneos, setTorneos] = useState([])

  const categoriasMap = useMemo(
    () => new Map(categorias.map((categoria) => [categoria.id, categoria])),
    [categorias],
  )
  const torneosMap = useMemo(
    () => new Map(torneos.map((current) => [current.id, current])),
    [torneos],
  )
  const filteredCategorias = useMemo(
    () => categorias.filter((categoria) => {
      if (torneoId || tournamentFilter === 'todos') return true
      return categoria.torneo_id === tournamentFilter
    }),
    [categorias, torneoId, tournamentFilter],
  )
  const selectedTorneo = torneo || (tournamentFilter !== 'todos' ? torneosMap.get(tournamentFilter) : null)
  const selectedCategoria = useMemo(
    () => categoriasMap.get(form.categoria_id) ||
      (categoryFilter !== 'todas' ? categoriasMap.get(categoryFilter) : null),
    [categoriasMap, categoryFilter, form.categoria_id],
  )
  const tipoDeporte = resolveTipoDeporte({ torneo: selectedTorneo, categoria: selectedCategoria, torneosMap })
  const futbolSala = isFutbolSala(tipoDeporte)
  const participantLabels = getParticipantLabels(tipoDeporte)

  const parejasFiltradas = useMemo(() => {
    return parejas.filter((pareja) => {
      const categoria = categoriasMap.get(pareja.categoria_id)
      const matchesTournament = torneoId || tournamentFilter === 'todos' || categoria?.torneo_id === tournamentFilter
      const matchesCategory = categoryFilter === 'todas' || pareja.categoria_id === categoryFilter
      return matchesTournament && matchesCategory
    })
  }, [categoriasMap, categoryFilter, parejas, torneoId, tournamentFilter])

  useEffect(() => {
    let active = true

    async function loadContext() {
      try {
        if (torneoId) {
          const result = await getTorneoById(torneoId)
          if (active) setTorneo(result)
          return
        }

        const result = await getTorneosAdmin()
        if (active) {
          setTorneo(null)
          setTorneos(result)
        }
      } catch {
        if (active) {
          setTorneo(null)
          setTorneos([])
        }
      }
    }

    loadContext()

    return () => {
      active = false
    }
  }, [torneoId])

  function updateField(field, value) {
    setForm((current) => ({ ...current, [field]: value }))
  }

  function updateCategoria(value) {
    setForm((current) => ({
      ...current,
      categoria_id: value,
      jugador_1: '',
      jugador_2: '',
      nombre_equipo: '',
      contacto: '',
    }))
  }

  function updateTournamentFilter(value) {
    setTournamentFilter(value)
    setCategoryFilter('todas')
    setForm((current) => {
      const currentCategoria = categoriasMap.get(current.categoria_id)
      const keepCategoria = value === 'todos' || currentCategoria?.torneo_id === value
      return keepCategoria ? current : { ...current, categoria_id: '' }
    })
  }

  function editPareja(pareja) {
    setForm({
      id: pareja.id,
      categoria_id: pareja.categoria_id,
      jugador_1: pareja.jugador_1 || '',
      jugador_2: pareja.jugador_2 || '',
      nombre_equipo: pareja.nombre_equipo || pareja.nombre || '',
      contacto: pareja.contacto || '',
      telefono: pareja.telefono || '',
      email: pareja.email || '',
      activo: pareja.activo,
    })
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setSaving(true)
    setActionError('')

    try {
      await savePareja(form, tipoDeporte)
      setForm(emptyForm)
      await refresh()
    } catch (currentError) {
      setActionError(currentError.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="admin-page">
      <div className="section-heading">
        <p className="eyebrow">Gestion</p>
        <h2>{participantLabels.plural}</h2>
        {(selectedTorneo || selectedCategoria) && (
          <p>
            {selectedTorneo?.nombre || torneosMap.get(selectedCategoria?.torneo_id)?.nombre || selectedCategoria?.nombre}
            {' · '}
            {getDeporteLabel(tipoDeporte)}
          </p>
        )}
      </div>

      <form className="admin-form" onSubmit={handleSubmit}>
        <h3>{form.id ? participantLabels.edit : participantLabels.create}</h3>
        <label>
          Categoria
          <select value={form.categoria_id} onChange={(event) => updateCategoria(event.target.value)} required>
            <option value="">Selecciona categoria</option>
            {filteredCategorias.map((categoria) => (
              <option key={categoria.id} value={categoria.id}>
                {categoria.nombre}
              </option>
            ))}
          </select>
        </label>
        {futbolSala ? (
          <>
            <label>
              {participantLabels.fields.principal}
              <input value={form.nombre_equipo} onChange={(event) => updateField('nombre_equipo', event.target.value)} required />
            </label>
            <label>
              {participantLabels.fields.contacto}
              <input value={form.contacto} onChange={(event) => updateField('contacto', event.target.value)} />
            </label>
          </>
        ) : (
          <>
            <label>
              {participantLabels.fields.jugador1}
              <input value={form.jugador_1} onChange={(event) => updateField('jugador_1', event.target.value)} required />
            </label>
            <label>
              {participantLabels.fields.jugador2}
              <input value={form.jugador_2} onChange={(event) => updateField('jugador_2', event.target.value)} required />
            </label>
          </>
        )}
        <label>
          Telefono
          <input value={form.telefono} onChange={(event) => updateField('telefono', event.target.value)} />
        </label>
        <label>
          Email
          <input type="email" value={form.email} onChange={(event) => updateField('email', event.target.value)} />
        </label>
        <label className="check-field">
          <input
            type="checkbox"
            checked={form.activo}
            onChange={(event) => updateField('activo', event.target.checked)}
          />
          {participantLabels.fields.activo}
        </label>
        {actionError && <p className="error-state">{actionError}</p>}
        <div className="form-actions">
          <button className="primary-button" type="submit" disabled={saving}>
            {saving ? 'Guardando...' : 'Guardar'}
          </button>
          {form.id && (
            <button className="secondary-button" type="button" onClick={() => setForm(emptyForm)}>
              Cancelar
            </button>
          )}
        </div>
      </form>

      <div className="filters">
        {!torneoId && (
          <label>
            Filtrar por torneo
            <select value={tournamentFilter} onChange={(event) => updateTournamentFilter(event.target.value)}>
              <option value="todos">Todos</option>
              {torneos.map((current) => (
                <option key={current.id} value={current.id}>
                  {current.nombre}
                </option>
              ))}
            </select>
          </label>
        )}
        <label>
          Filtrar por categoria
          <select value={categoryFilter} onChange={(event) => setCategoryFilter(event.target.value)}>
            <option value="todas">Todas</option>
            {filteredCategorias.map((categoria) => (
              <option key={categoria.id} value={categoria.id}>
                {categoria.nombre}
              </option>
            ))}
          </select>
        </label>
      </div>

      {loading && <p className="info-state">Cargando {participantLabels.pluralLower}...</p>}
      {error && <p className="error-state">{error}</p>}

      <div className="data-table admin-table">
        {parejasFiltradas.map((pareja) => {
          const categoria = categoriasMap.get(pareja.categoria_id)
          return (
            <div key={pareja.id} className="data-row">
              <strong>{getPairName(pareja)}</strong>
              <span>{categoria?.nombre || 'Sin categoria'}</span>
              {!torneoId && <span>{torneosMap.get(categoria?.torneo_id)?.nombre || 'Sin torneo'}</span>}
              <span>{pareja.contacto || pareja.email || pareja.telefono || 'Sin contacto'}</span>
              <span className={pareja.activo ? 'status-text active' : 'status-text inactive'}>
                {pareja.activo ? 'Activo' : 'Inactivo'}
              </span>
              <div className="row-actions">
                <button type="button" className="secondary-button" onClick={() => editPareja(pareja)}>
                  Editar
                </button>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default AdminParejas
