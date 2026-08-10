/**
 * utils/matching.js
 *
 * The matching engine.
 *
 * The idea that makes this work: scale is an OUTPUT, not an input. You don't
 * shrink a character to 1:6 and look for something that fits - you ask what
 * scale each body would have to be for it to fit, and report that.
 *
 * The chosen priority is the anchor:
 *
 *     scale = body[priority] / character[priority]
 *
 * At that scale the priority measurement matches exactly by construction, and
 * the other two are the test of whether it holds up. Closeness is just how far
 * those two land from the body.
 *
 * Selection is not a ranking. It picks which few bodies to put in front of the
 * user; it does not claim one is better than another. Hand-measured bodies
 * carry +/-1mm, which is wider than most of the gaps involved.
 */

import { BODIES } from '../data/bodies'
import { SIXTH, scaleInRange, scaleName, snapDivisor } from './scaleUtils'

export const PRIORITIES = ['bust', 'waist', 'hips', 'height']

/** The measurements that decide closeness. Height is never one of them. */
export const SCORED = ['bust', 'waist', 'hips']

/** Shown, but never used for selection. */
export const DISPLAY_ONLY = ['underbust', 'shoulder', 'arm', 'inseam']

/**
 * The height a body is anchored to: its shortest known figure.
 *
 * For a body measured with a custom head that's the minimum for whichever head
 * sculpt is in play - the hip joint can always be extended, never shortened
 * past this. For a manufacturer-head body it's their single published figure,
 * which is the only height genuinely known for it.
 *
 * Returns null for a body with no height at all, which the matcher skips.
 */
export function heightAnchor(body, headSize = null) {
  if (body.heightsByHead) {
    const key = headSize ?? body.headSize
    const entry = body.heightsByHead[key] ?? body.heightsByHead[body.headSize]
    return entry ? entry.min : null
  }
  return body.manufacturerHeight ?? null
}

/**
 * A character's measurements at true 1:6. This is the reference figure the
 * user is given - it is not a target the app checks anything against.
 */
export function atSixth(character) {
  return scaleCharacter(character, SIXTH)
}

/** A character's measurements at an arbitrary multiplier. */
export function scaleCharacter(character, multiplier) {
  const out = {}
  for (const k of ['height', 'bust', 'waist', 'hips']) {
    out[k] = character[k] == null ? null : character[k] * multiplier
  }
  return out
}

/**
 * Find the bodies closest to a character.
 *
 * @param character  measurements in mm: { height, bust, waist, hips }
 * @param priority   'bust' | 'waist' | 'hips' - the anchor
 * @param count      how many to return (3 or 5)
 * @param bodies     defaults to the bundled set
 * @returns array of matches, closest first, with no rank attached
 */
export function findMatches(character, priority, count = 3, bodies = BODIES) {
  if (!PRIORITIES.includes(priority)) {
    throw new Error(`priority must be one of ${PRIORITIES.join(', ')}`)
  }

  const charAnchor = character[priority]
  if (!charAnchor) return { matches: [], excluded: [], considered: 0 }

  // Anchoring on height leaves all three of bust/waist/hips free to miss, so
  // they all count toward closeness. Anchoring on one of them leaves two.
  const others = SCORED.filter(k => k !== priority)
  const matches = []
  const excluded = []

  for (const body of bodies) {
    // A body without all three scored measurements can't be placed.
    if (SCORED.some(k => body[k] == null)) {
      excluded.push({ body, reason: 'incomplete measurements' })
      continue
    }

    const bodyAnchor = priority === 'height' ? heightAnchor(body) : body[priority]
    if (bodyAnchor == null) {
      excluded.push({ body, reason: 'no known height' })
      continue
    }

    const multiplier = bodyAnchor / charAnchor
    const divisor = 1 / multiplier

    if (!scaleInRange(divisor)) {
      excluded.push({ body, reason: `implied scale 1:${divisor.toFixed(2)} is outside 1:4-1:8` })
      continue
    }

    // The character at this body's scale, and how far the body sits from it.
    const scaled = scaleCharacter(character, multiplier)
    const deltas = {}
    let totalOff = 0
    for (const k of SCORED) {
      deltas[k] = body[k] - scaled[k]     // positive = body is larger
      if (k !== priority) totalOff += Math.abs(deltas[k])
    }
    // Height is shown alongside the rest whatever the priority is; it just
    // never contributes to closeness.
    const bodyHeight = heightAnchor(body)
    deltas.height =
      bodyHeight != null && scaled.height != null ? bodyHeight - scaled.height : null

    matches.push({
      body,
      priority,
      multiplier,
      divisor,
      snappedDivisor: snapDivisor(divisor),
      scaleName: scaleName(divisor),
      scaled,          // character at this body's scale
      deltas,          // body minus character, per measurement
      totalOff,        // sum of |delta| across the non-anchor scored measurements
      otherKeys: others,
      bodyHeight,      // the shortest known height, i.e. what height anchors to
      uncertain: body.handMeasured,
    })
  }

  matches.sort((a, b) => a.totalOff - b.totalOff)
  return { matches: matches.slice(0, count), excluded, considered: matches.length }
}

