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
/**
 * Image dimensions, read from the bytes rather than trusting the extension.
 *
 * Cards size their image tile from the real aspect ratio, so this has to work
 * for whatever actually arrives. Files come from manufacturer sites and phone
 * screenshots, and what a browser saves as ".jpg" is often not a JPEG at all -
 * the first male body arrived as an AVIF with a .jpg name. Since images are
 * used exactly as supplied, never re-encoded, the reader has to cope instead.
 */
function imageSize(file) {
  const b = fs.readFileSync(file)
  if (b[0] === 0xff && b[1] === 0xd8) return jpegSize(b)
  if (b.subarray(4, 8).toString('ascii') === 'ftyp') return isoBmffSize(b)
  if (b.subarray(0, 8).toString('hex') === '89504e470d0a1a0a') {
    return { width: b.readUInt32BE(16), height: b.readUInt32BE(20) }   // PNG IHDR
  }
  if (b.subarray(0, 4).toString('ascii') === 'RIFF' &&
      b.subarray(8, 12).toString('ascii') === 'WEBP') return webpSize(b)
  return null
}

/**
 * AVIF and HEIC are ISO base media files. The picture's dimensions live in an
 * 'ispe' box - name, four bytes of version and flags, then width and height.
 *
 * A file can hold several: thumbnails and alpha planes get their own. The
 * largest is the picture itself.
 */
function isoBmffSize(b) {
  let best = null
  for (let i = 0; i < b.length - 16; i++) {
    if (b[i] === 0x69 && b[i + 1] === 0x73 && b[i + 2] === 0x70 && b[i + 3] === 0x65) {
      const width = b.readUInt32BE(i + 8)
      const height = b.readUInt32BE(i + 12)
      if (width > 0 && height > 0 && width < 100000 && height < 100000 &&
          (!best || width * height > best.width * best.height)) {
        best = { width, height }
      }
    }
  }
  return best
}

function webpSize(b) {
  const fourcc = b.subarray(12, 16).toString('ascii')
  if (fourcc === 'VP8X') return { width: 1 + b.readUIntLE(24, 3), height: 1 + b.readUIntLE(27, 3) }
  if (fourcc === 'VP8 ') return { width: b.readUInt16LE(26) & 0x3fff, height: b.readUInt16LE(28) & 0x3fff }
  if (fourcc === 'VP8L') {
    const n = b.readUInt32LE(21)
    return { width: (n & 0x3fff) + 1, height: ((n >> 14) & 0x3fff) + 1 }
  }
  return null
}

