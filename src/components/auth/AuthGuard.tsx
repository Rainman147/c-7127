
interface AuthGuardProps {
  children: React.ReactNode;
}

const AuthGuard = ({ children }: AuthGuardProps) => {
  return <>{children}</>;
};

export default AuthGuard;
