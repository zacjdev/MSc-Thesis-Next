"use client";

import { useEffect, useState, useMemo } from "react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

// Fix default Leaflet marker icons
const defaultIcon = new L.Icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});
L.Marker.prototype.options.icon = defaultIcon;

// Red marker for search location
const queryLocationIcon = new L.Icon({
  iconUrl:
    "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png",
  iconRetinaUrl:
    "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-red-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

// Parse "lat,long" string into tuple
function parseLatLng(input: string): [number, number] | null {
  if (!input) return null;
  const parts = input.split(",").map((p) => parseFloat(p.trim()));
  if (parts.length === 2 && !isNaN(parts[0]) && !isNaN(parts[1])) {
    return [parts[0], parts[1]];
  }
  return null;
}

// Haversine distance helper
function haversineDistance(lat1: number, lng1: number, lat2: number, lng2: number) {
  const R = 6371; // km
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export default function ClientHomePage({ sport }: { sport: string }) {
  const [search, setSearch] = useState("");
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [locationSearch, setLocationSearch] = useState("");
  const [distance, setDistance] = useState("");
  const [sortBy, setSortBy] = useState<"name" | "distance">("name");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");

  const queryCoords = parseLatLng(locationSearch);

  // Fetch clubs
  useEffect(() => {
    async function fetchClubs() {
      setLoading(true);
      setError(null);
      try {
        const params = new URLSearchParams({
          sport,
          search,
          page: page.toString(),
          limit: "20",
          location: locationSearch,
          distance,
        });
        const res = await fetch(`/api/clubs?${params.toString()}`);
        const data = await res.json();

        if (Array.isArray(data)) {
          setResults(data);
          setTotalPages(1);
        } else if (data?.data && Array.isArray(data.data)) {
          setResults(data.data);
          setTotalPages(data.totalPages || 1);
        } else if (data?.error) {
          setError(data.error);
          setResults([]);
        } else {
          setResults([]);
        }
      } catch (err: any) {
        console.error(err);
        setError(err.message || "Unknown error");
        setResults([]);
      } finally {
        setLoading(false);
      }
    }
    fetchClubs();
  }, [sport, search, page, locationSearch, distance]);

  // Compute distance for each club if search location is provided
  const clubsWithDistance = useMemo(() => {
    if (!queryCoords) return results.map((c) => ({ ...c, distanceKm: null }));
    return results.map((club) => {
      if (club.location?.lat != null && club.location?.long != null) {
        return {
          ...club,
          distanceKm: haversineDistance(queryCoords[0], queryCoords[1], club.location.lat, club.location.long),
        };
      }
      return { ...club, distanceKm: null };
    });
  }, [results, queryCoords]);

  // Sorting
  const sortedClubs = useMemo(() => {
    return [...clubsWithDistance].sort((a, b) => {
      if (sortBy === "name") {
        const res = a.name.localeCompare(b.name);
        return sortDir === "asc" ? res : -res;
      }
      if (sortBy === "distance") {
        if (a.distanceKm == null) return 1;
        if (b.distanceKm == null) return -1;
        return sortDir === "asc" ? a.distanceKm - b.distanceKm : b.distanceKm - a.distanceKm;
      }
      return 0;
    });
  }, [clubsWithDistance, sortBy, sortDir]);

  const defaultCenter: [number, number] = [51.505, -0.09];
  const markers = sortedClubs.filter((r) => r.location?.lat != null && r.location?.long != null);

  return (
    <div className="flex flex-row h-full">
      {/* LEFT PANEL */}
      <div className="w-7/12 border-l-2 border-r-2 border-b-2 border-gray-400 p-4 flex flex-col gap-4">
        <h1 className="text-2xl font-bold">Filters</h1>

        <input
          type="text"
          placeholder="Search by club name..."
          className="border p-2 w-full"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
        />

        <div className="flex gap-2 items-center">
          <input
            type="text"
            placeholder="Location (lat,long)"
            className="border p-2 flex-1"
            value={locationSearch}
            onChange={(e) => {
              setLocationSearch(e.target.value);
              setPage(1);
            }}
          />
          <button
            type="button"
            className="border p-2 bg-gray-100 rounded hover:bg-gray-200"
            onClick={() => {
              if (!navigator.geolocation) {
                alert("Geolocation is not supported by your browser.");
                return;
              }
              navigator.geolocation.getCurrentPosition(
                (pos) => {
                  const { latitude, longitude } = pos.coords;
                  setLocationSearch(`${latitude},${longitude}`);
                  setPage(1);
                },
                (err) => {
                  alert("Unable to retrieve your location.");
                  console.error(err);
                }
              );
            }}
          >
            📍
          </button>
          <select
            className="border p-2"
            value={distance}
            onChange={(e) => {
              setDistance(e.target.value);
              setPage(1);
            }}
          >
            <option value="">Any</option>
            <option value="10">Within 10 miles</option>
            <option value="25">Within 25 miles</option>
            <option value="50">Within 50 miles</option>
            <option value="100">Within 100 miles</option>
          </select>
        </div>

        {/* Sorting */}
        <div className="flex gap-2 items-center mt-2">
          <label>Sort by:</label>
          <select
            className="border p-2"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
          >
            <option value="name">Name</option>
            <option value="distance">Distance</option>
          </select>
          <select
            className="border p-2"
            value={sortDir}
            onChange={(e) => setSortDir(e.target.value as any)}
          >
            <option value="asc">Asc</option>
            <option value="desc">Desc</option>
          </select>
        </div>

        {loading && <p>Loading clubs...</p>}
        {error && <p className="text-red-600">Error: {error}</p>}
        {!loading && sortedClubs.length === 0 && <p>No clubs found.</p>}

        {sortedClubs.map((club) => (
          <div key={club.hash} className="mb-4 border-b-2 border-gray-300 pb-4">
            <div className="flex items-center gap-2">
              {club.logoUrl && <img src={club.logoUrl} alt={club.name} className="w-12 h-12 object-cover" />}
              <h2 className="font-bold text-lg">{club.name}</h2>
            </div>
            <p>Sport: {club.sport}</p>
            <p>Location: {club.location?.address ?? "No address"}</p>
            {club.distanceKm != null && <p>Distance: {club.distanceKm.toFixed(1)} km</p>}
            {club.location?.lat != null && club.location?.long != null && (
              <p>
                <a
                  href={`https://www.google.com/maps?q=${club.location.lat},${club.location.long}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  View on Google Maps
                </a>
              </p>
            )}
            
            <a
              href={`/club/${club._id}`}
              rel="noopener noreferrer"
            >
              More Info
            </a>
          </div>
        ))}

        {/* Pagination */}
        <div className="flex justify-center gap-2 mt-4">
          <button
            className="px-3 py-1 border rounded disabled:opacity-50"
            disabled={page <= 1}
            onClick={() => setPage((p) => Math.max(p - 1, 1))}
          >
            Prev
          </button>
          <span>
            Page {page} of {totalPages}
          </span>
          <button
            className="px-3 py-1 border rounded disabled:opacity-50"
            disabled={page >= totalPages}
            onClick={() => setPage((p) => p + 1)}
          >
            Next
          </button>
        </div>
      </div>

      {/* RIGHT PANEL — Map */}
      <div className="w-5/12 border-2 border-gray-400 p-4">
        <div className="max-h-[70vh] h-full">
          <MapContainer
            center={
              queryCoords
                ? queryCoords
                : markers.length
                ? [markers[0].location.lat, markers[0].location.long]
                : defaultCenter
            }
            zoom={6}
            style={{ height: "100%", width: "100%" }}
          >
            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution='&copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors'
            />

            {markers.map((club) => (
              <Marker key={club.hash} position={[club.location.lat, club.location.long]}>
                <Popup>
                  <strong>{club.name}</strong>
                  <br />
                  {club.location.address ?? "No address"}
                  {club.distanceKm != null && <div>{club.distanceKm.toFixed(1)} km away</div>}
                </Popup>
              </Marker>
            ))}

            {queryCoords && (
              <Marker position={queryCoords} icon={queryLocationIcon}>
                <Popup>
                  <strong>Search Location</strong>
                  <br />
                  {locationSearch}
                </Popup>
              </Marker>
            )}
          </MapContainer>
        </div>
      </div>
    </div>
  );
}
