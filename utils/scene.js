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

import { toMM } from './scaleUtils'

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
