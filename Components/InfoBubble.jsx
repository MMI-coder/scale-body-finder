import { useState } from 'react'
import { Pressable, StyleSheet, View, useColorScheme } from 'react-native'
import { Colors } from '../Constants/Colors'
import ThemedText from './ThemedText'

/**
 * A tappable (i) that reveals a note underneath.
 *
 * Tap rather than hover, so it behaves the same on a phone as on a desktop -
 * hover-only tooltips are invisible on touch.
 */
const InfoBubble = ({ label, text, labelStyle }) => {
    const colorScheme = useColorScheme()
    const theme = Colors[colorScheme] ?? Colors.light
    const [open, setOpen] = useState(false)

    return (
        <View>
            <Pressable
                onPress={(e) => { e.stopPropagation?.(); setOpen((v) => !v) }}
                accessibilityRole="button"
                accessibilityLabel={`${label} — more information`}
                style={styles.row}
                hitSlop={6}
            >
                <ThemedText style={labelStyle}>{label}</ThemedText>
                <View style={[styles.mark, { borderColor: theme.muted }]}>
                    <ThemedText style={[styles.markText, { color: theme.muted }]}>i</ThemedText>
                </View>
            </Pressable>
            {open ? (
                <View style={[styles.note, { borderColor: theme.cardBorder, backgroundColor: theme.uiBackground }]}>
                    <ThemedText style={[styles.noteText, { color: theme.muted }]}>{text}</ThemedText>
                </View>
            ) : null}
        </View>
    )
}

export default InfoBubble

const styles = StyleSheet.create({
    row: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    mark: {
        width: 15, height: 15, borderRadius: 8, borderWidth: 1,
        alignItems: 'center', justifyContent: 'center',
    },
    markText: { fontSize: 10, fontWeight: '700', lineHeight: 13 },
    note: { marginTop: 6, padding: 10, borderRadius: 6, borderWidth: 1 },
    noteText: { fontSize: 12, lineHeight: 17 },
})
