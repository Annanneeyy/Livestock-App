import { Stack } from 'expo-router';
import NotificationBell from '../../../components/NotificationBell';


export default function HomeStackLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: '#2E7D32' },
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
