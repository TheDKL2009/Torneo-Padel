import { useCallback, useEffect, useState } from 'react'
import { createPista, deletePista, getPistas, updatePista } from '../services/pistaService.js'

const emptyForm = {
  id: '',
  nombre: '',
  numero: 1,
  activa: true,
}

function AdminPistas() {
  const [pistas, setPistas] = useState([])
  const [form, setForm] = useState(emptyForm)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const refresh = useCallback(async () => {
    setLoading(true)
    setError('')

    try {
      setPistas(await getPistas())
    } catch (currentError) {
      setError(currentError.message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    let active = true

    async function loadPistas() {
      try {
        setLoading(true)
        const result = await getPistas()

        if (active) {
          setPistas(result)
          setError('')
        }
      } catch (currentError) {
        if (active) {
          setError(currentError.message)
        }
      } finally {
        if (active) {
          setLoading(false)
        }
      }
    }

    loadPistas()

    return () => {
      active = false
    }
  }, [])

  function updateField(field, value) {
    setForm((current) => ({ ...current, [field]: value }))
  }

  function editPista(pista) {
    setForm({
      id: pista.id,
      nombre: pista.nombre,
      numero: pista.numero,
      activa: pista.activa,
    })
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setSaving(true)
    setError('')
    setSuccess('')

    try {
      if (form.id) {
        await updatePista(form.id, form)
        setSuccess('Pista actualizada.')
      } else {
        await createPista(form)
        setSuccess('Pista creada.')
      }

      setForm(emptyForm)
      await refresh()
    } catch (currentError) {
      setError(currentError.message)
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(pista) {
    setSaving(true)
    setError('')
    setSuccess('')

    try {
      const action = await deletePista(pista.id)
      setSuccess(action === 'desactivada' ? 'La pista tenia partidos asociados y se ha desactivado.' : 'Pista eliminada.')
      await refresh()
    } catch (currentError) {
      setError(currentError.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="admin-page">
      <div className="section-heading">
        <p className="eyebrow">Gestion</p>
        <h2>Pistas</h2>
      </div>

      <form className="admin-form" onSubmit={handleSubmit}>
        <h3>{form.id ? 'Editar pista' : 'Crear pista'}</h3>
        <label>
          Nombre
          <input value={form.nombre} onChange={(event) => updateField('nombre', event.target.value)} required />
        </label>
        <label>
          Numero
          <input
            type="number"
            min="1"
            value={form.numero}
            onChange={(event) => updateField('numero', event.target.value)}
            required
          />
        </label>
        <label className="check-field">
          <input
            type="checkbox"
            checked={form.activa}
            onChange={(event) => updateField('activa', event.target.checked)}
          />
          Activa
        </label>
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

      {loading && <p className="info-state">Cargando pistas...</p>}
      {error && <p className="error-state">{error}</p>}
      {success && <p className="info-state">{success}</p>}

      <div className="data-table admin-table">
        {pistas.map((pista) => (
          <div key={pista.id} className="data-row">
            <strong>{pista.nombre}</strong>
            <span>Numero {pista.numero}</span>
            <span className={pista.activa ? 'status-text active' : 'status-text inactive'}>
              {pista.activa ? 'Activa' : 'Inactiva'}
            </span>
            <div className="row-actions">
              <button type="button" className="secondary-button" onClick={() => editPista(pista)}>
                Editar
              </button>
              <button type="button" className="ghost-button" disabled={saving} onClick={() => handleDelete(pista)}>
                Eliminar
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default AdminPistas
