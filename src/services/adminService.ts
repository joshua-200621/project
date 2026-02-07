import { supabase } from '../lib/supabase';

export interface AdminStats {
  totalUsers: number;
  totalOwners: number;
  totalParkings: number;
  approvedParkings: number;
  pendingParkings: number;
  totalBookings: number;
  activeBookings: number;
  totalRevenue: number;
}

export interface UserStats {
  id: string;
  email: string;
  full_name: string;
  role: string;
  is_active: boolean;
  is_blocked: boolean;
  total_bookings: number;
  rating: number;
}

export const adminService = {
  // Get all users (admin)
  getAllUsers: async (limit: number = 100): Promise<UserStats[]> => {
    const { data, error } = await supabase
      .from('users')
      .select('id, email, full_name, role, is_active, is_blocked, total_bookings, rating')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data || [];
  },

  // Block user (admin)
  blockUser: async (userId: string): Promise<void> => {
    const { error } = await supabase
      .from('users')
      .update({ is_blocked: true })
      .eq('id', userId);

    if (error) throw error;
  },

  // Unblock user (admin)
  unblockUser: async (userId: string): Promise<void> => {
    const { error } = await supabase
      .from('users')
      .update({ is_blocked: false })
      .eq('id', userId);

    if (error) throw error;
  },

  // Get dashboard statistics
  getDashboardStats: async (): Promise<AdminStats> => {
    const [
      usersRes,
      ownersRes,
      parkingsRes,
      approvedRes,
      pendingRes,
      bookingsRes,
      activeBookingsRes,
      paymentsRes,
    ] = await Promise.all([
      supabase.from('users').select('id', { count: 'exact' }),
      supabase.from('users').select('id', { count: 'exact' }).eq('role', 'owner'),
      supabase.from('parking_locations').select('id', { count: 'exact' }),
      supabase
        .from('parking_locations')
        .select('id', { count: 'exact' })
        .eq('is_approved', true),
      supabase
        .from('parking_locations')
        .select('id', { count: 'exact' })
        .eq('is_approved', false),
      supabase.from('bookings').select('id', { count: 'exact' }),
      supabase
        .from('bookings')
        .select('id', { count: 'exact' })
        .eq('status', 'active'),
      supabase
        .from('payments')
        .select('amount')
        .eq('status', 'success'),
    ]);

    const totalRevenue = (paymentsRes.data || []).reduce((sum, p) => sum + p.amount, 0);

    return {
      totalUsers: usersRes.count || 0,
      totalOwners: ownersRes.count || 0,
      totalParkings: parkingsRes.count || 0,
      approvedParkings: approvedRes.count || 0,
      pendingParkings: pendingRes.count || 0,
      totalBookings: bookingsRes.count || 0,
      activeBookings: activeBookingsRes.count || 0,
      totalRevenue,
    };
  },

  // Get system activity logs
  getActivityLogs: async (limit: number = 50): Promise<Array<{
    id: string;
    user_id: string;
    parking_location_id: string;
    status: string;
    created_at: string;
  }>> => {
    const { data, error } = await supabase
      .from('bookings')
      .select('id, user_id, parking_location_id, status, created_at')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data || [];
  },
};
