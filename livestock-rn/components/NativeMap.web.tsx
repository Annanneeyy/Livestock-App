import React from 'react';
import { View, TouchableOpacity } from 'react-native';
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

const MapView = ({ children, style, initialRegion, onPress, mapType }: any) => {
  const center = initialRegion ? [initialRegion.latitude, initialRegion.longitude] : [7.7306, 125.0975];
  const zoom = initialRegion ? Math.round(Math.log2(360 / initialRegion.latitudeDelta)) : 13;

  return (
    <View style={[{ flex: 1, overflow: 'hidden' }, style]}>
      <MapContainer
        center={center as any}
        zoom={zoom}
        style={{ height: '100%', width: '100%' }}
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

const CATEGORY_EMOJI: Record<string, string> = {
  Baktin: '🐷',
  Lechonon: '🐖',
  Lapaon: '🐽',
};

export const Marker = ({ coordinate, children, onPress, category, title }: any) => {
  if (!coordinate) return null;

  const icon = category ? L.divIcon({
    html: `
      <div style="display: flex; flex-direction: column; align-items: center; transform: translate(-50%, -100%);">
        <div style="background: white; width: 32px; height: 32px; border-radius: 50%; border: 1px solid #ccc; box-shadow: 0 2px 4px rgba(0,0,0,0.2); display: flex; align-items: center; justify-content: center;">
          <span style="font-size: 18px;">${CATEGORY_EMOJI[category] || '📍'}</span>
        </div>
        <div style="width: 0; height: 0; border-left: 5px solid transparent; border-right: 5px solid transparent; border-top: 5px solid white; margin-top: -1px;"></div>
      </div>
    `,
    className: 'custom-leaflet-marker',
    iconSize: [0, 0],
    iconAnchor: [0, 0],
  }) : undefined;

  return (
    <LeafletMarker 
      position={[coordinate.latitude, coordinate.longitude]}
      eventHandlers={{ click: () => onPress?.() }}
      icon={icon}
    >
      {children && (
        <Popup minWidth={200} closeButton={true}>
          {children}
        </Popup>
      )}
    </LeafletMarker>
  );
};

export const Callout = ({ children, onPress }: any) => (
  <TouchableOpacity 
    onPress={onPress}
    activeOpacity={0.7}
    style={{ cursor: 'pointer' }}
  >
    {children}
  </TouchableOpacity>
);

export const UrlTile = ({ urlTemplate }: any) => urlTemplate ? <TileLayer url={urlTemplate} /> : null;
export const PROVIDER_DEFAULT = 'default';

export default MapView;
