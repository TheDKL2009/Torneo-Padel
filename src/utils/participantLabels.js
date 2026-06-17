const footballCategoryPattern = /f[uú]tbol|futbol|sala/i

export function isFutbolSala(tipoDeporte) {
  return tipoDeporte === 'futbol_sala'
}

export function inferTipoDeporteFromCategory(categoria) {
  return footballCategoryPattern.test(`${categoria?.nombre || ''} ${categoria?.tipo || ''}`)
    ? 'futbol_sala'
    : null
}

export function resolveTipoDeporte({ tipoDeporte, torneo, categoria, torneosMap } = {}) {
  if (tipoDeporte) return tipoDeporte
  if (torneo?.tipo_deporte) return torneo.tipo_deporte

  const categoriaTorneoId = categoria?.torneo_id || categoria?.torneoId
  const torneoFromCategory = categoriaTorneoId ? torneosMap?.get(categoriaTorneoId) : null

  if (torneoFromCategory?.tipo_deporte) return torneoFromCategory.tipo_deporte

  return inferTipoDeporteFromCategory(categoria) || 'padel'
}

export function getParticipantLabel(tipoDeporte) {
  return isFutbolSala(tipoDeporte) ? 'Equipo' : 'Pareja'
}

export function getParticipantPluralLabel(tipoDeporte) {
  return isFutbolSala(tipoDeporte) ? 'Equipos' : 'Parejas'
}

export function getCreateParticipantLabel(tipoDeporte) {
  return isFutbolSala(tipoDeporte) ? 'Crear equipo' : 'Crear pareja'
}

export function getEditParticipantLabel(tipoDeporte) {
  return isFutbolSala(tipoDeporte) ? 'Editar equipo' : 'Editar pareja'
}

export function getParticipantCountLabel(tipoDeporte) {
  return isFutbolSala(tipoDeporte) ? 'equipos inscritos' : 'parejas inscritas'
}

export function getParticipantFields(tipoDeporte) {
  if (isFutbolSala(tipoDeporte)) {
    return {
      principal: 'Nombre del equipo',
      contacto: 'Responsable / capitan',
      activo: 'Activo',
    }
  }

  return {
    jugador1: 'Jugador 1',
    jugador2: 'Jugador 2',
    activo: 'Activa',
  }
}

export function getParticipantLabels(tipoDeporte) {
  const singular = getParticipantLabel(tipoDeporte)
  const plural = getParticipantPluralLabel(tipoDeporte)

  return {
    singular,
    plural,
    singularLower: singular.toLowerCase(),
    pluralLower: plural.toLowerCase(),
    create: getCreateParticipantLabel(tipoDeporte),
    edit: getEditParticipantLabel(tipoDeporte),
    count: getParticipantCountLabel(tipoDeporte),
    fields: getParticipantFields(tipoDeporte),
  }
}

export function getPendingParticipantLabel(tipoDeporte, side = '') {
  const label = getParticipantLabel(tipoDeporte)
  return `${label}${side ? ` ${side}` : ''} pendiente`
}
