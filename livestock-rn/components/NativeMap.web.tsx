import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { MapContainer, TileLayer, Marker as LeafletMarker, Popup, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix for Leaflet default marker icons
// @ts-ignore
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Helper to handle map clicks
function MapEvents({ onPress }: { onPress?: (e: any) => void }) {
  useMapEvents({
    click: (e) => {
      if (onPress) {
        onPress({
          nativeEvent: {
            coordinate: {
              latitude: e.latlng.lat,
              longitude: e.latlng.lng,
            },
          },
        });
      }
    },
  });
  return null;
}

const MapView = ({ children, style, initialRegion, onPress, mapType, provider }: any) => {
  const center = initialRegion ? [initialRegion.latitude, initialRegion.longitude] : [7.7306, 125.0975];
  // Calculate zoom from delta (approximate)
  const zoom = initialRegion ? Math.round(Math.log2(360 / initialRegion.latitudeDelta)) : 13;

  return (
    <View style={[{ flex: 1, overflow: 'hidden' }, style]}>
      <MapContainer
        center={center as any}
        zoom={zoom}
        style={{ height: '100%', width: '100%' }}
        scrollWheelZoom={true}
      >
        {mapType === 'satellite' ? (
          <TileLayer
            attribution='&copy; <a href="https://www.esri.com/">Esri</a>'
            url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
          />
        ) : (
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
        )}
        <MapEvents onPress={onPress} />
        {children}
      </MapContainer>
    </View>
  );
};

export const Marker = ({ coordinate, children, onPress }: any) => {
  if (!coordinate) return null;
  
  // Note: For children, Leaflet doesn't easily render React components as icons
  // But we can use a Popup to show details if children exist, or just a default marker
  return (
    <LeafletMarker 
      position={[coordinate.latitude, coordinate.longitude]}
      eventHandlers={{
        click: () => onPress?.()
      }}
    >
      {children && (
        <Popup>
          <View style={{ minWidth: 100 }}>
            {children}
          </View>
        </Popup>
      )}
    </LeafletMarker>
  );
};

export const Callout = ({ children, onPress }: any) => {
  // In our simplified web version, Callout content is handled inside Marker Popup
  return (
    <View onTouchEnd={onPress}>
      {children}
    </View>
  );
};

export const UrlTile = ({ urlTemplate }: any) => {
  if (!urlTemplate) return null;
  // Convert {x} {y} {z} format if needed, but Leaflet uses same tokens
  return <TileLayer url={urlTemplate} />;
};

export const PROVIDER_DEFAULT = 'default';

export default MapView;
