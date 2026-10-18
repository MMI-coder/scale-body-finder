import { useEffect, useRef, useState } from 'react'
import { Modal, Platform, Pressable, ScrollView, StyleSheet, View, useColorScheme } from 'react-native'
import { Colors } from '../Constants/Colors'
import { BODY_TEMPLATE_CSV, BODY_TEMPLATE_FILENAME } from '../data/bodyTemplate'
import { BATCH_SUPPORTED, pickCsvFile, readDroppedFile, saveCsv } from '../utils/batchFile'
import { DEFAULT_GENDER } from '../utils/matching'
import Spacer from './Spacer'
import ThemedButton from './ThemedButton'
import ThemedCard from './ThemedCard'
import ThemedText from './ThemedText'

/**
 * The two file jobs, kept off the main page.
 *
 * Loading a roster puts characters back in the app after a refresh. It used to
 * be a template you filled in by hand, which meant a new column every time the
 * app learned something. The app writes the file now, so there is nothing to
 * author and nothing to get wrong.
 *
 * The body-addition template is the other job entirely: not uploaded anywhere,
 * just downloaded and handed over, so it gets its own button and no ceremony.
 */
const BatchPanel = ({ gender = DEFAULT_GENDER, onLoadRoster }) => {
    const colorScheme = useColorScheme()
    const theme = Colors[colorScheme] ?? Colors.light
    const [open, setOpen] = useState(false)
    const [status, setStatus] = useState(null)   // { tone, text }
    const [errors, setErrors] = useState([])
    const [dragging, setDragging] = useState(false)
    const dropRef = useRef(null)

    // Drag and drop is a DOM affair. The ref lands on a div under
    // react-native-web; on native this effect never runs because the whole
    // panel is hidden.
    useEffect(() => {
        if (Platform.OS !== 'web' || !open) return
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

    if (!BATCH_SUPPORTED) return null

    const downloadBodyTemplate = () => {
        saveCsv(BODY_TEMPLATE_FILENAME, BODY_TEMPLATE_CSV)
    }

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

        const result = onLoadRoster ? onLoadRoster(file.text) : { ok: false, message: 'Nothing to load into.' }
        setErrors(result.errors || [])
        setStatus({ tone: result.ok ? (result.errors?.length ? 'warn' : 'ok') : 'bad', text: result.message })
        if (result.ok) setTimeout(close, 1200)
    }

    const close = () => { setOpen(false); setStatus(null); setErrors([]); setDragging(false) }
    const toneColor = { ok: Colors.primary, warn: '#c98a00', bad: Colors.warning }

    return (
        <>
            <View style={styles.pageRow}>
                <ThemedButton onPress={() => setOpen(true)} style={styles.btn}>
                    <ThemedText style={styles.btnText}>Load Saved Roster</ThemedText>
                </ThemedButton>
                <ThemedButton
                    onPress={downloadBodyTemplate}
                    style={[styles.btn, { backgroundColor: theme.uiBackground }]}
                >
                    <ThemedText style={styles.btnAltText}>Download Scale Body Addition Template</ThemedText>
                </ThemedButton>
            </View>

            <Modal visible={open} transparent animationType="fade" onRequestClose={close}>
                <Pressable style={styles.backdrop} onPress={close}>
                    {/* Swallows the press so clicking inside doesn't close it. */}
                    <Pressable onPress={() => {}} style={{ width: '100%', maxWidth: 680 }}>
                        <ThemedCard style={styles.sheet}>
                            <View style={styles.titleRow}>
                                    <ThemedText style={styles.h2}>Load a saved roster</ThemedText>
                                    <Pressable onPress={close} hitSlop={10} accessibilityRole="button" accessibilityLabel="Close">
                                        <ThemedText style={[styles.close, { color: theme.muted }]}>✕</ThemedText>
                                    </Pressable>
                            </View>

                            <ScrollView contentContainerStyle={styles.sheetInner}>
                                <ThemedText style={[styles.sub, { color: theme.muted }]}>
                                    Drop in a roster you saved earlier and the characters come back — their
                                    measurements, scale and head sculpt with them. This replaces whatever is
                                    on screen rather than adding to it.
                                </ThemedText>

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
        </>
    )
}

export default BatchPanel

const styles = StyleSheet.create({
    pageRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },

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
    warnNote: { fontWeight: '600' },
    label: { fontSize: 12, marginBottom: 6, fontWeight: '600' },

    drop: {
        borderWidth: 2, borderStyle: 'dashed', borderRadius: 10,
        paddingVertical: 28, paddingHorizontal: 16,
        alignItems: 'center', gap: 8,
    },
    dropBig: { fontSize: 16, fontWeight: '700' },
    dropSmall: { fontSize: 13 },

    btn: { marginVertical: 0, paddingHorizontal: 20 },
    alt: { alignSelf: 'flex-start' },
    btnText: { color: '#ffffff', fontWeight: '700', fontSize: 15 },
    btnAltText: { fontWeight: '700', fontSize: 15 },

    status: { fontSize: 14, fontWeight: '600', lineHeight: 20 },
    errors: { marginTop: 12, borderWidth: 1, borderRadius: 8, padding: 12, gap: 6 },
    errorLine: { fontSize: 13, lineHeight: 18 },
})
