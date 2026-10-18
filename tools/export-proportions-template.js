/**
 * tools/export-proportions-template.js
 *
 *     node tools/export-proportions-template.js [outputDir]
 *
 * A worksheet for the six proportion measurements, one row per body already in
 * the catalogue. Fill in what you can and hand it back; the values get merged
 * into data/bodies.csv rather than replacing anything.
 *
 * Reference columns are included so you can tell which body a row is without
 * cross-checking the catalogue. They are marked READ ONLY and are ignored on
 * the way back in - the circumferences are not being re-entered here.
 *
 * Every column is pre-filled from whatever the catalogue already holds, so a
 * sheet handed back and regenerated comes round complete rather than blank.
 * Correct anything your own measurement disagrees with.
 */

const fs = require('fs')
const path = require('path')
const { loadBodies } = require('./build-body-data')

const ROOT = path.join(__dirname, '..')

/** The six, in the order they will appear on the card. */
const PROPORTIONS = [
  'Breast Height (mm)',
  'Breast Width (mm)',
  'Breast Depth (mm)',
  'Waist Width (mm)',
  'Hip Width (mm)',
  'Shoulder Width (mm)',
]

const REFERENCE = ['Manufacturer', 'Product Code', 'Bust (mm)', 'Waist (mm)', 'Hips (mm)', 'You measured this one']

/** Catalogue field behind each worksheet column, so filled rows come back filled. */
const FIELD = {
  'Breast Height (mm)': 'breastHeight',
  'Breast Width (mm)': 'breastWidth',
  'Breast Depth (mm)': 'breastDepth',
  'Waist Width (mm)': 'waistWidth',
  'Hip Width (mm)': 'hipWidth',
  'Shoulder Width (mm)': 'shoulder',
}

const HINTS = {
  'Manufacturer': 'READ ONLY - which body this row is',
  'Product Code': 'READ ONLY - which body this row is',
  'Bust (mm)': 'READ ONLY - circumference, for identifying the row',
  'Waist (mm)': 'READ ONLY - circumference, for identifying the row',
  'Hips (mm)': 'READ ONLY - circumference, for identifying the row',
  'You measured this one': 'READ ONLY - yes means you have it in hand; no means manufacturer figures only',
  'Breast Height (mm)': 'Bottom of the breast up to where it meets the chest',
  'Breast Width (mm)': 'One breast across, not both',
  'Breast Depth (mm)': 'The breast itself - NOT through to the back',
  'Waist Width (mm)': 'Across the waist at its narrowest',
  'Hip Width (mm)': 'Across the hips at their widest',
  'Shoulder Width (mm)': 'Straight across. Pre-filled from the catalogue - correct it if yours differs',
}

const cell = v => (/[",\n]/.test(String(v ?? '')) ? `"${String(v).replace(/"/g, '""')}"` : String(v ?? ''))
const toCsv = rows => rows.map(r => r.map(cell).join(',')).join('\r\n') + '\r\n'

function main() {
  const outDir = process.argv[2] ? path.resolve(process.argv[2]) : path.join(ROOT, 'exports')
  fs.mkdirSync(outDir, { recursive: true })

  const { bodies } = loadBodies()
  const header = [...REFERENCE, ...PROPORTIONS]

  const missing = header.filter(h => !(h in HINTS))
  if (missing.length) {
    console.log(`PROBLEM: no hint for: ${missing.join(', ')}`)
    process.exitCode = 1
    return
  }

  const rows = [header, header.map(h => HINTS[h])]
  let prefilled = 0

  // Hand-measured bodies first - those are the ones you can actually reach.
  const live = bodies.filter(b => b.gender === 'Female')
  const measured = b => /3D Print/i.test(b.head || '') && b.pegMax != null
  const ordered = [...live.filter(measured), ...live.filter(b => !measured(b))]

  for (const b of ordered) {
    const row = header.map(h => {
      switch (h) {
        case 'Manufacturer': return b.manufacturer || ''
        case 'Product Code': return b.code
        case 'Bust (mm)': return b.bust ?? (b.bustOptions ? 'modular' : '')
        case 'Waist (mm)': return b.waist ?? ''
        case 'Hips (mm)': return b.hips ?? ''
        case 'You measured this one': return measured(b) ? 'yes' : 'no'
        default: return b[FIELD[h]] ?? ''
      }
    })
    if (PROPORTIONS.every(c => row[header.indexOf(c)] !== '')) prefilled++
    rows.push(row)
  }

  const out = path.join(outDir, 'Scale Body Proportions Worksheet.csv')
  fs.writeFileSync(out, '﻿' + toCsv(rows), 'utf8')

  const have = ordered.filter(b => b.shoulder != null).length
  console.log(`${ordered.length} bodies - ${ordered.filter(measured).length} you measured, ${ordered.filter(b => !measured(b)).length} on manufacturer figures`)
  console.log(`shoulder width pre-filled for ${have}; ${prefilled} row(s) already complete`)
  console.log(`wrote ${path.relative(process.cwd(), out)}`)
}

if (require.main === module) main()
module.exports = { PROPORTIONS }
