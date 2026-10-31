// src/components/common/LocationPicker.tsx

import React, { useState, useEffect, useRef } from "react";
import toast from "react-hot-toast";

interface LocationPickerProps {
  latitude: number | null;
  longitude: number | null;
  onLocationSelect: (lat: number, lng: number) => void;
  venueName?: string;
}

const LocationPicker: React.FC<LocationPickerProps> = ({
  latitude,
  longitude,
  onLocationSelect,
  venueName,
}) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [searching, setSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [position, setPosition] = useState<[number, number] | null>(
    latitude && longitude ? [latitude, longitude] : null
  );
  const [mapLoaded, setMapLoaded] = useState(false);
  const [mapError, setMapError] = useState<string | null>(null);
  const [showSearchResults, setShowSearchResults] = useState(false);

  const searchRef = useRef<HTMLDivElement>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const markerRef = useRef<any>(null);
  const leafletRef = useRef<any>(null);

  // ------------------------------------------------------------
  // True when the marker matches the currently saved coordinates
  // ------------------------------------------------------------
  const isConfirmed =
    position !== null &&
    latitude !== null &&
    longitude !== null &&
    Math.abs(position[0] - latitude) < 1e-7 &&
    Math.abs(position[1] - longitude) < 1e-7;

  // ------------------------------------------------------------
  // Initialize map
  // ------------------------------------------------------------
  useEffect(() => {
    let cancelled = false;

    const initMap = async () => {
      if (!mapContainerRef.current) return;
      if (mapRef.current) return;

      try {
        const L = (await import("leaflet")).default;

        delete (L.Icon.Default.prototype as any)._getIconUrl;
        L.Icon.Default.mergeOptions({
          iconUrl:
            "https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png",
          iconRetinaUrl:
            "https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png",
          shadowUrl:
            "https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png",
        });

        leafletRef.current = L;

        if ((mapContainerRef.current as any)._leaflet_id) {
          (mapContainerRef.current as any)._leaflet_id = null;
        }

        const map = L.map(mapContainerRef.current, {
          center: [8.521826076323629, 124.57249491758405],
          zoom: 17,
          zoomControl: false,
          maxZoom: 19,
          minZoom: 12,
        });

        if (cancelled) {
          map.remove();
          return;
        }

        L.tileLayer(
          "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
          {
            attribution: '&copy; <a href="https://www.esri.com/">Esri</a>',
            maxZoom: 19,
            minZoom: 12,
          }
        ).addTo(map);

        L.control.zoom({ position: "topright" }).addTo(map);

        map.on("click", (e: any) => {
          const { lat, lng } = e.latlng;
          setPosition([lat, lng]);
          updateMarker(L, lat, lng);
          // NOTE: no onLocationSelect here — user must Confirm
        });

        if (position) {
          updateMarker(L, position[0], position[1]);
        }

        mapRef.current = map;

        setTimeout(() => {
          if (cancelled) return;
          map.invalidateSize();
          setMapLoaded(true);
        }, 200);
      } catch (err: any) {
        console.error("Leaflet init error:", err);
        if (!cancelled) {
          setMapError(err?.message || "Failed to load map");
          toast.error("Failed to load map. Check console for details.");
        }
      }
    };

    initMap();

    return () => {
      cancelled = true;
      if (mapRef.current) {
        try {
          mapRef.current.remove();
        } catch {
          /* ignore */
        }
        mapRef.current = null;
      }
      markerRef.current = null;
      if (mapContainerRef.current) {
        (mapContainerRef.current as any)._leaflet_id = null;
      }
    };
  }, []);

  // ------------------------------------------------------------
  // Sync external lat/lng → internal position + marker
  // ------------------------------------------------------------
  useEffect(() => {
    if (!mapRef.current || !leafletRef.current) return;
    if (latitude !== null && longitude !== null) {
      updateMarker(leafletRef.current, latitude, longitude, true);
      setPosition([latitude, longitude]);
    }
  }, [latitude, longitude]);

  const updateMarker = (
    L: any,
    lat: number,
    lng: number,
    panTo: boolean = false
  ) => {
    if (!mapRef.current) return;

    if (markerRef.current) {
      markerRef.current.setLatLng([lat, lng]);
    } else {
      const marker = L.marker([lat, lng], { draggable: true }).addTo(
        mapRef.current
      );

      marker.bindPopup(`
        <div style="text-align:center">
          <strong>${venueName || "Selected Location"}</strong><br/>
          <span style="font-size:11px;color:#666">
            ${lat.toFixed(6)}, ${lng.toFixed(6)}
          </span>
        </div>
      `);

      marker.on("dragend", (e: any) => {
        const pos = e.target.getLatLng();
        setPosition([pos.lat, pos.lng]);
        // no onLocationSelect — user must Confirm
      });

      markerRef.current = marker;
    }

    if (panTo) {
      mapRef.current.setView([lat, lng], 17);
    }
  };

  // ------------------------------------------------------------
  // Search
  // ------------------------------------------------------------
  const searchLocation = async (query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      setShowSearchResults(false);
      return;
    }

    setSearching(true);
    setShowSearchResults(true);
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
          query
        )}&limit=5&countrycodes=ph`
      );
      const data = await response.json();
      setSearchResults(data);
    } catch (error) {
      console.error("Search error:", error);
      toast.error("Failed to search location");
    } finally {
      setSearching(false);
    }
  };

  const selectSearchResult = (result: any) => {
    const lat = parseFloat(result.lat);
    const lng = parseFloat(result.lon);
    setPosition([lat, lng]);
    setSearchResults([]);
    setShowSearchResults(false);
    setSearchQuery(result.display_name.split(",")[0]);

    if (mapRef.current && leafletRef.current) {
      updateMarker(leafletRef.current, lat, lng, true);
    }
    toast(`Previewing ${result.display_name.split(",")[0]}. Click "Confirm Location" to use it.`, {
      icon: "👁️",
    });
  };

  // ------------------------------------------------------------
  // Geolocation
  // ------------------------------------------------------------
  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      toast.error("Geolocation is not supported by your browser");
      return;
    }

    toast.loading("Getting your location...");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude: lat, longitude: lng } = pos.coords;
        setPosition([lat, lng]);
        if (mapRef.current && leafletRef.current) {
          updateMarker(leafletRef.current, lat, lng, true);
        }
        toast.dismiss();
        toast(`Previewing your location. Click "Confirm Location" to use it.`, {
          icon: "👁️",
        });
      },
      (error) => {
        console.error(error);
        toast.dismiss();
        toast.error("Unable to get your location. Please try searching.");
      },
      { enableHighAccuracy: true }
    );
  };

  // ------------------------------------------------------------
  // Click outside closes search
  // ------------------------------------------------------------
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        searchRef.current &&
        !searchRef.current.contains(event.target as Node)
      ) {
        setShowSearchResults(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () =>
      document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // ------------------------------------------------------------
  // Quick preview
  // ------------------------------------------------------------
  const quickVenues = [
    {
      label: "📍 OCC Main Campus",
      lat: 8.52182,
      lng: 124.57244,
    },
    { label: "🏟️ OCC Gymnasium", lat: 8.5215, lng: 124.572294 },
    { label: "🏟️ Taboc Opol Gymnasium", lat: 8.518316, lng: 124.576157 },
    { label: "🏟️ Opol Boardwalk", lat: 8.521507, lng: 124.575593 },
  ];
//8.521507, 124.575593
  const previewQuickVenue = (venue: {
    label: string;
    lat: number;
    lng: number;
  }) => {
    if (mapRef.current && leafletRef.current) {
      mapRef.current.setView([venue.lat, venue.lng], 18);
      updateMarker(leafletRef.current, venue.lat, venue.lng);
    }
    setPosition([venue.lat, venue.lng]);
    toast(`Previewing ${venue.label}. Click "Confirm Location" to use it.`, {
      icon: "👁️",
    });
  };

  const confirmCurrentPosition = () => {
    if (position) {
      onLocationSelect(position[0], position[1]);
      toast.success("Location confirmed!");
    } else {
      toast.error("Click on the map first to pick a location");
    }
  };

  return (
    <div className="space-y-3">
      {/* Search */}
      <div className="flex flex-col sm:flex-row gap-2" ref={searchRef}>
        <div className="flex-1 relative">
          <input
            type="text"
            className="input pr-10"
            placeholder="Search for a location in Opol, Misamis Oriental..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              if (e.target.value.length > 2) {
                searchLocation(e.target.value);
              } else {
                setSearchResults([]);
                setShowSearchResults(false);
              }
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                searchLocation(searchQuery);
              }
            }}
          />
          <button
            type="button"
            className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            onClick={() => searchLocation(searchQuery)}
            disabled={searching}
          >
            <i
              className={`fas ${searching ? "fa-spinner fa-spin" : "fa-search"}`}
            />
          </button>
        </div>
        <button
          type="button"
          className="btn btn-secondary btn-sm whitespace-nowrap"
          onClick={getCurrentLocation}
        >
          <i className="fas fa-location-dot mr-1" />
          Use My Location
        </button>
      </div>

      {/* Search results */}
      {showSearchResults && searchResults.length > 0 && (
        <div className="bg-white border border-slate-200 rounded-lg shadow-lg max-h-60 overflow-y-auto z-10 relative">
          {searchResults.map((result, index) => (
            <button
              key={index}
              type="button"
              className="w-full text-left px-4 py-2 hover:bg-slate-50 border-b border-slate-100 last:border-0 transition-colors flex items-start gap-2"
              onClick={() => selectSearchResult(result)}
            >
              <i className="fas fa-map-pin text-gold-500 mt-1" />
              <div>
                <div className="text-sm font-medium text-navy-900">
                  {result.display_name.split(",")[0]}
                </div>
                <div className="text-xs text-slate-500">
                  {result.display_name.split(",").slice(1).join(",").trim()}
                </div>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Map */}
      <div className="relative">
        <div
          ref={mapContainerRef}
          className="h-[400px] rounded-xl overflow-hidden border border-slate-200 bg-slate-900"
          style={{ width: "100%", minHeight: 400 }}
        />

        {!mapLoaded && !mapError && (
          <div className="absolute inset-0 flex items-center justify-center bg-slate-900/80 rounded-xl">
            <div className="text-center">
              <i className="fas fa-spinner fa-spin text-3xl text-gold-500 mb-2" />
              <p className="text-sm text-white/70">Loading satellite map...</p>
            </div>
          </div>
        )}

        {mapError && (
          <div className="absolute inset-0 flex items-center justify-center bg-slate-900/90 rounded-xl">
            <div className="text-center p-6">
              <i className="fas fa-exclamation-triangle text-4xl text-red-400 mb-3" />
              <p className="text-white font-medium mb-1">Map failed to load</p>
              <p className="text-xs text-white/60 mb-3">{mapError}</p>
              <button
                type="button"
                className="btn btn-primary btn-sm"
                onClick={() => window.location.reload()}
              >
                <i className="fas fa-sync mr-1" /> Reload Page
              </button>
            </div>
          </div>
        )}

        {mapLoaded && (
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 bg-black/70 backdrop-blur-sm px-4 py-2 rounded-lg shadow-md text-xs text-white/80 border border-white/10">
            <i className="fas fa-hand-pointer text-gold-400 mr-1" />
            Click on the map to set location • Drag marker to adjust
          </div>
        )}
      </div>

      {/* Selected location panel */}
      {position && (
        <div
          className={`rounded-lg p-3 border ${
            isConfirmed
              ? "bg-emerald-50 border-emerald-200"
              : "bg-amber-50 border-amber-200"
          }`}
        >
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div>
              <p
                className={`text-sm font-medium ${
                  isConfirmed ? "text-emerald-700" : "text-amber-700"
                }`}
              >
                <i
                  className={`fas ${
                    isConfirmed ? "fa-check-circle" : "fa-eye"
                  } mr-1`}
                />
                {isConfirmed ? "Location saved" : "Preview — not saved yet"}
              </p>
              <p
                className={`text-xs ${
                  isConfirmed ? "text-emerald-600" : "text-amber-600"
                }`}
              >
                Lat: {position[0].toFixed(6)}, Lng: {position[1].toFixed(6)}
              </p>
              {venueName && (
                <p
                  className={`text-xs ${
                    isConfirmed ? "text-emerald-600" : "text-amber-600"
                  }`}
                >
                  Venue: {venueName}
                </p>
              )}
              {!isConfirmed && (latitude || longitude) && (
                <p className="text-xs text-amber-700 mt-1">
                  <i className="fas fa-exclamation-triangle mr-1" />
                  This differs from the saved location. Click{" "}
                  <strong>Confirm</strong> to update.
                </p>
              )}
            </div>
            <div className="flex gap-2">
              {!isConfirmed && (
                <button
                  type="button"
                  className="btn btn-success btn-sm"
                  onClick={confirmCurrentPosition}
                >
                  <i className="fas fa-check mr-1" />
                  Confirm Location
                </button>
              )}
              {isConfirmed && (
                <span className="text-xs text-emerald-600 flex items-center">
                  <i className="fas fa-check-circle mr-1" />
                  Saved
                </span>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Quick venues */}
      <div className="flex flex-wrap gap-2">
        <span className="text-xs text-slate-400 self-center">
          📍 Quick preview:
        </span>
        {quickVenues.map((place, index) => (
          <button
            key={index}
            type="button"
            className={`px-3 py-1 rounded-full text-xs transition-colors ${
              position &&
              position[0] === place.lat &&
              position[1] === place.lng
                ? "bg-gold-500 text-white"
                : "bg-slate-100 hover:bg-slate-200 text-slate-600"
            }`}
            onClick={() => previewQuickVenue(place)}
          >
            {place.label}
          </button>
        ))}
      </div>

      {/* Help box */}
      <div className="bg-blue-50 rounded-lg p-3 border border-blue-200">
        <div className="flex items-start gap-2">
          <i className="fas fa-info-circle text-blue-500 mt-0.5" />
          <div>
            <p className="text-xs text-blue-700 font-medium">
              Opol Community College
            </p>
            <p className="text-xs text-blue-600">
              Poblacion, Opol, Misamis Oriental, Philippines
            </p>
            <p className="text-xs text-blue-500 mt-1">
              <i className="fas fa-lightbulb mr-1" />
              Click on the map, drag the marker, or preview a quick place —
              then click <strong>Confirm Location</strong> to save it.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LocationPicker;