import { Stack } from 'expo-router';
export default function ManageLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: '#1B5E20' },
        headerTintColor: '#fff',
      }}
    >
      <Stack.Screen 
        name="index" 
        options={{ title: 'Content Management' }} 
      />
      <Stack.Screen 
        name="health" 
        options={{ headerShown: false }} 
      />
      <Stack.Screen 
        name="announcements" 
        options={{ headerShown: false }} 
      />
      <Stack.Screen 
        name="feeding" 
        options={{ headerShown: false }} 
      />
    </Stack>
  );
}
