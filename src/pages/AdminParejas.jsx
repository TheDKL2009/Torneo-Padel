import { useMemo, useState } from 'react'
import { getPairName, savePareja } from '../services/adminData.js'
import { useAdminData } from '../hooks/useAdminData.js'
import { showToast } from '../hooks/useToast.js'
import { formatActionError } from '../utils/errors.js'

const emptyForm = {
  id: '',
  categoria_id: '',
  jugador_1: '',
  jugador_2: '',
  nombre_equipo: '',
  jugadores: '',
  telefono: '',
  email: '',
  activo: true,
}

const modalidadLabels = {
  pareja: 'Pareja',
  equipo: 'Equipo',
  individual: 'Individual',
}

function normalizeModalidad(value) {
  return value === 'equipo' || value === 'individual' ? value : 'pareja'
}

function jugadoresToTextarea(value) {
  return Array.isArray(value) ? value.join('\n') : ''
}

function exportarCSV(parejas, categoriasMap) {
  const headers = ['Categoria', 'Modalidad', 'Nombre', 'Jugador 1', 'Jugador 2', 'Nombre equipo', 'Telefono', 'Email', 'Activo']
  const rows = parejas.map((p) => [
    categoriasMap.get(p.categoria_id)?.nombre ?? '',
    modalidadLabels[normalizeModalidad(p.tipo_participante)] ?? 'Pareja',
    getPairName(p),
    p.jugador_1 ?? '',
    p.jugador_2 ?? '',
    p.nombre_equipo ?? '',
    p.telefono ?? '',
    p.email ?? '',
    p.activo ? 'Si' : 'No',
  ])
  const csv = [headers, ...rows]
    .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(','))
    .join('\n')
  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'participantes.csv'
  a.click()
  URL.revokeObjectURL(url)
}

