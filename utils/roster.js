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
  'Planned Body',
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
      e.plannedBody || '',
    ])
  }
  return rows.map(toCsvRow).join('\n')
}

/**
 * The example row's name, and the only thing that marks it.
 *
 * The template ships one filled-in row so the layout is obvious - a scale
 * written 1:5 13/16, a priority written bust. That row is skipped on every
 * upload, so leaving it in costs nothing. Type a real character over it and
 * it stops being the example and loads like any other row.
 *
 * The app's own saved rosters never contain it.
 */
export const ROSTER_EXAMPLE_NAME = 'Example (ignored on upload)'

const isExample = (name) => name.trim().toLowerCase() === ROSTER_EXAMPLE_NAME.toLowerCase()

// Kasumi, at the scale she actually sits at on an S07C. The same numbers as
// her row in data/characters.csv - tools/verify-matching.js holds them to it.
const EXAMPLE = {
  height: 1580, bust: 890, waist: 540, hips: 850,
  breastHeight: 148.59, breastWidth: 127, breastDepth: 117,
  waistWidth: 212, hipWidth: 326, shoulder: 351,
}

/**
 * A blank roster to fill in by hand: the same columns the app saves, plus the
 * example row. Built from ROSTER_HEADERS, so it cannot fall behind them the
 * way the old hand-made character template did.
 */
export function rosterTemplateCsv() {
  return [
    ROSTER_HEADERS,
    [ROSTER_EXAMPLE_NAME, ...MEASURES.map(k => EXAMPLE[k] ?? ''), '1:5 13/16', DEFAULT_HEAD_SIZE, 'bust', 'least', 'S07C'],
  ].map(toCsvRow).join('\n')
}

export const ROSTER_TEMPLATE_FILENAME = 'Scale_Body_Finder_Roster_Template.csv'

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
  let examples = 0
  rows.slice(1).forEach((r, i) => {
    const name = (r[at('Character Name')] || '').trim()
    if (isExample(name)) { examples++; return }
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
      // As written. Whether the catalogue has it is the caller's to check -
      // this file knows nothing about bodies. Rosters saved before the rename
      // call the column Chosen Body, and still load.
      plannedBody: (r[at('Planned Body') >= 0 ? at('Planned Body') : at('Chosen Body')] || '').trim() || null,
    })
  })

  if (!entries.length) {
    errors.push(examples
      ? 'Only the example row is in that file - add your characters on the rows below it.'
      : 'No characters in that file.')
  }
  return { entries, errors }
}
