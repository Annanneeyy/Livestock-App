import { Stack } from 'expo-router';
import NotificationBell from '../../../components/NotificationBell';

export default function MarketplaceLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: '#2E7D32' },
        headerTintColor: '#fff',
        headerTitleStyle: { fontWeight: 'bold' },
        headerBackTitleVisible: false,
        headerRight: () => <NotificationBell />,
      }}
    >
      <Stack.Screen name="index" options={{ title: 'Marketplace' }} />
      <Stack.Screen name="[id]" options={{ title: 'Post Details' }} />
      <Stack.Screen name="create" options={{ title: 'Post Listing' }} />
      <Stack.Screen name="pick-location" options={{ title: 'Select Location' }} />
    </Stack>
  );
}
