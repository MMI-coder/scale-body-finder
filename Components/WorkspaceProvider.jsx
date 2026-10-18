import { createContext, useContext, useState } from 'react'

import { DEFAULT_GENDER, DEFAULT_HEAD_SIZE, PROPORTIONS } from '../utils/matching'
import { DEFAULT_UNIT, DEFAULT_WORKING_SCALE } from '../utils/scaleUtils'

/**
 * Everything that has to survive moving between pages.
 *
 * The finder and the scene page are separate routes, and a route's own state
 * goes when you leave it. Typing in ten characters, going off to fill in a
 * scene, and coming back to an empty roster would be the worst kind of loss -
 * the silent kind. So the work lives here, above both pages.
 *
 * Memory only, on purpose. Closing the tab clears it, as it always has; the
 * saved files are how work carries over from one sitting to the next.
 */

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
})

const Workspace = createContext(null)

export function WorkspaceProvider({ children }) {
    const [gender, setGender] = useState(DEFAULT_GENDER)
    const [unit, setUnit] = useState(DEFAULT_UNIT)
    const [roster, setRoster] = useState(() => [blankEntry()])
    const [active, setActive] = useState(0)

    const value = {
        gender, setGender,
        unit, setUnit,
        roster, setRoster,
        active, setActive,
    }
    return <Workspace.Provider value={value}>{children}</Workspace.Provider>
}

export function useWorkspace() {
    const ws = useContext(Workspace)
    if (!ws) throw new Error('useWorkspace() needs a WorkspaceProvider above it - see app/_layout.jsx.')
    return ws
}
