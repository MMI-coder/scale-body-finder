import { useMemo, useState } from 'react'
import {
    Alert,
    Platform,
    ScrollView,
    StyleSheet,
    View,
    useColorScheme,
    useWindowDimensions,
} from 'react-native'

import BodyCard from '../Components/BodyCard'
import Dropdown from '../Components/Dropdown'
import SegmentedControl from '../Components/SegmentedControl'
import Spacer from '../Components/Spacer'
import ThemedButton from '../Components/ThemedButton'
import ThemedCard from '../Components/ThemedCard'
import ThemedText from '../Components/ThemedText'
import ThemedTextInput from '../Components/ThemedTextInput'
import { Colors } from '../Constants/Colors'
import { BODIES } from '../data/bodies'
import { GLOSSARY } from '../data/glossary'
import { exportResults } from '../utils/exportCsv'
import { compareBodies } from '../utils/matching'
import {
    DEFAULT_UNIT,
    DEFAULT_WORKING_SCALE,
    UNITS,
    WORKING_SCALES,
    fmtMM,
    fromMM,
    scaleName,
    toMM,
} from '../utils/scaleUtils'

const FIELDS = [
    { key: 'height', label: 'Height' },
    { key: 'bust', label: 'Bust' },
    { key: 'waist', label: 'Waist' },
    { key: 'hips', label: 'Hips' },
]

const PRIORITY_OPTIONS = [
    { value: 'height', label: 'Height' },
    { value: 'bust', label: 'Bust' },
    { value: 'waist', label: 'Waist' },
    { value: 'hips', label: 'Hips' },
]

const SORT_OPTIONS = [
    { value: 'least', label: 'Least difference' },
    { value: 'greatest', label: 'Greatest difference' },
]

const COUNT_OPTIONS = [
    { value: 3, label: '3' },
    { value: 5, label: '5' },
    { value: 0, label: 'All' },
]

const emptyValues = { height: '', bust: '', waist: '', hips: '' }

