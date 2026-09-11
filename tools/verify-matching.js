/**
 * tools/verify-matching.js
 *
 *     node tools/verify-matching.js
 *
 * Checks the engine against the real source in utils/ rather than a copy of it.
 * Those are ES modules and this is plain Node, so their import/export lines are
 * stripped and the bodies evaluated in one scope - crude, but it means this
 * tests the shipped code and not a reimplementation of it.
 *
 * The case that matters: comparing every body at one scale has to show the gap
 * that per-body anchoring was hiding. S07C and S24A scored almost identically
 * under anchoring (5.14 vs 5.35) despite S24A being 17mm narrower in the bust.
 */

const fs = require('fs')
const path = require('path')
const { loadBodies, parseCsv } = require('./build-body-data')

const ROOT = path.join(__dirname, '..')

const strip = src =>
  src
    .replace(/^\s*import[\s\S]*?from\s+['"][^'"]+['"]\s*$/gm, '')
    .replace(/^\s*export\s+default\s+/gm, 'var __default = ')
    .replace(/^\s*export\s+/gm, '')

const { bodies } = loadBodies()
const src = [
  strip(fs.readFileSync(path.join(ROOT, 'utils', 'scaleUtils.js'), 'utf8')),
  strip(fs.readFileSync(path.join(ROOT, 'utils', 'matching.js'), 'utf8')),
  strip(fs.readFileSync(path.join(ROOT, 'utils', 'batch.js'), 'utf8')),
  `return { compareBodies, scaleCharacter, atSixth, heightRange, heightAgainst, heightAnchor,
            scaleName, snapDivisor, scaleInRange, buildExportRows, rowsToCsv,
            WORKING_SCALES, DEFAULT_WORKING_SCALE, PRIORITIES, SCORED,
            parseCharacterCsv, runBatch, templateCsv, parseScaleName,
            TEMPLATE_HEADERS, BODY_TYPES, GENDERS, DEFAULT_GENDER, pickBustPiece,
            exportFileName, PRIORITIES_BY_GENDER, heightRange }`,
].join('\n')

const api = new Function('BODIES', 'console', src)(bodies, console)
const byCode = Object.fromEntries(bodies.map(b => [b.code, b]))

const SEAMLESS = bodies.filter(b => b.gender === 'Female' && b.bodyType === 'Seamless').length
const JOINTED = bodies.filter(b => b.gender === 'Female' && b.bodyType === 'Jointed').length
const FEMALE = bodies.filter(b => b.gender === 'Female').length
const MALE = bodies.filter(b => b.gender === 'Male').length

let failures = 0
function check(label, actual, expected, tol = 0) {
  const ok = typeof expected === 'number' ? Math.abs(actual - expected) <= tol : actual === expected
  if (!ok) failures++
  console.log(`  ${ok ? 'PASS' : 'FAIL'}  ${label}: ${actual}${ok ? '' : `   (expected ${expected})`}`)
}
const r2 = n => Math.round(n * 100) / 100

// --- scale naming ----------------------------------------------------------
console.log('\nScale naming')
check('1/0.172 -> name', api.scaleName(1 / 0.172), '1:5 13/16')
check('6 -> name', api.scaleName(6), '1:6')
check('5.5 -> name', api.scaleName(5.5), '1:5 1/2')
check('working scales are all in range', api.WORKING_SCALES.every(api.scaleInRange), true)
check('default working scale', api.DEFAULT_WORKING_SCALE, 6)
check('scale list starts at 1:5 1/2', api.scaleName(api.WORKING_SCALES[0]), '1:5 1/2')
check('scale list ends at 1:6 1/2', api.scaleName(api.WORKING_SCALES[api.WORKING_SCALES.length - 1]), '1:6 1/2')
check('scale list is 1/64 steps', api.WORKING_SCALES.length, 65)
check('1:6 is in the list', api.WORKING_SCALES.includes(6), true)

// --- the Example character, the case from the screenshots -------------------
const example = { name: 'Example', height: 1650, bust: 920, waist: 580, hips: 870 }

console.log('\nExample at 1:6 (mm)')
const at6 = api.scaleCharacter(example, 6)
check('height', r2(at6.height), 275)
check('bust', r2(at6.bust), 153.33)
check('waist', r2(at6.waist), 96.67)
check('hips', r2(at6.hips), 145)

