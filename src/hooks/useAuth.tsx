import { useState, useEffect, createContext, useContext, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';

interface Profile {
  id: string;
  user_id: string;
  student_id: string | null;
  role: 'Voter' | 'Staff' | 'Administrator';
  full_name: string | null;
  email: string | null;
  registration_status: string | null;
  course: string | null;
  year_level: string | null;
  gender: string | null;
  id_image_url: string | null;
  two_factor_enabled: boolean | null;
  two_factor_secret: string | null;
  two_factor_recovery_codes: string[] | null;
  created_at: string;
  updated_at: string;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  loading: boolean;
  requiresTwoFactor: boolean;
  setRequiresTwoFactor: (requires: boolean) => void;
  signIn: (
    studentId: string,
    password: string,
    twoFactorCode?: string
  ) => Promise<{ error: any; requiresTwoFactor?: boolean }>;
  signUp: (
    email: string,
    studentId: string,
    password: string,
    fullName: string,
    additionalData?: any
  ) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
  refreshSession: () => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const navigate = useNavigate();
  const location = useLocation();

  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [requiresTwoFactor, setRequiresTwoFactor] = useState(false);

  // List of routes that do NOT require authentication (public pages)
  const publicPaths = [
    '/',
    '/about',
    '/faq',
    '/privacy',
    '/terms',
    '/verify',
    '/login',
    '/reset-password',
  ];

  // List of routes that require authentication (protected pages)
  // Only redirect if the current path is here when user is not logged in
  const protectedPaths = [
    '/dashboard',
    '/profile',
    '/settings',
    // Add any other routes you want protected
  ];

  const fetchProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error) {
        return;
      }
      setProfile(data);
    } catch {
      // ignore errors
    }
  };

  const refreshSession = async () => {
    try {
      const { data, error } = await supabase.auth.refreshSession();
      if (error) {
        console.error('Session refresh failed:', error);
        return false;
      }
      return true;
    } catch (error) {
      console.error('Session refresh error:', error);
      return false;
    }
  };

  useEffect(() => {
    let mounted = true;

    const handleSession = (s: Session | null) => {
      setSession(s);
      setUser(s?.user ?? null);

      if (s?.user) {
        // fetch profile asynchronously to avoid blocking
        setTimeout(() => {
          if (mounted) fetchProfile(s.user.id);
        }, 0);
      } else {
        setProfile(null);

        try {
          const currentPath = location.pathname;

          // Redirect to /login ONLY if current path is protected
          if (protectedPaths.includes(currentPath)) {
            navigate('/login', { replace: true });
          }
          // If currentPath is not in protectedPaths, don't redirect — e.g. NotFound page
        } catch {
          // ignore navigation errors (SSR/tests)
        }
      }

      setLoading(false);
    };

    // Initial session check
    supabase.auth.getSession().then(({ data: { session } }) => {
      handleSession(session ?? null);
    }).catch(() => {
      setLoading(false);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      handleSession(session ?? null);
    });

    return () => {
      mounted = false;
      try {
        listener?.subscription?.unsubscribe();
      } catch {
        // ignore unsubscribe errors
      }
    };
  }, [navigate, location.pathname]);

  const signIn = async (
    studentId: string,
    password: string,
    twoFactorCode?: string
  ) => {
    try {
      // Use security definer function to get email by student ID
      const { data: email, error: emailError } = await supabase.rpc(
        'get_email_by_student_id',
        { _student_id: studentId }
      );

      if (emailError || !email) {
        return { error: { message: 'Student ID not found' } };
      }

      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        return { error };
      }

      // Check 2FA requirement
      if (data.user) {
        const { data: profileData } = await supabase
          .from('profiles')
          .select('two_factor_enabled, role')
          .eq('user_id', data.user.id)
          .single();

        const requires2FA = profileData?.two_factor_enabled;

        if (requires2FA && !twoFactorCode) {
          await supabase.auth.signOut();
          setRequiresTwoFactor(true);
          return { error: null, requiresTwoFactor: true };
        }

        if (requires2FA && twoFactorCode) {
          // Use the new verification RPC
          const { data: isValid, error: verifyError } = await (supabase as any).rpc('verify_two_factor_code', {
            p_code: twoFactorCode
          } as any);

          if (verifyError || !isValid) {
            await supabase.auth.signOut();
            return { error: { message: 'Invalid 2FA code' } };
          }
        }
      }

      setRequiresTwoFactor(false);

      // Log login event with IP and user agent
      if (!error && data.user) {
        try {
          const userAgent = navigator.userAgent;

          let userIP: string | null = null;

          try {
            const ipResponse = await fetch('https://api.ipify.org?format=json', {
              method: 'GET',
              headers: { Accept: 'application/json' },
            });

            if (ipResponse.ok) {
              const ipData = await ipResponse.json();
              userIP = ipData.ip;
            } else {
              throw new Error('Primary IP service failed');
            }
          } catch {
            try {
              const fallbackResponse = await fetch('https://httpbin.org/ip');
              if (fallbackResponse.ok) {
                const fallbackData = await fallbackResponse.json();
                userIP = fallbackData.origin.split(',')[0].trim();
              }
            } catch {
              // all IP services failed
            }
          }

          await supabase.rpc('log_auth_event', {
            p_user_id: data.user.id,
            p_action: 'login',
            p_user_email: email,
            p_user_name: null,
            p_ip_address: userIP,
            p_user_agent: userAgent,
          });
        } catch {
          // ignore log errors
        }
      }

      return { error };
    } catch (error) {
      return { error };
    }
  };

  const signUp = async (
    email: string,
    studentId: string,
    password: string,
    fullName: string,
    additionalData?: any
  ) => {
    try {
      const redirectUrl = `${window.location.origin}/`;

      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: redirectUrl,
          data: {
            student_id: studentId,
            full_name: fullName,
            ...additionalData,
          },
        },
      });

      return { error };
    } catch (error) {
      return { error };
    }
  };

  const signOut = async () => {
    try {
      // Check if there is an active session
      const {
        data: { session: currentSession },
      } = await supabase.auth.getSession();

      if (!currentSession) {
        // No active session — no need to call signOut
        setUser(null);
        setSession(null);
        setProfile(null);
        navigate('/login', { replace: true });
        return;
      }

      // Optionally log logout event (you can keep your existing logging code here)
      if (user) {
        try {
          const userAgent = navigator.userAgent;

          let userIP: string | null = null;

          try {
            const ipResponse = await fetch('https://api.ipify.org?format=json', {
              method: 'GET',
              headers: { Accept: 'application/json' },
            });

            if (ipResponse.ok) {
              const ipData = await ipResponse.json();
              userIP = ipData.ip;
            }
          } catch {
            try {
              const fallbackResponse = await fetch('https://httpbin.org/ip');
              if (fallbackResponse.ok) {
                const fallbackData = await fallbackResponse.json();
                userIP = fallbackData.origin.split(',')[0].trim();
              }
            } catch {
              // ignore fallback errors
            }
          }

          await supabase.rpc('log_auth_event', {
            p_user_id: user.id,
            p_action: 'logout',
            p_user_email: null,
            p_user_name: null,
            p_ip_address: userIP,
            p_user_agent: userAgent,
          });
        } catch {
          // ignore logging errors
        }
      }

      // Call supabase signOut normally, without manually clearing tokens before
      await supabase.auth.signOut();

      // Clear local state after successful signOut
      setUser(null);
      setSession(null);
      setProfile(null);

      // Redirect to login
      navigate('/login', { replace: true });
    } catch (error: any) {
      // Handle missing session error gracefully
      if (error?.message?.includes('AuthSessionMissingError')) {
        setUser(null);
        setSession(null);
        setProfile(null);
        navigate('/login', { replace: true });
      } else {
        console.error('Logout exception:', error);
      }
    }
  };

  const value: AuthContextType = {
    user,
    session,
    profile,
    loading,
    requiresTwoFactor,
    setRequiresTwoFactor,
    signIn,
    signUp,
    signOut,
    refreshSession,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
