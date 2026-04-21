import { StaticContentPage } from './StaticContentPage';

export function DisclaimerPage() {
  return (
    <StaticContentPage
      eyebrow="Disclaimer"
      title="Disclaimer"
      intro="Sloan provides software and memecoin workflow tools. It does not provide financial advice or guarantee outcomes."
    >
      <section>
        <h2 className="text-2xl text-foreground mb-3">Informational tool</h2>
        <p>
          Sloan is designed to help users read signals, organize activity, and generate workflow output. The product is informational and operational in nature. It should not be treated as investment, trading, legal, tax, or financial advice.
        </p>
      </section>

      <section>
        <h2 className="text-2xl text-foreground mb-3">No guarantee of results</h2>
        <p>
          Memecoin markets are volatile and outcomes can change rapidly. Signals, calls, generated content, and product insights may be wrong, incomplete, delayed, or unsuitable for a specific situation.
        </p>
      </section>

      <section>
        <h2 className="text-2xl text-foreground mb-3">User responsibility</h2>
        <p>
          You remain fully responsible for your decisions, transactions, launches, content, and market actions. You should use independent judgment before acting on anything produced or displayed by Sloan.
        </p>
      </section>

      <section>
        <h2 className="text-2xl text-foreground mb-3">Third-party dependencies</h2>
        <p>
          Sloan may rely on external infrastructure, APIs, and market data sources. Service interruptions, stale data, or third-party failures may affect parts of the product experience.
        </p>
      </section>
    </StaticContentPage>
  );
}
