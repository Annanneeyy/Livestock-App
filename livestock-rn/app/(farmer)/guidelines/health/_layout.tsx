import { Stack } from 'expo-router';
export default function HealthLayout() {
  return (
    <Stack
      screenOptions={{
        headerBackTitleVisible: false,
      }}
    >
      <Stack.Screen name="index" options={{ title: '' }} />
      <Stack.Screen name="[id]" options={{ title: 'Loading...' }} />
    </Stack>
  );
}
