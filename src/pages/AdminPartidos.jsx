import { useMemo, useState } from 'react'
import { calculateWinnerId, getPairName, savePartido } from '../services/adminData.js'
import { useAdminData } from '../hooks/useAdminData.js'
import { showToast } from '../hooks/useToast.js'
import { formatActionError } from '../utils/errors.js'

const estados = [
  { value: 'pendiente', label: 'Pendiente' },
  { value: 'programado', label: 'Programado' },
  { value: 'en_juego', label: 'En juego' },
  { value: 'finalizado', label: 'Finalizado' },
  { value: 'cancelado', label: 'Cancelado' },
]

const emptyForm = {
  id: '',
  categoria_id: '',
  ronda: '',
  pareja_a_id: '',
  pareja_b_id: '',
  fecha: '',
  hora: '',
  pista: '',
  estado: 'pendiente',
  set1_a: '',
  set1_b: '',
  set2_a: '',
  set2_b: '',
  set3_a: '',
  set3_b: '',
  observaciones: '',
  orden: '',
}

function toFieldValue(value) {
  return value === null || value === undefined ? '' : value
}

function exportarCSV(partidos, parejasMap, categoriasMap) {
  const headers = ['Categoría', 'Ronda', 'Pareja A', 'Pareja B', 'Fecha', 'Hora', 'Pista', 'Estado', 'Set 1', 'Set 2', 'Set 3', 'Ganador']
  const rows = partidos.map((p) => {
    const set = (a, b) => a !== null && b !== null ? `${a}-${b}` : ''
    return [
      categoriasMap.get(p.categoria_id)?.nombre ?? '',
      p.ronda ?? '',
      getPairName(parejasMap.get(p.pareja_a_id)),
      getPairName(parejasMap.get(p.pareja_b_id)),
      p.fecha ?? '',
      p.hora?.slice(0, 5) ?? '',
      p.pista ?? '',
      p.estado ?? '',
      set(p.set1_a, p.set1_b),
      set(p.set2_a, p.set2_b),
      set(p.set3_a, p.set3_b),
      getPairName(parejasMap.get(p.ganador_id)),
    ]
  })
  const csv = [headers, ...rows]
    .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(','))
    .join('\n')
  const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'partidos.csv'
  a.click()
  URL.revokeObjectURL(url)
}