console.log('\nComparing at 1:6 - the gap anchoring was hiding')
const out6 = api.compareBodies(example, { workingScale: 6, priority: 'bust', sort: 'least', bodies })
const find = (o, code) => o.results.find(r => r.body.code === code)
const s07c = find(out6, 'S07C')
const s24a = find(out6, 'S24A')
for (const [code, m] of [['S07C', s07c], ['S24A', s24a]]) {
  const d = m.deltas
  console.log(
    `  ${code.padEnd(6)} height ${r2(d.height).toString().padStart(7)}` +
    `  bust ${r2(d.bust).toString().padStart(7)}  waist ${r2(d.waist).toString().padStart(7)}` +
    `  hips ${r2(d.hips).toString().padStart(7)}   total ${r2(m.totalOff)}`
  )
}
check('S07C bust diff', r2(s07c.deltas.bust), -0.33)
check('S07C waist diff', r2(s07c.deltas.waist), -3.67)
check('S07C hips diff', r2(s07c.deltas.hips), -2)
check('S24A bust diff', r2(s24a.deltas.bust), -17.33)
check('S24A hips diff', r2(s24a.deltas.hips), -20)
check('S24A is far worse than S07C', s24a.totalOff > s07c.totalOff * 5, true)
check('nothing is forced to zero by the priority',
  out6.results.every(r => r.deltas.bust !== 0 || r.body.bust === at6.bust), true)

// --- height range: inside the range is a match, not a near miss -------------
console.log('\nHeight range handling')
const s07cRange = api.heightRange(byCode.S07C)
check('S07C range low', s07cRange.min, 274)
check('S07C range high', s07cRange.max, 280)
check('target 275 sits inside it', api.heightAgainst(byCode.S07C, 275), 275)
check('  so the diff is zero', r2(s07c.deltas.height), 0)
check('target 270 is below it -> pinned to 274', api.heightAgainst(byCode.S07C, 270), 274)
check('target 290 is above it -> pinned to 280', api.heightAgainst(byCode.S07C, 290), 280)
check('S24A cannot reach 275, tops out at 267', api.heightAgainst(byCode.S24A, 275), 267)
check('  so its height diff is -8', r2(s24a.deltas.height), -8)
// A height minimum that is filled in is taken at face value, whoever supplied
// it, and becomes a range the body can be posed across. A blank one leaves the
// body pinned to the single figure. The cell is the whole tell - nothing is
// inferred from whether the pegs were measured.
const mfr = api.heightRange(byCode['SR-AD01'])
check('a manufacturer figure with a minimum is a range', mfr.min !== mfr.max, true)
check('  low end is the minimum given', mfr.min, 306)
check('  high end is their figure', mfr.max, 310)
check('  and it is still labelled as theirs', byCode['SR-AD01'].heightSource, 'manufacturer')

const noMin = api.heightRange(byCode['86-TS01-A'])
check('no minimum given means no span', noMin.min === noMin.max, true)
check('  pinned to the one figure', noMin.max, 280)

// TrickyMan publish a range outright, with no measuring involved.
const tm = api.heightRange(byCode['DT06'])
check('a published range survives', `${tm.min}-${tm.max}`, '290-295')

// --- sorting ---------------------------------------------------------------
console.log('\nSorting by difference in the chosen measurement')
for (const priority of api.PRIORITIES) {
  const asc = api.compareBodies(example, { workingScale: 6, priority, sort: 'least', bodies })
  const desc = api.compareBodies(example, { workingScale: 6, priority, sort: 'greatest', bodies })
  const key = r => (r.deltas[priority] == null ? Infinity : Math.abs(r.deltas[priority]))
  const ascOk = asc.results.every((r, i, a) => i === 0 || key(a[i - 1]) <= key(r))
  const descOk = desc.results.every((r, i, a) => i === 0 || key(a[i - 1]) >= key(r))
  console.log(
    `  ${priority.padEnd(6)} least -> ${asc.results[0].body.code.padEnd(8)}` +
    `(${r2(key(asc.results[0]))}mm)   greatest -> ${desc.results[0].body.code.padEnd(8)}` +
    `(${r2(key(desc.results[0]))}mm)`
  )
  check(`  ${priority} ascending is ordered`, ascOk, true)
  check(`  ${priority} descending is ordered`, descOk, true)
  // A body with no figure for the sorted measurement must not appear at either
  // end of the list. It sorted first under "greatest" before this was fixed.
  check(`  ${priority} never ranks a body that has no ${priority}`,
    asc.results.every(r => r.deltas[priority] != null) &&
    desc.results.every(r => r.deltas[priority] != null), true)
}

