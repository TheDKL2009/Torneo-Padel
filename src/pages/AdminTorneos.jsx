import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  createTorneo,
  deleteOrDeactivateTorneo,
  deporteOptions,
  getDeporteLabel,
  getTorneosAdmin,
  setTorneoDestacado,
  updateTorneo,
} from '../services/torneoService.js'

const estados = ['borrador', 'inscripciones', 'en_curso', 'finalizado', 'cancelado']

const emptyForm = {
  id: '',
  nombre: '',
  temporada: '',
  descripcion: '',
  sede: '',
  fecha_inicio: '',
  fecha_fin: '',
  estado: 'borrador',
  tipo_deporte: 'padel',
  activo: true,
  destacado: false,
}

function AdminTorneos() {
  const [torneos, setTorneos] = useState([])
  const [form, setForm] = useState(emptyForm)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const refresh = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      setTorneos(await getTorneosAdmin())
    } catch (currentError) {
      setError(currentError.message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    let active = true

    async function loadTorneos() {
      setLoading(true)
      setError('')
      try {
        const nextTorneos = await getTorneosAdmin()
        if (active) {
          setTorneos(nextTorneos)
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

    loadTorneos()

    return () => {
      active = false
    }
  }, [])

  function updateField(field, value) {
    setForm((current) => ({ ...current, [field]: value }))
  }

  function editTorneo(torneo) {
    setForm({
      id: torneo.id,
      nombre: torneo.nombre,
      temporada: torneo.temporada || '',
      descripcion: torneo.descripcion || '',
      sede: torneo.sede || '',
      fecha_inicio: torneo.fecha_inicio || '',
      fecha_fin: torneo.fecha_fin || '',
      estado: torneo.estado,
      tipo_deporte: torneo.tipo_deporte || 'padel',
      activo: torneo.activo,
      destacado: torneo.destacado,
    })
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setSaving(true)
    setError('')
    setSuccess('')

    try {
      if (form.id) {
        await updateTorneo(form.id, form)
        setSuccess('Torneo actualizado.')
      } else {
        await createTorneo(form)
        setSuccess('Torneo creado.')
      }
      setForm(emptyForm)
      await refresh()
    } catch (currentError) {
      setError(currentError.message)
    } finally {
      setSaving(false)
    }
  }

  async function runAction(callback, message) {
    setSaving(true)
    setError('')
    setSuccess('')
    try {
      await callback()
      setSuccess(message)
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
        <p className="eyebrow">Administracion</p>
        <h2>Torneos</h2>
      </div>

      <form className="admin-form wide" onSubmit={handleSubmit}>
        <h3>{form.id ? 'Editar torneo' : 'Crear torneo'}</h3>
        <label>
          Nombre
          <input value={form.nombre} onChange={(event) => updateField('nombre', event.target.value)} required />
        </label>
        <label>
          Temporada
          <input value={form.temporada} onChange={(event) => updateField('temporada', event.target.value)} />
        </label>
        <label>
          Sede
          <input value={form.sede} onChange={(event) => updateField('sede', event.target.value)} />
        </label>
        <label>
          Estado
          <select value={form.estado} onChange={(event) => updateField('estado', event.target.value)}>
            {estados.map((estado) => (
              <option key={estado} value={estado}>{estado}</option>
            ))}
          </select>
        </label>
        <label>
          Deporte
          <select value={form.tipo_deporte || 'padel'} onChange={(event) => updateField('tipo_deporte', event.target.value)}>
            {deporteOptions.map((deporte) => (
              <option key={deporte.value} value={deporte.value}>{deporte.label}</option>
            ))}
          </select>
        </label>
        <label>
          Fecha inicio
          <input type="date" value={form.fecha_inicio} onChange={(event) => updateField('fecha_inicio', event.target.value)} />
        </label>
        <label>
          Fecha fin
          <input type="date" value={form.fecha_fin} onChange={(event) => updateField('fecha_fin', event.target.value)} />
        </label>
        <label className="check-field">
          <input type="checkbox" checked={form.activo} onChange={(event) => updateField('activo', event.target.checked)} />
          Activo
        </label>
        <label className="check-field">
          <input type="checkbox" checked={form.destacado} onChange={(event) => updateField('destacado', event.target.checked)} />
          Destacado
        </label>
        <label className="form-full">
          Descripcion
          <textarea value={form.descripcion} onChange={(event) => updateField('descripcion', event.target.value)} />
        </label>
        <div className="form-actions form-full">
          <button className="primary-button" type="submit" disabled={saving}>
            {saving ? 'Guardando...' : 'Guardar torneo'}
          </button>
          {form.id && (
            <button className="secondary-button" type="button" onClick={() => setForm(emptyForm)}>
              Cancelar
            </button>
          )}
        </div>
      </form>

      {loading && <p className="info-state">Cargando torneos...</p>}
      {error && <p className="error-state">{error}</p>}
      {success && <p className="info-state">{success}</p>}

      <div className="data-table admin-table">
        {torneos.map((torneo) => (
          <div key={torneo.id} className="data-row">
            <strong>{torneo.nombre}</strong>
            <span>{torneo.temporada || torneo.estado}</span>
            <span>{getDeporteLabel(torneo.tipo_deporte)}</span>
            <span>{torneo.destacado ? 'Destacado' : 'No destacado'}</span>
            <span className={torneo.activo ? 'status-text active' : 'status-text inactive'}>
              {torneo.activo ? 'Activo' : 'Inactivo'}
            </span>
            <div className="row-actions">
              <Link className="secondary-button" to={`/admin/torneos/${torneo.id}`}>Gestionar</Link>
              <button type="button" className="secondary-button" onClick={() => editTorneo(torneo)}>Editar</button>
              <button type="button" className="ghost-button" disabled={saving} onClick={() => runAction(() => setTorneoDestacado(torneo.id), 'Torneo marcado como destacado.')}>Destacar</button>
              <button type="button" className="ghost-button" disabled={saving} onClick={() => runAction(() => deleteOrDeactivateTorneo(torneo.id), 'Torneo desactivado.')}>Desactivar</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default AdminTorneos
