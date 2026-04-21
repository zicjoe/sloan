import { StaticContentPage } from './StaticContentPage';

type RoadmapLane = {
  title: string;
  body: string;
  bullets: string[];
};

type RoadmapPhase = {
  phase: string;
  title: string;
  body: string;
  bullets: string[];
};

const roadmapLanes: RoadmapLane[] = [
  {
    title: 'Better signal intelligence',
    body: 'Make Sloan better at reading what is happening around a token so users can spot heat earlier and understand why it matters now.',
    bullets: [
      'stronger Command Center signals',
      'Pancake and graduation awareness',
      'better token health detection',
      'stronger risk labeling',
      'watchlists and alerts',
      'clearer why-this-matters-now explanations',
    ],
  },
  {
    title: 'Better conviction infrastructure',
    body: 'Make Prophet League more serious, more dynamic, and harder to game so conviction has real structure behind it.',
    bullets: [
      'dynamic call types',
      'cleaner anti-manipulation rules',
      'stronger resolution logic',
      'better leaderboards',
      'streaks, seasons, and reputation',
      'clearer personal performance history',
    ],
  },
  {
    title: 'Better creator growth tools',
    body: 'Make Sloan stronger for meme creators across launch, revival, and sustained momentum instead of stopping at day-one launch support.',
    bullets: [
      'better Launch Forge output',
      'smarter Quest Forge suggestions',
      'token diagnosis before quest generation',
      'revive mode for fading memes',
      'sustain mode for active memes',
      'stronger raid content generation',
      'campaign planning instead of one-off content',
    ],
  },
  {
    title: 'Better feedback and progression',
    body: 'Make Sloan learn from user behavior and give more useful feedback over time so the product feels like a system, not a loose set of tools.',
    bullets: [
      'stronger Mirror Feed',
      'better Passport progression',
      'cleaner activity history',
      'pattern detection',
      'personal recommendations',
      'what-to-do-next intelligence',
    ],
  },
];

const roadmapPhases: RoadmapPhase[] = [
  {
    phase: 'Now',
    title: 'Stabilizing the core workflow',
    body: 'Sharpen the parts of Sloan that already exist so the product feels cleaner, faster, and more reliable across the full core experience.',
    bullets: [
      'production cleanup',
      'stronger auth and persistence',
      'improved Command Center',
      'Figma-based UI upgrades',
      'better Prophet League flow',
      'smarter Quest Forge',
      'stronger Launch Forge output',
    ],
  },
  {
    phase: 'Next',
    title: 'Making Sloan smarter',
    body: 'Move beyond surface polish and strengthen Sloan’s intelligence layer for reading tokens, generating calls, and guiding creators better.',
    bullets: [
      'dynamic Prophet call types',
      'stronger token intelligence and signal weighting',
      'better quest recommendations based on token condition',
      'better creator workflows for live, fading, and new memes',
      'alerts and watchlists',
      'stronger leaderboard and scoring logic',
    ],
  },
  {
    phase: 'Later',
    title: 'Building the full memecoin operating layer',
    body: 'Turn Sloan from a strong toolset into a strategic operating layer for launch, momentum, revival, conviction, and community action.',
    bullets: [
      'meme revival workflows',
      'seasonal Prophet competition',
      'creator campaign planner',
      'deeper Mirror Feed behavior coaching',
      'stronger community action loops',
      'richer Passport progression and reputation',
      'cross-token strategy intelligence',
    ],
  },
];

const futureDirections = [
  {
    title: 'Meme revival engine',
    body: 'Help creators understand why momentum died, which narrative angle can bring it back, what quest type fits revival, and what raid angle fits reactivation.',
  },
  {
    title: 'Campaign mode',
    body: 'Move from isolated tools to meme campaign orchestration covering launch identity, quest planning, raid packs, Prophet attention, and momentum review.',
  },
  {
    title: 'Better market memory',
    body: 'Remember token movement patterns and user behavior patterns over time to improve recommendations, Mirror insights, and Prophet opportunities.',
  },
  {
    title: 'Reputation and progression',
    body: 'Make Passport more meaningful through creator reputation, degen accuracy, quest quality, raid consistency, and conviction performance.',
  },
  {
    title: 'Notifications and live actions',
    body: 'Tell users when a token enters Hot Now, a call nears expiry, a live quest appears, a meme is fading, or a setup matches their past best calls.',
  },
];

const guardrails = [
  'portfolio tracking',
  'generic wallet features',
  'endless chain expansion',
  'social chat',
  'copy trading',
  'unrelated DeFi feature sprawl',
];