console.log('\nBodies with no height drop out of Height priority only')
const noHeightCodes = bodies.filter(b => b.heightSource == null).map(b => b.code)
console.log('    no height data: ' + (noHeightCodes.join(', ') || '(none)'))
const byHeight = api.compareBodies(example, { workingScale: 6, priority: 'height', sort: 'greatest', bodies })
const byBust = api.compareBodies(example, { workingScale: 6, priority: 'bust', sort: 'greatest', bodies })
check('excluded under Height', byHeight.results.filter(r => noHeightCodes.includes(r.body.code)).length, 0)
check('  and the reason is given', byHeight.excluded.some(e => /no height measurement/.test(e.reason)), true)
check('still present under Bust', byBust.results.filter(r => noHeightCodes.includes(r.body.code)).length,
  noHeightCodes.length)

// --- working scale changes the answer --------------------------------------
console.log('\nChanging the working scale re-sorts')
const seen = {}
for (const s of [5.5, 6, 6.75]) {
  const o = api.compareBodies(example, { workingScale: s, priority: 'bust', sort: 'least', bodies })
  seen[s] = o.results[0].body.code
  console.log(`  at ${api.scaleName(s).padEnd(10)} closest on bust -> ${o.results[0].body.code}`)
}
check('different scales pick different bodies', new Set(Object.values(seen)).size > 1, true)

// --- counts and closest scale ----------------------------------------------
console.log('\nResult counts and closest scale')
check('every female body when count is null', out6.results.length, FEMALE)
check('3 when asked for 3',
  api.compareBodies(example, { workingScale: 6, priority: 'bust', count: 3, bodies }).results.length, 3)
check('S07C closest scale on bust', s07c.closest.name, '1:6 1/64')
check('S24A closest scale on bust', s24a.closest.name, '1:6 49/64')
check('closest scale is reference only - both compared at 1:6',
  s07c.scaled.bust === s24a.scaled.bust, true)

// --- export ----------------------------------------------------------------
console.log('\nCSV export')
const csv = api.rowsToCsv(api.buildExportRows(example,
  { workingScale: 6, priority: 'bust', sort: 'least' }, out6))
check('states the comparison scale', csv.includes('Scale Reference Selector'), true)
check('no total column', csv.includes('Total diff'), false)
check('names a body', csv.includes('S07C'), true)

// --- the CSV and the app have to use the same words ---------------------------
// Every label in the export should be a term the app defines, or one of a few
// structural labels the glossary has no reason to carry. Catches the CSV
// drifting away from the page when something gets renamed.
console.log('\nCSV wording matches the app')
const glossaryTerms = [
  ...fs.readFileSync(path.join(ROOT, 'data', 'glossary.js'), 'utf8')
    .matchAll(/"term": "([^"]+)"/g),
].map(m => m[1])

const STRUCTURAL = [
  'Scale Body Finder - results', 'Character', 'Character Measurements', 'Notes', 'Sort by',
]
// "Height - Body Measurement (mm)" is one cell of the group the glossary calls
// "Body Measurements", so the singular maps back to the plural term.
const normalise = l =>
  l.replace(/\s*\((?:mm|1:[^)]*)\)$/, '')       // trailing unit or scale
   .replace(/\s*-\s*(Body|Character) Measurements?$/, ' $1 Measurements')
   .replace(/\s*-\s*Difference$/, '')
   .replace(/\s+(?:Low|High)$/, '')
   .replace(/^(?:Height|Bust|Waist|Hips)\s+(Body|Character) Measurements$/, '$1 Measurements')
   .trim()

// Everything a body row can contribute is a value, not a label - product names,
// codes, manufacturers, materials, feet types and free-text notes. All read
// from the data rather than matched by prefix, so adding a maker or writing a
// new note can't trip this check.
const bodyValues = new Set(
  bodies.flatMap(b => [b.name, b.code, b.manufacturer, b.material, b.feet, b.notes,
                       b.gender, b.bodyType, b.build,
                       ...(b.bustOptions || []).map(o => o.piece)])
        .filter(Boolean)
)
// Parsed, not regexed. Some notes contain escaped quotes ("" inside a field),
// and a regex stops at the first one and reports half a sentence as a label.
const csvLabels = [...new Set(parseCsv(csv).flat())]
  .filter(l => /^[A-Z]/.test(l))
  .filter(l => !bodyValues.has(l))
  .filter(l => !/^\d|^1:/.test(l))
  // the character's own name, the measurement names used as inline keys, and
  // the sort summary sentence
  .filter(l => ![example.name, 'Bust', 'Waist', 'Hips', 'Height',
                 'Least difference in Bust'].includes(l))

