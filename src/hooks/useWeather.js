import * as Location from 'expo-location';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useState } from 'react';
import { fetchWeather } from '@/src/services/weather';

const KEY = 'CACHE_WEATHER_V1';
const TTL = 10 * 60 * 1000;

export function useWeather() {
  const [data, setData] = useState(null);
  //console.log('Weather hook: data =', data);
  const [status, setStatus] = useState({ loading: true, error: null });

  useEffect(() => {
    let mounted = true;

    (async () => {
      try {
        // 1) Load cache
        const raw = await AsyncStorage.getItem(KEY);
        if (raw) {
          const cached = JSON.parse(raw);
          if (Date.now() - cached.updatedAt < TTL && mounted) {
            setData(cached);
          }
        }
        //console.log('Weather cache:', raw ? JSON.parse(raw) : null); //clg

        // 2) Quyền & toạ độ
        const { status: perm } = await Location.requestForegroundPermissionsAsync();
        if (perm !== 'granted') throw new Error('Không có quyền vị trí');

        const { coords } = await Location.getCurrentPositionAsync({});
        //console.log('Current coords:', coords);
        const w = await fetchWeather(coords.latitude, coords.longitude);
        //console.log('Fetched weather:', w);
        if (mounted) {
          setData(w);
          await AsyncStorage.setItem(KEY, JSON.stringify(w));
        }

        if (mounted) setStatus({ loading: false, error: null });
      } catch (e) {
        if (mounted) setStatus({ loading: false, error: e.message || 'Lỗi thời tiết' });
      }
    })();

    return () => {
      mounted = false;
    };
  }, []);

  return { data, ...status };
}
