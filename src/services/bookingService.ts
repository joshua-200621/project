import { supabase } from '../lib/supabase';

export interface Booking {
  id: string;
  user_id: string;
  parking_location_id: string;
  slot_id: string;
  start_time: string;
  end_time: string;
  status: 'active' | 'completed' | 'cancelled';
  total_duration: number;
  total_cost: number;
  vehicle_number: string;
  notes: string;
  created_at: string;
  updated_at: string;
}

export interface BookingWithDetails extends Booking {
  parking_location?: { name: string; address: string; price_per_hour: number };
  slot?: { slot_number: string };
}

const calculateDuration = (startTime: string, endTime: string): number => {
  const start = new Date(startTime).getTime();
  const end = new Date(endTime).getTime();
  return (end - start) / (1000 * 60 * 60);
};

export const bookingService = {
  // Create booking
  createBooking: async (
    parkingId: string,
    slotId: string,
    startTime: string,
    endTime: string,
    vehicleNumber: string,
    pricePerHour: number
  ): Promise<Booking> => {
    const { data: authData } = await supabase.auth.getSession();
    const userId = authData.session?.user?.id;

    if (!userId) throw new Error('Not authenticated');

    const duration = calculateDuration(startTime, endTime);
    const totalCost = duration * pricePerHour;

    const { data, error } = await supabase
      .from('bookings')
      .insert({
        user_id: userId,
        parking_location_id: parkingId,
        slot_id: slotId,
        start_time: startTime,
        end_time: endTime,
        total_duration: duration,
        total_cost: totalCost,
        vehicle_number: vehicleNumber,
        status: 'active',
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Get user bookings
  getUserBookings: async (): Promise<BookingWithDetails[]> => {
    const { data: authData } = await supabase.auth.getSession();
    const userId = authData.session?.user?.id;

    if (!userId) throw new Error('Not authenticated');

    const { data, error } = await supabase
      .from('bookings')
      .select(`
        *,
        parking_location:parking_location_id(name, address, price_per_hour),
        slot:slot_id(slot_number)
      `)
      .eq('user_id', userId)
      .order('start_time', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  // Get booking by ID
  getBookingById: async (id: string): Promise<BookingWithDetails | null> => {
    const { data, error } = await supabase
      .from('bookings')
      .select(`
        *,
        parking_location:parking_location_id(name, address, price_per_hour),
        slot:slot_id(slot_number)
      `)
      .eq('id', id)
      .maybeSingle();

    if (error) throw error;
    return data;
  },

  // Get parking bookings (for owner)
  getParkingBookings: async (parkingId: string): Promise<BookingWithDetails[]> => {
    const { data, error } = await supabase
      .from('bookings')
      .select(`
        *,
        parking_location:parking_location_id(name, address),
        slot:slot_id(slot_number)
      `)
      .eq('parking_location_id', parkingId)
      .order('start_time', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  // Cancel booking
  cancelBooking: async (bookingId: string): Promise<Booking> => {
    const { data, error } = await supabase
      .from('bookings')
      .update({ status: 'cancelled' })
      .eq('id', bookingId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Complete booking
  completeBooking: async (bookingId: string): Promise<Booking> => {
    const { data, error } = await supabase
      .from('bookings')
      .update({ status: 'completed' })
      .eq('id', bookingId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Get all bookings (admin)
  getAllBookings: async (limit: number = 100): Promise<BookingWithDetails[]> => {
    const { data, error } = await supabase
      .from('bookings')
      .select(`
        *,
        parking_location:parking_location_id(name),
        slot:slot_id(slot_number)
      `)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data || [];
  },

  // Get booking statistics
  getBookingStats: async (): Promise<{
    total: number;
    active: number;
    completed: number;
    cancelled: number;
  }> => {
    const { data, error } = await supabase
      .from('bookings')
      .select('status', { count: 'exact' });

    if (error) throw error;

    return {
      total: data?.length || 0,
      active: data?.filter(b => b.status === 'active').length || 0,
      completed: data?.filter(b => b.status === 'completed').length || 0,
      cancelled: data?.filter(b => b.status === 'cancelled').length || 0,
    };
  },
};