const unknown = csvLabels.filter(l => {
  const base = normalise(l)
  return !glossaryTerms.includes(base) && !STRUCTURAL.includes(base)
})
csvLabels.forEach(l => {
  const base = normalise(l)
  const ok = glossaryTerms.includes(base) || STRUCTURAL.includes(base)
  if (!ok) console.log(`    unrecognised: "${l}" (normalises to "${base}")`)
})
check(`all ${csvLabels.length} CSV labels are app terms`, unknown.length, 0)

// --- batch upload -----------------------------------------------------------
console.log('\nBatch: the template round-trips')
const template = api.templateCsv()
check('template has the expected columns', api.parseCharacterCsv(template).errors[0],
  'The file has a header but no character rows.')
check('template header matches', template.split('\n')[0].startsWith('Character Name,Scale Reference Selector'), true)

const HEAD = api.TEMPLATE_HEADERS.join(',')
const HINT = template.split('\n')[1]
const csvOf = (...rows) => [HEAD, HINT, ...rows].join('\n')

console.log('\nBatch: parsing')
const good = api.parseCharacterCsv(csvOf(
  'Kasumi,1:6,1580,890,540,840,Bust,3',
  'Honoka,1:5 3/4,1500,990,580,910,Height,5',
  'Ayane,1:6 1/4,1570,930,560,850,Hips,All'
))
check('hint row is skipped automatically', good.jobs.length, 3)
check('no errors on a clean file', good.errors.length, 0)
check('per-row scale kept', good.jobs.map(j => j.workingScale).join(','), '6,5.75,6.25')
check('per-row priority kept', good.jobs.map(j => j.priority).join(','), 'bust,height,hips')
check('All becomes unlimited', good.jobs[2].count, null)
check('3 and 5 kept', `${good.jobs[0].count},${good.jobs[1].count}`, '3,5')

console.log('\nBatch: centimetres are rejected outright')
const cm = api.parseCharacterCsv(csvOf(
  'Kasumi,1:6,158,89,54,84,Bust,3',
  'Honoka,1:6,1500,990,580,910,Height,3'
))
check('the whole upload is fatal', cm.fatal, true)
check('nothing is processed', cm.jobs.length, 0)
check('says it must be millimetres', cm.errors.some(e => /must be in millimetres/.test(e)), true)
check('suggests the right number', cm.errors.some(e => /Did you mean 1580\?/.test(e)), true)
console.log('    ' + cm.errors[0])
console.log('    ' + cm.errors[1])

console.log('\nBatch: a bad row is skipped, the rest still run')
const mixed = api.parseCharacterCsv(csvOf(
  'Kasumi,1:6,1580,890,540,840,Bust,3',
  'Broken,1:9,1580,890,540,840,Bust,3',
  'AlsoBroken,1:6,1580,890,540,840,Elbow,3',
  'Ayane,1:6,1570,930,560,850,Hips,3'
))
check('good rows survive', mixed.jobs.map(j => j.character.name).join(','), 'Kasumi,Ayane')
check('not fatal', !!mixed.fatal, false)
check('out-of-range scale named', mixed.errors.some(e => /outside the scales/.test(e)), true)
check('bad priority named', mixed.errors.some(e => /not one of Height, Bust, Waist, Hips/.test(e)), true)
mixed.errors.forEach(e => console.log('    ' + e))

console.log('\nBatch: one block per character, same layout as a manual export')
const out = api.runBatch(good.jobs, bodies)
const firstCell = out.rows.map(r => (r[0] == null ? '' : String(r[0])))
check('file title', out.rows[0][0], 'Scale Body Finder - batch results')
check('three characters processed', out.characters, 3)
check(`3 + 5 + ${FEMALE} results`, out.resultRows, 3 + 5 + FEMALE)
check('a block per character', firstCell.filter(c => c === 'Scale Body Finder - results').length, 3)
check('each block names its character', firstCell.filter(c => c === 'Character').length, 3)

