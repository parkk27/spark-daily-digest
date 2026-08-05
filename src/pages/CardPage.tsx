import { Link, useParams, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import SeoHead from "@/components/SeoHead";
import TrendCard from "@/components/share/TrendCard";
import { decodeCard } from "@/lib/shareCard";

/** Public, full-bleed view of a shared intelligence card. */
const CardPage = () => {
  const { cardId } = useParams();
  const [params] = useSearchParams();
  const data = decodeCard(params.get("d") ?? "");

  if (!data) {
    return (
      <div className="container max-w-2xl py-20 text-center">
        <SeoHead
          title="Card not found | Big Data Intelligence Hub"
          description="This shared intelligence card is no longer available."
          path={`/card/${cardId ?? ""}`}
          noindex
        />
        <h1 className="text-2xl font-semibold text-foreground">This card isn't available</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          The link may be incomplete. See today's live intelligence brief instead.
        </p>
        <Button asChild className="mt-6">
          <Link to="/preview">See today's brief</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="container max-w-3xl py-12">
      <SeoHead
        title={`${data.title} — Big Data Intelligence Hub`}
        description={data.why || `${data.status} signal backed by ${data.sources} sources.`}
        path={`/card/${cardId ?? ""}`}
      />
      <TrendCard data={data} />
      <div className="mt-8 text-center">
        <h1 className="text-xl font-semibold capitalize text-foreground">{data.title}</h1>
        <p className="mx-auto mt-2 max-w-xl text-sm leading-relaxed text-muted-foreground">
          {data.why}
        </p>
        <div className="mt-6 flex justify-center gap-3">
          <Button asChild>
            <Link to="/preview">See today's brief</Link>
          </Button>
          <Button asChild variant="outline">
            <Link to="/signin">Create free account</Link>
          </Button>
        </div>
      </div>
    </div>
  );
};

export default CardPage;
