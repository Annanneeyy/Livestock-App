import { useLocalSearchParams } from 'expo-router';
import HealthGuidelineDetailView from '../../../../components/HealthGuidelineDetailView';

export default function AdminHealthGuidelineDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <HealthGuidelineDetailView id={id} />;
}
