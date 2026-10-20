import { Redirect } from 'expo-router'

/**
 * Any address the app doesn't know - /index.html, a mistyped path, an old
 * bookmark - goes to the Body Finder rather than a "page not found" screen.
 */
export default function NotFound() {
    return <Redirect href="/" />
}
