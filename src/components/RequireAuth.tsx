import { Link, Navigate } from 'react-router';
import DashboardPage from '../pages/DashboardPage';
import { useAuth } from '../lib/authContext';
import { Button } from './ui/button';

export default function RequireAuth() {
  const { user, isLoading, error, retry } = useAuth();

  if (isLoading) {
    return <p role="status">Checking your session...</p>;
  }

  if (error) {
    return (
      <div role="alert" className="space-y-3 rounded-xl border p-5">
        <p>Could not check your session. {error}</p>
        <div className="flex items-center gap-3">
          <Button type="button" variant="outline" onClick={retry}>Retry</Button>
          <Link to="/auth" className="text-sm underline">Go to sign in</Link>
        </div>
      </div>
    );
  }

  return user ? <DashboardPage key={user.id} /> : <Navigate to="/auth" replace />;
}
