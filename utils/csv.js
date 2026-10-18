/**
 * utils/csv.js
 *
 * Reading a CSV, carefully enough for files that come back out of a
 * spreadsheet.
 *
 * Quoted fields matter here: a body's Notes can contain a comma, and Excel
 * doubles a quote inside a quoted field rather than escaping it. A split on
 * commas gets both of those wrong, and gets them wrong quietly - which is how
 * a note once came back as half a sentence.
 */

/** Rows of cells. Blank lines are dropped. */
export function parseCsv(text) {
  const rows = []
  let row = [], field = '', inQuotes = false
  for (let i = 0; i < text.length; i++) {
    const c = text[i]
    if (inQuotes) {
      if (c === '"') {
        if (text[i + 1] === '"') { field += '"'; i++ } else inQuotes = false
      } else field += c
    } else if (c === '"') inQuotes = true
    else if (c === ',') { row.push(field); field = '' }
    else if (c === '\r') { /* ignore */ }
    else if (c === '\n') { row.push(field); field = ''; rows.push(row); row = [] }
    else field += c
  }
  if (field !== '' || row.length) { row.push(field); rows.push(row) }
  return rows.filter(r => r.some(v => v.trim() !== ''))
}

/** One row, quoting only what needs it. */
export function toCsvRow(cells) {
  return cells
    .map(v => (/[",\n]/.test(String(v ?? '')) ? `"${String(v).replace(/"/g, '""')}"` : String(v ?? '')))
    .join(',')
}
