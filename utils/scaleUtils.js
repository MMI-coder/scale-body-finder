/**
 * utils/scaleUtils.js
 *
 * Units, formatting and scale naming. Pure functions, no state.
 *
 * Millimetres are the internal unit everywhere. Centimetres are only ever a
 * display format - 0.1cm and 1mm are the same number, so switching between
 * them moves a decimal point and loses nothing.
 */

// ---------------------------------------------------------------------------
// Units
// ---------------------------------------------------------------------------

export const UNITS = ['cm', 'mm']
export const DEFAULT_UNIT = 'cm'

export function toMM(value, unit) {
  return unit === 'cm' ? value * 10 : value
}

export function fromMM(mm, unit) {
  return unit === 'cm' ? mm / 10 : mm
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
export function fmtDelta(mm, dash = '—') {
  if (mm === null || mm === undefined || Number.isNaN(mm)) return dash
  const r = parseFloat(mm.toFixed(2))
  if (r === 0) return '0mm'
  return `${r > 0 ? '+' : ''}${r}mm`
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

/** Divisor snapped to the nearest 1/64, for showing alongside the name. */
export function snapDivisor(divisor) {
  return Math.round(divisor * SCALE_STEPS) / SCALE_STEPS
}

/** Is an implied scale inside the chart's range? */
export function scaleInRange(divisor) {
  return Number.isFinite(divisor) && divisor >= SCALE_MIN && divisor < SCALE_MAX
}

/** True 1:6 multiplier. */
export const SIXTH = 1 / 6

/**
 * The scales a user can compare at, as divisors.
 *
 * A fixed list rather than free entry: everything downstream assumes a sane
 * scale, and there's no reason to let someone type 1:0.3 and get nonsense.
 * 1/64 steps between 1:5 1/2 and 1:6 1/2 - the same fractions as the scale
 * chart, narrowed to the band these bodies actually land in.
 */
export const WORKING_SCALE_MIN = 5.5
export const WORKING_SCALE_MAX = 6.5
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
 * A jointed run adds _Jointed on the end, so running the same character through
 * both sections leaves you with two files instead of one overwriting the other.
 * Seamless keeps the plain name it has always had - those files are already
 * being fed to other tools, and renaming them would break that for no gain.
 *
 * Kept here rather than in either export module so the browser and native
 * versions can't drift apart on it.
 */
export function exportFileName(characterName, priority, bodyType) {
  const who = safeFileName(characterName)
  const what = priority ? priority.charAt(0).toUpperCase() + priority.slice(1) : null
  const which = bodyType && bodyType !== 'Seamless' ? bodyType : null
  return [who, 'Results', what, which].filter(Boolean).join('_') + '.csv'
}
