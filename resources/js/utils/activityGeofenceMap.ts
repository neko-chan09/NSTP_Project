import L from "leaflet";

export interface LocationPoint {
  latitude: number | null; longitude: number | null;
  student_name: string; student_id: string;
  accuracy?: number | null; location_recorded_at?: string | null;
  distance_from_venue: number | null;
}
export function validCoordinates(lat: unknown, lng: unknown): boolean {
  return lat !== null && lat !== undefined && lat !== "" && lng !== null && lng !== undefined && lng !== "" && Number.isFinite(Number(lat)) && Number.isFinite(Number(lng)) && Math.abs(Number(lat)) <= 90 && Math.abs(Number(lng)) <= 180;
}
export function locationStatus(distance: number | null, accuracy: number | null | undefined, radius: number): string {
  if (distance === null || !Number.isFinite(distance)) return "Location unavailable";
  if (accuracy === null || accuracy === undefined || !Number.isFinite(accuracy) || accuracy < 0) return distance <= radius ? "Inside · accuracy unknown" : "Outside · accuracy unknown";
  if (distance + accuracy <= radius) return "Inside";
  if (distance - accuracy > radius) return "Outside";
  return "Near boundary · GPS uncertain";
}
export function fitGeofence(map: L.Map, lat: number, lng: number, radius: number, people: LocationPoint[], venueOnly = false) {
  const bounds = L.latLng(lat, lng).toBounds(radius * 2);
  if (!venueOnly) people.forEach(p => {
    if (!validCoordinates(p.latitude, p.longitude)) return;
    const accuracy = p.accuracy;
    if (accuracy != null && Number.isFinite(accuracy) && accuracy > 0) bounds.extend(L.latLng(Number(p.latitude), Number(p.longitude)).toBounds(accuracy * 2));
    else bounds.extend([Number(p.latitude), Number(p.longitude)]);
  });
  map.invalidateSize();
  map.fitBounds(bounds, {padding: [45, 45], maxZoom: 19});
}
export function drawGeofence(map: L.Map, lat: number, lng: number, radius: number, people: LocationPoint[], showAccuracy: boolean, venue: string) {
  map.eachLayer(layer => { if (layer instanceof L.Marker || layer instanceof L.Path) map.removeLayer(layer); });
  L.circle([lat, lng], {radius, color: "#b77900", fillColor: "#f5b928", fillOpacity: .18, weight: 3, dashArray: "7 5"}).addTo(map)
    .bindTooltip(`Allowed boundary · ${radius} m radius`, {permanent: true, direction: "top"});
  const venueLabel = document.createElement("div"); venueLabel.textContent = venue;
  L.marker([lat, lng], {icon: L.divIcon({className: "", html: '<div style="width:18px;height:18px;border:3px solid white;border-radius:50%;background:#b77900;box-shadow:0 1px 5px #555"></div>', iconSize:[18,18],iconAnchor:[9,9]})}).addTo(map).bindPopup(venueLabel);
  people.forEach(p => {
    if (!validCoordinates(p.latitude, p.longitude)) return;
    const position: L.LatLngExpression = [Number(p.latitude), Number(p.longitude)];
    const distance = map.distance([lat, lng], position);
    const status = locationStatus(distance, p.accuracy, radius);
    const color = status.startsWith("Near") ? "#b77900" : distance <= radius ? "#00855a" : "#d12e45";
    if (showAccuracy && p.accuracy != null && Number.isFinite(p.accuracy) && p.accuracy > 0) {
      L.circle(position, {radius:p.accuracy,color:"#2563eb",weight:1,fillColor:"#2563eb",fillOpacity:.12}).addTo(map).bindTooltip(`Reported GPS accuracy: ±${Math.round(p.accuracy)} m`);
    }
    const icon = document.createElement("div"); icon.textContent = p.student_name.slice(0,1);
    Object.assign(icon.style,{width:"30px",height:"30px",borderRadius:"50%",border:"2px solid white",background:color,color:"white",display:"grid",placeItems:"center",fontWeight:"bold"});
    const popup = document.createElement("div");
    for (const line of [p.student_name, p.student_id, status, `Distance: ${distance.toFixed(1)} m`, p.accuracy == null ? "GPS accuracy unknown" : `Reported GPS accuracy: ±${Math.round(p.accuracy)} m`, p.location_recorded_at ? `Location recorded: ${new Date(p.location_recorded_at).toLocaleString()}` : "Location time unknown"]) {
      const row=document.createElement("div");row.textContent=line;popup.appendChild(row);
    }
    L.marker(position,{icon:L.divIcon({className:"",html:icon,iconSize:[30,30],iconAnchor:[15,15]})}).addTo(map).bindPopup(popup);
  });
}