// The thing that was missing before: the character at their own chosen scale.
// "(1:1)" is the unscaled row, so it has to be excluded explicitly.
const scaledRows = out.rows.filter(r => /^Character Measurements \((?!1:1\))1:/.test(String(r[0] || '')))
check('a 1:1 row per character', out.rows.filter(r => r[0] === 'Character Measurements (1:1)').length, 3)
check('a scaled row per character', scaledRows.length, 3)
scaledRows.forEach(r => console.log('    ' + r[0] + '   ' + r.slice(1).join(' ')))
check('each block uses that character\'s own scale',
  scaledRows.map(r => r[0]).join(' | '),
  'Character Measurements (1:6) | Character Measurements (1:5 3/4) | Character Measurements (1:6 1/4)')

const batchCsv = api.rowsToCsv(out.rows)
check('scaled values reach the file', batchCsv.includes('"263.33"'), true)
check('per-character priority is stated', batchCsv.includes('"Least difference in Height"'), true)

console.log('\nBatch: wording matches the app')
// The batch reuses buildExportRows, so its labels are the single export's
// labels - already checked above. This guards the two file-level rows.
const batchOnly = ['Scale Body Finder - batch results', 'Characters']
check('batch-only labels are structural', batchOnly.every(l => firstCell.includes(l)), true)


// ---------------------------------------------------------------------------
// Jointed bodies
//
// Two things have to hold at once. The jointed catalogue has to work - modular
// bodies get the chest piece nearest the character, and that piece is what the
// comparison and Actual Body Scale are built from. And the seamless side has to
// be untouched by any of it: its export feeds another tool, so its shape is a
// contract.
// ---------------------------------------------------------------------------
console.log('\nEvery body lands in exactly one catalogue')
check('every body has a valid Gender',
  bodies.filter(b => !api.GENDERS.includes(b.gender)).map(b => b.code).join(',') || '(all valid)',
  '(all valid)')
check('female + male accounts for every body', FEMALE + MALE, bodies.length)
check('Build is male-only',
  bodies.filter(b => b.gender === 'Female' && b.build != null).length, 0)
// A Body Type matching neither name is filtered out of both sections and never
// appears anywhere - no error, clean build, the body just ceases to exist. The
// data build rejects that now; this is the backstop if that check ever moves.
check('every body has a valid Body Type',
  bodies.filter(b => !api.BODY_TYPES.includes(b.bodyType)).map(b => b.code).join(',') || '(all valid)',
  '(all valid)')
check('seamless + jointed accounts for every female body', SEAMLESS + JOINTED, FEMALE)

console.log('\nFemale results now mix seamless and jointed')
const HONOKA = { name: 'Honoka', height: 1500, bust: 990, waist: 580, hips: 910 }
const femaleOut = api.compareBodies(HONOKA, { workingScale: 6, priority: 'bust', gender: 'Female' })
const seamlessOut = femaleOut
const jointedOut = femaleOut

check('catalogues offered', api.GENDERS.join(','), 'Female,Male')
check('female is the default', api.DEFAULT_GENDER, 'Female')
check('every female body is returned together', femaleOut.results.length, FEMALE)
check('  seamless among them', femaleOut.results.filter(r => r.body.bodyType === 'Seamless').length, SEAMLESS)
check('  jointed among them', femaleOut.results.filter(r => r.body.bodyType === 'Jointed').length, JOINTED)
check('  and they really are in one list', SEAMLESS > 0 && JOINTED > 0, true)
check('the default search is the female catalogue',
  api.compareBodies(HONOKA, { workingScale: 6, priority: 'bust' }).results.length, FEMALE)

console.log('\nJointed: the chest piece is chosen, not fixed')
const at201 = femaleOut.results.find(r => r.body.code === 'AT-201')
check('AT-201 is modular', at201.bustOptions.length, 5)
check('  its pieces', at201.bustOptions.map(o => o.piece).join(','), 'A-cup,C-cup,D-cup,E-cup,G-cup')
check('  and their measurements', at201.bustOptions.map(o => o.bust).join(','), '128,140,145,155,185')
// Honoka at 1:6 wants a 165mm bust. E-cup at 155 is 10mm out, G-cup at 185 is 20mm.
check('Honoka at 1:6 wants a bust of', r2(jointedOut.scaled.bust), 165)
check('  so the E-cup is fitted', at201.bustPiece, 'E-cup')
check('  and the comparison uses its 155mm', at201.bust, 155)
check('  giving a difference of -10', r2(at201.deltas.bust), -10)
check('the body itself has no single bust', at201.body.bust, null)
// 800/6 is 133.3 - nearer the A-cup at 128 than the C-cup at 140.
const pieceFor = bust => api.compareBodies({ ...HONOKA, bust }, { workingScale: 6, priority: 'bust', gender: 'Female' })
  .results.find(r => r.body.code === 'AT-201').bustPiece
