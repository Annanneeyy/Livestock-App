import { Stack } from 'expo-router';
export default function HealthAdminLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: '#1B5E20' },
        headerTintColor: '#fff',
      }}
    >
      <Stack.Screen 
        name="index" 
        options={{ title: 'Health Guidelines' }} 
      />
    </Stack>
  );
}
