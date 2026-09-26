import { Link } from 'react-router'
import { Button } from '../components/ui/button'

function NotFoundPage() {
  return (
    <section className="mx-auto max-w-md space-y-4 py-16 text-center">
      <h2 className="font-heading text-2xl font-semibold">Page not found</h2>
      <p className="text-sm text-muted-foreground">
        The page you requested does not exist.
      </p>
      <Button asChild>
        <Link to="/">Return to dashboard</Link>
      </Button>
    </section>
  )
}

export default NotFoundPage
