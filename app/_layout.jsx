import { Slot } from 'expo-router'
import { StatusBar } from 'expo-status-bar'
import { View, useColorScheme } from 'react-native'
import { Colors } from '../Constants/Colors'

/**
 * Slot rather than Stack: only the page you are on is drawn.
 *
 * A Stack kept every page you had visited mounted underneath, hidden, and
 * added a fresh copy each time you switched - ten trips between the finder
 * and the scene was ten finders, each drawing 33 cards nobody could see.
 * Nothing is lost by unmounting a page: the work lives in state/workspace.js.
 */
const RootLayout = () => {
    const colorScheme = useColorScheme()
    const theme = Colors[colorScheme] ?? Colors.light

    return (
        <View style={{ flex: 1, backgroundColor: theme.background }}>
            <StatusBar style="auto" />
            <Slot />
        </View>
    )
}

export default RootLayout
