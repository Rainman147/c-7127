
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/auth/AuthContext';
import { useToast } from '@/hooks/use-toast';

export const withAuth = <P extends object>(
  WrappedComponent: React.ComponentType<P>
) => {
  return function WithAuthComponent(props: P) {
    const { session, status } = useAuth();
    const navigate = useNavigate();
    const { toast } = useToast();

    useEffect(() => {
      if (status === 'UNAUTHENTICATED') {
        console.log('[withAuth] No session found, redirecting to auth');
        toast({
          title: "Authentication required",
          description: "Please sign in to continue",
          variant: "destructive",
        });
        navigate('/auth');
      }
    }, [status, navigate, toast]);

    if (status === 'INITIALIZING' || status === 'CHECKING_SESSION') {
      return (
        <div className="flex h-screen items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-200" />
        </div>
      );
    }

    if (!session) {
      return null;
    }

    return <WrappedComponent {...props} />;
  };
};