export function RoadmapPage() {
  return (
    <StaticContentPage
      eyebrow="Roadmap"
      title="Where Sloan is going as a product"
      intro="Sloan is evolving from a memecoin dashboard into an intelligence and action layer for the full memecoin lifecycle, from launch, to momentum, to revival, to conviction, to community action."
    >
      <div className="space-y-10">
        <section className="rounded-3xl border border-card-border bg-background/30 p-7 md:p-8">
          <p className="text-sm uppercase tracking-[0.18em] text-primary mb-4">Roadmap spine</p>
          <h2 className="text-3xl text-foreground mb-4">We are building Sloan into the system that helps memes launch better, move smarter, and stay alive longer.</h2>
          <p>
            The roadmap is focused on a product direction, not a list of random feature wishes. Sloan grows by strengthening signal quality, conviction infrastructure, creator growth tools, and user feedback over time.
          </p>
        </section>

        <section>
          <div className="mb-6">
            <p className="text-sm uppercase tracking-[0.18em] text-primary mb-3">The big roadmap direction</p>
            <h2 className="text-3xl text-foreground">Four lanes of product growth</h2>
          </div>
          <div className="grid gap-6 lg:grid-cols-2">
            {roadmapLanes.map((lane) => (
              <div key={lane.title} className="rounded-2xl border border-card-border bg-background/30 p-6">
                <h3 className="text-2xl text-foreground mb-3">{lane.title}</h3>
                <p className="mb-5">{lane.body}</p>
                <ul className="space-y-2 text-muted-foreground">
                  {lane.bullets.map((bullet) => (
                    <li key={bullet} className="flex gap-3">
                      <span className="mt-1 h-2 w-2 rounded-full bg-primary/80" />
                      <span>{bullet}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>

        <section>
          <div className="mb-6">
            <p className="text-sm uppercase tracking-[0.18em] text-primary mb-3">Best roadmap structure</p>
            <h2 className="text-3xl text-foreground">Now, next, later</h2>
          </div>
          <div className="grid gap-6">
            {roadmapPhases.map((item) => (
              <div key={item.title} className="rounded-2xl border border-card-border bg-background/30 p-6">
                <p className="text-sm uppercase tracking-[0.18em] text-primary mb-3">{item.phase}</p>
                <h3 className="text-2xl text-foreground mb-3">{item.title}</h3>
                <p className="mb-5">{item.body}</p>
                <ul className="space-y-2 text-muted-foreground">
                  {item.bullets.map((bullet) => (
                    <li key={bullet} className="flex gap-3">
                      <span className="mt-1 h-2 w-2 rounded-full bg-primary/80" />
                      <span>{bullet}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>

        <section>
          <div className="mb-6">
            <p className="text-sm uppercase tracking-[0.18em] text-primary mb-3">Natural future directions</p>
            <h2 className="text-3xl text-foreground">What Sloan can advance into later</h2>
          </div>
          <div className="grid gap-6 md:grid-cols-2">
            {futureDirections.map((item) => (
              <div key={item.title} className="rounded-2xl border border-card-border bg-background/30 p-6">
                <h3 className="text-2xl text-foreground mb-3">{item.title}</h3>
                <p>{item.body}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="rounded-2xl border border-card-border bg-background/30 p-6">
            <p className="text-sm uppercase tracking-[0.18em] text-primary mb-3">Roadmap framing</p>
            <h2 className="text-3xl text-foreground mb-4">Phase 1 to phase 4</h2>
            <div className="space-y-5">
              <div>
                <h3 className="text-xl text-foreground mb-2">Phase 1 — Sharpen the core</h3>
                <p>Command Center, Prophet, Quest, Launch, Raid, Passport, and Mirror.</p>
              </div>
              <div>
                <h3 className="text-xl text-foreground mb-2">Phase 2 — Make it smarter</h3>
                <p>Better signals, better calls, better quest diagnosis, and better launch intelligence.</p>
              </div>
              <div>
                <h3 className="text-xl text-foreground mb-2">Phase 3 — Make it strategic</h3>
                <p>Revival workflows, campaign mode, creator growth planning, and behavior coaching.</p>
              </div>
              <div>
                <h3 className="text-xl text-foreground mb-2">Phase 4 — Make it sticky</h3>
                <p>Alerts, seasons, reputation, live recommendations, and stronger progression.</p>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-card-border bg-background/30 p-6">
            <p className="text-sm uppercase tracking-[0.18em] text-primary mb-3">What not to do too early</p>
            <h2 className="text-3xl text-foreground mb-4">Stay focused</h2>
            <p className="mb-5">
              Sloan is strongest when it stays focused on signal, conviction, launch identity, community action, and feedback.
            </p>
            <ul className="space-y-2 text-muted-foreground">
              {guardrails.map((item) => (
                <li key={item} className="flex gap-3">
                  <span className="mt-1 h-2 w-2 rounded-full bg-primary/80" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </section>
      </div>
    </StaticContentPage>
  );
}
