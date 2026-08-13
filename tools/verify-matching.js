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
const { loadBodies } = require('./build-body-data')

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
            TEMPLATE_HEADERS, BATCH_HEADERS }`,
].join('\n')

const api = new Function('BODIES', 'console', src)(bodies, console)
const byCode = Object.fromEntries(bodies.map(b => [b.code, b]))

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
const mfr = api.heightRange(byCode['SR-AD01'])
check('a manufacturer body has no span', mfr.min === mfr.max, true)
check('  and uses their figure', mfr.min, 310)

// --- sorting ---------------------------------------------------------------
console.log('\nSorting by difference in the chosen measurement')
for (const priority of api.PRIORITIES) {
  const asc = api.compareBodies(example, { workingScale: 6, priority, sort: 'least', bodies })
  const desc = api.compareBodies(example, { workingScale: 6, priority, sort: 'greatest', bodies })
  const key = r => Math.abs(r.deltas[priority])
  const ascOk = asc.results.every((r, i, a) => i === 0 || key(a[i - 1]) <= key(r))
  const descOk = desc.results.every((r, i, a) => i === 0 || key(a[i - 1]) >= key(r))
  console.log(
    `  ${priority.padEnd(6)} least -> ${asc.results[0].body.code.padEnd(8)}` +
    `(${r2(key(asc.results[0]))}mm)   greatest -> ${desc.results[0].body.code.padEnd(8)}` +
    `(${r2(key(desc.results[0]))}mm)`
  )
  check(`  ${priority} ascending is ordered`, ascOk, true)
  check(`  ${priority} descending is ordered`, descOk, true)
}

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
check('all bodies when count is null', out6.results.length, 23)
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

const csvLabels = [...new Set(
  [...csv.matchAll(/"([A-Z][^"]*)"/g)].map(m => m[1])
)].filter(l => !/^\d|^1:|^S\d|^VCD|^SR-|^TB-|^N-1A/.test(l))
  // values, not labels: the character's own name, manufacturers, materials,
  // feet types, the measurement names used as inline keys, and the sort summary
  .filter(l => ![example.name, 'TBLeague', 'VeryCool', 'Novan Studio', 'TPE', 'Silicone',
                 'Attached', 'Removable', 'Bust', 'Waist', 'Hips', 'Height',
                 'Least difference in Bust'].includes(l))
  .filter(l => !l.startsWith('There are versions') && !l.startsWith('Model line')
            && !l.startsWith('This is a') && !l.startsWith('This is an'))

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
  'Honoka,1:5 3/4,1500,990,580,890,Height,5',
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
  'Honoka,1:6,1500,990,580,890,Height,3'
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

console.log('\nBatch: different scales really do give different results')
const out = api.runBatch(good.jobs, bodies)
check('one header row plus results', out.rows[0][0], 'Character')
check('three characters processed', out.characters, 3)
check('3 + 5 + 23 result rows', out.resultRows, 31)
const bodyCol = api.BATCH_HEADERS.indexOf('Product Name')
const charCol = api.BATCH_HEADERS.indexOf('Character')
const scaleCol = api.BATCH_HEADERS.indexOf('Scale Reference Selector')
const forChar = n => out.rows.slice(1).filter(r => r[charCol] === n)
console.log('    Kasumi @ ' + forChar('Kasumi')[0][scaleCol] + ' -> ' + forChar('Kasumi').map(r => r[bodyCol]).join(', '))
console.log('    Honoka @ ' + forChar('Honoka')[0][scaleCol] + ' -> ' + forChar('Honoka').map(r => r[bodyCol]).join(', '))
check('each row carries its own scale',
  `${forChar('Kasumi')[0][scaleCol]}|${forChar('Honoka')[0][scaleCol]}|${forChar('Ayane')[0][scaleCol]}`,
  '1:6|1:5 3/4|1:6 1/4')

console.log('\nBatch: wording matches the app')
const batchUnknown = api.BATCH_HEADERS.filter(l => {
  const base = normalise(l).replace(/\s*\(1:1\)$/, '')
  return !glossaryTerms.includes(base) && !STRUCTURAL.includes(base) &&
         !['Character Measurement'].includes(base)
})
batchUnknown.forEach(l => console.log(`    unrecognised: "${l}"`))
check(`all ${api.BATCH_HEADERS.length} batch labels are app terms`, batchUnknown.length, 0)

console.log(failures === 0 ? '\nAll checks passed.\n' : `\n${failures} CHECK(S) FAILED.\n`)
process.exitCode = failures === 0 ? 0 : 1
