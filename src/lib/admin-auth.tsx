/**
 * Admin Auth Context - React Context for Admin Authentication.
 */

import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { type User } from '@supabase/supabase-js';
import { supabase } from './supabase';

type SignInResult =
  | { readonly success: true; readonly user: User }
  | { readonly success: false; readonly error: string };

interface AuthContextValue {
  readonly user: User | null;
  readonly isLoading: boolean;
  readonly isAdmin: boolean;
  readonly isAuthenticated: boolean;
  readonly signIn: (email: string, password: string) => Promise<SignInResult>;
  readonly signOut: () => Promise<void>;
}

interface AuthProviderProps {
  readonly children: ReactNode;
}

const AuthContext = createContext<AuthContextValue | null>(null);

function hasAdminRole(authUser: User | null): boolean {
  if (!authUser) return false;

  const userRole = authUser.user_metadata?.role;
  const hasAdminClaim = authUser.app_metadata?.claims_admin;

  return userRole === 'admin' || hasAdminClaim === true;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  const applyAdminRole = useCallback((authUser: User | null): boolean => {
    const nextIsAdmin = hasAdminRole(authUser);
    setIsAdmin(nextIsAdmin);
    return nextIsAdmin;
  }, []);

  useEffect(() => {
    let isMounted = true;

    void supabase.auth.getSession().then(({ data: { session }, error }) => {
      if (!isMounted) return;

      if (error) {
        setUser(null);
        setIsAdmin(false);
        setIsLoading(false);
        return;
      }

      const nextUser = session?.user ?? null;
      setUser(nextUser);
      applyAdminRole(nextUser);
      setIsLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      const nextUser = session?.user ?? null;
      setUser(nextUser);
      applyAdminRole(nextUser);
      setIsLoading(false);
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, [applyAdminRole]);

  const signIn = useCallback(
    async (email: string, password: string): Promise<SignInResult> => {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });

      if (error) return { success: false, error: error.message };

      const signedInUser = data.user;
      setUser(signedInUser);
      applyAdminRole(signedInUser);

      return { success: true, user: signedInUser };
    },
    [applyAdminRole],
  );

  const signOut = useCallback(async (): Promise<void> => {
    await supabase.auth.signOut();
    setUser(null);
    setIsAdmin(false);
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      isLoading,
      isAdmin,
      isAuthenticated: Boolean(user),
      signIn,
      signOut,
    }),
    [isAdmin, isLoading, signIn, signOut, user],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }

  return context;
}
