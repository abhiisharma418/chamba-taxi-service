import React, { useEffect, useState } from 'react';
import { ZonesAPI, getToken, setToken } from '../../lib/api';

interface Zone {
  _id?: string;
  name: string;
  region: 'hill' | 'city';
  polygon: { type: 'Polygon'; coordinates: number[][][] };
  active: boolean;
}

const empty: Zone = { name: '', region: 'hill', polygon: { type: 'Polygon', coordinates: [[[77.0,31.0],[77.1,31.0],[77.1,31.1],[77.0,31.1],[77.0,31.0]]] }, active: true };

const Zones: React.FC = () => {
  const [list, setList] = useState<Zone[]>([]);
  const [form, setForm] = useState<Zone>(empty);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [polygonText, setPolygonText] = useState<string>(JSON.stringify(empty.polygon, null, 2));
  const [error, setError] = useState<string>('');
  const [tokenInput, setTokenInput] = useState<string>(getToken() || '');

  const load = async () => {
    try { const res = await ZonesAPI.list(); setList(res.data); } catch (e: any) { setError(e.message); }
  };
  useEffect(() => { load(); }, []);

  const onSave = async () => {
    try {
      setError('');
      const payload = { ...form, polygon: JSON.parse(polygonText) };
      if (editingId) {
        const res = await ZonesAPI.update(editingId, payload);
        setList(prev => prev.map(z => z._id === editingId ? res.data : z));
      } else {
        const res = await ZonesAPI.create(payload);
        setList(prev => [res.data, ...prev]);
      }
      setForm(empty); setPolygonText(JSON.stringify(empty.polygon, null, 2)); setEditingId(null);
    } catch (e: any) { setError(e.message); }
  };

  const onEdit = (z: Zone) => {
    setEditingId(z._id!);
    setForm({ name: z.name, region: z.region, polygon: z.polygon, active: z.active });
    setPolygonText(JSON.stringify(z.polygon, null, 2));
  };

  const onDelete = async (id?: string) => {
    if (!id) return;
    try { await ZonesAPI.remove(id); setList(prev => prev.filter(z => z._id !== id)); } catch (e: any) { setError(e.message); }
  };

  const saveToken = () => setToken(tokenInput);

  return (
    <div className="min-h-screen p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Zones</h1>
        <div className="flex items-center gap-2">
          <input type="text" placeholder="Admin JWT token" value={tokenInput} onChange={e=>setTokenInput(e.target.value)} className="border rounded px-3 py-2 w-96" />
          <button onClick={saveToken} className="bg-blue-600 text-white px-4 py-2 rounded">Set Token</button>
        </div>
      </div>

      {error && <div className="mb-4 text-red-600">{error}</div>}

      <div className="bg-white border rounded p-4 mb-6 grid grid-cols-1 md:grid-cols-6 gap-3">
        <input className="border rounded px-2 py-2 md:col-span-2" placeholder="Name" value={form.name} onChange={e=>setForm({...form,name:e.target.value})} />
        <select className="border rounded px-2 py-2" value={form.region} onChange={e=>setForm({...form,region:e.target.value as any})}>
          <option value="hill">Hill</option>
          <option value="city">City</option>
        </select>
        <label className="flex items-center gap-2 md:col-span-1"><input type="checkbox" checked={form.active} onChange={e=>setForm({...form,active:e.target.checked})} /> Active</label>
        <div className="md:col-span-6">
          <label className="block text-sm mb-1">Polygon (GeoJSON)</label>
          <textarea className="border rounded p-2 w-full h-40 font-mono text-sm" value={polygonText} onChange={e=>setPolygonText(e.target.value)} />
        </div>
        <div className="md:col-span-6 flex gap-3">
          <button onClick={onSave} className="bg-emerald-600 text-white px-4 py-2 rounded">{editingId ? 'Update' : 'Create'}</button>
          {editingId && <button onClick={()=>{setEditingId(null); setForm(empty); setPolygonText(JSON.stringify(empty.polygon, null, 2));}} className="px-4 py-2 rounded border">Cancel</button>}
        </div>
      </div>

      <div className="bg-white border rounded">
        <table className="w-full">
          <thead>
            <tr className="text-left border-b">
              <th className="p-3">Name</th>
              <th className="p-3">Region</th>
              <th className="p-3">Active</th>
              <th className="p-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {list.map(z => (
              <tr key={z._id} className="border-b">
                <td className="p-3">{z.name}</td>
                <td className="p-3 capitalize">{z.region}</td>
                <td className="p-3">{z.active ? 'Yes' : 'No'}</td>
                <td className="p-3 flex gap-2">
                  <button onClick={()=>onEdit(z)} className="px-3 py-1 rounded border">Edit</button>
                  <button onClick={()=>onDelete(z._id)} className="px-3 py-1 rounded border text-red-600">Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Zones;