export default function Index() {
    const colorScheme = useColorScheme()
    const theme = Colors[colorScheme] ?? Colors.light
    const { width } = useWindowDimensions()

    const [name, setName] = useState('')
    const [unit, setUnit] = useState(DEFAULT_UNIT)
    const [values, setValues] = useState(emptyValues)
    const [priority, setPriority] = useState('bust')
    const [workingScale, setWorkingScale] = useState(DEFAULT_WORKING_SCALE)
    const [sort, setSort] = useState('least')
    const [count, setCount] = useState(3)
    const [expanded, setExpanded] = useState({})

    const columns = width >= 1250 ? 3 : width >= 850 ? 2 : 1

    const setField = (key, text) => setValues((v) => ({ ...v, [key]: text }))
    const toggleCard = (code) => setExpanded((e) => ({ ...e, [code]: !e[code] }))

    // Switching units rewrites what's in the boxes, so the measurement itself
    // stays put rather than silently changing size.
    const changeUnit = (next) => {
        if (next === unit) return
        setValues((v) => {
            const out = {}
            for (const { key } of FIELDS) {
                const n = parseFloat(v[key])
                out[key] = Number.isFinite(n)
                    ? String(parseFloat(fromMM(toMM(n, unit), next).toFixed(4)))
                    : v[key]
            }
            return out
        })
        setUnit(next)
    }

    const character = useMemo(() => {
        const mm = {}
        for (const { key } of FIELDS) {
            const n = parseFloat(values[key])
            mm[key] = Number.isFinite(n) && n > 0 ? toMM(n, unit) : null
        }
        return { name: name.trim(), ...mm }
    }, [values, unit, name])

    const ready = character.height && character.bust && character.waist && character.hips
    const opts = { workingScale, priority, sort, count: count || null, bodies: BODIES }
    const outcome = useMemo(
        () => (ready ? compareBodies(character, opts) : null),
        [character, workingScale, priority, sort, count, ready]
    )

    const onExport = async () => {
        try {
            await exportResults(character, opts, outcome)
        } catch (err) {
            const msg = err?.message ?? 'Could not export the results.'
            if (Platform.OS === 'web') window.alert(msg)
            else Alert.alert('Export failed', msg)
        }
    }

    const scaleLabel = scaleName(workingScale)
    const isSixth = workingScale === 6

    return (
        <ScrollView style={{ backgroundColor: theme.background }} contentContainerStyle={styles.scroll}>
            <View style={styles.page}>
                <ThemedText style={styles.h1} title>Scale Body Finder</ThemedText>
                <ThemedText style={[styles.lede, { color: theme.muted }]}>
                    Find the best body for your project!
                </ThemedText>

                <Spacer height={22} />

                {/* ---------------- how to use ---------------- */}
                <ThemedCard>
                    <ThemedText style={styles.h2}>How to use this tool</ThemedText>
                    <Spacer height={10} />
                    {[
                        "Start by entering your character's name and their real world measurements for height, bust, waist, and hips (in either cm or mm) in the fields below.",
                        'Next, choose which measurement field is most important to you and your project: Height, Bust, Waist, or Hips.',
                        'Your results will be displayed below. Click on a card to view more details.',
                    ].map((line, i) => (
                        <View key={i} style={styles.step}>
                            <ThemedText style={[styles.stepNum, { color: Colors.primary }]}>{i + 1}</ThemedText>
                            <ThemedText style={[styles.stepText, { color: theme.muted }]}>{line}</ThemedText>
                        </View>
                    ))}
                </ThemedCard>

                <Spacer height={20} />

                {/* ---------------- input ---------------- */}
                <ThemedCard>
                    <View style={styles.fieldRow}>
                        <View style={styles.nameField}>
                            <ThemedText style={[styles.label, { color: theme.muted }]}>Character</ThemedText>
                            <ThemedTextInput
                                value={name}
                                onChangeText={setName}
                                placeholder="e.g. Kasumi"
                                autoCorrect={false}
                            />
                        </View>
                        <View>
                            <ThemedText style={[styles.label, { color: theme.muted }]}>Units</ThemedText>
                            <SegmentedControl options={UNITS} value={unit} onChange={changeUnit} />
                        </View>
                    </View>

                    <Spacer height={18} />

                    <View style={styles.measureRow}>
                        {FIELDS.map((f) => (
                            <View key={f.key} style={styles.measureField}>
                                <ThemedText style={[styles.label, { color: theme.muted }]}>
                                    {f.label} ({unit})
                                </ThemedText>
                                <ThemedTextInput
                                    value={values[f.key]}
                                    onChangeText={(t) => setField(f.key, t)}
                                    placeholder="—"
                                    keyboardType="decimal-pad"
                                    inputMode="decimal"
                                />
                            </View>
                        ))}
                    </View>

                    <Spacer height={18} />

                    <ThemedText style={styles.controlName}>Measurement Priority Field</ThemedText>
                    <ThemedText style={[styles.label, { color: theme.muted }]}>
                        Choose which measurement field is most important to you and your project. This helps
                        sort the results list.
                    </ThemedText>
                    <SegmentedControl options={PRIORITY_OPTIONS} value={priority} onChange={setPriority} />

                    <Spacer height={18} />

                    <View style={styles.fieldRow}>
                        <View>
                            <ThemedText style={[styles.label, { color: theme.muted }]}>Sort by</ThemedText>
                            <SegmentedControl options={SORT_OPTIONS} value={sort} onChange={setSort} />
                        </View>
                        <View>
                            <ThemedText style={[styles.label, { color: theme.muted }]}>Show</ThemedText>
                            <SegmentedControl options={COUNT_OPTIONS} value={count} onChange={setCount} />
                        </View>
                    </View>

                    <Spacer height={18} />
                    <ThemedText style={styles.controlName}>Scale Reference Selector</ThemedText>
                    <ThemedText style={[styles.label, { color: theme.muted }]}>
                        Use this to compare your character's 1:1 measurements to the physical
                        measurements of the available bodies on the market. 1:6th scale is the default.
                    </ThemedText>
                    <Dropdown
                        options={WORKING_SCALES.map((v) => ({ value: v, label: scaleName(v) }))}
                        value={workingScale}
                        onChange={setWorkingScale}
                        width={190}
                    />
                </ThemedCard>

                <Spacer height={22} />

                {!ready ? (
                    <ThemedCard>
                        <ThemedText style={{ color: theme.muted }}>
                            Enter a height, bust, waist and hips measurement to see results.
                        </ThemedText>
                    </ThemedCard>
                ) : (
                    <>
                        {/* ---------------- scaled reference ---------------- */}
                        <ThemedCard>
                            <ThemedText style={styles.h2}>
                                {character.name || 'Your character'} in {isSixth ? '1:6th' : scaleLabel} Scale
                            </ThemedText>
                            <ThemedText style={[styles.sub, { color: theme.muted }]}>
                                Your character scaled to {isSixth ? '1:6th' : scaleLabel} scale. Use in reference to
                                the results below.
                            </ThemedText>
                            <Spacer height={14} />
                            <View style={styles.sixthRow}>
                                {FIELDS.map((f) => (
                                    <View key={f.key} style={styles.sixthItem}>
                                        <ThemedText style={[styles.label, { color: theme.muted }]}>
                                            {f.label}
                                        </ThemedText>
                                        <ThemedText style={styles.sixthValue}>
                                            {fmtMM(outcome.scaled[f.key], unit)}
                                            <ThemedText style={[styles.sixthUnit, { color: theme.muted }]}>
                                                {unit}
                                            </ThemedText>
                                        </ThemedText>
                                    </View>
                                ))}
                            </View>
                        </ThemedCard>

                        <Spacer height={26} />

                        {/* ---------------- results ---------------- */}
                        <ThemedText style={styles.h2}>Results</ThemedText>
                        <ThemedText style={[styles.sub, { color: theme.muted }]}>
                            {outcome.results.length} result{outcome.results.length === 1 ? '' : 's'} based on the data
                            you provided, compared at {scaleLabel} and sorted by{' '}
                            {sort === 'least' ? 'least' : 'greatest'} difference in {priority}.
                        </ThemedText>

                        <Spacer height={16} />

                        <View style={styles.grid}>
                            {outcome.results.map((r) => (
                                <View key={r.body.code} style={[styles.gridItem, { width: `${100 / columns}%` }]}>
                                    <BodyCard
                                        result={r}
                                        unit={unit}
                                        expanded={!!expanded[r.body.code]}
                                        onToggle={() => toggleCard(r.body.code)}
                                    />
                                </View>
                            ))}
                        </View>

                        <Spacer height={20} />
                        <ThemedButton onPress={onExport} style={styles.exportBtn}>
                            <ThemedText style={styles.exportText}>Save results as CSV</ThemedText>
                        </ThemedButton>

                        <Spacer height={30} />

                        {/* ---------------- glossary ---------------- */}
                        <ThemedCard>
                            <ThemedText style={styles.h2}>Data Card Glossary</ThemedText>
                            <Spacer height={10} />
                            {GLOSSARY.map(({ term, definition }) => (
                                <View key={term} style={styles.glossItem}>
                                    <ThemedText style={styles.glossTerm}>{term}</ThemedText>
                                    <ThemedText style={[styles.glossDef, { color: theme.muted }]}>
                                        {definition}
                                    </ThemedText>
                                </View>
                            ))}
                        </ThemedCard>
                    </>
                )}

                <Spacer height={30} />
                <ThemedText style={[styles.credit, { color: theme.muted }]}>
                    Product images are manufacturer material — TBLeague (Phicen), VeryCool and Novan Studio — used
                    for identification and comparison; all rights remain with them.
                </ThemedText>
                <Spacer height={40} />
            </View>
        </ScrollView>
    )
}

