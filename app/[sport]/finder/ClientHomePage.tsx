// app/[sport]/finder/ClientHomePage.tsx
"use client";

import { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

// Fix default Leaflet marker icons (otherwise broken in Next.js)
const defaultIcon = new L.Icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});
L.Marker.prototype.options.icon = defaultIcon;

// New icon for queried location (red pin)
const queryLocationIcon = new L.Icon({
  iconUrl:
    "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png",
  iconRetinaUrl:
    "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-red-2x.png",
  shadowUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

// Helper to parse "lat,long" strings into [lat, long] tuple
function parseLatLng(input: string): [number, number] | null {
  if (!input) return null;
  const parts = input.split(",").map((p) => parseFloat(p.trim()));
  if (parts.length === 2 && !isNaN(parts[0]) && !isNaN(parts[1])) {
    return [parts[0], parts[1]];
  }
  return null;
}

export default function ClientHomePage({ sport }: { sport: string }) {
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState("dateStart_asc");
  const [results, setResults] = useState<any[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const [includeEvents, setIncludeEvents] = useState(true);
  const [includeGames, setIncludeGames] = useState(true);
  const [timeFilter, setTimeFilter] = useState("");
  const [locationSearch, setLocationSearch] = useState("");
  const [distance, setDistance] = useState("");

  useEffect(() => {
    const query = new URLSearchParams({
      sport,
      search,
      sort,
      page: page.toString(),
      limit: "20",
      includeEvents: includeEvents.toString(),
      includeGames: includeGames.toString(),
      timeFilter,
      location: locationSearch,
      distance,
    });
    fetch(`/api/finder-data?${query.toString()}`)
      .then((res) => res.json())
      .then((data) => {
        setResults(data.data);
        setTotalPages(data.totalPages);
      });
  }, [
    sport,
    search,
    sort,
    page,
    includeEvents,
    includeGames,
    timeFilter,
    locationSearch,
    distance,
  ]);

  const formatDate = (timestamp) => {
    if (!timestamp || isNaN(timestamp)) return null;
    let date = new Date(timestamp * 1000).toLocaleString("en-UK", {
      month: "2-digit",
      day: "2-digit",
      year: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true
    });
    console.log("Formatted date:", date);
    return date
  };
  

  function formatUnixTimestamp(ts: any) {
    if (!ts || isNaN(ts)) return "N/A";
    const date = new Date(ts * 1000);
    if (isNaN(date.getTime())) return "N/A";
    return date.toLocaleDateString();
  }

  // Default map center — London-ish
  const defaultCenter: [number, number] = [51.505, -0.09];

  // Filter results to only those with coords
  const markers = results.filter(
    (r) =>
      r.location &&
      typeof r.location.lat === "number" &&
      typeof r.location.long === "number"
  );

  // Parsed queried location coordinates, if valid
  const queryCoords = parseLatLng(locationSearch);

  return (
    <div className="flex flex-row h-full">
      {/* LEFT PANEL */}
      <div className="w-7/12 border-l-2 border-r-2 border-b-2 border-gray-400 p-4 flex flex-col gap-4">
        <h1 className="text-2xl font-bold">Filters</h1>

        {/* Event/Game Toggles */}
        <div className="flex gap-4">
          <label>
            <input
              type="checkbox"
              checked={includeEvents}
              onChange={(e) => {
                setIncludeEvents(e.target.checked);
                setPage(1);
              }}
            />{" "}
            Events
          </label>
          <label>
            <input
              type="checkbox"
              checked={includeGames}
              onChange={(e) => {
                setIncludeGames(e.target.checked);
                setPage(1);
              }}
            />{" "}
            Games
          </label>
        </div>

        {/* Search by name */}
        <input
          type="text"
          placeholder="Search by name..."
          className="border p-2 w-full"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
        />

        {/* Location + Distance */}
        <div className="flex gap-2 items-center">
          <input
            type="text"
            placeholder="Location (e.g. London, UK)"
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
            <option value="25">Within 25 miles</option>
            <option value="50">Within 50 miles</option>
            <option value="100">Within 100 miles</option>
          </select>
        </div>

        {/* Sort */}
        <select
          className="border p-2 w-full"
          value={sort}
          onChange={(e) => {
            setSort(e.target.value);
            setPage(1);
          }}
        >
          <option value="dateStart_asc">Soonest</option>
          <option value="dateStart_desc">Oldest</option>
          <option value="name_asc">Name A–Z</option>
          <option value="name_desc">Name Z–A</option>
          <option value="distance_asc">Nearest</option>
          <option value="distance_desc">Farthest</option>
        </select>

        {/* Upcoming / Past */}
        <select
          className="border p-2 w-full"
          value={timeFilter}
          onChange={(e) => {
            setTimeFilter(e.target.value);
            setPage(1);
          }}
        >
          <option value="">All</option>
          <option value="upcoming">Upcoming</option>
          <option value="past">Past</option>
        </select>

        {/* Results */}
        <div className="flex-1 overflow-auto border-t pt-4">
          {results.length === 0 && <p>No results found.</p>}
          {results.map((item) => {
            const startDate = formatUnixTimestamp(item.dateStart);
            const endDate = formatUnixTimestamp(item.dateEnd);
            const startDateFormatted = formatDate(item.dateStart);
            const endDateFormatted = formatDate(item.dateEnd);

            const location = item.location || {};
            const address = location.address ?? "No address";
            const lat = location.lat ?? null;
            const lng = location.long ?? null;
            
            return (
              <div key={item.hash} className="mb-4 border-b-2 border-gray-300 pb-4">
                <h2 className="font-bold">
                  {item.name ?? `${item.homeTeamName} vs ${item.awayTeamName}`}
                </h2>
                <p>
                  {startDateFormatted} {startDateFormatted && endDateFormatted ? `– ${endDateFormatted}` : ""}
                </p>
                <>Sport: {item.sport} {item.category ? `(${item.category})` : ""} {item.competitionName ? `(Competition: ${item.competitionName})` : ""}</>
                <p>Location: {address}</p>
            
                {lat != null && lng != null && (
                  <p>
                    <a 
                      href={`https://www.google.com/maps?q=${lat},${lng}`} 
                      target="_blank" 
                      rel="noopener noreferrer"
                    >
                      View on Google Maps
                    </a>
                  </p>
                )}
            
                {item._distance != null && item._distance !== Infinity && (
                  <p>Distance: {item._distance.toFixed(1)} miles</p>
                )}
                {item.sourceUrl && (
                  <a href={item.sourceUrl}>More Info</a>
                )}
              </div>
            );
          })}

          {/* Pagination */}
          <div className="flex justify-center gap-2 mt-4">
            <button
              className="px-3 py-1 border rounded disabled:opacity-50"
              disabled={page <= 1}
              onClick={() => setPage((p) => p - 1)}
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
      </div>

      {/* RIGHT PANEL — Map */}
      <div className="w-5/12 border-l-2 border-r-2 border-b-2 border-gray-400 p-4">
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

            {/* All event/game markers */}
            {markers.map((item) => (
              <Marker
                key={item.hash}
                position={[item.location.lat, item.location.long]}
              >
                <Popup>
                  <strong>
                    {item.name ?? `${item.homeTeamName} vs ${item.awayTeamName}`}
                  </strong>
                  <br />
                  {item.category ?? item.competitionName}
                  <br />
                  {item.location.address ?? "No address"}
                </Popup>
              </Marker>
            ))}

            {/* Queried location marker (if valid) */}
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
