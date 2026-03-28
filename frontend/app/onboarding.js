import React, { useRef, useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  Dimensions,
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack } from 'expo-router';
import { Colors } from '../constants/Colors';
import { Ionicons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');
const colors = Colors.dark;
const PHONE_W = width * 0.72;
const PHONE_H = PHONE_W * 1.7;

// The real threshold used in dashboard.jsx line 217
const IMBALANCE_THRESHOLD = 0.2;

// ─────────────────────────────────────────────
// Shared: Phone Frame
// ─────────────────────────────────────────────
const PhoneFrame = ({ children }) => (
  <View style={s.phoneFrame}>
    <View style={s.phoneStatusBar}>
      <Text style={s.phoneTime}>9:41</Text>
      <View style={s.phoneNotch} />
      <View style={s.phoneSignals}>
        <Ionicons name="cellular" size={11} color={colors.icon} />
        <Ionicons name="wifi" size={11} color={colors.icon} />
        <Ionicons name="battery-full" size={11} color={colors.icon} />
      </View>
    </View>
    <View style={s.phoneBody}>{children}</View>
    <View style={s.phoneHome}><View style={s.homePill} /></View>
  </View>
);

// ─────────────────────────────────────────────
// Mini CellVoltage card (matches real component)
// Left accent strip, V# label, voltage value
// ─────────────────────────────────────────────
const MiniCellCard = ({ index, voltage, isMin, isMax, opacity, scale }) => {
  const accent = isMin ? colors.error : isMax ? colors.success : colors.accent;
  return (
    <Animated.View style={[s.cellCard, { opacity, transform: [{ scale }] }]}>
      <View style={[s.cellStrip, { backgroundColor: accent }]} />
      <View style={s.cellContent}>
        <Text style={[s.cellLabel, { color: accent }]}>V{index}</Text>
        <Text style={s.cellValue}>{voltage.toFixed(3)} V</Text>
      </View>
    </Animated.View>
  );
};

// ─────────────────────────────────────────────
// Slide 1: Bluetooth Screen Mockup
// ─────────────────────────────────────────────
const BluetoothSlide = ({ animActive }) => {
  const pulse = useRef(new Animated.Value(1)).current;
  const dev1 = useRef(new Animated.Value(0)).current;
  const dev2 = useRef(new Animated.Value(0)).current;
  const paired = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!animActive) { [dev1, dev2, paired].forEach(a => a.setValue(0)); return; }

    const p = Animated.loop(Animated.sequence([
      Animated.timing(pulse, { toValue: 1.06, duration: 600, useNativeDriver: true }),
      Animated.timing(pulse, { toValue: 1, duration: 600, useNativeDriver: true }),
    ]));
    p.start();

    Animated.sequence([
      Animated.delay(600),
      Animated.spring(dev1, { toValue: 1, friction: 7, useNativeDriver: true }),
      Animated.delay(300),
      Animated.spring(dev2, { toValue: 1, friction: 7, useNativeDriver: true }),
      Animated.delay(200),
      Animated.spring(paired, { toValue: 1, friction: 6, useNativeDriver: true }),
    ]).start();

    return () => p.stop();
  }, [animActive]);

  return (
    <PhoneFrame>
      <Text style={s.screenTitle}>Connect Module</Text>

      {/* Dropdown */}
      <View style={s.dropdown}>
        <Text style={s.dropdownLabel}>Connected Modules List</Text>
        <View style={s.dropdownBox}>
          <Text style={s.dropdownVal}>ESP32_BMS_002</Text>
          <Ionicons name="chevron-down" size={12} color={colors.icon} />
        </View>
      </View>

      {/* Connect btn for dropdown */}
      <View style={s.mockBtn}><Text style={s.mockBtnText}>Connect</Text></View>

      {/* Divider */}
      <View style={s.divider}>
        <View style={s.divLine} /><Text style={s.divText}>OR</Text><View style={s.divLine} />
      </View>

      {/* Scan button */}
      <Animated.View style={[s.scanBtn, { transform: [{ scale: pulse }] }]}>
        <Text style={s.scanBtnText}>Scan for New Modules</Text>
      </Animated.View>

      {/* Scanned label */}
      <Animated.Text style={[s.listLabel, { opacity: dev1 }]}>Scanned Devices (2)</Animated.Text>

      {/* Device cards matching real BluetoothConnectionUI */}
      <Animated.View style={[s.devCard, { opacity: dev1, transform: [{ scale: dev1.interpolate({ inputRange: [0, 1], outputRange: [0.85, 1] }) }] }]}>
        <View style={s.devRow}>
          <Text style={s.devName}>ESP32_BMS_001</Text>
          <View style={s.devConnectBtn}><Text style={s.devConnectText}>Connect</Text></View>
        </View>
      </Animated.View>

      <Animated.View style={[s.devCard, { opacity: dev2, transform: [{ scale: dev2.interpolate({ inputRange: [0, 1], outputRange: [0.85, 1] }) }] }]}>
        <View style={s.devRow}>
          <Text style={s.devName}>ESP32_BMS_002</Text>
          <Animated.View style={[s.devPaired, { opacity: paired }]}>
            <Text style={s.devPairedText}>Paired</Text>
          </Animated.View>
        </View>
      </Animated.View>
    </PhoneFrame>
  );
};