const styles = StyleSheet.create({
    scroll: { padding: 20, alignItems: 'center' },
    page: { width: '100%', maxWidth: 1400 },

    h1: { fontSize: 32, fontWeight: '800', letterSpacing: -0.5 },
    h2: { fontSize: 22, fontWeight: '700' },
    lede: { fontSize: 17, lineHeight: 24, marginTop: 8, maxWidth: 720 },
    sub: { fontSize: 14, lineHeight: 20, marginTop: 6, maxWidth: 900 },
    label: { fontSize: 12, marginBottom: 6, fontWeight: '600' },
    controlName: { fontSize: 15, fontWeight: '700', marginBottom: 3 },

    step: { flexDirection: 'row', gap: 10, marginBottom: 8 },
    stepNum: { fontSize: 14, fontWeight: '800', width: 16 },
    stepText: { fontSize: 14, lineHeight: 20, flex: 1 },

    fieldRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 20, alignItems: 'flex-end' },
    nameField: { flexGrow: 1, minWidth: 220 },
    measureRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 14 },
    measureField: { flexGrow: 1, flexBasis: 150, minWidth: 130 },

    scaleChips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    chip: { marginVertical: 0, paddingVertical: 10, paddingHorizontal: 14, borderRadius: 8 },
    chipText: { fontSize: 14, fontWeight: '600' },

    sixthRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 28 },
    sixthItem: { minWidth: 96 },
    sixthValue: { fontSize: 28, fontWeight: '800', fontVariant: ['tabular-nums'] },
    sixthUnit: { fontSize: 15, fontWeight: '600' },

    grid: { flexDirection: 'row', flexWrap: 'wrap', marginHorizontal: -8, alignItems: 'flex-start' },
    gridItem: { paddingHorizontal: 8, paddingBottom: 16 },

    exportBtn: { alignSelf: 'flex-start', paddingHorizontal: 26 },
    exportText: { color: '#ffffff', fontWeight: '700', fontSize: 16 },

    glossItem: { marginBottom: 10 },
    glossTerm: { fontSize: 15, fontWeight: '700' },
    glossDef: { fontSize: 13, lineHeight: 19, marginTop: 2 },

    credit: { fontSize: 11, lineHeight: 16, maxWidth: 820 },
})
