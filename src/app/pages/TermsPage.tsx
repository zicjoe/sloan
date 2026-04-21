import { StaticContentPage } from './StaticContentPage';

export function TermsPage() {
  return (
    <StaticContentPage
      eyebrow="Terms of Use"
      title="Terms of use"
      intro="These terms govern access to Sloan and the way users interact with the product."
    >
      <section>
        <h2 className="text-2xl text-foreground mb-3">Use of the service</h2>
        <p>
          Sloan provides memecoin workflow software, market tools, and creator utilities. By using Sloan, you agree to use the product lawfully and not for abuse, manipulation, fraud, scraping, or harmful automation against the service or other users.
        </p>
      </section>

      <section>
        <h2 className="text-2xl text-foreground mb-3">Accounts</h2>
        <p>
          You are responsible for the accuracy of your account information and for activity that happens under your account. You should keep your login credentials secure and notify the product operator if you believe your account has been accessed without permission.
        </p>
      </section>

      <section>
        <h2 className="text-2xl text-foreground mb-3">Content and output</h2>
        <p>
          Sloan may generate names, tickers, copy, raids, quests, predictions, and other workflow output. You are responsible for how you use that output. The availability, quality, or suitability of generated output may change as the product evolves.
        </p>
      </section>

      <section>
        <h2 className="text-2xl text-foreground mb-3">Availability</h2>
        <p>
          Sloan may change, improve, suspend, or remove features at any time. Access to the service may be interrupted during updates, maintenance, or third-party dependency issues.
        </p>
      </section>

      <section>
        <h2 className="text-2xl text-foreground mb-3">Acceptable behavior</h2>
        <p>
          You may not use Sloan to misrepresent identity, abuse platform mechanics, attempt unauthorized access, distribute harmful code, or interfere with the experience of other users.
        </p>
      </section>
    </StaticContentPage>
  );
}
