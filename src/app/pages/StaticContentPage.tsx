import { Link } from 'react-router';
import { ReactNode } from 'react';
import { BrandMark } from '../components/BrandMark';

interface StaticContentPageProps {
  eyebrow: string;
  title: string;
  intro: string;
  children: ReactNode;
}

export function StaticContentPage({ eyebrow, title, intro, children }: StaticContentPageProps) {
  return (
    <div className="min-h-screen bg-background overflow-x-hidden">
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-10 w-[420px] h-[420px] bg-primary/15 rounded-full blur-[120px]" />
        <div className="absolute bottom-0 right-10 w-[420px] h-[420px] bg-secondary/15 rounded-full blur-[120px]" />
        <div className="absolute inset-0 bg-[linear-gradient(rgba(74,222,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(74,222,255,0.02)_1px,transparent_1px)] bg-[size:72px_72px] [mask-image:radial-gradient(ellipse_80%_50%_at_50%_50%,black,transparent)]" />
      </div>

      <nav className="relative z-10 border-b border-border-subtle bg-background/80 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3">
            <BrandMark size={40} roundedClassName="rounded-lg" />
            <div>
              <h1 className="text-xl tracking-tight text-foreground">Sloan</h1>
              <p className="text-xs text-muted-foreground font-mono">memecoin intelligence</p>
            </div>
          </Link>

          <Link
            to="/"
            className="px-4 py-2 rounded-lg border border-border hover:border-primary/40 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            Back to home
          </Link>
        </div>
      </nav>

      <main className="relative z-10 px-6 py-16">
        <div className="max-w-4xl mx-auto">
          <div className="mb-10">
            <p className="text-sm uppercase tracking-[0.18em] text-primary mb-4">{eyebrow}</p>
            <h1 className="text-4xl md:text-5xl text-foreground mb-4">{title}</h1>
            <p className="text-lg text-foreground-muted max-w-3xl leading-relaxed">{intro}</p>
          </div>

          <div className="rounded-3xl bg-card/40 backdrop-blur-sm border border-card-border p-8 md:p-10 space-y-10 text-foreground-muted leading-7">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
}
