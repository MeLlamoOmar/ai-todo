import { useState } from 'react';
import { Navigate } from 'react-router';
import { useAuth } from '../lib/authContext';
import { getSupabaseClient } from '../lib/supabaseClient';
import { Button } from '../components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '../components/ui/card';

function AuthPage() {
  const { user, isLoading, error } = useAuth();
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [signInError, setSignInError] = useState<string | null>(null);

  async function signIn() {
    setSignInError(null);
    setIsSigningIn(true);

    try {
      const { error } = await getSupabaseClient().auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo: `${window.location.origin}/auth` },
      });
      if (error) throw error;
    } catch (error) {
      setSignInError(error instanceof Error ? error.message : 'Please try again.');
      setIsSigningIn(false);
    }
  }

  if (!isLoading && user) return <Navigate to="/" replace />;

  return (
    <Card className="mx-auto max-w-md">
      <CardHeader>
        <CardTitle>Sign in</CardTitle>
        <CardDescription>
          Sign in with Google to manage your own transactions.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {isLoading && <p role="status">Checking your session...</p>}
        {(signInError || error) && (
          <p role="alert" className="text-sm text-destructive">
            Could not sign in. {signInError || error}
          </p>
        )}
        <Button
          type="button"
          className="w-full"
          disabled={isLoading || isSigningIn}
          onClick={() => void signIn()}
        >
          {isSigningIn ? 'Redirecting to Google...' : 'Continue with Google'}
        </Button>
      </CardContent>
    </Card>
  );
}

export default AuthPage;
