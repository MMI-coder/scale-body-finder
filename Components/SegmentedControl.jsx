import { Pressable, StyleSheet, View, useColorScheme } from 'react-native'
import { Colors } from '../Constants/Colors'
import ThemedText from './ThemedText'

/**
 * A row of mutually exclusive options - used for the unit toggle, the
 * bust/waist/hips priority, and how many results to show.
 */
const SegmentedControl = ({ options, value, onChange, style }) => {
    const colorScheme = useColorScheme()
    const theme = Colors[colorScheme] ?? Colors.light

    return (
        <View style={[styles.row, { borderColor: theme.cardBorder, backgroundColor: theme.uiBackground }, style]}>
            {options.map((opt) => {
                const key = typeof opt === 'string' ? opt : opt.value
                const label = typeof opt === 'string' ? opt : opt.label
                const active = key === value
                return (
                    <Pressable
                        key={key}
                        onPress={() => onChange(key)}
                        accessibilityRole="button"
                        accessibilityState={{ selected: active }}
                        style={({ pressed }) => [
                            styles.segment,
                            active && { backgroundColor: Colors.primary },
                            pressed && !active && { opacity: 0.6 },
                        ]}
                    >
                        <ThemedText
                            style={[
                                styles.label,
                                { color: active ? '#ffffff' : theme.text },
                            ]}
                        >
                            {label}
                        </ThemedText>
                    </Pressable>
                )
            })}
        </View>
    )
}

export default SegmentedControl

const styles = StyleSheet.create({
    row: {
        flexDirection: 'row',
        borderRadius: 8,
        borderWidth: 1,
        overflow: 'hidden',
        alignSelf: 'flex-start',
    },
    segment: {
        paddingVertical: 10,
        paddingHorizontal: 18,
        minWidth: 62,
        alignItems: 'center',
    },
    label: {
        fontSize: 15,
        fontWeight: '600',
    },
})
