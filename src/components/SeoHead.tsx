import { Helmet } from "react-helmet-async";
import { siteUrl } from "@/config";

interface SeoHeadProps {
  title: string;
  description: string;
  path: string;
  jsonLd?: Record<string, unknown> | Record<string, unknown>[];
  noindex?: boolean;
}

const SeoHead = ({ title, description, path, jsonLd, noindex }: SeoHeadProps) => {
  const url = siteUrl(path);
  const lds = jsonLd ? (Array.isArray(jsonLd) ? jsonLd : [jsonLd]) : [];
  return (
    <Helmet>
      <title>{title}</title>
      <meta name="description" content={description} />
      <link rel="canonical" href={url} />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:url" content={url} />
      <meta property="og:type" content="website" />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      {noindex && <meta name="robots" content="noindex, nofollow" />}
      {lds.map((ld, i) => (
        <script key={i} type="application/ld+json">
          {JSON.stringify(ld)}
        </script>
      ))}
    </Helmet>
  );
};

export default SeoHead;
