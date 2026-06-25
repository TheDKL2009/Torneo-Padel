import { useState } from 'react'
import { saveCategoria, toggleCategoria } from '../services/adminData.js'
import { useAdminData } from '../hooks/useAdminData.js'
import { showToast } from '../hooks/useToast.js'
import { formatActionError } from '../utils/errors.js'

const emptyForm = {
  id: '',
  nombre: '',
  tipo: '',
  orden: 0,
  activo: true,
}

function AdminCategorias() {
  const { categorias, loading, error, refresh } = useAdminData()
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)
  const [actionError, setActionError] = useState('')

  function updateField(field, value) {
    setForm((current) => ({ ...current, [field]: value }))
  }

  function editCategoria(categoria) {
    setForm({
      id: categoria.id,
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
      await saveCategoria(form)
      setForm(emptyForm)
      await refresh()
      showToast('Categoría guardada correctamente')
    } catch (currentError) {
      setActionError(formatActionError(currentError))
    } finally {
      setSaving(false)
    }
  }

  async function handleToggle(categoria) {
    setActionError('')

    try {
      await toggleCategoria(categoria.id, !categoria.activo)
      await refresh()
      showToast('Estado actualizado')
    } catch (currentError) {
      setActionError(formatActionError(currentError))
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
