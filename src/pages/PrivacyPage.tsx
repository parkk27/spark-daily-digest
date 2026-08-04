import SeoHead from "@/components/SeoHead";

const PrivacyPage = () => (
  <div className="container max-w-3xl py-14">
    <SeoHead
      title="Privacy Policy — Big Data Intelligence Hub"
      description="How Big Data Intelligence Hub collects, uses and protects account and usage data."
      path="/privacy"
    />
    <h1 className="text-3xl font-semibold tracking-tight text-foreground">Privacy Policy</h1>
    <p className="mt-2 text-sm text-muted-foreground">
      This page is maintained by the Big Data Intelligence Hub team and describes current practices.
    </p>

    <div className="mt-8 space-y-6 text-sm leading-relaxed text-secondary-foreground">
      <section>
        <h2 className="text-base font-semibold text-foreground">Data we collect</h2>
        <p className="mt-2">
          Account data you provide (email, display name, and optional profile details such as role
          and company), your product preferences (followed topics, digest frequency, saved searches,
          watchlists), and usage data generated as you use the app (pages visited, searches,
          copilot questions, bookmarks, sign-in events).
        </p>
      </section>
      <section>
        <h2 className="text-base font-semibold text-foreground">How we use it</h2>
        <p className="mt-2">
          To authenticate you, personalise briefings and trends, deliver digests you have opted into,
          and understand aggregate product usage so we can improve the service.
        </p>
      </section>
      <section>
        <h2 className="text-base font-semibold text-foreground">Content sources</h2>
        <p className="mt-2">
          Intelligence content is derived from publicly available vendor and open-source engineering
          blogs. We do not collect proprietary or private third-party data.
        </p>
      </section>
      <section>
        <h2 className="text-base font-semibold text-foreground">Storage and access</h2>
        <p className="mt-2">
          Account and usage data is stored in our managed backend with row-level access rules so that
          each account can only read its own records. Privileged operations run server-side; the
          browser never receives administrative credentials.
        </p>
      </section>
      <section>
        <h2 className="text-base font-semibold text-foreground">Your choices</h2>
        <p className="mt-2">
          You can update your profile and preferences, pause or disable digests, and request deletion
          of your account and associated data by contacting us.
        </p>
      </section>
      <section>
        <h2 className="text-base font-semibold text-foreground">Contact</h2>
        <p className="mt-2">
          Privacy questions: <span className="text-primary">privacy@bigdata-hub.app</span>
        </p>
      </section>
    </div>
  </div>
);

export default PrivacyPage;
