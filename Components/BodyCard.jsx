import { useEffect, useState } from 'react'
import { Image, Modal, Pressable, StyleSheet, View, useColorScheme, useWindowDimensions } from 'react-native'
import { Colors } from '../Constants/Colors'
import { bodyImage } from '../data/bodies'
import { fmtDelta, fmtMM } from '../utils/scaleUtils'
import InfoBubble from './InfoBubble'
import ThemedCard from './ThemedCard'
import ThemedText from './ThemedText'

const LABELS = { height: 'Height', bust: 'Bust', waist: 'Waist', hips: 'Hips' }
const ROWS = ['height', 'bust', 'waist', 'hips']

export const SCALE_INFO =
    'For reference purposes only. This scale number is provided so the user can accurately ' +
    'create any clothing, accessories, props, and/or environments for their character that may ' +
    'benefit from being made to the same perceived scale as the character itself.'

export const BUST_PIECE_INFO =
    'This body is modular - the chest is a separate part, and the manufacturer sells several. ' +
    'The card opens on the piece closest to your character, and you can switch between the ' +
    'others to see what each one would measure. Switching only changes the Bust row: the results ' +
    'stay in the order they were found, and Actual Body Scale stays on the closest piece.'

export const HEIGHT_INFO =
    'For reference purposes only. Height is measured by hand using a shoeless body and a ' +
    'standardized head sculpt. This measurement is an estimate and will fluctuate depending on ' +
    'the actual sculpt used, shoes/accessories, and the natural adjustments that can be made to ' +
    'the body.'

/**
 * One body. Compact by default - image, name, manufacturer - and expands on tap
 * to the full comparison. The image has its own control to pop out full size,
 * so tapping it doesn't fight with the expand.
 */
