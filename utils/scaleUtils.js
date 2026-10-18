/**
 * utils/scaleUtils.js
 *
 * Units, formatting and scale naming. Pure functions, no state.
 *
 * Millimetres are the internal unit everywhere. Centimetres are only ever a
 * display format - 0.1cm and 1mm are the same number, so switching between
 * them moves a decimal point and loses nothing.
 *
 * Inches and feet exist for one reason: scene items. A refrigerator's spec
 * sheet says 70 inches, and making you convert it by hand first is a chance
 * to get it wrong. Characters and bodies stay metric.
 */

// ---------------------------------------------------------------------------
// Units
// ---------------------------------------------------------------------------

export const UNITS = ['cm', 'mm']
export const DEFAULT_UNIT = 'cm'

/** What a scene item's real-world size can be typed in. */
export const ITEM_UNITS = ['mm', 'cm', 'in', 'ft']

const MM_PER = { mm: 1, cm: 10, in: 25.4, ft: 304.8 }

export function toMM(value, unit) {
  return value * (MM_PER[unit] ?? 1)
}

export function fromMM(mm, unit) {
  return mm / (MM_PER[unit] ?? 1)
}

// ---------------------------------------------------------------------------
// Formatting
// ---------------------------------------------------------------------------

/** A measurement in the chosen unit, to 2dp, trailing zeros trimmed. */
export function fmtMM(mm, unit = 'cm', dash = '—') {
  if (mm === null || mm === undefined || Number.isNaN(mm)) return dash
  const v = fromMM(mm, unit)
  return parseFloat(v.toFixed(2)).toString()
}

/** Same, with the unit appended. */
export function fmtWithUnit(mm, unit = 'cm', dash = '—') {
  const s = fmtMM(mm, unit, dash)
  return s === dash ? dash : `${s}${unit}`
}

/**
 * A signed difference, always in millimetres regardless of display unit.
 * Differences are small and physical - millimetres are how they're discussed.
 */
/**
 * A difference, in whichever unit is selected.
 *
 * This used to be millimetres always, with "mm" appended, while the columns
 * either side of it followed the selector - so at cm a row read 26.6 / 250 /
 * -2234mm, three numbers in two units. One row, one unit.
 */
export function fmtDelta(mm, unit = 'cm', dash = '—') {
  if (mm === null || mm === undefined || Number.isNaN(mm)) return dash
  const r = parseFloat(fromMM(mm, unit).toFixed(2))
  if (r === 0) return `0${unit}`
  return `${r > 0 ? '+' : ''}${r}${unit}`
}

// ---------------------------------------------------------------------------
// Scale naming
// ---------------------------------------------------------------------------

// The scale chart runs 1:4 to 1:7 63/64 in 1/64 steps. It's a plain arithmetic
// sequence, so it's generated rather than stored, and the same bounds double as
// the sanity range for an implied scale.
export const SCALE_MIN = 4
export const SCALE_MAX = 8
export const SCALE_STEPS = 64

const gcd = (a, b) => (b ? gcd(b, a % b) : a)

/**
 * Name a scale from its divisor, snapped to the nearest 1/64.
 *   5.8125 -> "1:5 13/16"
 *   6      -> "1:6"
 */