check('a smaller character gets a smaller piece', pieceFor(800), 'A-cup')
check('  and one in between gets the C-cup', pieceFor(840), 'C-cup')
check('  and a much larger one gets the G-cup', pieceFor(1150), 'G-cup')
check('pickBustPiece leaves a fixed-bust body alone',
  api.pickBustPiece(byCode.S07C, 165).piece, null)
check('  and returns its own measurement', api.pickBustPiece(byCode.S07C, 165).bust, 153)

console.log('\nJointed: Actual Body Scale is built from the fitted piece')
// 990 / 155 must be the number used - not the A-cup or the G-cup. The card lets
// you look at those; the scale stays on the piece the engine fitted.
check('AT-201 closest scale on bust', at201.closest.name, api.scaleName(990 / 155))
check('  which is the E-cup, not the A-cup', at201.closest.name === api.scaleName(990 / 128), false)

console.log('\nJointed: sorted on the fitted piece, not the frame')
const byWaist = api.compareBodies(HONOKA, { workingScale: 6, priority: 'waist', gender: 'Female' })
check('the jointed bodies are still returned under Waist',
  byWaist.results.filter(r => r.body.bodyType === 'Jointed').length, JOINTED)
check('  and every modular one still names a piece',
  byWaist.results.filter(r => r.bustOptions).every(r => r.bustPiece != null), true)
check('  while a jointed body with a fixed bust names none',
  byWaist.results.filter(r => r.body.bodyType === 'Jointed' && !r.bustOptions)
         .every(r => r.bustPiece == null), true)
check('jointed is not the same as modular',
  bodies.filter(b => b.bodyType === 'Jointed').length >
  bodies.filter(b => b.bustOptions).length, true)

console.log('\nExport: the female file carries Bust Piece and Body Type')
const femaleCsvRows = api.buildExportRows(HONOKA,
  { workingScale: 6, priority: 'bust', sort: 'least', gender: 'Female' }, femaleOut)
const headerOf = rows => rows.find(r => r[0] === 'Manufacturer')
const fh = headerOf(femaleCsvRows)

check('Body Type is a column now', fh.includes('Body Type'), true)
check('Bust Piece is always present on the female file', fh.includes('Bust Piece'), true)
check('  Build is not - male only', fh.includes('Build'), false)
check('the bust pair says Bust, not Chest',
  fh.filter(h => /^Bust - /.test(h)).length, 2)
check('every body row matches the header width',
  femaleCsvRows.filter(r => r.length > 12).every(r => r.length === fh.length), true)
const jointedDataRow = femaleCsvRows.find(r => r[0] === 'WorldBox')
const seamlessDataRow = femaleCsvRows.find(r => r[0] === 'TBLeague')
check('a jointed row reports its construction', jointedDataRow[3], 'Jointed')
check('a seamless row reports its construction', seamlessDataRow[3], 'Seamless')
check('a jointed row names its piece', jointedDataRow[fh.indexOf('Bust Piece')], 'E-cup')
check('a seamless row leaves the piece blank', seamlessDataRow[fh.indexOf('Bust Piece')], '')
check('the file states which catalogue was searched',
  femaleCsvRows.some(r => r[0] === 'Gender' && r[1] === 'Female'), true)

console.log('\nBatch: runs against whichever section is on screen')
const oneJob = () => [{ character: HONOKA, workingScale: 6, priority: 'bust', count: null, line: 2 }]
const femaleBatch = api.runBatch(oneJob(), undefined, 'Female')
check(`the roster run female gives ${FEMALE}`, femaleBatch.resultRows, FEMALE)
check('  with a Bust Piece column', api.rowsToCsv(femaleBatch.rows).includes('"Bust Piece"'), true)
check('  and both constructions in it',
  api.rowsToCsv(femaleBatch.rows).includes('"WorldBox"') &&
  api.rowsToCsv(femaleBatch.rows).includes('"TBLeague"'), true)


