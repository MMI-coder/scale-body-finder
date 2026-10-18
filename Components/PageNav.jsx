import { router, usePathname } from 'expo-router'

import SegmentedControl from './SegmentedControl'

const PAGES = [
    { value: '/', label: 'Body Finder' },
    { value: '/scene', label: 'Scene' },
]

/**
 * Switches between the two pages.
 *
 * navigate() rather than push(): going back to a page already in the history
 * returns to it instead of stacking another copy on top. Either way nothing is
 * lost - the work lives in state/workspace.js, not in the page.
 */
export default function PageNav() {
    const here = usePathname() === '/scene' ? '/scene' : '/'
    return (
        <SegmentedControl
            options={PAGES}
            value={here}
            onChange={(p) => { if (p !== here) router.navigate(p) }}
        />
    )
}
