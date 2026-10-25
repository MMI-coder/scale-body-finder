/**
 * state/workspace.js
 *
 * Everything that has to survive moving between pages: the roster, the scene,
 * catalogue and units.
 *
 * Held in this module rather than in React state, and that is the point. The
 * first version kept it in a provider at the top of the layout, which survived
 * clicking between pages but not the browser's back and forward buttons - the
 * router rebuilt the tree under the layout, the provider went with it, and a
 * filled-in kitchen came back blank. No reload, no warning. A module lives as
 * long as the tab does, whatever the router decides to remount.
 *
 * Memory only, on purpose. Closing the tab clears it, as it always has; the
 * saved files are how work carries over from one sitting to the next.
 */

import { useCallback, useSyncExternalStore } from 'react'

import { DEFAULT_GENDER, DEFAULT_HEAD_SIZE, PROPORTIONS } from '../utils/matching'
import { DEFAULT_UNIT, DEFAULT_WORKING_SCALE, fromMM, toMM } from '../utils/scaleUtils'

const emptyValues = {
    height: '', bust: '', waist: '', hips: '',
    ...Object.fromEntries(PROPORTIONS.map((p) => [p.key, ''])),
}

let nextId = 1

/** A key for anything in a list. Only has to be unique for this tab. */
export const newId = () => nextId++

/** A fresh character. Scale and head default to the usual starting point. */
export const blankEntry = () => ({
    id: newId(),
    name: '',
    values: emptyValues,
    priority: 'bust',
    workingScale: DEFAULT_WORKING_SCALE,
    headSize: DEFAULT_HEAD_SIZE,
    sort: 'least',
    // The body picked for this character with "Use this body" - its code, or
    // null. A note of the decision, not a filter: the results never move for it.
    chosenBody: null,
})

/** A fresh scene item. Takes the unit it is given - see addItem on the scene page. */
export const blankItem = (unit = DEFAULT_UNIT) => ({
    id: newId(),
    name: '',
    h: '', w: '', d: '',
    unit,
    notes: '',
})

export const blankGroup = (unit = DEFAULT_UNIT) => ({
    id: newId(),
    name: '',
    items: [blankItem(unit)],
})

/**
 * A fresh scene.
 *
 * focusId is the character the scene is built around - optional, and set by
 * "Use for scene" on a body card. focusName is the same character by name,
 * which is all a saved file can carry: ids only last as long as the tab. source records where the scale came from at
 * the moment it was copied: body, character, priority and the scale itself.
 * It is a record, not a link - change the priority afterwards and the card's
 * scale moves, but the scene's does not.
 */
export const blankScene = () => ({
    scaleText: '',
    focusId: null,
    focusName: null,
    source: null,
    groups: [blankGroup()],
})

/**
 * Is this roster entry the scene's focus?
 *
 * By id when the button was pressed in this tab. By name when the scene came
 * from a file - so loading a roster and a scene, in either order, finds
 * Kasumi again without her having to be picked twice.
 */
export function isFocus(scene, entry) {
    if (scene.focusId != null) return scene.focusId === entry.id
    const want = (scene.focusName || '').trim().toLowerCase()
    return !!want && entry.name.trim().toLowerCase() === want
}

/**
 * Has the Body Finder been shown since the tab opened?
 *
 * A fresh load always starts on the Body Finder: a phone reopening /scene
 * from an old tab, or a refresh while on the scene, would otherwise land on
 * an empty scene page - empty because a fresh load has nothing in memory.
 * Lives here for the same reason the rest does: it has to outlast whatever
 * the router remounts.
 */
let finderShown = false
export const markFinderShown = () => { finderShown = true }
export const finderWasShown = () => finderShown

// ---------------------------------------------------------------------------
// The store
// ---------------------------------------------------------------------------

const values = {
    gender: DEFAULT_GENDER,
    unit: DEFAULT_UNIT,
    roster: [blankEntry()],
    active: 0,
    scene: blankScene(),
}
const listeners = new Set()
const subscribe = (fn) => {
    listeners.add(fn)
    return () => listeners.delete(fn)
}

/**
 * Like useState, but the value lives in this module.
 *
 * Takes a value or an updater function, same as useState. Updates apply
 * immediately rather than batching, so two updaters in a row each see the
 * other's result - which is what every caller here already assumes.
 */
function useStored(key) {
    const value = useSyncExternalStore(subscribe, () => values[key], () => values[key])
    const set = useCallback((next) => {
        const prev = values[key]
        const v = typeof next === 'function' ? next(prev) : next
        if (Object.is(v, prev)) return
        values[key] = v
        listeners.forEach((l) => l())
    }, [key])
    return [value, set]
}

export function useWorkspace() {
    const [gender, setGender] = useStored('gender')
    const [unit, setUnit] = useStored('unit')
    const [roster, setRoster] = useStored('roster')
    const [active, setActive] = useStored('active')
    const [scene, setScene] = useStored('scene')

    /**
     * Switching units rewrites what's in the boxes, so the measurement itself
     * stays put rather than silently changing size.
     *
     * Here rather than on either page because both pages have the toggle. Flip
     * it on the scene page without converting the roster, and Kasumi's 89cm bust
     * comes back as 89mm.
     *
     * Scene items are not touched: each carries its own unit, and the toggle only
     * decides what the scaled sizes are shown in.
     */
    const changeUnit = (next) => {
        if (next === unit) return
        const convert = (v) => {
            const out = { ...v }
            for (const key of Object.keys(v)) {
                const n = parseFloat(v[key])
                out[key] = Number.isFinite(n)
                    ? String(parseFloat(fromMM(toMM(n, unit), next).toFixed(4)))
                    : v[key]
            }
            return out
        }
        setRoster((r) => r.map((e) => ({ ...e, values: convert(e.values) })))
        setUnit(next)
    }

    return {
        gender, setGender,
        unit, changeUnit,
        roster, setRoster,
        active, setActive,
        scene, setScene,
    }
}
