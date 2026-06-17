import { useEffect, useMemo, useState } from 'react'
import { useParams } from 'react-router-dom'
import {
  getPairName,
} from '../services/adminData.js'
import { saveCategoriaGroupConfig } from '../services/categoriaService.js'
import {
  assignParejaToGrupo,
  assignParejasAutomaticamente,
  generateEliminationFromClassified,
  generateGroupMatches,
  recalcularClasificacion,
  removeParejaFromGrupo,
  saveGrupo,
} from '../services/grupoService.js'
import { getTorneoById, getTorneosAdmin } from '../services/torneoService.js'
import { useAdminData } from '../services/useAdminData.js'
import { getParticipantLabels, getPendingParticipantLabel, resolveTipoDeporte } from '../utils/participantLabels.js'
import { formatResultadoPartido } from '../utils/sportRules.js'

const criterios = [
  { value: 'puntos', label: 'Puntos' },
  { value: 'diferencia_sets', label: 'Diferencia de sets' },
  { value: 'diferencia_juegos', label: 'Diferencia de juegos' },
  { value: 'juegos_favor', label: 'Juegos a favor' },
  { value: 'resultado_directo', label: 'Resultado directo' },
]

const tipoCuadroOptions = ['final', 'semifinal', 'cuartos', 'octavos']

const emptyGroupForm = {
  id: '',
  nombre: '',
  orden: 0,
}

const emptyAssignForm = {
  grupo_id: '',
  pareja_id: '',
}

function buildDefaultConfig(categoria) {
  return {
    tiene_fase_grupos: Boolean(categoria?.tiene_fase_grupos),
    numero_grupos: categoria?.numero_grupos || 0,
    parejas_por_grupo: categoria?.parejas_por_grupo || 0,
    clasifican_por_grupo: categoria?.clasifican_por_grupo || 1,
    tipo_cuadro_final: categoria?.tipo_cuadro_final || 'final',
    criterios_clasificacion: categoria?.criterios_clasificacion?.length
      ? categoria.criterios_clasificacion
      : ['puntos', 'diferencia_sets', 'diferencia_juegos', 'juegos_favor'],
  }
}

function getPartidoParticipantName(partido, parejasMap, side, tipoDeporte) {
  const participanteId = side === 'A' ? partido.pareja_a_id : partido.pareja_b_id
  const participante = parejasMap.get(participanteId)
  return participante ? getPairName(participante) : getPendingParticipantLabel(tipoDeporte, side)
}

function getPartidoHorario(partido) {
  return partido.fecha && partido.hora ? `${partido.fecha} ${partido.hora.slice(0, 5)}` : 'Horario pendiente'
}

function sortPartidosGrupo(a, b) {
  return (a.orden ?? 0) - (b.orden ?? 0) ||
    String(a.fecha || '').localeCompare(String(b.fecha || '')) ||
    String(a.hora || '').localeCompare(String(b.hora || ''))
}

