import React from 'react';
import { Users, Car, DollarSign, TrendingUp } from 'lucide-react';

const Dashboard: React.FC = () => {
  return (
    <div className="min-h-screen p-6">
      <h1 className="text-2xl font-bold mb-6">Admin Dashboard</h1>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {[{title:'Drivers', icon: Users}, {title:'Customers', icon: Users}, {title:'Bookings', icon: Car}, {title:'Revenue', icon: DollarSign}].map((card, idx) => (
          <div key={idx} className="bg-white rounded-lg shadow p-6 border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">{card.title}</p>
                <p className="text-2xl font-semibold">0</p>
              </div>
              <card.icon className="h-8 w-8 text-blue-600" />
            </div>
            <div className="mt-4 flex items-center text-green-600 text-sm">
              <TrendingUp className="h-4 w-4 mr-1" />
              <span>+0%</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Dashboard;