import io from 'socket.io-client';
import Constants from 'expo-constants';
let socket;

export const connectSocket = (token) => {
  if (socket) return socket;
  socket = io(Constants?.expoConfig?.extra?.apiUrl, { auth: { token } });
  return socket;
};

export const getSocket = () => socket;
