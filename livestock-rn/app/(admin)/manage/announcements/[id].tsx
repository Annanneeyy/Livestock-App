import { useLocalSearchParams } from 'expo-router';
import AnnouncementDetailView from '../../../../components/AnnouncementDetailView';

export default function AdminAnnouncementDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <AnnouncementDetailView id={id} />;
}
