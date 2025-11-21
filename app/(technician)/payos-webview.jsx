import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { WebView } from 'react-native-webview';
import { Icon } from '@/src/components/Icon.native';
import { Colors, appleBlue, borderColor, zincColors } from '@/src/utils/colors';

const THEME = Colors.light ?? { text: '#0F172A', background: '#fff' };

export default function PayOSWebViewScreen() {
  const params = useLocalSearchParams();
  const url = typeof params.url === 'string' ? decodeURIComponent(params.url) : '';

  if (!url) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <Text>Không có URL thanh toán.</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Pressable
          onPress={() => router.back()}
          style={styles.backBtn}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Icon name="chevron.left" size={22} color={appleBlue} />
        </Pressable>
        <Text style={styles.headerTitle}>Thanh toán PayOS</Text>
      </View>

      <WebView
        source={{ uri: url }}
        startInLoadingState
        onError={(e) => {
          console.log('[PayOS WebView error]', e.nativeEvent);
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: THEME.background, paddingTop: 30 },
  header: {
    paddingHorizontal: 16,
    paddingBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: borderColor,
  },
  backBtn: { padding: 6, borderRadius: 999 },
  headerTitle: { fontSize: 16, fontWeight: '700', color: THEME.text },
});
