// src/components/MonthCalendar.jsx
import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { pad2 } from '../helper/appointResident';

const VN_WEEK = ['CN','Th 2','Th 3','Th 4','Th 5','Th 6','Th 7'];
const ymd = (d) => `${d.getFullYear()}-${pad2(d.getMonth()+1)}-${pad2(d.getDate())}`;

function startOfCalendarGrid(date) {
  // Bắt đầu từ Chủ nhật của tuần chứa ngày mùng 1
  const first = new Date(date.getFullYear(), date.getMonth(), 1);
  const dow = first.getDay(); // 0 = CN
  const start = new Date(first);
  start.setDate(first.getDate() - dow);
  return start;
}

function buildMonthMatrix(cursorDate) {
  const start = startOfCalendarGrid(cursorDate);
  const cells = [];
  for (let i = 0; i < 42; i++) {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    cells.push(d);
  }
  return cells; // 6 tuần x 7 ngày
}

export default function MonthCalendar({
  initialDate = new Date(),
  eventsByDate = {},      
  onSelectDate,          
  onMonthChange
}) {
  const todayStr = ymd(new Date());
  const [cursor, setCursor] = useState(new Date(initialDate));
  const [selected, setSelected] = useState(ymd(initialDate));

  const matrix = useMemo(() => buildMonthMatrix(cursor), [cursor]);
  const month = cursor.getMonth();
  const year  = cursor.getFullYear();
  const title = `${pad2(month+1)}/${year}`;
  const monthFrom = `${year}-${pad2(month+1)}-01`;
  const lastDay = new Date(year, month+1, 0).getDate();
  const monthTo = `${year}-${pad2(month+1)}-${pad2(lastDay)}`;

  useEffect(() => {
    onMonthChange?.(year, month, monthFrom, monthTo);
  }, [year, month]);

  const handlePrev = () => {
    const d = new Date(cursor);
    d.setMonth(cursor.getMonth() - 1);
    setCursor(d);
  };

  const handleNext = () => {
    const d = new Date(cursor);
    d.setMonth(cursor.getMonth() + 1);
    setCursor(d);
  };

  const onPick = (dateStr) => {
    setSelected(dateStr);
    onSelectDate?.(dateStr);
  };

  return (
    <View style={styles.wrap}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable style={styles.navBtn} onPress={handlePrev}>
          <Text style={styles.navIcon}>{'‹'}</Text>
        </Pressable>
        <Text style={styles.title}>{title}</Text>
        <Pressable style={styles.navBtn} onPress={handleNext}>
          <Text style={styles.navIcon}>{'›'}</Text>
        </Pressable>
      </View>

      {/* Week names */}
      <View style={styles.weekRow}>
        {VN_WEEK.map((w) => (
          <Text key={w} style={styles.weekName}>{w}</Text>
        ))}
      </View>

      {/* Grid 6x7 */}
      <View style={styles.grid}>
        {matrix.map((d, i) => {
          const ds = ymd(d);
          const inMonth = d.getMonth() === month;
          const isToday = ds === todayStr;
          const isSelected = ds === selected;
          const count = eventsByDate[ds] || 0;

          return (
            <Pressable
              key={i}
              style={[
                styles.cell,
                !inMonth && styles.cellDim,
              ]}
              onPress={() => inMonth && onPick(ds)}
            >
              <View
                style={[
                  styles.dayWrap,
                  isToday && styles.today,
                  isSelected ? styles.selectedBg : styles.unSelectedBg,
                ]}
              >
                <Text
                  style={[
                    styles.dayText,
                    !inMonth && styles.dayTextDim,
                    isSelected && styles.dayTextSelected,
                  ]}
                >
                  {d.getDate()}
                </Text>
              

              {/* Badge số lịch hẹn */}
              {count > 0 && (
                <View style={[styles.badge]}>
                  <Text style={styles.badgeText}>
                    {count > 9 ? '9+' : count}
                  </Text>
                </View>
              ) }
              </View>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    borderRadius: 12,
    backgroundColor: '#fff',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#E5E7EB',
    overflow: 'hidden',
  },
  header: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F9FAFB',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E5E7EB',
  },
  title: { fontSize: 16, fontWeight: '700', color: '#111827' },
  navBtn: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  navIcon: { fontSize: 20, color: '#6B7280', lineHeight: 20 },

  weekRow: {
    flexDirection: 'row',
    paddingVertical: 7,
    backgroundColor: '#F9FAFB',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E5E7EB',
  },
  weekName: {
    flex: 1,
    textAlign: 'center',
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '700',
  },

  grid: { flexDirection: 'row', flexWrap: 'wrap' },
  cell: {
    width: `${100/7}%`,
    height: 70,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 6,
  },
  cellDim: { opacity: 0.45 },

  dayWrap: {
    width: 34,
    height: 40,
    borderRadius: 8,
    alignItems: 'center'
  },
  today: {  backgroundColor: '#86EFAC'},      // viền Hôm nay
  selectedBg: { borderWidth: 2, borderColor: '#3B82F6' },   
  unSelectedBg: { borderWidth: 2, borderColor: '#ffffff' },                    // nền xanh lá cho ngày chọn
  dayText: { fontSize: 14, color: '#111827', fontWeight: '700' },
  dayTextDim: { color: '#6B7280' },
  dayTextSelected: { color: '#064E3B' },

  badge: {
    paddingHorizontal: '40%',
    borderRadius: 999,
    paddingVertical: 2,
    backgroundColor: '#3B82F6',
  },
  badgeOnSelected: { backgroundColor: '#1D4ED8' },
  badgeText: { fontSize: 11, color: '#fff', fontWeight: '800' },
});
