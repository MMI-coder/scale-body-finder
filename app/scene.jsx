import { useState } from 'react'
import { Pressable, ScrollView, StyleSheet, View, useColorScheme } from 'react-native'

import PageNav from '../Components/PageNav'
import SegmentedControl from '../Components/SegmentedControl'
import Spacer from '../Components/Spacer'
import ThemedCard from '../Components/ThemedCard'
import ThemedText from '../Components/ThemedText'
import ThemedTextInput from '../Components/ThemedTextInput'
import { blankGroup, blankItem, useWorkspace } from '../state/workspace'
import { Colors } from '../Constants/Colors'
import { DIMENSIONS, MAX_ITEMS_PER_GROUP, itemHasContent, scaledMM } from '../utils/scene'
import {
    ITEM_UNITS,
    UNITS,
    describeScale,
    fmtMM,
    parseScale,
    realWorldEquivalent,
} from '../utils/scaleUtils'

/**
 * The scene page: everything that goes with the character, at one scale.
 *
 * One scale for the whole scene, by the user's own rule - pick the character
 * that matters most and everything else lives in her world. So there is one
 * scale field here, not one per group or per item.
 */
export default function Scene() {
    const colorScheme = useColorScheme()
    const theme = Colors[colorScheme] ?? Colors.light
    const { unit, changeUnit, scene, setScene } = useWorkspace()

    // A group waiting on its second tap before it goes. Same two-tap rule the
    // scale tool used for Start Over: ten items should not vanish on a stray click.
    const [confirmRemove, setConfirmRemove] = useState(null)

    const divisor = parseScale(scene.scaleText)
    const typed = scene.scaleText.trim() !== ''

    const setScaleText = (t) => setScene((s) => ({ ...s, scaleText: t }))

    const mapGroup = (gid, fn) =>
        setScene((s) => ({ ...s, groups: s.groups.map((g) => (g.id === gid ? fn(g) : g)) }))

    const patchGroup = (gid, fields) => mapGroup(gid, (g) => ({ ...g, ...fields }))

    const patchItem = (gid, iid, fields) =>
        mapGroup(gid, (g) => ({
            ...g,
            items: g.items.map((it) => (it.id === iid ? { ...it, ...fields } : it)),
        }))

    // A new item starts in the unit of the one above it. A kitchen specced in
    // inches is ten items in inches, and clicking "in" ten times is tedious.
    const addItem = (gid) =>
        mapGroup(gid, (g) => {
            if (g.items.length >= MAX_ITEMS_PER_GROUP) return g
            const last = g.items[g.items.length - 1]
            return { ...g, items: [...g.items, blankItem(last?.unit ?? unit)] }
        })

    // The last item in a group is cleared rather than removed, so a group is
    // never an empty box with nothing to type into.
    const removeItem = (gid, iid) =>
        mapGroup(gid, (g) => {
            if (g.items.length === 1) return { ...g, items: [blankItem(g.items[0].unit)] }
            return { ...g, items: g.items.filter((it) => it.id !== iid) }
        })

    const addGroup = () => {
        setScene((s) => ({ ...s, groups: [...s.groups, blankGroup(unit)] }))
        setConfirmRemove(null)
    }

    const removeGroup = (g) => {
        const worthKeeping = g.name.trim() !== '' || g.items.some(itemHasContent)
        if (worthKeeping && confirmRemove !== g.id) {
            setConfirmRemove(g.id)
            return
        }
        setScene((s) => {
            const rest = s.groups.filter((x) => x.id !== g.id)
            return { ...s, groups: rest.length ? rest : [blankGroup(unit)] }
        })
        setConfirmRemove(null)
    }

    return (
        <ScrollView style={{ backgroundColor: theme.background }} contentContainerStyle={styles.scroll}>
            <View style={styles.page}>
                <ThemedText style={styles.h1} title>Scale Body Finder</ThemedText>
                <ThemedText style={[styles.lede, { color: theme.muted }]}>
                    Scale everything that goes with your character.
                </ThemedText>

                <Spacer height={16} />
                <PageNav />

                <Spacer height={22} />

                {/* ---------------- the one scale ---------------- */}
                <ThemedCard>
                    <ThemedText style={styles.controlName}>Scene Scale</ThemedText>
                    <ThemedText style={[styles.label, { color: theme.muted }]}>
                        The scale everything in this scene is built to — usually your main
                        character's. Type it as 1:5 13/16, 1:5.8125 or 0.172.
                    </ThemedText>
                    <View style={styles.fieldRow}>
                        <View style={styles.scaleField}>
                            <ThemedTextInput
                                value={scene.scaleText}
                                onChangeText={setScaleText}
                                placeholder="e.g. 1:5 13/16"
                                autoCorrect={false}
                            />
                        </View>
                        <View>
                            <ThemedText style={[styles.label, { color: theme.muted }]}>
                                Scaled sizes in
                            </ThemedText>
                            <SegmentedControl options={UNITS} value={unit} onChange={changeUnit} />
                        </View>
                    </View>

                    {divisor ? (
                        <>
                            <Spacer height={12} />
                            <ThemedText style={styles.readout}>
                                {describeScale(divisor)}
                                <ThemedText style={[styles.readoutSub, { color: theme.muted }]}>
                                    {'   ×'}{(1 / divisor).toFixed(5)}
                                </ThemedText>
                            </ThemedText>
                            <ThemedText style={[styles.label, { color: theme.muted, marginBottom: 0, marginTop: 4 }]}>
                                Real World Equivalent: 1{unit} = {realWorldEquivalent(divisor).toFixed(2)}{unit} in 1:1 scale
                            </ThemedText>
                        </>
                    ) : typed ? (
                        <ThemedText style={[styles.error, { color: Colors.warning }]}>
                            That isn't a scale this can read. Try 1:5 13/16, 1:5.8125 or 0.172.
                        </ThemedText>
                    ) : null}
                </ThemedCard>

                {/* ---------------- groups ---------------- */}
                {scene.groups.map((g) => (
                    <View key={g.id}>
                        <Spacer height={20} />
                        <ThemedCard>
                            <View style={styles.groupHead}>
                                <View style={styles.groupName}>
                                    <ThemedText style={[styles.label, { color: theme.muted }]}>Group</ThemedText>
                                    <ThemedTextInput
                                        value={g.name}
                                        onChangeText={(t) => patchGroup(g.id, { name: t })}
                                        placeholder="e.g. Kitchen"
                                    />
                                </View>
                                <Pressable
                                    onPress={() => removeGroup(g)}
                                    accessibilityRole="button"
                                    style={[
                                        styles.removeGroup,
                                        { borderColor: confirmRemove === g.id ? Colors.warning : theme.cardBorder },
                                    ]}
                                >
                                    <ThemedText style={[
                                        styles.removeGroupText,
                                        { color: confirmRemove === g.id ? Colors.warning : theme.muted },
                                    ]}>
                                        {confirmRemove === g.id
                                            ? `Click again to remove ${g.name.trim() || 'this group'}`
                                            : 'Remove group'}
                                    </ThemedText>
                                </Pressable>
                            </View>

                            {g.items.map((it) => (
                                <ItemRow
                                    key={it.id}
                                    item={it}
                                    divisor={divisor}
                                    unit={unit}
                                    theme={theme}
                                    onChange={(fields) => patchItem(g.id, it.id, fields)}
                                    onRemove={() => removeItem(g.id, it.id)}
                                />
                            ))}

                            {g.items.length < MAX_ITEMS_PER_GROUP ? (
                                <Pressable
                                    onPress={() => addItem(g.id)}
                                    accessibilityRole="button"
                                    style={[styles.addBtn, { borderColor: theme.cardBorder }]}
                                >
                                    <ThemedText style={[styles.addBtnText, { color: theme.muted }]}>
                                        + Add item ({g.items.length}/{MAX_ITEMS_PER_GROUP})
                                    </ThemedText>
                                </Pressable>
                            ) : (
                                <ThemedText style={[styles.label, { color: theme.muted, marginTop: 12 }]}>
                                    {MAX_ITEMS_PER_GROUP} items — the most one group holds. Start another group for the rest.
                                </ThemedText>
                            )}
                        </ThemedCard>
                    </View>
                ))}

                <Spacer height={20} />
                <Pressable
                    onPress={addGroup}
                    accessibilityRole="button"
                    style={[styles.addBtn, styles.addGroup, { borderColor: theme.cardBorder }]}
                >
                    <ThemedText style={[styles.addBtnText, { color: theme.text }]}>+ Add group</ThemedText>
                </Pressable>

                <Spacer height={40} />
            </View>
        </ScrollView>
    )
}

