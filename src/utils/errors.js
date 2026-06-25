export function formatActionError(err) {
  if (import.meta.env.DEV) return err.message
  console.error(err)
  return 'No se pudo completar la acción. Inténtalo de nuevo.'
}
