/**
 * utils/batch.js
 *
 * Run a whole roster at once: upload a CSV of characters, get one back with
 * every result in it.
 *
 * Each row is independent - its own Scale Reference Selector, its own
 * Measurement Priority Field, its own number of results - so one character can
 * be compared at 1:6 and the next at 1:5 3/4 in the same file.
 *
 * Measurements are MILLIMETRES, always. There is no unit column and no
 * detection: a value that looks like centimetres is rejected with a message
 * saying so. Silently reinterpreting someone's numbers is how you end up
 * confidently wrong about a body you then go and buy.
 */

import { BODIES } from '../data/bodies'
import { buildExportRows, compareBodies, PRIORITIES } from './matching'
import { SCALE_STEPS, WORKING_SCALES, scaleName } from './scaleUtils'

export const TEMPLATE_HEADERS = [
  'Character Name',
  'Scale Reference Selector',
  'Height',
  'Bust',
  'Waist',
  'Hips',
  'Measurement Priority Field',
  'Number of Results Requested',
]

const TEMPLATE_HINTS = [
  'Required',
  'Required (must match available scale in the app)',
  'Required (in mm)',
  'Required (in mm)',
  'Required (in mm)',
  'Required (in mm)',
  'Required (Height, Bust, Waist, Hips)',
  'Required (3, 5, or All)',
]

/** Plausible 1:1 human measurements in mm. Outside these, something's wrong. */
const BANDS = {
  height: [500, 3000],
  bust: [200, 2000],
  waist: [200, 2000],
  hips: [200, 2000],
}

// ---------------------------------------------------------------------------
// CSV in
// ---------------------------------------------------------------------------

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

/** "1:5 3/4" -> 5.75. Returns null if it isn't a scale. */
export function parseScaleName(text) {
  const m = /^1\s*:\s*(\d+)(?:\s+(\d+)\s*\/\s*(\d+))?$/.exec(String(text ?? '').trim())
  if (!m) return null
  const whole = Number(m[1])
  const frac = m[2] ? Number(m[2]) / Number(m[3]) : 0
  if (m[2] && Number(m[3]) === 0) return null
  return whole + frac
}

const near = (a, b) => Math.abs(a - b) < 1 / (SCALE_STEPS * 2)

/**
 * Turn an uploaded file into character jobs, plus a list of what was wrong.
 *
 * Bad rows are named and skipped rather than aborting the run - one typo in a
 * roster of thirty shouldn't cost you the other twenty-nine.
 */
