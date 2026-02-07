import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Navbar } from '../components/Navbar';
import { useAuth } from '../contexts/AuthContext';
import { bookingService, BookingWithDetails } from '../services/bookingService';
import { Loader, AlertCircle, Calendar, MapPin } from 'lucide-react';

export const DashboardPage: React.FC = () => {
  const { profile } = useAuth();
  const [bookings, setBookings] = useState<BookingWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchBookings = async () => {
      if (profile?.role !== 'user') {
        setLoading(false);
        return;
      }

      try {
        const data = await bookingService.getUserBookings();
        setBookings(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load bookings');
      } finally {
        setLoading(false);
      }
    };

    fetchBookings();
  }, [profile?.role]);

  if (profile?.role === 'admin') {
    return (
      <>
        <Navbar />
        <div className="min-h-screen bg-gray-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <h1 className="text-3xl font-bold text-gray-900 mb-6">Admin Dashboard</h1>
            <Link
              to="/admin"
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
            >
              Go to Admin Panel
            </Link>
          </div>
        </div>
      </>
    );
  }

  if (profile?.role === 'owner') {
    return (
      <>
        <Navbar />
        <div className="min-h-screen bg-gray-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <h1 className="text-3xl font-bold text-gray-900 mb-6">Parking Owner Dashboard</h1>
            <Link
              to="/owner/parkings"
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
            >
              Manage Your Parkings
            </Link>
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
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Welcome, {profile?.full_name}</h1>
            <p className="text-gray-600">Manage your parking bookings</p>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <p className="text-red-700">{error}</p>
            </div>
          )}

          <div className="mb-8">
            <Link
              to="/search"
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium"
            >
              Find Parking
            </Link>
          </div>

          <h2 className="text-2xl font-bold text-gray-900 mb-6">Your Bookings</h2>

          {loading && (
            <div className="text-center py-12">
              <Loader className="w-8 h-8 text-blue-600 animate-spin mx-auto mb-4" />
              <p className="text-gray-600">Loading bookings...</p>
            </div>
          )}

          {!loading && bookings.length === 0 && (
            <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
              <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 text-lg">No bookings yet</p>
              <p className="text-gray-500">Find and book a parking space to get started</p>
            </div>
          )}

          {!loading && bookings.length > 0 && (
            <div className="space-y-4">
              {bookings.map((booking) => (
                <div
                  key={booking.id}
                  className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="text-lg font-bold text-gray-900">
                        {booking.parking_location?.name}
                      </h3>
                      <div className="flex items-center gap-2 text-gray-600 mt-1">
                        <MapPin className="w-4 h-4" />
                        <p>{booking.parking_location?.address}</p>
                      </div>
                    </div>
                    <div
                      className={`px-3 py-1 rounded-full text-sm font-medium ${
                        booking.status === 'active'
                          ? 'bg-green-100 text-green-800'
                          : booking.status === 'completed'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 py-4 border-y border-gray-200">
                    <div>
                      <p className="text-xs text-gray-500">Slot</p>
                      <p className="font-medium text-gray-900">{booking.slot?.slot_number}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Duration</p>
                      <p className="font-medium text-gray-900">{booking.total_duration.toFixed(1)}h</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Start Time</p>
                      <p className="font-medium text-gray-900">
                        {new Date(booking.start_time).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex items-end">
                      <div>
                        <p className="text-xs text-gray-500">Total Cost</p>
                        <p className="font-bold text-green-600 text-lg">
                          ${booking.total_cost.toFixed(2)}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 flex gap-3">
                    <Link
                      to={`/booking/${booking.id}`}
                      className="px-4 py-2 text-blue-600 border border-blue-600 rounded-lg hover:bg-blue-50 transition font-medium text-sm"
                    >
                      View Details
                    </Link>
                    {booking.status === 'active' && (
                      <button className="px-4 py-2 text-red-600 border border-red-600 rounded-lg hover:bg-red-50 transition font-medium text-sm">
                        Cancel Booking
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
};
