import React, { useState, useEffect } from 'react';
import { Navbar } from '../components/Navbar';
import { useAuth } from '../contexts/AuthContext';
import { adminService, AdminStats, UserStats } from '../services/adminService';
import { parkingService, ParkingLocation } from '../services/parkingService';
import { Loader, AlertCircle, Users, MapPin, TrendingUp, DollarSign } from 'lucide-react';

export const AdminPage: React.FC = () => {
  const { profile } = useAuth();
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [users, setUsers] = useState<UserStats[]>([]);
  const [parkings, setParkings] = useState<ParkingLocation[]>([]);
  const [pendingParkings, setPendingParkings] = useState<ParkingLocation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<'overview' | 'users' | 'parkings' | 'pending'>(
    'overview'
  );

  useEffect(() => {
    const fetchData = async () => {
      if (profile?.role !== 'admin') return;

      try {
        const [statsData, usersData, parkingsData, pendingData] = await Promise.all([
          adminService.getDashboardStats(),
          adminService.getAllUsers(),
          parkingService.getAllParkings(),
          parkingService.getPendingParkings(),
        ]);

        setStats(statsData);
        setUsers(usersData);
        setParkings(parkingsData);
        setPendingParkings(pendingData);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load admin data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [profile?.role]);

  const handleApproveParking = async (parkingId: string) => {
    try {
      await parkingService.approveParkings(parkingId);
      setPendingParkings(pendingParkings.filter((p) => p.id !== parkingId));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to approve parking');
    }
  };

  const handleRejectParking = async (parkingId: string) => {
    try {
      await parkingService.rejectParking(parkingId);
      setPendingParkings(pendingParkings.filter((p) => p.id !== parkingId));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to reject parking');
    }
  };

  const handleBlockUser = async (userId: string) => {
    try {
      await adminService.blockUser(userId);
      setUsers(users.map((u) => (u.id === userId ? { ...u, is_blocked: true } : u)));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to block user');
    }
  };

  if (!profile || profile.role !== 'admin') {
    return (
      <>
        <Navbar />
        <div className="min-h-screen bg-gray-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <p className="text-red-600">Access denied. Admin panel is only for administrators.</p>
          </div>
        </div>
      </>
    );
  }

  if (loading) {
    return (
      <>
        <Navbar />
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <Loader className="w-8 h-8 text-blue-600 animate-spin mx-auto mb-4" />
            <p className="text-gray-600">Loading admin dashboard...</p>
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
          <h1 className="text-4xl font-bold text-gray-900 mb-8">Admin Dashboard</h1>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <p className="text-red-700">{error}</p>
            </div>
          )}

          {/* Stats Cards */}
          {stats && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <div className="bg-white rounded-lg shadow-md p-6">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-gray-600 font-medium">Total Users</h3>
                  <Users className="w-6 h-6 text-blue-600" />
                </div>
                <p className="text-3xl font-bold text-gray-900">{stats.totalUsers}</p>
              </div>

              <div className="bg-white rounded-lg shadow-md p-6">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-gray-600 font-medium">Total Parkings</h3>
                  <MapPin className="w-6 h-6 text-green-600" />
                </div>
                <p className="text-3xl font-bold text-gray-900">{stats.totalParkings}</p>
              </div>

              <div className="bg-white rounded-lg shadow-md p-6">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-gray-600 font-medium">Active Bookings</h3>
                  <TrendingUp className="w-6 h-6 text-orange-600" />
                </div>
                <p className="text-3xl font-bold text-gray-900">{stats.activeBookings}</p>
              </div>

              <div className="bg-white rounded-lg shadow-md p-6">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-gray-600 font-medium">Total Revenue</h3>
                  <DollarSign className="w-6 h-6 text-green-700" />
                </div>
                <p className="text-3xl font-bold text-green-600">
                  ${stats.totalRevenue.toFixed(2)}
                </p>
              </div>
            </div>
          )}

          {/* Tabs */}
          <div className="bg-white rounded-lg shadow-md mb-8">
            <div className="flex border-b border-gray-200">
              <button
                onClick={() => setActiveTab('overview')}
                className={`px-6 py-3 font-medium ${
                  activeTab === 'overview'
                    ? 'text-blue-600 border-b-2 border-blue-600'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Overview
              </button>
              <button
                onClick={() => setActiveTab('pending')}
                className={`px-6 py-3 font-medium relative ${
                  activeTab === 'pending'
                    ? 'text-blue-600 border-b-2 border-blue-600'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Pending Parkings
                {pendingParkings.length > 0 && (
                  <span className="absolute -top-2 -right-1 bg-red-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                    {pendingParkings.length}
                  </span>
                )}
              </button>
              <button
                onClick={() => setActiveTab('users')}
                className={`px-6 py-3 font-medium ${
                  activeTab === 'users'
                    ? 'text-blue-600 border-b-2 border-blue-600'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Users
              </button>
              <button
                onClick={() => setActiveTab('parkings')}
                className={`px-6 py-3 font-medium ${
                  activeTab === 'parkings'
                    ? 'text-blue-600 border-b-2 border-blue-600'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Parkings
              </button>
            </div>

            {/* Tab Content */}
            <div className="p-6">
              {activeTab === 'pending' && (
                <div>
                  <h2 className="text-xl font-bold text-gray-900 mb-4">
                    Pending Parking Approvals ({pendingParkings.length})
                  </h2>
                  {pendingParkings.length === 0 ? (
                    <p className="text-gray-600">No pending parkings</p>
                  ) : (
                    <div className="space-y-4">
                      {pendingParkings.map((parking) => (
                        <div
                          key={parking.id}
                          className="border border-gray-200 rounded-lg p-4 flex justify-between items-start"
                        >
                          <div className="flex-1">
                            <h3 className="font-bold text-gray-900">{parking.name}</h3>
                            <p className="text-sm text-gray-600">
                              {parking.address}, {parking.city}
                            </p>
                            <p className="text-sm text-gray-600">
                              ${parking.price_per_hour}/hr • {parking.total_slots} slots
                            </p>
                          </div>
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleApproveParking(parking.id)}
                              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition text-sm"
                            >
                              Approve
                            </button>
                            <button
                              onClick={() => handleRejectParking(parking.id)}
                              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition text-sm"
                            >
                              Reject
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'users' && (
                <div>
                  <h2 className="text-xl font-bold text-gray-900 mb-4">All Users</h2>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="border-b border-gray-200">
                        <tr>
                          <th className="text-left py-2 px-4">Name</th>
                          <th className="text-left py-2 px-4">Email</th>
                          <th className="text-left py-2 px-4">Role</th>
                          <th className="text-left py-2 px-4">Bookings</th>
                          <th className="text-left py-2 px-4">Status</th>
                          <th className="text-left py-2 px-4">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {users.map((user) => (
                          <tr key={user.id} className="border-b border-gray-200 hover:bg-gray-50">
                            <td className="py-3 px-4">{user.full_name}</td>
                            <td className="py-3 px-4 text-gray-600">{user.email}</td>
                            <td className="py-3 px-4">
                              <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded capitalize text-xs">
                                {user.role}
                              </span>
                            </td>
                            <td className="py-3 px-4">{user.total_bookings}</td>
                            <td className="py-3 px-4">
                              {user.is_blocked ? (
                                <span className="px-2 py-1 bg-red-100 text-red-800 rounded text-xs">
                                  Blocked
                                </span>
                              ) : user.is_active ? (
                                <span className="px-2 py-1 bg-green-100 text-green-800 rounded text-xs">
                                  Active
                                </span>
                              ) : (
                                <span className="px-2 py-1 bg-gray-100 text-gray-800 rounded text-xs">
                                  Inactive
                                </span>
                              )}
                            </td>
                            <td className="py-3 px-4">
                              {!user.is_blocked && (
                                <button
                                  onClick={() => handleBlockUser(user.id)}
                                  className="text-red-600 hover:text-red-800 text-sm font-medium"
                                >
                                  Block
                                </button>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {activeTab === 'parkings' && (
                <div>
                  <h2 className="text-xl font-bold text-gray-900 mb-4">All Parkings</h2>
                  <div className="space-y-4">
                    {parkings.map((parking) => (
                      <div
                        key={parking.id}
                        className="border border-gray-200 rounded-lg p-4 flex justify-between items-start"
                      >
                        <div className="flex-1">
                          <h3 className="font-bold text-gray-900">{parking.name}</h3>
                          <p className="text-sm text-gray-600">
                            {parking.address}, {parking.city}
                          </p>
                          <p className="text-sm text-gray-600">
                            ${parking.price_per_hour}/hr • {parking.available_slots} of{' '}
                            {parking.total_slots} available
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-gray-900">
                            {parking.average_rating.toFixed(1)}⭐
                          </p>
                          <p className="text-xs text-gray-500">
                            {parking.is_approved ? 'Approved' : 'Pending'}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
};
