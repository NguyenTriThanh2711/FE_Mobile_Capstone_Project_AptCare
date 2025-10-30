import ChatDetailBase from '@/src/components/ChatDetailBase';
import { useLocalSearchParams } from 'expo-router';

export default function TechnicianChatDetail() {
  const { title } = useLocalSearchParams();
  return <ChatDetailBase variant="technician" headerTitle={typeof title === 'string' ? title : undefined} />;
}
