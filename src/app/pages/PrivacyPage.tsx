import { StaticContentPage } from './StaticContentPage';

export function PrivacyPage() {
  return (
    <StaticContentPage
      eyebrow="Privacy Policy"
      title="Privacy policy"
      intro="This page explains the types of data Sloan handles in order to provide account access and product functionality."
    >
      <section>
        <h2 className="text-2xl text-foreground mb-3">Information Sloan handles</h2>
        <p>
          Sloan may process basic account information, profile settings, authentication data, usage activity within the product, and feature-specific data created through flows such as calls, raids, quests, and launch generation.
        </p>
      </section>

      <section>
        <h2 className="text-2xl text-foreground mb-3">How the information is used</h2>
        <p>
          Product data is used to operate Sloan, persist your activity, improve workflow quality, and deliver feature behavior across pages such as Command Center, Prophet League, Quest Arena, Launch Forge, Raid Studio, Passport, and Mirror Feed.
        </p>
      </section>

      <section>
        <h2 className="text-2xl text-foreground mb-3">Third-party services</h2>
        <p>
          Sloan may depend on third-party infrastructure and data providers for hosting, authentication, storage, and market data. Those services may process data as part of delivering the product experience.
        </p>
      </section>

      <section>
        <h2 className="text-2xl text-foreground mb-3">Security</h2>
        <p>
          Sloan aims to use reasonable technical and operational safeguards, but no internet-connected service can guarantee absolute security. Users should avoid sharing unnecessary sensitive information through product inputs.
        </p>
      </section>

      <section>
        <h2 className="text-2xl text-foreground mb-3">Policy changes</h2>
        <p>
          This privacy policy may be updated as Sloan evolves. Continued use of the product after updates means the revised policy will apply going forward.
        </p>
      </section>
    </StaticContentPage>
  );
}
