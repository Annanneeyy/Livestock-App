import { useLocalSearchParams } from 'expo-router';
import FeedingInfoDetailView from '../../../../components/FeedingInfoDetailView';

export default function AdminFeedingDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <FeedingInfoDetailView id={id} />;
}
