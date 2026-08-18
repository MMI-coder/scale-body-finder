/**
 * utils/matching.js
 *
 * Everything is compared at ONE scale - the working scale, 1:6 by default.
 *
 * An earlier version anchored each body on the priority measurement, deriving a
 * different scale for every body so that measurement always matched exactly.
 * That turned out to hide the thing the app exists to show: forcing the bust to
 * match absorbs the entire size difference into the scale, so a body 17mm too
 * small scores about the same as one that's 0.3mm out. Comparing every body
 * against the character at a single scale makes cards comparable to each other
 * and puts the real gap on screen.
 *
 * "Closest scale" survives as a per-body readout - the scale at which that
 * body's priority measurement would land exactly. It's what you'd build props
 * and clothing to. It no longer decides anything.
 */

import { BODIES } from '../data/bodies'
import { DEFAULT_WORKING_SCALE, scaleInRange, scaleName, snapDivisor } from './scaleUtils'

export const PRIORITIES = ['height', 'bust', 'waist', 'hips']

/** Everything that counts toward overall fit. Height included, by request. */
export const SCORED = ['height', 'bust', 'waist', 'hips']

export const SORTS = ['least', 'greatest']

/** The two catalogues. A search only ever looks in one of them. */
export const BODY_TYPES = ['Seamless', 'Jointed']
export const DEFAULT_BODY_TYPE = 'Seamless'

/**
 * Which chest piece a modular body would wear to best match a target bust.
 *
 * Modular bodies ship a frame plus a set of chest pieces, so their bust isn't a
 * property of the body - it's a choice. This picks the closest, and the card
 * lets you cycle to the others afterwards. Selection always uses this one, so
 * cycling never reorders results.
 *
 * A body with a fixed bust just returns it, with no piece named.
 */
export function pickBustPiece(body, target) {
  if (!body.bustOptions || !body.bustOptions.length) {
    return { bust: body.bust, piece: null, options: null }
  }
  const best = body.bustOptions.reduce((a, b) =>
    Math.abs(b.bust - target) < Math.abs(a.bust - target) ? b : a)
  return { bust: best.bust, piece: best.piece, options: body.bustOptions }
}

/** A character's measurements at a given scale divisor. */
export function scaleCharacter(character, divisor) {
  const out = {}
  for (const k of ['height', 'bust', 'waist', 'hips']) {
    out[k] = character[k] == null ? null : character[k] / divisor
  }
  return out
}

/** The character at true 1:6, for the reference panel. */
export function atSixth(character) {
  return scaleCharacter(character, 6)
}

/** The height range a body can actually be posed to, for its default head. */
export function heightRange(body) {
  if (body.heightsByHead) {
    const r = body.heightsByHead[body.headSize]
    if (r) return { min: r.min, max: r.max }
  }
  if (body.manufacturerHeight != null) {
    return { min: body.manufacturerHeight, max: body.manufacturerHeight }
  }
  return null
}

/**
 * The height this body would sit at when trying to match a target.
 *
 * The hip joint gives real travel, so a body whose range contains the target
 * can simply be posed to it - that's a match, not a near miss. Outside the
 * range, the body is pinned to whichever end is closest and the shortfall is
 * what's left over.
 */
export function heightAgainst(body, targetHeight) {
  const r = heightRange(body)
  if (!r || targetHeight == null) return null
  if (targetHeight < r.min) return r.min
  if (targetHeight > r.max) return r.max
  return targetHeight
}

/** The shortest height genuinely known for a body. Used for its closest scale. */
export function heightAnchor(body) {
  const r = heightRange(body)
  return r ? r.min : null
}

/**
 * Compare every body against a character at one scale.
 *
 * @param character     measurements in mm: { height, bust, waist, hips }
 * @param opts.workingScale  scale divisor, e.g. 6 for 1:6
 * @param opts.priority      'height' | 'bust' | 'waist' | 'hips' - what to sort on
 * @param opts.sort          'least' | 'greatest' difference in that measurement
 * @param opts.count         how many to return, or null for all
 */
