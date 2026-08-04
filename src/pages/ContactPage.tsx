import SeoHead from "@/components/SeoHead";

const ContactPage = () => (
  <div className="container max-w-3xl py-14">
    <SeoHead
      title="Contact — Big Data Intelligence Hub"
      description="Get in touch with the team behind Big Data Intelligence Hub for support, source suggestions or partnership enquiries."
      path="/contact"
    />
    <h1 className="text-3xl font-semibold tracking-tight text-foreground">Contact</h1>
    <p className="mt-2 text-sm text-muted-foreground">
      Questions, source suggestions or feedback — we read everything.
    </p>

    <div className="mt-8 grid gap-4 sm:grid-cols-2">
      <div className="rounded-lg border border-border bg-card p-5">
        <h2 className="text-sm font-semibold text-foreground">Support</h2>
        <p className="mt-1.5 text-sm text-muted-foreground">
          Account, sign-in or digest issues.
        </p>
        <a
          href="mailto:support@bigdata-hub.app"
          className="mt-3 inline-block text-sm text-primary underline-offset-4 hover:underline"
        >
          support@bigdata-hub.app
        </a>
      </div>
      <div className="rounded-lg border border-border bg-card p-5">
        <h2 className="text-sm font-semibold text-foreground">Suggest a source</h2>
        <p className="mt-1.5 text-sm text-muted-foreground">
          Know an engineering blog we should be reading?
        </p>
        <a
          href="mailto:sources@bigdata-hub.app"
          className="mt-3 inline-block text-sm text-primary underline-offset-4 hover:underline"
        >
          sources@bigdata-hub.app
        </a>
      </div>
    </div>
  </div>
);

export default ContactPage;
