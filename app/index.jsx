import { useEffect, useMemo, useState } from 'react'
import {
    Alert,
    Platform,
    Pressable,
    ScrollView,
    StyleSheet,
    View,
    useColorScheme,
    useWindowDimensions,
} from 'react-native'

import BatchPanel from '../Components/BatchPanel'
import BodyCard from '../Components/BodyCard'
import Dropdown from '../Components/Dropdown'
import PageNav from '../Components/PageNav'
import SegmentedControl from '../Components/SegmentedControl'
import Spacer from '../Components/Spacer'
import ThemedButton from '../Components/ThemedButton'
import ThemedCard from '../Components/ThemedCard'
import ThemedText from '../Components/ThemedText'
import ThemedTextInput from '../Components/ThemedTextInput'
import { blankEntry, isFocus, markFinderShown, newId, useWorkspace } from '../state/workspace'
import { Colors } from '../Constants/Colors'
import { BODIES, bodyImage } from '../data/bodies'
import { GLOSSARY } from '../data/glossary'
import { BATCH_SUPPORTED, saveCsv } from '../utils/batchFile'
import { exportResults } from '../utils/exportCsv'
import { PRINT_SUPPORTED, printResults } from '../utils/printResults'
import { rosterFromCsv, rosterToCsv } from '../utils/roster'
import {
    GENDERS,
    HEAD_SIZES,
    HEIGHT_ESTIMATE_NOTE,
    PRIORITIES_BY_GENDER,
    PROPORTIONS,
    compareBodies,
} from '../utils/matching'
import {
    fmtDelta,
    UNITS,
    WORKING_SCALES,
    fmtMM,
    fromMM,
    realWorldEquivalent,
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

/**
 * The two catalogues.
 *
 * This was Seamless/Jointed until male bodies arrived. Male bodies come in both
 * constructions, so the split moved to the bigger divide and Seamless/Jointed
 * became a note on the card. Female results now mix the two.
 */
const SECTION_OPTIONS = GENDERS.map((g) => ({ value: g, label: g }))

const SECTION_BLURB = {
    Female: 'Seamless and jointed female bodies together. Sorted on whichever measurement matters most to you.',
    Male: 'Male bodies, seamless and jointed together. Height is the question here - manufacturers rarely publish chest, waist or hips - so height is what these sort on, and each card carries a build so you can see whether it looks the part.',
}

const HEAD_OPTIONS = HEAD_SIZES.map((v) => ({ value: v, label: `${v}mm` }))

const SORT_OPTIONS = [
    { value: 'least', label: 'Least difference' },
    { value: 'greatest', label: 'Greatest difference' },
]

/**
 * How many characters one round can hold.
 *
 * Matched to the scale tool. There are thirty-odd characters worth doing
 * eventually, but not in one sitting, and a page of ten entries is already a
 * lot to look at.
 */
const MAX_CHARACTERS = 10

/** How many bodies reach the printed sheet, per character. */
const PRINTED_RESULTS = 10

/** Defined terms keep their capital in prose, so the page and the CSV agree. */
const cap = (w) => (w ? w.charAt(0).toUpperCase() + w.slice(1) : w)

export default function Index() {
    const colorScheme = useColorScheme()
    const theme = Colors[colorScheme] ?? Colors.light
    const { width } = useWindowDimensions()

    const {
        gender, setGender, unit, changeUnit, roster, setRoster, active, setActive, scene, setScene,
    } = useWorkspace()
    const [expanded, setExpanded] = useState({})
    const [showGlossary, setShowGlossary] = useState(false)

    useEffect(markFinderShown, [])

    /**
     * The roster.
     *
     * Everything that varies per character lives in an entry - including the
     * scale and the head sculpt, because those are decisions about the
     * character rather than about the session. A short character wants the
     * small sculpt and may want a different scale than a tall one, and a round
     * of ten should be able to say so.
     *
     * Units and catalogue stay outside: those are about how you like to work.
     *
     * Held in state/workspace.js rather than here, so it survives a trip to
     * the scene page and back.
     */
    const entry = roster[Math.min(active, roster.length - 1)] ?? blankEntry()

    const patch = (fields) =>
        setRoster((r) => r.map((e, i) => (i === active ? { ...e, ...fields } : e)))

    // The form below is unchanged - it reads and writes the active entry
    // through these, so adding a roster did not mean rewriting every field.
    const { name, values, priority, workingScale, headSize, sort } = entry
    const setName = (v) => patch({ name: v })
    const setValues = (v) => patch({ values: typeof v === 'function' ? v(entry.values) : v })
    const setPriority = (v) => patch({ priority: v })
    const setWorkingScale = (v) => patch({ workingScale: v })
    const setHeadSize = (v) => patch({ headSize: v })
    const setSort = (v) => patch({ sort: v })

    /**
     * Every usable character in the roster, each compared on its own terms.
     *
     * Separate from the one on screen: the screen shows whoever is selected,
     * with everything; the sheet shows all of them, top ten each.
     */
    const generate = () => {
        const sheets = []
        for (const e of roster) {
            const mm = {}
            for (const { key } of [...FIELDS, ...PROPORTIONS]) {
                const n = parseFloat(e.values[key])
                mm[key] = Number.isFinite(n) && n > 0 ? toMM(n, unit) : null
            }
            const c = { name: e.name.trim(), ...mm }
            if (!needed.every((k) => c[k])) continue

            const pri = PRIORITIES_BY_GENDER[gender].includes(e.priority)
                ? e.priority
                : PRIORITIES_BY_GENDER[gender][0]
            const o = {
                workingScale: e.workingScale, priority: pri, sort: e.sort,
                count: null, gender, headSize: e.headSize, bodies: BODIES,
            }
            sheets.push({ character: c, opts: o, outcome: compareBodies(c, o), limit: PRINTED_RESULTS })
        }

        if (!sheets.length) {
            const msg = `Nothing to print yet — fill in ${needed.join(', ')} for at least one character.`
            if (Platform.OS === 'web') window.alert(msg)
            else Alert.alert('Nothing to print', msg)
            return
        }

        // The roster file comes out alongside, so the thing you just printed
        // can be loaded back and adjusted rather than retyped.
        saveRoster()

        const res = printResults(sheets, {
            unit,
            mm: (v, u) => fmtMM(v, u),
            delta: (v, u) => fmtDelta(v, u),
            scaleName,
            heightNote: HEIGHT_ESTIMATE_NOTE,
            imageUrl: (file) => {
                const src = bodyImage(file)
                if (!src) return null
                return typeof src === 'string' ? src : src?.uri ?? null
            },
        })
        if (!res.ok && res.message) {
            if (Platform.OS === 'web') window.alert(res.message)
            else Alert.alert('Could not print', res.message)
        }
    }

    const saveRoster = () => {
        saveCsv('Scale_Body_Finder_Roster.csv', rosterToCsv(roster, unit, toMM))
    }

    const loadRoster = (text) => {
        const { entries, errors } = rosterFromCsv(text, gender, fromMM, unit)
        if (!entries.length) {
            return { ok: false, message: errors[0] || 'Nothing could be read from that file.' }
        }
        setRoster(entries.slice(0, MAX_CHARACTERS).map((e) => ({ ...e, id: newId() })))
        setActive(0)
        setExpanded({})
        const over = entries.length > MAX_CHARACTERS
            ? ` The first ${MAX_CHARACTERS} were kept; the file had ${entries.length}.`
            : ''
        return {
            ok: true,
            message: `${Math.min(entries.length, MAX_CHARACTERS)} character${entries.length === 1 ? '' : 's'} loaded.` + over,
            errors,
        }
    }

    const addCharacter = () => {
        if (roster.length >= MAX_CHARACTERS) return
        setRoster((r) => [...r, blankEntry()])
        setActive(roster.length)
        setExpanded({})
    }

    const removeCharacter = (i) => {
        if (roster.length === 1) { setRoster([blankEntry()]); setActive(0); setExpanded({}); return }
        setRoster((r) => r.filter((_, j) => j !== i))
        setActive((a) => (a >= i && a > 0 ? a - 1 : a))
        setExpanded({})
    }

    const columns = width >= 1250 ? 3 : width >= 850 ? 2 : 1

    // Male bodies are published with a peg height and little else, so height is
    // the only thing there is data to sort on. Showing four buttons where three
    // do nothing would just be a lie about what the section can do.
    const priorityOptions = PRIORITY_OPTIONS.filter((o) =>
        PRIORITIES_BY_GENDER[gender].includes(o.value))
    const allowed = PRIORITIES_BY_GENDER[gender].includes(priority)
    const activePriority = allowed ? priority : PRIORITIES_BY_GENDER[gender][0]

    // Switching to Male with Waist selected would otherwise leave a dead choice
    // sitting in state, and the next switch back would restore it silently.
    if (!allowed && priority !== activePriority) setPriority(activePriority)

    // Male measurements beyond height are rarely published, so asking for a
    // full set would be asking for numbers that change nothing.
    const needed = gender === 'Male' ? ['height'] : ['height', 'bust', 'waist', 'hips']

    /**
     * Switching catalogue starts a new character.
     *
     * You change section because you are looking for a different character, not
     * to see the same one measured against bodies that were never made for
     * them. Carrying Kasumi's bust and hips into the male list is noise at best
     * and a wrong answer at worst.
     *
     * Preferences stay: units, scale, sort and how many results to show are
     * about how you like to work, not about who you are looking for.
     */
    const changeGender = (next) => {
        if (next === gender) return
        setGender(next)
        setRoster([blankEntry()])
        setActive(0)
        setExpanded({})
    }

    const setField = (key, text) => setValues((v) => ({ ...v, [key]: text }))
    const toggleCard = (code) => setExpanded((e) => ({ ...e, [code]: !e[code] }))

    const character = useMemo(() => {
        const mm = {}
        for (const { key } of [...FIELDS, ...PROPORTIONS]) {
            const n = parseFloat(values[key])
            mm[key] = Number.isFinite(n) && n > 0 ? toMM(n, unit) : null
        }
        return { name: name.trim(), ...mm }
    }, [values, unit, name])

    const ready = needed.every((k) => character[k])
    const opts = { workingScale, priority: activePriority, sort, count: null, gender, headSize, bodies: BODIES }
    const outcome = useMemo(
        () => (ready ? compareBodies(character, opts) : null),
        [character, workingScale, activePriority, sort, gender, headSize, ready]
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

    /**
     * "Use for scene": copy this body's Actual Body Scale into the scene, and
     * make this character the one the scene is about.
     *
     * A copy, not a link. Actual Body Scale is the character's priority
     * measurement over the body's, so it moves when the priority does - and
     * switching to Hips just to have a look should not resize every prop in
     * the scene. The scene field stays editable afterwards.
     */
    const chooseForScene = (r) => {
        if (!r.closest) return
        setScene((s) => ({
            ...s,
            scaleText: r.closest.name,
            focusId: entry.id,
            focusName: name.trim() || null,
            source: {
                scaleText: r.closest.name,
                bodyName: r.body.name,
                characterName: name.trim() || `Character ${active + 1}`,
                priority: activePriority,
            },
        }))
    }

    // Lit only while the scene still holds exactly what this card would give
    // it - same character, same body, same scale. Change the priority and the
    // card's scale moves, so it stops claiming to be the scene's.
    const isSceneScale = (r) =>
        !!r.closest &&
        isFocus(scene, entry) &&
        scene.source?.bodyName === r.body.name &&
        scene.scaleText.trim() === r.closest.name

    const scaleLabel = scaleName(workingScale)
    const isSixth = workingScale === 6

    return (
        <ScrollView style={{ backgroundColor: theme.background }} contentContainerStyle={styles.scroll}>
            <View style={styles.page}>
                <ThemedText style={styles.h1} title>Scale Body Finder</ThemedText>
                <ThemedText style={[styles.lede, { color: theme.muted }]}>
                    Find the best body for your project!
                </ThemedText>

                <Spacer height={16} />
                <PageNav />

                <Spacer height={22} />

                {/* ---------------- which catalogue ----------------
                    Only shown when there is more than one to choose between.
                    The male catalogue is parked; see parked/README.md. */}
                {SECTION_OPTIONS.length > 1 ? (
                    <>
                        <ThemedCard>
                            <ThemedText style={styles.controlName}>Gender</ThemedText>
                            <ThemedText style={[styles.label, { color: theme.muted }]}>
                                Choose which kind of body you are shopping for. Only that kind is searched.
                            </ThemedText>
                            <SegmentedControl options={SECTION_OPTIONS} value={gender} onChange={changeGender} />
                            <Spacer height={10} />
                            <ThemedText style={[styles.sub, { color: theme.muted, marginTop: 0 }]}>
                                {SECTION_BLURB[gender]}
                            </ThemedText>
                        </ThemedCard>

                        <Spacer height={20} />
                    </>
                ) : null}

                {/* ---------------- how to use ---------------- */}
                <ThemedCard>
                    <ThemedText style={styles.h2}>How to use this tool</ThemedText>
                    <Spacer height={10} />
                    {(gender === 'Male'
                        ? [
                            "Start by entering your character's name and their real world height (in either cm or mm) in the fields below. Chest, waist and hips are optional - most male bodies are not published with them.",
                            'Results are sorted on Height, which is the measurement male bodies are actually published with. Each card carries a build so you can see whether it looks the part.',
                            'Your results will be displayed below. Click on a card to view more details.',
                        ]
                        : [
                            "Start by entering your character's name and their real world measurements for height, bust, waist, and hips (in either cm or mm) in the fields below.",
                            'Next, choose which measurement field is most important to you and your project: Height, Bust, Waist, or Hips.',
                            'Your results will be displayed below. Click on a card to view more details.',
                        ]
                    ).map((line, i) => (
                        <View key={i} style={styles.step}>
                            <ThemedText style={[styles.stepNum, { color: Colors.primary }]}>{i + 1}</ThemedText>
                            <ThemedText style={[styles.stepText, { color: theme.muted }]}>{line}</ThemedText>
                        </View>
                    ))}
                </ThemedCard>

                <Spacer height={20} />

                {/* ---------------- the roster ---------------- */}
                <ThemedCard>
                    <ThemedText style={styles.controlName}>
                        Characters ({roster.length}/{MAX_CHARACTERS})
                    </ThemedText>
                    <ThemedText style={[styles.label, { color: theme.muted }]}>
                        Each one keeps its own measurements, scale and head sculpt. Pick one to
                        edit it below.
                    </ThemedText>
                    <View style={styles.chipRow}>
                        {roster.map((e, i) => {
                            const on = i === active
                            return (
                                <Pressable
                                    key={e.id}
                                    onPress={() => { setActive(i); setExpanded({}) }}
                                    accessibilityRole="button"
                                    accessibilityState={{ selected: on }}
                                    style={[
                                        styles.chip,
                                        { borderColor: on ? Colors.primary : theme.cardBorder },
                                        on && { backgroundColor: Colors.primary },
                                    ]}
                                >
                                    <ThemedText style={[styles.chipText, on && styles.chipTextOn]}>
                                        {e.name.trim() || `Character ${i + 1}`}
                                    </ThemedText>
                                    <Pressable
                                        onPress={() => removeCharacter(i)}
                                        hitSlop={8}
                                        accessibilityRole="button"
                                        accessibilityLabel={`Remove ${e.name.trim() || 'character ' + (i + 1)}`}
                                    >
                                        <ThemedText style={[styles.chipX, on && styles.chipTextOn, { color: on ? '#fff' : theme.muted }]}>
                                            ✕
                                        </ThemedText>
                                    </Pressable>
                                </Pressable>
                            )
                        })}
                        {BATCH_SUPPORTED && roster.some((e) => e.name.trim() || Object.values(e.values).some(Boolean)) ? (
                            <Pressable
                                onPress={saveRoster}
                                accessibilityRole="button"
                                style={[styles.chip, { borderColor: theme.cardBorder }]}
                            >
                                <ThemedText style={styles.chipText}>⤓ Save roster</ThemedText>
                            </Pressable>
                        ) : null}
                        {roster.length < MAX_CHARACTERS ? (
                            <Pressable
                                onPress={addCharacter}
                                accessibilityRole="button"
                                style={[styles.chip, { borderColor: theme.cardBorder, borderStyle: 'dashed' }]}
                            >
                                <ThemedText style={styles.chipText}>+ Add character</ThemedText>
                            </Pressable>
                        ) : null}
                    </View>
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
                                    {gender === 'Male' && f.key === 'bust' ? 'Chest' : f.label} ({unit})
                                    {needed.includes(f.key) ? '' : ' — optional'}
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

                    <ThemedText style={styles.controlName}>Proportions</ThemedText>
                    <ThemedText style={[styles.label, { color: theme.muted }]}>
                        All optional. These describe shape rather than size, and never affect the
                        ordering — they are shown on each card so you can see how close the
                        proportions are once the bust, waist and hips have got you close on size.
                    </ThemedText>
                    <View style={styles.measureRow}>
                        {PROPORTIONS.map((f) => (
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
                    <SegmentedControl options={priorityOptions} value={activePriority} onChange={setPriority} />

                    <Spacer height={18} />

                    <View style={styles.fieldRow}>
                        <View>
                            <ThemedText style={[styles.label, { color: theme.muted }]}>Sort by</ThemedText>
                            <SegmentedControl options={SORT_OPTIONS} value={sort} onChange={setSort} />
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

                    <Spacer height={10} />
                    <ThemedText style={[styles.label, { color: theme.muted, marginBottom: 0 }]}>
                        Real World Equivalent
                    </ThemedText>
                    <ThemedText style={styles.equivalent}>
                        1{unit} = {realWorldEquivalent(workingScale).toFixed(2)}{unit} in 1:1 scale
                    </ThemedText>

                    <Spacer height={18} />
                    <ThemedText style={styles.controlName}>Head Sculpt</ThemedText>
                    <ThemedText style={[styles.label, { color: theme.muted }]}>
                        Which sculpt you intend to fit. Height is measured to the top of the neck
                        peg, so the head you choose sets every body's height at once — a shorter
                        character wants the smaller sculpt. Bodies listed with a manufacturer's own
                        height are unaffected.
                    </ThemedText>
                    <SegmentedControl options={HEAD_OPTIONS} value={headSize} onChange={setHeadSize} />
                </ThemedCard>

                <Spacer height={22} />

                {!ready ? (
                    <ThemedCard>
                        <ThemedText style={{ color: theme.muted }}>
                            {gender === 'Male'
                                ? 'Enter a height to see results. Chest, waist and hips are optional — most male bodies are not published with them.'
                                : 'Enter a height, bust, waist and hips measurement to see results.'}
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
                                {FIELDS.filter((f) => character[f.key] != null).map((f) => (
                                    <View key={f.key} style={styles.sixthItem}>
                                        <ThemedText style={[styles.label, { color: theme.muted }]}>
                                            {gender === 'Male' && f.key === 'bust' ? 'Chest' : f.label}
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
                            {outcome.results.length}{SECTION_OPTIONS.length > 1 ? ' ' + gender.toLowerCase() : ''} result
                            {outcome.results.length === 1 ? '' : 's'} based on the data
                            you provided, compared at {scaleLabel} and sorted by{' '}
                            {cap(sort)} difference in {cap(activePriority)}.
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
                                        onUseForScene={() => chooseForScene(r)}
                                        inScene={isSceneScale(r)}
                                    />
                                </View>
                            ))}
                        </View>

                        <Spacer height={20} />
                        <View style={styles.fieldRow}>
                            <ThemedButton onPress={onExport} style={styles.exportBtn}>
                                <ThemedText style={styles.exportText}>
                                    Save {name.trim() || 'this character'} as CSV
                                </ThemedText>
                            </ThemedButton>
                            {PRINT_SUPPORTED ? (
                                <ThemedButton
                                    onPress={generate}
                                    style={[styles.exportBtn, { backgroundColor: theme.uiBackground }]}
                                >
                                    <ThemedText style={styles.btnAltText}>
                                        Generate results for all {roster.length} character{roster.length === 1 ? '' : 's'}
                                    </ThemedText>
                                </ThemedButton>
                            ) : null}
                        </View>
                        {PRINT_SUPPORTED ? (
                            <ThemedText style={[styles.sub, { color: theme.muted }]}>
                                Opens a printable sheet — top {PRINTED_RESULTS} bodies for each character
                                you have filled in — and saves your roster alongside it, so you can load
                                it back later rather than typing it again. Choose Save as PDF in the print
                                dialog.
                            </ThemedText>
                        ) : null}
                    </>
                )}

                <Spacer height={30} />
                <BatchPanel gender={gender} onLoadRoster={loadRoster} />

                {/* Outside the results branch on purpose - the glossary explains the
                    controls as much as the cards, so it has to be readable before
                    anything has been entered. */}
                <Spacer height={30} />
                {/* Closed by default - it is long, and it is for looking things up,
                    not for reading every visit. The (i) bubbles read the same
                    definitions whether it is open or not. */}
                <ThemedCard>
                    <Pressable
                        onPress={() => setShowGlossary((v) => !v)}
                        accessibilityRole="button"
                        accessibilityState={{ expanded: showGlossary }}
                        style={styles.glossHead}
                    >
                        <ThemedText style={styles.h2}>Scale Body Finder - Glossary</ThemedText>
                        <ThemedText style={[styles.glossToggle, { color: theme.muted }]}>
                            {showGlossary ? 'Hide ▲' : 'Show ▼'}
                        </ThemedText>
                    </Pressable>
                    {showGlossary ? <Spacer height={10} /> : null}
                    {showGlossary && GLOSSARY.map(({ term, definition }) => (
                        <View key={term} style={styles.glossItem}>
                            <ThemedText style={styles.glossTerm}>{term}</ThemedText>
                            <ThemedText style={[styles.glossDef, { color: theme.muted }]}>
                                {definition}
                            </ThemedText>
                        </View>
                    ))}
                </ThemedCard>

                <Spacer height={30} />
                <ThemedText style={[styles.credit, { color: theme.muted }]}>
                    Product images are manufacturer material — TBLeague (Phicen), VeryCool, Novan Studio,
                    Longshan, 86Toys and WorldBox — used for identification and comparison; all rights remain
                    with them.
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
    chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 4 },
    chip: {
        flexDirection: 'row', alignItems: 'center', gap: 10,
        borderWidth: 1, borderRadius: 8, paddingVertical: 9, paddingHorizontal: 14,
    },
    chipText: { fontSize: 14, fontWeight: '600' },
    chipTextOn: { color: '#ffffff' },
    chipX: { fontSize: 13, fontWeight: '700' },

    equivalent: { fontSize: 18, fontWeight: '700', fontVariant: ['tabular-nums'], marginTop: 2 },

    sixthRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 28 },
    sixthItem: { minWidth: 96 },
    sixthValue: { fontSize: 28, fontWeight: '800', fontVariant: ['tabular-nums'] },
    sixthUnit: { fontSize: 15, fontWeight: '600' },

    grid: { flexDirection: 'row', flexWrap: 'wrap', marginHorizontal: -8, alignItems: 'flex-start' },
    gridItem: { paddingHorizontal: 8, paddingBottom: 16 },

    exportBtn: { alignSelf: 'flex-start', paddingHorizontal: 26, marginVertical: 0 },
    exportText: { color: '#ffffff', fontWeight: '700', fontSize: 16 },
    btnAltText: { fontWeight: '700', fontSize: 16 },

    glossHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' },
    glossToggle: { fontSize: 14, fontWeight: '700' },
    glossItem: { marginBottom: 10 },
    glossTerm: { fontSize: 15, fontWeight: '700' },
    glossDef: { fontSize: 13, lineHeight: 19, marginTop: 2 },

    credit: { fontSize: 11, lineHeight: 16, maxWidth: 820 },
})