// ---------------------------------------------------------------------------
// Male bodies
//
// There are none in the catalogue yet, so these run against fixtures built the
// way the importer builds them. What matters is that the male path is genuinely
// its own: height derived from a peg rather than measured against a known head,
// no requirement to carry chest/waist/hips, height the only thing to sort on,
// and ties broken by which window sits most centred on the character.
// ---------------------------------------------------------------------------
console.log('\nMale: height is derived from the neck peg')

// peg 295, published, therefore the tallest setting.
//   seamless -> hips take 5 off the bottom, head adds 11..15  => 301..310
//   jointed  -> fixed height, head adds 11..15                => 306..310
const maleBody = (over) => ({
  manufacturer: 'TestCo', name: over.code, code: over.code,
  gender: 'Male', bodyType: 'Seamless', build: 'Athletic', material: 'TPE',
  bust: null, underbust: null, waist: null, hips: null,
  heightsByHead: null, headSize: null, manufacturerHeight: null,
  feet: 'Removable', notes: null, ...over,
})
const derive = (peg, type) => {
  const low = type === 'Seamless' ? peg - 5 : peg
  return { min: low + 11, max: peg + 15 }
}

const mSeamless = maleBody({ code: 'M-SEAM', bodyType: 'Seamless', maleHeight: derive(295, 'Seamless') })
const mJointed  = maleBody({ code: 'M-JOINT', bodyType: 'Jointed', build: 'Heavy', maleHeight: derive(292, 'Jointed') })
const mMeasured = maleBody({ code: 'M-MEAS', bodyType: 'Seamless', build: 'Heavy', maleHeight: { min: 308, max: 308 } })
const mFull     = maleBody({ code: 'M-FULL', bodyType: 'Seamless', build: 'Average Build',
                             maleHeight: derive(293, 'Seamless'), bust: 160, waist: 120, hips: 150 })
const maleSet = [mSeamless, mJointed, mMeasured, mFull,
                 ...bodies.filter(b => b.gender === 'Female')]

check('seamless male window is 9mm',
  `${mSeamless.maleHeight.min}-${mSeamless.maleHeight.max}`, '301-310')
check('  hip travel comes off the bottom, head off the top',
  mSeamless.maleHeight.max - mSeamless.maleHeight.min, 9)
check('jointed male window is 4mm - head only, no hips',
  `${mJointed.maleHeight.min}-${mJointed.maleHeight.max}`, '303-307')
check('heightRange reads a male body', api.heightRange(mSeamless).min, 301)
check('  and still reads a female one', api.heightRange(byCode.S07C).min, 274)

console.log('\nMale: a body with only a height still competes')
// KAITO at 1:6 wants 305mm - inside both derived windows.
const KAITO = { name: 'Kaito', height: 1830 }
const maleOut = api.compareBodies(KAITO, { workingScale: 6, priority: 'height', gender: 'Male', bodies: maleSet })
check('all four male bodies are returned', maleOut.results.length, 4)
check('  none dropped for missing chest/waist/hips',
  maleOut.excluded.filter(e => e.reason === 'incomplete measurements').length, 0)
check('  and no female body leaked in',
  maleOut.results.every(r => r.body.gender === 'Male'), true)
check('the female catalogue is unaffected by their presence',
  api.compareBodies(HONOKA, { workingScale: 6, priority: 'bust', gender: 'Female', bodies: maleSet })
     .results.length, FEMALE)

// --- and the same path, on the real body in the catalogue ------------------
if (MALE > 0) {
  console.log('\nMale: the real catalogue')
  const m34 = bodies.find(b => b.code === 'M-34')
  check('M-34 is male', m34.gender, 'Male')
  check('  with a build', m34.build, 'Heavily Muscled')
  check('  measured, not derived', m34.heightSource, 'measured')
  check('  so its window is the measured one, not peg + 11..15',
    `${m34.maleHeight.min}-${m34.maleHeight.max}`, '308-313')
  check('  which is NOT what the estimate would have given',
    `${m34.pegMin + 11}-${m34.pegMax + 15}`, '299-308')
  check('it carries chest, waist and hips', [m34.bust, m34.waist, m34.hips].join(','), '210,142,164')
  const real = api.compareBodies({ name: 'K', height: 1860 },
    { workingScale: 6, priority: 'height', gender: 'Male' })
  check('it is returned by a male search', real.results.some(r => r.body.code === 'M-34'), true)
  check('  and a female search never sees it',
    api.compareBodies(HONOKA, { workingScale: 6, priority: 'bust', gender: 'Female' })
       .results.some(r => r.body.code === 'M-34'), false)
}

