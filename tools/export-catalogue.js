/**
 * tools/export-catalogue.js
 *
 *     node tools/export-catalogue.js [outputDir]
 *
 * Writes two spreadsheets:
 *
 *   Scale_Body_Finder_Catalogue.csv     the whole roster as it stands
 *   Scale_Body_Finder_New_Body_Template.csv   a blank row to fill in
 *
 * Both are generated from `data/bodies.csv` itself rather than from a list kept
 * here, so neither can fall behind the real schema. Add a column to the data and
 * both files grow it on the next run - which is the failure this exists to
 * prevent, after an edit came back on a layout two columns out of date.
 *
 * The catalogue is a faithful copy: same columns, same order, same rows. Edit it
 * and hand it straight back.
 */

const fs = require('fs')
const path = require('path')
const { loadBodies, parseCsv } = require('./build-body-data')

const ROOT = path.join(__dirname, '..')
const CSV = path.join(ROOT, 'data', 'bodies.csv')

/**
 * What each column is for. Keyed by column name so a renamed or new column
 * shows up as a missing hint rather than silently landing under the wrong one.
 */
const HINTS = {
  'Manufacturer': 'Required',
  'Product Name': 'Required',
  'Product Code': 'Required - must be unique',
  'Material': 'Required - TPE, Silicone or Plastic',
  'Gender': 'REQUIRED - exactly "Female" or "Male". Decides which catalogue the body lands in',
  'Body Type': 'REQUIRED - exactly "Seamless" or "Jointed", nothing else',
  'Build': 'MALE ONLY, and required there. One of: Super Tall/Athletic, Super Heavily Muscled, Heavily Muscled, Average Muscle Build, Average Build, Athletic, Asian Athletic, Asian Average, Heavy. Leave blank for female bodies',
  'Neck Peg Min - Measured (mm)': 'Your own measurement, if you have the body. N/A if not',
  'Neck Peg Max - Measured (mm)': 'Your own measurement, if you have the body. N/A if not',
  'Neck Peg Max - Mfr Stated (mm)': "The manufacturer's published figure, taken as the TALLEST setting. Male bodies: this is the one measurement that matters, height is derived from it",
  'Head Used': 'Which head you measured with, e.g. Custom 38mm 3D Print. N/A if not measured',
  'Height with Head (Min)': 'Height at the shortest hip setting - yours or the maker\'s. Taken at face value and becomes a range the body can be posed across, so leave it N/A rather than guessing',
  'Height with Head (max)': 'Measured height at the tallest hip setting. N/A if unknown',
  'Bust Piece': 'MODULAR BODIES ONLY - the cup name, e.g. A-cup. One row per piece. Leave blank otherwise',
  'Bust (mm)': 'Female: REQUIRED, body is dropped without it. Male: optional, this is the chest',
  'Underbust (mm)': 'Optional - shown on the card only',
  'Waist (mm)': 'Female: REQUIRED, body is dropped without it. Male: optional',
  'Hips (mm)': 'Female: REQUIRED, body is dropped without it. Male: optional',
  'Shoulder Width (mm)': 'Optional - shown on the card only',
  'Arm Length (mm)': 'Optional - shown on the card only',
  'Leg Inseam (mm)': 'Optional - shown on the card only',
  'Feet': 'Attached or Removable',
  'Image': 'Filename only, e.g. VeryCool VCD-08.jpg. Send the file too',
  'Notes': 'Optional - free text, shown at the bottom of the card',
}

/**
 * Filled-in rows showing the three shapes a body can take: a plain female body,
 * one row of a modular female body, and a male body carrying nothing but a peg
 * height and a build. Delete them before sending the file back.
 */
const EXAMPLES = {
  male: {
    'Manufacturer': 'EXAMPLE - delete this row',
    'Product Name': 'M99',
    'Product Code': 'M99',
    'Material': 'TPE',
    'Gender': 'Male',
    'Body Type': 'Seamless',
    'Build': 'Heavily Muscled',
    'Neck Peg Min - Measured (mm)': 'N/A',
    'Neck Peg Max - Measured (mm)': 'N/A',
    'Neck Peg Max - Mfr Stated (mm)': '295',
    'Head Used': 'N/A',
    'Height with Head (Min)': 'N/A',
    'Height with Head (max)': 'N/A',
    'Bust Piece': '',
    'Bust (mm)': 'N/A',
    'Underbust (mm)': 'N/A',
    'Waist (mm)': 'N/A',
    'Hips (mm)': 'N/A',
    'Shoulder Width (mm)': 'N/A',
    'Arm Length (mm)': 'N/A',
    'Leg Inseam (mm)': 'N/A',
    'Feet': 'Removable',
    'Image': 'TBLeague M99.jpg',
    'Notes': 'A peg height and a build is enough for a male body. Height is derived from the peg.',
  },
  seamless: {
    'Manufacturer': 'EXAMPLE - delete this row',
    'Product Name': 'VCD-99',
    'Product Code': 'VCD-99',
    'Material': 'Silicone',
    'Gender': 'Female',
    'Body Type': 'Seamless',
    'Build': '',
    'Neck Peg Min - Measured (mm)': 'N/A',
    'Neck Peg Max - Measured (mm)': 'N/A',
    'Neck Peg Max - Mfr Stated (mm)': '265',
    'Head Used': 'N/A',
    'Height with Head (Min)': 'N/A',
    'Height with Head (max)': 'N/A',
    'Bust Piece': '',
    'Bust (mm)': '130',
    'Underbust (mm)': 'N/A',
    'Waist (mm)': '88',
    'Hips (mm)': '170',
    'Shoulder Width (mm)': '60',
    'Arm Length (mm)': '90',
    'Leg Inseam (mm)': '138',
    'Feet': 'Removable',
    'Image': 'VeryCool VCD-99.jpg',
    'Notes': '',
  },
  jointed: {
    'Manufacturer': 'EXAMPLE - delete this row',
    'Product Name': 'AT-999',
    'Product Code': 'AT-999',
    'Material': 'Plastic',
    'Gender': 'Female',
    'Body Type': 'Jointed',
    'Build': '',
    'Neck Peg Min - Measured (mm)': '248',
    'Neck Peg Max - Measured (mm)': '248',
    'Neck Peg Max - Mfr Stated (mm)': '248',
    'Head Used': 'Custom 38mm 3D Print',
    'Height with Head (Min)': '266',
    'Height with Head (max)': '266',
    'Bust Piece': 'A-cup',
    'Bust (mm)': '128',
    'Underbust (mm)': 'N/A',
    'Waist (mm)': '98',
    'Hips (mm)': '156',
    'Shoulder Width (mm)': '66',
    'Arm Length (mm)': '86',
    'Leg Inseam (mm)': '115',
    'Feet': 'Removable',
    'Image': 'WorldBox AT-999.jpg',
    'Notes': 'One row per chest piece. Everything except Bust Piece and Bust must match across them.',
  },
}

