/**
 * tools/build-body-data.js
 *
 * Turns data/bodies.csv (the thing you actually edit) into data/bodies.js
 * (the thing the app imports). Run it after any change to the CSV:
 *
 *     node tools/build-body-data.js
 *
 * Two things it handles that matter:
 *  - The CSV uses the literal string "N/A" for missing numbers. Those become
 *    null, never the string, so nothing downstream tries to do maths on "N/A".
 *  - Images have to be require()d with a literal path for Metro to bundle them,
 *    so the image map is written out explicitly rather than built at runtime.
 */

const fs = require('fs')
const path = require('path')

const ROOT = path.join(__dirname, '..')
const CSV = path.join(ROOT, 'data', 'bodies.csv')
const OUT = path.join(ROOT, 'data', 'bodies.js')
const IMG_DIR = path.join(ROOT, 'images')

// --- minimal RFC4180 parser (quoted fields, doubled quotes, commas inside) ---
function parseCsv(text) {
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

/**
 * Intrinsic size of a JPEG, by walking to its start-of-frame marker.
 *
 * The catalogue mixes tall single-body shots with wide model-line shots, and
 * the card needs each image's real aspect ratio to avoid letterboxing. Baking
 * it in here beats asking at runtime: react-native-web has no
 * Image.resolveAssetSource, so there is no one call that works everywhere.
 */
function jpegSize(file) {
  const b = fs.readFileSync(file)
  if (b[0] !== 0xff || b[1] !== 0xd8) return null
  let i = 2
  while (i < b.length - 9) {
    if (b[i] !== 0xff) { i++; continue }
    const marker = b[i + 1]
    // SOF0-SOF15 carry the frame size; C4/C8/CC are other things sharing the range.
    if (marker >= 0xc0 && marker <= 0xcf && marker !== 0xc4 && marker !== 0xc8 && marker !== 0xcc) {
      return { width: b.readUInt16BE(i + 7), height: b.readUInt16BE(i + 5) }
    }
    i += 2 + b.readUInt16BE(i + 2)
  }
  return null
}

/**
 * The three head sculpts the owner measures with, in mm (chin to scalp, squared
 * off, no hair).
 */
const HEAD_SIZES = [37.5, 38, 38.5]

/**
 * Height for each head option, derived from the one that was actually measured.
 *
 * The peg socket depth is fixed by the sculpt, so a head 0.5mm taller puts the
 * scalp 0.5mm higher and nothing else moves - the offset is 1:1. That makes the
 * other two options arithmetic rather than data entry, which is worth doing:
 * six hand-kept columns per body would be six more things to drift.
 */
function heightsByHead(measuredHead, min, max) {
  if (measuredHead == null || min == null || max == null) return null
  const round = n => Math.round(n * 100) / 100
  const out = {}
  for (const size of HEAD_SIZES) {
    const delta = size - measuredHead
    out[size] = { min: round(min + delta), max: round(max + delta) }
  }
  return out
}

/** Pull the head size out of a free-text "Head Used" cell. */
function parseHeadSize(text) {
  if (!text) return null
  const m = /(\d+(?:\.\d+)?)\s*mm/i.exec(text)
  return m ? Number(m[1]) : null
}

/**
 * Bodies with no height of their own that borrow another body's range.
 *
 * VCD-01/02/06/07 publish a 260mm neck peg and nothing else. That is exactly
 * the S07C's measured minimum, so the S07C's range stands in for them. It is an
 * estimate and is labelled as one everywhere it appears.
 *
 * Add a body here only when its published peg genuinely matches the reference's
 * measured minimum - otherwise the estimate is just a guess wearing a number.
 */
const HEIGHT_ESTIMATED_FROM = {
  'VCD-01': 'S07C',
  'VCD-02': 'S07C',
  'VCD-06': 'S07C',
  'VCD-07': 'S07C',
}

const blank = v => v == null || v.trim() === '' || v.trim().toUpperCase() === 'N/A'
const str = v => (blank(v) ? null : v.trim())
const num = v => {
  if (blank(v)) return null
  const n = Number(v.trim())
  return Number.isFinite(n) ? n : null
}

// --- read ------------------------------------------------------------------
function loadBodies() {
const rows = parseCsv(fs.readFileSync(CSV, 'utf8'))
const header = rows[0].map(h => h.trim())
const col = name => {
  const i = header.indexOf(name)
  if (i < 0) throw new Error(`CSV is missing the "${name}" column`)
  return i
}

const C = {
  manufacturer: col('Manufacturer'),
  name: col('Product Name'),
  code: col('Product Code'),
  material: col('Material'),
  pegMin: col('Neck Peg Min - Measured (mm)'),
  pegMax: col('Neck Peg Max - Measured (mm)'),
  pegMfr: col('Neck Peg Max - Mfr Stated (mm)'),
  head: col('Head Used'),
  heightMin: col('Height with Head (Min)'),
  heightMax: col('Height with Head (max)'),
  bust: col('Bust (mm)'),
  underbust: col('Underbust (mm)'),
  waist: col('Waist (mm)'),
  hips: col('Hips (mm)'),
  shoulder: col('Shoulder Width (mm)'),
  arm: col('Arm Length (mm)'),
  inseam: col('Leg Inseam (mm)'),
  feet: col('Feet'),
  image: col('Image'),
  notes: col('Notes'),
}

const bodies = []
const images = new Set()
const problems = []

rows.slice(1).forEach((r, i) => {
  const code = str(r[C.code]) || `row${i + 2}`
  const body = {
    code,
    name: str(r[C.name]) || code,
    manufacturer: str(r[C.manufacturer]),
    material: str(r[C.material]),
    pegMin: num(r[C.pegMin]),
    pegMax: num(r[C.pegMax]),
    pegMfr: num(r[C.pegMfr]),
    head: str(r[C.head]),
    heightMin: num(r[C.heightMin]),
    heightMax: num(r[C.heightMax]),
    bust: num(r[C.bust]),
    underbust: num(r[C.underbust]),
    waist: num(r[C.waist]),
    hips: num(r[C.hips]),
    shoulder: num(r[C.shoulder]),
    arm: num(r[C.arm]),
    inseam: num(r[C.inseam]),
    feet: str(r[C.feet]),
    image: str(r[C.image]),
    notes: str(r[C.notes]),
  }

  // --- height -------------------------------------------------------------
  // Three cases, and the app says which is which rather than presenting them
  // as equally solid:
  //   measured      - owner measured it with one of the custom head sculpts,
  //                   so all three head options can be derived
  //   manufacturer  - the maker's own figure with their own head. One number,
  //                   no range and no head options; the min in the CSV is an
  //                   owner-added hip-travel allowance, not a published figure
  //   estimated     - borrowed from a reference body, see HEIGHT_ESTIMATED_FROM
  body.headSize = parseHeadSize(body.head)
  if (body.headSize != null) {
    body.heightSource = 'measured'
    body.heightsByHead = heightsByHead(body.headSize, body.heightMin, body.heightMax)
    if (!HEAD_SIZES.includes(body.headSize)) {
      problems.push(`${code}: head size ${body.headSize}mm is not one of ${HEAD_SIZES.join('/')}`)
    }
    if (body.heightsByHead == null) {
      problems.push(`${code}: has head size ${body.headSize}mm but no measured height range`)
    }
  } else if (body.heightMax != null) {
    body.heightSource = 'manufacturer'
    body.manufacturerHeight = body.heightMax
    body.heightsByHead = null
  } else {
    body.heightSource = null
    body.heightsByHead = null
  }

  // Bust/waist/hips are what selection runs on - a row without them is unusable.
  for (const k of ['bust', 'waist', 'hips']) {
    if (body[k] == null) problems.push(`${code}: missing ${k}`)
  }
  if (body.image) {
    const imgPath = path.join(IMG_DIR, body.image)
    if (!fs.existsSync(imgPath)) {
      problems.push(`${code}: image not found - ${body.image}`)
    } else {
      images.add(body.image)
      const size = jpegSize(imgPath)
      if (size) {
        body.imageW = size.width
        body.imageH = size.height
      } else {
        problems.push(`${code}: could not read dimensions of ${body.image}`)
      }
    }
  }
  bodies.push(body)
})

  // Second pass: bodies that borrow a reference body's height range.
  for (const [code, refCode] of Object.entries(HEIGHT_ESTIMATED_FROM)) {
    const body = bodies.find(b => b.code === code)
    if (!body) { problems.push(`height estimate names unknown body ${code}`); continue }
    const ref = bodies.find(b => b.code === refCode)
    if (!ref || !ref.heightsByHead) {
      problems.push(`${code}: reference body ${refCode} has no height range to borrow`)
      continue
    }
    if (body.heightSource === 'measured') {
      problems.push(`${code}: has its own measurements, remove it from HEIGHT_ESTIMATED_FROM`)
      continue
    }
    body.heightSource = 'estimated'
    body.heightEstimatedFrom = refCode
    body.headSize = ref.headSize
    body.heightsByHead = JSON.parse(JSON.stringify(ref.heightsByHead))
    body.manufacturerHeight = null
  }

  // A body with no height is incomplete, not broken. It still matches on
  // bust/waist/hips, shows a dash where its height would be, and drops out of
  // Height priority because there is nothing to compare. Worth saying out loud,
  // not worth refusing to build over - inventing a height would be worse.
  const noHeight = bodies.filter(b => b.heightSource == null).map(b => b.code)

  return { bodies, images: [...images].sort(), problems, warnings: noHeight.length
    ? [`no height data (will not appear under Height priority): ${noHeight.join(', ')}`]
    : [] }
}

// --- write -----------------------------------------------------------------
function main() {
const { bodies, images: imgList, problems, warnings } = loadBodies()
const imgMap = imgList
  .map(f => `  ${JSON.stringify(f)}: require(${JSON.stringify('../images/' + f)}),`)
  .join('\n')

const out = `/**
 * data/bodies.js - GENERATED, do not edit by hand.
 * Source: data/bodies.csv   Rebuild: node tools/build-body-data.js
 *
 * Measurements are millimetres. null means the figure isn't known, and the UI
 * shows a dash rather than inventing one.
 *
 *
 * heightsByHead gives the total height for each of the three custom head
 * sculpts, keyed by head size in mm. Only the size in headSize was actually
 * measured; the others are that measurement shifted by the difference in head
 * height, which is 1:1 because the peg socket depth doesn't change. Bodies
 * shipped with a manufacturer head have headSize null and heightsByHead null.
 */

export const HEAD_SIZES = ${JSON.stringify(HEAD_SIZES)}

const IMAGES = {
${imgMap}
}

/** Resolve a CSV image filename to a bundled asset, or null. */
export function bodyImage(filename) {
  return filename ? IMAGES[filename] ?? null : null
}

export const BODIES = ${JSON.stringify(bodies, null, 2)}

export default BODIES
`

fs.writeFileSync(OUT, out)

console.log(`bodies: ${bodies.length}`)
console.log(`images referenced: ${imgList.length}`)
if (warnings.length) {
  console.log(`\nNOTE (${warnings.length}) - built anyway:`)
  warnings.forEach(w => console.log('  ' + w))
}
if (problems.length) {
  console.log(`\nPROBLEMS (${problems.length}):`)
  problems.forEach(p => console.log('  ' + p))
  process.exitCode = 1
} else {
  console.log('no problems')
}
console.log(`\nwrote ${path.relative(ROOT, OUT)}`)
}

module.exports = { loadBodies, parseCsv }
if (require.main === module) main()
