import { Image, StyleSheet, View, useColorScheme } from 'react-native'
import { Colors } from '../Constants/Colors'
import { bodyImage } from '../data/bodies'
import { fmtDelta, fmtMM } from '../utils/scaleUtils'
import ThemedCard from './ThemedCard'
import ThemedText from './ThemedText'

const LABELS = { bust: 'Bust', waist: 'Waist', hips: 'Hips' }

/**
 * One body, presented as an option rather than a placing. There is deliberately
 * no rank number, no "best match" badge and no score - the differences are laid
 * out and the choice is the user's.
 */
const BodyCard = ({ match, unit }) => {
    const colorScheme = useColorScheme()
    const theme = Colors[colorScheme] ?? Colors.light
    const { body, priority, scaleName, multiplier, scaled, deltas } = match

    const src = bodyImage(body.image)
    // The catalogue mixes tall single-body shots (0.65) with wide model-line
    // shots (1.96). A fixed tile height letterboxes one or the other badly, so
    // each image fills the card width at its own aspect ratio. Dimensions are
    // baked into the data at build time - react-native-web has no
    // Image.resolveAssetSource, so there's no runtime call that works everywhere.
    const ratio = body.imageW && body.imageH ? body.imageW / body.imageH : 0.75
    const extras = [
        ['Underbust', body.underbust],
        ['Shoulder', body.shoulder],
        ['Arm', body.arm],
        ['Inseam', body.inseam],
    ].filter(([, v]) => v != null)

    const heightRange =
        body.heightMin != null && body.heightMax != null
            ? body.heightMin === body.heightMax
                ? `${fmtMM(body.heightMin, unit)}${unit}`
                : `${fmtMM(body.heightMin, unit)}–${fmtMM(body.heightMax, unit)}${unit}`
            : null

    const pegRange =
        body.pegMin != null && body.pegMax != null
            ? `${fmtMM(body.pegMin, unit)}–${fmtMM(body.pegMax, unit)}${unit}`
            : body.pegMfr != null
              ? `${fmtMM(body.pegMfr, unit)}${unit} (stated)`
              : null

    return (
        <ThemedCard style={styles.card}>
            {src ? (
                <View style={[styles.imageTile, { backgroundColor: theme.imageTile, aspectRatio: ratio }]}>
                    <Image source={src} style={styles.image} resizeMode="contain" />
                </View>
            ) : null}

            <View style={styles.headRow}>
                <View style={styles.headText}>
                    <ThemedText style={styles.name}>{body.name}</ThemedText>
                    <ThemedText style={[styles.sub, { color: theme.muted }]}>
                        {[body.manufacturer, body.material].filter(Boolean).join(' · ')}
                    </ThemedText>
                </View>
                {body.handMeasured ? (
                    <View style={[styles.chip, { backgroundColor: theme.chip }]}>
                        <ThemedText style={styles.chipText}>±1mm</ThemedText>
                    </View>
                ) : null}
            </View>

            <View style={[styles.scaleBox, { borderColor: theme.cardBorder }]}>
                <ThemedText style={[styles.scaleLabel, { color: theme.muted }]}>Works out to</ThemedText>
                <ThemedText style={[styles.scaleValue, { color: Colors.primary }]}>{scaleName}</ThemedText>
                <ThemedText style={[styles.scaleLabel, { color: theme.muted }]}>
                    ×{multiplier.toFixed(5)}
                </ThemedText>
            </View>

            <View style={styles.table}>
                <View style={[styles.tr, styles.thead, { borderColor: theme.cardBorder }]}>
                    <ThemedText style={[styles.th, styles.colName, { color: theme.muted }]}> </ThemedText>
                    <ThemedText style={[styles.th, { color: theme.muted }]}>Body</ThemedText>
                    <ThemedText style={[styles.th, { color: theme.muted }]}>Character</ThemedText>
                    <ThemedText style={[styles.th, { color: theme.muted }]}>Diff</ThemedText>
                </View>
                {['bust', 'waist', 'hips'].map((k) => {
                    const isAnchor = k === priority
                    return (
                        <View key={k} style={[styles.tr, { borderColor: theme.cardBorder }]}>
                            <ThemedText style={[styles.td, styles.colName, isAnchor && styles.anchor]}>
                                {LABELS[k]}
                                {isAnchor ? '  ⚓' : ''}
                            </ThemedText>
                            <ThemedText style={styles.td}>{fmtMM(body[k], unit)}</ThemedText>
                            <ThemedText style={[styles.td, { color: theme.muted }]}>
                                {fmtMM(scaled[k], unit)}
                            </ThemedText>
                            <ThemedText style={[styles.td, styles.diff, isAnchor && { color: theme.muted }]}>
                                {fmtDelta(deltas[k])}
                            </ThemedText>
                        </View>
                    )
                })}
            </View>
            <ThemedText style={[styles.footnote, { color: theme.muted }]}>
                Anchored on {LABELS[priority].toLowerCase()}, so it matches exactly. Diff is the body
                minus your character at this scale — positive means the body is larger.
            </ThemedText>

            {extras.length || heightRange || pegRange ? (
                <View style={[styles.extras, { borderColor: theme.cardBorder }]}>
                    {extras.map(([label, v]) => (
                        <View key={label} style={styles.extraItem}>
                            <ThemedText style={[styles.extraLabel, { color: theme.muted }]}>{label}</ThemedText>
                            <ThemedText style={styles.extraValue}>
                                {fmtMM(v, unit)}
                                {unit}
                            </ThemedText>
                        </View>
                    ))}
                    {heightRange ? (
                        <View style={styles.extraItem}>
                            <ThemedText style={[styles.extraLabel, { color: theme.muted }]}>Height w/ head</ThemedText>
                            <ThemedText style={styles.extraValue}>{heightRange}</ThemedText>
                        </View>
                    ) : null}
                    {pegRange ? (
                        <View style={styles.extraItem}>
                            <ThemedText style={[styles.extraLabel, { color: theme.muted }]}>Neck peg</ThemedText>
                            <ThemedText style={styles.extraValue}>{pegRange}</ThemedText>
                        </View>
                    ) : null}
                    {body.feet ? (
                        <View style={styles.extraItem}>
                            <ThemedText style={[styles.extraLabel, { color: theme.muted }]}>Feet</ThemedText>
                            <ThemedText style={styles.extraValue}>{body.feet}</ThemedText>
                        </View>
                    ) : null}
                </View>
            ) : null}

            {body.notes ? (
                <ThemedText style={[styles.notes, { color: theme.muted }]}>{body.notes}</ThemedText>
            ) : null}
        </ThemedCard>
    )
}

