import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import Navigation from '../../components/Navigation';
import { 
  Car, Plus, Edit3, Trash2, Upload, Check, AlertCircle,
  Fuel, Settings, Calendar, FileText, Shield, MapPin,
  Wrench, Clock, DollarSign, Star, Bell
} from 'lucide-react';

interface Vehicle {
  id: string;
  make: string;
  model: string;
  year: number;
  color: string;
  licensePlate: string;
  vehicleType: 'hatchback' | 'sedan' | 'suv' | 'auto';
  fuelType: 'petrol' | 'diesel' | 'cng' | 'electric';
  isActive: boolean;
  status: 'active' | 'maintenance' | 'inactive';
  documents: {
    registration: { url: string; expiry: string; verified: boolean };
    insurance: { url: string; expiry: string; verified: boolean };
    pollution: { url: string; expiry: string; verified: boolean };
    fitness: { url: string; expiry: string; verified: boolean };
    permit: { url: string; expiry: string; verified: boolean };
  };
  maintenance: {
    lastService: string;
    nextService: string;
    mileage: number;
    serviceHistory: ServiceRecord[];
  };
  inspection: {
    lastInspection: string;
    nextInspection: string;
    score: number;
    issues: string[];
  };
}

interface ServiceRecord {
  id: string;
  date: string;
  type: 'routine' | 'repair' | 'emergency';
  description: string;
  cost: number;
  mileage: number;
  garage: string;
}

