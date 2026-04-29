import { Stack } from 'expo-router';

export default function GuidelinesLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: '#2E7D32' },
        headerTintColor: '#fff',
        headerTitleStyle: { fontWeight: 'bold' },
        headerBackTitleVisible: false,
      }}
    >
      <Stack.Screen name="index" options={{ title: 'Guidelines' }} />
      <Stack.Screen name="health" options={{ title: 'Health' }} />
    </Stack>
  );
}
