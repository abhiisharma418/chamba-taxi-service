import React, { useState, useEffect } from 'react';
import {
  FileText, Check, X, Eye, Download, Upload, AlertTriangle,
  Clock, CheckCircle, XCircle, Calendar, User, Phone, Car,
  MapPin, Star, Shield, Camera, Paperclip, ExternalLink
} from 'lucide-react';

interface Document {
  _id: string;
  type: 'license' | 'aadhar' | 'vehicle_registration' | 'insurance' | 'permit' | 'photo';
  fileName: string;
  fileUrl: string;
  status: 'pending' | 'approved' | 'rejected';
  uploadedAt: string;
  verifiedAt?: string;
  verifiedBy?: string;
  rejectionReason?: string;
  expiryDate?: string;
  documentNumber?: string;
}

interface Driver {
  _id: string;
  name: string;
  email: string;
  phone: string;
  profilePhoto?: string;
  vehicleDetails: {
    make: string;
    model: string;
    year: number;
    color: string;
    plateNumber: string;
    type: string;
  };
  address: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
  };
  documents: Document[];
  verificationStatus: 'pending' | 'approved' | 'rejected' | 'incomplete';
  joiningDate: string;
  rating?: number;
  totalRides?: number;
  status: 'active' | 'inactive' | 'suspended';
}

interface DriverDocumentVerificationProps {
  driverId: string;
  onClose: () => void;
  onVerificationComplete: (driverId: string, status: string) => void;
}

