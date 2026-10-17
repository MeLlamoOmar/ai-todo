import { useEffect, useState } from 'react';
import { Moon, Sun, WalletCards } from 'lucide-react';
import { Link, Outlet } from 'react-router';
import { useAuth } from './lib/authContext';
import { Button } from './components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from './components/ui/tooltip';

type Theme = 'light' | 'dark';

function getInitialTheme(): Theme {
  const savedTheme = window.localStorage.getItem('theme');

  if (savedTheme === 'light' || savedTheme === 'dark') {
    return savedTheme;
  }

  return window.matchMedia('(prefers-color-scheme: dark)').matches
    ? 'dark'
    : 'light';
}

function App() {
  const { user, signOut } = useAuth();
  const [theme, setTheme] = useState<Theme>(getInitialTheme);
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [signOutError, setSignOutError] = useState<string | null>(null);

  async function handleSignOut() {
    setIsSigningOut(true);
    setSignOutError(null);

    try {
      await signOut();
    } catch (error) {
      setSignOutError(error instanceof Error ? error.message : 'Please try again.');
    } finally {
      setIsSigningOut(false);
    }
  }

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
    window.localStorage.setItem('theme', theme);
  }, [theme]);

  return (
    <main className="min-h-svh bg-muted/30 px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl space-y-6">
        <header className="flex flex-wrap items-center justify-between gap-4">
          <Link
            to="/"
            className="flex items-center gap-3 rounded-lg focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
          >
            <div className="flex size-10 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm">
              <WalletCards className="size-5" aria-hidden="true" />
            </div>
            <div>
              <h1 className="font-heading text-xl font-semibold tracking-tight">
                Transaction Tracker
              </h1>
              <p className="text-sm text-muted-foreground">
                Keep your income and spending organized.
              </p>
            </div>
          </Link>

          <div className="flex items-center gap-2">
            {user && (
              <>
                <Button variant="outline" asChild>
                  <Link to="/integrations">Integrations</Link>
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  disabled={isSigningOut}
                  onClick={() => void handleSignOut()}
                >
                  {isSigningOut ? 'Signing out...' : 'Sign out'}
                </Button>
              </>
            )}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={() =>
                    setTheme((currentTheme) =>
                      currentTheme === 'dark' ? 'light' : 'dark',
                    )
                  }
                  aria-label={
                    theme === 'dark' ? 'Use light theme' : 'Use dark theme'
                  }
                >
                  {theme === 'dark' ? (
                    <Sun className="size-4" aria-hidden="true" />
                  ) : (
                    <Moon className="size-4" aria-hidden="true" />
                  )}
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                {theme === 'dark' ? 'Use light theme' : 'Use dark theme'}
              </TooltipContent>
            </Tooltip>
          </div>
        </header>

        {signOutError && (
          <p role="alert" className="text-sm text-destructive">
            Could not sign out. {signOutError}
          </p>
        )}
        <Outlet />
      </div>
    </main>
  );
}

export default App;
