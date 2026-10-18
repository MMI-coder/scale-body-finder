/**
 * utils/scene.js
 *
 * The scene: the things that go with a character, scaled to one scale.
 *
 * This is the job the Scale Conversion Tool used to do, moved in so the scale
 * can come from a body you have actually chosen rather than one measured pair
 * divided by another. Pure functions only; the state lives in
 * state/workspace.js.
 */

import { parseCsv, toCsvRow } from './csv'
import { ITEM_UNITS, fmtMM, parseScale, safeFileName, toMM } from './scaleUtils'

/**
 * Items per group.
 *
 * Groups are how a big scene stays readable - a kitchen with fifty things is
 * seven groups of a few, not one list of fifty. So the cap is per group, and
 * there is no cap on groups.
 */
export const MAX_ITEMS_PER_GROUP = 10

export const DIMENSIONS = [
    { key: 'h', label: 'Height' },
    { key: 'w', label: 'Width' },
    { key: 'd', label: 'Depth' },
]

/**
 * One real-world dimension at the scene scale, in millimetres.
 *
 * Null when there is nothing to scale - a blank box, or no usable scale yet.
 * Blank stays blank rather than becoming zero, the same rule as everywhere
 * else: zero is a measurement and absent is not.
 */
export function scaledMM(raw, unit, divisor) {
    const n = parseFloat(String(raw ?? '').replace(/,/g, ''))
    if (!Number.isFinite(n) || n <= 0 || !Number.isFinite(divisor) || divisor <= 0) return null
    return toMM(n, unit) / divisor
}

/** Has anything been typed into this item? */
export function itemHasContent(item) {
    return [item.name, item.notes, ...DIMENSIONS.map(({ key }) => item[key])]
        .some((v) => String(v ?? '').trim() !== '')
}

// ---------------------------------------------------------------------------
// The scene as a file
// ---------------------------------------------------------------------------
//
// One file is both the spreadsheet you read and the save you load back - the
// same arrangement as the roster. Settings sit at the top as label/value rows;
// the items follow under a header, one row each, grouped.
//
// Only the real-world sizes are read back. The scaled columns are there for
// reading and are worked out again on load, so a spreadsheet edit to a real
// size can never be contradicted by a stale scaled one.

const ITEM_HEADERS = ['Group', 'Item', 'Height', 'Width', 'Depth', 'Unit']
const DIM_HEADER = { h: 'Height', w: 'Width', d: 'Depth' }

/**
 * The scene out.
 *
 * `cast` is the roster's names in order, `focusName` the focus character's
 * name if there is one, `unit` what the scaled sizes are written in.
 */
export function sceneToCsv(scene, { cast = [], focusName = null, unit = 'cm' } = {}) {
    const divisor = parseScale(scene.scaleText)
    const src = scene.source
    const fromCard = src && scene.scaleText.trim() === src.scaleText

    const rows = [
        ['Scene Scale', scene.scaleText.trim()],
        ['Scale Multiplier', divisor ? (1 / divisor).toFixed(5) : ''],
    ]
    if (fromCard) {
        rows.push(['Scale From Body', src.bodyName])
        rows.push(['Scale From Character', src.characterName])
        rows.push(['Scale From Priority', cap(src.priority)])
    }
    rows.push(['Focus Character', focusName || ''])
    rows.push(['Characters', ...cast])
    rows.push([])
    rows.push([...ITEM_HEADERS, ...DIMENSIONS.map(({ label }) => `Scaled ${label} (${unit})`), 'Notes'])

    scene.groups.forEach((g, gi) => {
        const name = g.name.trim() || `Group ${gi + 1}`
        const items = g.items.filter(itemHasContent)
        if (!items.length) {
            if (g.name.trim()) rows.push([name])   // a named, empty group survives the trip
            return
        }
        for (const it of items) {
            rows.push([
                name,
                it.name.trim(),
                ...DIMENSIONS.map(({ key }) => String(it[key] ?? '').trim()),
                it.unit,
                ...DIMENSIONS.map(({ key }) => {
                    const mm = scaledMM(it[key], it.unit, divisor)
                    return mm == null ? '' : fmtMM(mm, unit)
                }),
                it.notes.trim(),
            ])
        }
    })

    return rows.map(toCsvRow).join('\n')
}

