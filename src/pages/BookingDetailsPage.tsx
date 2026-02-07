import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Navbar } from '../components/Navbar';
import { bookingService, BookingWithDetails } from '../services/bookingService';
import { paymentService } from '../services/paymentService';
import { Loader, AlertCircle, MapPin, Calendar, CheckCircle, XCircle } from 'lucide-react';
import type { Payment } from '../services/paymentService';

export const BookingDetailsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [booking, setBooking] = useState<BookingWithDetails | null>(null);
  const [payment, setPayment] = useState<Payment | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [cancelling, setCancelling] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      if (!id) return;

      try {
        const bookingData = await bookingService.getBookingById(id);
        if (!bookingData) {
          setError('Booking not found');
          return;
        }
        setBooking(bookingData);

        const paymentData = await paymentService.getPaymentByBooking(id);
        setPayment(paymentData);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load booking details');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id]);

  const handleCancelBooking = async () => {
    if (!booking || !window.confirm('Are you sure you want to cancel this booking?')) return;

    setCancelling(true);
    try {
      await bookingService.cancelBooking(booking.id);
      setBooking({ ...booking, status: 'cancelled' });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to cancel booking');
    } finally {
      setCancelling(false);
    }
  };

  if (loading) {
    return (
      <>
        <Navbar />
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <Loader className="w-8 h-8 text-blue-600 animate-spin mx-auto mb-4" />
            <p className="text-gray-600">Loading booking details...</p>
          </div>
        </div>
      </>
    );
  }

  if (error || !booking) {
    return (
      <>
        <Navbar />
        <div className="min-h-screen bg-gray-50">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <p className="text-red-700">{error || 'Booking not found'}</p>
            </div>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <button
            onClick={() => navigate('/dashboard')}
            className="text-blue-600 hover:text-blue-800 font-medium mb-8"
          >
            ← Back to Dashboard
          </button>

          {/* Booking Header */}
          <div className="bg-white rounded-lg shadow-md p-8 mb-6">
            <div className="flex justify-between items-start mb-6">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Booking Details</h1>
                <p className="text-gray-600 mt-1">Booking ID: {booking.id}</p>
              </div>
              <div
                className={`px-4 py-2 rounded-full font-medium text-lg ${
                  booking.status === 'active'
                    ? 'bg-green-100 text-green-800'
                    : booking.status === 'completed'
                    ? 'bg-blue-100 text-blue-800'
                    : 'bg-red-100 text-red-800'
                }`}
              >
                {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Parking Info */}
              <div>
                <h2 className="text-lg font-bold text-gray-900 mb-4">Parking Location</h2>
                <div className="space-y-2">
                  <p className="text-2xl font-bold text-gray-900">
                    {booking.parking_location?.name}
                  </p>
                  <div className="flex items-start gap-2 text-gray-600">
                    <MapPin className="w-4 h-4 flex-shrink-0 mt-0.5" />
                    <p>{booking.parking_location?.address}</p>
                  </div>
                </div>
              </div>

              {/* Time Info */}
              <div>
                <h2 className="text-lg font-bold text-gray-900 mb-4">Time & Duration</h2>
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-gray-600">
                    <Calendar className="w-4 h-4" />
                    <div>
                      <p className="text-sm text-gray-500">Start</p>
                      <p className="font-medium">
                        {new Date(booking.start_time).toLocaleString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-gray-600">
                    <Calendar className="w-4 h-4" />
                    <div>
                      <p className="text-sm text-gray-500">End</p>
                      <p className="font-medium">
                        {new Date(booking.end_time).toLocaleString()}
                      </p>
                    </div>
                  </div>
                  <p className="text-gray-900 font-medium">
                    Duration: {booking.total_duration.toFixed(1)} hours
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Cost & Payment */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-4">Cost Breakdown</h2>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <p className="text-gray-600">Price per Hour</p>
                  <p className="font-medium">${booking.parking_location?.price_per_hour}</p>
                </div>
                <div className="flex justify-between">
                  <p className="text-gray-600">Duration</p>
                  <p className="font-medium">{booking.total_duration.toFixed(1)} hours</p>
                </div>
                <div className="border-t border-gray-200 pt-2 flex justify-between">
                  <p className="font-bold text-gray-900">Total Cost</p>
                  <p className="text-2xl font-bold text-green-600">${booking.total_cost.toFixed(2)}</p>
                </div>
              </div>
            </div>

            {payment && (
              <div className="bg-white rounded-lg shadow-md p-6">
                <h2 className="text-lg font-bold text-gray-900 mb-4">Payment Status</h2>
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    {payment.status === 'success' ? (
                      <CheckCircle className="w-6 h-6 text-green-600" />
                    ) : payment.status === 'failed' ? (
                      <XCircle className="w-6 h-6 text-red-600" />
                    ) : (
                      <div className="w-6 h-6 rounded-full border-2 border-yellow-400" />
                    )}
                    <p className="font-bold capitalize">{payment.status}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Payment Method</p>
                    <p className="font-medium capitalize">{payment.payment_method}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Transaction ID</p>
                    <p className="font-medium text-xs text-gray-700 break-all">
                      {payment.transaction_id}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Vehicle & Additional Info */}
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4">Additional Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <p className="text-sm text-gray-500">Vehicle Number</p>
                <p className="text-2xl font-bold text-gray-900">{booking.vehicle_number}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Slot Number</p>
                <p className="text-2xl font-bold text-gray-900">{booking.slot?.slot_number}</p>
              </div>
            </div>
            {booking.notes && (
              <div className="mt-4 pt-4 border-t border-gray-200">
                <p className="text-sm text-gray-500">Notes</p>
                <p className="text-gray-900">{booking.notes}</p>
              </div>
            )}
          </div>

          {/* Actions */}
          {booking.status === 'active' && (
            <button
              onClick={handleCancelBooking}
              disabled={cancelling}
              className="w-full px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition font-bold disabled:opacity-50"
            >
              {cancelling ? 'Cancelling...' : 'Cancel Booking'}
            </button>
          )}
        </div>
      </div>
    </>
  );
};
