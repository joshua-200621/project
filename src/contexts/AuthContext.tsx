import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { supabase } from '../lib/supabase';
import { User as SupabaseUser } from '@supabase/supabase-js';

export interface UserProfile {
  id: string;
  auth_id: string;
  email: string;
  full_name: string;
  phone_number: string | null;
  role: 'user' | 'owner' | 'admin';
  is_active: boolean;
  is_blocked: boolean;
  avatar_url: string | null;
  rating: number;
  total_bookings: number;
  created_at: string;
  updated_at: string;
}

interface AuthContextType {
  user: SupabaseUser | null;
  profile: UserProfile | null;
  loading: boolean;
  error: string | null;
  signUp: (email: string, password: string, fullName: string, role: string) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  isAuthenticated: boolean;
  hasRole: (roles: string[]) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        setUser(session.user);
        await fetchUserProfile(session.user.id);
      }
      setLoading(false);
    })();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        (async () => {
          if (session?.user) {
            setUser(session.user);
            await fetchUserProfile(session.user.id);
          } else {
            setUser(null);
            setProfile(null);
          }
          setLoading(false);
        })();
      }
    );

    return () => subscription?.unsubscribe();
  }, []);

  const fetchUserProfile = async (authId: string) => {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('auth_id', authId)
      .maybeSingle();

    if (error) {
      setError(error.message);
      return;
    }
    setProfile(data);
    setError(null);
  };

  const signUp = async (email: string, password: string, fullName: string, role: string) => {
    setError(null);
    setLoading(true);

    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
    });

    if (authError) {
      setError(authError.message);
      setLoading(false);
      throw authError;
    }

    if (!authData.user) {
      setError('Failed to create user');
      setLoading(false);
      throw new Error('Failed to create user');
    }

    const { error: profileError } = await supabase
      .from('users')
      .insert({
        auth_id: authData.user.id,
        email,
        full_name: fullName,
        role: role === 'owner' ? 'owner' : 'user',
      });

    if (profileError) {
      setError(profileError.message);
      setLoading(false);
      throw profileError;
    }

    setUser(authData.user);
    await fetchUserProfile(authData.user.id);
    setLoading(false);
  };

  const signIn = async (email: string, password: string) => {
    setError(null);
    setLoading(true);

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setError(error.message);
      setLoading(false);
      throw error;
    }

    if (data.user) {
      setUser(data.user);
      await fetchUserProfile(data.user.id);
    }

    setLoading(false);
  };

  const signOut = async () => {
    setError(null);
    const { error } = await supabase.auth.signOut();
    if (error) {
      setError(error.message);
      throw error;
    }
    setUser(null);
    setProfile(null);
  };

  const hasRole = (roles: string[]): boolean => {
    return profile ? roles.includes(profile.role) : false;
  };

  const value: AuthContextType = {
    user,
    profile,
    loading,
    error,
    signUp,
    signIn,
    signOut,
    isAuthenticated: !!user && !!profile && !profile.is_blocked,
    hasRole,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
