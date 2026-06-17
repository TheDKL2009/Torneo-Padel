import { useMemo, useState } from 'react'
import { updatePartido } from '../services/partidoService.js'
import { getParticipantLabel } from '../utils/participantLabels.js'

const estados = [
  { value: 'pendiente', label: 'Pendiente' },
  { value: 'programado', label: 'Programado' },
  { value: 'en_juego', label: 'En juego' },
  { value: 'finalizado', label: 'Finalizado' },
  { value: 'cancelado', label: 'Cancelado' },
]

function toFieldValue(value) {
  return value === null || value === undefined ? '' : value
}

function PartidoEditForm({ partido, categorias, parejas, grupos, pistas, onCancel, onSaved, saveMatch = updatePartido }) {
  const [form, setForm] = useState({
    categoria_id: partido.categoriaId || '',
    ronda: partido.ronda || '',
    fase: partido.fase || 'eliminatoria',
    grupo_id: partido.grupoId || '',
    orden: toFieldValue(partido.orden),
    pareja_a_id: partido.parejaAId || '',
    pareja_b_id: partido.parejaBId || '',
    fecha: partido.fecha === 'Sin fecha' ? '' : toFieldValue(partido.fecha),
    hora: partido.hora === 'Sin hora' ? '' : toFieldValue(partido.hora),
    pista_id: partido.pistaId || '',
    pista: partido.pistaData?.nombre || '',
    estado: partido.estadoRaw || 'pendiente',
    set1_a: toFieldValue(partido.set1_a),
    set1_b: toFieldValue(partido.set1_b),
    set2_a: toFieldValue(partido.set2_a),
    set2_b: toFieldValue(partido.set2_b),
    set3_a: toFieldValue(partido.set3_a),
    set3_b: toFieldValue(partido.set3_b),
    goles_a: toFieldValue(partido.goles_a),
    goles_b: toFieldValue(partido.goles_b),
    penaltis_a: toFieldValue(partido.penaltis_a),
    penaltis_b: toFieldValue(partido.penaltis_b),
    ganador_manual_id: partido.ganador_manual_id || '',
    observaciones: partido.observaciones || '',
  })
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  const parejasDisponibles = useMemo(
    () => parejas.filter((pareja) => !form.categoria_id || pareja.categoriaId === form.categoria_id),
    [form.categoria_id, parejas],
  )

  const gruposDisponibles = useMemo(
    () => grupos.filter((grupo) => !form.categoria_id || grupo.categoria_id === form.categoria_id),
    [form.categoria_id, grupos],
  )
  const isFutbolSala = partido.tipoDeporte === 'futbol_sala' ||
    parejasDisponibles.some((pareja) => [form.pareja_a_id, form.pareja_b_id].includes(pareja.id) && pareja.tipoParticipante === 'equipo')
  const participantLabel = getParticipantLabel(isFutbolSala ? 'futbol_sala' : 'padel')
  const footballDraw = isFutbolSala &&
    form.fase === 'eliminatoria' &&
    form.goles_a !== '' &&
    form.goles_b !== '' &&
    Number(form.goles_a) === Number(form.goles_b)

  function updateField(field, value) {
    setForm((current) => ({ ...current, [field]: value }))
  }

  function updateCategoria(value) {
    setForm((current) => ({
      ...current,
      categoria_id: value,
      pareja_a_id: '',
      pareja_b_id: '',
      grupo_id: '',
    }))
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setSaving(true)
    setError('')
    setMessage('')

    try {
      const result = await saveMatch(partido.id, form)
      setMessage(result?.warning || 'Partido actualizado.')
      await onSaved()
    } catch (currentError) {
      setError(currentError.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <form className="admin-form wide inline-edit-form" onSubmit={handleSubmit}>
      <h3>Editar partido</h3>
      <label>
        Categoria
        <select value={form.categoria_id} onChange={(event) => updateCategoria(event.target.value)} required>
          <option value="">Selecciona categoria</option>
          {categorias.map((categoria) => (
            <option key={categoria.id} value={categoria.id}>{categoria.nombre}</option>
          ))}
        </select>
      </label>
      <label>
        Fase
        <select value={form.fase} onChange={(event) => updateField('fase', event.target.value)}>
          <option value="eliminatoria">Eliminatoria</option>
          <option value="grupos">Grupos</option>
        </select>
      </label>
      {form.fase === 'grupos' && (
        <label>
          Grupo
          <select value={form.grupo_id} onChange={(event) => updateField('grupo_id', event.target.value)}>
            <option value="">Sin grupo</option>
            {gruposDisponibles.map((grupo) => (
              <option key={grupo.id} value={grupo.id}>{grupo.nombre}</option>
            ))}
          </select>
        </label>
      )}
      <label>
        Ronda
        <input value={form.ronda} onChange={(event) => updateField('ronda', event.target.value)} required />
      </label>
      <label>
        {participantLabel} local
        <select value={form.pareja_a_id} onChange={(event) => updateField('pareja_a_id', event.target.value)} required>
          <option value="">Selecciona {participantLabel.toLowerCase()}</option>
          {parejasDisponibles.map((pareja) => (
            <option key={pareja.id} value={pareja.id}>{pareja.nombre}</option>
          ))}
        </select>
      </label>
      <label>
        {participantLabel} visitante
        <select value={form.pareja_b_id} onChange={(event) => updateField('pareja_b_id', event.target.value)} required>
          <option value="">Selecciona {participantLabel.toLowerCase()}</option>
          {parejasDisponibles.map((pareja) => (
            <option key={pareja.id} value={pareja.id}>{pareja.nombre}</option>
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
        <select value={form.pista_id} onChange={(event) => updateField('pista_id', event.target.value)}>
          <option value="">Sin pista asignada</option>
          {pistas.filter((pista) => pista.activa).map((pista) => (
            <option key={pista.id} value={pista.id}>{pista.nombre}</option>
          ))}
        </select>
      </label>
      <label>
        Estado
        <select value={form.estado} onChange={(event) => updateField('estado', event.target.value)}>
          {estados.map((estado) => (
            <option key={estado.value} value={estado.value}>{estado.label}</option>
          ))}
        </select>
      </label>
      {isFutbolSala ? (
        <fieldset className="score-fieldset">
          <legend>Resultado</legend>
          <div className="score-row">
            <span>Goles</span>
            <input type="number" min="0" value={form.goles_a} onChange={(event) => updateField('goles_a', event.target.value)} />
            <input type="number" min="0" value={form.goles_b} onChange={(event) => updateField('goles_b', event.target.value)} />
          </div>
          {footballDraw && (
            <>
              <div className="score-row">
                <span>Penaltis</span>
                <input type="number" min="0" value={form.penaltis_a} onChange={(event) => updateField('penaltis_a', event.target.value)} />
                <input type="number" min="0" value={form.penaltis_b} onChange={(event) => updateField('penaltis_b', event.target.value)} />
              </div>
              <label>
                Ganador manual
                <select value={form.ganador_manual_id} onChange={(event) => updateField('ganador_manual_id', event.target.value)}>
                  <option value="">Sin ganador manual</option>
                  {[form.pareja_a_id, form.pareja_b_id].filter(Boolean).map((parejaId) => (
                    <option key={parejaId} value={parejaId}>
                      {parejasDisponibles.find((pareja) => pareja.id === parejaId)?.nombre || parejaId}
                    </option>
                  ))}
                </select>
              </label>
            </>
          )}
        </fieldset>
      ) : (
        <fieldset className="score-fieldset">
          <legend>Resultado</legend>
          {[1, 2, 3].map((setNumber) => (
            <div key={setNumber} className="score-row">
              <span>Set {setNumber}</span>
              <input type="number" min="0" value={form[`set${setNumber}_a`]} onChange={(event) => updateField(`set${setNumber}_a`, event.target.value)} />
              <input type="number" min="0" value={form[`set${setNumber}_b`]} onChange={(event) => updateField(`set${setNumber}_b`, event.target.value)} />
            </div>
          ))}
        </fieldset>
      )}
      <label className="form-full">
        Observaciones
        <textarea value={form.observaciones} onChange={(event) => updateField('observaciones', event.target.value)} />
      </label>
      {error && <p className="error-state form-full">{error}</p>}
      {message && <p className="info-state form-full">{message}</p>}
      <div className="form-actions form-full">
        <button className="primary-button" type="submit" disabled={saving}>
          {saving ? 'Guardando...' : 'Guardar cambios'}
        </button>
        <button className="secondary-button" type="button" onClick={onCancel}>
          Cancelar
        </button>
      </div>
    </form>
  )
}

export default PartidoEditForm