const cell = v => (/[",\n]/.test(String(v ?? '')) ? `"${String(v).replace(/"/g, '""')}"` : String(v ?? ''))
const toCsv = rows => rows.map(r => r.map(cell).join(',')).join('\r\n') + '\r\n'

function main() {
  const outDir = process.argv[2] ? path.resolve(process.argv[2]) : path.join(ROOT, 'exports')
  fs.mkdirSync(outDir, { recursive: true })

  const raw = fs.readFileSync(CSV, 'utf8')
  const rows = parseCsv(raw)
  const header = rows[0].map(h => h.trim())
  const data = rows.slice(1)

  // --- the catalogue: a faithful copy, straight back out ---
  const cataloguePath = path.join(outDir, 'Scale_Body_Finder_Catalogue.csv')
  fs.writeFileSync(cataloguePath, '﻿' + toCsv([header, ...data]), 'utf8')

  // --- the template: same columns, hints, two worked examples ---
  const missing = header.filter(h => !(h in HINTS))
  if (missing.length) {
    console.log(`PROBLEM: no hint written for column(s): ${missing.join(', ')}`)
    console.log('Add them to HINTS in tools/export-catalogue.js.')
    process.exitCode = 1
  }
  const templatePath = path.join(outDir, 'Scale_Body_Finder_New_Body_Template.csv')
  fs.writeFileSync(templatePath, '﻿' + toCsv([
    header,
    header.map(h => HINTS[h] ?? '(no guidance written for this column)'),
    header.map(h => EXAMPLES.seamless[h] ?? ''),
    header.map(h => EXAMPLES.jointed[h] ?? ''),
    header.map(h => EXAMPLES.male[h] ?? ''),
  ]), 'utf8')

  // The examples get copied, so a bad value in one would propagate. Check them
  // against the same lists the importer validates against.
  const GEND = ['Female', 'Male']
  const BT = ['Seamless', 'Jointed']
  for (const [name, ex] of Object.entries(EXAMPLES)) {
    if (!GEND.includes(ex['Gender'])) {
      console.log(`PROBLEM: example "${name}" has Gender "${ex['Gender']}"`)
      process.exitCode = 1
    }
    if (!BT.includes(ex['Body Type'])) {
      console.log(`PROBLEM: example "${name}" has Body Type "${ex['Body Type']}"`)
      process.exitCode = 1
    }
    const needsBuild = ex['Gender'] === 'Male'
    if (needsBuild !== Boolean(ex['Build'])) {
      console.log(`PROBLEM: example "${name}" Build should be ${needsBuild ? 'set' : 'blank'}`)
      process.exitCode = 1
    }
  }

  // --- prove the catalogue round-trips ---
  const back = parseCsv(fs.readFileSync(cataloguePath, 'utf8').replace(/^﻿/, ''))
  const same = JSON.stringify(back) === JSON.stringify(rows)
  const { bodies, problems } = loadBodies()
  const seamless = bodies.filter(b => b.bodyType === 'Seamless').length
  const jointed = bodies.filter(b => b.bodyType === 'Jointed').length

  console.log(`catalogue : ${data.length} rows -> ${bodies.length} bodies (${seamless} seamless, ${jointed} jointed)`)
  console.log(`            ${path.relative(process.cwd(), cataloguePath)}`)
  console.log(`template  : ${header.length} columns, 3 worked examples`)
  console.log(`            ${path.relative(process.cwd(), templatePath)}`)
  console.log(`round-trip: ${same ? 'identical to data/bodies.csv' : 'MISMATCH - do not send this file'}`)
  if (!same) process.exitCode = 1
  if (problems.length) {
    console.log(`\nPROBLEMS in the source data (${problems.length}) - fix before sending:`)
    problems.forEach(p => console.log('  ' + p))
    process.exitCode = 1
  }
}

if (require.main === module) main()
