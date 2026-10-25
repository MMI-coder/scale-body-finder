/**
 * utils/printResults.web.js  -  BROWSER
 *
 * Builds a printable sheet of results and hands it to the browser's own print
 * engine, where you choose Save as PDF.
 *
 * Done this way rather than with a PDF library on purpose. The browser already
 * knows how to paginate, embed images and handle fonts; a library would mean
 * several hundred kilobytes of dependency, rendering cards to canvas, and worse
 * image quality, to save one click in a dialog.
 *
 * It opens a separate window rather than printing the page you are looking at,
 * so nothing about the app's own layout has to bend around print styles.
 */

const esc = (v) =>
  String(v ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]))

const row = (label, body, character, diff, strong) => `
  <tr${strong ? ' class="strong"' : ''}>
    <th>${esc(label)}</th>
    <td>${esc(body)}</td>
    <td class="muted">${esc(character)}</td>
    <td class="diff">${esc(diff)}</td>
  </tr>`

/**
 * @param sheets  one per character: { character, opts, outcome, limit }
 * @param fmt     { mm, delta, scaleName, unit, imageUrl }
 */
export function printResults(sheets, fmt) {
  const { mm, delta, scaleName, unit, imageUrl } = fmt

  const cards = (s) => s.outcome.results.slice(0, s.limit).map((r, i) => {
    const b = r.body
    const isPlanned = s.planned && s.planned === b.code
    const img = imageUrl(b.image)
    const props = (r.proportions || []).filter((p) => p.body != null)
    return `
    <div class="card${isPlanned ? ' planned' : ''}">
      <div class="rank">${i + 1}</div>
      ${img ? `<img src="${esc(img)}" alt="">` : ''}
      <div class="body">
        <h3>${esc(b.name || b.code)}${isPlanned ? ' <span class="pick">✓ Planned</span>' : ''}</h3>
        <p class="meta">${esc([b.manufacturer, b.material, b.bodyType].filter(Boolean).join(' · '))}</p>
        ${r.closest ? `<p class="scale">Actual Body Scale <strong>${esc(r.closest.name)}</strong> · ×${r.closest.multiplier.toFixed(5)}</p>` : ''}
        <table>
          <tr><th></th><th>Body</th><th>Character</th><th>Diff</th></tr>
          ${row('Height', r.heightUsed == null ? mm(r.heightUsed, unit) : mm(r.heightUsed, unit) + '*', mm(r.scaled.height, unit), delta(r.deltas.height, unit))}
          ${row('Bust', mm(r.bust ?? b.bust, unit), mm(r.scaled.bust, unit), delta(r.deltas.bust, unit), s.opts.priority === 'bust')}
          ${row('Waist', mm(b.waist, unit), mm(r.scaled.waist, unit), delta(r.deltas.waist, unit), s.opts.priority === 'waist')}
          ${row('Hips', mm(b.hips, unit), mm(r.scaled.hips, unit), delta(r.deltas.hips, unit), s.opts.priority === 'hips')}
          ${props.length ? `<tr class="group"><th colspan="4">Proportions</th></tr>` : ''}
          ${props.map((p) => row(p.label, mm(p.body, unit), mm(p.character, unit), p.diff == null ? '—' : delta(p.diff, unit))).join('')}
        </table>
        ${r.heightUsed != null ? `<p class="foot">* ${esc(fmt.heightNote)}</p>` : ''}
        ${b.notes ? `<p class="notes">${esc(b.notes)}</p>` : ''}
      </div>
    </div>`
  }).join('')

  const sections = sheets.map((s) => {
    const c = s.character
    const cap = (w) => (w ? w.charAt(0).toUpperCase() + w.slice(1) : w)
    return `
    <section>
      <h1>${esc(c.name || 'Unnamed character')}</h1>
      <p class="sub">
        ${esc(scaleName(s.opts.workingScale))} · ${esc(s.opts.headSize)}mm sculpt ·
        sorted by ${esc(cap(s.opts.sort))} difference in ${esc(cap(s.opts.priority))} ·
        top ${s.limit} of ${s.outcome.results.length}
      </p>
      ${s.planned ? `<p class="sub"><strong>Planned body: ${esc(s.plannedName || s.planned)}</strong>${
        s.outcome.results.slice(0, s.limit).some((r) => r.body.code === s.planned) ? '' : ' (not in the top ' + s.limit + ' below)'
      }</p>` : ''}
      <p class="sub">
        Character at 1:1 — Height ${esc(mm(c.height, unit))}${esc(unit)},
        Bust ${esc(mm(c.bust, unit))}${esc(unit)},
        Waist ${esc(mm(c.waist, unit))}${esc(unit)},
        Hips ${esc(mm(c.hips, unit))}${esc(unit)}
      </p>
      ${cards(s)}
    </section>`
  }).join('')

  const html = `<!doctype html>
<html><head><meta charset="utf-8"><title>Scale Body Finder results</title>
<style>
  * { box-sizing: border-box; }
  body { font: 11pt/1.4 -apple-system, "Segoe UI", system-ui, sans-serif; margin: 0; padding: 18mm 14mm; color: #11181c; }
  section { break-after: page; }
  section:last-child { break-after: auto; }
  h1 { font-size: 20pt; margin: 0 0 2mm; }
  .sub { margin: 0 0 1mm; color: #5a6672; font-size: 9pt; }
  .card { display: flex; gap: 6mm; align-items: flex-start; break-inside: avoid;
          border-top: 1px solid #d6dde3; padding: 5mm 0; }
  .card.planned { border-left: 3px solid #4A90C4; padding-left: 3mm; }
  .pick { font-size: 9pt; font-weight: 700; color: #ffffff; background: #4A90C4; border-radius: 99px; padding: 0.5mm 2.5mm; margin-left: 2mm; vertical-align: middle; }
  .rank { font-size: 14pt; font-weight: 800; color: #8a97a2; width: 8mm; flex: none; }
  .card img { width: 38mm; flex: none; object-fit: contain; }
  .card .body { flex: 1; }
  h3 { font-size: 13pt; margin: 0; }
  .meta { margin: 0 0 1mm; color: #5a6672; font-size: 9pt; }
  .scale { margin: 0 0 2mm; font-size: 9pt; }
  table { border-collapse: collapse; width: 100%; max-width: 110mm; font-size: 9pt; }
  th, td { text-align: right; padding: 1mm 2mm; border-bottom: 1px solid #eef2f5; }
  th:first-child { text-align: left; font-weight: 500; }
  tr:first-child th { color: #5a6672; font-weight: 600; border-bottom: 1px solid #d6dde3; }
  tr.strong th, tr.strong td { font-weight: 700; }
  tr.group th { text-align: left; color: #5a6672; font-weight: 600; padding-top: 2.5mm; }
  .muted { color: #5a6672; }
  .diff { font-variant-numeric: tabular-nums; font-weight: 600; }
  .foot { font-size: 8pt; color: #5a6672; margin: 1.5mm 0 0; }
  .notes { font-size: 8.5pt; color: #5a6672; font-style: italic; margin: 2mm 0 0; }
  @page { margin: 0; }
</style></head><body>${sections}</body></html>`

  const w = window.open('', '_blank')
  if (!w) return { ok: false, message: 'Your browser blocked the print window. Allow pop-ups for this page and try again.' }
  w.document.write(html)
  w.document.close()

  // Give images a moment to decode, or the first page prints with gaps.
  const go = () => { w.focus(); w.print() }
  if (w.document.readyState === 'complete') setTimeout(go, 400)
  else w.addEventListener('load', () => setTimeout(go, 400))

  return { ok: true }
}

export const PRINT_SUPPORTED = true
