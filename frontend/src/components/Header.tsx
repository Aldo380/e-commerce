import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { useGetCallerUserProfile, useIsCallerAdmin } from '../hooks/useQueries';
import { useQueryClient } from '@tanstack/react-query';
import { useNavigate } from '@tanstack/react-router';
import { Button } from '@/components/ui/button';
import { ShoppingCart, User, Shield, Heart } from 'lucide-react';
import { useCartStore } from '../lib/cartStore';

export default function Header() {
  const { login, clear, loginStatus, identity } = useInternetIdentity();
  const { data: userProfile } = useGetCallerUserProfile();
  const { data: isAdmin } = useIsCallerAdmin();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const cartItemCount = useCartStore((state) => state.getItemCount());

  const isAuthenticated = !!identity;
  const disabled = loginStatus === 'logging-in';
  const buttonText = loginStatus === 'logging-in' ? 'Logging in...' : isAuthenticated ? 'Logout' : 'Login';

  const handleAuth = async () => {
    if (isAuthenticated) {
      await clear();
      queryClient.clear();
      navigate({ to: '/' });
    } else {
      try {
        await login();
      } catch (error: any) {
        console.error('Login error:', error);
        if (error.message === 'User is already authenticated') {
          await clear();
          setTimeout(() => login(), 300);
        }
      }
    }
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between">
        <div className="flex items-center gap-6">
          <button
            onClick={() => navigate({ to: '/' })}
            className="flex items-center gap-2 text-xl font-bold hover:opacity-80 transition-opacity"
          >
            <span className="text-primary">Shop</span>
            <span>ICP</span>
          </button>
        </div>

        <nav className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate({ to: '/donate' })}
            className="gap-2"
          >
            <Heart className="h-4 w-4 fill-destructive text-destructive" />
            <span className="hidden sm:inline">Donate</span>
          </Button>

          {isAuthenticated && (
            <>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate({ to: '/orders' })}
                className="gap-2"
              >
                <User className="h-4 w-4" />
                <span className="hidden sm:inline">Orders</span>
              </Button>

              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate({ to: '/cart' })}
                className="gap-2 relative"
              >
                <ShoppingCart className="h-4 w-4" />
                {cartItemCount > 0 && (
                  <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center">
                    {cartItemCount}
                  </span>
                )}
                <span className="hidden sm:inline">Cart</span>
              </Button>

              {isAdmin && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => navigate({ to: '/admin' })}
                  className="gap-2"
                >
                  <Shield className="h-4 w-4" />
                  <span className="hidden sm:inline">Admin</span>
                </Button>
              )}

              {userProfile && (
                <span className="text-sm text-muted-foreground hidden md:inline">
                  {userProfile.name}
                </span>
              )}
            </>
          )}

          <Button onClick={handleAuth} disabled={disabled} size="sm">
            {buttonText}
          </Button>
        </nav>
      </div>
    </header>
  );
}
