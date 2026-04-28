import { Stack } from 'expo-router';
export default function ManageLayout() {
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
        options={{ title: 'Content Management' }} 
      />
      <Stack.Screen 
        name="health" 
        options={{ title: 'Health Guidelines' }} 
      />
      <Stack.Screen 
        name="announcements" 
        options={{ title: 'Announcements' }} 
      />
      <Stack.Screen 
        name="feeding" 
        options={{ title: 'Feeding Information' }} 
      />
    </Stack>
  );
}
