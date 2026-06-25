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
  telefono: '',
  email: '',
  activo: true,
}

function exportarCSV(parejas, categoriasMap) {
  const headers = ['Categoría', 'Jugador 1', 'Jugador 2', 'Teléfono', 'Email', 'Activo']
  const rows = parejas.map((p) => [
    categoriasMap.get(p.categoria_id)?.nombre ?? '',
    p.jugador_1,
    p.jugador_2,
    p.telefono ?? '',
    p.email ?? '',
    p.activo ? 'Sí' : 'No',
  ])
  const csv = [headers, ...rows]
    .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(','))
    .join('\n')
  const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'parejas.csv'
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

  const parejasFiltradas = useMemo(() => {
    const query = searchQuery.toLowerCase()
    return parejas
      .filter((pareja) => categoryFilter === 'todas' || pareja.categoria_id === categoryFilter)
      .filter((pareja) => !query ||
        pareja.jugador_1.toLowerCase().includes(query) ||
        pareja.jugador_2.toLowerCase().includes(query),
      )
  }, [categoryFilter, parejas, searchQuery])

  function updateField(field, value) {
    setForm((current) => ({ ...current, [field]: value }))
  }

  function editPareja(pareja) {
    setForm({
      id: pareja.id,
      categoria_id: pareja.categoria_id,
      jugador_1: pareja.jugador_1,
      jugador_2: pareja.jugador_2,
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
      await savePareja(form)
      setForm(emptyForm)
      await refresh()
      showToast('Pareja guardada correctamente')
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
        <h2>Parejas</h2>
      </div>

      <form className="admin-form" onSubmit={handleSubmit}>
        <h3>{form.id ? 'Editar pareja' : 'Crear pareja'}</h3>
        <label>
          Categoria
          <select
            value={form.categoria_id}
            onChange={(event) => updateField('categoria_id', event.target.value)}
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
        <label>
          Jugador 1
          <input value={form.jugador_1} onChange={(event) => updateField('jugador_1', event.target.value)} required />
        </label>
        <label>
          Jugador 2
          <input value={form.jugador_2} onChange={(event) => updateField('jugador_2', event.target.value)} required />
        </label>
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
          Buscar jugador
          <input
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            placeholder="Nombre del jugador..."
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

      {loading && <p className="info-state">Cargando parejas...</p>}
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
