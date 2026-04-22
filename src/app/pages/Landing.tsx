import { ArrowRight, Brain, Shield, Target, TrendingUp, Users, Zap } from 'lucide-react';
import { Link } from 'react-router';
import type { ReactNode } from 'react';
import { useAuth } from '../auth/AuthContext';

const productCards = [
  {
    icon: Brain,
    title: 'Command Center',
    description: 'Track what is heating up, what is still early, and what deserves action now.',
  },
  {
    icon: Target,
    title: 'Prophet League',
    description: 'Turn passive watching into real conviction with structured token calls.',
  },
  {
    icon: Zap,
    title: 'Launch Forge',
    description: 'Generate stronger meme identity, better tickers, and sharper launch language.',
  },
  {
    icon: TrendingUp,
    title: 'Raid Studio',
    description: 'Create posts, replies, and raid angles built for real meme culture.',
  },
  {
    icon: Users,
    title: 'Quest Arena',
    description: 'Run smarter quests based on what a token actually needs right now.',
  },
  {
    icon: Shield,
    title: 'Passport & Mirror',
    description: 'Track your activity, review your behavior, and learn from missed moves.',
  },
];

function FooterLink({ to, children }: { to: string; children: ReactNode }) {
  return (
    <Link to={to} className="block text-sm text-muted-foreground hover:text-foreground transition-colors">
      {children}
    </Link>
  );
}

