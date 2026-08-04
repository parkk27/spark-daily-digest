import SeoHead from "@/components/SeoHead";

const TermsPage = () => (
  <div className="container max-w-3xl py-14">
    <SeoHead
      title="Terms of Service — Big Data Intelligence Hub"
      description="The terms that govern use of Big Data Intelligence Hub accounts, content and digests."
      path="/terms"
    />
    <h1 className="text-3xl font-semibold tracking-tight text-foreground">Terms of Service</h1>
    <p className="mt-2 text-sm text-muted-foreground">
      By creating an account you agree to the terms below.
    </p>

    <div className="mt-8 space-y-6 text-sm leading-relaxed text-secondary-foreground">
      <section>
        <h2 className="text-base font-semibold text-foreground">Accounts</h2>
        <p className="mt-2">
          You are responsible for the accuracy of your account details and for keeping your
          credentials secure. Accounts are for individual use and may not be shared.
        </p>
      </section>
      <section>
        <h2 className="text-base font-semibold text-foreground">Acceptable use</h2>
        <p className="mt-2">
          Do not attempt to disrupt the service, circumvent access controls, scrape the product in
          bulk, or resell generated intelligence as your own product without permission.
        </p>
      </section>
      <section>
        <h2 className="text-base font-semibold text-foreground">Content and accuracy</h2>
        <p className="mt-2">
          Summaries, scores and trend signals are generated automatically from public sources and may
          contain errors or omissions. They are provided for information only and are not
          professional, legal or investment advice. Verify anything material against the original
          source before acting on it.
        </p>
      </section>
      <section>
        <h2 className="text-base font-semibold text-foreground">Availability</h2>
        <p className="mt-2">
          The service is provided on an as-available basis. Features may change, and pipelines may be
          delayed or interrupted.
        </p>
      </section>
      <section>
        <h2 className="text-base font-semibold text-foreground">Termination</h2>
        <p className="mt-2">
          You may close your account at any time. We may suspend accounts that violate these terms.
        </p>
      </section>
      <section>
        <h2 className="text-base font-semibold text-foreground">Contact</h2>
        <p className="mt-2">
          Questions about these terms: <span className="text-primary">legal@bigdata-hub.app</span>
        </p>
      </section>
    </div>
  </div>
);

export default TermsPage;
