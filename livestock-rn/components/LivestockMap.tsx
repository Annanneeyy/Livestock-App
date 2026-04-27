import { useEffect, useState, useCallback } from 'react';
import { View, Text, ActivityIndicator, FlatList, TouchableOpacity, Image } from 'react-native';
import MapView, { Marker, Callout, UrlTile, PROVIDER_DEFAULT } from 'react-native-maps';
import { useRouter, useFocusEffect } from 'expo-router';
import * as Location from 'expo-location';
import { supabase } from '../lib/supabase';
import type { Livestock } from '../types/database';
import MapLegend from './MapLegend';

// Quezon, Bukidnon center
const DEFAULT_REGION = {
  latitude: 7.7306,
  longitude: 125.0975,
  latitudeDelta: 0.15,
  longitudeDelta: 0.15,
};

const CATEGORY_EMOJI: Record<string, string> = {
  Baktin: '🐷',
  Lechonon: '🐖',
  Lapaon: '🐽',
};

export default function LivestockMap() {
  const router = useRouter();
  const [mappedListings, setMappedListings] = useState<Livestock[]>([]);
  const [unmappedListings, setUnmappedListings] = useState<Livestock[]>([]);
  const [loading, setLoading] = useState(true);
  const [userLocation, setUserLocation] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);
  const [showList, setShowList] = useState(false);

  const fetchListings = useCallback(async () => {
    const { data, error } = await supabase
      .from('livestock')
      .select(`
        id, name, category, price, latitude, longitude, is_available, seller_id, location_text,
        seller:profiles!seller_id(first_name, last_name, barangay),
        images:livestock_images(image_url, sort_order)
      `)
      .eq('is_available', true)
      .order('created_at', { ascending: false });

    if (!error && data) {
      const all = data as Livestock[];
      setMappedListings(all.filter(l => l.latitude != null && l.longitude != null));
      setUnmappedListings(all.filter(l => l.latitude == null || l.longitude == null));
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchListings();
    getUserLocation();
  }, []);

  // Refetch when screen comes back into focus
  useFocusEffect(
    useCallback(() => {
      fetchListings();
    }, [fetchListings])
  );

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

  const allListings = [...mappedListings, ...unmappedListings];

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
        style={{ flex: showList ? 0.5 : 1 }}
        provider={PROVIDER_DEFAULT}
        initialRegion={
          userLocation
            ? { ...userLocation, latitudeDelta: 0.1, longitudeDelta: 0.1 }
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

        {mappedListings.map((item) => {
          const firstImage = item.images?.[0]?.image_url;
          return (
            <Marker
              key={item.id}
              coordinate={{
                latitude: Number(item.latitude),
                longitude: Number(item.longitude),
              }}
            >
              {/* Marker label: emoji + post name */}
              <View className="items-center">
                <View className="bg-white rounded-lg px-2 py-1 shadow-sm border border-gray-200 flex-row items-center">
                  <Text className="text-sm mr-1">{CATEGORY_EMOJI[item.category] || '📍'}</Text>
                  <Text className="text-xs font-semibold text-gray-800" numberOfLines={1}>
                    {item.name}
                  </Text>
                </View>
                <View className="w-0 h-0 border-l-4 border-r-4 border-t-4 border-l-transparent border-r-transparent border-t-gray-200" />
              </View>

              {/* Custom callout with details */}
              <Callout
                tooltip
                onPress={() => router.push(`/(farmer)/marketplace/${item.id}`)}
              >
                <View className="bg-white rounded-xl shadow-lg p-3 w-56">
                  {firstImage && (
                    <Image
                      source={{ uri: firstImage }}
                      className="w-full h-28 rounded-lg mb-2"
                      resizeMode="cover"
                    />
                  )}
                  <Text className="text-base font-bold text-gray-900">{item.name}</Text>
                  <Text className="text-sm text-gray-500 mt-0.5">{item.category}</Text>
                  <Text className="text-lg font-bold text-green-700 mt-1">
                    ₱{Number(item.price).toLocaleString()}
                  </Text>
                  {item.seller && (
                    <Text className="text-xs text-gray-400 mt-1">
                      {item.seller.first_name} {item.seller.last_name}
                      {item.seller.barangay ? ` • ${item.seller.barangay}` : ''}
                    </Text>
                  )}
                  <View className="bg-green-700 rounded-md py-1.5 mt-2 items-center">
                    <Text className="text-white text-xs font-semibold">Tap to View Details</Text>
                  </View>
                </View>
              </Callout>
            </Marker>
          );
        })}
      </MapView>

      <MapLegend />

      {/* Toggle list button */}
      <TouchableOpacity
        className="absolute top-4 right-4 bg-white rounded-lg px-3 py-2 shadow-md flex-row items-center"
        onPress={() => setShowList(!showList)}
      >
        <Text className="text-green-700 font-medium mr-1">
          {showList ? 'Hide' : 'All'} ({allListings.length})
        </Text>
        <Text className="text-sm">{showList ? '🗺️' : '📋'}</Text>
      </TouchableOpacity>

      {/* Listings panel */}
      {showList && (
        <View className="flex-1 bg-white">
          <FlatList
            data={allListings}
            keyExtractor={(item) => item.id}
            contentContainerStyle={{ padding: 12 }}
            renderItem={({ item }) => {
              const firstImage = item.images?.[0]?.image_url;
              return (
                <TouchableOpacity
                  className="flex-row bg-white rounded-lg border border-gray-100 mb-2 overflow-hidden"
                  onPress={() => router.push(`/(farmer)/marketplace/${item.id}`)}
                >
                  {firstImage ? (
                    <Image source={{ uri: firstImage }} className="w-16 h-16" resizeMode="cover" />
                  ) : (
                    <View className="w-16 h-16 bg-gray-100 items-center justify-center">
                      <Text className="text-xl">{CATEGORY_EMOJI[item.category] || '🐷'}</Text>
                    </View>
                  )}
                  <View className="flex-1 p-2 justify-center">
                    <Text className="text-sm font-semibold text-gray-900" numberOfLines={1}>{item.name}</Text>
                    <View className="flex-row items-center mt-0.5">
                      <Text className="text-xs text-gray-500">{item.category}</Text>
                      {item.seller?.barangay && (
                        <Text className="text-xs text-gray-400"> • {item.seller.barangay}</Text>
                      )}
                      {!item.latitude && (
                        <Text className="text-xs text-amber-500 ml-1">📍 No location</Text>
                      )}
                    </View>
                  </View>
                  <View className="justify-center pr-3">
                    <Text className="text-sm font-bold text-green-700">₱{Number(item.price).toLocaleString()}</Text>
                  </View>
                </TouchableOpacity>
              );
            }}
            ListEmptyComponent={
              <View className="items-center py-10">
                <Text className="text-gray-400">No listings yet</Text>
              </View>
            }
          />
        </View>
      )}
    </View>
  );
}