function jpegSize(b) {
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
 * The two catalogues. Every body has to land in exactly one of them.
 *
 * This is validated rather than trusted because a wrong value here doesn't look
 * like an error - it looks like nothing. A body whose Body Type matches neither
 * name is filtered out of both sections and simply never appears, with no
 * warning and a clean build. A typo silently deletes a body.
 */
const BODY_TYPES = ['Seamless', 'Jointed']

/** The two catalogues. Nothing is ever mixed between them. */
const GENDERS = ['Female', 'Male']

/**
 * Male builds. Required on a male body, meaningless on a female one.
 *
 * Male buyers ask "does it look the part" before anything else, so this is the
 * label that answers it. It is shown and exported; it filters and sorts nothing.
 */
const BUILDS = [
  'Super Tall/Athletic',
  'Super Heavily Muscled',
  'Heavily Muscled',
  'Average Muscle Build',
  'Average Build',
  'Athletic',
  'Asian Athletic',
  'Heavy',
]

/**
 * Male height, where the only figure published is a neck peg height.
 *
 * Female bodies are measured against three known bald 3D-printed heads. Male
 * heads have no such standard - they are production sculpts with hair, based on
 * whoever the licence was for, and they vary. So a male height is derived rather
 * than measured: take the peg, add a head, and allow for the hips.
 *
 *   head        +11 to +15mm above the peg. Measured off a production sculpt
 *               (Henry Cavill, 45mm chin to hair) at +13, widened either way to
 *               cover the range of sculpts on the market. Applies to every male
 *               body, seamless or jointed - everything wears a head.
 *   hip travel  5mm, seamless only. Jointed male bodies are a fixed height.
 *
 * A published peg height is the tallest setting, so hip travel comes off the
 * bottom rather than being added on top.
 *
 * Any of this is thrown away the moment a real measured height exists.
 */
const MALE_HEAD_MIN = 11
const MALE_HEAD_MAX = 15
const MALE_HIP_TRAVEL = 5

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
  gender: col('Gender'),
  bodyType: col('Body Type'),
  build: col('Build'),
  bustPiece: col('Bust Piece'),
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
    gender: str(r[C.gender]),
    bodyType: str(r[C.bodyType]),
    build: str(r[C.build]),
    bustPiece: str(r[C.bustPiece]),
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
  //   manufacturer  - a figure taken with the maker's own head rather than one
  //                   of the custom sculpts, so nothing can be derived per head
  //                   size. It may still carry a real range: see below
  //   estimated     - borrowed from a reference body, see HEIGHT_ESTIMATED_FROM
  if (body.gender === 'Male') {
    body.headSize = null
    body.heightsByHead = null
    if (body.heightMax != null) {
      // A real figure beats anything derived. If only one number was given it
      // is a single height, not a range.
      body.heightSource = 'measured'
      body.maleHeight = { min: body.heightMin ?? body.heightMax, max: body.heightMax }
    } else {
      // Fall back to the peg. Measured beats published; a published peg is the
      // tallest setting, so hip travel comes off the bottom.
      const peg = body.pegMax ?? body.pegMfr
      if (peg == null) {
        body.heightSource = null
        body.maleHeight = null
      } else {
        const low = body.pegMin ?? (body.bodyType === 'Seamless' ? peg - MALE_HIP_TRAVEL : peg)
        body.heightSource = 'derived'
        body.maleHeight = { min: low + MALE_HEAD_MIN, max: peg + MALE_HEAD_MAX }
      }
    }
    // A null heightSource is already collected into the build's warning list.
  } else if ((body.headSize = parseHeadSize(body.head)) != null) {
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
    body.heightsByHead = null
    // A minimum that is filled in is a real figure - measured, or published.
    // Leave the cell blank rather than guessing at one, because anything here
    // is taken at face value and becomes a range the body can be posed across.
    //
    // An earlier rule tried to infer this from whether the pegs had been
    // measured. That was guesswork about provenance: TrickyMan publish their
    // range outright, with no measuring involved, and the rule only got them
    // right by accident.
    if (body.heightMin != null) {
      body.heightSpan = { min: body.heightMin, max: body.heightMax }
    } else {
      body.manufacturerHeight = body.heightMax
    }
  } else {
    body.heightSource = null
    body.heightsByHead = null
  }

  // Gender decides which catalogue a body appears in, so a bad value takes it
  // out of both and the body simply never appears.
  if (body.gender == null) {
    problems.push(`${code}: no Gender - must be ${GENDERS.join(' or ')}`)
  } else if (!GENDERS.includes(body.gender)) {
    problems.push(`${code}: Gender "${body.gender}" is not ${GENDERS.join(' or ')}`)
  }

  // Build answers "does it look the part", which is the first thing asked of a
  // male body - so it is required there. On a female body it means nothing and
  // a value would just be noise on the card.
  if (body.gender === 'Male') {
    if (body.build == null) {
      problems.push(`${code}: male bodies need a Build - one of: ${BUILDS.join(', ')}`)
    } else if (!BUILDS.includes(body.build)) {
      problems.push(`${code}: Build "${body.build}" is not one of: ${BUILDS.join(', ')}`)
    }
  } else if (body.build != null) {
    problems.push(`${code}: Build is for male bodies only, found "${body.build}"`)
  }

  // Body Type is no longer what picks a catalogue - Gender is - but it still
  // has to be right, because it is reported on the card and in the export.
  if (body.bodyType == null) {
    problems.push(`${code}: no Body Type - must be ${BODY_TYPES.join(' or ')}`)
  } else if (!BODY_TYPES.includes(body.bodyType)) {
    problems.push(`${code}: Body Type "${body.bodyType}" is not ${BODY_TYPES.join(' or ')}`)
  }

  // What a body has to carry to be usable differs by catalogue.
  //
  // Female bodies are compared on four measurements, so a row missing any of
  // bust/waist/hips is unusable and gets rejected.
  //
  // Male bodies are published with a neck peg height and, very often, nothing
  // else - chest, waist and hips rarely appear in manufacturer specs. Demanding
  // them would reject almost every male body there is. There, the peg is what
  // matters, and a body without any height at all is only a warning: it still
  // has a name, a build and a picture, it just cannot be ranked on height.
  if (body.gender === 'Male') {
    if (body.maleHeight == null) {
      problems.push(`${code}: male bodies need a neck peg height, or a height with head`)
    }
  } else {
    for (const k of ['bust', 'waist', 'hips']) {
      if (body[k] == null) problems.push(`${code}: missing ${k}`)
    }
  }
  if (body.image) {
    const imgPath = path.join(IMG_DIR, body.image)
    if (!fs.existsSync(imgPath)) {
      problems.push(`${code}: image not found - ${body.image}`)
    } else {
      images.add(body.image)
      const size = imageSize(imgPath)
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

  // --- modular bodies: several rows, one product ----------------------------
  // A modular body ships one frame and a set of chest pieces, so the CSV carries
  // a row per piece. They collapse into a single entry with bustOptions; the
  // matcher picks the closest piece at compare time and the card lets you cycle.
  // Without this you would get five near-identical cards for one product,
  // crowding out every other manufacturer.
  const grouped = []
  const byProduct = new Map()
  for (const b of bodies) {
    const key = `${b.manufacturer}|${b.code}`
    if (!byProduct.has(key)) byProduct.set(key, [])
    byProduct.get(key).push(b)
  }
  for (const [key, group] of byProduct) {
    if (group.length === 1) { grouped.push(group[0]); continue }

    const first = group[0]
    // Everything except the chest piece has to agree, or "the same product" is a lie.
    const VARY = new Set(['bust', 'bustPiece'])
    for (const b of group.slice(1)) {
      for (const k of Object.keys(first)) {
        if (VARY.has(k) || typeof first[k] === 'object') continue
        if (b[k] !== first[k]) {
          problems.push(`${b.code}: rows for one product disagree on ${k} (${first[k]} vs ${b[k]})`)
        }
      }
    }
    const missing = group.filter(b => !b.bustPiece).length
    if (missing) problems.push(`${first.code}: ${missing} of ${group.length} rows have no Bust Piece`)

    grouped.push({
      ...first,
      bust: null,                       // no single bust; the matcher chooses
      bustPiece: null,
      bustOptions: group
        .map(b => ({ piece: b.bustPiece, bust: b.bust }))
        .filter(o => o.piece != null && o.bust != null)
        .sort((a, b) => a.bust - b.bust),
    })
  }
  bodies.length = 0
  bodies.push(...grouped)

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

/** The two catalogues. Every body carries exactly one of these. */
export const BODY_TYPES = ${JSON.stringify(BODY_TYPES)}

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
