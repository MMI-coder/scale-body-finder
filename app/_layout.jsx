import { Stack } from 'expo-router'
import { StatusBar } from 'expo-status-bar'
import { useColorScheme } from 'react-native'
import { WorkspaceProvider } from '../Components/WorkspaceProvider'
import { Colors } from '../Constants/Colors'

const RootLayout = () => {
    const colorScheme = useColorScheme()
    const theme = Colors[colorScheme] ?? Colors.light

    return (
        <WorkspaceProvider>
            <StatusBar style="auto" />
            <Stack screenOptions={{
                headerShown: false,
                contentStyle: { backgroundColor: theme.background },
            }}>
                <Stack.Screen name="index" />
            </Stack>
        </WorkspaceProvider>
    )
}

export default RootLayout