export function compareBodies(character, opts = {}) {
  const {
    workingScale = DEFAULT_WORKING_SCALE,
    priority = 'bust',
    sort = 'least',
    count = null,
    bodyType = DEFAULT_BODY_TYPE,
    bodies = BODIES,
  } = opts

  if (!PRIORITIES.includes(priority)) throw new Error(`bad priority: ${priority}`)

  const scaled = scaleCharacter(character, workingScale)
  const usable = SCORED.filter(k => scaled[k] != null)
  if (!usable.length) return { results: [], scaled, considered: 0, excluded: [] }

  const results = []
  const excluded = []

  // Seamless and jointed are separate catalogues, never mixed in one list.
  const pool = bodyType ? bodies.filter(b => (b.bodyType || 'Seamless') === bodyType) : bodies

  for (const body of pool) {
    const chosen = pickBustPiece(body, scaled.bust)
    if (chosen.bust == null || ['waist', 'hips'].some(k => body[k] == null)) {
      excluded.push({ body, reason: 'incomplete measurements' })
      continue
    }

    const deltas = {}
    let totalOff = 0
    for (const k of usable) {
      const bodyVal = k === 'height' ? heightAgainst(body, scaled.height)
                    : k === 'bust'   ? chosen.bust
                    : body[k]
      if (bodyVal == null) { deltas[k] = null; continue }
      deltas[k] = bodyVal - scaled[k]     // positive = body is larger
      totalOff += Math.abs(deltas[k])
    }

    // A body with no figure for the measurement being sorted on can't be placed
    // in that ordering at all. Sorting it to one end would be a lie in both
    // directions - last under "least", first under "greatest" - so it drops out
    // of this list entirely and still appears under every other priority.
    if (deltas[priority] == null) {
      excluded.push({ body, reason: `no ${priority} measurement` })
      continue
    }

    // Closest scale: where this body's priority measurement would land exactly.
    // Reference only - it doesn't affect the comparison above.
    const bodyPriority = priority === 'height' ? heightAnchor(body)
                       : priority === 'bust'   ? chosen.bust
                       : body[priority]
    const charPriority = character[priority]
    let closest = null
    if (bodyPriority != null && charPriority) {
      const divisor = charPriority / bodyPriority
      closest = {
        divisor,
        snapped: snapDivisor(divisor),
        name: scaleName(divisor),
        multiplier: 1 / divisor,
        inRange: scaleInRange(divisor),
      }
    }

    results.push({
      body,
      priority,
      workingScale,
      scaled,                                   // character at the working scale
      deltas,                                   // body minus that, per measurement
      totalOff,                                 // sum of |delta| across all scored
      heightUsed: heightAgainst(body, scaled.height),
      heightRange: heightRange(body),
      bust: chosen.bust,            // the chosen piece's measurement
      bustPiece: chosen.piece,      // null on a fixed-bust body
      bustOptions: chosen.options,  // null on a fixed-bust body
      closest,
    })
  }

  const key = m => (m.deltas[priority] == null ? Infinity : Math.abs(m.deltas[priority]))
  results.sort((a, b) => (sort === 'greatest' ? key(b) - key(a) : key(a) - key(b)))

  return {
    results: count ? results.slice(0, count) : results,
    scaled,
    considered: results.length,
    excluded,
  }
}

/** Rows for the CSV export - mirrors what's on screen. */
export function buildExportRows(character, opts, outcome) {
  const { workingScale, priority, sort, bodyType = DEFAULT_BODY_TYPE } = opts
  // Bust Piece only means something on a modular body, so it only appears in the
  // jointed export. The seamless file's shape is a contract - another tool reads
  // it - and must not change.
  const modular = bodyType === 'Jointed'
  const mm = v => (v == null ? '' : parseFloat(v.toFixed(2)))
  const cap = w => (w ? w.charAt(0).toUpperCase() + w.slice(1) : w)
  const s = outcome.scaled

  const rows = [
    ['Scale Body Finder - results'],
    ['Character', character.name || '(unnamed)'],
    // Every label below is a term the app also uses on screen, capitalised the
    // same way. A spreadsheet opened a week later should read like the page it
    // came from.
    ...(modular ? [['Body Type', bodyType]] : []),
    ['Scale Reference Selector', scaleName(workingScale)],
    ['Measurement Priority Field', cap(priority)],
    ['Sort by', `${cap(sort)} difference in ${cap(priority)}`],
    [],
    ['Character Measurements (1:1)', 'Height', mm(character.height), 'Bust', mm(character.bust), 'Waist', mm(character.waist), 'Hips', mm(character.hips)],
    [`Character Measurements (${scaleName(workingScale)})`, 'Height', mm(s.height), 'Bust', mm(s.bust), 'Waist', mm(s.waist), 'Hips', mm(s.hips)],
    [],
    [
      'Manufacturer', 'Product Name', 'Material', 'Actual Body Scale', 'Scale Multiplier',
      'Height - Body Measurement (mm)', 'Height - Difference (mm)',
      'Height Range Low (mm)', 'Height Range High (mm)',
      ...(modular ? ['Bust Piece'] : []),
      'Bust - Body Measurement (mm)', 'Bust - Difference (mm)',
      'Waist - Body Measurement (mm)', 'Waist - Difference (mm)',
      'Hips - Body Measurement (mm)', 'Hips - Difference (mm)',
      'Underbust (mm)', 'Shoulder Width (mm)', 'Arm Length (mm)', 'Leg Inseam (mm)',
      'Feet Type', 'Notes',
    ],
  ]

  for (const r of outcome.results) {
    const b = r.body
    rows.push([
      b.manufacturer || '', b.name || b.code, b.material || '',
      r.closest ? r.closest.name : '',
      r.closest ? parseFloat(r.closest.multiplier.toFixed(5)) : '',
      mm(r.heightUsed), mm(r.deltas.height),
      mm(r.heightRange?.min), mm(r.heightRange?.max),
      ...(modular ? [r.bustPiece || ''] : []),
      mm(r.bust ?? b.bust), mm(r.deltas.bust),
      mm(b.waist), mm(r.deltas.waist),
      mm(b.hips), mm(r.deltas.hips),
      mm(b.underbust), mm(b.shoulder), mm(b.arm), mm(b.inseam),
      b.feet || '', b.notes || '',
    ])
  }
  return rows
}

export function rowsToCsv(rows) {
  return rows
    .map(r => r.map(cell => `"${String(cell ?? '').replace(/"/g, '""')}"`).join(','))
    .join('\n')
}
