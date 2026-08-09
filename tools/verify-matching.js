/**
 * tools/verify-matching.js
 *
 *     node tools/verify-matching.js
 *
 * Sanity check on the engine, run against the real source in utils/ rather
 * than a copy of it. The app modules are ES modules and this is plain Node,
 * so their import/export lines are stripped and the bodies evaluated together
 * in one scope - crude, but it means this tests the shipped code and not a
 * reimplementation of it.
 *
 * Kasumi is the known-good case: the user built her figure on a TBLeague S07C
 * and independently arrived at a x0.172 multiplier, i.e. 1:5 13/16. If bust
 * priority doesn't surface that, the maths is wrong.
 */

const fs = require('fs')
const path = require('path')
const { loadBodies } = require('./build-body-data')

const ROOT = path.join(__dirname, '..')

// --- load the real modules -------------------------------------------------
const strip = src =>
  src
    .replace(/^\s*import[\s\S]*?from\s+['"][^'"]+['"]\s*$/gm, '')
    .replace(/^\s*export\s+default\s+/gm, 'var __default = ')
    .replace(/^\s*export\s+/gm, '')

const { bodies } = loadBodies()
const sandbox = { BODIES: bodies, console }
const src = [
  strip(fs.readFileSync(path.join(ROOT, 'utils', 'scaleUtils.js'), 'utf8')),
  strip(fs.readFileSync(path.join(ROOT, 'utils', 'matching.js'), 'utf8')),
  'return { findMatches, atSixth, scaleName, snapDivisor, scaleInRange, buildExportRows, rowsToCsv, SIXTH }',
].join('\n')

const api = new Function('BODIES', 'console', src)(bodies, console)

// --- helpers ---------------------------------------------------------------
let failures = 0
function check(label, actual, expected, tol = 0) {
  const ok = typeof expected === 'number' ? Math.abs(actual - expected) <= tol : actual === expected
  if (!ok) failures++
  console.log(`  ${ok ? 'PASS' : 'FAIL'}  ${label}: ${actual}${ok ? '' : `   (expected ${expected})`}`)
}

// --- scale naming ----------------------------------------------------------
console.log('\nScale naming')
check('1/0.172 -> name', api.scaleName(1 / 0.172), '1:5 13/16')
check('6 -> name', api.scaleName(6), '1:6')
check('4.015625 -> name', api.scaleName(4.015625), '1:4 1/64')
check('5.8125 -> name', api.scaleName(5.8125), '1:5 13/16')
check('7.984375 -> name', api.scaleName(7.984375), '1:7 63/64')
check('1:4 in range', api.scaleInRange(4), true)
check('1:8 out of range', api.scaleInRange(8), false)

// --- Kasumi ----------------------------------------------------------------
const kasumi = { name: 'Kasumi', height: 1580, bust: 890, waist: 540, hips: 840 }

console.log('\nKasumi at true 1:6 (mm)')
const sixth = api.atSixth(kasumi)
check('height', +sixth.height.toFixed(2), 263.33, 0.01)
check('bust', +sixth.bust.toFixed(2), 148.33, 0.01)
check('waist', +sixth.waist.toFixed(2), 90.0, 0.01)
check('hips', +sixth.hips.toFixed(2), 140.0, 0.01)

console.log('\nKasumi, bust priority - closest 3')
const res = api.findMatches(kasumi, 'bust', 3, bodies)
res.matches.forEach(m => {
  const d = m.deltas
  console.log(
    `  ${(m.body.code + '        ').slice(0, 9)} ${m.scaleName.padEnd(12)}` +
    ` x${m.multiplier.toFixed(5)}` +
    `  bust ${d.bust.toFixed(2).padStart(7)}  waist ${d.waist.toFixed(2).padStart(7)}` +
    `  hips ${d.hips.toFixed(2).padStart(7)}   off ${m.totalOff.toFixed(2)}` +
    (m.uncertain ? '  +/-1mm' : '')
  )
})

const first = res.matches[0]
check('closest body is S07C', first.body.code, 'S07C')
check('S07C scale name', first.scaleName, '1:5 13/16')
check('S07C multiplier ~0.172', +first.multiplier.toFixed(4), 0.1719, 0.0002)
check('anchor (bust) is exact', +first.deltas.bust.toFixed(6), 0)
check('considered all 23 bodies', res.considered, 23)
check('excluded none', res.excluded.length, 0)

console.log('\nKasumi, other priorities')
for (const p of ['waist', 'hips']) {
  const r = api.findMatches(kasumi, p, 3, bodies)
  const anchorExact = r.matches.every(m => Math.abs(m.deltas[p]) < 1e-9)
  console.log(`  ${p.padEnd(6)} -> ${r.matches.map(m => `${m.body.code} (${m.scaleName})`).join(', ')}`)
  check(`  ${p} anchor exact on every match`, anchorExact, true)
}

// --- Honoka: the stress case ----------------------------------------------
console.log('\nHonoka (990 bust on 1500 height) - the hard one')
const honoka = { name: 'Honoka', height: 1500, bust: 990, waist: 580, hips: 890 }
const h = api.findMatches(honoka, 'bust', 3, bodies)
h.matches.forEach(m => {
  console.log(
    `  ${(m.body.code + '        ').slice(0, 9)} ${m.scaleName.padEnd(12)}` +
    `  waist ${m.deltas.waist.toFixed(2).padStart(7)}  hips ${m.deltas.hips.toFixed(2).padStart(7)}` +
    `   off ${m.totalOff.toFixed(2)}`
  )
})
check('Honoka still returns options', h.matches.length, 3)
check('Honoka fits worse than Kasumi', h.matches[0].totalOff > first.totalOff, true)

// --- export ----------------------------------------------------------------
console.log('\nCSV export')
const csv = api.rowsToCsv(api.buildExportRows(kasumi, 'bust', 'cm', res))
check('has a header row', csv.includes('Manufacturer'), true)
check('names the closest body', csv.includes('S07C'), true)
check('says not ranked', csv.includes('not ranked'), true)

// --- result ----------------------------------------------------------------
console.log(failures === 0 ? '\nAll checks passed.\n' : `\n${failures} CHECK(S) FAILED.\n`)
process.exitCode = failures === 0 ? 0 : 1
