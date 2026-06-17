import { useEffect, useMemo, useState } from 'react'
import { useParams } from 'react-router-dom'
import { saveCategoria, toggleCategoria } from '../services/adminData.js'
import { getTorneosAdmin } from '../services/torneoService.js'
import { useAdminData } from '../services/useAdminData.js'

const emptyForm = {
  id: '',
  torneo_id: '',
  nombre: '',
  tipo: '',
  orden: 0,
  activo: true,
}

function AdminCategorias() {
  const { torneoId } = useParams()
  const { categorias, loading, error, refresh } = useAdminData(torneoId)
  const [form, setForm] = useState(emptyForm)
  const [torneos, setTorneos] = useState([])
  const [torneosError, setTorneosError] = useState('')
  const [saving, setSaving] = useState(false)
  const [actionError, setActionError] = useState('')
  const showTorneoSelector = !torneoId

  const currentEmptyForm = useMemo(
    () => ({ ...emptyForm, torneo_id: torneoId || form.torneo_id || '' }),
    [form.torneo_id, torneoId],
  )

  useEffect(() => {
    if (torneoId) {
      return undefined
    }

    let active = true

    async function loadTorneos() {
      try {
        const result = await getTorneosAdmin()
        if (active) {
          setTorneos(result)
          setTorneosError('')
          if (result.length === 1) {
            setForm((current) => (current.torneo_id ? current : { ...current, torneo_id: result[0].id }))
          }
        }
      } catch (currentError) {
        if (active) {
          setTorneosError(currentError.message)
        }
      }
    }

    loadTorneos()

    return () => {
      active = false
    }
  }, [torneoId])

  function updateField(field, value) {
    setForm((current) => ({ ...current, [field]: value }))
  }

  function editCategoria(categoria) {
    setForm({
      id: categoria.id,
      torneo_id: categoria.torneo_id || torneoId || '',
      nombre: categoria.nombre,
      tipo: categoria.tipo,
      orden: categoria.orden,
      activo: categoria.activo,
    })
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setSaving(true)
    setActionError('')

    try {
      const selectedTorneoId = form.torneo_id || torneoId || ''
      await saveCategoria({ ...form, torneo_id: selectedTorneoId })
      setForm({ ...emptyForm, torneo_id: showTorneoSelector ? selectedTorneoId : torneoId || '' })
      await refresh()
    } catch (currentError) {
      setActionError(currentError.message)
    } finally {
      setSaving(false)
    }
  }

  async function handleToggle(categoria) {
    setActionError('')

    try {
      await toggleCategoria(categoria.id, !categoria.activo)
      await refresh()
    } catch (currentError) {
      setActionError(currentError.message)
    }
  }

  return (
    <div className="admin-page">
      <div className="section-heading">
        <p className="eyebrow">Gestion</p>
        <h2>Categorias</h2>
      </div>

      <form className="admin-form" onSubmit={handleSubmit}>
        <h3>{form.id ? 'Editar categoria' : 'Crear categoria'}</h3>
        {showTorneoSelector && (
          <label>
            Torneo
            <select
              value={form.torneo_id}
              onChange={(event) => updateField('torneo_id', event.target.value)}
              required
            >
              <option value="">Selecciona un torneo</option>
              {torneos.map((torneo) => (
                <option key={torneo.id} value={torneo.id}>
                  {torneo.nombre}
                </option>
              ))}
            </select>
          </label>
        )}
        <label>
          Nombre
          <input value={form.nombre} onChange={(event) => updateField('nombre', event.target.value)} required />
        </label>
        <label>
          Tipo
          <input value={form.tipo} onChange={(event) => updateField('tipo', event.target.value)} required />
        </label>
        <label>
          Orden
          <input
            type="number"
            value={form.orden}
            onChange={(event) => updateField('orden', event.target.value)}
          />
        </label>
        <label className="check-field">
          <input
            type="checkbox"
            checked={form.activo}
            onChange={(event) => updateField('activo', event.target.checked)}
          />
          Activa
        </label>
        {torneosError && <p className="error-state">{torneosError}</p>}
        {actionError && <p className="error-state">{actionError}</p>}
        <div className="form-actions">
          <button className="primary-button" type="submit" disabled={saving}>
            {saving ? 'Guardando...' : 'Guardar'}
          </button>
          {form.id && (
            <button className="secondary-button" type="button" onClick={() => setForm(currentEmptyForm)}>
              Cancelar
            </button>
          )}
        </div>
      </form>

      {loading && <p className="info-state">Cargando categorias...</p>}
      {error && <p className="error-state">{error}</p>}

      <div className="data-table admin-table">
        {categorias.map((categoria) => (
          <div key={categoria.id} className="data-row">
            <strong>{categoria.nombre}</strong>
            <span>{categoria.tipo}</span>
            <span>Orden {categoria.orden}</span>
            <span className={categoria.activo ? 'status-text active' : 'status-text inactive'}>
              {categoria.activo ? 'Activa' : 'Inactiva'}
            </span>
            <div className="row-actions">
              <button type="button" className="secondary-button" onClick={() => editCategoria(categoria)}>
                Editar
              </button>
              <button type="button" className="ghost-button" onClick={() => handleToggle(categoria)}>
                {categoria.activo ? 'Desactivar' : 'Activar'}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default AdminCategorias