const VehicleManagement: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'vehicles' | 'documents' | 'maintenance' | 'inspection'>('vehicles');
  const [selectedVehicle, setSelectedVehicle] = useState<string>('');
  const [showAddVehicle, setShowAddVehicle] = useState(false);
  const [uploading, setUploading] = useState<string | null>(null);

  // Mock vehicle data - in real app, this would come from API
  const [vehicles, setVehicles] = useState<Vehicle[]>([
    {
      id: '1',
      make: 'Maruti Suzuki',
      model: 'Swift',
      year: 2020,
      color: 'White',
      licensePlate: 'DL-1CA-1234',
      vehicleType: 'hatchback',
      fuelType: 'petrol',
      isActive: true,
      status: 'active',
      documents: {
        registration: { url: '', expiry: '2025-06-15', verified: true },
        insurance: { url: '', expiry: '2024-12-31', verified: true },
        pollution: { url: '', expiry: '2024-06-15', verified: true },
        fitness: { url: '', expiry: '2029-06-15', verified: true },
        permit: { url: '', expiry: '2025-03-20', verified: true }
      },
      maintenance: {
        lastService: '2024-01-10',
        nextService: '2024-04-10',
        mileage: 45000,
        serviceHistory: [
          {
            id: '1',
            date: '2024-01-10',
            type: 'routine',
            description: 'Regular service - Oil change, filter replacement',
            cost: 3500,
            mileage: 45000,
            garage: 'Maruti Service Center'
          },
          {
            id: '2',
            date: '2023-10-15',
            type: 'repair',
            description: 'Brake pad replacement',
            cost: 2800,
            mileage: 42000,
            garage: 'Maruti Service Center'
          }
        ]
      },
      inspection: {
        lastInspection: '2024-01-05',
        nextInspection: '2024-04-05',
        score: 92,
        issues: []
      }
    },
    {
      id: '2',
      make: 'Honda',
      model: 'City',
      year: 2019,
      color: 'Silver',
      licensePlate: 'DL-2CB-5678',
      vehicleType: 'sedan',
      fuelType: 'petrol',
      isActive: false,
      status: 'maintenance',
      documents: {
        registration: { url: '', expiry: '2024-08-20', verified: true },
        insurance: { url: '', expiry: '2024-11-15', verified: false },
        pollution: { url: '', expiry: '2024-02-20', verified: false },
        fitness: { url: '', expiry: '2028-08-20', verified: true },
        permit: { url: '', expiry: '2024-12-10', verified: true }
      },
      maintenance: {
        lastService: '2023-12-05',
        nextService: '2024-03-05',
        mileage: 52000,
        serviceHistory: [
          {
            id: '3',
            date: '2023-12-05',
            type: 'routine',
            description: 'Complete service check',
            cost: 4200,
            mileage: 52000,
            garage: 'Honda Service Center'
          }
        ]
      },
      inspection: {
        lastInspection: '2023-12-01',
        nextInspection: '2024-03-01',
        score: 85,
        issues: ['AC needs attention', 'Minor paint scratches']
      }
    }
  ]);

  const currentVehicle = vehicles.find(v => v.id === selectedVehicle) || vehicles[0];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'text-green-600 bg-green-100';
      case 'maintenance': return 'text-yellow-600 bg-yellow-100';
      case 'inactive': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getDocumentStatus = (expiry: string, verified: boolean) => {
    const expiryDate = new Date(expiry);
    const today = new Date();
    const daysToExpiry = Math.ceil((expiryDate.getTime() - today.getTime()) / (1000 * 3600 * 24));
    
    if (!verified) return 'text-red-600 bg-red-100';
    if (daysToExpiry < 30) return 'text-yellow-600 bg-yellow-100';
    return 'text-green-600 bg-green-100';
  };

  const DocumentCard: React.FC<{ 
    title: string; 
    doc: { url: string; expiry: string; verified: boolean };
    type: string;
  }> = ({ title, doc, type }) => {
    const expiryDate = new Date(doc.expiry);
    const today = new Date();
    const daysToExpiry = Math.ceil((expiryDate.getTime() - today.getTime()) / (1000 * 3600 * 24));
    
    return (
      <div className="border border-gray-200 rounded-lg p-4">
        <div className="flex items-center justify-between mb-3">
          <h4 className="font-medium text-gray-900">{title}</h4>
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getDocumentStatus(doc.expiry, doc.verified)}`}>
            {doc.verified ? (daysToExpiry < 30 ? 'Expiring Soon' : 'Valid') : 'Not Verified'}
          </span>
        </div>
        
        <div className="text-sm text-gray-600 mb-3">
          <div>Expires: {expiryDate.toLocaleDateString()}</div>
          {daysToExpiry < 30 && daysToExpiry > 0 && (
            <div className="text-yellow-600">{daysToExpiry} days remaining</div>
          )}
          {daysToExpiry <= 0 && (
            <div className="text-red-600">Expired</div>
          )}
        </div>

        <div className="flex space-x-2">
          <input
            type="file"
            accept="image/*,.pdf"
            onChange={(e) => {
              // Handle file upload
              console.log('Upload', type, e.target.files?.[0]);
            }}
            className="hidden"
            id={`upload-${type}`}
          />
          
          <label
            htmlFor={`upload-${type}`}
            className="flex-1 flex items-center justify-center px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
          >
            <Upload className="h-4 w-4 mr-2" />
            <span className="text-sm">{doc.url ? 'Replace' : 'Upload'}</span>
          </label>
          
          {doc.url && (
            <button className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
              <FileText className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/50">
      <Navigation />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-gray-100 p-8 mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent">
                Vehicle Management
              </h1>
              <p className="text-slate-600 text-lg">Manage your vehicles and documents</p>
            </div>

            <button
              onClick={() => setShowAddVehicle(true)}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus className="h-4 w-4" />
              <span>Add Vehicle</span>
            </button>
          </div>

          {/* Vehicle Selector */}
          {vehicles.length > 0 && (
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">Select Vehicle</label>
              <select
                value={selectedVehicle || vehicles[0].id}
                onChange={(e) => setSelectedVehicle(e.target.value)}
                className="max-w-xs px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {vehicles.map(vehicle => (
                  <option key={vehicle.id} value={vehicle.id}>
                    {vehicle.make} {vehicle.model} ({vehicle.licensePlate})
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Tabs */}
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8">
              {[
                { id: 'vehicles', label: 'Vehicle Info', icon: Car },
                { id: 'documents', label: 'Documents', icon: FileText },
                { id: 'maintenance', label: 'Maintenance', icon: Wrench },
                { id: 'inspection', label: 'Inspection', icon: Shield }
              ].map(({ id, label, icon: Icon }) => (
                <button
                  key={id}
                  onClick={() => setActiveTab(id as any)}
                  className={`
                    flex items-center space-x-2 pb-4 border-b-2 transition-colors
                    ${activeTab === id 
                      ? 'border-blue-600 text-blue-600' 
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }
                  `}
                >
                  <Icon className="h-5 w-5" />
                  <span className="font-medium">{label}</span>
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* Tab Content */}
        {currentVehicle && (
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-gray-100 p-8">
            {activeTab === 'vehicles' && (
              <div className="space-y-6">
                {/* Vehicle Summary */}
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center">
                        <Car className="h-8 w-8 text-white" />
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-gray-900">
                          {currentVehicle.make} {currentVehicle.model}
                        </h3>
                        <p className="text-gray-600">{currentVehicle.licensePlate}</p>
                        <div className="flex items-center space-x-4 mt-2">
                          <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(currentVehicle.status)}`}>
                            {currentVehicle.status.charAt(0).toUpperCase() + currentVehicle.status.slice(1)}
                          </span>
                          <span className="text-sm text-gray-600">
                            {currentVehicle.year} • {currentVehicle.color} • {currentVehicle.fuelType.toUpperCase()}
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex space-x-2">
                      <button className="flex items-center space-x-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors">
                        <Edit3 className="h-4 w-4" />
                        <span>Edit</span>
                      </button>
                      
                      <button className="flex items-center space-x-2 px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                        <Trash2 className="h-4 w-4" />
                        <span>Delete</span>
                      </button>
                    </div>
                  </div>
                </div>

                {/* Vehicle Details */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-4">Vehicle Details</h4>
                    <div className="space-y-3 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Make & Model:</span>
                        <span className="font-medium">{currentVehicle.make} {currentVehicle.model}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Year:</span>
                        <span className="font-medium">{currentVehicle.year}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Color:</span>
                        <span className="font-medium">{currentVehicle.color}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">License Plate:</span>
                        <span className="font-medium">{currentVehicle.licensePlate}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Vehicle Type:</span>
                        <span className="font-medium capitalize">{currentVehicle.vehicleType}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Fuel Type:</span>
                        <span className="font-medium capitalize">{currentVehicle.fuelType}</span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-semibold text-gray-900 mb-4">Current Status</h4>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center space-x-3">
                          <Car className="h-5 w-5 text-blue-600" />
                          <span className="text-sm font-medium">Available for rides</span>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={currentVehicle.isActive}
                            onChange={() => {
                              // Toggle vehicle active status
                            }}
                            className="sr-only peer"
                          />
                          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                        </label>
                      </div>

                      <div className="text-sm text-gray-600">
                        <div className="flex items-center space-x-2 mb-2">
                          <MapPin className="h-4 w-4" />
                          <span>Current mileage: {currentVehicle.maintenance.mileage.toLocaleString()} km</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Clock className="h-4 w-4" />
                          <span>Last service: {new Date(currentVehicle.maintenance.lastService).toLocaleDateString()}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Quick Actions */}
                <div>
                  <h4 className="font-semibold text-gray-900 mb-4">Quick Actions</h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <button className="flex flex-col items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                      <Fuel className="h-6 w-6 text-green-600 mb-2" />
                      <span className="text-sm font-medium">Fuel Record</span>
                    </button>
                    
                    <button className="flex flex-col items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                      <Wrench className="h-6 w-6 text-blue-600 mb-2" />
                      <span className="text-sm font-medium">Schedule Service</span>
                    </button>
                    
                    <button className="flex flex-col items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                      <Shield className="h-6 w-6 text-purple-600 mb-2" />
                      <span className="text-sm font-medium">Safety Check</span>
                    </button>
                    
                    <button className="flex flex-col items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                      <FileText className="h-6 w-6 text-orange-600 mb-2" />
                      <span className="text-sm font-medium">View Reports</span>
                    </button>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'documents' && (
              <div className="space-y-6">
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                  <div className="flex items-center space-x-2">
                    <AlertCircle className="h-5 w-5 text-amber-600" />
                    <p className="text-amber-800 font-medium">Document Status</p>
                  </div>
                  <p className="text-amber-700 text-sm mt-1">
                    Keep all vehicle documents updated to avoid ride disruptions. Documents expiring in 30 days are highlighted.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <DocumentCard
                    title="Vehicle Registration"
                    doc={currentVehicle.documents.registration}
                    type="registration"
                  />
                  
                  <DocumentCard
                    title="Insurance Certificate"
                    doc={currentVehicle.documents.insurance}
                    type="insurance"
                  />
                  
                  <DocumentCard
                    title="Pollution Certificate"
                    doc={currentVehicle.documents.pollution}
                    type="pollution"
                  />
                  
                  <DocumentCard
                    title="Fitness Certificate"
                    doc={currentVehicle.documents.fitness}
                    type="fitness"
                  />
                  
                  <DocumentCard
                    title="Commercial Permit"
                    doc={currentVehicle.documents.permit}
                    type="permit"
                  />
                </div>
              </div>
            )}

            {activeTab === 'maintenance' && (
              <div className="space-y-6">
                {/* Maintenance Overview */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="bg-blue-50 rounded-lg p-4">
                    <div className="flex items-center space-x-3 mb-3">
                      <Wrench className="h-6 w-6 text-blue-600" />
                      <span className="font-semibold text-gray-900">Last Service</span>
                    </div>
                    <div className="text-2xl font-bold text-blue-600">
                      {new Date(currentVehicle.maintenance.lastService).toLocaleDateString()}
                    </div>
                    <div className="text-sm text-gray-600">
                      At {currentVehicle.maintenance.mileage.toLocaleString()} km
                    </div>
                  </div>

                  <div className="bg-green-50 rounded-lg p-4">
                    <div className="flex items-center space-x-3 mb-3">
                      <Calendar className="h-6 w-6 text-green-600" />
                      <span className="font-semibold text-gray-900">Next Service</span>
                    </div>
                    <div className="text-2xl font-bold text-green-600">
                      {new Date(currentVehicle.maintenance.nextService).toLocaleDateString()}
                    </div>
                    <div className="text-sm text-gray-600">
                      In {Math.ceil((new Date(currentVehicle.maintenance.nextService).getTime() - new Date().getTime()) / (1000 * 3600 * 24))} days
                    </div>
                  </div>

                  <div className="bg-purple-50 rounded-lg p-4">
                    <div className="flex items-center space-x-3 mb-3">
                      <DollarSign className="h-6 w-6 text-purple-600" />
                      <span className="font-semibold text-gray-900">Total Cost</span>
                    </div>
                    <div className="text-2xl font-bold text-purple-600">
                      ₹{currentVehicle.maintenance.serviceHistory.reduce((sum, record) => sum + record.cost, 0).toLocaleString()}
                    </div>
                    <div className="text-sm text-gray-600">
                      {currentVehicle.maintenance.serviceHistory.length} services
                    </div>
                  </div>
                </div>

                {/* Service History */}
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="font-semibold text-gray-900">Service History</h4>
                    <button className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                      <Plus className="h-4 w-4" />
                      <span>Add Service Record</span>
                    </button>
                  </div>

                  <div className="space-y-4">
                    {currentVehicle.maintenance.serviceHistory.map(record => (
                      <div key={record.id} className="border border-gray-200 rounded-lg p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center space-x-3 mb-2">
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                record.type === 'routine' ? 'text-blue-600 bg-blue-100' :
                                record.type === 'repair' ? 'text-yellow-600 bg-yellow-100' :
                                'text-red-600 bg-red-100'
                              }`}>
                                {record.type.charAt(0).toUpperCase() + record.type.slice(1)}
                              </span>
                              <span className="font-medium text-gray-900">{record.garage}</span>
                            </div>
                            
                            <p className="text-gray-700 mb-2">{record.description}</p>
                            
                            <div className="flex items-center space-x-4 text-sm text-gray-600">
                              <span>{new Date(record.date).toLocaleDateString()}</span>
                              <span>{record.mileage.toLocaleString()} km</span>
                            </div>
                          </div>
                          
                          <div className="text-right">
                            <div className="text-lg font-bold text-gray-900">₹{record.cost.toLocaleString()}</div>
                            <button className="text-sm text-blue-600 hover:text-blue-700">View Details</button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'inspection' && (
              <div className="space-y-6">
                {/* Inspection Overview */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="bg-green-50 rounded-lg p-4">
                    <div className="flex items-center space-x-3 mb-3">
                      <Shield className="h-6 w-6 text-green-600" />
                      <span className="font-semibold text-gray-900">Safety Score</span>
                    </div>
                    <div className="text-3xl font-bold text-green-600">
                      {currentVehicle.inspection.score}/100
                    </div>
                    <div className="text-sm text-gray-600">Last inspection</div>
                  </div>

                  <div className="bg-blue-50 rounded-lg p-4">
                    <div className="flex items-center space-x-3 mb-3">
                      <Calendar className="h-6 w-6 text-blue-600" />
                      <span className="font-semibold text-gray-900">Last Inspection</span>
                    </div>
                    <div className="text-lg font-bold text-blue-600">
                      {new Date(currentVehicle.inspection.lastInspection).toLocaleDateString()}
                    </div>
                  </div>

                  <div className="bg-purple-50 rounded-lg p-4">
                    <div className="flex items-center space-x-3 mb-3">
                      <Clock className="h-6 w-6 text-purple-600" />
                      <span className="font-semibold text-gray-900">Next Inspection</span>
                    </div>
                    <div className="text-lg font-bold text-purple-600">
                      {new Date(currentVehicle.inspection.nextInspection).toLocaleDateString()}
                    </div>
                  </div>
                </div>

                {/* Issues */}
                {currentVehicle.inspection.issues.length > 0 ? (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <div className="flex items-center space-x-2 mb-3">
                      <AlertCircle className="h-5 w-5 text-yellow-600" />
                      <h4 className="font-semibold text-yellow-800">Issues Identified</h4>
                    </div>
                    <ul className="space-y-2">
                      {currentVehicle.inspection.issues.map((issue, index) => (
                        <li key={index} className="flex items-start space-x-2">
                          <div className="w-2 h-2 bg-yellow-500 rounded-full mt-2"></div>
                          <span className="text-yellow-700">{issue}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
                    <Check className="h-8 w-8 text-green-600 mx-auto mb-2" />
                    <p className="text-green-800 font-medium">No issues found</p>
                    <p className="text-green-700 text-sm">Your vehicle is in excellent condition</p>
                  </div>
                )}

                {/* Schedule Inspection */}
                <div className="text-center">
                  <button className="flex items-center space-x-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors mx-auto">
                    <Calendar className="h-5 w-5" />
                    <span>Schedule Inspection</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default VehicleManagement;
