import { Alert, Linking } from 'react-native';

const callPhone = (phone) => {
  if (!phone) return;
  Linking.openURL(`tel:${phone}`).catch(() => Alert.alert('Lỗi', 'Không thể thực hiện cuộc gọi.'));
};

export default callPhone;
