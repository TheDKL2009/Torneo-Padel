import { useMemo, useState } from 'react'
import { Send, CheckCircle2 } from 'lucide-react'
import { useDocumentTitle } from '../hooks/useDocumentTitle.js'
import { usePublicData } from '../hooks/usePublicData.js'
import { sendInscriptionEmail } from '../services/inscriptionEmail.js'

const emptyForm = {
  categoriaId: '',
  jugador1: '',
  jugador2: '',
  nombreEquipo: '',
  capitan: '',
  jugadores: '',
  telefono: '',
  email: '',
  observaciones: '',
  aceptaRgpd: false,
  quiereConfirmacion: true,
  website: '',
}

const modalidadLabels = {
  pareja: 'Pareja',
  equipo: 'Equipo',
  individual: 'Individual',
}

function normalizeModalidad(value) {
  return value === 'equipo' || value === 'individual' ? value : 'pareja'
}

function isValidEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
}

function isValidPhone(value) {
  return /^[+\d]{6,20}$/.test(value)
}

function trim(value) {
  return value.trim()
}

function getFieldError(errors, field) {
  return errors[field] ? `${field}-error` : undefined
}

function Inscripcion() {
  useDocumentTitle('Inscripcion')
  const { categorias, loading, error } = usePublicData()
  const [form, setForm] = useState(emptyForm)
  const [errors, setErrors] = useState({})
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState('')
  const [success, setSuccess] = useState(false)

  const selectedCategory = useMemo(
    () => categorias.find((categoria) => categoria.id === form.categoriaId),
    [categorias, form.categoriaId],
  )
  const modalidad = normalizeModalidad(selectedCategory?.modalidad)

  function updateField(field, value) {
    setForm((current) => ({ ...current, [field]: value }))
    setErrors((current) => {
      if (!current[field]) return current
      const next = { ...current }
      delete next[field]
      return next
    })
  }

  function updateCategoria(value) {
    setForm((current) => ({
      ...emptyForm,
      categoriaId: value,
      telefono: current.telefono,
      email: current.email,
      aceptaRgpd: current.aceptaRgpd,
      quiereConfirmacion: current.quiereConfirmacion,
    }))
    setErrors({})
    setSubmitError('')
  }

  function validate() {
    const nextErrors = {}

    if (!form.categoriaId || !selectedCategory) {
      nextErrors.categoriaId = 'Selecciona una categoria.'
    }

    if (modalidad === 'pareja') {
      if (!trim(form.jugador1)) nextErrors.jugador1 = 'Indica el nombre del jugador 1.'
      if (!trim(form.jugador2)) nextErrors.jugador2 = 'Indica el nombre del jugador 2.'
    }

    if (modalidad === 'equipo') {
      if (!trim(form.nombreEquipo)) nextErrors.nombreEquipo = 'Indica el nombre del equipo.'
      if (!trim(form.capitan)) nextErrors.capitan = 'Indica el nombre del capitan.'
    }

    if (modalidad === 'individual' && !trim(form.jugador1)) {
      nextErrors.jugador1 = 'Indica el nombre del participante.'
    }

    if (!trim(form.telefono) || !isValidPhone(trim(form.telefono))) {
      nextErrors.telefono = 'Indica un telefono valido usando solo digitos y +.'
    }

    if (!trim(form.email) || !isValidEmail(trim(form.email))) {
      nextErrors.email = 'Indica un email valido.'
    }

    if (!form.aceptaRgpd) {
      nextErrors.aceptaRgpd = 'Debes aceptar la politica de privacidad.'
    }

    return nextErrors
  }

  function buildPayload() {
    return {
      categoriaId: selectedCategory.id,
      categoriaNombre: selectedCategory.nombre,
      categoriaNivel: selectedCategory.nivel,
      modalidad,
      jugador1: trim(form.jugador1),
      jugador2: trim(form.jugador2),
      nombreEquipo: trim(form.nombreEquipo),
      capitan: trim(form.capitan),
      jugadores: form.jugadores
        .split('\n')
        .map((line) => line.trim())
        .filter(Boolean),
      telefono: trim(form.telefono),
      email: trim(form.email),
      observaciones: trim(form.observaciones),
      aceptaRgpd: form.aceptaRgpd,
      quiereConfirmacion: form.quiereConfirmacion,
      honeypot: form.website,
    }
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setSubmitError('')

    const nextErrors = validate()
    setErrors(nextErrors)

    if (Object.keys(nextErrors).length) {
      return
    }

    setSubmitting(true)

    try {
      await sendInscriptionEmail(buildPayload())
      setSuccess(true)
      setForm(emptyForm)
    } catch (currentError) {
      console.error('Error enviando inscripcion:', currentError)
      setSubmitError('No se ha podido enviar la inscripcion. Intentalo de nuevo en unos minutos.')
    } finally {
      setSubmitting(false)
    }
  }

  if (success) {
    return (
      <section className="inscription-page">
        <div className="inscription-success">
          <CheckCircle2 size={36} aria-hidden="true" />
          <div>
            <p className="eyebrow">Inscripcion recibida</p>
            <h2>Gracias, hemos enviado tu solicitud</h2>
            <p>
              El organizador recibira tus datos por email y revisara la inscripcion. Si hace falta confirmar algo,
              contactara contigo.
            </p>
            <button type="button" className="secondary-button" onClick={() => setSuccess(false)}>
              Enviar otra inscripcion
            </button>
          </div>
        </div>
      </section>
    )
  }

  return (
    <section className="inscription-page">
      <div className="section-heading">
        <p className="eyebrow">Inscripciones</p>
        <h2>Solicita tu plaza en el torneo</h2>
      </div>

      {loading && <p className="info-state">Cargando categorias...</p>}
      {error && <p className="error-state">{error.message}</p>}

      <form className="inscription-form" onSubmit={handleSubmit} noValidate>
        <label htmlFor="categoriaId">
          Categoria
          <select
            id="categoriaId"
            value={form.categoriaId}
            onChange={(event) => updateCategoria(event.target.value)}
            aria-invalid={Boolean(errors.categoriaId)}
            aria-describedby={getFieldError(errors, 'categoriaId')}
            required
          >
            <option value="">Selecciona categoria</option>
            {categorias.map((categoria) => (
              <option key={categoria.id} value={categoria.id}>
                {categoria.nombre} · {categoria.nivel} · {modalidadLabels[normalizeModalidad(categoria.modalidad)]}
              </option>
            ))}
          </select>
          {errors.categoriaId && <span id="categoriaId-error" className="field-error">{errors.categoriaId}</span>}
        </label>

        {form.categoriaId && (
          <p className="form-full info-state">Modalidad seleccionada: {modalidadLabels[modalidad]}</p>
        )}

        {modalidad === 'equipo' && form.categoriaId ? (
          <>
            <label htmlFor="nombreEquipo">
              Nombre del equipo
              <input
                id="nombreEquipo"
                value={form.nombreEquipo}
                onChange={(event) => updateField('nombreEquipo', event.target.value)}
                aria-invalid={Boolean(errors.nombreEquipo)}
                aria-describedby={getFieldError(errors, 'nombreEquipo')}
                required
              />
              {errors.nombreEquipo && <span id="nombreEquipo-error" className="field-error">{errors.nombreEquipo}</span>}
            </label>
            <label htmlFor="capitan">
              Capitan
              <input
                id="capitan"
                value={form.capitan}
                onChange={(event) => updateField('capitan', event.target.value)}
                aria-invalid={Boolean(errors.capitan)}
                aria-describedby={getFieldError(errors, 'capitan')}
                required
              />
              {errors.capitan && <span id="capitan-error" className="field-error">{errors.capitan}</span>}
            </label>
            <label className="form-full" htmlFor="jugadores">
              Lista de jugadores
              <textarea
                id="jugadores"
                value={form.jugadores}
                onChange={(event) => updateField('jugadores', event.target.value)}
                placeholder="Un jugador por linea"
              />
            </label>
          </>
        ) : null}

        {(modalidad === 'pareja' || modalidad === 'individual') && form.categoriaId ? (
          <>
            <label htmlFor="jugador1">
              {modalidad === 'individual' ? 'Participante' : 'Jugador 1'}
              <input
                id="jugador1"
                value={form.jugador1}
                onChange={(event) => updateField('jugador1', event.target.value)}
                aria-invalid={Boolean(errors.jugador1)}
                aria-describedby={getFieldError(errors, 'jugador1')}
                required
              />
              {errors.jugador1 && <span id="jugador1-error" className="field-error">{errors.jugador1}</span>}
            </label>
            {modalidad === 'pareja' && (
              <label htmlFor="jugador2">
                Jugador 2
                <input
                  id="jugador2"
                  value={form.jugador2}
                  onChange={(event) => updateField('jugador2', event.target.value)}
                  aria-invalid={Boolean(errors.jugador2)}
                  aria-describedby={getFieldError(errors, 'jugador2')}
                  required
                />
                {errors.jugador2 && <span id="jugador2-error" className="field-error">{errors.jugador2}</span>}
              </label>
            )}
          </>
        ) : null}

        <label htmlFor="telefono">
          Telefono de contacto
          <input
            id="telefono"
            type="tel"
            inputMode="tel"
            value={form.telefono}
            onChange={(event) => updateField('telefono', event.target.value)}
            aria-invalid={Boolean(errors.telefono)}
            aria-describedby={getFieldError(errors, 'telefono')}
            required
          />
          {errors.telefono && <span id="telefono-error" className="field-error">{errors.telefono}</span>}
        </label>

        <label htmlFor="email">
          Email de contacto
          <input
            id="email"
            type="email"
            autoComplete="email"
            value={form.email}
            onChange={(event) => updateField('email', event.target.value)}
            aria-invalid={Boolean(errors.email)}
            aria-describedby={getFieldError(errors, 'email')}
            required
          />
          {errors.email && <span id="email-error" className="field-error">{errors.email}</span>}
        </label>

        <label className="form-full" htmlFor="observaciones">
          Observaciones
          <textarea
            id="observaciones"
            value={form.observaciones}
            onChange={(event) => updateField('observaciones', event.target.value)}
          />
        </label>

        <label className="sr-only" htmlFor="website">
          Website
          <input
            id="website"
            tabIndex={-1}
            autoComplete="off"
            value={form.website}
            onChange={(event) => updateField('website', event.target.value)}
          />
        </label>

        <label className="check-field form-full" htmlFor="aceptaRgpd">
          <input
            id="aceptaRgpd"
            type="checkbox"
            checked={form.aceptaRgpd}
            onChange={(event) => updateField('aceptaRgpd', event.target.checked)}
            aria-invalid={Boolean(errors.aceptaRgpd)}
            aria-describedby={getFieldError(errors, 'aceptaRgpd')}
          />
          Acepto que mis datos se usen para gestionar esta solicitud de inscripcion.
          {errors.aceptaRgpd && <span id="aceptaRgpd-error" className="field-error">{errors.aceptaRgpd}</span>}
        </label>

        <label className="check-field form-full" htmlFor="quiereConfirmacion">
          <input
            id="quiereConfirmacion"
            type="checkbox"
            checked={form.quiereConfirmacion}
            onChange={(event) => updateField('quiereConfirmacion', event.target.checked)}
          />
          Quiero recibir confirmacion por email
        </label>

        {submitError && <p className="error-state form-full">{submitError}</p>}

        <div className="form-actions form-full">
          <button type="submit" className="primary-button" disabled={submitting || loading}>
            <Send size={15} aria-hidden="true" />
            {submitting ? 'Enviando...' : 'Enviar inscripcion'}
          </button>
        </div>
      </form>
    </section>
  )
}

export default Inscripcion
