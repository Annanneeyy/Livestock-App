import { Stack } from 'expo-router';
import NotificationBell from '../../../components/NotificationBell';

export default function MarketplaceLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: '#1B5E20' },
        headerTintColor: '#fff',
        headerTitleStyle: { fontWeight: 'bold' },
        headerBackTitle: 'Back',
        headerRight: () => <NotificationBell />,
      }}
    >
      <Stack.Screen 
        name="index" 
        options={{ title: 'Marketplace' }} 
      />
      <Stack.Screen 
        name="[id]" 
        options={{ title: 'Marketplace Details' }} 
      />
      <Stack.Screen 
        name="create" 
        options={{ title: 'New Listing' }} 
      />
      <Stack.Screen 
        name="pick-location" 
        options={{ title: 'Select Location' }} 
      />
    </Stack>
  );
}
