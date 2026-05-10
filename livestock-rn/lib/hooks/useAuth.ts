import { useEffect, useState, useCallback } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '../supabase';
import type { Profile } from '../../types/database';

interface AuthState {
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  loading: boolean;
}

let globalState: AuthState = {
  session: null,
  user: null,
  profile: null,
  loading: true,
};

let listeners: ((state: AuthState) => void)[] = [];
let initialized = false;

const notifyListeners = () => {
  listeners.forEach((l) => l({ ...globalState }));
};

const fetchProfile = async (userId: string): Promise<Profile | null> => {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();

  if (error) {
    console.error('Error fetching profile:', error.message);
    return null;
  }

  if (data) {
    return {
      ...data,
      role: (data.role as string)?.toLowerCase() as Profile['role']
    } as Profile;
  }
  return null;
};

// Initialize global listener
if (!initialized && typeof window !== 'undefined') {
  initialized = true;
  
  // Initial session fetch
  supabase.auth.getSession().then(async ({ data: { session } }) => {
    if (session?.user) {
      const profile = await fetchProfile(session.user.id);
      globalState = { session, user: session.user, profile, loading: false };
    } else {
      globalState = { ...globalState, loading: false };
    }
    notifyListeners();
  });

  // Listen for changes
  supabase.auth.onAuthStateChange(async (event, session) => {
    console.log('Auth event:', event);
    if (event === 'SIGNED_OUT') {
      globalState = { session: null, user: null, profile: null, loading: false };
    } else if (session?.user) {
      const profile = await fetchProfile(session.user.id);
      globalState = { session, user: session.user, profile, loading: false };
    } else {
      globalState = { session: null, user: null, profile: null, loading: false };
    }
    notifyListeners();
  });
}

export function useAuth() {
  const [state, setState] = useState<AuthState>(globalState);

  useEffect(() => {
    const listener = (newState: AuthState) => {
      setState(newState);
    };
    listeners.push(listener);
    // Sync with current state
    setState({ ...globalState });
    
    return () => {
      listeners = listeners.filter((l) => l !== listener);
    };
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
  }, []);

  const signUp = useCallback(async (
    email: string,
    password: string,
    metadata: {
      first_name: string;
      last_name: string;
      role?: string;
      gender?: string;
      birth_date?: string;
      purok?: string;
      barangay?: string;
      municipality?: string;
      zip_code?: string;
    }
  ) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          first_name: metadata.first_name,
          last_name: metadata.last_name,
          role: metadata.role || 'farmer',
          gender: metadata.gender,
          birth_date: metadata.birth_date,
          purok: metadata.purok,
          barangay: metadata.barangay,
          municipality: metadata.municipality || 'Quezon',
          zip_code: metadata.zip_code || '8715',
        },
      },
    });
    if (error) throw error;
    return data;
  }, []);

  const signOut = useCallback(async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  }, []);

  const refreshProfile = useCallback(async () => {
    if (!state.user) return;
    const profile = await fetchProfile(state.user.id);
    globalState = { ...globalState, profile };
    notifyListeners();
  }, [state.user]);

  const resetPassword = useCallback(async (email: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email);
    if (error) throw error;
  }, []);

  const verifyResetOtp = useCallback(async (email: string, token: string) => {
    const { error } = await supabase.auth.verifyOtp({
      email,
      token,
      type: 'recovery',
    });
    if (error) throw error;
  }, []);

  const updatePassword = useCallback(async (password: string) => {
    const { error } = await supabase.auth.updateUser({ password });
    if (error) throw error;
  }, []);

  return {
    ...state,
    signIn,
    signUp,
    signOut,
    resetPassword,
    verifyResetOtp,
    updatePassword,
    refreshProfile,
  };
}

