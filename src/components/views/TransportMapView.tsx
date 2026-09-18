import React, { useState } from 'react';
import { APIProvider, Map, AdvancedMarker } from '@vis.gl/react-google-maps';
import { useERP } from '../../context/ERPContext';
import { Truck } from 'lucide-react';

// Source: Google Maps Platform Code Assist
// Use of this code is subject to the Google Maps Platform Terms of Service: https://cloud.google.com/maps-platform/terms

export const TransportMapView: React.FC = () => {
  const { transportTrips } = useERP();
  const [apiKey, setApiKey] = useState((import.meta as any).env.VITE_GOOGLE_MAPS_API_KEY || '');

  if (!apiKey) {
    return (
      <div className="flex flex-col items-center justify-center py-20 bg-slate-50 rounded-2xl border border-slate-200">
        <Truck className="w-12 h-12 text-slate-300 mb-4" />
        <h3 className="text-sm font-bold text-slate-700 mb-2">Google Maps API Key Required</h3>
        <p className="text-xs text-slate-500 mb-4 text-center max-w-md">
          Please provide a valid Google Maps API Key to view the transport map. You can get one from the Google Cloud Console.
        </p>
        <div className="flex items-center gap-2">
          <input
            type="text"
            placeholder="AIzaSy..."
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            className="px-4 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 min-w-[300px]"
          />
        </div>
        <p className="text-[10px] text-slate-400 mt-2 text-center max-w-xs">Usage of Google Maps Platform products and services may incur costs against your Google Cloud project billing account.</p>
      </div>
    );
  }

  // Calculate center based on Dhaka coordinates by default
  const defaultCenter = { lat: 23.8103, lng: 90.4125 };

  return (
    <div className="h-[600px] w-full rounded-2xl overflow-hidden border border-slate-200 shadow-sm relative">
      <APIProvider apiKey={apiKey}>
        <Map
          defaultZoom={11}
          defaultCenter={defaultCenter}
          mapId="DEMO_MAP_ID"
          gestureHandling="greedy"
          disableDefaultUI={false}
          internalUsageAttributionIds={["gmp_mcp_codeassist_v1_aistudio"]}
        >
          {/* We could geocode the routeFrom/routeTo and add AdvancedMarker here.
              For now, we'll just show the map as a generic tracker. */}
          <AdvancedMarker position={defaultCenter} title="Current Location">
             <div className="bg-teal-600 text-white p-2 rounded-full shadow-lg border-2 border-white">
                <Truck className="w-5 h-5" />
             </div>
          </AdvancedMarker>
        </Map>
      </APIProvider>
    </div>
  );
};
