import React, { useState, useEffect } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { Navbar } from '../components/Navbar';
import { parkingService } from '../services/parkingService';
import { bookingService } from '../services/bookingService';
import { paymentService } from '../services/paymentService';
import { Loader, AlertCircle, CheckCircle } from 'lucide-react';

export const BookingPage: React.FC = () => {
  const { parkingId, slotId } = useParams<{ parkingId: string; slotId: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const startTime = searchParams.get('start') || '';
  const endTime = searchParams.get('end') || '';

  const [vehicleNumber, setVehicleNumber] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('card');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const [parkingName, setParkingName] = useState('');
  const [pricePerHour, setPricePerHour] = useState(0);
  const [duration, setDuration] = useState(0);
  const [totalCost, setTotalCost] = useState(0);

  useEffect(() => {
    const calculateCost = async () => {
      if (!parkingId || !startTime || !endTime) return;

      try {
        const parking = await parkingService.getParkingById(parkingId);
        if (parking) {
          setParkingName(parking.name);
          setPricePerHour(parking.price_per_hour);

          const start = new Date(startTime).getTime();
          const end = new Date(endTime).getTime();
          const durationHours = (end - start) / (1000 * 60 * 60);
          setDuration(durationHours);
          setTotalCost(durationHours * parking.price_per_hour);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load parking details');
      }
    };

    calculateCost();
  }, [parkingId, startTime, endTime]);

  const handleBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!vehicleNumber.trim()) {
      setError('Please enter vehicle number');
      return;
    }

    setLoading(true);
    setError('');

    try {
      if (!parkingId || !slotId) throw new Error('Invalid parking or slot');

      const booking = await bookingService.createBooking(
        parkingId,
        slotId,
        startTime,
        endTime,
        vehicleNumber,
        pricePerHour
      );

      const payment = await paymentService.processPayment(
        booking.id,
        totalCost,
        paymentMethod
      );

      if (payment.status === 'success') {
        setSuccess(true);
        setTimeout(() => {
          navigate(`/booking/${booking.id}`);
        }, 2000);
      } else {
        setError('Payment failed. Please try again.');
        await bookingService.cancelBooking(booking.id);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Booking failed');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <>
        <Navbar />
        <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
          <div className="text-center">
            <CheckCircle className="w-16 h-16 text-green-600 mx-auto mb-4" />
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Booking Confirmed!</h1>
            <p className="text-gray-600 mb-4">Your parking has been booked successfully.</p>
            <p className="text-sm text-gray-500">Redirecting to booking details...</p>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">Complete Your Booking</h1>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <p className="text-red-700">{error}</p>
            </div>
          )}

          {/* Booking Summary */}
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Booking Summary</h2>

            <div className="space-y-3 pb-4 border-b border-gray-200">
              <div className="flex justify-between">
                <p className="text-gray-600">Parking</p>
                <p className="font-medium text-gray-900">{parkingName}</p>
              </div>
              <div className="flex justify-between">
                <p className="text-gray-600">Start Time</p>
                <p className="font-medium text-gray-900">
                  {new Date(startTime).toLocaleString()}
                </p>
              </div>
              <div className="flex justify-between">
                <p className="text-gray-600">End Time</p>
                <p className="font-medium text-gray-900">
                  {new Date(endTime).toLocaleString()}
                </p>
              </div>
              <div className="flex justify-between">
                <p className="text-gray-600">Duration</p>
                <p className="font-medium text-gray-900">{duration.toFixed(1)} hours</p>
              </div>
              <div className="flex justify-between">
                <p className="text-gray-600">Price per Hour</p>
                <p className="font-medium text-gray-900">${pricePerHour.toFixed(2)}</p>
              </div>
            </div>

            <div className="flex justify-between pt-4">
              <p className="text-lg font-bold text-gray-900">Total Cost</p>
              <p className="text-2xl font-bold text-green-600">${totalCost.toFixed(2)}</p>
            </div>
          </div>

          {/* Booking Form */}
          <form onSubmit={handleBooking} className="bg-white rounded-lg shadow-md p-6">
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Vehicle Number
              </label>
              <input
                type="text"
                value={vehicleNumber}
                onChange={(e) => setVehicleNumber(e.target.value.toUpperCase())}
                placeholder="e.g., ABC1234"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent uppercase"
                required
              />
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Payment Method
              </label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="card">Credit/Debit Card</option>
                <option value="wallet">Digital Wallet</option>
                <option value="upi">UPI</option>
              </select>
              <p className="text-xs text-gray-500 mt-1">Payment is simulated for demo purposes</p>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 text-white py-3 rounded-lg font-bold hover:bg-blue-700 transition disabled:opacity-50"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <Loader className="w-5 h-5 animate-spin" />
                  Processing...
                </span>
              ) : (
                `Confirm & Pay $${totalCost.toFixed(2)}`
              )}
            </button>
          </form>
        </div>
      </div>
    </>
  );
};
