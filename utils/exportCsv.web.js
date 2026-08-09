/**
 * utils/exportCsv.web.js  -  BROWSER
 *
 * Turns the CSV into a temporary in-memory file and clicks an invisible
 * download link, which is how a web page saves a file to your computer.
 * expo-file-system and expo-sharing do not exist in a browser, so the native
 * version of this file is never loaded here.
 */

import { buildExportRows, rowsToCsv } from './matching'
import { safeFileName } from './scaleUtils'

export async function exportResults(character, priority, unit, result) {
  const csv = rowsToCsv(buildExportRows(character, priority, unit, result))

  // The ﻿ prefix is a byte-order mark. It tells Excel the file is UTF-8,
  // otherwise Excel mangles any non-ASCII characters.
  const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)

  const link = document.createElement('a')
  link.href = url
  link.download = `${safeFileName(character.name)}_bodies.csv`
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)

  URL.revokeObjectURL(url)
}
