import { ArrowLeft } from 'lucide-react';
import { Link } from 'react-router';
import { ReactNode } from 'react';

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  backLink?: string;
  backLabel?: string;
  action?: ReactNode;
}

export function PageHeader({ title, subtitle, backLink, backLabel = 'Back', action }: PageHeaderProps) {
  return (
    <div>
      {backLink && (
        <Link
          to={backLink}
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          {backLabel}
        </Link>
      )}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl text-foreground mb-2">{title}</h1>
          {subtitle && (
            <p className="text-muted-foreground">{subtitle}</p>
          )}
        </div>
        {action && <div>{action}</div>}
      </div>
    </div>
  );
}
