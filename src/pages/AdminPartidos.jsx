import { useEffect, useMemo, useState } from 'react'
import { useParams } from 'react-router-dom'
import { getPairName, savePartido } from '../services/adminData.js'
import { getTorneoById, getTorneosAdmin } from '../services/torneoService.js'
import { useAdminData } from '../services/useAdminData.js'
import { getParticipantLabel, resolveTipoDeporte } from '../utils/participantLabels.js'
import { calcularGanadorPartido, formatResultadoPartido } from '../utils/sportRules.js'

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
  fase: 'eliminatoria',
  grupo_id: '',
  orden: '',
  pareja_a_id: '',
  pareja_b_id: '',
  fecha: '',
  hora: '',
  pista: '',
  pista_id: '',
  estado: 'pendiente',
  set1_a: '',
  set1_b: '',
  set2_a: '',
  set2_b: '',
  set3_a: '',
  set3_b: '',
  goles_a: '',
  goles_b: '',
  penaltis_a: '',
  penaltis_b: '',
  ganador_manual_id: '',
  observaciones: '',
}

function toFieldValue(value) {
  return value === null || value === undefined ? '' : value
}

function AdminPartidos() {
  const { torneoId } = useParams()
  const { categorias, parejas, partidos, grupos, pistas, loading, error, refresh } = useAdminData(torneoId)
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)
  const [actionError, setActionError] = useState('')
  const [faseFiltro, setFaseFiltro] = useState('todas')
  const [torneo, setTorneo] = useState(null)
  const [torneos, setTorneos] = useState([])
  const torneosMap = useMemo(
    () => new Map(torneos.map((current) => [current.id, current])),
    [torneos],
  )
  const selectedCategoria = useMemo(
    () => categorias.find((categoria) => categoria.id === form.categoria_id),
    [categorias, form.categoria_id],
  )
  const tipoDeporte = resolveTipoDeporte({ torneo, categoria: selectedCategoria, torneosMap })
  const isFutbolSala = tipoDeporte === 'futbol_sala'
  const participantLabel = getParticipantLabel(tipoDeporte)

  const categoriasMap = useMemo(
    () => new Map(categorias.map((categoria) => [categoria.id, categoria])),
    [categorias],
  )
  const parejasMap = useMemo(
    () => new Map(parejas.map((pareja) => [pareja.id, pareja])),
    [parejas],
  )

  const parejasDisponibles = useMemo(() => {
    return parejas.filter((pareja) => !form.categoria_id || pareja.categoria_id === form.categoria_id)
  }, [form.categoria_id, parejas])

  const gruposDisponibles = useMemo(() => {
    return grupos.filter((grupo) => !form.categoria_id || grupo.categoria_id === form.categoria_id)
  }, [form.categoria_id, grupos])

  const partidosFiltrados = useMemo(() => {
    return partidos.filter((partido) => faseFiltro === 'todas' || (partido.fase || 'eliminatoria') === faseFiltro)
  }, [faseFiltro, partidos])

  const ganadorId = calcularGanadorPartido(form, tipoDeporte)
  const ganador = parejasMap.get(ganadorId)
  const footballDraw = isFutbolSala &&
    form.fase === 'eliminatoria' &&
    form.goles_a !== '' &&
    form.goles_b !== '' &&
    Number(form.goles_a) === Number(form.goles_b)

  useEffect(() => {
    let active = true

    async function loadTorneo() {
      if (!torneoId) {
        setTorneo(null)
        try {
          const result = await getTorneosAdmin()
          if (active) setTorneos(result)
        } catch {
          if (active) setTorneos([])
        }
        return
      }

      try {
        const result = await getTorneoById(torneoId)
        if (active) setTorneo(result)
      } catch {
        if (active) setTorneo(null)
      }
    }

    loadTorneo()

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
      pareja_a_id: '',
      pareja_b_id: '',
      grupo_id: '',
    }))
  }

  function editPartido(partido) {
    setForm({
      id: partido.id,
      categoria_id: partido.categoria_id,
      ronda: partido.ronda || '',
      fase: partido.fase || 'eliminatoria',
      grupo_id: partido.grupo_id || '',
      orden: toFieldValue(partido.orden),
      pareja_a_id: partido.pareja_a_id,
      pareja_b_id: partido.pareja_b_id,
      fecha: partido.fecha || '',
      hora: partido.hora ? partido.hora.slice(0, 5) : '',
      pista: partido.pista || '',
      pista_id: partido.pista_id || '',
      estado: partido.estado,
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
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setSaving(true)
    setActionError('')

    try {
      await savePartido(form)
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
                <option key={grupo.id} value={grupo.id}>
                  {grupo.nombre}
                </option>
              ))}
            </select>
          </label>
        )}
        <label>
          Orden
          <input
            type="number"
            value={form.orden}
            onChange={(event) => updateField('orden', event.target.value)}
          />
        </label>
        <label>
          Ronda
          <input value={form.ronda} onChange={(event) => updateField('ronda', event.target.value)} required />
        </label>
        <label>
          {participantLabel} A
          <select value={form.pareja_a_id} onChange={(event) => updateField('pareja_a_id', event.target.value)} required>
            <option value="">Selecciona {participantLabel.toLowerCase()}</option>
            {parejasDisponibles.map((pareja) => (
              <option key={pareja.id} value={pareja.id}>
                {getPairName(pareja)}
              </option>
            ))}
          </select>
        </label>
        <label>
          {participantLabel} B
          <select value={form.pareja_b_id} onChange={(event) => updateField('pareja_b_id', event.target.value)} required>
            <option value="">Selecciona {participantLabel.toLowerCase()}</option>
            {parejasDisponibles.map((pareja) => (
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
          <select value={form.pista_id} onChange={(event) => updateField('pista_id', event.target.value)}>
            <option value="">Sin pista asignada</option>
            {pistas.filter((pista) => pista.activa).map((pista) => (
              <option key={pista.id} value={pista.id}>
                {pista.nombre}
              </option>
            ))}
          </select>
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

        {isFutbolSala ? (
          <fieldset className="score-fieldset">
            <legend>Resultado</legend>
            <div className="score-row">
              <span>Goles</span>
              <input
                type="number"
                min="0"
                value={form.goles_a}
                onChange={(event) => updateField('goles_a', event.target.value)}
                aria-label="Goles equipo A"
              />
              <input
                type="number"
                min="0"
                value={form.goles_b}
                onChange={(event) => updateField('goles_b', event.target.value)}
                aria-label="Goles equipo B"
              />
            </div>
            {footballDraw && (
              <>
                <div className="score-row">
                  <span>Penaltis</span>
                  <input
                    type="number"
                    min="0"
                    value={form.penaltis_a}
                    onChange={(event) => updateField('penaltis_a', event.target.value)}
                    aria-label="Penaltis equipo A"
                  />
                  <input
                    type="number"
                    min="0"
                    value={form.penaltis_b}
                    onChange={(event) => updateField('penaltis_b', event.target.value)}
                    aria-label="Penaltis equipo B"
                  />
                </div>
                <label>
                  Ganador manual
                  <select value={form.ganador_manual_id} onChange={(event) => updateField('ganador_manual_id', event.target.value)}>
                    <option value="">Sin ganador manual</option>
                    {[form.pareja_a_id, form.pareja_b_id].filter(Boolean).map((parejaId) => (
                      <option key={parejaId} value={parejaId}>
                        {getPairName(parejasMap.get(parejaId))}
                      </option>
                    ))}
                  </select>
                </label>
              </>
            )}
            <p className="winner-preview">
              Ganador automatico: {ganador ? getPairName(ganador) : 'sin ganador'}
            </p>
          </fieldset>
        ) : (
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
        )}

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

      <div className="filters">
        <label>
          Filtrar por fase
          <select value={faseFiltro} onChange={(event) => setFaseFiltro(event.target.value)}>
            <option value="todas">Todas</option>
            <option value="grupos">Grupos</option>
            <option value="eliminatoria">Eliminatoria</option>
          </select>
        </label>
      </div>

      <div className="data-table admin-table">
        {partidosFiltrados.map((partido) => {
          const parejaA = parejasMap.get(partido.pareja_a_id)
          const parejaB = parejasMap.get(partido.pareja_b_id)
          const ganadorPartido = parejasMap.get(partido.ganador_id)
          const partidoCategoria = categoriasMap.get(partido.categoria_id)
          const partidoTipoDeporte = resolveTipoDeporte({ torneo, categoria: partidoCategoria, torneosMap })
          const marcador = formatResultadoPartido(partido, partidoTipoDeporte)

          return (
            <div key={partido.id} className="data-row">
              <strong>{getPairName(parejaA)} vs {getPairName(parejaB)}</strong>
              <span>{categoriasMap.get(partido.categoria_id)?.nombre || 'Sin categoria'}</span>
              <span>{partido.fase === 'grupos' ? 'Grupos' : 'Eliminatoria'} / {partido.ronda || 'Sin ronda'}</span>
              <span>{partido.fecha || 'Sin fecha'} · {partido.hora?.slice(0, 5) || 'Sin hora'} · {partido.pista || 'Sin pista'}</span>
              <span>{estados.find((estado) => estado.value === partido.estado)?.label || partido.estado}</span>
              <span>{marcador || 'Sin resultado'}</span>
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
