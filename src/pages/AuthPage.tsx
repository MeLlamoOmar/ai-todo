import { Button } from '../components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '../components/ui/card';

function AuthPage() {
  return (
    <Card className="mx-auto max-w-md">
      <CardHeader>
        <CardTitle>Sign in</CardTitle>
        <CardDescription>
          Google sign-in will be available in a future update.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Button type="button" className="w-full" disabled>
          Continue with Google
        </Button>
      </CardContent>
    </Card>
  );
}

export default AuthPage;
