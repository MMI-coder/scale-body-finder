import { useState } from 'react'
import { Modal, Pressable, ScrollView, StyleSheet, View, useColorScheme } from 'react-native'
import { Colors } from '../Constants/Colors'
import ThemedText from './ThemedText'

/**
 * A select. React Native has no cross-platform picker worth using, so this is a
 * button that opens a scrollable sheet - the same on web, iOS and Android.
 *
 * Built for lists too long to sit in a row of chips; the current value is
 * scrolled into view when it opens.
 */
const Dropdown = ({ options, value, onChange, placeholder = 'Select…', width = 200 }) => {
    const colorScheme = useColorScheme()
    const theme = Colors[colorScheme] ?? Colors.light
    const [open, setOpen] = useState(false)

    const current = options.find((o) => o.value === value)
    const index = options.findIndex((o) => o.value === value)

    return (
        <>
            <Pressable
                onPress={() => setOpen(true)}
                accessibilityRole="button"
                accessibilityLabel={`${current ? current.label : placeholder}. Opens a list.`}
                style={({ pressed }) => [
                    styles.field,
                    { backgroundColor: theme.uiBackground, borderColor: theme.cardBorder, width },
                    pressed && { opacity: 0.7 },
                ]}
            >
                <ThemedText style={styles.fieldText}>{current ? current.label : placeholder}</ThemedText>
                <ThemedText style={[styles.caret, { color: theme.muted }]}>▾</ThemedText>
            </Pressable>

            <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
                <Pressable style={styles.backdrop} onPress={() => setOpen(false)}>
                    <View
                        style={[styles.sheet, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}
                        onStartShouldSetResponder={() => true}
                    >
                        <ScrollView
                            contentOffset={{ x: 0, y: Math.max(0, (index - 3) * 44) }}
                            showsVerticalScrollIndicator
                        >
                            {options.map((o) => {
                                const active = o.value === value
                                return (
                                    <Pressable
                                        key={String(o.value)}
                                        accessibilityRole="button"
                                        accessibilityState={{ selected: active }}
                                        onPress={() => { onChange(o.value); setOpen(false) }}
                                        style={({ pressed }) => [
                                            styles.option,
                                            { borderColor: theme.cardBorder },
                                            active && { backgroundColor: Colors.primary },
                                            pressed && !active && { backgroundColor: theme.uiBackground },
                                        ]}
                                    >
                                        <ThemedText style={[styles.optionText, active && { color: '#ffffff', fontWeight: '700' }]}>
                                            {o.label}
                                        </ThemedText>
                                    </Pressable>
                                )
                            })}
                        </ScrollView>
                    </View>
                </Pressable>
            </Modal>
        </>
    )
}

export default Dropdown

const styles = StyleSheet.create({
    field: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        borderWidth: 1, borderRadius: 8, paddingHorizontal: 14, paddingVertical: 11,
    },
    fieldText: { fontSize: 15, fontWeight: '600' },
    caret: { fontSize: 12, marginLeft: 8 },

    backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', alignItems: 'center', justifyContent: 'center', padding: 24 },
    sheet: { width: 260, maxHeight: '75%', borderRadius: 10, borderWidth: 1, overflow: 'hidden' },
    option: { paddingVertical: 12, paddingHorizontal: 16, borderBottomWidth: 1 },
    optionText: { fontSize: 15 },
})
