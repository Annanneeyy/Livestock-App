import { Stack } from 'expo-router';
import NotificationBell from '../../../components/NotificationBell';

export default function ManageLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: '#1B5E20' },
        headerTintColor: '#fff',
        headerTitleStyle: { fontWeight: 'bold' },
        headerBackTitle: 'Back',
        headerRight: () => <NotificationBell />,
      }}
    >
      <Stack.Screen 
        name="index" 
        options={{ title: 'Content Management' }} 
      />
      <Stack.Screen 
        name="health/index" 
        options={{ title: 'Health' }} 
      />
      <Stack.Screen 
        name="announcements/index" 
        options={{ title: 'Announcements' }} 
      />
      <Stack.Screen 
        name="feeding/index" 
        options={{ title: 'Feeding' }} 
      />
    </Stack>
  );
}
