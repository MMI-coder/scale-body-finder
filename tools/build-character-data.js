/**
 * tools/build-character-data.js
 *
 * Turns data/characters.csv (the thing you edit) into data/characters.js (the
 * thing the app imports). Runs as part of `npm run data`:
 *
 *     node tools/build-character-data.js
 *
 * The list behind "Choose a character" on the Body Finder. Each row is one
 * character at 1:1, in millimetres, and nothing else: no scale, head sculpt,
 * priority or sort. Picking a character fills in the measurements and leaves
 * every one of those choices where you had it.
 *
 * Strict for the same reason the body catalogue is. A row the app could not
 * use would not look like an error - it would just be missing from the list -
 * so anything it cannot read stops the build and says which row and why.
 */

const fs = require('fs')
const path = require('path')
const { parseCsv } = require('./build-body-data')

const ROOT = path.join(__dirname, '..')
const CSV = path.join(ROOT, 'data', 'characters.csv')
const OUT = path.join(ROOT, 'data', 'characters.js')

// Column -> the key the app's form uses. The six proportions carry the same
// labels they have on screen; tools/verify-matching.js checks that they still
// match PROPORTIONS in utils/matching.js.
const REQUIRED = { Height: 'height', Bust: 'bust', Waist: 'waist', Hips: 'hips' }
const OPTIONAL = {
  'Breast Height': 'breastHeight',
  'Breast Width': 'breastWidth',
  'Breast Depth': 'breastDepth',
  'Waist Width': 'waistWidth',
  'Hip Width': 'hipWidth',
  'Shoulder Width': 'shoulder',
}
const COLUMNS = { ...REQUIRED, ...OPTIONAL }

/** { characters, errors } - characters sorted by name, errors as sentences. */
function loadCharacters(text = fs.readFileSync(CSV, 'utf8')) {
  const rows = parseCsv(text.replace(/^﻿/, ''))
  const errors = []
  if (!rows.length) return { characters: [], errors: ['data/characters.csv is empty.'] }

  const header = rows[0].map(h => h.trim())
  if (!header.includes('Character')) errors.push('No "Character" column.')
  for (const col of Object.keys(REQUIRED)) {
    if (!header.includes(col)) errors.push(`No "${col}" column - it is required.`)
  }
  for (const col of header) {
    if (col !== 'Character' && !(col in COLUMNS)) {
      errors.push(`Unknown column "${col}". Expected Character, ${Object.keys(COLUMNS).join(', ')}.`)
    }
  }
  if (errors.length) return { characters: [], errors }

  const characters = []
  const seen = new Map()
  rows.slice(1).forEach((r, i) => {
    const line = i + 2
    const cell = (col) => (r[header.indexOf(col)] || '').trim()
    const name = cell('Character')
    const label = name || '(no name)'
    if (!name) errors.push(`Row ${line}: no character name.`)
    const lower = name.toLowerCase()
    if (name && seen.has(lower)) errors.push(`Row ${line}: ${name} is already on row ${seen.get(lower)}.`)
    if (name) seen.set(lower, line)

    const c = { name }
    for (const [col, key] of Object.entries(COLUMNS)) {
      if (!header.includes(col)) { c[key] = null; continue }
      const raw = cell(col)
      if (raw === '') {
        if (col in REQUIRED) errors.push(`Row ${line} (${label}): ${col} is blank - it is required.`)
        c[key] = null
        continue
      }
      const n = Number(raw)
      if (!Number.isFinite(n) || n <= 0) {
        errors.push(`Row ${line} (${label}): ${col} "${raw}" is not a measurement in mm.`)
        c[key] = null
        continue
      }
      c[key] = n
    }
    characters.push(c)
  })

  characters.sort((a, b) => a.name.localeCompare(b.name))
  return { characters, errors }
}

function main() {
  const { characters, errors } = loadCharacters()
  if (errors.length) {
    console.log('data/characters.csv has problems - data/characters.js was NOT written:')
    for (const e of errors) console.log('  ' + e)
    process.exitCode = 1
    return
  }

  const out = `/**
 * data/characters.js - GENERATED, do not edit by hand.
 * Source: data/characters.csv   Rebuild: node tools/build-character-data.js
 *
 * Characters at 1:1, in millimetres, sorted by name. null means not known.
 * Measurements only - picking one never sets scale, head sculpt, priority or
 * sort.
 */

export const CHARACTERS = ${JSON.stringify(characters, null, 2)}
`
  fs.writeFileSync(OUT, out)
  const partial = characters.filter(c => Object.values(OPTIONAL).some(k => c[k] == null)).map(c => c.name)
  console.log(`wrote ${path.relative(process.cwd(), OUT)}: ${characters.length} characters` +
    (partial.length ? ` (proportions incomplete: ${partial.join(', ')})` : ''))
}

module.exports = { loadCharacters, COLUMNS, REQUIRED, OPTIONAL }
if (require.main === module) main()