/**
 * Rows for the CSV export. Mirrors what's on screen, including the fact that
 * the results are a set of options rather than a ranked list.
 */
export function buildExportRows(character, priority, unitLabel, result) {
  const sixth = atSixth(character)
  const mm = v => (v == null ? '' : parseFloat(v.toFixed(2)))

  const rows = [
    ['Scale Body Finder - results'],
    ['Character', character.name || '(unnamed)'],
    ['Priority', priority],
    ['Display unit', unitLabel],
    [],
    ['Character 1:1 (mm)', 'Height', mm(character.height), 'Bust', mm(character.bust), 'Waist', mm(character.waist), 'Hips', mm(character.hips)],
    ['Character at true 1:6 (mm)', 'Height', mm(sixth.height), 'Bust', mm(sixth.bust), 'Waist', mm(sixth.waist), 'Hips', mm(sixth.hips)],
    [],
    ['Closest bodies - listed as options, not ranked'],
    [
      'Manufacturer', 'Product', 'Material', 'Scale', 'Multiplier',
      'Bust (mm)', 'Bust diff (mm)',
      'Waist (mm)', 'Waist diff (mm)',
      'Hips (mm)', 'Hips diff (mm)',
      'Underbust (mm)', 'Shoulder (mm)', 'Arm (mm)', 'Inseam (mm)',
      'Height source', 'Height anchored on (mm)', 'Height diff (mm)',
      'Head 37.5mm (mm)', 'Head 38mm (mm)', 'Head 38.5mm (mm)', 'Head measured with',
      'Feet', 'Hand measured', 'Notes',
    ],
  ]

  const SOURCE_LABEL = {
    measured: 'Owner measured',
    manufacturer: "Manufacturer figure, maker's own head",
    estimated: 'Estimated',
  }
  const range = (b, size) => {
    const r = b.heightsByHead?.[size]
    return r ? (r.min === r.max ? `${r.min}` : `${r.min}-${r.max}`) : ''
  }

  for (const m of result.matches) {
    const b = m.body
    let source = SOURCE_LABEL[b.heightSource] || ''
    if (b.heightSource === 'estimated') source += ` from ${b.heightEstimatedFrom}`
    rows.push([
      b.manufacturer || '', b.name || b.code, b.material || '',
      m.scaleName, parseFloat(m.multiplier.toFixed(6)),
      mm(b.bust), mm(m.deltas.bust),
      mm(b.waist), mm(m.deltas.waist),
      mm(b.hips), mm(m.deltas.hips),
      mm(b.underbust), mm(b.shoulder), mm(b.arm), mm(b.inseam),
      source, mm(m.bodyHeight), mm(m.deltas.height),
      range(b, 37.5), range(b, 38), range(b, 38.5), b.headSize ? `${b.headSize}mm` : '',
      b.feet || '', b.handMeasured ? 'Yes (+/-1mm)' : 'No', b.notes || '',
    ])
  }

  return rows
}

export function rowsToCsv(rows) {
  return rows
    .map(r => r.map(cell => `"${String(cell ?? '').replace(/"/g, '""')}"`).join(','))
    .join('\n')
}
