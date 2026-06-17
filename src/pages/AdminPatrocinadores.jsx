import { useState } from 'react'
import { useParams } from 'react-router-dom'
import { savePatrocinador, togglePatrocinador } from '../services/adminData.js'
import { useAdminData } from '../services/useAdminData.js'

const emptyForm = {
  id: '',
  nombre: '',
  logo_url: '',
  web_url: '',
  orden: 0,
  activo: true,
}

function AdminPatrocinadores() {
  const { torneoId } = useParams()
  const { patrocinadores, loading, error, refresh } = useAdminData(torneoId)
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)
  const [actionError, setActionError] = useState('')

  function updateField(field, value) {
    setForm((current) => ({ ...current, [field]: value }))
  }

  function editPatrocinador(patrocinador) {
    setForm({
      id: patrocinador.id,
      torneo_id: patrocinador.torneo_id || torneoId || '',
      nombre: patrocinador.nombre,
      logo_url: patrocinador.logo_url || '',
      web_url: patrocinador.web_url || '',
      orden: patrocinador.orden,
      activo: patrocinador.activo,
    })
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setSaving(true)
    setActionError('')

    try {
      await savePatrocinador({ ...form, torneo_id: form.torneo_id || torneoId })
      setForm(emptyForm)
      await refresh()
    } catch (currentError) {
      setActionError(currentError.message)
    } finally {
      setSaving(false)
    }
  }

  async function handleToggle(patrocinador) {
    setActionError('')

    try {
      await togglePatrocinador(patrocinador.id, !patrocinador.activo)
      await refresh()
    } catch (currentError) {
      setActionError(currentError.message)
    }
  }

  return (
    <div className="admin-page">
      <div className="section-heading">
        <p className="eyebrow">Gestion</p>
        <h2>Patrocinadores</h2>
      </div>

      <form className="admin-form" onSubmit={handleSubmit}>
        <h3>{form.id ? 'Editar patrocinador' : 'Crear patrocinador'}</h3>
        <label>
          Nombre
          <input value={form.nombre} onChange={(event) => updateField('nombre', event.target.value)} required />
        </label>
        <label>
          Logo URL
          <input value={form.logo_url} onChange={(event) => updateField('logo_url', event.target.value)} />
        </label>
        <label>
          Web URL
          <input value={form.web_url} onChange={(event) => updateField('web_url', event.target.value)} />
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
          Activo
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

      {loading && <p className="info-state">Cargando patrocinadores...</p>}
      {error && <p className="error-state">{error}</p>}

      <div className="data-table admin-table">
        {patrocinadores.map((patrocinador) => (
          <div key={patrocinador.id} className="data-row">
            <strong>{patrocinador.nombre}</strong>
            <span>Orden {patrocinador.orden}</span>
            <span>{patrocinador.web_url || 'Sin web'}</span>
            <span className={patrocinador.activo ? 'status-text active' : 'status-text inactive'}>
              {patrocinador.activo ? 'Activo' : 'Inactivo'}
            </span>
            <div className="row-actions">
              <button type="button" className="secondary-button" onClick={() => editPatrocinador(patrocinador)}>
                Editar
              </button>
              <button type="button" className="ghost-button" onClick={() => handleToggle(patrocinador)}>
                {patrocinador.activo ? 'Desactivar' : 'Activar'}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default AdminPatrocinadores
