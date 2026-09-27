import { Link } from 'react-router';
import { Button } from '../components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '../components/ui/card';

function NotFoundPage() {
  return (
    <Card className="mx-auto max-w-md">
      <CardHeader>
        <CardTitle>Page not found</CardTitle>
        <CardDescription>The page you requested does not exist.</CardDescription>
      </CardHeader>
      <CardContent>
        <Button asChild>
          <Link to="/">Back to dashboard</Link>
        </Button>
      </CardContent>
    </Card>
  );
}

export default NotFoundPage;
