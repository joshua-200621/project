import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Navbar } from '../components/Navbar';
import { parkingService, ParkingLocation, ParkingSlot } from '../services/parkingService';
import { Loader, AlertCircle, MapPin, Star, DollarSign } from 'lucide-react';

export const ParkingDetailsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [parking, setParking] = useState<ParkingLocation | null>(null);
  const [slots, setSlots] = useState<ParkingSlot[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      if (!id) return;

      try {
        const parkingData = await parkingService.getParkingById(id);
        if (!parkingData) {
          setError('Parking not found');
          return;
        }
        setParking(parkingData);

        const slotsData = await parkingService.getSlots(id);
        setSlots(slotsData);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load parking details');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id]);

  const handleBooking = (slotId: string) => {
    if (!startTime || !endTime) {
      setError('Please select start and end times');
      return;
    }

    navigate(`/booking/${id}/${slotId}?start=${startTime}&end=${endTime}`);
  };

  if (loading) {
    return (
      <>
        <Navbar />
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <Loader className="w-8 h-8 text-blue-600 animate-spin mx-auto mb-4" />
            <p className="text-gray-600">Loading parking details...</p>
          </div>
        </div>
      </>
    );
  }

  if (error || !parking) {
    return (
      <>
        <Navbar />
        <div className="min-h-screen bg-gray-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <p className="text-red-700">{error || 'Parking not found'}</p>
            </div>
          </div>
        </div>
      </>
    );
  }

  const availableSlots = slots.filter((s) => s.is_available && s.is_active);

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          {/* Header */}
          <div className="bg-white rounded-lg shadow-md p-8 mb-8">
            <h1 className="text-4xl font-bold text-gray-900 mb-2">{parking.name}</h1>

            <div className="flex flex-wrap gap-6 mt-6">
              <div className="flex items-center gap-3">
                <MapPin className="w-6 h-6 text-blue-600" />
                <div>
                  <p className="text-gray-600 text-sm">Location</p>
                  <p className="font-medium text-gray-900">
                    {parking.address}, {parking.city}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <DollarSign className="w-6 h-6 text-green-600" />
                <div>
                  <p className="text-gray-600 text-sm">Price</p>
                  <p className="font-medium text-gray-900">${parking.price_per_hour}/hour</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Star className="w-6 h-6 text-yellow-400" />
                <div>
                  <p className="text-gray-600 text-sm">Rating</p>
                  <p className="font-medium text-gray-900">
                    {parking.average_rating.toFixed(1)} ({parking.total_reviews} reviews)
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-6 grid grid-cols-2 gap-4">
              <div>
                <p className="text-gray-600 text-sm">Total Slots</p>
                <p className="text-2xl font-bold text-gray-900">{parking.total_slots}</p>
              </div>
              <div>
                <p className="text-gray-600 text-sm">Available Now</p>
                <p className="text-2xl font-bold text-green-600">{parking.available_slots}</p>
              </div>
            </div>

            {parking.description && (
              <div className="mt-6 pt-6 border-t border-gray-200">
                <p className="text-gray-700">{parking.description}</p>
              </div>
            )}
          </div>

          {/* Booking Form */}
          <div className="bg-white rounded-lg shadow-md p-8 mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Select Time Slot</h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Start Time
                </label>
                <input
                  type="datetime-local"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  End Time
                </label>
                <input
                  type="datetime-local"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                {error}
              </div>
            )}
          </div>

          {/* Slots */}
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-6">
              Available Slots ({availableSlots.length})
            </h2>

            {availableSlots.length === 0 ? (
              <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
                <p className="text-gray-600 text-lg">No slots available</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                {availableSlots.map((slot) => (
                  <button
                    key={slot.id}
                    onClick={() => handleBooking(slot.id)}
                    className="p-4 bg-white border-2 border-green-200 rounded-lg hover:border-green-500 hover:bg-green-50 transition"
                  >
                    <p className="text-lg font-bold text-gray-900">{slot.slot_number}</p>
                    <p className="text-xs text-gray-600 capitalize">{slot.slot_type}</p>
                    <p className="text-sm text-green-600 font-medium mt-2">Available</p>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};
