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
import SegmentedControl from '../Components/SegmentedControl'
import Spacer from '../Components/Spacer'
import ThemedButton from '../Components/ThemedButton'
import ThemedCard from '../Components/ThemedCard'
import ThemedText from '../Components/ThemedText'
import ThemedTextInput from '../Components/ThemedTextInput'
import { Colors } from '../Constants/Colors'
import { BODIES } from '../data/bodies'
import { exportResults } from '../utils/exportCsv'
import { atSixth, findMatches } from '../utils/matching'
import { DEFAULT_UNIT, UNITS, fmtMM, fromMM, toMM } from '../utils/scaleUtils'

const FIELDS = [
    { key: 'height', label: 'Height', hint: 'optional' },
    { key: 'bust', label: 'Bust' },
    { key: 'waist', label: 'Waist' },
    { key: 'hips', label: 'Hips' },
]

const PRIORITY_OPTIONS = [
    { value: 'bust', label: 'Bust' },
    { value: 'waist', label: 'Waist' },
    { value: 'hips', label: 'Hips' },
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
    const [count, setCount] = useState(3)

    // Wide screens get the results side by side; a phone gets one column.
    const columns = width >= 1250 ? 3 : width >= 850 ? 2 : 1

    const setField = (key, text) => setValues((v) => ({ ...v, [key]: text }))

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

    const ready = character.bust && character.waist && character.hips
    const result = useMemo(
        () => (ready ? findMatches(character, priority, count, BODIES) : null),
        [character, priority, count, ready]
    )
    const sixth = useMemo(() => (ready ? atSixth(character) : null), [character, ready])

    const onExport = async () => {
        try {
            await exportResults(character, priority, unit, result)
        } catch (err) {
            const msg = err?.message ?? 'Could not export the results.'
            if (Platform.OS === 'web') window.alert(msg)
            else Alert.alert('Export failed', msg)
        }
    }

    return (
        <ScrollView
            style={{ backgroundColor: theme.background }}
            contentContainerStyle={styles.scroll}
        >
            <View style={styles.page}>
                <ThemedText style={styles.h1} title>Scale Body Finder</ThemedText>
                <ThemedText style={[styles.lede, { color: theme.muted }]}>
                    Enter your character's real-world measurements. You'll get their true 1:6
                    figures, and the seamless bodies that come closest — along with the scale each
                    one actually works out to.
                </ThemedText>

                <Spacer height={22} />

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
                                    {f.label} ({unit}){f.hint ? ` · ${f.hint}` : ''}
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

                    <View style={styles.fieldRow}>
                        <View>
                            <ThemedText style={[styles.label, { color: theme.muted }]}>
                                Priority — the measurement that has to be right
                            </ThemedText>
                            <SegmentedControl
                                options={PRIORITY_OPTIONS}
                                value={priority}
                                onChange={setPriority}
                            />
                        </View>
                        <View>
                            <ThemedText style={[styles.label, { color: theme.muted }]}>Show</ThemedText>
                            <SegmentedControl
                                options={[{ value: 3, label: '3' }, { value: 5, label: '5' }]}
                                value={count}
                                onChange={setCount}
                            />
                        </View>
                    </View>
                </ThemedCard>

                <Spacer height={22} />

                {!ready ? (
                    <ThemedCard>
                        <ThemedText style={{ color: theme.muted }}>
                            Enter a bust, waist and hips measurement to see matches. Height is
                            optional — it's shown for reference but never used to pick bodies.
                        </ThemedText>
                    </ThemedCard>
                ) : (
                    <>
                        {/* ---------------- 1:6 reference ---------------- */}
                        <ThemedCard>
                            <ThemedText style={styles.h2}>
                                {character.name || 'Your character'} at true 1:6
                            </ThemedText>
                            <ThemedText style={[styles.sub, { color: theme.muted }]}>
                                Straight division by six. This is the reference figure, not a target
                                anything is measured against.
                            </ThemedText>
                            <Spacer height={14} />
                            <View style={styles.sixthRow}>
                                {FIELDS.map((f) => (
                                    <View key={f.key} style={styles.sixthItem}>
                                        <ThemedText style={[styles.label, { color: theme.muted }]}>
                                            {f.label}
                                        </ThemedText>
                                        <ThemedText style={styles.sixthValue}>
                                            {fmtMM(sixth[f.key], unit)}
                                            <ThemedText style={[styles.sixthUnit, { color: theme.muted }]}>
                                                {sixth[f.key] == null ? '' : unit}
                                            </ThemedText>
                                        </ThemedText>
                                    </View>
                                ))}
                            </View>
                        </ThemedCard>

                        <Spacer height={26} />

                        {/* ---------------- results ---------------- */}
                        <ThemedText style={styles.h2}>
                            {result.matches.length} closest {result.matches.length === 1 ? 'body' : 'bodies'}
                        </ThemedText>
                        <ThemedText style={[styles.sub, { color: theme.muted }]}>
                            Anchored on {priority}, from {result.considered} bodies. These are options,
                            not a ranking — nothing here is "the winner". Several are hand-measured to
                            ±1mm, which is wider than most of the gaps below.
                        </ThemedText>

                        <Spacer height={16} />

                        <View style={styles.grid}>
                            {result.matches.map((m) => (
                                <View
                                    key={m.body.code}
                                    style={[styles.gridItem, { width: `${100 / columns}%` }]}
                                >
                                    <BodyCard match={m} unit={unit} />
                                </View>
                            ))}
                        </View>

                        {result.excluded.length ? (
                            <>
                                <Spacer height={10} />
                                <ThemedText style={[styles.sub, { color: theme.muted }]}>
                                    {result.excluded.length} body(ies) left out:{' '}
                                    {result.excluded.map((e) => `${e.body.code} (${e.reason})`).join('; ')}
                                </ThemedText>
                            </>
                        ) : null}

                        <Spacer height={20} />
                        <ThemedButton onPress={onExport} style={styles.exportBtn}>
                            <ThemedText style={styles.exportText}>Save results as CSV</ThemedText>
                        </ThemedButton>
                    </>
                )}

                <Spacer height={30} />
                <ThemedText style={[styles.credit, { color: theme.muted }]}>
                    Body measurements are the owner's own unless noted. Product images are
                    manufacturer material — TBLeague (Phicen), VeryCool and Novan Studio — used for
                    identification and comparison; all rights remain with them.
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
    lede: { fontSize: 16, lineHeight: 23, marginTop: 8, maxWidth: 720 },
    sub: { fontSize: 14, lineHeight: 20, marginTop: 6, maxWidth: 820 },
    label: { fontSize: 12, marginBottom: 6, fontWeight: '600' },

    fieldRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 20, alignItems: 'flex-end' },
    nameField: { flexGrow: 1, minWidth: 220 },
    measureRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 14 },
    measureField: { flexGrow: 1, flexBasis: 150, minWidth: 130 },

    sixthRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 28 },
    sixthItem: { minWidth: 96 },
    sixthValue: { fontSize: 28, fontWeight: '800', fontVariant: ['tabular-nums'] },
    sixthUnit: { fontSize: 15, fontWeight: '600' },

    grid: { flexDirection: 'row', flexWrap: 'wrap', marginHorizontal: -8 },
    gridItem: { paddingHorizontal: 8, paddingBottom: 16 },

    exportBtn: { alignSelf: 'flex-start', paddingHorizontal: 26 },
    exportText: { color: '#ffffff', fontWeight: '700', fontSize: 16 },

    credit: { fontSize: 11, lineHeight: 16, maxWidth: 820 },
})
