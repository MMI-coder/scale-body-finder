import { useState } from 'react'
import { StyleSheet, View, useColorScheme } from 'react-native'
import { Colors } from '../Constants/Colors'
import { BODY_TEMPLATE_CSV, BODY_TEMPLATE_FILENAME } from '../data/bodyTemplate'
import { BATCH_SUPPORTED, saveCsv } from '../utils/batchFile'
import { DEFAULT_GENDER } from '../utils/matching'
import { ROSTER_TEMPLATE_FILENAME, rosterTemplateCsv } from '../utils/roster'
import LoadCsvModal from './LoadCsvModal'
import ThemedButton from './ThemedButton'
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

    if (!BATCH_SUPPORTED) return null

    const downloadBodyTemplate = () => {
        saveCsv(BODY_TEMPLATE_FILENAME, BODY_TEMPLATE_CSV)
    }

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

            <LoadCsvModal
                visible={open}
                onClose={() => setOpen(false)}
                title="Load a saved roster"
                blurb="Drop in a roster you saved earlier and the characters come back — their measurements, scale and head sculpt with them. This replaces whatever is on screen rather than adding to it. Writing one by hand? The template has every column, in millimetres, with an example row that is always skipped on upload."
                onLoad={onLoadRoster}
                template={{
                    label: 'Download roster template',
                    onPress: () => saveCsv(ROSTER_TEMPLATE_FILENAME, rosterTemplateCsv()),
                }}
            />
        </>
    )
}

export default BatchPanel

const styles = StyleSheet.create({
    pageRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
    btn: { marginVertical: 0, paddingHorizontal: 20 },
    btnText: { color: '#ffffff', fontWeight: '700', fontSize: 15 },
    btnAltText: { fontWeight: '700', fontSize: 15 },
})