const BodyCard = ({ result, unit, expanded, onToggle }) => {
    const colorScheme = useColorScheme()
    const theme = Colors[colorScheme] ?? Colors.light
    const { width, height: winH } = useWindowDimensions()
    const [lightbox, setLightbox] = useState(false)

    const { body, priority, scaled, deltas, heightRange, heightUsed, closest, bustOptions } = result

    // Modular bodies open on the piece nearest the character and can be cycled
    // from there. The pick is display only - it never reorders the results and
    // never moves Actual Body Scale, both of which are fixed on the piece the
    // engine chose. Re-pick when the engine's choice changes underneath, which
    // happens when the scale or the character does.
    const [piece, setPiece] = useState(result.bustPiece)
    useEffect(() => setPiece(result.bustPiece), [result.bustPiece])

    const shown = bustOptions?.find((o) => o.piece === piece)
    const shownBust = shown ? shown.bust : result.bust ?? body.bust
    const bustDelta = shownBust == null || scaled.bust == null ? null : shownBust - scaled.bust
    const swapped = bustOptions && piece !== result.bustPiece
    const src = bodyImage(body.image)
    const ratio = body.imageW && body.imageH ? body.imageW / body.imageH : 0.75

    const extras = [
        ['Underbust', body.underbust],
        ['Shoulder Width', body.shoulder],
        ['Arm Length', body.arm],
        ['Leg Inseam', body.inseam],
    ].filter(([, v]) => v != null)

    const rangeText = heightRange
        ? heightRange.min === heightRange.max
            ? `${fmtMM(heightRange.min, unit)}${unit}`
            : `${fmtMM(heightRange.min, unit)}–${fmtMM(heightRange.max, unit)}${unit}`
        : '—'

    // A body whose range contains the target can simply be posed to it.
    const heightMet = heightRange && deltas.height === 0

    return (
        <ThemedCard style={styles.card}>
            <Pressable onPress={onToggle} accessibilityRole="button">
                {/* Collapsed cards sit in a grid, so they get a fixed tile height -
                    otherwise a portrait shot next to a wide model-line shot makes
                    the rows ragged. Expanding drops back to the image's own aspect
                    ratio, and the pop-out shows it full size either way. */}
                {src ? (
                    <View
                        style={[
                            styles.imageTile,
                            { backgroundColor: theme.imageTile },
                            expanded ? { aspectRatio: ratio } : styles.imageTileCompact,
                        ]}
                    >
                        <Image source={src} style={styles.image} resizeMode="contain" />
                        <Pressable
                            onPress={() => setLightbox(true)}
                            accessibilityRole="button"
                            accessibilityLabel="View image full size"
                            style={[styles.expandBtn, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}
                            hitSlop={8}
                        >
                            <ThemedText style={styles.expandIcon}>⤢</ThemedText>
                        </Pressable>
                    </View>
                ) : null}

                <View style={styles.headRow}>
                    <View style={styles.headText}>
                        <ThemedText style={styles.name}>{body.name}</ThemedText>
                        <ThemedText style={[styles.sub, { color: theme.muted }]}>
                            {[body.manufacturer, body.material].filter(Boolean).join(' · ')}
                        </ThemedText>
                    </View>
                    <ThemedText style={[styles.chevron, { color: theme.muted }]}>
                        {expanded ? '▲' : '▼'}
                    </ThemedText>
                </View>
            </Pressable>

            {expanded ? (
                <>
                    <View style={[styles.scaleBox, { borderColor: theme.cardBorder }]}>
                        <InfoBubble
                            label="Actual Body Scale"
                            text={SCALE_INFO}
                            labelStyle={[styles.scaleLabel, { color: theme.muted }]}
                        />
                        <ThemedText style={[styles.scaleValue, { color: Colors.primary }]}>
                            {closest ? closest.name : '—'}
                        </ThemedText>
                        {closest ? (
                            <ThemedText style={[styles.scaleLabel, { color: theme.muted }]}>
                                Scale Multiplier ×{closest.multiplier.toFixed(5)}
                            </ThemedText>
                        ) : null}
                    </View>

                    <View style={styles.table}>
                        <View style={[styles.tr, { borderColor: theme.cardBorder }]}>
                            <ThemedText style={[styles.th, styles.colName, { color: theme.muted }]}> </ThemedText>
                            <ThemedText style={[styles.th, { color: theme.muted }]}>Body{'\n'}Measurements</ThemedText>
                            <ThemedText style={[styles.th, { color: theme.muted }]}>Character{'\n'}Measurements</ThemedText>
                            <ThemedText style={[styles.th, { color: theme.muted }]}>Difference</ThemedText>
                        </View>
                        {ROWS.map((k) => {
                            const bodyVal = k === 'height' ? heightUsed
                                          : k === 'bust'   ? shownBust
                                          : body[k]
                            const delta = k === 'bust' ? bustDelta : deltas[k]
                            if (bodyVal == null && scaled[k] == null) return null
                            const isPriority = k === priority
                            return (
                                <View key={k} style={[styles.tr, { borderColor: theme.cardBorder }]}>
                                    <ThemedText style={[styles.td, styles.colName, isPriority && styles.priority]}>
                                        {LABELS[k]}
                                    </ThemedText>
                                    <ThemedText style={styles.td}>{fmtMM(bodyVal, unit)}</ThemedText>
                                    <ThemedText style={[styles.td, { color: theme.muted }]}>
                                        {fmtMM(scaled[k], unit)}
                                    </ThemedText>
                                    <ThemedText style={[styles.td, styles.diff]}>
                                        {fmtDelta(delta)}
                                    </ThemedText>
                                </View>
                            )
                        })}
                    </View>

                    {bustOptions ? (
                        <View style={[styles.pieces, { borderColor: theme.cardBorder }]}>
                            <InfoBubble
                                label="Bust Piece"
                                text={BUST_PIECE_INFO}
                                labelStyle={[styles.extraLabel, { color: theme.muted }]}
                            />
                            <View style={styles.pieceRow}>
                                {bustOptions.map((o) => {
                                    const on = o.piece === piece
                                    return (
                                        <Pressable
                                            key={o.piece}
                                            onPress={() => setPiece(o.piece)}
                                            accessibilityRole="button"
                                            accessibilityState={{ selected: on }}
                                            style={[
                                                styles.pieceChip,
                                                { borderColor: on ? Colors.primary : theme.cardBorder },
                                                on && { backgroundColor: Colors.primary },
                                            ]}
                                        >
                                            <ThemedText
                                                style={[styles.pieceText, on && styles.pieceTextOn]}
                                            >
                                                {o.piece}
                                            </ThemedText>
                                            <ThemedText
                                                style={[
                                                    styles.pieceMM,
                                                    { color: theme.muted },
                                                    on && styles.pieceTextOn,
                                                ]}
                                            >
                                                {fmtMM(o.bust, unit)}{unit}
                                            </ThemedText>
                                        </Pressable>
                                    )
                                })}
                            </View>
                            <ThemedText style={[styles.pieceNote, { color: theme.muted }]}>
                                {swapped
                                    ? `Showing ${piece}. This body was placed in the results on its ${result.bustPiece}, which is the closest to your character.`
                                    : `${result.bustPiece} is the closest piece to your character.`}
                            </ThemedText>
                        </View>
                    ) : null}

                    {heightMet ? (
                        <ThemedText style={[styles.metNote, { color: Colors.primary }]}>
                            This body can potentially match your character's scaled height.
                        </ThemedText>
                    ) : null}

                    <View style={[styles.heights, { borderColor: theme.cardBorder }]}>
                        <InfoBubble
                            label="Height Range"
                            text={HEIGHT_INFO}
                            labelStyle={[styles.extraLabel, { color: theme.muted }]}
                        />
                        <ThemedText style={styles.heightPrimary}>{rangeText}</ThemedText>
                        {body.heightsByHead ? (
                            <View style={styles.headList}>
                                {Object.keys(body.heightsByHead)
                                    .map(Number)
                                    .sort((a, b) => a - b)
                                    .map((size) => {
                                        const r = body.heightsByHead[size]
                                        return (
                                            <View key={size} style={styles.heightRow}>
                                                <ThemedText style={[styles.heightHead, { color: theme.muted }]}>
                                                    {size}mm head
                                                </ThemedText>
                                                <ThemedText style={[styles.heightAlt, { color: theme.muted }]}>
                                                    {fmtMM(r.min, unit)}–{fmtMM(r.max, unit)}{unit}
                                                </ThemedText>
                                            </View>
                                        )
                                    })}
                            </View>
                        ) : null}
                    </View>

                    {extras.length ? (
                        <View style={[styles.extras, { borderColor: theme.cardBorder }]}>
                            {extras.map(([label, v]) => (
                                <View key={label} style={styles.extraItem}>
                                    <ThemedText style={[styles.extraLabel, { color: theme.muted }]}>{label}</ThemedText>
                                    <ThemedText style={styles.extraValue}>{fmtMM(v, unit)}{unit}</ThemedText>
                                </View>
                            ))}
                            {body.feet ? (
                                <View style={styles.extraItem}>
                                    <ThemedText style={[styles.extraLabel, { color: theme.muted }]}>Feet Type</ThemedText>
                                    <ThemedText style={styles.extraValue}>{body.feet}</ThemedText>
                                </View>
                            ) : null}
                        </View>
                    ) : null}

                    {body.notes ? (
                        <ThemedText style={[styles.notes, { color: theme.muted }]}>{body.notes}</ThemedText>
                    ) : null}
                </>
            ) : null}

            <Modal visible={lightbox} transparent animationType="fade" onRequestClose={() => setLightbox(false)}>
                <Pressable style={styles.backdrop} onPress={() => setLightbox(false)}>
                    {src ? (
                        <Image
                            source={src}
                            style={{ width: width * 0.94, height: winH * 0.88 }}
                            resizeMode="contain"
                        />
                    ) : null}
                    <ThemedText style={styles.closeHint}>Tap anywhere to close</ThemedText>
                </Pressable>
            </Modal>
        </ThemedCard>
    )
}

export default BodyCard

const styles = StyleSheet.create({
    pieces: { borderTopWidth: StyleSheet.hairlineWidth, paddingTop: 12, marginTop: 12 },
    pieceRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 6 },
    pieceChip: { borderWidth: 1, borderRadius: 8, paddingVertical: 6, paddingHorizontal: 10, alignItems: 'center' },
    pieceText: { fontSize: 13, fontWeight: '700' },
    pieceMM: { fontSize: 11, marginTop: 1, fontVariant: ['tabular-nums'] },
    pieceTextOn: { color: '#ffffff' },
    pieceNote: { fontSize: 12, lineHeight: 17, marginTop: 8 },

    card: { padding: 16, gap: 14 },
    imageTile: { width: '100%', borderRadius: 8, overflow: 'hidden', alignItems: 'center', justifyContent: 'center' },
    imageTileCompact: { height: 300 },
    image: { width: '100%', height: '100%' },
    expandBtn: {
        position: 'absolute', right: 8, bottom: 8,
        width: 34, height: 34, borderRadius: 17, borderWidth: 1,
        alignItems: 'center', justifyContent: 'center',
    },
    expandIcon: { fontSize: 16, fontWeight: '700' },

    headRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 12 },
    headText: { flex: 1 },
    name: { fontSize: 21, fontWeight: '700' },
    sub: { fontSize: 14, marginTop: 2 },
    chevron: { fontSize: 12 },

    scaleBox: { borderWidth: 1, borderRadius: 8, paddingVertical: 12, paddingHorizontal: 12, alignItems: 'center' },
    scaleLabel: { fontSize: 12 },
    scaleValue: { fontSize: 24, fontWeight: '800', marginVertical: 4 },

    table: { marginTop: 2 },
    tr: { flexDirection: 'row', alignItems: 'center', borderBottomWidth: 1, paddingVertical: 8 },
    th: { flex: 1, fontSize: 11, textAlign: 'right', fontWeight: '600' },
    td: { flex: 1, fontSize: 16, textAlign: 'right', fontVariant: ['tabular-nums'] },
    colName: { flex: 1.1, textAlign: 'left' },
    priority: { fontWeight: '800' },
    diff: { fontWeight: '700' },

    metNote: { fontSize: 12, fontWeight: '600', lineHeight: 17 },

    heights: { borderTopWidth: 1, paddingTop: 12, gap: 4 },
    heightPrimary: { fontSize: 18, fontWeight: '700', fontVariant: ['tabular-nums'] },
    headList: { marginTop: 4, gap: 2 },
    heightRow: { flexDirection: 'row', alignItems: 'baseline', gap: 10 },
    heightHead: { fontSize: 12, width: 86 },
    heightAlt: { fontSize: 13, fontVariant: ['tabular-nums'] },

    extras: { flexDirection: 'row', flexWrap: 'wrap', gap: 16, borderTopWidth: 1, paddingTop: 12 },
    extraItem: { minWidth: 84 },
    extraLabel: { fontSize: 11 },
    extraValue: { fontSize: 15, fontWeight: '600' },

    notes: { fontSize: 12, fontStyle: 'italic', lineHeight: 17 },

    backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.92)', alignItems: 'center', justifyContent: 'center', gap: 14 },
    closeHint: { color: '#ffffff', fontSize: 13, opacity: 0.7 },
})
