import { Stack } from 'expo-router';
export default function FeedingAdminLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: '#1B5E20' },
        headerTintColor: '#fff',
      }}
    >
      <Stack.Screen 
        name="index" 
        options={{ title: 'Feeding Information' }} 
      />
    </Stack>
  );
}
