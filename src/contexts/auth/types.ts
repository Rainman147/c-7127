
import { Session } from '@supabase/supabase-js';

export type AuthStatus = 
  | 'INITIALIZING'
  | 'AUTHENTICATED'
  | 'UNAUTHENTICATED';

export interface AuthState {
  status: AuthStatus;
  session: Session | null;
}

export interface AuthContextType extends AuthState {
  signOut: () => Promise<void>;
}