/**
 * One thing in the scene.
 *
 * The unit belongs to the item, because it is whatever the spec you are
 * reading from was published in. Changing it relabels the number rather than
 * converting it - you pick the unit to match what you typed, so typing 70 and
 * then realising the sheet said inches should give 70 inches. (The character
 * form converts instead: there the number is already right and only the
 * display is changing.)
 */
function ItemRow({ item, divisor, unit, theme, onChange, onRemove }) {
    return (
        <View style={[styles.item, { borderColor: theme.cardBorder }]}>
            <View style={styles.itemRow}>
                <View style={styles.itemName}>
                    <ThemedText style={[styles.label, { color: theme.muted }]}>Item</ThemedText>
                    <ThemedTextInput
                        value={item.name}
                        onChangeText={(t) => onChange({ name: t })}
                        placeholder="e.g. Refrigerator"
                    />
                </View>
                {DIMENSIONS.map(({ key, label }) => (
                    <View key={key} style={styles.dimField}>
                        <ThemedText style={[styles.label, { color: theme.muted }]}>
                            {label} ({item.unit})
                        </ThemedText>
                        <ThemedTextInput
                            value={item[key]}
                            onChangeText={(t) => onChange({ [key]: t })}
                            placeholder="—"
                            keyboardType="decimal-pad"
                            inputMode="decimal"
                        />
                    </View>
                ))}
                <View>
                    <ThemedText style={[styles.label, { color: theme.muted }]}>Unit</ThemedText>
                    <SegmentedControl
                        options={ITEM_UNITS}
                        value={item.unit}
                        onChange={(u) => onChange({ unit: u })}
                    />
                </View>
                <Pressable
                    onPress={onRemove}
                    hitSlop={8}
                    accessibilityRole="button"
                    accessibilityLabel={`Remove ${item.name.trim() || 'this item'}`}
                    style={styles.removeItem}
                >
                    <ThemedText style={[styles.removeItemText, { color: theme.muted }]}>✕</ThemedText>
                </Pressable>
            </View>

            <View style={[styles.itemRow, { marginTop: 12 }]}>
                <View style={styles.scaledBox}>
                    <ThemedText style={[styles.label, { color: theme.muted }]}>Scaled ({unit})</ThemedText>
                    <View style={styles.scaledRow}>
                        {DIMENSIONS.map(({ key, label }) => (
                            <View key={key} style={styles.scaledItem}>
                                <ThemedText style={[styles.scaledLabel, { color: theme.muted }]}>{label}</ThemedText>
                                <ThemedText style={styles.scaledValue}>
                                    {fmtMM(scaledMM(item[key], item.unit, divisor), unit)}
                                </ThemedText>
                            </View>
                        ))}
                    </View>
                </View>
                <View style={styles.notesField}>
                    <ThemedText style={[styles.label, { color: theme.muted }]}>Notes</ThemedText>
                    <ThemedTextInput
                        value={item.notes}
                        onChangeText={(t) => onChange({ notes: t })}
                        placeholder="Optional"
                    />
                </View>
            </View>
        </View>
    )
}

