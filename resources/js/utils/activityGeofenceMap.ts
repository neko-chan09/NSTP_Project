import L from "leaflet";

export interface LocationPoint {
  latitude: number | null; longitude: number | null;
  student_name: string; student_id: string;
  is_tracking?:boolean;location_state?:string;
  accuracy?: number | null; location_recorded_at?: string | null; location_source?: string;
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
export function monitorFreshness(recorded:string|null|undefined,source?:string,now=Date.now()):string {
 if(source==='checkin')return 'Check-in position - not live';
 const time=recorded?Date.parse(recorded):NaN;
 if(!Number.isFinite(time)||time>now+30000)return 'Location time unknown';
 return now-time>60000?'Stale - awaiting student connection':'Recent GPS fix';
}
export function monitorLabel(point:LocationPoint,radius:number):string {
 if(!validCoordinates(point.latitude,point.longitude))return point.is_tracking?'Waiting for first GPS fix':'Not sharing - no GPS received';
 if(point.is_tracking===false)return 'Sharing stopped - last known position';
 const fresh=monitorFreshness(point.location_recorded_at,point.location_source);
 return fresh==='Recent GPS fix'?locationStatus(point.distance_from_venue,point.accuracy,radius):fresh;
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
type MarkerState={marker:L.Marker;accuracy?:L.Circle};
type MapState={boundary:L.Circle;venue:L.Marker;people:Map<string,MarkerState>};
const liveLayers=new WeakMap<L.Map,MapState>();
export function drawGeofence(map: L.Map, lat: number, lng: number, radius: number, people: LocationPoint[], showAccuracy: boolean, venue: string) {
  let state=liveLayers.get(map);
  if(!state){
    const boundary=L.circle([lat,lng],{radius,color:'#b77900',fillColor:'#f5b928',fillOpacity:.18,weight:3,dashArray:'7 5'}).addTo(map);
    const venueMarker=L.marker([lat,lng],{icon:L.divIcon({className:'',html:'<div style="width:18px;height:18px;border:3px solid white;border-radius:50%;background:#b77900"></div>',iconSize:[18,18],iconAnchor:[9,9]})}).addTo(map);
    state={boundary,venue:venueMarker,people:new Map()};liveLayers.set(map,state);
  }
  state.boundary.setLatLng([lat,lng]).setRadius(radius).unbindTooltip().bindTooltip(`Allowed boundary - ${radius} m radius`,{permanent:true,direction:'top'});
  const venueLabel=document.createElement('div');venueLabel.textContent=venue;
  state.venue.setLatLng([lat,lng]).bindPopup(venueLabel);
  const present=new Set<string>();
  people.forEach(p=>{
    if(!validCoordinates(p.latitude,p.longitude))return;
    present.add(p.student_id);
    const position:L.LatLngExpression=[Number(p.latitude),Number(p.longitude)];
    const distance=map.distance([lat,lng],position);
    const status=monitorLabel({...p,distance_from_venue:distance},radius);
    const color=(!status.startsWith('Inside')&&!status.startsWith('Outside')&&!status.startsWith('Near'))?'#64748b':status.startsWith('Near')?'#b77900':distance<=radius?'#00855a':'#d12e45';
    let item=state!.people.get(p.student_id);
    if(!item){item={marker:L.marker(position).addTo(map)};state!.people.set(p.student_id,item)}
    item.marker.setLatLng(position);
    const icon=document.createElement('div');icon.textContent=p.student_name.slice(0,1);
    Object.assign(icon.style,{width:'30px',height:'30px',borderRadius:'50%',border:'2px solid white',background:color,color:'white',display:'grid',placeItems:'center',fontWeight:'bold'});
    item.marker.setIcon(L.divIcon({className:'',html:icon,iconSize:[30,30],iconAnchor:[15,15]}));
    const popup=document.createElement('div');
    for(const line of [p.student_name,p.student_id,status,`Distance: ${distance.toFixed(1)} m`,p.accuracy==null?'GPS accuracy unknown':`Reported GPS accuracy: +/-${Math.round(p.accuracy)} m`,p.location_recorded_at?`Location recorded: ${new Date(p.location_recorded_at).toLocaleString()}`:'Location time unknown']){const row=document.createElement('div');row.textContent=line;popup.appendChild(row)}
    if(item.marker.getPopup())item.marker.setPopupContent(popup);else item.marker.bindPopup(popup);
    if(showAccuracy&&p.accuracy!=null&&Number.isFinite(p.accuracy)&&p.accuracy>0){
      if(!item.accuracy)item.accuracy=L.circle(position,{radius:p.accuracy,color:'#2563eb',weight:1,fillColor:'#2563eb',fillOpacity:.12}).addTo(map);
      item.accuracy.setLatLng(position).setRadius(p.accuracy);
    }else if(item.accuracy){map.removeLayer(item.accuracy);item.accuracy=undefined}
  });
  state.people.forEach((item,id)=>{if(!present.has(id)){map.removeLayer(item.marker);if(item.accuracy)map.removeLayer(item.accuracy);state!.people.delete(id)}});
}
