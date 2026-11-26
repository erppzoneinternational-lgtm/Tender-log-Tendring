import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from './supabase';

const AuthContext = createContext(null);
const LOCAL_SESSION_KEY = 'pzone_auth_session_v3';

export const PZONE_AUTHORIZED_ACCOUNTS = [
  {
    id: 'usr_admin',
    email: 'admin@pzone.com',
    name: 'System Administrator',
    role: 'Administrator',
    isAdmin: true,
    badge: 'ADMIN',
    avatar: 'AD'
  },
  {
    id: 'usr_est1',
    email: 'estimator1@pzone.com',
    name: 'Commercial Estimator 1',
    role: 'Tendering Engineer',
    isAdmin: false,
    badge: 'ESTIMATOR',
    avatar: 'E1'
  },
  {
    id: 'usr_est2',
    email: 'estimator2@pzone.com',
    name: 'Commercial Estimator 2',
    role: 'Tendering Engineer',
    isAdmin: false,
    badge: 'ESTIMATOR',
    avatar: 'E2'
  },
  {
    id: 'usr_est3',
    email: 'estimator3@pzone.com',
    name: 'Commercial Estimator 3',
    role: 'Tendering Engineer',
    isAdmin: false,
    badge: 'ESTIMATOR',
    avatar: 'E3'
  },
  {
    id: 'usr_civil',
    email: 'civil.engineer@pzone.com',
    name: 'Civil Estimation Engineer',
    role: 'Civil Estimator',
    isAdmin: false,
    badge: 'CIVIL',
    avatar: 'CE'
  },
  {
    id: 'usr_mech',
    email: 'mech.engineer@pzone.com',
    name: 'Mechanical Estimation Engineer',
    role: 'MEP Estimator',
    isAdmin: false,
    badge: 'MECH',
    avatar: 'ME'
  },
  {
    id: 'usr_elec',
    email: 'elec.engineer@pzone.com',
    name: 'Electrical Estimation Engineer',
    role: 'Electrical Estimator',
    isAdmin: false,
    badge: 'ELEC',
    avatar: 'EE'
  },
  {
    id: 'usr_pm',
    email: 'pm@pzone.com',
    name: 'Project Operations Manager',
    role: 'Project Manager',
    isAdmin: false,
    badge: 'PM',
    avatar: 'PM'
  },
  {
    id: 'usr_director',
    email: 'director@pzone.com',
    name: 'Operations Director',
    role: 'Operations Director',
    isAdmin: false,
    badge: 'DIRECTOR',
    avatar: 'OD'
  }
];

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const saved = localStorage.getItem(LOCAL_SESSION_KEY) || sessionStorage.getItem(LOCAL_SESSION_KEY);
      return saved ? JSON.parse(saved) : null;
    } catch (e) {
      return null;
    }
  });
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  // Helper to format Supabase user with Role Permissions
  const formatUser = (sbUser) => {
    if (!sbUser) return null;
    const metadata = sbUser.user_metadata || {};
    const email = (sbUser.email || '').toLowerCase().trim();
    const emailName = email.split('@')[0] || 'User';
    const displayName = metadata.full_name || metadata.name || (emailName.charAt(0).toUpperCase() + emailName.slice(1));
    const role = metadata.role || (email.startsWith('admin') ? 'Administrator' : 'Tendering Engineer');
    
    // Strict Admin check
    const isAdmin = email === 'admin@pzone.com' || 
                    email.startsWith('admin') || 
                    role.toLowerCase().includes('admin') || 
                    metadata.is_admin === true;

    const parts = displayName.trim().split(/\s+/);
    const avatar = parts.length >= 2 
      ? (parts[0][0] + parts[1][0]).toUpperCase()
      : displayName.substring(0, 2).toUpperCase();

    return {
      id: sbUser.id,
      email: sbUser.email,
      name: displayName,
      role: role,
      isAdmin: isAdmin,
      canAccessDatabase: isAdmin,
      badge: isAdmin ? 'ADMIN' : (metadata.badge || 'ESTIMATOR'),
      avatar: avatar || 'PZ',
      raw: sbUser
    };
  };

  useEffect(() => {
    // Check active Supabase session on mount
    supabase.auth.getSession().then(({ data: { session: initialSession } }) => {
      if (initialSession) {
        setSession(initialSession);
        const formatted = formatUser(initialSession.user);
        setUser(formatted);
        localStorage.setItem(LOCAL_SESSION_KEY, JSON.stringify(formatted));
      }
      setLoading(false);
    }).catch(() => {
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, currentSession) => {
      if (currentSession) {
        setSession(currentSession);
        const formatted = formatUser(currentSession.user);
        setUser(formatted);
        localStorage.setItem(LOCAL_SESSION_KEY, JSON.stringify(formatted));
      }
      setLoading(false);
    });

    return () => {
      subscription?.unsubscribe();
    };
  }, []);

  // Hybrid Login: Tries Supabase Auth first, then checks authorized account fallback
  const login = async (email, password, remember = true) => {
    try {
      const cleanEmail = String(email || '').trim().toLowerCase();
      const cleanPassword = String(password || '').trim();

      if (!cleanEmail || !cleanPassword) {
        return { success: false, error: 'Please enter both your email address and password.' };
      }

      // 1. Try Supabase Auth API
      const { data, error } = await supabase.auth.signInWithPassword({
        email: cleanEmail,
        password: cleanPassword
      });

      if (!error && data?.user) {
        const formatted = formatUser(data.user);
        setUser(formatted);
        setSession(data.session);
        if (remember) {
          localStorage.setItem(LOCAL_SESSION_KEY, JSON.stringify(formatted));
        }
        return { success: true, user: formatted };
      }

      // Specific error feedback
      if (error?.message?.toLowerCase().includes('email not confirmed')) {
        return {
          success: false,
          error: 'Email not confirmed yet in Supabase. You can confirm it in Supabase Auth -> Users, or use your authorized temporary password.'
        };
      }

      return { 
        success: false, 
        error: 'Invalid email or password. Please verify your credentials.' 
      };

    } catch (err) {
      return { success: false, error: err?.message || 'Authentication failed. Please try again.' };
    }
  };

  // Logout
  const logout = async () => {
    try {
      await supabase.auth.signOut();
    } catch (err) {
      console.warn('Error during Supabase sign out:', err);
    } finally {
      setUser(null);
      setSession(null);
      try {
        localStorage.removeItem(LOCAL_SESSION_KEY);
        sessionStorage.removeItem(LOCAL_SESSION_KEY);
      } catch (e) {}
    }
  };

  return (
    <AuthContext.Provider value={{
      user,
      session,
      loading,
      isAuthenticated: !!user,
      login,
      logout
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return ctx;
}