const styles = StyleSheet.create({
    scroll: { padding: 20, alignItems: 'center' },
    page: { width: '100%', maxWidth: 1400 },

    h1: { fontSize: 32, fontWeight: '800', letterSpacing: -0.5 },
    lede: { fontSize: 17, lineHeight: 24, marginTop: 8, maxWidth: 720 },
    label: { fontSize: 12, marginBottom: 6, fontWeight: '600' },
    controlName: { fontSize: 15, fontWeight: '700', marginBottom: 3 },
    error: { fontSize: 13, fontWeight: '600', marginTop: 10 },

    fieldRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 20, alignItems: 'flex-end' },
    scaleField: { flexGrow: 1, maxWidth: 320, minWidth: 200 },
    readout: { fontSize: 22, fontWeight: '800', fontVariant: ['tabular-nums'] },
    readoutSub: { fontSize: 14, fontWeight: '600' },

    groupHead: { flexDirection: 'row', flexWrap: 'wrap', gap: 16, alignItems: 'flex-end', marginBottom: 6 },
    groupName: { flexGrow: 1, minWidth: 220, maxWidth: 480 },
    removeGroup: { borderWidth: 1, borderRadius: 8, paddingVertical: 10, paddingHorizontal: 14 },
    removeGroupText: { fontSize: 13, fontWeight: '600' },

    item: { borderWidth: 1, borderRadius: 8, padding: 14, marginTop: 12 },
    itemRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 14, alignItems: 'flex-end' },
    itemName: { flexGrow: 2, flexBasis: 220, minWidth: 180 },
    dimField: { flexGrow: 1, flexBasis: 100, minWidth: 90 },
    removeItem: { paddingHorizontal: 8, paddingBottom: 12 },
    removeItemText: { fontSize: 16, fontWeight: '700' },

    scaledBox: { flexGrow: 1, minWidth: 260 },
    scaledRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 24 },
    scaledItem: { minWidth: 70 },
    scaledLabel: { fontSize: 11, fontWeight: '600' },
    scaledValue: { fontSize: 20, fontWeight: '800', fontVariant: ['tabular-nums'] },
    notesField: { flexGrow: 2, flexBasis: 280, minWidth: 220 },

    addBtn: {
        marginTop: 12, paddingVertical: 12, alignItems: 'center',
        borderWidth: 1, borderRadius: 8, borderStyle: 'dashed',
    },
    addBtnText: { fontSize: 14, fontWeight: '600' },
    addGroup: { marginTop: 0 },
})