// ─────────────────────────────────────────────
// Slide 2: Dashboard Screen Mockup
// Matches real layout: title → subtitle → stats → SOC row → cells
// ─────────────────────────────────────────────
const DashboardSlide = ({ animActive }) => {
  const statsIn = useRef(new Animated.Value(0)).current;
  const socIn = useRef(new Animated.Value(0)).current;
  const cellsIn = useRef(new Animated.Value(0)).current;
  const battFill = useRef(new Animated.Value(0)).current;

  const cellVoltages = [3.850, 3.860, 3.840, 3.870, 3.850, 3.860, 3.840, 3.850];
  const minV = Math.min(...cellVoltages);
  const maxV = Math.max(...cellVoltages);

  useEffect(() => {
    if (!animActive) { [statsIn, socIn, cellsIn, battFill].forEach(a => a.setValue(0)); return; }

    Animated.sequence([
      Animated.spring(statsIn, { toValue: 1, friction: 6, useNativeDriver: true }),
      Animated.delay(150),
      Animated.parallel([
        Animated.spring(socIn, { toValue: 1, friction: 6, useNativeDriver: true }),
        Animated.timing(battFill, { toValue: 87, duration: 700, useNativeDriver: false }),
      ]),
      Animated.delay(150),
      Animated.spring(cellsIn, { toValue: 1, friction: 6, useNativeDriver: true }),
    ]).start();
  }, [animActive]);

  return (
    <PhoneFrame>
      <Text style={s.screenTitle}>Dashboard</Text>
      <Text style={s.screenSubtitle}>Battery Data – 51.2V | 5,222Wh</Text>

      {/* Stats grid — matching StatTile layout: centered label + value, 48% width */}
      <Animated.View style={[s.statsGrid, { opacity: statsIn, transform: [{ scale: statsIn.interpolate({ inputRange: [0, 1], outputRange: [0.9, 1] }) }] }]}>
        <View style={s.statTile}><Text style={s.statLabel}>Min Cell Voltage</Text><Text style={s.statValue}>3.840</Text></View>
        <View style={s.statTile}><Text style={s.statLabel}>Max Cell Voltage</Text><Text style={s.statValue}>3.870</Text></View>
        <View style={s.statTile}><Text style={s.statLabel}>Total Battery Voltage</Text><Text style={s.statValue}>52.100</Text></View>
        <View style={s.statTile}><Text style={s.statLabel}>Current (A)</Text><Text style={[s.statValue, { color: colors.error }]}>2.310</Text></View>
        <View style={s.statTile}><Text style={s.statLabel}>Output Voltage</Text><Text style={s.statValue}>51.800</Text></View>
        <View style={s.statTile}><Text style={s.statLabel}>Cell Temperature</Text><Text style={s.statValue}>32.4 °C</Text></View>
      </Animated.View>

      {/* SOC row */}
      <Animated.View style={[s.socRow, { opacity: socIn }]}>
        <View style={s.socBlock}>
          <Text style={s.statLabel}>State of Charge</Text>
          <View style={s.battRow}>
            <View style={s.battBody}>
              <Animated.View style={[s.battFill, { width: battFill.interpolate({ inputRange: [0, 100], outputRange: ['0%', '100%'] }) }]} />
            </View>
            <View style={s.battTip} />
          </View>
          <Text style={s.socPct}>87%</Text>
        </View>
        <View style={s.socBlock}>
          <Text style={s.statLabel}>Charging Status</Text>
          <View style={s.chargeBadge}><Text style={s.chargeText}>INACTIVE</Text></View>
        </View>
      </Animated.View>

      {/* Cells Voltages title + grid matching CellVoltage cards */}
      <Animated.View style={{ opacity: cellsIn }}>
        <Text style={s.cellsSectionTitle}>Cells Voltages</Text>
        <View style={s.cellsGrid}>
          {cellVoltages.map((v, i) => (
            <MiniCellCard key={i} index={i + 1} voltage={v} isMin={v === minV} isMax={v === maxV} opacity={cellsIn} scale={cellsIn.interpolate({ inputRange: [0, 1], outputRange: [0.85, 1] })} />
          ))}
        </View>
      </Animated.View>
    </PhoneFrame>
  );
};

