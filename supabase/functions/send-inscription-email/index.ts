const resendApiKey = Deno.env.get('RESEND_API_KEY')
const adminEmail = Deno.env.get('INSCRIPTIONS_TO_EMAIL')
const fromEmail = Deno.env.get('INSCRIPTIONS_FROM_EMAIL') || 'Inscripciones <onboarding@resend.dev>'
const siteOrigin = Deno.env.get('PUBLIC_SITE_ORIGIN') || '*'

const corsHeaders = {
  'Access-Control-Allow-Origin': siteOrigin,
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

const modalidadLabels: Record<string, string> = {
  pareja: 'Pareja',
  equipo: 'Equipo',
  individual: 'Individual',
}

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...corsHeaders,
      'Content-Type': 'application/json',
    },
  })
}

function cleanText(value: unknown) {
  return String(value || '').trim()
}

function escapeHtml(value: unknown) {
  return cleanText(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;')
}

function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
}

function isValidPhone(value: string) {
  return /^[+\d]{6,20}$/.test(value)
}

function formatPlayers(players: unknown) {
  if (Array.isArray(players)) {
    return players.map(cleanText).filter(Boolean)
  }

  return cleanText(players)
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
}

function buildDisplayName(payload: Record<string, unknown>) {
  const modalidad = cleanText(payload.modalidad) || 'pareja'

  if (modalidad === 'equipo') {
    return cleanText(payload.nombreEquipo)
  }

  if (modalidad === 'individual') {
    return cleanText(payload.jugador1)
  }

  return [payload.jugador1, payload.jugador2].map(cleanText).filter(Boolean).join(' / ')
}

function validatePayload(payload: Record<string, unknown>) {
  const modalidad = cleanText(payload.modalidad) || 'pareja'
  const email = cleanText(payload.email)

  if (cleanText(payload.honeypot)) {
    return 'Solicitud no valida.'
  }

  if (!cleanText(payload.categoriaId) || !cleanText(payload.categoriaNombre)) {
    return 'Selecciona una categoria.'
  }

  if (!['pareja', 'equipo', 'individual'].includes(modalidad)) {
    return 'Modalidad no valida.'
  }

  if (!isValidEmail(email)) {
    return 'Email no valido.'
  }

  if (!isValidPhone(cleanText(payload.telefono))) {
    return 'Telefono no valido.'
  }

  if (!payload.aceptaRgpd) {
    return 'Debes aceptar la politica de privacidad.'
  }

  if (modalidad === 'pareja' && (!cleanText(payload.jugador1) || !cleanText(payload.jugador2))) {
    return 'Indica los dos jugadores.'
  }

  if (modalidad === 'individual' && !cleanText(payload.jugador1)) {
    return 'Indica el nombre del participante.'
  }

  if (modalidad === 'equipo' && (!cleanText(payload.nombreEquipo) || !cleanText(payload.capitan))) {
    return 'Indica el nombre del equipo y capitan.'
  }

  return ''
}

function detailRows(payload: Record<string, unknown>) {
  const modalidad = cleanText(payload.modalidad) || 'pareja'
  const rows = [
    ['Categoria', payload.categoriaNombre],
    ['Tipo / nivel', payload.categoriaNivel],
    ['Modalidad', modalidadLabels[modalidad] || modalidad],
    ['Nombre visible', buildDisplayName(payload)],
  ]

  if (modalidad === 'equipo') {
    rows.push(['Nombre del equipo', payload.nombreEquipo])
    rows.push(['Capitan', payload.capitan])
    const players = formatPlayers(payload.jugadores)
    rows.push(['Jugadores', players.length ? players.join('\n') : 'No indicado'])
  } else {
    rows.push(['Jugador 1', payload.jugador1])
    if (modalidad === 'pareja') rows.push(['Jugador 2', payload.jugador2])
  }

  rows.push(['Telefono', payload.telefono])
  rows.push(['Email', payload.email])
  rows.push(['Observaciones', payload.observaciones || 'Sin observaciones'])

  return rows
}

function buildAdminHtml(payload: Record<string, unknown>) {
  const rows = detailRows(payload)
    .map(([label, value]) => {
      const escapedValue = escapeHtml(value).replaceAll('\n', '<br>')
      return `
      <tr>
        <th style="text-align:left;padding:10px 12px;background:#eef4ef;border:1px solid #d8e2d5;width:180px;">${escapeHtml(label)}</th>
        <td style="padding:10px 12px;border:1px solid #d8e2d5;">${escapedValue}</td>
      </tr>
    `
    })
    .join('')

  return `
    <div style="font-family:Arial,sans-serif;color:#141A12;line-height:1.5;">
      <h1 style="color:#0F4A31;font-size:22px;margin:0 0 12px;">Nueva solicitud de inscripcion</h1>
      <p style="margin:0 0 18px;">Se ha recibido una nueva solicitud desde la web del torneo.</p>
      <table style="border-collapse:collapse;width:100%;max-width:720px;">${rows}</table>
      <p style="color:#5E6B5A;font-size:13px;margin-top:18px;">Recibida: ${escapeHtml(new Date().toLocaleString('es-ES'))}</p>
    </div>
  `
}

function buildConfirmationHtml(payload: Record<string, unknown>) {
  return `
    <div style="font-family:Arial,sans-serif;color:#141A12;line-height:1.5;">
      <h1 style="color:#0F4A31;font-size:22px;margin:0 0 12px;">Inscripcion recibida</h1>
      <p>Hola, hemos recibido tu solicitud para <strong>${escapeHtml(payload.categoriaNombre)}</strong>.</p>
      <p>El organizador revisara los datos y contactara contigo si necesita confirmar algo.</p>
      <p style="color:#5E6B5A;font-size:13px;">Este correo confirma la recepcion de la solicitud, no la aprobacion definitiva de la plaza.</p>
    </div>
  `
}

async function sendEmail(message: Record<string, unknown>) {
  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${resendApiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(message),
  })

  if (!response.ok) {
    const detail = await response.text()
    console.error('Resend error:', detail)
    throw new Error('No se pudo enviar el email.')
  }

  return response.json()
}

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  if (request.method !== 'POST') {
    return jsonResponse({ error: 'Metodo no permitido.' }, 405)
  }

  if (!resendApiKey || !adminEmail) {
    console.error('Missing RESEND_API_KEY or INSCRIPTIONS_TO_EMAIL')
    return jsonResponse({ error: 'Configuracion de email incompleta.' }, 500)
  }

  try {
    const payload = await request.json()
    const validationError = validatePayload(payload)

    if (validationError) {
      return jsonResponse({ error: validationError }, 400)
    }

    const displayName = buildDisplayName(payload)
    const subject = `Nueva inscripcion: ${displayName} - ${cleanText(payload.categoriaNombre)}`

    await sendEmail({
      from: fromEmail,
      to: [adminEmail],
      reply_to: cleanText(payload.email),
      subject,
      html: buildAdminHtml(payload),
    })

    if (payload.quiereConfirmacion) {
      await sendEmail({
        from: fromEmail,
        to: [cleanText(payload.email)],
        subject: 'Hemos recibido tu solicitud de inscripcion',
        html: buildConfirmationHtml(payload),
      })
    }

    return jsonResponse({ ok: true })
  } catch (error) {
    console.error('send-inscription-email error:', error)
    return jsonResponse({ error: 'No se pudo enviar la inscripcion.' }, 500)
  }
})
