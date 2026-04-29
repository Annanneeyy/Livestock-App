import { Stack } from 'expo-router';

export default function SettingsLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: '#1B5E20' },
        headerTintColor: '#fff',
        headerTitleStyle: { fontWeight: 'bold' },
      }}
    >
      <Stack.Screen 
        name="index" 
        options={{ title: 'Settings' }} 
      />
      <Stack.Screen 
        name="profile" 
        options={{ title: 'Profile Details' }} 
      />
      <Stack.Screen 
        name="notifications" 
        options={{ title: 'Notification Preferences' }} 
      />
      <Stack.Screen 
        name="admins" 
        options={{ title: 'Manage Admins' }} 
      />
    </Stack>
  );
}