// ─────────────────────────────────────────────
// Slide 3: Smart Alerts — Cell Voltage cards + warning
// Uses CellVoltage card layout, highlights the bad cell,
// then shows CellImbalanceWarning banner
// ─────────────────────────────────────────────
const WarningSlide = ({ animActive }) => {
  const cellAnims = useRef([...Array(8)].map(() => new Animated.Value(0))).current;
  const highlightAnim = useRef(new Animated.Value(0)).current;
  const warnIn = useRef(new Animated.Value(0)).current;
  const warnShake = useRef(new Animated.Value(0)).current;

  // Cell 5 is intentionally low to trigger the imbalance
  const cellVoltages = [3.850, 3.860, 3.840, 3.870, 3.420, 3.850, 3.860, 3.840];
  const minV = Math.min(...cellVoltages);
  const maxV = Math.max(...cellVoltages);
  const voltageDelta = maxV - minV;

  useEffect(() => {
    if (!animActive) {
      cellAnims.forEach(a => a.setValue(0));
      [highlightAnim, warnIn, warnShake].forEach(a => a.setValue(0));
      return;
    }

    // 1. Cards appear one by one
    const cardsIn = Animated.stagger(80,
      cellAnims.map(a => Animated.spring(a, { toValue: 1, friction: 6, useNativeDriver: true }))
    );

    // 2. Highlight the bad cell (pulse)
    const highlight = Animated.loop(
      Animated.sequence([
        Animated.timing(highlightAnim, { toValue: 1, duration: 500, useNativeDriver: true }),
        Animated.timing(highlightAnim, { toValue: 0.4, duration: 500, useNativeDriver: true }),
      ])
    );

    // 3. Warning banner appears + shakes
    const warnSequence = Animated.sequence([
      Animated.delay(900),
      Animated.timing(warnIn, { toValue: 1, duration: 300, useNativeDriver: true }),
      Animated.sequence([
        Animated.timing(warnShake, { toValue: 1, duration: 60, useNativeDriver: true }),
        Animated.timing(warnShake, { toValue: -1, duration: 60, useNativeDriver: true }),
        Animated.timing(warnShake, { toValue: 1, duration: 60, useNativeDriver: true }),
        Animated.timing(warnShake, { toValue: 0, duration: 60, useNativeDriver: true }),
      ]),
    ]);

    Animated.sequence([
      cardsIn,
      Animated.parallel([highlight, warnSequence]),
    ]).start();

    return () => { highlight.stop(); };
  }, [animActive]);

  const shakeX = warnShake.interpolate({ inputRange: [-1, 0, 1], outputRange: [-3, 0, 3] });

  return (
    <PhoneFrame>
      <Text style={s.screenTitle}>Dashboard</Text>

      <Text style={s.cellsSectionTitle}>Cells Voltages</Text>

      {/* CellVoltage card grid — same layout as real dashboard */}
      <View style={s.cellsGrid}>
        {cellVoltages.map((v, i) => {
          const isLow = v === minV;
          const isHigh = v === maxV;
          const accent = isLow ? colors.error : isHigh ? colors.success : colors.accent;
          const cellScale = cellAnims[i].interpolate({ inputRange: [0, 1], outputRange: [0.8, 1] });

          return (
            <Animated.View
              key={i}
              style={[
                s.cellCard,
                {
                  opacity: isLow ? highlightAnim.interpolate({ inputRange: [0, 1], outputRange: [0.4, 1] }) : cellAnims[i],
                  transform: [{ scale: cellScale }],
                  borderColor: isLow ? colors.error : colors.cardBorder,
                  borderWidth: isLow ? 1.5 : 1,
                },
              ]}
            >
              <View style={[s.cellStrip, { backgroundColor: accent }]} />
              <View style={s.cellContent}>
                <Text style={[s.cellLabel, { color: accent }]}>V{i + 1}</Text>
                <Text style={[s.cellValue, isLow && { color: colors.error }]}>{v.toFixed(3)} V</Text>
              </View>
            </Animated.View>
          );
        })}
      </View>

      {/* CellImbalanceWarning banner — matches real component exactly */}
      <Animated.View style={[s.warnBanner, { opacity: warnIn, transform: [{ translateX: shakeX }] }]}>
        <View style={s.warnTriOuter}>
          <View style={s.warnTriShape} />
          <Text style={s.warnTriExcl}>!</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={s.warnTitle}>Cell Imbalance Detected</Text>
          <Text style={s.warnDetail}>
            Voltage difference: {voltageDelta.toFixed(3)} V (threshold: {IMBALANCE_THRESHOLD.toFixed(1)} V)
          </Text>
        </View>
      </Animated.View>

      {/* Explanation */}
      <Animated.View style={[s.explainBox, { opacity: warnIn }]}>
        <Ionicons name="information-circle" size={13} color={colors.info} />
        <Text style={s.explainText}>
          When the difference between the highest and lowest cell exceeds {IMBALANCE_THRESHOLD.toFixed(1)}V, this warning appears. It may indicate a weak cell that needs balancing or replacement.
        </Text>
      </Animated.View>
    </PhoneFrame>
  );
};

