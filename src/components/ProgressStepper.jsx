import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const COLORS = {
  active: '#2563EB',
  done: '#22c55e',
  idle: '#CBD5E1',
  text: '#0f172a',
  sub: '#64748B',
};

export default function ProgressStepper({
  steps = [],
  currentIndex = -1,
  showPercent = true,
}) {
  const pct = steps.length ? Math.max(0, Math.min(1, (currentIndex + 1) / steps.length)) : 0;

  return (
    <View style={s.wrap}>
      {showPercent && (
        <View style={s.barTrack}>
          <View style={[s.barFill, { width: `${pct * 100}%` }]} />
        </View>
      )}
      <View style={s.row}>
        {steps.map((label, i) => {
          const state = i < currentIndex ? 'done' : i === currentIndex ? 'active' : 'idle';
          const dotColor = state === 'done' ? COLORS.done : state === 'active' ? COLORS.active : COLORS.idle;
          const lineColor = i < currentIndex ? COLORS.done : COLORS.idle;
          return (
            <View key={label + i} style={s.node}>
              {/* line trái */}
              {i !== 0 && <View style={[s.line, { backgroundColor: lineColor }]} />}
              {/* dot */}
              <View style={[s.dot, { borderColor: dotColor }]}>
                <View style={[s.dotInner, { backgroundColor: dotColor }]} />
              </View>
              {/* line phải */}
              {i !== steps.length - 1 && <View style={[s.line, { backgroundColor: lineColor }]} />}

              {/* <Text style={[s.label, { color: COLORS.text }]} numberOfLines={1}>
                {label}
              </Text> */}
            </View>
          );
        })}
      </View>
      <Text style={s.percent}>{Math.round(pct * 100)}%</Text>
    </View>
  );
}

const s = StyleSheet.create({
  wrap: { paddingVertical: 10, marginBottom: 10 },
  barTrack: {
    height: 8,
    borderRadius: 999,
    backgroundColor: '#E5E7EB',
    overflow: 'hidden',
    marginBottom: 12,
  },
  barFill: { height: 8, backgroundColor: '#2563EB', borderRadius: 999 },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  node: { flex: 1, alignItems: 'center' },
  line: { position: 'absolute', top: 10, left: 0, right: 0, height: 2 },
  dot: {
    width: 20, height: 20, borderRadius: 10,
    borderWidth: 2, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center',
  },
  dotInner: { width: 10, height: 10, borderRadius: 5 },
  label: { marginTop: 8, fontSize: 11, fontWeight: '700', textAlign: 'center' },
  percent: { marginTop: 10, fontSize: 12, color: '#475569', textAlign: 'right', fontWeight: '700' },
});
