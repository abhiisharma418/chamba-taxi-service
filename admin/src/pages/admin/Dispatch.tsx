import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { DispatchAPI, getToken, setToken } from '../../lib/api';

const ClickHandler: React.FC<{ onClick: (latlng: L.LatLng) => void }> = ({ onClick }) => {
  useMapEvents({ click: (e) => onClick(e.latlng) });
  return null;
};

const DispatchPage: React.FC = () => {
  const [pickup, setPickup] = useState<{ lng: number; lat: number }>({ lng: 77.1734, lat: 31.1048 });
  const [drivers, setDrivers] = useState<any[]>([]);
  const [radiusKm, setRadiusKm] = useState(10);
  const [tokenInput, setTokenInput] = useState(getToken() || '');
  const [error, setError] = useState('');

  const saveToken = () => setToken(tokenInput);

  const search = async () => {
    setError('');
    try { const res = await DispatchAPI.search(pickup, radiusKm); setDrivers(res.data || []); } catch (e: any) { setError(e.message); }
  };

  useEffect(() => { search(); }, []);

  return (
    <div className="min-h-screen p-6">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold">Dispatch</h1>
        <div className="flex items-center gap-2">
          <input type="text" placeholder="Admin JWT token" value={tokenInput} onChange={e=>setTokenInput(e.target.value)} className="border rounded px-3 py-2 w-96" />
          <button onClick={saveToken} className="bg-blue-600 text-white px-4 py-2 rounded">Set Token</button>
        </div>
      </div>

      {error && <div className="mb-4 text-red-600">{error}</div>}

      <div className="flex items-center gap-3 mb-3">
        <input type="number" value={pickup.lng} onChange={e=>setPickup(p=>({...p, lng: Number(e.target.value)}))} className="border rounded px-3 py-2" placeholder="Lng" />
        <input type="number" value={pickup.lat} onChange={e=>setPickup(p=>({...p, lat: Number(e.target.value)}))} className="border rounded px-3 py-2" placeholder="Lat" />
        <input type="number" value={radiusKm} onChange={e=>setRadiusKm(Number(e.target.value))} className="border rounded px-3 py-2" placeholder="Radius km" />
        <button onClick={search} className="px-4 py-2 bg-emerald-600 text-white rounded">Search</button>
      </div>

      <div className="bg-white border rounded mb-6" style={{ height: 450 }}>
        <MapContainer center={[pickup.lat, pickup.lng] as any} zoom={11 as any} style={{height: '100%', width: '100%'}}>
          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
          <ClickHandler onClick={(latlng)=>setPickup({ lng: latlng.lng, lat: latlng.lat })} />
          {drivers.map((d,i)=>(<Marker key={i} position={[d.lat, d.lng]} />))}
        </MapContainer>
      </div>

      <div className="bg-white border rounded p-4">
        <h2 className="text-lg font-semibold mb-2">Nearby Drivers</h2>
        <ul className="list-disc pl-5">
          {drivers.map((d,i)=>(<li key={i}>Driver {d.driverId} at [{d.lat.toFixed(4)}, {d.lng.toFixed(4)}]</li>))}
        </ul>
      </div>
    </div>
  );
};

export default DispatchPage;