// ─────────────────────────────────────────────
// Slide data
// ─────────────────────────────────────────────
const SLIDES = [
  { id: '1', title: 'Connect Your Module', subtitle: 'Scan and pair with your ESP32 BMS module over Bluetooth in seconds.', Component: BluetoothSlide },
  { id: '2', title: 'Real-Time Dashboard', subtitle: 'Monitor voltage, temperature, current, and state of charge — all in one place.', Component: DashboardSlide },
  { id: '3', title: 'Smart Alerts', subtitle: 'Get notified when cell imbalance or abnormal readings are detected.', Component: WarningSlide },
];

// ─────────────────────────────────────────────
// Main
// ─────────────────────────────────────────────
export default function OnboardingScreen() {
  const flatListRef = useRef(null);
  const scrollX = useRef(new Animated.Value(0)).current;
  const [currentIndex, setCurrentIndex] = useState(0);

  const onViewableItemsChanged = useCallback(({ viewableItems }) => {
    if (viewableItems.length > 0) setCurrentIndex(viewableItems[0].index ?? 0);
  }, []);
  const viewabilityConfig = useRef({ viewAreaCoveragePercentThreshold: 50 }).current;

  const renderSlide = ({ item, index }) => {
    const ir = [(index - 1) * width, index * width, (index + 1) * width];
    const titleOp = scrollX.interpolate({ inputRange: ir, outputRange: [0, 1, 0], extrapolate: 'clamp' });
    const titleY = scrollX.interpolate({ inputRange: ir, outputRange: [20, 0, -20], extrapolate: 'clamp' });
    const subOp = scrollX.interpolate({ inputRange: ir, outputRange: [0, 1, 0], extrapolate: 'clamp' });
    const Comp = item.Component;

    return (
      <View style={s.slide}>
        <Comp animActive={currentIndex === index} />
        <Animated.Text style={[s.slideTitle, { opacity: titleOp, transform: [{ translateY: titleY }] }]}>{item.title}</Animated.Text>
        <Animated.Text style={[s.slideSub, { opacity: subOp }]}>{item.subtitle}</Animated.Text>
      </View>
    );
  };

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <SafeAreaView style={s.container}>
        <FlatList
          ref={flatListRef}
          data={SLIDES}
          renderItem={renderSlide}
          keyExtractor={i => i.id}
          horizontal pagingEnabled
          showsHorizontalScrollIndicator={false}
          bounces={false}
          onScroll={Animated.event([{ nativeEvent: { contentOffset: { x: scrollX } } }], { useNativeDriver: false })}
          onViewableItemsChanged={onViewableItemsChanged}
          viewabilityConfig={viewabilityConfig}
        />
        <View style={s.dotRow}>
          {SLIDES.map((_, i) => {
            const ir = [(i - 1) * width, i * width, (i + 1) * width];
            return (
              <Animated.View key={i} style={[s.dot, {
                width: scrollX.interpolate({ inputRange: ir, outputRange: [8, 24, 8], extrapolate: 'clamp' }),
                opacity: scrollX.interpolate({ inputRange: ir, outputRange: [0.3, 1, 0.3], extrapolate: 'clamp' }),
              }]} />
            );
          })}
        </View>
        <View style={s.buttonArea} />
      </SafeAreaView>
    </>
  );
}

