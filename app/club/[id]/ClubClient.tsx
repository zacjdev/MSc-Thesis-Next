// app/club/[id]/ClubClient.tsx
"use client";

import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
});

interface ClubClientProps {
  club: {
    name: string;
    logoUrl: string;
    sport: string;
    location: { lat: number; long: number; address: string };
    website?: string;
    facebook?: string;
    instagram?: string;
    sourceUrl: string;
    sourceName: string;
  };
}

export default function ClubClient({ club }: ClubClientProps) {

  console.log("Rendering ClubClient for club:", club);
  return (
    <div className="p-6 bg-white max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-center space-x-4 mb-6">
        <img
          src={club.logoUrl}
          alt={`${club.name} Logo`}
          className="w-24 h-24 rounded-full object-cover border-2 border-gray-200"
        />
        <div>
          <h1 className="text-3xl font-bold">{club.name}</h1>
          <p className="text-gray-500">{club.sport}</p>
        </div>
      </div>

      {/* Links */}
      <div className="flex flex-wrap gap-4 mb-4">
        {club.website && (
          <a
            href={club.website}
            target="_blank"
            rel="noopener noreferrer"
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
          >
            Website
          </a>
        )}
        {club.facebook && (
          <a
            href={club.facebook}
            target="_blank"
            rel="noopener noreferrer"
            className="px-4 py-2 bg-blue-800 text-white rounded-lg hover:bg-blue-900 transition"
          >
            Facebook
          </a>
        )}
        {club.instagram && (
          <a
            href={club.instagram}
            target="_blank"
            rel="noopener noreferrer"
            className="px-4 py-2 bg-pink-500 text-white rounded-lg hover:bg-pink-600 transition"
          >
            Instagram
          </a>
        )}
      </div>
      { club.description &&
      <p className="mb-6 text-gray-700">{club.description}</p>
      }

      {/* Sitemap */}
      { club.sitemap &&
      <div>
        <h2 className="text-xl font-semibold mb-1">Sitemap</h2>
        <img 
        alt={`${club.name} Sitemap`}
        
        src={club.sitemap}
        className="mx-auto h-auto mb-6 rounded-lg border-2 border-gray-200 max-h-[400px] h-[400px]"
        />
      </div>
      }

      {/* Location */}
      <div className="mb-4">
        <h2 className="text-xl font-semibold mb-1">Location</h2>
        <p className="text-gray-700">{club.location.address}</p>
      </div>

      {/* Map */}
      {club.location?.lat && club.location?.long && (
        <MapContainer
          center={[club.location.lat, club.location.long]}
          zoom={15}
          scrollWheelZoom={false}
          className="mb-6 h-[600px] w-full rounded-lg"
        >
          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
          <Marker position={[club.location.lat, club.location.long]}>
            <Popup>{club.name}</Popup>
          </Marker>
        </MapContainer>
      )}

      

      {/* Source */}
      <div className="text-sm text-gray-400">
        Source:{" "}
        <a
          href={club.sourceUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="underline hover:text-gray-600"
        >
          {club.sourceName}
        </a>
      </div>
    </div>
  );
}
