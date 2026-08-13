/**
 * utils/batchFile.web.js  -  BROWSER
 *
 * Opening a file picker and saving a file are both DOM jobs, so they live here
 * rather than in a component. The native stub next door throws instead; batch
 * upload is web only for now.
 */

/** Opens a file picker and resolves with the file's text, or null if cancelled. */
export function pickCsvFile() {
  return new Promise((resolve, reject) => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = '.csv,text/csv'
    input.style.display = 'none'

    // Fires when the picker closes with nothing chosen. Not supported
    // everywhere, so the resolve below is still guarded.
    input.addEventListener('cancel', () => { cleanup(); resolve(null) })

    input.addEventListener('change', () => {
      const file = input.files && input.files[0]
      if (!file) { cleanup(); resolve(null); return }
      const reader = new FileReader()
      reader.onload = () => {
        cleanup()
        // Strip a UTF-8 byte-order mark; Excel adds one and it would otherwise
        // become part of the first column's name.
        resolve({ name: file.name, text: String(reader.result).replace(/^﻿/, '') })
      }
      reader.onerror = () => { cleanup(); reject(new Error('Could not read that file.')) }
      reader.readAsText(file)
    })

    function cleanup() { input.remove() }

    document.body.appendChild(input)
    input.click()
  })
}

/** Saves text as a download. */
export function saveCsv(filename, csv) {
  const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

export const BATCH_SUPPORTED = true
