import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import React from 'react';
import { Icon } from './Icon.native';

export function WeatherCard({ weather, loading, error }) {
  if (loading) {
    return (
      <View style={styles.weatherCard}>
        <ActivityIndicator />
        <Text style={styles.sub}>Đang tải thời tiết…</Text>
      </View>
    );
  }
  if (error) {
    return (
      <View style={styles.weatherCard}>
        <Text style={styles.title}>Thời tiết</Text>
        <Text style={[styles.sub, { color: '#d00' }]}>{error}</Text>
      </View>
    );
  }

  return (
    <View style={styles.weatherCard}>
      <View style={styles.weatherLeft}>
        <Icon name={weather.icon} size={38} color="#0B5ED7" />
        <View>
          {/* THÊM DÒNG NÀY */}
          <Text style={styles.weatherLoc} numberOfLines={1}>
            {weather.location || 'AptCare City'}
          </Text>

          <Text style={styles.weatherTemp}>{weather.tempC}°C</Text>
          <Text style={styles.weatherFeels}>Cảm giác như {weather.feelsLikeC}°C</Text>
        </View>
      </View>

      <View style={styles.weatherRight}>
        <Text style={styles.weatherRow}>
          <Icon name="drop.fill" size={14} color="#0EA5E9" /> {weather.humidity}% Ẩm
        </Text>
        <Text style={styles.weatherRow}>
          <Icon name="wind" size={14} color="#64748B" /> {weather.windKmh} km/h Gió
        </Text>
        <Text style={styles.weatherCond}>{weather.condition}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  weatherCard: {
    marginHorizontal: 20,
    marginBottom: 16,
    padding: 14,
    borderRadius: 14,
    backgroundColor: '#E9F2FF',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  weatherLoc: { fontSize: 17, fontWeight: '600', color: '#334155', marginBottom: 2 },
  weatherLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  weatherTemp: { fontSize: 22, fontWeight: '800', color: '#0B5ED7' },
  weatherFeels: { fontSize: 12, color: '#334155', marginTop: 2 },
  weatherRight: { alignItems: 'flex-end' },
  weatherRow: { fontSize: 12, color: '#334155', marginBottom: 2 },
  weatherCond: { fontSize: 12, color: '#0B5ED7', fontWeight: '700', marginTop: 4 },
});
