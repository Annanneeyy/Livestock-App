import { Stack } from 'expo-router';
import NotificationBell from '../../../components/NotificationBell';

export default function MapStackLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: '#1B5E20' },
        headerTintColor: '#fff',
        headerTitleStyle: { fontWeight: 'bold' },
        headerRight: () => <NotificationBell />,
      }}
    >
      <Stack.Screen 
        name="index" 
        options={{ title: 'Interactive Map' }} 
      />
    </Stack>
  );
}