export function Landing() {
  const { isAuthenticated } = useAuth();
  const launchHref = isAuthenticated ? '/dashboard' : '/auth?next=/dashboard';

  return (
    <div className="min-h-screen bg-background overflow-x-hidden">
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 -left-4 w-[500px] h-[500px] bg-primary/20 rounded-full mix-blend-multiply filter blur-[128px] animate-blob" />
        <div className="absolute top-0 -right-4 w-[500px] h-[500px] bg-secondary/20 rounded-full mix-blend-multiply filter blur-[128px] animate-blob animation-delay-2000" />
        <div className="absolute -bottom-8 left-20 w-[500px] h-[500px] bg-primary/10 rounded-full mix-blend-multiply filter blur-[128px] animate-blob animation-delay-4000" />
        <div className="absolute inset-0 bg-[linear-gradient(rgba(74,222,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(74,222,255,0.03)_1px,transparent_1px)] bg-[size:72px_72px] [mask-image:radial-gradient(ellipse_80%_50%_at_50%_50%,black,transparent)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(74,222,255,0.15),transparent)]" />
      </div>

      <nav className="relative z-10 border-b border-border-subtle bg-background/80 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary via-secondary to-primary bg-[length:200%_200%] animate-gradient flex items-center justify-center">
              <Zap className="w-5 h-5 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-xl tracking-tight text-foreground">Sloan</h1>
              <p className="text-xs text-muted-foreground font-mono">memecoin intelligence</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <a href="#product" className="block text-sm text-muted-foreground hover:text-foreground transition-colors">
              Product
            </a>
            <Link
              to="/roadmap"
              className="block text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Roadmap
            </Link>
            <Link
              to={launchHref}
              className="px-4 py-2 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 transition-all border border-primary/20"
            >
              Launch App
            </Link>
          </div>
        </div>
      </nav>

      <section className="relative z-10 pt-28 pb-20 px-6">
        <div className="max-w-6xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 text-primary text-sm mb-8 animate-fade-in">
            <Zap className="w-4 h-4" />
            <span>Built for Four.meme</span>
          </div>

          <h1 className="text-5xl md:text-6xl lg:text-7xl mb-6 bg-gradient-to-b from-foreground via-foreground to-foreground/60 bg-clip-text text-transparent leading-[1.05] animate-fade-in">
            Turn memecoin signal
            <br />
            <span className="bg-gradient-to-r from-primary via-secondary to-primary bg-clip-text text-transparent bg-[length:200%_auto] animate-gradient">
              into action
            </span>
          </h1>

          <p className="text-lg md:text-xl text-foreground-muted max-w-4xl mx-auto mb-10 leading-relaxed animate-fade-in">
            Sloan helps creators launch better, revive fading memes, and keep momentum alive while helping degens read heat, make calls, and move with more structure.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-14 animate-fade-in">
            <Link
              to={launchHref}
              className="group px-8 py-4 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 transition-all flex items-center gap-2 shadow-[0_0_40px_rgba(74,222,255,0.3)] hover:shadow-[0_0_60px_rgba(74,222,255,0.4)]"
            >
              <span className="text-lg">Launch App</span>
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Link>
            <a
              href="#product"
              className="px-8 py-4 rounded-xl border-2 border-border hover:border-primary/40 transition-all text-lg"
            >
              Explore Product
            </a>
          </div>

          <div className="grid md:grid-cols-2 gap-6 max-w-5xl mx-auto text-left animate-fade-in">
            <div className="p-6 rounded-2xl bg-card/50 backdrop-blur-sm border border-card-border">
              <p className="text-sm uppercase tracking-[0.18em] text-primary mb-3">For creators</p>
              <h2 className="text-2xl text-foreground mb-3">Launch stronger. Revive smarter.</h2>
              <p className="text-foreground-muted leading-relaxed">
                Shape stronger identity, run better raids, and create token-aware quests that match what the meme actually needs right now.
              </p>
            </div>
            <div className="p-6 rounded-2xl bg-card/50 backdrop-blur-sm border border-card-border">
              <p className="text-sm uppercase tracking-[0.18em] text-primary mb-3">For degens</p>
              <h2 className="text-2xl text-foreground mb-3">Read the heat. Make the call.</h2>
              <p className="text-foreground-muted leading-relaxed">
                Cut through noise, track what is heating up, and act with more structure before the moment is gone.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section id="product" className="relative z-10 py-20 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-14 max-w-3xl mx-auto">
            <h2 className="text-4xl md:text-5xl mb-4 bg-gradient-to-b from-foreground to-foreground/60 bg-clip-text text-transparent">
              One workflow for memecoin action
            </h2>
            <p className="text-lg text-foreground-muted">
              From signal reading to launch identity, Sloan connects the parts of the memecoin workflow that usually live in separate tools.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {productCards.map(({ icon: Icon, title, description }) => (
              <div
                key={title}
                className="group p-8 rounded-2xl bg-gradient-to-b from-card/80 to-card/40 backdrop-blur-sm border border-card-border hover:border-primary/40 transition-all"
              >
                <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <Icon className="w-7 h-7 text-primary" />
                </div>
                <h3 className="text-2xl text-foreground mb-3">{title}</h3>
                <p className="text-foreground-muted leading-relaxed">{description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="relative z-10 py-16 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="p-8 md:p-10 rounded-3xl bg-card/40 backdrop-blur-sm border border-card-border">
            <p className="text-sm uppercase tracking-[0.18em] text-primary mb-4">Why Sloan matters</p>
            <h2 className="text-3xl md:text-4xl text-foreground mb-4">Built for the full memecoin cycle</h2>
            <p className="text-lg text-foreground-muted leading-relaxed max-w-4xl">
              Memecoins move fast and most people still move through them badly. Sloan helps creators launch better, return stronger, and sustain momentum longer while helping degens read heat, make clearer calls, and act with more structure.
            </p>
          </div>
        </div>
      </section>

      <section className="relative z-10 py-24 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl md:text-5xl mb-6 bg-gradient-to-b from-foreground to-foreground/60 bg-clip-text text-transparent">
            From launch identity to conviction and community action
          </h2>
          <p className="text-lg text-foreground-muted mb-10 max-w-3xl mx-auto">
            Sloan gives creators and degens a sharper way to move through the memecoin market.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              to={launchHref}
              className="inline-flex items-center gap-2 px-10 py-5 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 transition-all text-lg shadow-[0_0_40px_rgba(74,222,255,0.3)] hover:shadow-[0_0_60px_rgba(74,222,255,0.4)]"
            >
              <span>Launch App</span>
              <ArrowRight className="w-5 h-5" />
            </Link>
            <Link
              to="/roadmap"
              className="px-8 py-4 rounded-xl border-2 border-border hover:border-primary/40 transition-all text-lg"
            >
              View Roadmap
            </Link>
          </div>
        </div>
      </section>

      <footer className="relative z-10 border-t border-border-subtle bg-card/30 backdrop-blur-sm py-12 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
                  <Zap className="w-4 h-4 text-primary-foreground" />
                </div>
                <span className="text-foreground">Sloan</span>
              </div>
              <p className="text-sm text-muted-foreground">
                Memecoin intelligence that turns signal into action.
              </p>
            </div>

            <div>
              <h4 className="text-foreground mb-4">Product</h4>
              <div className="space-y-2">
                <FooterLink to={launchHref}>Command Center</FooterLink>
                <FooterLink to={launchHref}>Prophet League</FooterLink>
                <FooterLink to={launchHref}>Launch Forge</FooterLink>
                <FooterLink to={launchHref}>Quest Arena</FooterLink>
              </div>
            </div>

            <div>
              <h4 className="text-foreground mb-4">Company</h4>
              <div className="space-y-2">
                <FooterLink to="/roadmap">Roadmap</FooterLink>
                <FooterLink to="/terms">Terms</FooterLink>
                <FooterLink to="/privacy">Privacy</FooterLink>
                <FooterLink to="/disclaimer">Disclaimer</FooterLink>
              </div>
            </div>

            <div>
              <h4 className="text-foreground mb-4">Social</h4>
              <div className="space-y-2">
                <a href="https://x.com" target="_blank" rel="noreferrer" className="block text-sm text-muted-foreground hover:text-foreground transition-colors">X</a>
                <a href="https://github.com" target="_blank" rel="noreferrer" className="block text-sm text-muted-foreground hover:text-foreground transition-colors">GitHub</a>
                <a href="mailto:hello@sloan.app" className="block text-sm text-muted-foreground hover:text-foreground transition-colors">Email</a>
              </div>
            </div>
          </div>
          <div className="pt-8 border-t border-border-subtle flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-sm text-muted-foreground">
            <p>© 2026 Sloan. Built for Four.meme AI Sprint.</p>
            <p>Memecoin intelligence and action workflow.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