export function scaleName(divisor) {
  if (!Number.isFinite(divisor) || divisor <= 0) return '—'
  let whole = Math.floor(divisor)
  let n = Math.round((divisor - whole) * SCALE_STEPS)
  if (n === SCALE_STEPS) { whole += 1; n = 0 }
  if (n === 0) return `1:${whole}`
  const g = gcd(n, SCALE_STEPS)
  return `1:${whole} ${n / g}/${SCALE_STEPS / g}`
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

/**
 * A scale typed by hand, as a divisor. Returns null if it isn't one.
 *
 * Takes the three ways a scale gets written down:
 *   "1:5 13/16"  - the app's own names
 *   "1:5.8125"   - a ratio with a decimal
 *   "0.172"      - a multiplier, the way the Scale Conversion Tool took it
 * A bare number above 1 is read as the divisor, so "6" is 1:6.
 *
 * Deliberately not limited to the working-scale range. A scene can be any
 * scale at all; nothing here is compared against the catalogue.
 */
export function parseScale(text) {
  const s = String(text ?? '').trim()
  if (!s) return null
  const named = parseScaleName(s)
  if (named != null) return named > 0 ? named : null
  const ratio = /^1\s*:\s*(\d*\.?\d+)$/.exec(s)
  if (ratio) {
    const d = Number(ratio[1])
    return d > 0 ? d : null
  }
  if (/^\d*\.?\d+$/.test(s)) {
    const n = Number(s)
    if (n > 0 && n <= 1) return 1 / n
    if (n > 1) return n
  }
  return null
}

/**
 * Name any divisor.
 *
 * On the 1/64 chart it gets the chart's name. Off it, the plain decimal -
 * snapping 1:5.83 to "1:5 53/64" would name a scale nobody asked for.
 */
export function describeScale(divisor) {
  if (!Number.isFinite(divisor) || divisor <= 0) return '—'
  return Math.abs(snapDivisor(divisor) - divisor) < 1e-9
    ? scaleName(divisor)
    : `1:${parseFloat(divisor.toFixed(4))}`
}

/** Divisor snapped to the nearest 1/64, for showing alongside the name. */
export function snapDivisor(divisor) {
  return Math.round(divisor * SCALE_STEPS) / SCALE_STEPS
}

/** Is an implied scale inside the chart's range? */
export function scaleInRange(divisor) {
  return Number.isFinite(divisor) && divisor >= SCALE_MIN && divisor < SCALE_MAX
}

/**
 * What one unit at the working scale is worth at full size.
 *
 * The plain divisor, which is what you want when you have a ruler against
 * something you are building: at 1:6, a millimetre of prop is six millimetres
 * of the real thing.
 *
 * Deliberately not derived from the rounded Scale Multiplier on the cards.
 * Inverting a figure already rounded to five places turns 1:6 into 5.99, which
 * is an artefact of the rounding rather than anything true about the scale.
 *
 * Unit-free on purpose: a ratio is a ratio, so the caller supplies the label
 * and the same number serves millimetres and centimetres alike.
 */
export function realWorldEquivalent(divisor) {
  return Number.isFinite(divisor) && divisor > 0 ? parseFloat(divisor.toFixed(2)) : null
}

/** True 1:6 multiplier. */
export const SIXTH = 1 / 6

/**
 * The scales a user can compare at, as divisors.
 *
 * A fixed list rather than free entry: everything downstream assumes a sane
 * scale, and there's no reason to let someone type 1:0.3 and get nonsense.
 * 1/64 steps between 1:5 and 1:7 - the same fractions as the scale chart.
 *
 * Widened from 1:5 1/2 - 1:6 1/2 in October 2026. The narrow band covered where
 * the bodies sit; it did not cover where characters sit, and a short character
 * compared at the bottom of the old range still ran out of room.
 */
export const WORKING_SCALE_MIN = 5
export const WORKING_SCALE_MAX = 7
export const WORKING_SCALES = (() => {
  const out = []
  for (let n = WORKING_SCALE_MIN * SCALE_STEPS; n <= WORKING_SCALE_MAX * SCALE_STEPS; n++) {
    out.push(n / SCALE_STEPS)
  }
  return out
})()
export const DEFAULT_WORKING_SCALE = 6

// ---------------------------------------------------------------------------
// Misc
// ---------------------------------------------------------------------------

/** Margin of error on a hand-measured body, in millimetres. */
export const HAND_MARGIN_MM = 1

export function safeFileName(name, fallback = 'Character') {
  // Keep letters and digits from any alphabet - plenty of these characters have
  // accents or aren't Latin at all, and dropping them turns Léon into L_on.
  // Only punctuation and whitespace become underscores.
  const base = (name || '').trim().replace(/[^\p{L}\p{N}]+/gu, '_').replace(/^_|_$/g, '')
  return base || fallback
}

/**
 * Name for an exported results file: CharacterName_Results_PriorityChosen.csv
 *
 * A male run adds _Male on the end, so running the same character through both
 * sections leaves you with two files instead of one overwriting the other.
 * Female keeps the plain name it has always had - those files are already being
 * fed to other tools, and renaming them would break that for no gain.
 *
 * Kept here rather than in either export module so the browser and native
 * versions can't drift apart on it.
 */
export function exportFileName(characterName, priority, gender) {
  const who = safeFileName(characterName)
  const what = priority ? priority.charAt(0).toUpperCase() + priority.slice(1) : null
  const which = gender && gender !== 'Female' ? gender : null
  return [who, 'Results', what, which].filter(Boolean).join('_') + '.csv'
}
