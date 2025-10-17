import * as SecureStore from 'expo-secure-store';
import 'react-native-get-random-values';
import { v4 as uuidv4 } from 'uuid';

const KEY = 'APTCARE_DEVICE_ID';

export async function getDeviceId() {
  const existing = await SecureStore.getItemAsync(KEY);
  if (existing) return existing;
  const id = uuidv4();
  await SecureStore.setItemAsync(KEY, id);
  return id;
}