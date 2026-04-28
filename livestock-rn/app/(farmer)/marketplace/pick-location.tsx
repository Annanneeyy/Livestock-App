import { useState } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import MapView, { Marker, PROVIDER_DEFAULT } from '../../../components/NativeMap';
import * as Location from 'expo-location';

// Quezon, Bukidnon center coordinates
const INITIAL_REGION = {
  latitude: 7.7306,
  longitude: 125.0975,
  latitudeDelta: 0.05,
  longitudeDelta: 0.05,
};

export default function PickLocationScreen() {
  const router = useRouter();
  const formState = useLocalSearchParams<{
    _name?: string;
    _category?: string;
    _price?: string;
    _description?: string;
    _contact?: string;
    _images?: string;
    editId?: string;
  }>();
  const [selectedLocation, setSelectedLocation] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);
  const [locationText, setLocationText] = useState('');
  const [loadingLocation, setLoadingLocation] = useState(false);

  const handleMapPress = async (e: any) => {
    const { latitude, longitude } = e.nativeEvent.coordinate;
    setSelectedLocation({ latitude, longitude });

    // Reverse geocode
    try {
      const results = await Location.reverseGeocodeAsync({ latitude, longitude });
      if (results.length > 0) {
        const r = results[0];
        const parts = [r.street, r.district, r.city, r.region].filter(Boolean);
        setLocationText(parts.join(', '));
      } else {
        setLocationText(`${latitude.toFixed(4)}, ${longitude.toFixed(4)}`);
      }
    } catch {
      setLocationText(`${latitude.toFixed(4)}, ${longitude.toFixed(4)}`);
    }
  };

  const useMyLocation = async () => {
    setLoadingLocation(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Location permission is required.');
        return;
      }
      const loc = await Location.getCurrentPositionAsync({});
      handleMapPress({
        nativeEvent: {
          coordinate: {
            latitude: loc.coords.latitude,
            longitude: loc.coords.longitude,
          },
        },
      });
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Could not get location.');
    } finally {
      setLoadingLocation(false);
    }
  };

  const handleConfirm = () => {
    if (!selectedLocation) {
      Alert.alert('Error', 'Please select a location on the map.');
      return;
    }
    router.navigate({
      pathname: '/(farmer)/marketplace/create',
      params: {
        lat: selectedLocation.latitude.toString(),
        lng: selectedLocation.longitude.toString(),
        locationText,
        // Restore form state
        _name: formState._name || '',
        _category: formState._category || '',
        _price: formState._price || '',
        _description: formState._description || '',
        _contact: formState._contact || '',
        _images: formState._images || '[]',
        editId: formState.editId || '',
      },
    });
  };

  return (
    <View className="flex-1">
      <MapView
        style={{ flex: 1 }}
        provider={PROVIDER_DEFAULT}
        initialRegion={INITIAL_REGION}
        onPress={handleMapPress}
        mapType="satellite"
      >
        {selectedLocation && (
          <Marker coordinate={selectedLocation} />
        )}
      </MapView>

      <View className="absolute top-4 right-4">
        <TouchableOpacity
          className="bg-white rounded-lg px-4 py-2 shadow-md flex-row items-center"
          onPress={useMyLocation}
          disabled={loadingLocation}
        >
          {loadingLocation ? (
            <ActivityIndicator size="small" color="#2E7D32" />
          ) : (
            <>
              <Text className="text-green-700 font-medium mr-1">My Location</Text>
              <Ionicons name="locate" size={18} color="#2E7D32" />
            </>
          )}
        </TouchableOpacity>
      </View>

      <View className="absolute bottom-0 left-0 right-0 bg-white p-4 rounded-t-2xl shadow-lg">
        <Text className="text-sm text-gray-500 mb-1">Selected Location</Text>
        <Text className="text-base font-medium text-gray-900 mb-3" numberOfLines={2}>
          {locationText || 'Tap the map to select a location'}
        </Text>
        <TouchableOpacity
          className={`rounded-lg py-3 items-center ${
            selectedLocation ? 'bg-green-700' : 'bg-gray-300'
          }`}
          onPress={handleConfirm}
          disabled={!selectedLocation}
        >
          <Text className="text-white font-semibold text-lg">Confirm Location</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
