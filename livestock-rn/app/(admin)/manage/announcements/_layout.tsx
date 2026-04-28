import { Stack } from 'expo-router';
export default function AnnouncementsLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: '#1B5E20' },
        headerTintColor: '#fff',
      }}
    >
      <Stack.Screen 
        name="index" 
        options={{ title: 'Announcements' }} 
      />
    </Stack>
  );
}