/**
 * The scene back in.
 *
 * Forgiving in the same way as the roster: anything unreadable is named in
 * `errors` and the rest still loads. Two allowances for a file that has been
 * through a spreadsheet: a blank Group cell carries on the group above, and a
 * group of more than ten is split into "Kitchen (2)" and so on rather than
 * losing the overflow.
 *
 * Returns plain groups and items without ids - the caller gives them ids.
 */
export function sceneFromCsv(text) {
    const rows = parseCsv(text)
    const errors = []
    if (!rows.length) return { scene: null, errors: ['That file is empty.'] }

    const hi = rows.findIndex((r) => (r[0] || '').trim() === 'Group' && (r[1] || '').trim() === 'Item')
    if (hi < 0) {
        return { scene: null, errors: ['That does not look like a saved scene — no Group / Item header.'] }
    }

    // ---- settings, above the header ----
    const setting = {}
    for (const r of rows.slice(0, hi)) setting[(r[0] || '').trim()] = r.slice(1).map((v) => v.trim())
    const one = (k) => (setting[k] ? setting[k][0] || '' : '')

    const scaleText = one('Scene Scale')
    if (scaleText && parseScale(scaleText) == null) {
        errors.push(`The scene scale "${scaleText}" can't be read - it has been kept so you can correct it.`)
    }
    const source = scaleText && one('Scale From Body') && one('Scale From Character')
        ? {
            scaleText,
            bodyName: one('Scale From Body'),
            characterName: one('Scale From Character'),
            priority: one('Scale From Priority').toLowerCase(),
        }
        : null

    // ---- items, below it ----
    const header = rows[hi].map((h) => h.trim())
    const col = (name) => header.indexOf(name)
    const cell = (r, name) => (col(name) < 0 ? '' : (r[col(name)] || '').trim())

    const order = []          // group names, first-seen order
    const byName = new Map()  // name -> items
    let current = null

    rows.slice(hi + 1).forEach((r, i) => {
        const line = hi + i + 2
        const groupCell = cell(r, 'Group')
        const name = groupCell || current || 'Ungrouped'
        current = name
        if (!byName.has(name)) { byName.set(name, []); order.push(name) }

        const item = { name: cell(r, 'Item'), h: '', w: '', d: '', unit: 'cm', notes: cell(r, 'Notes') }
        for (const { key } of DIMENSIONS) {
            const raw = cell(r, DIM_HEADER[key])
            if (raw === '') continue
            const n = Number(raw.replace(/,/g, ''))
            if (Number.isFinite(n) && n > 0) item[key] = raw
            else errors.push(`Row ${line} (${item.name || 'unnamed'}): ${DIM_HEADER[key]} "${raw}" isn't a size - left blank.`)
        }
        const unitRaw = cell(r, 'Unit').toLowerCase()
        if (ITEM_UNITS.includes(unitRaw)) item.unit = unitRaw
        else if (unitRaw) errors.push(`Row ${line} (${item.name || 'unnamed'}): unit "${unitRaw}" isn't one of ${ITEM_UNITS.join(', ')} - using cm.`)
        else if (DIMENSIONS.some(({ key }) => item[key])) errors.push(`Row ${line} (${item.name || 'unnamed'}): no unit - using cm.`)

        if (itemHasContent(item)) byName.get(name).push(item)
    })

    const groups = []
    for (const name of order) {
        const items = byName.get(name)
        if (items.length <= MAX_ITEMS_PER_GROUP) { groups.push({ name, items }); continue }
        const parts = Math.ceil(items.length / MAX_ITEMS_PER_GROUP)
        for (let p = 0; p < parts; p++) {
            groups.push({
                name: p === 0 ? name : `${name} (${p + 1})`,
                items: items.slice(p * MAX_ITEMS_PER_GROUP, (p + 1) * MAX_ITEMS_PER_GROUP),
            })
        }
        errors.push(`${name} had ${items.length} items - more than ${MAX_ITEMS_PER_GROUP} to a group, so it has been split into ${parts}.`)
    }

    return {
        scene: { scaleText, focusName: one('Focus Character') || null, source, groups },
        errors,
    }
}

/** The file name a scene saves under - the focus character's, if there is one. */
export function sceneFileName(focusName) {
    return focusName ? `${safeFileName(focusName, 'Scene')}_Scene.csv` : 'Scene.csv'
}

const cap = (w) => (w ? w.charAt(0).toUpperCase() + w.slice(1) : w)
