import React, { useEffect, useState } from 'react';
import { Users, Car, DollarSign, TrendingUp } from 'lucide-react';
import { AdminAPI } from '../../lib/api';

const AdminDashboard: React.FC = () => {
  const [stats, setStats] = useState<{ users: number; rides: number; vehicles: number } | null>(null);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    AdminAPI.stats().then(res => setStats(res.data)).catch(e => setError(e.message));
  }, []);

  const cards = [
    { title: 'Users', value: stats?.users ?? '—', icon: Users, color: 'bg-blue-100 text-blue-600', change: '+12%' },
    { title: 'Vehicles', value: stats?.vehicles ?? '—', icon: Car, color: 'bg-green-100 text-green-600', change: '+18%' },
    { title: 'Rides', value: stats?.rides ?? '—', icon: Car, color: 'bg-purple-100 text-purple-600', change: '+25%' },
    { title: 'Revenue', value: '₹—', icon: DollarSign, color: 'bg-emerald-100 text-emerald-600', change: '+15%' },
  ];

  return (
    <div className="min-h-screen p-6">
      <h1 className="text-2xl font-bold mb-6">Admin Dashboard</h1>
      {error && <div className="mb-4 text-red-600">{error}</div>}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {cards.map((card, idx) => (
          <div key={idx} className="bg-white rounded-lg shadow p-6 border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">{card.title}</p>
                <p className="text-2xl font-semibold">{card.value}</p>
              </div>
              <card.icon className="h-8 w-8 text-blue-600" />
            </div>
            <div className="mt-4 flex items-center text-green-600 text-sm">
              <TrendingUp className="h-4 w-4 mr-1" />
              <span>{card.change}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AdminDashboard;