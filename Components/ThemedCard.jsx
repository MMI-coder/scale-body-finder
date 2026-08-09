import { StyleSheet, View, useColorScheme } from 'react-native'
import { Colors } from '../Constants/Colors'

const ThemedCard = ({ style, ...props }) => {
    const colorScheme = useColorScheme()
    const theme = Colors[colorScheme] ?? Colors.light

    return (
        <View
            style={[
                { backgroundColor: theme.card, borderColor: theme.cardBorder },
                styles.card,
                style,
            ]}
            {...props}
        />
    )
}

export default ThemedCard

const styles = StyleSheet.create({
    card: {
        borderRadius: 10,
        borderWidth: 1,
        padding: 20,
    },
})
