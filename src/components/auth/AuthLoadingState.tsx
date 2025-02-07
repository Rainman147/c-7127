
import { Loader2 } from 'lucide-react';

const AuthLoadingState = () => {
  return (
    <div className="flex h-screen items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground">Checking authentication...</p>
      </div>
    </div>
  );
};

export default AuthLoadingState;
