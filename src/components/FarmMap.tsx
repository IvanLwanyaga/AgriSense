import { useMemo, useState } from "react";
import type { Farm } from "../types/farm";

export default function FarmMap({ farms }: { farms: Farm[] }) {
  const [selectedFarmId, setSelectedFarmId] = useState(farms[0]?.id ?? "");

  const mappedFarms = useMemo(
    () => farms.filter((farm) => Number.isFinite(farm.location?.latitude) && Number.isFinite(farm.location?.longitude)),
    [farms]
  );
  const selectedFarm = mappedFarms.find((farm) => farm.id === selectedFarmId) ?? mappedFarms[0];

  const mapUrl = selectedFarm
    ? (() => {
        const { latitude, longitude } = selectedFarm.location;
        const bounds = [longitude - 0.035, latitude - 0.025, longitude + 0.035, latitude + 0.025]
          .map((coordinate) => coordinate.toFixed(6))
          .join(",");
        return `https://www.openstreetmap.org/export/embed.html?bbox=${encodeURIComponent(bounds)}&layer=mapnik&marker=${latitude}%2C${longitude}`;
      })()
    : null;

  if (farms.length === 0) {
    return <div className="map-empty-state"><span className="empty-icon">⌖</span><h3>No registered farms yet</h3><p>Add a farm with its coordinates to see it on the live map.</p></div>;
  }

  if (!selectedFarm || !mapUrl) {
    return <div className="map-empty-state"><h3>Farm coordinates are missing</h3><p>Edit a registered farm and add its latitude and longitude to place it on the map.</p></div>;
  }

  return (
    <div className="farm-map-component">
      <div className="map-live-toolbar">
        <label htmlFor="map-farm-select">Farm location
          <select id="map-farm-select" value={selectedFarm.id} onChange={(event) => setSelectedFarmId(event.target.value)}>
            {mappedFarms.map((farm) => <option key={farm.id} value={farm.id}>{farm.name} · {farm.district}</option>)}
          </select>
        </label>
        <a className="map-external-link" href={`https://www.openstreetmap.org/?mlat=${selectedFarm.location.latitude}&mlon=${selectedFarm.location.longitude}#map=15/${selectedFarm.location.latitude}/${selectedFarm.location.longitude}`} target="_blank" rel="noreferrer">Open larger map <span>↗</span></a>
      </div>
      <div className="map-live-details">
        <div><span className="map-live-indicator" /><span>LIVE STREET MAP</span><small>OpenStreetMap</small></div>
        <strong>{selectedFarm.name}</strong>
        <p>{selectedFarm.subCounty ? `${selectedFarm.subCounty}, ` : ""}{selectedFarm.district}, Uganda · {selectedFarm.location.latitude.toFixed(5)}, {selectedFarm.location.longitude.toFixed(5)}</p>
      </div>
      <iframe
        className="farm-live-map"
        title={`Live street map centered on ${selectedFarm.name} in ${selectedFarm.district}`}
        src={mapUrl}
        loading="lazy"
        referrerPolicy="no-referrer-when-downgrade"
      />
      <p className="map-attribution">Map data © <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">OpenStreetMap contributors</a>. The pin uses the coordinates saved on this farm record.</p>
    </div>
  );
}
