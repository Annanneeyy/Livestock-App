import { Stack } from 'expo-router';

export default function MarketplaceLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: '#2E7D32' },
        headerTintColor: '#fff',
        headerTitleStyle: { fontWeight: 'bold' },
        headerBackTitleVisible: false, // Fix: Hide the "[id]" or "Back" text on Android/iOS
      }}
    >
      <Stack.Screen name="index" options={{ title: 'Marketplace' }} />
      <Stack.Screen name="[id]" options={{ title: 'Post Details' }} />
      <Stack.Screen name="create" options={{ title: 'Post Listing' }} />
      <Stack.Screen name="pick-location" options={{ title: 'Select Location' }} />
    </Stack>
  );
}
