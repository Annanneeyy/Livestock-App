import { useEffect, useState } from 'react';
import { View, Text, ActivityIndicator } from 'react-native';
import MapView, { Marker, UrlTile, PROVIDER_DEFAULT } from 'react-native-maps';
import { useRouter } from 'expo-router';
import * as Location from 'expo-location';
import { supabase } from '../lib/supabase';
import type { Livestock } from '../types/database';
import MapLegend from './MapLegend';

// Quezon, Bukidnon center
const DEFAULT_REGION = {
  latitude: 7.7306,
  longitude: 125.0975,
  latitudeDelta: 0.08,
  longitudeDelta: 0.08,
};

const CATEGORY_EMOJI: Record<string, string> = {
  Baktin: '🐷',
  Lechonon: '🐖',
  Lapaon: '🐽',
};

export default function LivestockMap() {
  const router = useRouter();
  const [listings, setListings] = useState<Livestock[]>([]);
  const [loading, setLoading] = useState(true);
  const [userLocation, setUserLocation] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);

  useEffect(() => {
    fetchListings();
    getUserLocation();
  }, []);

  const fetchListings = async () => {
    const { data, error } = await supabase
      .from('livestock')
      .select('id, name, category, price, latitude, longitude, is_available, seller_id')
      .eq('is_available', true)
      .not('latitude', 'is', null)
      .not('longitude', 'is', null);

    if (!error && data) {
      setListings(data as Livestock[]);
    }
    setLoading(false);
  };

  const getUserLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === 'granted') {
        const loc = await Location.getCurrentPositionAsync({});
        setUserLocation({
          latitude: loc.coords.latitude,
          longitude: loc.coords.longitude,
        });
      }
    } catch {
      // Location not available — use default region
    }
  };

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center">
        <ActivityIndicator size="large" color="#2E7D32" />
      </View>
    );
  }

  return (
    <View className="flex-1">
      <MapView
        style={{ flex: 1 }}
        provider={PROVIDER_DEFAULT}
        initialRegion={
          userLocation
            ? { ...userLocation, latitudeDelta: 0.05, longitudeDelta: 0.05 }
            : DEFAULT_REGION
        }
        showsUserLocation
        showsMyLocationButton
      >
        {/* ESRI Satellite Tiles */}
        <UrlTile
          urlTemplate="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
          maximumZ={19}
          flipY={false}
        />

        {listings.map((item) => (
          <Marker
            key={item.id}
            coordinate={{
              latitude: Number(item.latitude),
              longitude: Number(item.longitude),
            }}
            title={item.name}
            description={`₱${Number(item.price).toLocaleString()} • ${item.category}`}
            onCalloutPress={() => router.push(`/(farmer)/marketplace/${item.id}`)}
          >
            <View className="items-center">
              <Text className="text-2xl">{CATEGORY_EMOJI[item.category] || '📍'}</Text>
            </View>
          </Marker>
        ))}
      </MapView>

      <MapLegend />
    </View>
  );
}
