export interface ShareCardData {
  /** Headline topic or capability. */
  title: string;
  /** One-line why-it-matters. */
  why: string;
  /** Short status badge label, e.g. "Growing", "Leader". */
  status: string;
  /** Number of backing sources / signals. */
  sources: number;
  /** Small eyebrow label above the title. */
  eyebrow?: string;
}

const SITE = "https://bigdata-hub.lovable.app";

const toBase64Url = (s: string) =>
  btoa(String.fromCharCode(...new TextEncoder().encode(s)))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");

const fromBase64Url = (s: string) => {
  const b64 = s.replace(/-/g, "+").replace(/_/g, "/");
  const bin = atob(b64.padEnd(Math.ceil(b64.length / 4) * 4, "="));
  return new TextDecoder().decode(Uint8Array.from(bin, (c) => c.charCodeAt(0)));
};

export const encodeCard = (data: ShareCardData): string =>
  toBase64Url(
    JSON.stringify({ t: data.title, w: data.why, s: data.status, n: data.sources, e: data.eyebrow })
  );

export const decodeCard = (encoded: string): ShareCardData | null => {
  try {
    const raw = JSON.parse(fromBase64Url(encoded)) as Record<string, unknown>;
    if (typeof raw.t !== "string") return null;
    return {
      title: raw.t,
      why: typeof raw.w === "string" ? raw.w : "",
      status: typeof raw.s === "string" ? raw.s : "Signal",
      sources: typeof raw.n === "number" ? raw.n : 0,
      eyebrow: typeof raw.e === "string" ? raw.e : undefined,
    };
  } catch {
    return null;
  }
};

/** Stable, URL-safe slug used as the /card/:cardId segment. */
export const cardSlug = (title: string) =>
  title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 60) || "signal";

export const buildShareUrl = (data: ShareCardData) =>
  `${SITE}/card/${cardSlug(data.title)}?d=${encodeCard(data)}`;