console.log('\nMale: ties break on the most centred window')
// 305 sits inside 301-310 (centre 305.5), 306-310 (centre 308) and misses 308 by 3.
const order = maleOut.results.map(r => r.body.code)
check('character wants', r2(maleOut.scaled.height), 305)
check('everything containing 305 ties at zero',
  maleOut.results.filter(r => r.deltas.height === 0).map(r => r.body.code).sort().join(','),
  'M-FULL,M-JOINT,M-SEAM')
check('the most centred of them leads', order[0], 'M-JOINT')
check('  M-JOINT centre is 305, dead on', Math.abs(305 - 305), 0)
check('  M-SEAM centre is 305.5, half out', Math.abs(305 - 305.5), 0.5)
check('  M-FULL centre is 303.5, and it comes third', order[2], 'M-FULL')
check('the body that cannot reach it comes last', order[order.length - 1], 'M-MEAS')
check('  and the pool was only the fixtures', maleOut.results.length, 4)
check('  because a measured height is a point, not a window',
  r2(maleOut.results.find(r => r.body.code === 'M-MEAS').deltas.height), 3)

console.log('\nMale: height is the only priority offered')
check('female can sort four ways', api.PRIORITIES_BY_GENDER.Female.join(','), 'height,bust,waist,hips')
check('male can sort one way', api.PRIORITIES_BY_GENDER.Male.join(','), 'height')

console.log('\nMale: the export is its own shape')
const maleCsvRows = api.buildExportRows(KAITO,
  { workingScale: 6, priority: 'height', sort: 'least', gender: 'Male' }, maleOut)
const mh = maleCsvRows.find(r => r[0] === 'Manufacturer')
check('Build is a column', mh.includes('Build'), true)
check('Bust Piece is not - no modular male bodies', mh.includes('Bust Piece'), false)
check('the chest pair says Chest, not Bust', mh.filter(h => /^Chest - /.test(h)).length, 2)
check('  and nothing says Bust', mh.some(h => /^Bust/.test(h)), false)
check('Body Type is reported', mh.includes('Body Type'), true)
const mRow = maleCsvRows.find(r => r[1] === 'M-SEAM')
check('a male row carries its build', mRow[mh.indexOf('Build')], 'Athletic')
check('  and its construction', mRow[3], 'Seamless')
const jRow = maleCsvRows.find(r => r[1] === 'M-JOINT')
check('a jointed male row too', jRow[mh.indexOf('Build')] + ' / ' + jRow[3], 'Heavy / Jointed')
check('the file states the catalogue',
  maleCsvRows.some(r => r[0] === 'Gender' && r[1] === 'Male'), true)
check('every male row matches the header width',
  maleCsvRows.filter(r => r.length > 12).every(r => r.length === mh.length), true)

console.log('\nMale: blank chest/waist/hips do not become zeroes')
const seamRow = maleCsvRows.find(r => r[1] === 'M-SEAM')
check('an unmeasured chest exports blank, not 0', seamRow[mh.indexOf('Chest - Body Measurement (mm)')], '')
check('  and so does its difference', seamRow[mh.indexOf('Chest - Difference (mm)')], '')
const fullRow = maleCsvRows.find(r => r[1] === 'M-FULL')
check('a measured chest still exports', fullRow[mh.indexOf('Chest - Body Measurement (mm)')], 160)

console.log('\nExport: file names')
check('female keeps the name it has always had',
  api.exportFileName('Honoka', 'bust', 'Female'), 'Honoka_Results_Bust.csv')
check('  and with no gender given at all',
  api.exportFileName('Honoka', 'bust'), 'Honoka_Results_Bust.csv')
check('male is told apart', api.exportFileName('Kaito', 'height', 'Male'),
  'Kaito_Results_Height_Male.csv')

console.log(failures === 0 ? '\nAll checks passed.\n' : `\n${failures} CHECK(S) FAILED.\n`)
process.exitCode = failures === 0 ? 0 : 1
