
import { Session } from '@supabase/supabase-js';

export type AuthStatus = 
  | 'INITIALIZING'  // Initial loading state
  | 'AUTHENTICATED' // User is logged in
  | 'UNAUTHENTICATED'; // User is not logged in

export interface AuthState {
  status: AuthStatus;
  session: Session | null;
}

export interface AuthContextType extends AuthState {
  signOut: () => Promise<void>;
}