// ─────────────────────────────────────────────
// Styles
// ─────────────────────────────────────────────
const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  slide: { width, flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 16 },
  slideTitle: { fontSize: 26, fontWeight: '800', color: colors.text, textAlign: 'center', marginTop: 18, marginBottom: 6 },
  slideSub: { fontSize: 14, fontWeight: '500', color: colors.icon, textAlign: 'center', lineHeight: 20, paddingHorizontal: 20 },
  dotRow: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', paddingVertical: 16 },
  dot: { height: 8, borderRadius: 4, backgroundColor: colors.accent, marginHorizontal: 4 },
  buttonArea: { height: 80, paddingHorizontal: 24 },

  /* Phone Frame */
  phoneFrame: { width: PHONE_W, height: PHONE_H, backgroundColor: colors.card, borderRadius: 24, borderWidth: 2, borderColor: colors.cardBorder, overflow: 'hidden' },
  phoneStatusBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 14, paddingTop: 6, height: 24 },
  phoneTime: { fontSize: 9, fontWeight: '700', color: colors.text },
  phoneNotch: { width: 50, height: 14, borderRadius: 8, backgroundColor: colors.background },
  phoneSignals: { flexDirection: 'row', gap: 3 },
  phoneBody: { flex: 1, paddingHorizontal: 10, paddingTop: 4 },
  phoneHome: { height: 16, alignItems: 'center', justifyContent: 'center' },
  homePill: { width: 60, height: 3, borderRadius: 2, backgroundColor: colors.icon, opacity: 0.3 },

  /* Screen title / subtitle */
  screenTitle: { fontSize: 14, fontWeight: '800', color: colors.text, marginBottom: 4, textAlign: 'center' },
  screenSubtitle: { fontSize: 8, fontWeight: '600', color: colors.text, marginBottom: 6, textAlign: 'center' },

  /* Bluetooth slide */
  dropdown: { marginBottom: 4 },
  dropdownLabel: { fontSize: 8, fontWeight: '600', color: colors.icon, marginBottom: 2 },
  dropdownBox: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: colors.surface, borderRadius: 6, borderWidth: 1, borderColor: colors.cardBorder, paddingHorizontal: 6, paddingVertical: 4 },
  dropdownVal: { fontSize: 9, fontWeight: '600', color: colors.text },
  mockBtn: { backgroundColor: colors.accent, borderRadius: 6, paddingVertical: 5, alignItems: 'center', marginBottom: 4 },
  mockBtnText: { fontSize: 9, fontWeight: '700', color: '#fff' },
  divider: { flexDirection: 'row', alignItems: 'center', marginVertical: 4 },
  divLine: { flex: 1, height: 1, backgroundColor: colors.cardBorder },
  divText: { marginHorizontal: 6, fontSize: 7, fontWeight: '600', color: colors.icon },
  scanBtn: { backgroundColor: colors.accent, borderRadius: 6, paddingVertical: 6, alignItems: 'center', marginBottom: 6 },
  scanBtnText: { fontSize: 9, fontWeight: '700', color: '#fff' },
  listLabel: { fontSize: 8, fontWeight: '700', color: colors.text, marginBottom: 4 },
  devCard: { backgroundColor: colors.surface, borderRadius: 8, borderWidth: 1, borderColor: colors.cardBorder, padding: 8, marginBottom: 4 },
  devRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  devName: { fontSize: 10, fontWeight: '600', color: colors.text },
  devConnectBtn: { backgroundColor: colors.accent, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 5 },
  devConnectText: { fontSize: 8, fontWeight: '700', color: '#fff' },
  devPaired: { paddingHorizontal: 6, paddingVertical: 2 },
  devPairedText: { fontSize: 9, fontWeight: '600', color: colors.tint },

  /* Dashboard slide — StatTile layout: 48% centered */
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', marginBottom: 6 },
  statTile: { width: '48%', marginBottom: 6, alignItems: 'center' },
  statLabel: { fontSize: 7, fontWeight: '600', color: colors.icon, textAlign: 'center', marginBottom: 1 },
  statValue: { fontSize: 11, fontWeight: '700', color: colors.text, textAlign: 'center' },

  /* SOC row */
  socRow: { flexDirection: 'row', justifyContent: 'space-around', marginBottom: 6 },
  socBlock: { alignItems: 'center', gap: 3 },
  socPct: { fontSize: 10, fontWeight: '700', color: colors.text },
  battRow: { flexDirection: 'row', alignItems: 'center' },
  battBody: { width: 36, height: 16, borderWidth: 1.5, borderColor: colors.text, borderRadius: 3, overflow: 'hidden', padding: 1 },
  battFill: { height: '100%', backgroundColor: colors.success, borderRadius: 1 },
  battTip: { width: 3, height: 7, backgroundColor: colors.text, borderTopRightRadius: 2, borderBottomRightRadius: 2 },
  chargeBadge: { borderWidth: 1, borderColor: colors.text, borderRadius: 4, paddingHorizontal: 5, paddingVertical: 2 },
  chargeText: { fontSize: 7, fontWeight: '700', color: colors.text },

  /* CellVoltage cards — matching real component: strip + content */
  cellsSectionTitle: { fontSize: 10, fontWeight: '800', color: colors.text, textAlign: 'center', marginBottom: 4 },
  cellsGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  cellCard: { width: '48%', marginBottom: 4, borderRadius: 6, borderWidth: 1, borderColor: colors.cardBorder, backgroundColor: colors.surface, flexDirection: 'row', overflow: 'hidden' },
  cellStrip: { width: 3 },
  cellContent: { flex: 1, paddingVertical: 4, paddingHorizontal: 6, alignItems: 'center' },
  cellLabel: { fontSize: 8, fontWeight: '700', marginBottom: 1 },
  cellValue: { fontSize: 9, fontWeight: '600', color: colors.text },

  /* Warning banner — matching CellImbalanceWarning */
  warnBanner: { flexDirection: 'row', alignItems: 'center', padding: 7, borderRadius: 8, borderWidth: 1.5, borderColor: colors.warning, backgroundColor: colors.warning + '20', gap: 8, marginTop: 6, marginBottom: 4 },
  warnTriOuter: { width: 20, height: 20, alignItems: 'center', justifyContent: 'center' },
  warnTriShape: { width: 0, height: 0, borderLeftWidth: 10, borderRightWidth: 10, borderBottomWidth: 18, borderLeftColor: 'transparent', borderRightColor: 'transparent', borderBottomColor: colors.warning, position: 'absolute' },
  warnTriExcl: { fontSize: 9, fontWeight: '900', color: '#000', marginTop: 3, zIndex: 1 },
  warnTitle: { fontSize: 9, fontWeight: '700', color: colors.warning },
  warnDetail: { fontSize: 7, fontWeight: '500', color: colors.icon },

  /* Explanation */
  explainBox: { flexDirection: 'row', gap: 5, backgroundColor: colors.info + '10', borderRadius: 6, padding: 6, alignItems: 'flex-start' },
  explainText: { flex: 1, fontSize: 7, fontWeight: '500', color: colors.icon, lineHeight: 10 },
});
