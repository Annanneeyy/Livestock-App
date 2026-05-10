import { Stack } from 'expo-router';
export default function AnnouncementsLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: '#2E7D32' },
        headerTintColor: '#fff',
        headerTitleStyle: { fontWeight: 'bold' },
        headerBackTitleVisible: false,
      }}
    >
      <Stack.Screen name="index" options={{ title: 'Announcements' }} />
      <Stack.Screen name="[id]" options={{ title: 'Announcement' }} />
    </Stack>
  );
}
