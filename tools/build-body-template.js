/**
 * tools/build-body-template.js
 *
 *     node tools/build-body-template.js
 *
 * Writes data/bodyTemplate.js so the app can hand you the body-addition
 * template without a command line.
 *
 * The content comes from tools/export-catalogue.js, which builds it from the
 * header of data/bodies.csv. That matters: the app's copy and the file written
 * to exports/ are the same thing, built from the real schema. A separately
 * maintained copy is exactly how a template ended up two columns out of date
 * and nearly wiped the jointed section.
 */

const fs = require('fs')
const path = require('path')
const { parseCsv } = require('./build-body-data')
const { templateRows, checkExamples, toCsv } = require('./export-catalogue')

const ROOT = path.join(__dirname, '..')
const CSV = path.join(ROOT, 'data', 'bodies.csv')
const OUT = path.join(ROOT, 'data', 'bodyTemplate.js')

/** What the browser saves it as. */
const FILENAME = 'Scale Body Addition Template.csv'

function main() {
  const header = parseCsv(fs.readFileSync(CSV, 'utf8'))[0].map(h => h.trim())

  const bad = checkExamples(m => console.log('PROBLEM: ' + m))
  if (bad) {
    console.log('Fix the examples in tools/export-catalogue.js.')
    process.exitCode = 1
    return
  }

  // No byte-order mark here: saveCsv() adds one when the browser saves the
  // file, and two would show up as a stray character in the first column name.
  const csv = toCsv(templateRows(header))

  fs.writeFileSync(OUT, `/**
 * data/bodyTemplate.js - GENERATED, do not edit by hand.
 * Source: data/bodies.csv header + tools/export-catalogue.js
 * Rebuild: node tools/build-body-template.js
 *
 * The body-addition template, so the app can offer it as a download. Built
 * from the real schema, so it cannot fall behind it.
 */

export const BODY_TEMPLATE_FILENAME = ${JSON.stringify(FILENAME)}

export const BODY_TEMPLATE_CSV = ${JSON.stringify(csv)}

export default BODY_TEMPLATE_CSV
`)

  console.log(`body template: ${header.length} columns, ${templateRows(header).length - 1} rows under the header`)
  console.log(`wrote ${path.relative(ROOT, OUT)}`)
}

if (require.main === module) main()
module.exports = { FILENAME }
