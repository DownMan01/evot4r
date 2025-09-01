
import { LoginForm } from '@/components/LoginForm';
import { Check } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useEffect, useMemo, useRef } from 'react';
import { useAuth } from '@/hooks/useAuth';
import TypingDescription from '@/components/TypingDescription';

const Login = () => {
  const navigate = useNavigate();
  const { user, loading, requiresTwoFactor } = useAuth();
  const navigatedRef = useRef(false);

  const floatingCircles = useMemo(() => (
    Array.from({ length: 15 }).map((_, i) => {
      const size = 60 + (i % 3) * 20;
      return {
        size,
        top: Math.random() * 100,
        animationDelay: i * 2,
        duration: 20 + (i % 5) * 5,
      };
    })
  ), []);

  const ambientCircles = useMemo(() => (
    Array.from({ length: 8 }).map((_, i) => {
      const size = 40 + (i % 2) * 30;
      return {
        size,
        left: Math.random() * 100,
        top: Math.random() * 100,
        animationDelay: i * 3,
        duration: 25 + i * 2,
      };
    })
  ), []);

  // Redirect authenticated users to dashboard
  useEffect(() => {
    if (!loading && user && !requiresTwoFactor && !navigatedRef.current) {
      navigatedRef.current = true;
      const t = setTimeout(() => {
        navigate('/dashboard');
      }, 500); // small delay prevents flicker when 2FA forces sign-out
      return () => clearTimeout(t);
    }
  }, [user, loading, requiresTwoFactor, navigate]);

  // Show loading state while checking authentication
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary via-primary-600 to-primary-700">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-2 border-primary-foreground/20 border-t-primary-foreground mx-auto"></div>
          <p className="text-primary-foreground text-lg font-medium">Checking authentication...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Enhanced Animated Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary via-primary-600 to-primary-700">
        {/* Perfect floating circles with checkmarks */}
        <div className="absolute inset-0 overflow-hidden">
          {floatingCircles.map((item, i) => (
            <div
              key={`floating-circle-${i}`}
              className="absolute bg-primary-foreground/10 rounded-full flex items-center justify-center animate-gentle-float"
              style={{
                width: `${item.size}px`,
                height: `${item.size}px`,
                left: `-${item.size}px`,
                top: `${item.top}%`,
                animationDelay: `${item.animationDelay}s`,
                '--duration': `${item.duration}s`,
              } as React.CSSProperties}
            >
              <Check 
                className="text-primary-foreground/50" 
                size={item.size * 0.3}
              />
            </div>
          ))}
        </div>
        
        {/* Additional ambient floating circles */}
        <div className="absolute inset-0">
          {ambientCircles.map((item, i) => (
            <div
              key={`ambient-circle-${i}`}
              className="absolute bg-primary-foreground/5 rounded-full flex items-center justify-center animate-fade-float"
              style={{
                width: `${item.size}px`,
                height: `${item.size}px`,
                left: `${item.left}%`,
                top: `${item.top}%`,
                animationDelay: `${item.animationDelay}s`,
                '--duration': `${item.duration}s`,
              } as React.CSSProperties}
            >
              <Check 
                className="text-primary-foreground/30" 
                size={item.size * 0.25}
              />
            </div>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="relative z-10 min-h-screen flex flex-col lg:flex-row">
        {/* Mobile: Compact Header */}
        <div className="lg:hidden flex flex-col items-center justify-center px-6 pt-12 pb-8">
          <h1 className="text-4xl font-krona text-primary-foreground mb-3 tracking-tight">
            evotar
          </h1>
          <div className="h-20 flex items-center justify-center text-center w-full max-w-md">
            <TypingDescription />
          </div>
        </div>

        {/* Desktop: Left side - Branding */}
        <div className="hidden lg:flex flex-1 items-center justify-end px-16 py-0">
          <div className="text-left max-w-md w-full">
            <h1 className="text-6xl font-krona text-primary-foreground mb-6 tracking-tight">
              evotar
            </h1>
            <div className="min-h-[64px]">
              <TypingDescription />
            </div>
          </div>
        </div>

        {/* Login Form - Mobile optimized */}
        <div className="flex-1 flex items-center justify-center lg:justify-start px-6 md:px-8 pb-8 lg:pb-0">
          <LoginForm />
        </div>
      </div>

      {/* White Footer */}
      <footer className="absolute bottom-0 left-0 right-0 bg-background border-t z-20">
        <div className="hidden lg:flex justify-center space-x-6 py-4 text-sm text-muted-foreground">
          <button onClick={() => navigate('/about')} className="hover:text-primary transition-colors">About</button>
          <button onClick={() => navigate('/faq')} className="hover:text-primary transition-colors">FAQ</button>
          <button onClick={() => navigate('/privacy')} className="hover:text-primary transition-colors">Privacy</button>
          <button onClick={() => navigate('/terms')} className="hover:text-primary transition-colors">Terms</button>
          <span className="text-muted-foreground/70">Evotar © 2025</span>
        </div>
      </footer>
    </div>
  );
};

export default Login;
