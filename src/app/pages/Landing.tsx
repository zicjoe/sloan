import { ArrowRight, Zap, Brain, Target, Shield, TrendingUp, Users } from 'lucide-react';
import { Link } from 'react-router';

export function Landing() {
  return (
    <div className="min-h-screen bg-background overflow-x-hidden">
      {/* Animated Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        {/* Gradient Orbs */}
        <div className="absolute top-0 -left-4 w-[500px] h-[500px] bg-primary/20 rounded-full mix-blend-multiply filter blur-[128px] animate-blob" />
        <div className="absolute top-0 -right-4 w-[500px] h-[500px] bg-secondary/20 rounded-full mix-blend-multiply filter blur-[128px] animate-blob animation-delay-2000" />
        <div className="absolute -bottom-8 left-20 w-[500px] h-[500px] bg-primary/10 rounded-full mix-blend-multiply filter blur-[128px] animate-blob animation-delay-4000" />

        {/* Grid Pattern */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(74,222,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(74,222,255,0.03)_1px,transparent_1px)] bg-[size:72px_72px] [mask-image:radial-gradient(ellipse_80%_50%_at_50%_50%,black,transparent)]" />

        {/* Radial Gradient Overlay */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(74,222,255,0.15),transparent)]" />
      </div>

      {/* Navigation */}
      <nav className="relative z-10 border-b border-border-subtle bg-background/80 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary via-secondary to-primary bg-[length:200%_200%] animate-gradient flex items-center justify-center">
              <Zap className="w-5 h-5 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-xl tracking-tight text-foreground">Sloan</h1>
              <p className="text-xs text-muted-foreground font-mono">Four.meme OS</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <Link
              to="/dashboard"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              About
            </Link>
            <Link
              to="/dashboard"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Features
            </Link>
            <Link
              to="/dashboard"
              className="px-4 py-2 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 transition-all border border-primary/20"
            >
              Launch App
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative z-10 pt-32 pb-24 px-6">
        <div className="max-w-6xl mx-auto text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 text-primary text-sm mb-8 animate-fade-in">
            <Zap className="w-4 h-4" />
            <span>Built for Four.meme AI Sprint</span>
          </div>

          {/* Headline */}
          <h1 className="text-6xl md:text-7xl lg:text-8xl mb-6 bg-gradient-to-b from-foreground via-foreground to-foreground/60 bg-clip-text text-transparent leading-[1.1] animate-fade-in">
            The AI Operating System
            <br />
            <span className="bg-gradient-to-r from-primary via-secondary to-primary bg-clip-text text-transparent bg-[length:200%_auto] animate-gradient">
              for Meme Tokens
            </span>
          </h1>

          <p className="text-xl md:text-2xl text-foreground-muted max-w-3xl mx-auto mb-12 leading-relaxed animate-fade-in">
            Navigate the chaos of meme tokens with AI-powered intelligence, community insights, and predictive analytics. Make smarter decisions, faster.
          </p>

          {/* CTA Buttons */}
          <div className="flex items-center justify-center gap-4 mb-20 animate-fade-in">
            <Link
              to="/dashboard"
              className="group px-8 py-4 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 transition-all flex items-center gap-2 shadow-[0_0_40px_rgba(74,222,255,0.3)] hover:shadow-[0_0_60px_rgba(74,222,255,0.4)]"
            >
              <span className="text-lg">Launch Sloan</span>
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link
              to="/dashboard"
              className="px-8 py-4 rounded-xl border-2 border-border hover:border-primary/40 transition-all text-lg"
            >
              Watch Demo
            </Link>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-8 max-w-3xl mx-auto animate-fade-in">
            <div className="p-6 rounded-2xl bg-card/50 backdrop-blur-sm border border-card-border">
              <p className="text-4xl font-mono text-primary mb-2">78.4%</p>
              <p className="text-sm text-muted-foreground">Prediction Accuracy</p>
            </div>
            <div className="p-6 rounded-2xl bg-card/50 backdrop-blur-sm border border-card-border">
              <p className="text-4xl font-mono text-primary mb-2">5K+</p>
              <p className="text-sm text-muted-foreground">Active Users</p>
            </div>
            <div className="p-6 rounded-2xl bg-card/50 backdrop-blur-sm border border-card-border">
              <p className="text-4xl font-mono text-primary mb-2">$2.4M</p>
              <p className="text-sm text-muted-foreground">Value Captured</p>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="relative z-10 py-24 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-5xl mb-4 bg-gradient-to-b from-foreground to-foreground/60 bg-clip-text text-transparent">
              Everything you need to win
            </h2>
            <p className="text-xl text-foreground-muted max-w-2xl mx-auto">
              Sloan combines AI intelligence with community wisdom to give you an unfair advantage
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Feature 1 */}
            <div className="group p-8 rounded-2xl bg-gradient-to-b from-card/80 to-card/40 backdrop-blur-sm border border-card-border hover:border-primary/40 transition-all">
              <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <Brain className="w-7 h-7 text-primary" />
              </div>
              <h3 className="text-2xl text-foreground mb-3">AI Conviction Analysis</h3>
              <p className="text-foreground-muted leading-relaxed">
                Get bull case, bear case, risks, and triggers for every token. AI-powered insights that cut through the noise.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="group p-8 rounded-2xl bg-gradient-to-b from-card/80 to-card/40 backdrop-blur-sm border border-card-border hover:border-primary/40 transition-all">
              <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <Users className="w-7 h-7 text-primary" />
              </div>
              <h3 className="text-2xl text-foreground mb-3">Swarm Intelligence</h3>
              <p className="text-foreground-muted leading-relaxed">
                See real-time crowd behavior analysis. Know when diamond hands are forming or paper hands are folding.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="group p-8 rounded-2xl bg-gradient-to-b from-card/80 to-card/40 backdrop-blur-sm border border-card-border hover:border-primary/40 transition-all">
              <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <Target className="w-7 h-7 text-primary" />
              </div>
              <h3 className="text-2xl text-foreground mb-3">Prophet Predictions</h3>
              <p className="text-foreground-muted leading-relaxed">
                Follow top performers. Make predictions. Build reputation. Climb the leaderboard.
              </p>
            </div>

            {/* Feature 4 */}
            <div className="group p-8 rounded-2xl bg-gradient-to-b from-card/80 to-card/40 backdrop-blur-sm border border-card-border hover:border-primary/40 transition-all">
              <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <Zap className="w-7 h-7 text-primary" />
              </div>
              <h3 className="text-2xl text-foreground mb-3">Launch Forge</h3>
              <p className="text-foreground-muted leading-relaxed">
                Build meme token identity with AI. Generate names, tickers, lore, and launch copy in seconds.
              </p>
            </div>

            {/* Feature 5 */}
            <div className="group p-8 rounded-2xl bg-gradient-to-b from-card/80 to-card/40 backdrop-blur-sm border border-card-border hover:border-primary/40 transition-all">
              <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <TrendingUp className="w-7 h-7 text-primary" />
              </div>
              <h3 className="text-2xl text-foreground mb-3">Raid Studio</h3>
              <p className="text-foreground-muted leading-relaxed">
                Coordinate community growth. Generate raid content. Track campaign performance. Build unstoppable momentum.
              </p>
            </div>

            {/* Feature 6 */}
            <div className="group p-8 rounded-2xl bg-gradient-to-b from-card/80 to-card/40 backdrop-blur-sm border border-card-border hover:border-primary/40 transition-all">
              <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <Shield className="w-7 h-7 text-primary" />
              </div>
              <h3 className="text-2xl text-foreground mb-3">Mirror Feed</h3>
              <p className="text-foreground-muted leading-relaxed">
                Learn from missed opportunities. Identify your patterns. Build your edge. Never make the same mistake twice.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Social Proof */}
      <section className="relative z-10 py-24 px-6 border-y border-border-subtle bg-card/30 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl mb-4 text-foreground">Trusted by top traders</h2>
            <p className="text-xl text-foreground-muted">Join the community making smarter decisions</p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="p-8 rounded-2xl bg-background-elevated border border-card-border">
              <p className="text-lg text-foreground-muted italic mb-6">
                "Sloan's conviction analysis saved me from panic selling PepeAI at the bottom. Now up 3x."
              </p>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-secondary" />
                <div>
                  <p className="text-foreground">@cryptowizard</p>
                  <p className="text-sm text-muted-foreground">Prophet Rank #1</p>
                </div>
              </div>
            </div>
            <div className="p-8 rounded-2xl bg-background-elevated border border-card-border">
              <p className="text-lg text-foreground-muted italic mb-6">
                "The swarm intelligence feature is insane. You can literally see when whales are accumulating."
              </p>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-secondary" />
                <div>
                  <p className="text-foreground">@moonhunter</p>
                  <p className="text-sm text-muted-foreground">Prophet Rank #2</p>
                </div>
              </div>
            </div>
            <div className="p-8 rounded-2xl bg-background-elevated border border-card-border">
              <p className="text-lg text-foreground-muted italic mb-6">
                "Launch Forge helped us build our entire meme token identity in under an hour. Incredible."
              </p>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-secondary" />
                <div>
                  <p className="text-foreground">@degen_master</p>
                  <p className="text-sm text-muted-foreground">Prophet Rank #3</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="relative z-10 py-32 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-5xl md:text-6xl mb-6 bg-gradient-to-b from-foreground to-foreground/60 bg-clip-text text-transparent">
            Ready to level up your meme game?
          </h2>
          <p className="text-xl text-foreground-muted mb-12 max-w-2xl mx-auto">
            Join thousands of traders using Sloan to navigate the meme token ecosystem with confidence.
          </p>
          <Link
            to="/dashboard"
            className="inline-flex items-center gap-2 px-10 py-5 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 transition-all text-lg shadow-[0_0_40px_rgba(74,222,255,0.3)] hover:shadow-[0_0_60px_rgba(74,222,255,0.4)]"
          >
            <span>Launch Sloan</span>
            <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </section>

      {/* Footer */}
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
                AI Operating System for Meme Tokens
              </p>
            </div>
            <div>
              <h4 className="text-foreground mb-4">Product</h4>
              <div className="space-y-2 text-sm text-muted-foreground">
                <p className="hover:text-foreground cursor-pointer transition-colors">Features</p>
                <p className="hover:text-foreground cursor-pointer transition-colors">Pricing</p>
                <p className="hover:text-foreground cursor-pointer transition-colors">Roadmap</p>
              </div>
            </div>
            <div>
              <h4 className="text-foreground mb-4">Community</h4>
              <div className="space-y-2 text-sm text-muted-foreground">
                <p className="hover:text-foreground cursor-pointer transition-colors">Twitter</p>
                <p className="hover:text-foreground cursor-pointer transition-colors">Discord</p>
                <p className="hover:text-foreground cursor-pointer transition-colors">Telegram</p>
              </div>
            </div>
            <div>
              <h4 className="text-foreground mb-4">Legal</h4>
              <div className="space-y-2 text-sm text-muted-foreground">
                <p className="hover:text-foreground cursor-pointer transition-colors">Terms</p>
                <p className="hover:text-foreground cursor-pointer transition-colors">Privacy</p>
                <p className="hover:text-foreground cursor-pointer transition-colors">Disclaimer</p>
              </div>
            </div>
          </div>
          <div className="pt-8 border-t border-border-subtle flex items-center justify-between text-sm text-muted-foreground">
            <p>© 2026 Sloan. Built for Four.meme AI Sprint.</p>
            <p>Made with AI ⚡</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
