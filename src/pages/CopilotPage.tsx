import AskBigDataHub from "@/components/AskBigDataHub";
import SeoHead from "@/components/SeoHead";

const CopilotPage = () => (
  <div className="container max-w-4xl py-8">
    <SeoHead
      title="AI Copilot — Big Data Intelligence Hub"
      description="Ask the Big Data Intelligence Hub copilot what changed across the data ecosystem and why it matters."
      path="/copilot"
      noindex
    />
    <h1 className="text-2xl font-semibold tracking-tight text-foreground">AI Copilot</h1>
    <p className="mt-1.5 text-sm text-muted-foreground">
      Ask what changed, why it matters, and what to evaluate next.
    </p>
    <div className="mt-6">
      <AskBigDataHub />
    </div>
  </div>
);

export default CopilotPage;
