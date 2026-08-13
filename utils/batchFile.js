/**
 * utils/batchFile.js  -  NATIVE (iOS / Android)
 *
 * Batch upload is web only. Doing it here would mean adding
 * expo-document-picker for a feature nobody uses on a phone, so this is a stub
 * and the UI hides the whole section rather than offering a button that fails.
 *
 * If it's ever wanted: add expo-document-picker, and implement pickCsvFile to
 * return { name, text }. saveCsv can reuse the share sheet from exportCsv.js.
 */

const message = 'Batch upload is only available in the browser version.'

export function pickCsvFile() {
  return Promise.reject(new Error(message))
}

export function saveCsv() {
  throw new Error(message)
}

export const BATCH_SUPPORTED = false