const DriverDocumentVerification: React.FC<DriverDocumentVerificationProps> = ({
  driverId,
  onClose,
  onVerificationComplete
}) => {
  const [driver, setDriver] = useState<Driver | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [showRejectionModal, setShowRejectionModal] = useState(false);
  const [pendingAction, setPendingAction] = useState<'approve' | 'reject' | null>(null);

  // Mock data for demonstration
  useEffect(() => {
    const fetchDriverData = async () => {
      try {
        // Mock API call - replace with actual API
        const mockDriver: Driver = {
          _id: driverId,
          name: 'Rajesh Kumar Sharma',
          email: 'rajesh.kumar@email.com',
          phone: '+91 98765 43210',
          profilePhoto: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
          vehicleDetails: {
            make: 'Maruti Suzuki',
            model: 'Swift Dzire',
            year: 2019,
            color: 'White',
            plateNumber: 'DL 01 AB 1234',
            type: 'Sedan'
          },
          address: {
            street: '123, MG Road',
            city: 'New Delhi',
            state: 'Delhi',
            zipCode: '110001'
          },
          documents: [
            {
              _id: '1',
              type: 'license',
              fileName: 'driving_license.jpg',
              fileUrl: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=400',
              status: 'pending',
              uploadedAt: '2024-03-01T10:30:00Z',
              documentNumber: 'DL-0420110012345',
              expiryDate: '2029-03-15'
            },
            {
              _id: '2',
              type: 'aadhar',
              fileName: 'aadhar_card.jpg',
              fileUrl: 'https://images.unsplash.com/photo-1554224154-26032fced385?w=400',
              status: 'approved',
              uploadedAt: '2024-03-01T10:32:00Z',
              verifiedAt: '2024-03-01T15:20:00Z',
              verifiedBy: 'Admin User',
              documentNumber: '1234 5678 9012'
            },
            {
              _id: '3',
              type: 'vehicle_registration',
              fileName: 'rc_book.jpg',
              fileUrl: 'https://images.unsplash.com/photo-1554224154-22dec7ec8818?w=400',
              status: 'pending',
              uploadedAt: '2024-03-01T10:35:00Z',
              documentNumber: 'DL01AB1234',
              expiryDate: '2027-08-20'
            },
            {
              _id: '4',
              type: 'insurance',
              fileName: 'insurance_certificate.pdf',
              fileUrl: 'https://images.unsplash.com/photo-1554224154-26032fced385?w=400',
              status: 'rejected',
              uploadedAt: '2024-03-01T10:40:00Z',
              verifiedAt: '2024-03-01T16:10:00Z',
              verifiedBy: 'Admin User',
              rejectionReason: 'Document expired. Please upload valid insurance certificate.',
              expiryDate: '2024-02-15'
            },
            {
              _id: '5',
              type: 'photo',
              fileName: 'profile_photo.jpg',
              fileUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400',
              status: 'approved',
              uploadedAt: '2024-03-01T10:25:00Z',
              verifiedAt: '2024-03-01T15:15:00Z',
              verifiedBy: 'Admin User'
            }
          ],
          verificationStatus: 'pending',
          joiningDate: '2024-03-01T09:00:00Z',
          rating: 4.7,
          totalRides: 156,
          status: 'active'
        };

        setDriver(mockDriver);
      } catch (error) {
        console.error('Error fetching driver data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDriverData();
  }, [driverId]);

  const getDocumentTypeIcon = (type: string) => {
    switch (type) {
      case 'license': return <Car className="h-5 w-5" />;
      case 'aadhar': return <User className="h-5 w-5" />;
      case 'vehicle_registration': return <FileText className="h-5 w-5" />;
      case 'insurance': return <Shield className="h-5 w-5" />;
      case 'permit': return <Paperclip className="h-5 w-5" />;
      case 'photo': return <Camera className="h-5 w-5" />;
      default: return <FileText className="h-5 w-5" />;
    }
  };

  const getDocumentTypeName = (type: string) => {
    switch (type) {
      case 'license': return 'Driving License';
      case 'aadhar': return 'Aadhar Card';
      case 'vehicle_registration': return 'Vehicle Registration';
      case 'insurance': return 'Insurance Certificate';
      case 'permit': return 'Commercial Permit';
      case 'photo': return 'Profile Photo';
      default: return type;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved': return <CheckCircle className="h-5 w-5 text-emerald-600" />;
      case 'rejected': return <XCircle className="h-5 w-5 text-red-600" />;
      case 'pending': return <Clock className="h-5 w-5 text-amber-600" />;
      default: return <AlertTriangle className="h-5 w-5 text-gray-400" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'rejected': return 'bg-red-100 text-red-800 border-red-200';
      case 'pending': return 'bg-amber-100 text-amber-800 border-amber-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const handleDocumentAction = async (documentId: string, action: 'approve' | 'reject', reason?: string) => {
    try {
      // Mock API call - replace with actual API
      console.log(`${action} document ${documentId}`, reason);
      
      if (driver) {
        const updatedDocuments = driver.documents.map(doc => {
          if (doc._id === documentId) {
            return {
              ...doc,
              status: action === 'approve' ? 'approved' : 'rejected',
              verifiedAt: new Date().toISOString(),
              verifiedBy: 'Current Admin',
              rejectionReason: action === 'reject' ? reason : undefined
            };
          }
          return doc;
        });

        setDriver({
          ...driver,
          documents: updatedDocuments
        });
      }

      setShowRejectionModal(false);
      setRejectionReason('');
      setPendingAction(null);
    } catch (error) {
      console.error('Error updating document status:', error);
    }
  };

  const handleDriverVerification = async (status: 'approved' | 'rejected') => {
    try {
      // Mock API call - replace with actual API
      console.log(`Driver verification: ${status}`);
      
      if (driver) {
        setDriver({
          ...driver,
          verificationStatus: status
        });
      }

      onVerificationComplete(driverId, status);
    } catch (error) {
      console.error('Error updating driver verification:', error);
    }
  };

  const isAllDocumentsApproved = () => {
    if (!driver) return false;
    const requiredDocs = ['license', 'aadhar', 'vehicle_registration', 'insurance', 'photo'];
    return requiredDocs.every(docType => 
      driver.documents.some(doc => doc.type === docType && doc.status === 'approved')
    );
  };

  const getPendingDocumentsCount = () => {
    if (!driver) return 0;
    return driver.documents.filter(doc => doc.status === 'pending').length;
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
        <div className="bg-white rounded-3xl p-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="text-slate-600 mt-4">Loading driver details...</p>
        </div>
      </div>
    );
  }

  if (!driver) {
    return (
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
        <div className="bg-white rounded-3xl p-8 text-center">
          <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <p className="text-slate-600">Driver not found</p>
          <button
            onClick={onClose}
            className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Close
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white/90 backdrop-blur-2xl rounded-3xl shadow-2xl border border-white/30 w-full max-w-6xl max-h-[90vh] overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-0.5 bg-gradient-to-r from-blue-500 via-purple-500 to-indigo-500"></div>
        
        {/* Header */}
        <div className="relative p-8 border-b border-white/20">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-6">
              <div className="relative">
                <img
                  src={driver.profilePhoto}
                  alt={driver.name}
                  className="w-20 h-20 rounded-2xl object-cover border-4 border-white shadow-lg"
                />
                <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full flex items-center justify-center shadow-lg">
                  <User className="h-4 w-4 text-white" />
                </div>
              </div>
              
              <div>
                <h2 className="text-3xl font-black bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent">
                  {driver.name}
                </h2>
                <p className="text-slate-600 font-medium text-lg">{driver.email}</p>
                <div className="flex items-center gap-4 mt-2">
                  <div className="flex items-center gap-2 text-sm text-slate-600">
                    <Phone className="h-4 w-4" />
                    {driver.phone}
                  </div>
                  <div className="flex items-center gap-2 text-sm text-slate-600">
                    <Calendar className="h-4 w-4" />
                    Joined {new Date(driver.joiningDate).toLocaleDateString()}
                  </div>
                  {driver.rating && (
                    <div className="flex items-center gap-2 text-sm text-slate-600">
                      <Star className="h-4 w-4 text-amber-500" />
                      {driver.rating} ({driver.totalRides} rides)
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className={`px-4 py-2 rounded-xl border font-semibold ${getStatusColor(driver.verificationStatus)}`}>
                {getStatusIcon(driver.verificationStatus)}
                <span className="ml-2 capitalize">{driver.verificationStatus}</span>
              </div>
              
              <button
                onClick={onClose}
                className="p-2 hover:bg-red-100 rounded-xl transition-colors"
              >
                <X className="h-6 w-6 text-slate-600" />
              </button>
            </div>
          </div>
          
          {/* Stats */}
          <div className="grid grid-cols-4 gap-6 mt-6">
            <div className="text-center p-4 bg-white/60 backdrop-blur-sm rounded-2xl border border-white/40">
              <div className="text-2xl font-bold text-blue-600">{driver.documents.length}</div>
              <div className="text-sm text-slate-600">Total Documents</div>
            </div>
            <div className="text-center p-4 bg-white/60 backdrop-blur-sm rounded-2xl border border-white/40">
              <div className="text-2xl font-bold text-emerald-600">
                {driver.documents.filter(d => d.status === 'approved').length}
              </div>
              <div className="text-sm text-slate-600">Approved</div>
            </div>
            <div className="text-center p-4 bg-white/60 backdrop-blur-sm rounded-2xl border border-white/40">
              <div className="text-2xl font-bold text-amber-600">{getPendingDocumentsCount()}</div>
              <div className="text-sm text-slate-600">Pending</div>
            </div>
            <div className="text-center p-4 bg-white/60 backdrop-blur-sm rounded-2xl border border-white/40">
              <div className="text-2xl font-bold text-red-600">
                {driver.documents.filter(d => d.status === 'rejected').length}
              </div>
              <div className="text-sm text-slate-600">Rejected</div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex h-[calc(90vh-300px)]">
          {/* Documents List */}
          <div className="w-1/2 p-6 overflow-y-auto">
            <h3 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-2">
              <FileText className="h-6 w-6 text-blue-600" />
              Documents ({driver.documents.length})
            </h3>
            
            <div className="space-y-4">
              {driver.documents.map((document) => (
                <div
                  key={document._id}
                  className={`group p-6 rounded-2xl border transition-all duration-300 cursor-pointer hover:shadow-lg ${
                    selectedDocument?._id === document._id
                      ? 'border-blue-300 bg-blue-50/50 shadow-lg'
                      : 'border-white/40 bg-white/60 hover:border-blue-200'
                  }`}
                  onClick={() => setSelectedDocument(document)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className={`p-3 rounded-xl ${getStatusColor(document.status).replace('text-', 'text-').replace('border-', '').replace('bg-', 'bg-')}`}>
                        {getDocumentTypeIcon(document.type)}
                      </div>
                      
                      <div>
                        <h4 className="font-bold text-slate-900">{getDocumentTypeName(document.type)}</h4>
                        <p className="text-sm text-slate-600">{document.fileName}</p>
                        {document.documentNumber && (
                          <p className="text-xs text-slate-500 mt-1">
                            ID: {document.documentNumber}
                          </p>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3">
                      {getStatusIcon(document.status)}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          window.open(document.fileUrl, '_blank');
                        }}
                        className="p-2 hover:bg-white/60 rounded-lg transition-colors"
                      >
                        <ExternalLink className="h-4 w-4 text-slate-600" />
                      </button>
                    </div>
                  </div>
                  
                  <div className="mt-4 flex items-center justify-between">
                    <div className="text-xs text-slate-500">
                      Uploaded: {new Date(document.uploadedAt).toLocaleDateString()}
                      {document.expiryDate && (
                        <span className="ml-4">
                          Expires: {new Date(document.expiryDate).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                    
                    {document.status === 'pending' && (
                      <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDocumentAction(document._id, 'approve');
                          }}
                          className="px-3 py-1 bg-emerald-600 text-white text-xs rounded-lg hover:bg-emerald-700 transition-colors"
                        >
                          Approve
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setPendingAction('reject');
                            setSelectedDocument(document);
                            setShowRejectionModal(true);
                          }}
                          className="px-3 py-1 bg-red-600 text-white text-xs rounded-lg hover:bg-red-700 transition-colors"
                        >
                          Reject
                        </button>
                      </div>
                    )}
                  </div>
                  
                  {document.status === 'rejected' && document.rejectionReason && (
                    <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg">
                      <p className="text-xs text-red-700">
                        <strong>Rejection Reason:</strong> {document.rejectionReason}
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Document Preview */}
          <div className="w-1/2 p-6 border-l border-white/20">
            {selectedDocument ? (
              <div>
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-bold text-slate-900">
                    {getDocumentTypeName(selectedDocument.type)}
                  </h3>
                  <div className={`px-3 py-1 rounded-lg border font-semibold text-sm ${getStatusColor(selectedDocument.status)}`}>
                    {selectedDocument.status.toUpperCase()}
                  </div>
                </div>

                <div className="bg-white/60 backdrop-blur-sm rounded-2xl border border-white/40 p-6 mb-6">
                  <img
                    src={selectedDocument.fileUrl}
                    alt={selectedDocument.fileName}
                    className="w-full rounded-xl shadow-lg"
                  />
                </div>

                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-semibold text-slate-700">File Name</label>
                      <p className="text-slate-900">{selectedDocument.fileName}</p>
                    </div>
                    <div>
                      <label className="text-sm font-semibold text-slate-700">Document Number</label>
                      <p className="text-slate-900">{selectedDocument.documentNumber || 'N/A'}</p>
                    </div>
                    <div>
                      <label className="text-sm font-semibold text-slate-700">Upload Date</label>
                      <p className="text-slate-900">
                        {new Date(selectedDocument.uploadedAt).toLocaleDateString()}
                      </p>
                    </div>
                    <div>
                      <label className="text-sm font-semibold text-slate-700">Expiry Date</label>
                      <p className="text-slate-900">
                        {selectedDocument.expiryDate 
                          ? new Date(selectedDocument.expiryDate).toLocaleDateString()
                          : 'N/A'
                        }
                      </p>
                    </div>
                  </div>

                  {selectedDocument.verifiedAt && (
                    <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl">
                      <p className="text-sm text-emerald-700">
                        <strong>Verified by:</strong> {selectedDocument.verifiedBy}<br />
                        <strong>Verified on:</strong> {new Date(selectedDocument.verifiedAt).toLocaleString()}
                      </p>
                    </div>
                  )}

                  {selectedDocument.status === 'pending' && (
                    <div className="flex gap-4">
                      <button
                        onClick={() => handleDocumentAction(selectedDocument._id, 'approve')}
                        className="flex-1 bg-gradient-to-r from-emerald-600 to-emerald-700 text-white py-3 px-6 rounded-2xl font-semibold transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-1"
                      >
                        <Check className="h-5 w-5 inline mr-2" />
                        Approve Document
                      </button>
                      <button
                        onClick={() => {
                          setPendingAction('reject');
                          setShowRejectionModal(true);
                        }}
                        className="flex-1 bg-gradient-to-r from-red-600 to-red-700 text-white py-3 px-6 rounded-2xl font-semibold transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-1"
                      >
                        <X className="h-5 w-5 inline mr-2" />
                        Reject Document
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center h-full text-center">
                <div>
                  <Eye className="h-16 w-16 text-slate-400 mx-auto mb-4" />
                  <p className="text-slate-600 text-lg">Select a document to preview</p>
                  <p className="text-slate-500 text-sm">Click on any document from the list to view details</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-6 border-t border-white/20 bg-white/50 backdrop-blur-sm">
          <div className="flex items-center justify-between">
            <div className="text-sm text-slate-600">
              {isAllDocumentsApproved() ? (
                <span className="text-emerald-600 font-semibold">✓ All required documents approved</span>
              ) : (
                <span>Pending documents: {getPendingDocumentsCount()}</span>
              )}
            </div>
            
            <div className="flex gap-4">
              <button
                onClick={onClose}
                className="px-6 py-3 bg-white/60 hover:bg-white/80 text-slate-700 rounded-2xl font-semibold transition-all duration-300 border border-white/40"
              >
                Close
              </button>
              
              {driver.verificationStatus === 'pending' && (
                <>
                  <button
                    onClick={() => handleDriverVerification('rejected')}
                    className="px-6 py-3 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white rounded-2xl font-semibold transition-all duration-300 shadow-lg hover:shadow-xl"
                  >
                    Reject Driver
                  </button>
                  
                  <button
                    onClick={() => handleDriverVerification('approved')}
                    disabled={!isAllDocumentsApproved()}
                    className={`px-6 py-3 rounded-2xl font-semibold transition-all duration-300 shadow-lg hover:shadow-xl ${
                      isAllDocumentsApproved()
                        ? 'bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-white'
                        : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    }`}
                  >
                    Approve Driver
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Rejection Modal */}
      {showRejectionModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white/90 backdrop-blur-2xl rounded-3xl shadow-2xl border border-white/30 w-full max-w-md p-8">
            <div className="text-center mb-6">
              <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-slate-900">Reject Document</h3>
              <p className="text-slate-600">Please provide a reason for rejection</p>
            </div>

            <textarea
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder="Enter rejection reason..."
              className="w-full p-4 border border-gray-300 rounded-2xl resize-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
              rows={4}
            />

            <div className="flex gap-4 mt-6">
              <button
                onClick={() => {
                  setShowRejectionModal(false);
                  setRejectionReason('');
                  setPendingAction(null);
                }}
                className="flex-1 px-4 py-3 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-2xl font-semibold transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  if (selectedDocument && rejectionReason.trim()) {
                    handleDocumentAction(selectedDocument._id, 'reject', rejectionReason.trim());
                  }
                }}
                disabled={!rejectionReason.trim()}
                className="flex-1 px-4 py-3 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white rounded-2xl font-semibold transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Reject Document
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DriverDocumentVerification;
