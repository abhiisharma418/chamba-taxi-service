import React, { useState, useEffect } from 'react';
import { api } from '../lib/api';

interface EmergencyIncident {
  _id: string;
  incidentId: string;
  userId: any;
  userType: 'customer' | 'driver';
  rideId?: string;
  incidentType: 'medical' | 'accident' | 'harassment' | 'theft' | 'other' | 'panic' | 'vehicle_breakdown';
  severity: 'low' | 'medium' | 'high' | 'critical';
  location: {
    latitude: number;
    longitude: number;
    address?: string;
    landmark?: string;
  };
  description?: string;
  status: 'active' | 'resolved' | 'false_alarm' | 'escalated';
  responseTeam?: {
    assignedOperator?: string;
    responseTime?: string;
    notes?: string;
  };
  contactsNotified: Array<{
    contactId: string;
    contactName: string;
    contactPhone: string;
    notificationTime: string;
    notificationMethod: 'sms' | 'call' | 'app';
    deliveryStatus: 'pending' | 'sent' | 'delivered' | 'failed';
  }>;
  emergencyServices: {
    policeNotified: boolean;
    ambulanceNotified: boolean;
    fireServiceNotified: boolean;
    notificationTime?: string;
    referenceNumber?: string;
  };
  timeline: Array<{
    timestamp: string;
    action: string;
    performedBy: string;
    performedByModel: 'User' | 'AdminUser' | 'System';
    details: string;
  }>;
  createdAt: string;
  updatedAt: string;
}

interface EmergencyStats {
  totalIncidents: number;
  avgResponseTime: number;
  incidentsByType: Record<string, number>;
  incidentsBySeverity: Record<string, number>;
  incidentsByStatus: Record<string, number>;
  timeframe: string;
}

