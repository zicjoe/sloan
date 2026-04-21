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

const roadmapPhases: RoadmapPhase[] = [
  {
    phase: 'Phase 1',
    title: 'Sharpen the core',
    body: 'Tighten the product surfaces Sloan already has so the core workflow feels cleaner, faster, and more reliable from signal to action.',
    bullets: [
      'Command Center, Prophet, Quest, Launch, Raid, Passport, and Mirror',
      'production cleanup and stronger persistence',
      'better live UX flow across the core pages',
      'cleaner Figma-based interface upgrades',
    ],
  },
  {
    phase: 'Phase 2',
    title: 'Make it smarter',
    body: 'Strengthen Sloan’s intelligence layer so the product does more than display information. It should read situations better and generate better actions.',
    bullets: [
      'better signals',
      'better Prophet call types and resolution logic',
      'better quest diagnosis',
      'better Launch Forge intelligence',
    ],
  },
  {
    phase: 'Phase 3',
    title: 'Make it strategic',
    body: 'Move beyond one-off actions and help users operate memes with more planning, more context, and stronger lifecycle support.',
    bullets: [
      'revival workflows',
      'campaign mode',
      'creator growth planning',
      'behavior coaching',
    ],
  },
  {
    phase: 'Phase 4',
    title: 'Make it sticky',
    body: 'Make Sloan feel alive and persistent so users come back for timing, progression, recommendations, and ongoing edge.',
    bullets: [
      'alerts',
      'seasons',
      'reputation',
      'live recommendations',
      'stronger progression',
    ],
  },
];

const roadmapLanes: RoadmapLane[] = [
  {
    title: 'Better signal intelligence',
    body: 'This lane exists because Sloan needs to get faster and sharper at reading what is happening around a token.',
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
    body: 'This lane exists because Prophet League should become more serious, more dynamic, and harder to game.',
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
    body: 'This lane exists because Sloan should help creators across launch, revival, and momentum, not only at the moment of launch.',
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
    body: 'This lane exists because Sloan should learn from user behavior and give better feedback over time.',
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
      intro="Sloan is becoming the intelligence and action layer for the full memecoin lifecycle, from launch, to momentum, to revival, to conviction, to community action."
    >
      <div className="space-y-10">
        <section className="rounded-3xl border border-card-border bg-background/30 p-7 md:p-8">
          <p className="text-sm uppercase tracking-[0.18em] text-primary mb-4">Roadmap spine</p>
          <h2 className="text-3xl text-foreground mb-4">We are building Sloan into the system that helps memes launch better, move smarter, and stay alive longer.</h2>
          <p>
            The roadmap is product-led. The phases are the real roadmap. The supporting lanes below explain why those phases exist and what kinds of systems Sloan needs to become stronger over time.
          </p>
        </section>

        <section>
          <div className="mb-6">
            <p className="text-sm uppercase tracking-[0.18em] text-primary mb-3">Main roadmap</p>
            <h2 className="text-3xl text-foreground">Phase 1 to Phase 4</h2>
          </div>
          <div className="grid gap-6">
            {roadmapPhases.map((item) => (
              <div key={item.phase} className="rounded-2xl border border-card-border bg-background/30 p-6">
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
            <p className="text-sm uppercase tracking-[0.18em] text-primary mb-3">Why these phases exist</p>
            <h2 className="text-3xl text-foreground">The four growth lanes behind the roadmap</h2>
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

        
      </div>
    </StaticContentPage>
  );
}
