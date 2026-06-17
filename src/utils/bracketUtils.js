const roundOrder = [
  'dieciseisavos',
  'octavos',
  'cuartos',
  'semifinal',
  'final',
]

const roundLabels = {
  dieciseisavos: 'Dieciseisavos',
  octavos: 'Octavos de final',
  cuartos: 'Cuartos de final',
  semifinal: 'Semifinales',
  final: 'Final',
  otros: 'Otros',
}

export function getRoundKey(value = '') {
  const round = value.toLowerCase()

  if (round.includes('dieciseis') || round.includes('16avos') || round.includes('primera')) return 'dieciseisavos'
  if (round.includes('octavo') || round.includes('round of 16')) return 'octavos'
  if (round.includes('cuarto') || round.includes('quarter')) return 'cuartos'
  if (round.includes('semi')) return 'semifinal'
  if (round.includes('final')) return 'final'

  return 'otros'
}

export function getRoundLabel(ronda) {
  return roundLabels[getRoundKey(ronda)] || ronda || 'Ronda'
}

export function getWinner(match) {
  if (!match?.ganadorId) return null
  if (match.ganadorId === match.parejaAId) return match.parejaA
  if (match.ganadorId === match.parejaBId) return match.parejaB
  return match.ganador || null
}

export function sortMatchesByBracketPosition(matches) {
  return [...matches].sort((a, b) => {
    const orderA = Number.isFinite(Number(a.ordenRonda ?? a.orden)) ? Number(a.ordenRonda ?? a.orden) : 9999
    const orderB = Number.isFinite(Number(b.ordenRonda ?? b.orden)) ? Number(b.ordenRonda ?? b.orden) : 9999

    return orderA - orderB || String(a.id).localeCompare(String(b.id))
  })
}

export function groupMatchesByRound(matches) {
  return matches.reduce((rounds, match) => {
    const key = getRoundKey(match.ronda)
    const current = rounds.get(key) || []
    current.push(match)
    rounds.set(key, current)
    return rounds
  }, new Map())
}

export function buildBracketRounds(matches) {
  const byRound = groupMatchesByRound(matches)
  const keys = [
    ...roundOrder.filter((key) => byRound.has(key)),
    ...[...byRound.keys()].filter((key) => !roundOrder.includes(key)),
  ]

  return keys.map((key, index) => {
    const roundMatches = sortMatchesByBracketPosition(byRound.get(key) || [])
    return {
      key,
      label: roundLabels[key] || getRoundLabel(roundMatches[0]?.ronda),
      depth: index,
      matches: roundMatches,
    }
  })
}

export function getChampion(rounds) {
  const finalRound = rounds.find((round) => round.key === 'final') || rounds.at(-1)
  const finalMatch = finalRound?.matches?.find((match) => match.ganadorId)
  return getWinner(finalMatch)
}

export function validateBracketStructure(matches) {
  const warnings = []
  const byId = new Map(matches.map((match) => [match.id, match]))

  matches.forEach((match) => {
    if (match.fase !== 'eliminatoria') {
      warnings.push(`El partido ${match.id} no pertenece a fase eliminatoria.`)
    }

    if (match.siguientePartidoId && !byId.has(match.siguientePartidoId)) {
      warnings.push(`El partido ${match.id} apunta a un siguiente partido que no esta en este cuadro.`)
    }

    if (match.siguientePartidoId && !['a', 'b'].includes(match.siguientePosicion)) {
      warnings.push(`El partido ${match.id} tiene siguiente_partido_id pero no siguiente_posicion valida.`)
    }

    if (match.ganadorId && match.ganadorId !== match.parejaAId && match.ganadorId !== match.parejaBId) {
      warnings.push(`El ganador del partido ${match.id} no coincide con ninguna pareja del partido.`)
    }
  })

  return {
    valid: warnings.length === 0,
    warnings,
  }
}
