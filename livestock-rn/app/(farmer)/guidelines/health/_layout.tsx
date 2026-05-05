import { Stack } from 'expo-router';
export default function HealthLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: '#2E7D32' },
        headerTintColor: '#fff',
        headerTitleStyle: { fontWeight: 'bold' },
        headerBackTitleVisible: false,
      }}
    >
      <Stack.Screen name="index" options={{ title: 'Health Guidelines' }} />
      <Stack.Screen name="[id]" options={{ title: 'Guideline Details' }} />
    </Stack>
  );
}
