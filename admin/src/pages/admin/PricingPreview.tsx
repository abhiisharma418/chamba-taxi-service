import React, { useState } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

const API_URL = (import.meta as any).env?.VITE_API_URL || 'http://localhost:5000';

const ClickHandler: React.FC<{ onClick: (latlng: L.LatLng) => void }> = ({ onClick }) => {
  useMapEvents({ click: (e) => onClick(e.latlng) });
  return null;
};

const PricingPreview: React.FC = () => {
  const [pickup, setPickup] = useState<[number, number] | null>(null);
  const [destination, setDestination] = useState<[number, number] | null>(null);
  const [vehicleType, setVehicleType] = useState<'car' | 'bike'>('car');
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string>('');
  const [selecting, setSelecting] = useState<'pickup' | 'destination'>('pickup');

  const onMapClick = (latlng: L.LatLng) => {
    const coords: [number, number] = [latlng.lng, latlng.lat];
    if (selecting === 'pickup') setPickup(coords);
    else setDestination(coords);
  };

  const estimate = async () => {
    try {
      setError(''); setResult(null);
      if (!pickup || !destination) throw new Error('Select both points');
      const body = {
        pickup: { address: '', coordinates: pickup },
        destination: { address: '', coordinates: destination },
        vehicleType,
        regionType: 'city'
      };
      const res = await fetch(`${API_URL}/api/rides/estimate`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();
      setResult(data.data);
    } catch (e: any) { setError(e.message); }
  };

  return (
    <div className="min-h-screen p-6">
      <h1 className="text-2xl font-bold mb-4">Pricing Preview</h1>
      {error && <div className="mb-3 text-red-600">{error}</div>}

      <div className="mb-4 flex items-center gap-3">
        <button onClick={()=>setSelecting('pickup')} className={`px-3 py-2 rounded border ${selecting==='pickup'?'bg-blue-600 text-white':''}`}>Select Pickup</button>
        <button onClick={()=>setSelecting('destination')} className={`px-3 py-2 rounded border ${selecting==='destination'?'bg-blue-600 text-white':''}`}>Select Destination</button>
        <select className="border rounded px-2 py-2" value={vehicleType} onChange={e=>setVehicleType(e.target.value as any)}>
          <option value="car">Car</option>
          <option value="bike">Bike</option>
        </select>
        <button onClick={estimate} className="bg-emerald-600 text-white px-4 py-2 rounded">Estimate</button>
      </div>

      <div className="bg-white border rounded mb-4" style={{ height: 400 }}>
        <MapContainer center={[31.1048, 77.1734] as any} zoom={9 as any} style={{height: '100%', width: '100%'}}>
          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
          <ClickHandler onClick={onMapClick} />
          {pickup && <Marker position={[pickup[1], pickup[0]]} />}
          {destination && <Marker position={[destination[1], destination[0]]} />}
        </MapContainer>
      </div>

      {result && (
        <div className="bg-white border rounded p-4">
          <div>Region: <b className="capitalize">{result.regionType}</b></div>
          <div>Distance: <b>{result.distanceKm} km</b></div>
          <div>Duration: <b>{result.durationMin} min</b></div>
          <div>Surge: <b>×{result.surge}</b> (Demand Index: {result.demandIndex})</div>
          <div className="text-xl mt-2">Estimated Fare: <b>₹{result.estimated}</b></div>
        </div>
      )}
    </div>
  );
};

export default PricingPreview;