function AdminParejas() {
  const { categorias, parejas, loading, error, refresh } = useAdminData()
  const [form, setForm] = useState(emptyForm)
  const [categoryFilter, setCategoryFilter] = useState('todas')
  const [searchQuery, setSearchQuery] = useState('')
  const [saving, setSaving] = useState(false)
  const [actionError, setActionError] = useState('')

  const categoriasMap = useMemo(
    () => new Map(categorias.map((categoria) => [categoria.id, categoria])),
    [categorias],
  )
  const selectedCategoria = categoriasMap.get(form.categoria_id)
  const selectedModalidad = normalizeModalidad(selectedCategoria?.modalidad)
  const hasSelectedCategoria = Boolean(form.categoria_id)

  const parejasFiltradas = useMemo(() => {
    const query = searchQuery.toLowerCase()
    return parejas
      .filter((pareja) => categoryFilter === 'todas' || pareja.categoria_id === categoryFilter)
      .filter((pareja) => !query ||
        getPairName(pareja).toLowerCase().includes(query) ||
        (pareja.jugador_1 || '').toLowerCase().includes(query) ||
        (pareja.jugador_2 || '').toLowerCase().includes(query) ||
        (pareja.nombre_equipo || '').toLowerCase().includes(query),
      )
  }, [categoryFilter, parejas, searchQuery])

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
      jugadores: '',
    }))
  }

  function editPareja(pareja) {
    setForm({
      id: pareja.id,
      categoria_id: pareja.categoria_id,
      jugador_1: pareja.jugador_1 || '',
      jugador_2: pareja.jugador_2 || '',
      nombre_equipo: pareja.nombre_equipo || '',
      jugadores: jugadoresToTextarea(pareja.jugadores),
      telefono: pareja.telefono || '',
      email: pareja.email || '',
      activo: pareja.activo,
    })
  }

  async function handleSubmit(event) {
    event.preventDefault()

    if (!form.categoria_id) {
      setActionError('Selecciona una categoria.')
      return
    }

    if (selectedModalidad === 'pareja' && (!form.jugador_1.trim() || !form.jugador_2.trim())) {
      setActionError('Indica los dos jugadores de la pareja.')
      return
    }

    if (selectedModalidad === 'individual' && !form.jugador_1.trim()) {
      setActionError('Indica el jugador.')
      return
    }

    if (selectedModalidad === 'equipo' && !form.nombre_equipo.trim()) {
      setActionError('Indica el nombre del equipo.')
      return
    }

    setSaving(true)
    setActionError('')

    try {
      await savePareja({ ...form, tipo_participante: selectedModalidad })
      setForm(emptyForm)
      await refresh()
      showToast('Participante guardado correctamente')
    } catch (currentError) {
      setActionError(formatActionError(currentError))
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="admin-page">
      <div className="section-heading">
        <p className="eyebrow">Gestion</p>
        <h2>Participantes</h2>
      </div>

      <form className="admin-form" onSubmit={handleSubmit}>
        <h3>{form.id ? 'Editar participante' : 'Crear participante'}</h3>
        <label>
          Categoria
          <select
            value={form.categoria_id}
            onChange={(event) => updateCategoria(event.target.value)}
            required
          >
            <option value="">Selecciona categoria</option>
            {categorias.map((categoria) => (
              <option key={categoria.id} value={categoria.id}>
                {categoria.nombre}
              </option>
            ))}
          </select>
        </label>
        {hasSelectedCategoria && (
          <p className="form-full info-state">Modalidad: {modalidadLabels[selectedModalidad]}</p>
        )}
        {hasSelectedCategoria && selectedModalidad === 'equipo' ? (
          <>
            <label>
              Nombre del equipo
              <input
                value={form.nombre_equipo}
                onChange={(event) => updateField('nombre_equipo', event.target.value)}
                required
              />
            </label>
            <label className="form-full">
              Jugadores
              <textarea
                value={form.jugadores}
                onChange={(event) => updateField('jugadores', event.target.value)}
                placeholder="Un jugador por linea"
              />
            </label>
          </>
        ) : hasSelectedCategoria ? (
          <>
            <label>
              Jugador 1
              <input
                value={form.jugador_1}
                onChange={(event) => updateField('jugador_1', event.target.value)}
                required
              />
            </label>
            {selectedModalidad === 'pareja' && (
              <label>
                Jugador 2
                <input
                  value={form.jugador_2}
                  onChange={(event) => updateField('jugador_2', event.target.value)}
                  required
                />
              </label>
            )}
          </>
        ) : null}
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
          Activa
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
        <label>
          Buscar participante
          <input
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            placeholder="Nombre..."
          />
        </label>
        <label>
          Filtrar por categoria
          <select value={categoryFilter} onChange={(event) => setCategoryFilter(event.target.value)}>
            <option value="todas">Todas</option>
            {categorias.map((categoria) => (
              <option key={categoria.id} value={categoria.id}>
                {categoria.nombre}
              </option>
            ))}
          </select>
        </label>
      </div>

      {loading && <p className="info-state">Cargando participantes...</p>}
      {error && <p className="error-state">{error}</p>}

      {!loading && parejas.length > 0 && (
        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <button
            type="button"
            className="ghost-button"
            onClick={() => exportarCSV(parejas, categoriasMap)}
          >
            Exportar CSV
          </button>
        </div>
      )}

      <div className="data-table admin-table">
        {parejasFiltradas.map((pareja) => (
          <div key={pareja.id} className="data-row">
            <strong>{getPairName(pareja)}</strong>
            <span>{categoriasMap.get(pareja.categoria_id)?.nombre || 'Sin categoria'}</span>
            <span>{modalidadLabels[normalizeModalidad(pareja.tipo_participante)]}</span>
            <span>{pareja.email || pareja.telefono || 'Sin contacto'}</span>
            <span className={pareja.activo ? 'status-text active' : 'status-text inactive'}>
              {pareja.activo ? 'Activa' : 'Inactiva'}
            </span>
            <div className="row-actions">
              <button type="button" className="secondary-button" onClick={() => editPareja(pareja)}>
                Editar
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default AdminParejas