export default BodyCard

const styles = StyleSheet.create({
    card: { padding: 16, gap: 14 },
    imageTile: { width: '100%', borderRadius: 8, overflow: 'hidden', alignItems: 'center', justifyContent: 'center' },
    image: { width: '100%', height: '100%' },

    headRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
    headText: { flex: 1 },
    name: { fontSize: 21, fontWeight: '700' },
    sub: { fontSize: 14, marginTop: 2 },
    chip: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20 },
    chipText: { fontSize: 12, fontWeight: '700' },

    scaleBox: { borderWidth: 1, borderRadius: 8, paddingVertical: 10, alignItems: 'center' },
    scaleLabel: { fontSize: 12 },
    scaleValue: { fontSize: 24, fontWeight: '800', marginVertical: 2 },

    table: { marginTop: 2 },
    tr: { flexDirection: 'row', alignItems: 'center', borderBottomWidth: 1, paddingVertical: 8 },
    thead: { borderBottomWidth: 1 },
    th: { flex: 1, fontSize: 12, textAlign: 'right', fontWeight: '600' },
    td: { flex: 1, fontSize: 16, textAlign: 'right', fontVariant: ['tabular-nums'] },
    colName: { flex: 1.3, textAlign: 'left' },
    anchor: { fontWeight: '700' },
    diff: { fontWeight: '700' },

    footnote: { fontSize: 12, lineHeight: 17 },

    extras: { flexDirection: 'row', flexWrap: 'wrap', gap: 16, borderTopWidth: 1, paddingTop: 12 },
    extraItem: { minWidth: 84 },
    extraLabel: { fontSize: 11 },
    extraValue: { fontSize: 15, fontWeight: '600' },

    notes: { fontSize: 12, fontStyle: 'italic', lineHeight: 17 },
})
