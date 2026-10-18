/**
 * utils/roster.js
 *
 * The roster as a file: write the characters you have typed in, read them back
 * after a refresh.
 *
 * This replaced a template you filled in by hand. That template kept growing a
 * column every time the app learned something - a head size, six proportions -
 * and every column was one more thing to get wrong in a spreadsheet. Since the
 * app writes this file and the app reads it, it can carry whatever it needs and
 * you never type any of it.
 *
 * Measurements are written in millimetres whatever the screen is showing, so a
 * file saved in centimetres and loaded later cannot change size.
 */

import { DEFAULT_HEAD_SIZE, HEAD_SIZES, PRIORITIES_BY_GENDER, PROPORTIONS } from './matching'
import {
  DEFAULT_WORKING_SCALE,
  SCALE_STEPS,
  WORKING_SCALES,
  parseScaleName,
  scaleName,
} from './scaleUtils'
import { parseCsv, toCsvRow } from './csv'

const MEASURES = ['height', 'bust', 'waist', 'hips', ...PROPORTIONS.map(p => p.key)]

const LABEL = {
  height: 'Height', bust: 'Bust', waist: 'Waist', hips: 'Hips',
  ...Object.fromEntries(PROPORTIONS.map(p => [p.key, p.label])),
}

export const ROSTER_HEADERS = [
  'Character Name',
  ...MEASURES.map(k => `${LABEL[k]} (mm)`),
  'Scale',
  'Head Sculpt (mm)',
  'Priority',
  'Sort',
]

/**
 * Entries out.
 *
 * `toMM` converts whatever is in the boxes; a blank measurement stays blank
 * rather than becoming a zero, because zero is a measurement and absent is not.
 */
export function rosterToCsv(entries, unit, toMM) {
  const rows = [ROSTER_HEADERS]
  for (const e of entries) {
    const num = (k) => {
      const n = parseFloat(e.values[k])
      return Number.isFinite(n) && n > 0 ? parseFloat(toMM(n, unit).toFixed(2)) : ''
    }
    rows.push([
      e.name.trim(),
      ...MEASURES.map(num),
      scaleName(e.workingScale),
      e.headSize,
      e.priority,
      e.sort,
    ])
  }
  return rows.map(toCsvRow).join('\n')
}

const near = (a, b) => Math.abs(a - b) < 1 / (SCALE_STEPS * 2)

/**
 * Entries back in.
 *
 * Forgiving on purpose: a row that cannot be read is skipped and named rather
 * than failing the whole file, and anything unreadable in a single field falls
 * back to a sane default. This is a save file the app wrote - if it is broken,
 * something odd happened, and losing nine good characters over one bad cell
 * would be the wrong trade.
 */
export function rosterFromCsv(text, gender = 'Female', fromMM, unit = 'mm') {
  const rows = parseCsv(text)
  const errors = []
  if (!rows.length) return { entries: [], errors: ['That file is empty.'] }

  const header = rows[0].map(h => h.trim())
  if (!header.includes('Character Name')) {
    return { entries: [], errors: ['That does not look like a saved roster — no Character Name column.'] }
  }
  const at = name => header.indexOf(name)
  const priorities = PRIORITIES_BY_GENDER[gender] ?? PRIORITIES_BY_GENDER.Female

  const entries = []
  rows.slice(1).forEach((r, i) => {
    const name = (r[at('Character Name')] || '').trim()
    if (!name && MEASURES.every(k => !(r[at(`${LABEL[k]} (mm)`)] || '').trim())) return  // blank row

    const values = {}
    for (const k of MEASURES) {
      const raw = (r[at(`${LABEL[k]} (mm)`)] || '').trim()
      const n = Number(raw.replace(/,/g, ''))
      values[k] = raw !== '' && Number.isFinite(n) && n > 0
        ? String(parseFloat(fromMM(n, unit).toFixed(4)))
        : ''
    }

    const scaleRaw = (r[at('Scale')] || '').trim()
    const parsed = parseScaleName(scaleRaw)
    const scale = parsed != null ? WORKING_SCALES.find(v => near(v, parsed)) : null
    if (scaleRaw && scale == null) errors.push(`Row ${i + 2} (${name || 'unnamed'}): scale "${scaleRaw}" is not one the app offers — using ${scaleName(DEFAULT_WORKING_SCALE)}.`)

    const headRaw = parseFloat(r[at('Head Sculpt (mm)')])
    const head = HEAD_SIZES.includes(headRaw) ? headRaw : DEFAULT_HEAD_SIZE

    const priRaw = (r[at('Priority')] || '').trim().toLowerCase()
    const priority = priorities.includes(priRaw) ? priRaw : priorities[0]

    const sortRaw = (r[at('Sort')] || '').trim().toLowerCase()

    entries.push({
      name,
      values,
      workingScale: scale ?? DEFAULT_WORKING_SCALE,
      headSize: head,
      priority,
      sort: sortRaw === 'greatest' ? 'greatest' : 'least',
    })
  })

  if (!entries.length) errors.push('No characters in that file.')
  return { entries, errors }
}
