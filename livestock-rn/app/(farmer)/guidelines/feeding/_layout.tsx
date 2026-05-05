import { Stack } from 'expo-router';
export default function FeedingLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: '#2E7D32' },
        headerTintColor: '#fff',
        headerTitleStyle: { fontWeight: 'bold' },
        headerBackTitleVisible: false,
      }}
    >
      <Stack.Screen name="index" options={{ title: 'Feeding Guidelines' }} />
      <Stack.Screen name="[id]" options={{ title: 'Feeding Details' }} />
    </Stack>
  );
}
