import React, { useState, useEffect } from 'react';
import { emergencyService, EmergencyIncident } from '../services/emergencyService';
import { useAuth } from '../contexts/AuthContext';

const EmergencyIncidents: React.FC = () => {
  const { user } = useAuth();
  const [incidents, setIncidents] = useState<EmergencyIncident[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedIncident, setSelectedIncident] = useState<EmergencyIncident | null>(null);
  const [filter, setFilter] = useState('all');
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalIncidents: 0,
    hasNext: false,
    hasPrev: false
  });

  useEffect(() => {
    loadIncidents();
  }, [filter, pagination.currentPage]);

  const loadIncidents = async () => {
    setLoading(true);
    try {
      const response = await emergencyService.getUserIncidents({
        page: pagination.currentPage,
        limit: 10,
        status: filter === 'all' ? undefined : filter
      });
      
      setIncidents(response.data.incidents);
      setPagination(response.data.pagination);
    } catch (error) {
      console.error('Failed to load incidents:', error);
    } finally {
      setLoading(false);
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
      case 'critical': return 'text-red-500';
      case 'high': return 'text-orange-500';
      case 'medium': return 'text-yellow-500';
      case 'low': return 'text-green-500';
      default: return 'text-gray-500';
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

  const IncidentDetails = ({ incident }: { incident: EmergencyIncident }) => (
    <div className="bg-white bg-opacity-10 rounded-xl p-6 text-white">
      <div className="flex justify-between items-start mb-6">
        <div>
          <h2 className="text-2xl font-bold flex items-center">
            {getIncidentTypeIcon(incident.incidentType)} {incident.incidentId}
          </h2>
          <p className="text-gray-300">
            {formatDateTime(incident.createdAt)}
          </p>
        </div>
        <div className="flex space-x-2">
          <span className={`px-3 py-1 rounded-full text-sm font-semibold ${getStatusColor(incident.status)}`}>
            {incident.status.replace('_', ' ').toUpperCase()}
          </span>
          <span className={`px-3 py-1 rounded-full text-sm font-semibold bg-white bg-opacity-20 ${getSeverityColor(incident.severity)}`}>
            {incident.severity.toUpperCase()}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <h3 className="text-lg font-semibold mb-3">Incident Details</h3>
          <div className="space-y-2">
            <p><strong>Type:</strong> {incident.incidentType.replace('_', ' ')}</p>
            <p><strong>Description:</strong> {incident.description || 'No description provided'}</p>
            {incident.rideId && (
              <p><strong>Associated Ride:</strong> {incident.rideId}</p>
            )}
          </div>
        </div>

        <div>
          <h3 className="text-lg font-semibold mb-3">Location</h3>
          <div className="space-y-2">
            <p><strong>Address:</strong> {incident.location.address || 'Address not available'}</p>
            <p><strong>Coordinates:</strong> {incident.location.latitude.toFixed(6)}, {incident.location.longitude.toFixed(6)}</p>
            {incident.location.landmark && (
              <p><strong>Landmark:</strong> {incident.location.landmark}</p>
            )}
          </div>
        </div>
      </div>

      {incident.contactsNotified && incident.contactsNotified.length > 0 && (
        <div className="mt-6">
          <h3 className="text-lg font-semibold mb-3">Contacts Notified</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {incident.contactsNotified.map((contact, index) => (
              <div key={index} className="bg-white bg-opacity-10 rounded-lg p-4">
                <p className="font-semibold">{contact.contactName}</p>
                <p className="text-sm text-gray-300">{contact.contactPhone}</p>
                <p className="text-sm">
                  <span className={`inline-block w-2 h-2 rounded-full mr-2 ${
                    contact.deliveryStatus === 'delivered' ? 'bg-green-500' :
                    contact.deliveryStatus === 'sent' ? 'bg-yellow-500' :
                    contact.deliveryStatus === 'failed' ? 'bg-red-500' : 'bg-gray-500'
                  }`}></span>
                  {contact.deliveryStatus} via {contact.notificationMethod}
                </p>
                <p className="text-xs text-gray-400">
                  {formatDateTime(contact.notificationTime)}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {incident.emergencyServices && (
        <div className="mt-6">
          <h3 className="text-lg font-semibold mb-3">Emergency Services</h3>
          <div className="bg-white bg-opacity-10 rounded-lg p-4">
            <div className="grid grid-cols-3 gap-4 text-sm">
              <div className="text-center">
                <p className="font-semibold">Police</p>
                <p className={incident.emergencyServices.policeNotified ? 'text-green-400' : 'text-gray-400'}>
                  {incident.emergencyServices.policeNotified ? 'Notified' : 'Not Notified'}
                </p>
              </div>
              <div className="text-center">
                <p className="font-semibold">Ambulance</p>
                <p className={incident.emergencyServices.ambulanceNotified ? 'text-green-400' : 'text-gray-400'}>
                  {incident.emergencyServices.ambulanceNotified ? 'Notified' : 'Not Notified'}
                </p>
              </div>
              <div className="text-center">
                <p className="font-semibold">Fire Service</p>
                <p className={incident.emergencyServices.fireServiceNotified ? 'text-green-400' : 'text-gray-400'}>
                  {incident.emergencyServices.fireServiceNotified ? 'Notified' : 'Not Notified'}
                </p>
              </div>
            </div>
            {incident.emergencyServices.referenceNumber && (
              <p className="mt-2 text-sm text-gray-300">
                Reference: {incident.emergencyServices.referenceNumber}
              </p>
            )}
          </div>
        </div>
      )}

      {incident.timeline && incident.timeline.length > 0 && (
        <div className="mt-6">
          <h3 className="text-lg font-semibold mb-3">Timeline</h3>
          <div className="space-y-3">
            {incident.timeline
              .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
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
      )}

      {incident.resolution && (
        <div className="mt-6">
          <h3 className="text-lg font-semibold mb-3">Resolution</h3>
          <div className="bg-white bg-opacity-10 rounded-lg p-4">
            <p className="mb-2">{incident.resolution.resolution}</p>
            <p className="text-sm text-gray-300">
              Resolved on {formatDateTime(incident.resolution.resolvedAt!)}
            </p>
            {incident.resolution.followUpRequired && (
              <p className="text-sm text-yellow-400 mt-2">
                Follow-up required {incident.resolution.followUpDate && `by ${formatDateTime(incident.resolution.followUpDate)}`}
              </p>
            )}
          </div>
        </div>
      )}

      <div className="mt-6 flex justify-end">
        <button
          onClick={() => setSelectedIncident(null)}
          className="px-6 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors"
        >
          Close
        </button>
      </div>
    </div>
  );

  if (selectedIncident) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 p-6">
        <div className="max-w-4xl mx-auto">
          <IncidentDetails incident={selectedIncident} />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 p-6">
      <div className="max-w-6xl mx-auto">
        <div className="bg-white bg-opacity-10 backdrop-blur-lg rounded-3xl p-8 text-white">
          <h1 className="text-3xl font-bold mb-8 bg-gradient-to-r from-white to-blue-200 bg-clip-text text-transparent">
            Emergency Incidents
          </h1>

          <div className="flex justify-between items-center mb-6">
            <div className="flex space-x-2">
              {['all', 'active', 'resolved', 'escalated', 'false_alarm'].map((status) => (
                <button
                  key={status}
                  onClick={() => {
                    setFilter(status);
                    setPagination(prev => ({ ...prev, currentPage: 1 }));
                  }}
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

            <div className="text-sm text-gray-300">
              Total: {pagination.totalIncidents} incidents
            </div>
          </div>

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
                  ? "You haven't had any emergency incidents yet." 
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
                            {incident.incidentType.replace('_', ' ')} • {formatDateTime(incident.createdAt)}
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
                      <span className={`text-sm font-semibold ${getSeverityColor(incident.severity)}`}>
                        {incident.severity.toUpperCase()}
                      </span>
                    </div>
                  </div>

                  {incident.contactsNotified && incident.contactsNotified.length > 0 && (
                    <div className="mt-4 flex items-center text-sm text-gray-400">
                      <span className="mr-2">👥</span>
                      {incident.contactsNotified.length} contact{incident.contactsNotified.length !== 1 ? 's' : ''} notified
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {pagination.totalPages > 1 && (
            <div className="mt-8 flex justify-center items-center space-x-4">
              <button
                onClick={() => setPagination(prev => ({ ...prev, currentPage: prev.currentPage - 1 }))}
                disabled={!pagination.hasPrev}
                className="px-4 py-2 bg-white bg-opacity-10 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-opacity-20 transition-colors"
              >
                Previous
              </button>
              
              <span className="px-4 py-2">
                Page {pagination.currentPage} of {pagination.totalPages}
              </span>
              
              <button
                onClick={() => setPagination(prev => ({ ...prev, currentPage: prev.currentPage + 1 }))}
                disabled={!pagination.hasNext}
                className="px-4 py-2 bg-white bg-opacity-10 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-opacity-20 transition-colors"
              >
                Next
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default EmergencyIncidents;
