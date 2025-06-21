import { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import MarkerClusterGroup from 'react-leaflet-cluster';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import type { GitHubUser, GeocodedLocation } from '../types';

// Fix Leaflet default marker icon issue
// eslint-disable-next-line @typescript-eslint/no-explicit-any
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl:
    'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl:
    'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

interface MapProps {
  users: GitHubUser[];
  locations: Map<string, GeocodedLocation | null>;
}

function MapBounds({
  locations,
}: {
  locations: Map<string, GeocodedLocation | null>;
}) {
  const map = useMap();

  useEffect(() => {
    const validLocations = Array.from(locations.values()).filter(
      (loc): loc is GeocodedLocation => loc !== null,
    );

    if (validLocations.length > 0) {
      const bounds = L.latLngBounds(
        validLocations.map((loc) => [loc.lat, loc.lng]),
      );
      map.fitBounds(bounds, { padding: [50, 50] });
    }
  }, [locations, map]);

  return null;
}

export function MapView({ users, locations }: MapProps) {
  const markers = users
    .map((user) => {
      if (!user.location) return null;
      const location = locations.get(user.location);
      if (!location) return null;

      return {
        user,
        location,
      };
    })
    .filter(
      (item): item is { user: GitHubUser; location: GeocodedLocation } =>
        item !== null,
    );

  return (
    <div className="w-full h-[600px] rounded-lg overflow-hidden shadow-sm border">
      <MapContainer
        center={[20, 0]}
        zoom={2}
        className="w-full h-full"
        scrollWheelZoom={true}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        <MarkerClusterGroup chunkedLoading maxClusterRadius={50}>
          {markers.map((item, index) => (
            <Marker
              key={`${item.user.id}-${index}`}
              position={[item.location.lat, item.location.lng]}
            >
              <Popup>
                <div className="text-sm">
                  <div className="flex items-center gap-2 mb-2">
                    <img
                      src={item.user.avatar_url}
                      alt={item.user.login}
                      className="w-8 h-8 rounded-full"
                    />
                    <div>
                      <a
                        href={item.user.html_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-medium text-blue-600 hover:underline"
                      >
                        {item.user.login}
                      </a>
                    </div>
                  </div>
                  <p className="text-gray-600 text-xs">{item.user.location}</p>
                </div>
              </Popup>
            </Marker>
          ))}
        </MarkerClusterGroup>

        <MapBounds locations={locations} />
      </MapContainer>
    </div>
  );
}