export function parseCharacterCsv(text) {
  const rows = parseCsv(text)
  const jobs = []
  const errors = []
  // Unit mistakes are treated differently from everything else. A stray typo in
  // one row shouldn't cost you the other twenty-nine, but centimetres in one row
  // almost always means centimetres in all of them - so that aborts the whole
  // upload rather than handing back a partial file that looks complete.
  const unitErrors = []

  if (!rows.length) return { jobs, errors: ['The file is empty.'] }

  const header = rows[0].map(h => h.trim())
  const missing = TEMPLATE_HEADERS.filter(h => !header.includes(h))
  if (missing.length) {
    return {
      jobs: [],
      errors: [`The file is missing these columns: ${missing.join(', ')}. ` +
               `Download the template and use its header row.`],
    }
  }
  const at = name => header.indexOf(name)

  let body = rows.slice(1)
  // The template ships with a row of "Required (…)" hints. Skip it rather than
  // making people remember to delete it.
  if (body.length && /^required\b/i.test((body[0][at('Character Name')] || '').trim())) {
    body = body.slice(1)
  }

  body.forEach((r, i) => {
    const lineNo = i + 2
    const name = (r[at('Character Name')] || '').trim()
    const label = name ? `Row ${lineNo} (${name})` : `Row ${lineNo}`
    const rowErrors = []

    if (!name) rowErrors.push(`${label}: Character Name is required.`)

    // --- measurements, millimetres only ---
    const measures = {}
    for (const key of ['Height', 'Bust', 'Waist', 'Hips']) {
      const raw = (r[at(key)] || '').trim()
      const field = key.toLowerCase()
      if (!raw) { rowErrors.push(`${label}: ${key} is required.`); continue }
      const n = Number(raw.replace(/,/g, ''))
      if (!Number.isFinite(n) || n <= 0) {
        rowErrors.push(`${label}: ${key} "${raw}" is not a number.`)
        continue
      }
      const [lo, hi] = BANDS[field]
      if (n < lo) {
        // Almost always a centimetre value that wandered in. No conversion, no
        // guessing - say what's wrong and what the number should have been.
        unitErrors.push(
          `${label}: ${key} ${raw} — measurements must be in millimetres. ` +
          `Did you mean ${Math.round(n * 10)}?`
        )
        continue
      }
      if (n > hi) {
        unitErrors.push(`${label}: ${key} ${raw} is too large to be a real-world measurement in millimetres.`)
        continue
      }
      measures[field] = n
    }

    // --- scale ---
    const scaleRaw = (r[at('Scale Reference Selector')] || '').trim()
    let workingScale = null
    if (!scaleRaw) rowErrors.push(`${label}: Scale Reference Selector is required, e.g. 1:6.`)
    else {
      const parsed = parseScaleName(scaleRaw)
      if (parsed == null) {
        rowErrors.push(`${label}: "${scaleRaw}" is not a scale. Use the form 1:6 or 1:5 3/4.`)
      } else {
        const match = WORKING_SCALES.find(s => near(s, parsed))
        if (!match) {
          rowErrors.push(
            `${label}: ${scaleRaw} is outside the scales the app offers ` +
            `(${scaleName(WORKING_SCALES[0])} to ${scaleName(WORKING_SCALES[WORKING_SCALES.length - 1])}).`
          )
        } else workingScale = match
      }
    }

    // --- priority ---
    const priorityRaw = (r[at('Measurement Priority Field')] || '').trim().toLowerCase()
    let priority = null
    if (!priorityRaw) rowErrors.push(`${label}: Measurement Priority Field is required.`)
    else if (!PRIORITIES.includes(priorityRaw)) {
      rowErrors.push(`${label}: "${r[at('Measurement Priority Field')].trim()}" is not one of Height, Bust, Waist, Hips.`)
    } else priority = priorityRaw

    // --- how many results ---
    const countRaw = (r[at('Number of Results Requested')] || '').trim().toLowerCase()
    let count
    if (!countRaw) rowErrors.push(`${label}: Number of Results Requested is required.`)
    else if (countRaw === 'all') count = null
    else if (countRaw === '3' || countRaw === '5') count = Number(countRaw)
    else rowErrors.push(`${label}: "${countRaw}" is not 3, 5 or All.`)

    if (rowErrors.length) { errors.push(...rowErrors); return }

    jobs.push({
      character: { name, ...measures },
      workingScale,
      priority,
      count,
      line: lineNo,
    })
  })

  if (!body.length) errors.push('The file has a header but no character rows.')

  if (unitErrors.length) {
    return {
      jobs: [],
      errors: [
        `Upload stopped: ${unitErrors.length} measurement${unitErrors.length === 1 ? '' : 's'} ` +
        `${unitErrors.length === 1 ? 'is' : 'are'} not in millimetres. ` +
        `Nothing was processed — fix these and upload again.`,
        ...unitErrors,
        ...errors,
      ],
      fatal: true,
    }
  }

  return { jobs, errors, fatal: false }
}

// ---------------------------------------------------------------------------
// Run + CSV out
// ---------------------------------------------------------------------------

/**
 * One block per character, each identical to what a single manual export
 * produces - header, the character at 1:1, the character at their chosen scale,
 * then their results.
 *
 * An earlier version was one flat table with a Character column. It was neater
 * to pivot but buried the scaled measurements in the middle of thirty-odd
 * columns, where nobody found them. Reusing buildExportRows means the two
 * exports can't drift apart: change the manual layout and the batch follows.
 */
export function runBatch(jobs, bodies = BODIES) {
  const rows = [
    ['Scale Body Finder - batch results'],
    ['Characters', jobs.length],
    [],
  ]
  let characters = 0
  let resultRows = 0

  for (const job of jobs) {
    const { character, workingScale, priority, count } = job
    const opts = { workingScale, priority, sort: 'least', count, bodies }
    const outcome = compareBodies(character, opts)
    if (!outcome.results.length) continue

    if (characters) rows.push([], [])          // blank line between blocks
    characters++
    resultRows += outcome.results.length
    rows.push(...buildExportRows(character, opts, outcome))
  }

  return { rows, characters, resultRows }
}

/** The blank template, hint row included - the importer skips it on the way back in. */
export function templateCsv() {
  return [TEMPLATE_HEADERS, TEMPLATE_HINTS]
    .map(r => r.map(c => (/[",\n]/.test(c) ? `"${c.replace(/"/g, '""')}"` : c)).join(','))
    .join('\n')
}
