'use client';

import { useState } from 'react';
import {
  APIProvider,
  Map,
  AdvancedMarker,
  InfoWindow,
  Pin,
} from '@vis.gl/react-google-maps';
import { MapPin, Camera, Clock, User } from 'lucide-react';
import { SiteUpdate } from '@/types';

interface GoogleMapProps {
  updates: SiteUpdate[];
}

// Dark mode map style for a premium look
const DARK_MAP_STYLE = [
  { elementType: 'geometry', stylers: [{ color: '#0f172a' }] },
  { elementType: 'labels.text.stroke', stylers: [{ color: '#0f172a' }] },
  { elementType: 'labels.text.fill', stylers: [{ color: '#475569' }] },
  { featureType: 'administrative.locality', elementType: 'labels.text.fill', stylers: [{ color: '#94a3b8' }] },
  { featureType: 'poi', elementType: 'labels.text.fill', stylers: [{ color: '#475569' }] },
  { featureType: 'poi.park', elementType: 'geometry', stylers: [{ color: '#1e293b' }] },
  { featureType: 'poi.park', elementType: 'labels.text.fill', stylers: [{ color: '#334155' }] },
  { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#1e293b' }] },
  { featureType: 'road', elementType: 'geometry.stroke', stylers: [{ color: '#0f172a' }] },
  { featureType: 'road', elementType: 'labels.text.fill', stylers: [{ color: '#64748b' }] },
  { featureType: 'road.highway', elementType: 'geometry', stylers: [{ color: '#334155' }] },
  { featureType: 'road.highway', elementType: 'geometry.stroke', stylers: [{ color: '#1e293b' }] },
  { featureType: 'road.highway', elementType: 'labels.text.fill', stylers: [{ color: '#94a3b8' }] },
  { featureType: 'transit', elementType: 'geometry', stylers: [{ color: '#1e293b' }] },
  { featureType: 'transit.station', elementType: 'labels.text.fill', stylers: [{ color: '#64748b' }] },
  { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#0c1929' }] },
  { featureType: 'water', elementType: 'labels.text.fill', stylers: [{ color: '#334155' }] },
  { featureType: 'water', elementType: 'labels.text.stroke', stylers: [{ color: '#0c1929' }] },
];

const API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

export default function GoogleMap({ updates }: GoogleMapProps) {
  const [selectedUpdate, setSelectedUpdate] = useState<SiteUpdate | null>(null);

  if (!API_KEY) {
    return (
      <div className="w-full h-full rounded-2xl overflow-hidden border border-slate-800 shadow-2xl flex flex-col items-center justify-center bg-slate-950 text-center p-8">
        <MapPin className="w-12 h-12 text-blue-500 mb-4 animate-bounce" />
        <h3 className="text-xl font-extrabold text-white tracking-tight">Map Not Configured</h3>
        <p className="text-slate-500 text-sm mt-2 max-w-xs font-medium">
          Please provide a <span className="text-blue-400 font-bold uppercase tracking-widest">Google Maps API Key</span> as <code className="bg-slate-900 px-1.5 py-0.5 rounded text-xs text-blue-300">NEXT_PUBLIC_GOOGLE_MAPS_API_KEY</code> in your environment variables.
        </p>
      </div>
    );
  }

  const center = updates.length > 0
    ? { lat: updates[0].latitude, lng: updates[0].longitude }
    : { lat: 28.61, lng: 77.23 };

  return (
    <div className="w-full h-full rounded-2xl overflow-hidden border border-slate-800 shadow-2xl">
      <APIProvider apiKey={API_KEY}>
        <Map
          defaultCenter={center}
          defaultZoom={12}
          mapId={process.env.NEXT_PUBLIC_MAP_ID || 'DEMO_MAP_ID'}
          styles={DARK_MAP_STYLE}
          disableDefaultUI={false}
          mapTypeControl={false}
          streetViewControl={false}
          fullscreenControl={true}
          zoomControl={true}
          style={{ width: '100%', height: '100%' }}
        >
          {updates.map((update) => (
            <AdvancedMarker
              key={update.id}
              position={{ lat: update.latitude, lng: update.longitude }}
              onClick={() => setSelectedUpdate(update)}
            >
              <div className="cursor-pointer group/pin relative">
                <div className="w-9 h-9 rounded-full bg-blue-600 border-2 border-white shadow-xl shadow-blue-900/40 flex items-center justify-center transform group-hover/pin:scale-125 transition-transform group-hover/pin:bg-blue-500">
                  <MapPin className="w-4 h-4 text-white" />
                </div>
                <div className="absolute top-11 left-1/2 -translate-x-1/2 bg-slate-900 border border-slate-700 text-[10px] font-bold text-white px-2 py-1 rounded-lg shadow-xl opacity-0 group-hover/pin:opacity-100 whitespace-nowrap transition-opacity pointer-events-none">
                  Update #{update.id.slice(0, 4)}
                </div>
              </div>
            </AdvancedMarker>
          ))}

          {selectedUpdate && (
            <InfoWindow
              position={{ lat: selectedUpdate.latitude, lng: selectedUpdate.longitude }}
              onCloseClick={() => setSelectedUpdate(null)}
              pixelOffset={[0, -40]}
            >
              <div className="w-60 overflow-hidden rounded-xl bg-slate-950 border border-slate-800 shadow-2xl">
                <img
                  src={selectedUpdate.image_url}
                  alt="Site"
                  className="w-full h-32 object-cover"
                />
                <div className="p-3 space-y-2 bg-slate-950">
                  <p className="text-xs font-bold text-slate-100 italic leading-relaxed">
                    &ldquo;{selectedUpdate.notes}&rdquo;
                  </p>
                  <div className="flex items-center justify-between pt-2 border-t border-white/5">
                    <div className="flex items-center text-[10px] text-slate-500 font-bold uppercase tracking-widest">
                      <Clock className="w-3 h-3 mr-1 text-blue-500" />
                      {new Date(selectedUpdate.created_at).toLocaleDateString()}
                    </div>
                    <div className="flex items-center text-[10px] text-slate-500 font-bold uppercase tracking-widest">
                      <User className="w-3 h-3 mr-1 text-blue-500" />
                      {selectedUpdate.user_id.slice(0, 6)}
                    </div>
                  </div>
                </div>
              </div>
            </InfoWindow>
          )}
        </Map>
      </APIProvider>
    </div>
  );
}
