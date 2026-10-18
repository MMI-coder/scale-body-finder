import { useEffect, useRef, useState } from 'react'
import { Modal, Platform, Pressable, ScrollView, StyleSheet, View, useColorScheme } from 'react-native'
import { Colors } from '../Constants/Colors'
import { pickCsvFile, readDroppedFile } from '../utils/batchFile'
import Spacer from './Spacer'
import ThemedButton from './ThemedButton'
import ThemedCard from './ThemedCard'
import ThemedText from './ThemedText'

/**
 * Load a file the app saved earlier - a roster, or a scene.
 *
 * Drop it in or browse for it. `onLoad` gets the file's text and returns
 * { ok, message, errors }; anything it could not read is listed rather than
 * failing the whole file, and a clean load closes itself.
 *
 * Used to live inside the roster panel. The scene needed exactly the same
 * thing, so it came out rather than being copied.
 */
const LoadCsvModal = ({ visible, onClose, title, blurb, onLoad }) => {
    const colorScheme = useColorScheme()
    const theme = Colors[colorScheme] ?? Colors.light
    const [status, setStatus] = useState(null)   // { tone, text }
    const [errors, setErrors] = useState([])
    const [dragging, setDragging] = useState(false)
    const dropRef = useRef(null)

    // Drag and drop is a DOM affair. The ref lands on a div under
    // react-native-web; on native nothing that opens this is shown.
    useEffect(() => {
        if (Platform.OS !== 'web' || !visible) return
        const el = dropRef.current
        if (!el || !el.addEventListener) return

        const stop = (e) => { e.preventDefault(); e.stopPropagation() }
        const onOver = (e) => { stop(e); setDragging(true) }
        const onLeave = (e) => { stop(e); setDragging(false) }
        const onDrop = async (e) => {
            stop(e)
            setDragging(false)
            await handleFile(() => readDroppedFile(e.dataTransfer))
        }

        el.addEventListener('dragenter', onOver)
        el.addEventListener('dragover', onOver)
        el.addEventListener('dragleave', onLeave)
        el.addEventListener('drop', onDrop)
        return () => {
            el.removeEventListener('dragenter', onOver)
            el.removeEventListener('dragover', onOver)
            el.removeEventListener('dragleave', onLeave)
            el.removeEventListener('drop', onDrop)
        }
    })

    /** Shared by the file picker and the drop target - the source doesn't matter. */
    const handleFile = async (get) => {
        setStatus(null)
        setErrors([])
        let file
        try {
            file = await get()
        } catch (err) {
            setStatus({ tone: 'bad', text: err.message })
            return
        }
        if (!file) return

        if (!/\.csv$/i.test(file.name)) {
            setStatus({ tone: 'bad', text: `${file.name} isn't a CSV. Export the sheet as CSV and try again.` })
            return
        }

        const result = onLoad ? onLoad(file.text) : { ok: false, message: 'Nothing to load into.' }
        setErrors(result.errors || [])
        setStatus({ tone: result.ok ? (result.errors?.length ? 'warn' : 'ok') : 'bad', text: result.message })
        // Close on a clean load only. If something was skipped, the list of
        // what and why stays up until it has been read.
        if (result.ok && !result.errors?.length) setTimeout(close, 1200)
    }

    const close = () => { setStatus(null); setErrors([]); setDragging(false); onClose() }
    const toneColor = { ok: Colors.primary, warn: '#c98a00', bad: Colors.warning }

    return (
        <Modal visible={visible} transparent animationType="fade" onRequestClose={close}>
            <Pressable style={styles.backdrop} onPress={close}>
                {/* Swallows the press so clicking inside doesn't close it. */}
                <Pressable onPress={() => {}} style={{ width: '100%', maxWidth: 680 }}>
                    <ThemedCard style={styles.sheet}>
                        <View style={styles.titleRow}>
                            <ThemedText style={styles.h2}>{title}</ThemedText>
                            <Pressable onPress={close} hitSlop={10} accessibilityRole="button" accessibilityLabel="Close">
                                <ThemedText style={[styles.close, { color: theme.muted }]}>✕</ThemedText>
                            </Pressable>
                        </View>

                        <ScrollView contentContainerStyle={styles.sheetInner}>
                            <ThemedText style={[styles.sub, { color: theme.muted }]}>{blurb}</ThemedText>

                            <Spacer height={18} />

                            <View
                                ref={dropRef}
                                style={[
                                    styles.drop,
                                    { borderColor: dragging ? Colors.primary : theme.cardBorder },
                                    dragging && { backgroundColor: theme.uiBackground },
                                ]}
                            >
                                <ThemedText style={styles.dropBig}>
                                    {dragging ? 'Drop to upload' : 'Drop your CSV here'}
                                </ThemedText>
                                <ThemedText style={[styles.dropSmall, { color: theme.muted }]}>or</ThemedText>
                                <ThemedButton onPress={() => handleFile(pickCsvFile)} style={styles.btn}>
                                    <ThemedText style={styles.btnText}>Browse files</ThemedText>
                                </ThemedButton>
                            </View>

                            {status ? (
                                <>
                                    <Spacer height={16} />
                                    <ThemedText style={[styles.status, { color: toneColor[status.tone] }]}>
                                        {status.text}
                                    </ThemedText>
                                </>
                            ) : null}

                            {errors.length ? (
                                <View style={[styles.errors, { borderColor: theme.cardBorder, backgroundColor: theme.uiBackground }]}>
                                    {errors.map((e, i) => (
                                        <ThemedText key={i} style={[styles.errorLine, { color: theme.text }]}>{e}</ThemedText>
                                    ))}
                                </View>
                            ) : null}
                        </ScrollView>
                    </ThemedCard>
                </Pressable>
            </Pressable>
        </Modal>
    )
}

export default LoadCsvModal

const styles = StyleSheet.create({
    backdrop: {
        flex: 1, backgroundColor: 'rgba(0,0,0,0.55)',
        alignItems: 'center', justifyContent: 'center', padding: 20,
    },
    sheet: { maxHeight: '90%', width: '100%' },
    sheetInner: { paddingBottom: 4 },

    titleRow: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 },
    h2: { fontSize: 22, fontWeight: '700', flexShrink: 1 },
    close: { fontSize: 20, fontWeight: '700', lineHeight: 24 },

    sub: { fontSize: 14, lineHeight: 20, marginTop: 6 },

    drop: {
        borderWidth: 2, borderStyle: 'dashed', borderRadius: 10,
        paddingVertical: 28, paddingHorizontal: 16,
        alignItems: 'center', gap: 8,
    },
    dropBig: { fontSize: 16, fontWeight: '700' },
    dropSmall: { fontSize: 13 },

    btn: { marginVertical: 0, paddingHorizontal: 20 },
    btnText: { color: '#ffffff', fontWeight: '700', fontSize: 15 },

    status: { fontSize: 14, fontWeight: '600', lineHeight: 20 },
    errors: { marginTop: 12, borderWidth: 1, borderRadius: 8, padding: 12, gap: 6 },
    errorLine: { fontSize: 13, lineHeight: 18 },
})
