/**
 * utils/exportCsv.js  -  NATIVE (iOS / Android)
 *
 * Writes the CSV to a cache file and opens the system share sheet.
 * The browser version lives in exportCsv.web.js; Metro picks the right one
 * automatically, so neither platform ever sees the other's code.
 */

import * as FileSystem from 'expo-file-system/legacy'
import * as Sharing from 'expo-sharing'

import { buildExportRows, rowsToCsv } from './matching'
import { exportFileName } from './scaleUtils'

export async function exportResults(character, opts, outcome) {
  const csv = rowsToCsv(buildExportRows(character, opts, outcome))
  const name = exportFileName(character.name, opts.priority)
  const fileUri = FileSystem.cacheDirectory + name

  await FileSystem.writeAsStringAsync(fileUri, csv, {
    encoding: FileSystem.EncodingType.UTF8,
  })

  const canShare = await Sharing.isAvailableAsync()
  if (!canShare) throw new Error('Sharing is not available on this device.')

  await Sharing.shareAsync(fileUri, {
    mimeType: 'text/csv',
    dialogTitle: `Export: ${character.name || 'character'}`,
    UTI: 'public.comma-separated-values-text',
  })
}