function AdminGrupos() {
  const { torneoId } = useParams()
  const {
    categorias,
    parejas,
    partidos,
    grupos,
    grupoParejas,
    clasificacionesGrupo,
    loading,
    error,
    refresh,
  } = useAdminData(torneoId)
  const [categoriaId, setCategoriaId] = useState('')
  const [configDraft, setConfigDraft] = useState(null)
  const [groupForm, setGroupForm] = useState(emptyGroupForm)
  const [assignForm, setAssignForm] = useState(emptyAssignForm)
  const [saving, setSaving] = useState(false)
  const [actionError, setActionError] = useState('')
  const [successMessage, setSuccessMessage] = useState('')
  const [torneo, setTorneo] = useState(null)
  const [torneos, setTorneos] = useState([])
  const selectedCategoriaId = categoriaId

  const categoria = useMemo(
    () => categorias.find((current) => current.id === selectedCategoriaId),
    [selectedCategoriaId, categorias],
  )
  const torneosMap = useMemo(
    () => new Map(torneos.map((current) => [current.id, current])),
    [torneos],
  )
  const tipoDeporte = resolveTipoDeporte({ torneo, categoria, torneosMap })
  const participantLabels = getParticipantLabels(tipoDeporte)
  const isFutbolSala = tipoDeporte === 'futbol_sala'

  const configForm = configDraft?.categoriaId === selectedCategoriaId
    ? configDraft.values
    : buildDefaultConfig(categoria)

  const parejasMap = useMemo(
    () => new Map(parejas.map((pareja) => [pareja.id, pareja])),
    [parejas],
  )

  const gruposCategoria = useMemo(
    () => grupos.filter((grupo) => grupo.categoria_id === selectedCategoriaId),
    [selectedCategoriaId, grupos],
  )

  const parejasCategoria = useMemo(
    () => parejas.filter((pareja) => pareja.categoria_id === selectedCategoriaId && pareja.activo),
    [selectedCategoriaId, parejas],
  )

  const grupoIds = useMemo(
    () => new Set(gruposCategoria.map((grupo) => grupo.id)),
    [gruposCategoria],
  )

  const asignacionesCategoria = useMemo(
    () => grupoParejas.filter((asignacion) => grupoIds.has(asignacion.grupo_id)),
    [grupoIds, grupoParejas],
  )

  const parejasAsignadas = useMemo(
    () => new Set(asignacionesCategoria.map((asignacion) => asignacion.pareja_id)),
    [asignacionesCategoria],
  )

  const parejasDisponibles = useMemo(
    () => parejasCategoria.filter((pareja) => !parejasAsignadas.has(pareja.id)),
    [parejasAsignadas, parejasCategoria],
  )

  const partidosGrupo = useMemo(
    () => partidos.filter((partido) => partido.categoria_id === selectedCategoriaId && partido.fase === 'grupos'),
    [selectedCategoriaId, partidos],
  )

  const clasificacionCategoria = useMemo(
    () => clasificacionesGrupo.filter((fila) => grupoIds.has(fila.grupo_id)),
    [clasificacionesGrupo, grupoIds],
  )

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

  function updateConfig(field, value) {
    setConfigDraft({
      categoriaId: selectedCategoriaId,
      values: { ...configForm, [field]: value },
    })
  }

  function toggleCriterio(value) {
    const exists = configForm.criterios_clasificacion.includes(value)
    setConfigDraft({
      categoriaId: selectedCategoriaId,
      values: {
        ...configForm,
        criterios_clasificacion: exists
          ? configForm.criterios_clasificacion.filter((criterio) => criterio !== value)
          : [...configForm.criterios_clasificacion, value],
      },
    })
  }

  async function runAction(callback, message) {
    setSaving(true)
    setActionError('')
    setSuccessMessage('')

    try {
      await callback()
      await refresh()
      setConfigDraft(null)
      setSuccessMessage(message)
    } catch (currentError) {
      setActionError(currentError.message)
    } finally {
      setSaving(false)
    }
  }

  async function handleSaveConfig(event) {
    event.preventDefault()
    await runAction(
      () => saveCategoriaGroupConfig(selectedCategoriaId, configForm),
      'Configuracion guardada.',
    )
  }

  async function handleSaveGroup(event) {
    event.preventDefault()
    await runAction(
      () => saveGrupo({ ...groupForm, categoria_id: selectedCategoriaId }),
      groupForm.id ? 'Grupo actualizado.' : 'Grupo creado.',
    )
    setGroupForm(emptyGroupForm)
  }

  async function handleCreateConfiguredGroups() {
    await runAction(async () => {
      if (!selectedCategoriaId) {
        throw new Error('Selecciona una categoria antes de crear grupos.')
      }

      const existingNames = new Set(gruposCategoria.map((grupo) => grupo.nombre.toLowerCase()))
      const total = Number(configForm.numero_grupos || 0)
      const inserts = Array.from({ length: total }, (_, index) => ({
        categoria_id: selectedCategoriaId,
        nombre: `Grupo ${String.fromCharCode(65 + index)}`,
        orden: index + 1,
      })).filter((grupo) => !existingNames.has(grupo.nombre.toLowerCase()))

      for (const grupo of inserts) {
        await saveGrupo(grupo)
      }
    }, 'Grupos configurados creados.')
  }

  async function handleAssign(event) {
    event.preventDefault()
    await runAction(
      () => assignParejaToGrupo({ categoriaId: selectedCategoriaId, ...assignForm }),
      'Asignacion guardada.',
    )
    setAssignForm(emptyAssignForm)
  }

  return (
    <div className="admin-page">
      <div className="section-heading">
        <p className="eyebrow">Gestion</p>
        <h2>Grupos</h2>
      </div>

      <div className="filters">
        <label>
          Categoria
          <select
            value={selectedCategoriaId}
            onChange={(event) => {
              setCategoriaId(event.target.value)
              setConfigDraft(null)
              setGroupForm(emptyGroupForm)
              setAssignForm(emptyAssignForm)
            }}
          >
            <option value="">Selecciona categoria</option>
            {categorias.map((current) => (
              <option key={current.id} value={current.id}>
                {current.nombre}
              </option>
            ))}
          </select>
        </label>
      </div>

      <form className="admin-form wide" onSubmit={handleSaveConfig}>
        <h3>Configuracion de fase de grupos</h3>
        <label className="check-field">
          <input
            type="checkbox"
            checked={configForm.tiene_fase_grupos}
            onChange={(event) => updateConfig('tiene_fase_grupos', event.target.checked)}
          />
          Tiene fase de grupos
        </label>
        <label>
          Numero de grupos
          <input
            type="number"
            min="0"
            value={configForm.numero_grupos}
            onChange={(event) => updateConfig('numero_grupos', event.target.value)}
          />
        </label>
        <label>
          {participantLabels.plural} por grupo
          <input
            type="number"
            min="0"
            value={configForm.parejas_por_grupo}
            onChange={(event) => updateConfig('parejas_por_grupo', event.target.value)}
          />
        </label>
        <label>
          Clasifican por grupo
          <input
            type="number"
            min="1"
            value={configForm.clasifican_por_grupo}
            onChange={(event) => updateConfig('clasifican_por_grupo', event.target.value)}
          />
        </label>
        <label>
          Cuadro final
          <select
            value={configForm.tipo_cuadro_final}
            onChange={(event) => updateConfig('tipo_cuadro_final', event.target.value)}
          >
            {tipoCuadroOptions.map((option) => (
              <option key={option} value={option}>{option}</option>
            ))}
          </select>
        </label>
        <fieldset className="score-fieldset">
          <legend>Criterios de clasificacion</legend>
          <div className="criteria-grid">
            {criterios.map((criterio) => (
              <label key={criterio.value} className="check-field">
                <input
                  type="checkbox"
                  checked={configForm.criterios_clasificacion.includes(criterio.value)}
                  onChange={() => toggleCriterio(criterio.value)}
                />
                {criterio.label}
              </label>
            ))}
          </div>
        </fieldset>
        <div className="form-actions form-full">
          <button className="primary-button" type="submit" disabled={saving || !selectedCategoriaId}>
            Guardar configuracion
          </button>
          <button className="secondary-button" type="button" disabled={saving || !selectedCategoriaId} onClick={handleCreateConfiguredGroups}>
            Crear grupos configurados
          </button>
        </div>
      </form>

      <form className="admin-form" onSubmit={handleSaveGroup}>
        <h3>{groupForm.id ? 'Editar grupo' : 'Crear grupo'}</h3>
        <label>
          Nombre
          <input
            value={groupForm.nombre}
            onChange={(event) => setGroupForm((current) => ({ ...current, nombre: event.target.value }))}
            required
          />
        </label>
        <label>
          Orden
          <input
            type="number"
            value={groupForm.orden}
            onChange={(event) => setGroupForm((current) => ({ ...current, orden: event.target.value }))}
          />
        </label>
        <div className="form-actions">
          <button className="primary-button" type="submit" disabled={saving || !selectedCategoriaId}>
            Guardar grupo
          </button>
          {groupForm.id && (
            <button className="secondary-button" type="button" onClick={() => setGroupForm(emptyGroupForm)}>
              Cancelar
            </button>
          )}
        </div>
      </form>

      <form className="admin-form" onSubmit={handleAssign}>
        <h3>Asignar {participantLabels.singularLower} a grupo</h3>
        <label>
          Grupo
          <select
            value={assignForm.grupo_id}
            onChange={(event) => setAssignForm((current) => ({ ...current, grupo_id: event.target.value }))}
            required
          >
            <option value="">Selecciona grupo</option>
            {gruposCategoria.map((grupo) => (
              <option key={grupo.id} value={grupo.id}>{grupo.nombre}</option>
            ))}
          </select>
        </label>
        <label>
          {participantLabels.singular}
          <select
            value={assignForm.pareja_id}
            onChange={(event) => setAssignForm((current) => ({ ...current, pareja_id: event.target.value }))}
            required
          >
            <option value="">Selecciona {participantLabels.singularLower}</option>
            {parejasDisponibles.map((pareja) => (
              <option key={pareja.id} value={pareja.id}>{getPairName(pareja)}</option>
            ))}
          </select>
        </label>
        <div className="form-actions">
          <button className="primary-button" type="submit" disabled={saving || !selectedCategoriaId}>
            Asignar
          </button>
          <button
            className="secondary-button"
            type="button"
            disabled={saving || !selectedCategoriaId}
            onClick={() => runAction(() => assignParejasAutomaticamente(selectedCategoriaId), 'Participantes repartidos automaticamente.')}
          >
            Repartir automaticamente
          </button>
        </div>
      </form>

      <div className="form-actions">
        <button
          className="primary-button"
          type="button"
          disabled={saving || !selectedCategoriaId}
          onClick={() => runAction(() => generateGroupMatches(selectedCategoriaId), 'Partidos de grupos generados.')}
        >
          Generar partidos de grupos
        </button>
        <button
          className="secondary-button"
          type="button"
          disabled={saving || !selectedCategoriaId}
          onClick={() => runAction(() => recalcularClasificacion(selectedCategoriaId), 'Clasificacion recalculada.')}
        >
          Recalcular clasificacion
        </button>
        <button
          className="secondary-button"
          type="button"
          disabled={saving || !selectedCategoriaId}
          onClick={() => runAction(() => generateEliminationFromClassified(selectedCategoriaId), 'Cuadro final generado.')}
        >
          Generar cuadro final desde clasificados
        </button>
      </div>

      {loading && <p className="info-state">Cargando grupos...</p>}
      {error && <p className="error-state">{error}</p>}
      {actionError && <p className="error-state">{actionError}</p>}
      {successMessage && <p className="info-state">{successMessage}</p>}
      {!loading && !categorias.length && <p className="info-state">Crea una categoria antes de configurar grupos.</p>}
      {!loading && categorias.length > 0 && !selectedCategoriaId && (
        <p className="info-state">Selecciona una categoria para ver y crear sus grupos.</p>
      )}

      <div className="groups-list">
        {gruposCategoria.map((grupo) => {
          const asignacionesGrupo = asignacionesCategoria.filter((asignacion) => asignacion.grupo_id === grupo.id)
          const clasificacionGrupo = clasificacionCategoria
            .filter((fila) => fila.grupo_id === grupo.id)
            .sort((a, b) => a.posicion - b.posicion)
          const partidosDelGrupo = partidosGrupo
            .filter((partido) => partido.grupo_id === grupo.id)
            .sort(sortPartidosGrupo)

          return (
            <section key={grupo.id} className="group-panel">
              <div className="group-panel__header">
                <h3>{grupo.nombre}</h3>
                <div className="row-actions">
                  <button type="button" className="secondary-button" onClick={() => setGroupForm(grupo)}>
                    Editar
                  </button>
                </div>
              </div>

              <div className="group-teams">
                {asignacionesGrupo.map((asignacion) => (
                  <span key={asignacion.id}>
                    {getPairName(parejasMap.get(asignacion.pareja_id))}
                    <button type="button" className="inline-action" onClick={() => runAction(() => removeParejaFromGrupo(asignacion.id), 'Participante retirado del grupo.')}>
                      Quitar
                    </button>
                  </span>
                ))}
              </div>

              <div className="standings-table">
                <div className="standings-row standings-head">
                  <span>Pos</span>
                  <span>{participantLabels.singular}</span>
                  <span>PJ</span>
                  <span>PG</span>
                  {isFutbolSala ? (
                    <>
                      <span>PE</span>
                      <span>GF</span>
                      <span>GC</span>
                      <span>DG</span>
                    </>
                  ) : (
                    <>
                      <span>DS</span>
                      <span>DJ</span>
                    </>
                  )}
                  <span>Pts</span>
                </div>
                {clasificacionGrupo.map((fila) => (
                  <div key={fila.id} className={fila.posicion <= Number(configForm.clasifican_por_grupo) ? 'standings-row qualified' : 'standings-row'}>
                    <span>{fila.posicion}</span>
                    <strong>{getPairName(parejasMap.get(fila.pareja_id))}</strong>
                    <span>{fila.partidos_jugados}</span>
                    <span>{fila.partidos_ganados}</span>
                    {isFutbolSala ? (
                      <>
                        <span>{fila.partidos_empatados || 0}</span>
                        <span>{fila.goles_favor || 0}</span>
                        <span>{fila.goles_contra || 0}</span>
                        <span>{fila.diferencia_goles || 0}</span>
                      </>
                    ) : (
                      <>
                        <span>{fila.diferencia_sets}</span>
                        <span>{fila.diferencia_juegos}</span>
                      </>
                    )}
                    <span>{fila.puntos}</span>
                  </div>
                ))}
              </div>

              <div className="group-matches">
                <h4>Partidos del grupo</h4>
                {partidosDelGrupo.length ? (
                  partidosDelGrupo.map((partido) => (
                    <article key={partido.id} className="match-card compact-match-card">
                      <div className="match-card__top">
                        <span className={`status-pill ${(partido.estado || 'pendiente').toLowerCase().replaceAll(' ', '-')}`}>
                          {partido.estado || 'pendiente'}
                        </span>
                        <span>{partido.ronda}</span>
                      </div>
                      <h3>
                        {getPartidoParticipantName(partido, parejasMap, 'A', tipoDeporte)}
                        <span> vs </span>
                        {getPartidoParticipantName(partido, parejasMap, 'B', tipoDeporte)}
                      </h3>
                      <div className="match-card__meta">
                        <span>{getPartidoHorario(partido)}</span>
                        <span>{partido.pista || 'Pista pendiente'}</span>
                      </div>
                      <p className="match-card__score">{formatResultadoPartido(partido, tipoDeporte) || 'Pendiente de disputar'}</p>
                    </article>
                  ))
                ) : (
                  <p className="info-state">Todavia no hay partidos generados para este grupo.</p>
                )}
              </div>
            </section>
          )
        })}
      </div>
    </div>
  )
}

export default AdminGrupos