function AdminPartidos() {
  const { categorias, parejas, partidos, loading, error, refresh } = useAdminData()
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)
  const [actionError, setActionError] = useState('')

  const categoriasMap = useMemo(
    () => new Map(categorias.map((categoria) => [categoria.id, categoria])),
    [categorias],
  )
  const parejasMap = useMemo(
    () => new Map(parejas.map((pareja) => [pareja.id, pareja])),
    [parejas],
  )

  const parejasBase = useMemo(
    () => parejas.filter((pareja) => !form.categoria_id || pareja.categoria_id === form.categoria_id),
    [form.categoria_id, parejas],
  )

  const parejasParaA = useMemo(
    () => parejasBase.filter((pareja) => pareja.id !== form.pareja_b_id),
    [parejasBase, form.pareja_b_id],
  )

  const parejasParaB = useMemo(
    () => parejasBase.filter((pareja) => pareja.id !== form.pareja_a_id),
    [parejasBase, form.pareja_a_id],
  )

  const ganadorId = useMemo(() => calculateWinnerId(form), [form])
  const ganador = parejasMap.get(ganadorId)

  function updateField(field, value) {
    setForm((current) => ({ ...current, [field]: value }))
  }

  function updateCategoria(value) {
    setForm((current) => ({
      ...current,
      categoria_id: value,
      pareja_a_id: '',
      pareja_b_id: '',
    }))
  }

  function editPartido(partido) {
    if (
      partido.estado === 'finalizado' &&
      !window.confirm('Este partido ya está finalizado. ¿Editar igualmente?')
    ) {
      return
    }
    setForm({
      id: partido.id,
      categoria_id: partido.categoria_id,
      ronda: partido.ronda,
      pareja_a_id: partido.pareja_a_id,
      pareja_b_id: partido.pareja_b_id,
      fecha: partido.fecha || '',
      hora: partido.hora ? partido.hora.slice(0, 5) : '',
      pista: partido.pista || '',
      estado: partido.estado,
      set1_a: toFieldValue(partido.set1_a),
      set1_b: toFieldValue(partido.set1_b),
      set2_a: toFieldValue(partido.set2_a),
      set2_b: toFieldValue(partido.set2_b),
      set3_a: toFieldValue(partido.set3_a),
      set3_b: toFieldValue(partido.set3_b),
      observaciones: partido.observaciones || '',
      orden: toFieldValue(partido.orden),
    })
  }

  async function handleSubmit(event) {
    event.preventDefault()
    if (!form.categoria_id) {
      setActionError('Selecciona una categoría.')
      return
    }
    if (!form.ronda.trim()) {
      setActionError('Indica la ronda.')
      return
    }
    if (form.pareja_a_id && form.pareja_a_id === form.pareja_b_id) {
      setActionError('Las dos parejas deben ser distintas.')
      return
    }
    setSaving(true)
    setActionError('')

    try {
      await savePartido(form)
      setForm(emptyForm)
      await refresh()
      showToast('Partido guardado correctamente')
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
        <h2>Partidos</h2>
      </div>

      <form className="admin-form wide" onSubmit={handleSubmit}>
        <h3>{form.id ? 'Editar partido' : 'Crear partido'}</h3>
        <label>
          Categoria
          <select value={form.categoria_id} onChange={(event) => updateCategoria(event.target.value)} required>
            <option value="">Selecciona categoria</option>
            {categorias.map((categoria) => (
              <option key={categoria.id} value={categoria.id}>
                {categoria.nombre}
              </option>
            ))}
          </select>
        </label>
        <label>
          Ronda
          <input value={form.ronda} onChange={(event) => updateField('ronda', event.target.value)} required />
        </label>
        <label>
          Pareja A
          <select value={form.pareja_a_id} onChange={(event) => updateField('pareja_a_id', event.target.value)} required>
            <option value="">Selecciona pareja</option>
            {parejasParaA.map((pareja) => (
              <option key={pareja.id} value={pareja.id}>
                {getPairName(pareja)}
              </option>
            ))}
          </select>
        </label>
        <label>
          Pareja B
          <select value={form.pareja_b_id} onChange={(event) => updateField('pareja_b_id', event.target.value)} required>
            <option value="">Selecciona pareja</option>
            {parejasParaB.map((pareja) => (
              <option key={pareja.id} value={pareja.id}>
                {getPairName(pareja)}
              </option>
            ))}
          </select>
        </label>
        <label>
          Fecha
          <input type="date" value={form.fecha} onChange={(event) => updateField('fecha', event.target.value)} />
        </label>
        <label>
          Hora
          <input type="time" value={form.hora} onChange={(event) => updateField('hora', event.target.value)} />
        </label>
        <label>
          Pista
          <input value={form.pista} onChange={(event) => updateField('pista', event.target.value)} />
        </label>
        <label>
          Posición en bracket
          <input
            type="number"
            min="1"
            placeholder="1, 2, 3…"
            value={form.orden}
            onChange={(event) => updateField('orden', event.target.value)}
          />
        </label>
        <label>
          Estado
          <select value={form.estado} onChange={(event) => updateField('estado', event.target.value)}>
            {estados.map((estado) => (
              <option key={estado.value} value={estado.value}>
                {estado.label}
              </option>
            ))}
          </select>
        </label>

        <fieldset className="score-fieldset">
          <legend>Resultado</legend>
          {[1, 2, 3].map((setNumber) => (
            <div key={setNumber} className="score-row">
              <span>Set {setNumber}</span>
              <input
                type="number"
                min="0"
                value={form[`set${setNumber}_a`]}
                onChange={(event) => updateField(`set${setNumber}_a`, event.target.value)}
                aria-label={`Set ${setNumber} pareja A`}
              />
              <input
                type="number"
                min="0"
                value={form[`set${setNumber}_b`]}
                onChange={(event) => updateField(`set${setNumber}_b`, event.target.value)}
                aria-label={`Set ${setNumber} pareja B`}
              />
            </div>
          ))}
          <p className="winner-preview">
            Ganador automatico: {ganador ? getPairName(ganador) : 'pendiente de resultado completo'}
          </p>
        </fieldset>

        <label className="form-full">
          Observaciones
          <textarea value={form.observaciones} onChange={(event) => updateField('observaciones', event.target.value)} />
        </label>

        {actionError && <p className="error-state form-full">{actionError}</p>}
        <div className="form-actions form-full">
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

      {loading && <p className="info-state">Cargando partidos...</p>}
      {error && <p className="error-state">{error}</p>}

      {!loading && partidos.length > 0 && (
        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <button
            type="button"
            className="ghost-button"
            onClick={() => exportarCSV(partidos, parejasMap, categoriasMap)}
          >
            Exportar CSV
          </button>
        </div>
      )}

      <div className="data-table admin-table">
        {partidos.map((partido) => {
          const parejaA = parejasMap.get(partido.pareja_a_id)
          const parejaB = parejasMap.get(partido.pareja_b_id)
          const ganadorPartido = parejasMap.get(partido.ganador_id)

          return (
            <div key={partido.id} className="data-row">
              <strong>{getPairName(parejaA)} vs {getPairName(parejaB)}</strong>
              <span>{categoriasMap.get(partido.categoria_id)?.nombre || 'Sin categoria'}</span>
              <span>{partido.fecha || 'Sin fecha'} · {partido.hora?.slice(0, 5) || 'Sin hora'} · {partido.pista || 'Sin pista'}</span>
              <span>{estados.find((estado) => estado.value === partido.estado)?.label || partido.estado}</span>
              <span>{ganadorPartido ? `Gana ${getPairName(ganadorPartido)}` : 'Sin ganador'}</span>
              <div className="row-actions">
                <button type="button" className="secondary-button" onClick={() => editPartido(partido)}>
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

export default AdminPartidos
