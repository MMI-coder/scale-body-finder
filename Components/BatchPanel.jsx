import { useState } from 'react'
import { StyleSheet, View, useColorScheme } from 'react-native'
import { Colors } from '../Constants/Colors'
import { parseCharacterCsv, runBatch, templateCsv } from '../utils/batch'
import { BATCH_SUPPORTED, pickCsvFile, saveCsv } from '../utils/batchFile'
import { DEFAULT_BODY_TYPE, rowsToCsv } from '../utils/matching'
import Spacer from './Spacer'
import ThemedButton from './ThemedButton'
import ThemedCard from './ThemedCard'
import ThemedText from './ThemedText'

/**
 * Upload a roster, get every result back as one CSV.
 *
 * Each row carries its own scale, priority and result count, so characters in
 * the same file can be compared at different scales.
 */
const BatchPanel = ({ bodyType = DEFAULT_BODY_TYPE }) => {
    const colorScheme = useColorScheme()
    const theme = Colors[colorScheme] ?? Colors.light
    const [status, setStatus] = useState(null)   // { tone, text }
    const [errors, setErrors] = useState([])

    if (!BATCH_SUPPORTED) return null

    const downloadTemplate = () => {
        saveCsv('Scale_Body_Finder_Character_Template.csv', templateCsv())
        setErrors([])
        setStatus({ tone: 'ok', text: 'Template downloaded. Fill in a row per character — measurements in millimetres.' })
    }

    const upload = async () => {
        setStatus(null)
        setErrors([])
        let file
        try {
            file = await pickCsvFile()
        } catch (err) {
            setStatus({ tone: 'bad', text: err.message })
            return
        }
        if (!file) return

        const { jobs, errors: problems, fatal } = parseCharacterCsv(file.text)

        if (fatal || !jobs.length) {
            setErrors(problems)
            setStatus({
                tone: 'bad',
                text: fatal
                    ? 'Nothing was processed.'
                    : `Nothing could be read from ${file.name}.`,
            })
            return
        }

        // The upload has no Body Type column - it runs against whichever section
        // is on screen, so the same roster can be run twice for a comparison.
        const { rows, characters, resultRows } = runBatch(jobs, undefined, bodyType)
        saveCsv(
            bodyType === DEFAULT_BODY_TYPE
                ? 'Scale_Body_Finder_Batch_Results.csv'
                : `Scale_Body_Finder_Batch_Results_${bodyType}.csv`,
            rowsToCsv(rows))
        setErrors(problems)
        setStatus({
            tone: problems.length ? 'warn' : 'ok',
            text: `${characters} character${characters === 1 ? '' : 's'} processed, ` +
                  `${resultRows} ${bodyType.toLowerCase()} result row${resultRows === 1 ? '' : 's'} downloaded.` +
                  (problems.length ? ` ${problems.length} row${problems.length === 1 ? '' : 's'} skipped.` : ''),
        })
    }

    const toneColor = { ok: Colors.primary, warn: '#c98a00', bad: Colors.warning }

    return (
        <ThemedCard>
            <ThemedText style={styles.h2}>Multiple characters at once</ThemedText>
            <ThemedText style={[styles.sub, { color: theme.muted }]}>
                Upload a CSV and get one back with every result in it. Each row carries its own
                Scale Reference Selector, Measurement Priority Field and number of results, so one
                character can be compared at 1:6 and the next at 1:5 3/4 in the same file.
            </ThemedText>
            <ThemedText style={[styles.sub, styles.warnNote, { color: theme.muted }]}>
                All measurements must be in millimetres. A height of 158 will be rejected — it wants 1580.
            </ThemedText>
            <ThemedText style={[styles.sub, { color: theme.muted }]}>
                The file has no Body Type column. The run uses the Body Type selected at the top of the page
                — currently {bodyType} — so to see both, run the same file once in each.
            </ThemedText>

            <Spacer height={16} />

            <View style={styles.row}>
                <ThemedButton onPress={downloadTemplate} style={[styles.btn, { backgroundColor: theme.uiBackground }]}>
                    <ThemedText style={styles.btnAltText}>Download character template</ThemedText>
                </ThemedButton>
                <ThemedButton onPress={upload} style={styles.btn}>
                    <ThemedText style={styles.btnText}>Upload characters</ThemedText>
                </ThemedButton>
            </View>

            {status ? (
                <>
                    <Spacer height={14} />
                    <ThemedText style={[styles.status, { color: toneColor[status.tone] }]}>
                        {status.text}
                    </ThemedText>
                </>
            ) : null}

            {errors.length ? (
                <View style={[styles.errors, { borderColor: theme.cardBorder, backgroundColor: theme.uiBackground }]}>
                    {errors.map((e, i) => (
                        <ThemedText key={i} style={[styles.errorLine, { color: theme.text }]}>
                            {e}
                        </ThemedText>
                    ))}
                </View>
            ) : null}
        </ThemedCard>
    )
}

export default BatchPanel

const styles = StyleSheet.create({
    h2: { fontSize: 22, fontWeight: '700' },
    sub: { fontSize: 14, lineHeight: 20, marginTop: 6, maxWidth: 900 },
    warnNote: { fontWeight: '600' },
    row: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
    btn: { marginVertical: 0, paddingHorizontal: 20 },
    btnText: { color: '#ffffff', fontWeight: '700', fontSize: 15 },
    btnAltText: { fontWeight: '700', fontSize: 15 },
    status: { fontSize: 14, fontWeight: '600', lineHeight: 20 },
    errors: { marginTop: 12, borderWidth: 1, borderRadius: 8, padding: 12, gap: 6 },
    errorLine: { fontSize: 13, lineHeight: 18 },
})
