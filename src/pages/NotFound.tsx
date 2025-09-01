import { useLocation } from "react-router-dom";
import { useEffect } from "react";
import { Button } from '@/components/ui/button';

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname
    );
  }, [location.pathname]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-primary/5 mobile-full-height">
      <div className="text-center space-y-4 sm:space-y-6 max-w-md px-4 md:px-8 w-full">
        <div className="space-y-3 sm:space-y-4">
          <h1 className="text-5xl sm:text-6xl md:text-8xl font-bold text-primary leading-none">404</h1>
          <h2 className="text-lg sm:text-xl md:text-2xl font-semibold text-foreground">Page not found</h2>
          <p className="text-sm md:text-base text-muted-foreground px-2">
            The page you're looking for doesn't exist or has been moved.
          </p>
        </div>
        <Button 
          onClick={() => window.location.href = '/'}
          className="px-6 md:px-8 py-3 w-full sm:w-auto min-h-[48px] touch-manipulation"
          size="lg"
        >
          Return to Home
        </Button>
      </div>
    </div>
  );
};

export default NotFound;
