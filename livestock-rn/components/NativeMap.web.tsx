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

export const Marker = ({ coordinate, children, onPress }: any) => {
  if (!coordinate) return null;
  return (
    <LeafletMarker 
      position={[coordinate.latitude, coordinate.longitude]}
      eventHandlers={{ click: () => onPress?.() }}
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