const EmergencyManagement: React.FC = () => {
  const [incidents, setIncidents] = useState<EmergencyIncident[]>([]);
  const [selectedIncident, setSelectedIncident] = useState<EmergencyIncident | null>(null);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<EmergencyStats | null>(null);
  const [filter, setFilter] = useState('all');
  const [timeframe, setTimeframe] = useState('30d');
  const [updating, setUpdating] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, [filter, timeframe]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [incidentsResponse, statsResponse] = await Promise.all([
        api.get(`/emergency/admin/incidents?status=${filter === 'all' ? '' : filter}`),
        api.get(`/emergency/stats?timeframe=${timeframe}`)
      ]);

      setIncidents(incidentsResponse.data.data);
      setStats(statsResponse.data.data);
    } catch (error) {
      console.error('Failed to load emergency data:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateIncidentStatus = async (incidentId: string, status: string, resolution?: string, notes?: string) => {
    setUpdating(incidentId);
    try {
      await api.patch(`/emergency/incident/${incidentId}/status`, {
        status,
        resolution,
        notes
      });

      await loadData();
      
      if (selectedIncident && selectedIncident.incidentId === incidentId) {
        const updated = incidents.find(i => i.incidentId === incidentId);
        if (updated) setSelectedIncident(updated);
      }
      
      alert('Incident status updated successfully');
    } catch (error) {
      console.error('Failed to update incident:', error);
      alert('Failed to update incident status');
    } finally {
      setUpdating(null);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-red-500 text-white';
      case 'resolved': return 'bg-green-500 text-white';
      case 'escalated': return 'bg-orange-500 text-white';
      case 'false_alarm': return 'bg-gray-500 text-white';
      default: return 'bg-gray-500 text-white';
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'text-red-500 bg-red-100';
      case 'high': return 'text-orange-500 bg-orange-100';
      case 'medium': return 'text-yellow-500 bg-yellow-100';
      case 'low': return 'text-green-500 bg-green-100';
      default: return 'text-gray-500 bg-gray-100';
    }
  };

  const getIncidentTypeIcon = (type: string) => {
    switch (type) {
      case 'medical': return '🏥';
      case 'accident': return '🚗';
      case 'harassment': return '⚠️';
      case 'theft': return '👿';
      case 'panic': return '🚨';
      case 'vehicle_breakdown': return '🔧';
      default: return '❓';
    }
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  if (selectedIncident) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 p-6">
        <div className="max-w-6xl mx-auto">
          <div className="bg-white bg-opacity-10 backdrop-blur-lg rounded-3xl p-8 text-white">
            <div className="flex justify-between items-center mb-8">
              <button
                onClick={() => setSelectedIncident(null)}
                className="px-4 py-2 bg-white bg-opacity-20 rounded-lg hover:bg-opacity-30 transition-colors"
              >
                ← Back to List
              </button>
              <h1 className="text-2xl font-bold">Emergency Incident Details</h1>
              <div></div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Incident Overview */}
              <div className="lg:col-span-2 space-y-6">
                <div className="bg-white bg-opacity-10 rounded-xl p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h2 className="text-xl font-bold flex items-center">
                        {getIncidentTypeIcon(selectedIncident.incidentType)} {selectedIncident.incidentId}
                      </h2>
                      <p className="text-gray-300">
                        {formatDateTime(selectedIncident.createdAt)}
                      </p>
                    </div>
                    <div className="flex space-x-2">
                      <span className={`px-3 py-1 rounded-full text-sm font-semibold ${getStatusColor(selectedIncident.status)}`}>
                        {selectedIncident.status.replace('_', ' ').toUpperCase()}
                      </span>
                      <span className={`px-3 py-1 rounded-full text-sm font-semibold ${getSeverityColor(selectedIncident.severity)}`}>
                        {selectedIncident.severity.toUpperCase()}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <h3 className="font-semibold mb-2">User Information</h3>
                      <p><strong>Name:</strong> {selectedIncident.userId?.name}</p>
                      <p><strong>Phone:</strong> {selectedIncident.userId?.phoneNumber}</p>
                      <p><strong>Type:</strong> {selectedIncident.userType}</p>
                      {selectedIncident.rideId && (
                        <p><strong>Ride ID:</strong> {selectedIncident.rideId}</p>
                      )}
                    </div>
                    <div>
                      <h3 className="font-semibold mb-2">Location</h3>
                      <p><strong>Address:</strong> {selectedIncident.location.address || 'Not available'}</p>
                      <p><strong>Coordinates:</strong> {selectedIncident.location.latitude.toFixed(6)}, {selectedIncident.location.longitude.toFixed(6)}</p>
                      {selectedIncident.location.landmark && (
                        <p><strong>Landmark:</strong> {selectedIncident.location.landmark}</p>
                      )}
                    </div>
                  </div>

                  {selectedIncident.description && (
                    <div className="mt-4">
                      <h3 className="font-semibold mb-2">Description</h3>
                      <p className="text-gray-300">{selectedIncident.description}</p>
                    </div>
                  )}
                </div>

                {/* Emergency Services */}
                <div className="bg-white bg-opacity-10 rounded-xl p-6">
                  <h3 className="text-lg font-semibold mb-4">Emergency Services</h3>
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div className="text-center">
                      <p className="font-semibold">Police</p>
                      <p className={selectedIncident.emergencyServices.policeNotified ? 'text-green-400' : 'text-gray-400'}>
                        {selectedIncident.emergencyServices.policeNotified ? 'Notified' : 'Not Notified'}
                      </p>
                    </div>
                    <div className="text-center">
                      <p className="font-semibold">Ambulance</p>
                      <p className={selectedIncident.emergencyServices.ambulanceNotified ? 'text-green-400' : 'text-gray-400'}>
                        {selectedIncident.emergencyServices.ambulanceNotified ? 'Notified' : 'Not Notified'}
                      </p>
                    </div>
                    <div className="text-center">
                      <p className="font-semibold">Fire Service</p>
                      <p className={selectedIncident.emergencyServices.fireServiceNotified ? 'text-green-400' : 'text-gray-400'}>
                        {selectedIncident.emergencyServices.fireServiceNotified ? 'Notified' : 'Not Notified'}
                      </p>
                    </div>
                  </div>
                  {selectedIncident.emergencyServices.referenceNumber && (
                    <p className="mt-2 text-sm text-gray-300">
                      Reference: {selectedIncident.emergencyServices.referenceNumber}
                    </p>
                  )}
                </div>

                {/* Contacts Notified */}
                {selectedIncident.contactsNotified?.length > 0 && (
                  <div className="bg-white bg-opacity-10 rounded-xl p-6">
                    <h3 className="text-lg font-semibold mb-4">Contacts Notified</h3>
                    <div className="space-y-3">
                      {selectedIncident.contactsNotified.map((contact, index) => (
                        <div key={index} className="bg-white bg-opacity-10 rounded-lg p-4">
                          <div className="flex justify-between items-start">
                            <div>
                              <p className="font-semibold">{contact.contactName}</p>
                              <p className="text-sm text-gray-300">{contact.contactPhone}</p>
                              <p className="text-sm">
                                Method: {contact.notificationMethod} • Status: {contact.deliveryStatus}
                              </p>
                            </div>
                            <p className="text-xs text-gray-400">
                              {formatDateTime(contact.notificationTime)}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Timeline */}
                <div className="bg-white bg-opacity-10 rounded-xl p-6">
                  <h3 className="text-lg font-semibold mb-4">Timeline</h3>
                  <div className="space-y-3">
                    {selectedIncident.timeline
                      ?.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
                      .map((entry, index) => (
                        <div key={index} className="bg-white bg-opacity-10 rounded-lg p-4">
                          <div className="flex justify-between items-start">
                            <div>
                              <p className="font-semibold">{entry.action}</p>
                              {entry.details && (
                                <p className="text-sm text-gray-300 mt-1">{entry.details}</p>
                              )}
                            </div>
                            <p className="text-xs text-gray-400">
                              {formatDateTime(entry.timestamp)}
                            </p>
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              </div>

              {/* Actions Panel */}
              <div className="space-y-6">
                <div className="bg-white bg-opacity-10 rounded-xl p-6">
                  <h3 className="text-lg font-semibold mb-4">Actions</h3>
                  
                  {selectedIncident.status === 'active' && (
                    <div className="space-y-3">
                      <button
                        onClick={() => {
                          const resolution = prompt('Enter resolution notes:');
                          if (resolution) {
                            updateIncidentStatus(selectedIncident.incidentId, 'resolved', resolution);
                          }
                        }}
                        disabled={updating === selectedIncident.incidentId}
                        className="w-full px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors disabled:opacity-50"
                      >
                        Mark as Resolved
                      </button>
                      
                      <button
                        onClick={() => {
                          const notes = prompt('Enter escalation notes:');
                          if (notes) {
                            updateIncidentStatus(selectedIncident.incidentId, 'escalated', undefined, notes);
                          }
                        }}
                        disabled={updating === selectedIncident.incidentId}
                        className="w-full px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg transition-colors disabled:opacity-50"
                      >
                        Escalate
                      </button>
                      
                      <button
                        onClick={() => {
                          const confirmed = window.confirm('Mark this incident as a false alarm?');
                          if (confirmed) {
                            updateIncidentStatus(selectedIncident.incidentId, 'false_alarm', 'Marked as false alarm by admin');
                          }
                        }}
                        disabled={updating === selectedIncident.incidentId}
                        className="w-full px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors disabled:opacity-50"
                      >
                        False Alarm
                      </button>
                    </div>
                  )}

                  {selectedIncident.status !== 'active' && (
                    <div className="text-center text-gray-400">
                      <p>Incident Status: {selectedIncident.status.replace('_', ' ').toUpperCase()}</p>
                      {selectedIncident.status === 'resolved' && (
                        <button
                          onClick={() => {
                            const confirmed = window.confirm('Reopen this incident?');
                            if (confirmed) {
                              updateIncidentStatus(selectedIncident.incidentId, 'active', 'Incident reopened by admin');
                            }
                          }}
                          disabled={updating === selectedIncident.incidentId}
                          className="mt-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-50"
                        >
                          Reopen Incident
                        </button>
                      )}
                    </div>
                  )}
                </div>

                {/* Quick Info */}
                <div className="bg-white bg-opacity-10 rounded-xl p-6">
                  <h3 className="text-lg font-semibold mb-4">Quick Info</h3>
                  <div className="space-y-2 text-sm">
                    <p><strong>Incident Type:</strong> {selectedIncident.incidentType.replace('_', ' ')}</p>
                    <p><strong>Severity:</strong> {selectedIncident.severity}</p>
                    <p><strong>User Type:</strong> {selectedIncident.userType}</p>
                    <p><strong>Created:</strong> {formatDateTime(selectedIncident.createdAt)}</p>
                    <p><strong>Last Updated:</strong> {formatDateTime(selectedIncident.updatedAt)}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="bg-white bg-opacity-10 backdrop-blur-lg rounded-3xl p-8 text-white">
          <h1 className="text-3xl font-bold mb-8 bg-gradient-to-r from-white to-blue-200 bg-clip-text text-transparent">
            Emergency Management
          </h1>

          {/* Statistics */}
          {stats && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              <div className="bg-white bg-opacity-10 rounded-xl p-6 text-center">
                <div className="text-3xl font-bold text-red-400">{stats.totalIncidents}</div>
                <div className="text-sm text-gray-300">Total Incidents</div>
              </div>
              <div className="bg-white bg-opacity-10 rounded-xl p-6 text-center">
                <div className="text-3xl font-bold text-green-400">
                  {stats.incidentsByStatus?.resolved || 0}
                </div>
                <div className="text-sm text-gray-300">Resolved</div>
              </div>
              <div className="bg-white bg-opacity-10 rounded-xl p-6 text-center">
                <div className="text-3xl font-bold text-orange-400">
                  {stats.incidentsByStatus?.active || 0}
                </div>
                <div className="text-sm text-gray-300">Active</div>
              </div>
              <div className="bg-white bg-opacity-10 rounded-xl p-6 text-center">
                <div className="text-3xl font-bold text-purple-400">
                  {Math.round(stats.avgResponseTime / 1000 / 60) || 0}m
                </div>
                <div className="text-sm text-gray-300">Avg Response</div>
              </div>
            </div>
          )}

          {/* Filters */}
          <div className="flex justify-between items-center mb-6">
            <div className="flex space-x-2">
              {['all', 'active', 'resolved', 'escalated', 'false_alarm'].map((status) => (
                <button
                  key={status}
                  onClick={() => setFilter(status)}
                  className={`px-4 py-2 rounded-lg font-semibold transition-all duration-300 ${
                    filter === status
                      ? 'bg-white bg-opacity-20 text-white shadow-lg'
                      : 'text-gray-300 hover:text-white hover:bg-white hover:bg-opacity-10'
                  }`}
                >
                  {status === 'all' ? 'All' : status.replace('_', ' ').toUpperCase()}
                </button>
              ))}
            </div>

            <select
              value={timeframe}
              onChange={(e) => setTimeframe(e.target.value)}
              className="px-4 py-2 bg-white bg-opacity-10 border border-white border-opacity-20 rounded-lg text-white focus:outline-none focus:border-blue-400"
            >
              <option value="7d">Last 7 days</option>
              <option value="30d">Last 30 days</option>
              <option value="90d">Last 90 days</option>
            </select>
          </div>

          {/* Incidents List */}
          {loading ? (
            <div className="space-y-4">
              {[...Array(5)].map((_, index) => (
                <div key={index} className="bg-white bg-opacity-10 rounded-xl p-6 animate-pulse">
                  <div className="flex justify-between items-start">
                    <div className="space-y-2">
                      <div className="h-6 bg-white bg-opacity-20 rounded w-48"></div>
                      <div className="h-4 bg-white bg-opacity-20 rounded w-32"></div>
                    </div>
                    <div className="h-6 bg-white bg-opacity-20 rounded w-20"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : incidents.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">🚨</div>
              <h3 className="text-xl font-semibold mb-2">No Emergency Incidents</h3>
              <p className="text-gray-400">
                {filter === 'all' 
                  ? "No emergency incidents found." 
                  : `No ${filter.replace('_', ' ')} incidents found.`}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {incidents.map((incident) => (
                <div
                  key={incident._id}
                  className="bg-white bg-opacity-10 rounded-xl p-6 cursor-pointer hover:bg-opacity-20 transition-all duration-300"
                  onClick={() => setSelectedIncident(incident)}
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <span className="text-2xl">{getIncidentTypeIcon(incident.incidentType)}</span>
                        <div>
                          <h3 className="text-lg font-semibold">{incident.incidentId}</h3>
                          <p className="text-sm text-gray-300">
                            {incident.userId?.name} • {incident.incidentType.replace('_', ' ')} • {formatDateTime(incident.createdAt)}
                          </p>
                        </div>
                      </div>
                      
                      <p className="text-gray-300 mb-2">
                        {incident.description || 'No description provided'}
                      </p>
                      
                      <p className="text-sm text-gray-400">
                        📍 {incident.location.address || `${incident.location.latitude.toFixed(4)}, ${incident.location.longitude.toFixed(4)}`}
                      </p>
                    </div>

                    <div className="flex flex-col items-end space-y-2">
                      <span className={`px-3 py-1 rounded-full text-sm font-semibold ${getStatusColor(incident.status)}`}>
                        {incident.status.replace('_', ' ').toUpperCase()}
                      </span>
                      <span className={`px-3 py-1 rounded-full text-sm font-semibold ${getSeverityColor(incident.severity)}`}>
                        {incident.severity.toUpperCase()}
                      </span>
                    </div>
                  </div>

                  {incident.contactsNotified?.length > 0 && (
                    <div className="mt-4 flex items-center text-sm text-gray-400">
                      <span className="mr-2">👥</span>
                      {incident.contactsNotified.length} contact{incident.contactsNotified.length !== 1 ? 's' : ''} notified
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default EmergencyManagement;
