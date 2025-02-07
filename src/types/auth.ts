
export type AuthStatus = 
  | 'INITIALIZING'
  | 'CHECKING_SESSION'
  | 'AUTHENTICATED'
  | 'REFRESHING_TOKEN'
  | 'RECOVERING_SESSION'
  | 'UNAUTHENTICATED'
  | 'ERROR';

export interface AuthError {
  code: string;
  message: string;
  recoverable: boolean;
}

export interface AuthState {
  status: AuthStatus;
  session: Session | null;
  error: AuthError | null;
}
