import ChatDetailBase from '@/src/components/ChatDetailBase';
import { useLocalSearchParams } from 'expo-router';

export default function TechnicianChatDetail() {
  const { id, title } = useLocalSearchParams();
  return <ChatDetailBase variant="technician" headerTitle={typeof title === 'string' ? title : undefined} conversationId={typeof id === 'string' ? id : undefined} />;
}
