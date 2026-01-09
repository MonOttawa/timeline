export function escapePocketBaseFilterValue(value) {
  return String(value ?? '')
    .replace(/\\/g, '\\\\')
    .replace(/"/g, '\\"')
    .replace(/\r/g, '\\r')
    .replace(/\n/g, '\\n')
    .replace(/\t/g, '\\t')
}

export function pbFilterString(value) {
  return `"${escapePocketBaseFilterValue(value)}"`
}

