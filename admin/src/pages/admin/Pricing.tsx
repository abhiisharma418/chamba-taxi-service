import React, { useEffect, useState } from 'react';
import { PricingAPI, setToken, getToken } from '../../lib/api';

interface PricingConfig {
  _id?: string;
  region: 'hill' | 'city';
  vehicleType: 'bike' | 'car';
  baseFare: number;
  perKm: number;
  perMinute: number;
  surgeMultiplier?: number;
  active: boolean;
}

const emptyForm: PricingConfig = {
  region: 'hill',
  vehicleType: 'car',
  baseFare: 50,
  perKm: 25,
  perMinute: 2,
  surgeMultiplier: 1,
  active: true,
};

const Pricing: React.FC = () => {
  const [list, setList] = useState<PricingConfig[]>([]);
  const [form, setForm] = useState<PricingConfig>(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [error, setError] = useState<string>('');
  const [tokenInput, setTokenInput] = useState<string>(getToken() || '');

  const load = async () => {
    try {
      const res = await PricingAPI.list();
      setList(res.data);
    } catch (e: any) {
      setError(e.message);
    }
  };

  useEffect(() => { load(); }, []);

  const onSave = async () => {
    try {
      setError('');
      if (editingId) {
        const res = await PricingAPI.update(editingId, form);
        setList((prev) => prev.map((p) => (p._id === editingId ? res.data : p)));
      } else {
        const res = await PricingAPI.create(form);
        setList((prev) => [res.data, ...prev]);
      }
      setForm(emptyForm);
      setEditingId(null);
    } catch (e: any) {
      setError(e.message);
    }
  };

  const onEdit = (p: PricingConfig) => {
    setEditingId(p._id!);
    setForm({ ...p });
  };

  const onDelete = async (id?: string) => {
    if (!id) return;
    try {
      await PricingAPI.remove(id);
      setList((prev) => prev.filter((p) => p._id !== id));
    } catch (e: any) {
      setError(e.message);
    }
  };

  const saveToken = () => {
    setToken(tokenInput);
  };

  return (
    <div className="min-h-screen p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Pricing Config</h1>
        <div className="flex items-center gap-2">
          <input
            type="text"
            placeholder="Admin JWT token"
            value={tokenInput}
            onChange={(e) => setTokenInput(e.target.value)}
            className="border rounded px-3 py-2 w-96"
          />
          <button onClick={saveToken} className="bg-blue-600 text-white px-4 py-2 rounded">Set Token</button>
        </div>
      </div>

      {error && <div className="mb-4 text-red-600">{error}</div>}

      <div className="bg-white border rounded p-4 mb-6 grid grid-cols-1 md:grid-cols-6 gap-3">
        <select className="border rounded px-2 py-2" value={form.region} onChange={(e) => setForm({ ...form, region: e.target.value as any })}>
          <option value="hill">Hill</option>
          <option value="city">City</option>
        </select>
        <select className="border rounded px-2 py-2" value={form.vehicleType} onChange={(e) => setForm({ ...form, vehicleType: e.target.value as any })}>
          <option value="bike">Bike</option>
          <option value="car">Car</option>
        </select>
        <input className="border rounded px-2 py-2" type="number" placeholder="Base fare" value={form.baseFare} onChange={(e) => setForm({ ...form, baseFare: Number(e.target.value) })} />
        <input className="border rounded px-2 py-2" type="number" placeholder="Per Km" value={form.perKm} onChange={(e) => setForm({ ...form, perKm: Number(e.target.value) })} />
        <input className="border rounded px-2 py-2" type="number" placeholder="Per Minute" value={form.perMinute} onChange={(e) => setForm({ ...form, perMinute: Number(e.target.value) })} />
        <input className="border rounded px-2 py-2" type="number" placeholder="Surge" value={form.surgeMultiplier} onChange={(e) => setForm({ ...form, surgeMultiplier: Number(e.target.value) })} />
        <div className="col-span-full flex items-center gap-3">
          <label className="flex items-center gap-2">
            <input type="checkbox" checked={form.active} onChange={(e) => setForm({ ...form, active: e.target.checked })} /> Active
          </label>
          <button onClick={onSave} className="bg-emerald-600 text-white px-4 py-2 rounded">{editingId ? 'Update' : 'Create'}</button>
          {editingId && (
            <button onClick={() => { setEditingId(null); setForm(emptyForm); }} className="px-4 py-2 rounded border">Cancel</button>
          )}
        </div>
      </div>

      <div className="bg-white border rounded">
        <table className="w-full">
          <thead>
            <tr className="text-left border-b">
              <th className="p-3">Region</th>
              <th className="p-3">Vehicle</th>
              <th className="p-3">Base</th>
              <th className="p-3">PerKm</th>
              <th className="p-3">PerMin</th>
              <th className="p-3">Surge</th>
              <th className="p-3">Active</th>
              <th className="p-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {list.map((p) => (
              <tr key={p._id} className="border-b">
                <td className="p-3 capitalize">{p.region}</td>
                <td className="p-3 capitalize">{p.vehicleType}</td>
                <td className="p-3">₹{p.baseFare}</td>
                <td className="p-3">₹{p.perKm}/km</td>
                <td className="p-3">₹{p.perMinute}/min</td>
                <td className="p-3">×{p.surgeMultiplier ?? 1}</td>
                <td className="p-3">{p.active ? 'Yes' : 'No'}</td>
                <td className="p-3 flex gap-2">
                  <button onClick={() => onEdit(p)} className="px-3 py-1 rounded border">Edit</button>
                  <button onClick={() => onDelete(p._id)} className="px-3 py-1 rounded border text-red-600">Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Pricing;