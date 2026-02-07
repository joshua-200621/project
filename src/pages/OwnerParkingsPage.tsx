import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Navbar } from '../components/Navbar';
import { useAuth } from '../contexts/AuthContext';
import { parkingService, ParkingLocation } from '../services/parkingService';
import { Loader, AlertCircle, Plus, MapPin } from 'lucide-react';

export const OwnerParkingsPage: React.FC = () => {
  const { profile } = useAuth();
  const [parkings, setParkings] = useState<ParkingLocation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchParkings = async () => {
      if (!profile?.id) return;

      try {
        const data = await parkingService.getOwnerParkings(profile.id);
        setParkings(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load parkings');
      } finally {
        setLoading(false);
      }
    };

    fetchParkings();
  }, [profile?.id]);

  if (loading) {
    return (
      <>
        <Navbar />
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <Loader className="w-8 h-8 text-blue-600 animate-spin mx-auto mb-4" />
            <p className="text-gray-600">Loading parkings...</p>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">My Parkings</h1>
              <p className="text-gray-600">Manage your parking locations</p>
            </div>
            <Link
              to="/owner/parkings/new"
              className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium"
            >
              <Plus className="w-5 h-5" />
              Add Parking
            </Link>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <p className="text-red-700">{error}</p>
            </div>
          )}

          {parkings.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
              <MapPin className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 text-lg">No parkings yet</p>
              <p className="text-gray-500 mb-6">Create your first parking location to get started</p>
              <Link
                to="/owner/parkings/new"
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition inline-block"
              >
                Create Parking
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {parkings.map((parking) => (
                <Link
                  key={parking.id}
                  to={`/owner/parkings/${parking.id}`}
                  className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition block"
                >
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-xl font-bold text-gray-900">{parking.name}</h3>
                      <div className="flex items-center gap-2 text-gray-600 mt-1">
                        <MapPin className="w-4 h-4" />
                        <p>{parking.address}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-blue-600">${parking.price_per_hour}/hr</p>
                      <p className={`text-sm ${parking.is_approved ? 'text-green-600' : 'text-yellow-600'}`}>
                        {parking.is_approved ? 'Approved' : 'Pending Approval'}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4 py-4 border-y border-gray-200">
                    <div>
                      <p className="text-xs text-gray-500">Total Slots</p>
                      <p className="font-bold text-gray-900">{parking.total_slots}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Available</p>
                      <p className="font-bold text-green-600">{parking.available_slots}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Rating</p>
                      <p className="font-bold text-gray-900">{parking.average_rating.toFixed(1)}⭐</p>
                    </div>
                  </div>

                  <div className="mt-4 flex gap-3">
                    <button className="px-4 py-2 text-blue-600 border border-blue-600 rounded-lg hover:bg-blue-50 transition font-medium text-sm">
                      Edit
                    </button>
                    <button className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition font-medium text-sm">
                      View Bookings
                    </button>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
};
