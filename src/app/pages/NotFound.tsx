import { Link } from 'react-router';
import { AlertCircle } from 'lucide-react';

export function NotFound() {
  return (
    <div className="flex items-center justify-center min-h-screen p-8">
      <div className="text-center">
        <AlertCircle className="w-16 h-16 text-primary mx-auto mb-4" />
        <h1 className="text-4xl mb-2">404</h1>
        <p className="text-xl text-muted-foreground mb-6">Page not found</p>
        <Link
          to="/dashboard"
          className="inline-block px-6 py-3 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-all"
        >
          Return to Command Center
        </Link>
      </div>
    </div>
  );
}
