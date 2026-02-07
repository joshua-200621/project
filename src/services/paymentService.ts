import { supabase } from '../lib/supabase';

export interface Payment {
  id: string;
  booking_id: string;
  user_id: string;
  amount: number;
  payment_method: 'card' | 'wallet' | 'upi';
  status: 'pending' | 'success' | 'failed';
  transaction_id: string;
  payment_gateway: string;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export const paymentService = {
  // Create payment (simulate payment processing)
  processPayment: async (
    bookingId: string,
    amount: number,
    paymentMethod: string = 'card'
  ): Promise<Payment> => {
    const { data: authData } = await supabase.auth.getSession();
    const userId = authData.session?.user?.id;

    if (!userId) throw new Error('Not authenticated');

    // Simulate payment processing
    const isSuccessful = Math.random() > 0.1;
    const transactionId = `TXN-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    const { data, error } = await supabase
      .from('payments')
      .insert({
        booking_id: bookingId,
        user_id: userId,
        amount,
        payment_method: paymentMethod,
        status: isSuccessful ? 'success' : 'failed',
        transaction_id: transactionId,
        payment_gateway: 'simulated',
        metadata: {
          simulated: true,
          processedAt: new Date().toISOString(),
        },
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Get payment by booking
  getPaymentByBooking: async (bookingId: string): Promise<Payment | null> => {
    const { data, error } = await supabase
      .from('payments')
      .select('*')
      .eq('booking_id', bookingId)
      .maybeSingle();

    if (error) throw error;
    return data;
  },

  // Get user payments
  getUserPayments: async (): Promise<Payment[]> => {
    const { data: authData } = await supabase.auth.getSession();
    const userId = authData.session?.user?.id;

    if (!userId) throw new Error('Not authenticated');

    const { data, error } = await supabase
      .from('payments')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  // Get all payments (admin)
  getAllPayments: async (limit: number = 100): Promise<Payment[]> => {
    const { data, error } = await supabase
      .from('payments')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data || [];
  },

  // Get payment statistics
  getPaymentStats: async (): Promise<{
    totalRevenue: number;
    successfulPayments: number;
    failedPayments: number;
  }> => {
    const { data, error } = await supabase
      .from('payments')
      .select('amount, status');

    if (error) throw error;

    return {
      totalRevenue: data
        ?.filter(p => p.status === 'success')
        .reduce((sum, p) => sum + p.amount, 0) || 0,
      successfulPayments: data?.filter(p => p.status === 'success').length || 0,
      failedPayments: data?.filter(p => p.status === 'failed').length || 0,
    };
  },
};
