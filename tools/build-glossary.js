/**
 * tools/build-glossary.js
 *
 *     node tools/build-glossary.js            # write data/glossary.js
 *     node tools/build-glossary.js --preview  # just show what it would contain
 *
 * Reads TERMINOLOGY.md and pulls out every term that has something written on
 * its "Definition:" line. Terms left blank are skipped, so the file doubles as
 * the working document and the source of the in-app glossary.
 *
 * Deliberately forgiving about layout: the "Currently:" notes, the Part
 * headings and any blank template rows are all ignored.
 */

const fs = require('fs')
const path = require('path')

const ROOT = path.join(__dirname, '..')
const SRC = path.join(ROOT, 'TERMINOLOGY.md')
const OUT = path.join(ROOT, 'data', 'glossary.js')

function parseTerminology(text) {
  const lines = text.split(/\r?\n/)
  const entries = []
  let term = null
  let buf = []
  let collecting = false

  const flush = () => {
    if (term) {
      const def = buf.join(' ').replace(/\s+/g, ' ').trim()
      if (def) entries.push({ term, definition: def })
    }
    buf = []
    collecting = false
  }

  for (const raw of lines) {
    const line = raw.trim()

    const heading = /^###\s+(.*)$/.exec(line)
    if (heading) {
      flush()
      term = heading[1].trim() || null      // blank template heading -> ignored
      continue
    }
    if (/^#{1,2}\s/.test(line) || line === '---') { flush(); term = null; continue }

    const def = /^\*\*Definition:\*\*\s*(.*)$/.exec(line)
    if (def) {
      collecting = true
      if (def[1].trim()) buf.push(def[1].trim())
      continue
    }

    // Keep gathering wrapped lines, but never the *Currently:* note.
    if (collecting) {
      if (!line) { flush(); term = term; continue }
      if (/^\*Currently:\*/.test(line)) continue
      buf.push(line)
    }
  }
  flush()
  return entries
}

const entries = parseTerminology(fs.readFileSync(SRC, 'utf8'))

if (process.argv.includes('--preview')) {
  if (!entries.length) {
    console.log('No definitions filled in yet.')
  } else {
    console.log(`${entries.length} term(s) would appear in the glossary:\n`)
    for (const e of entries) console.log(`  ${e.term}\n    ${e.definition}\n`)
  }
  process.exit(0)
}

fs.writeFileSync(OUT, `/**
 * data/glossary.js - GENERATED, do not edit by hand.
 * Source: TERMINOLOGY.md   Rebuild: node tools/build-glossary.js
 *
 * Only terms with a definition written against them appear here.
 */

export const GLOSSARY = ${JSON.stringify(entries, null, 2)}

export default GLOSSARY
`)
console.log(`glossary terms: ${entries.length}`)
console.log(`wrote ${path.relative(ROOT, OUT)}`)
