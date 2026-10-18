/**
 * utils/printResults.js  -  NATIVE (iOS / Android)
 *
 * Printing is a browser job. The web version next door builds a sheet and hands
 * it to the browser's own print engine; doing the same on a phone would mean
 * expo-print and a second layout to maintain, for a feature that belongs on a
 * desktop anyway.
 *
 * The UI hides the button rather than offering one that fails.
 */

export function printResults() {
  return { ok: false, message: 'Printing is only available in the browser version.' }
}

export const PRINT_SUPPORTED = false
