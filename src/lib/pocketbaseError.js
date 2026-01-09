const getPocketBaseResponse = (error) => {
  // PocketBase JS SDK v0.26 uses `response`; older versions used `data`.
  return error?.response || error?.data || null
}

export function getPocketBaseErrorMessage(error) {
  const response = getPocketBaseResponse(error)
  return response?.message || error?.message || 'Unknown error'
}

export function getPocketBaseValidationErrors(error) {
  const response = getPocketBaseResponse(error)
  const data = response?.data
  if (!data || typeof data !== 'object') return null
  return data
}

export function formatPocketBaseValidationErrors(error) {
  const validation = getPocketBaseValidationErrors(error)
  if (!validation) return ''

  return Object.entries(validation)
    .map(([field, detail]) => {
      if (!detail) return field
      if (typeof detail === 'string') return `${field}: ${detail}`
      const message = detail?.message || detail?.code
      return message ? `${field}: ${message}` : field
    })
    .join(', ')
}

