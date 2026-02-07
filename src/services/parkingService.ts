import { supabase } from '../lib/supabase';

export interface ParkingLocation {
  id: string;
  owner_id: string;
  name: string;
  address: string;
  city: string;
  state: string;
  zip_code: string;
  latitude: number;
  longitude: number;
  total_slots: number;
  available_slots: number;
  price_per_hour: number;
  description: string;
  amenities: string[];
  operating_hours: { open: string; close: string };
  is_approved: boolean;
  is_active: boolean;
  average_rating: number;
  total_reviews: number;
  created_at: string;
  updated_at: string;
}

export interface ParkingSlot {
  id: string;
  parking_location_id: string;
  slot_number: string;
  slot_type: 'standard' | 'compact' | 'premium' | 'handicap';
  is_available: boolean;
  is_active: boolean;
}

export const parkingService = {
  // Search parkings by city and filters
  searchParkings: async (
    city: string,
    maxPrice?: number,
    limit: number = 20
  ): Promise<ParkingLocation[]> => {
    let query = supabase
      .from('parking_locations')
      .select('*')
      .eq('city', city)
      .eq('is_approved', true)
      .eq('is_active', true)
      .order('average_rating', { ascending: false });

    if (maxPrice) {
      query = query.lte('price_per_hour', maxPrice);
    }

    const { data, error } = await query.limit(limit);
    if (error) throw error;
    return data || [];
  },

  // Get parking by ID
  getParkingById: async (id: string): Promise<ParkingLocation | null> => {
    const { data, error } = await supabase
      .from('parking_locations')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (error) throw error;
    return data;
  },

  // Get all parkings for owner
  getOwnerParkings: async (ownerId: string): Promise<ParkingLocation[]> => {
    const { data, error } = await supabase
      .from('parking_locations')
      .select('*')
      .eq('owner_id', ownerId);

    if (error) throw error;
    return data || [];
  },

  // Create new parking location
  createParking: async (parking: Partial<ParkingLocation>): Promise<ParkingLocation> => {
    const { data, error } = await supabase
      .from('parking_locations')
      .insert(parking)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Update parking location
  updateParking: async (
    id: string,
    updates: Partial<ParkingLocation>
  ): Promise<ParkingLocation> => {
    const { data, error } = await supabase
      .from('parking_locations')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Get slots for parking
  getSlots: async (parkingId: string): Promise<ParkingSlot[]> => {
    const { data, error } = await supabase
      .from('parking_slots')
      .select('*')
      .eq('parking_location_id', parkingId);

    if (error) throw error;
    return data || [];
  },

  // Check slot availability
  checkSlotAvailability: async (
    slotId: string,
    startTime: string,
    endTime: string
  ): Promise<boolean> => {
    const { data, error } = await supabase
      .from('bookings')
      .select('id')
      .eq('slot_id', slotId)
      .eq('status', 'active')
      .gt('end_time', startTime)
      .lt('start_time', endTime);

    if (error) throw error;
    return (data?.length || 0) === 0;
  },

  // Get available slots for a time range
  getAvailableSlots: async (
    parkingId: string,
    startTime: string,
    endTime: string
  ): Promise<ParkingSlot[]> => {
    const { data: slots, error: slotsError } = await supabase
      .from('parking_slots')
      .select('*')
      .eq('parking_location_id', parkingId)
      .eq('is_active', true);

    if (slotsError) throw slotsError;

    const availableSlots: ParkingSlot[] = [];

    for (const slot of slots || []) {
      const isAvailable = await parkingService.checkSlotAvailability(
        slot.id,
        startTime,
        endTime
      );
      if (isAvailable) {
        availableSlots.push(slot);
      }
    }

    return availableSlots;
  },

  // Get all approved parkings (admin)
  getAllParkings: async (limit: number = 50): Promise<ParkingLocation[]> => {
    const { data, error } = await supabase
      .from('parking_locations')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data || [];
  },

  // Get pending parkings (admin)
  getPendingParkings: async (): Promise<ParkingLocation[]> => {
    const { data, error } = await supabase
      .from('parking_locations')
      .select('*')
      .eq('is_approved', false)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  // Approve parking (admin)
  approveParkings: async (id: string): Promise<void> => {
    const { error } = await supabase
      .from('parking_locations')
      .update({ is_approved: true })
      .eq('id', id);

    if (error) throw error;
  },

  // Reject parking (admin)
  rejectParking: async (id: string): Promise<void> => {
    const { error } = await supabase
      .from('parking_locations')
      .update({ is_active: false })
      .eq('id', id);

    if (error) throw error;
  },
};
