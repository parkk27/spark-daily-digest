import { describe, it, expect } from "vitest";
import {
  buildSignalKey,
  canonicalUrlIdentity,
  slugify,
  reviewState,
  addDays,
  signalIdOf,
} from "@/lib/signalIdentity";

const SIGNAL_TYPES = [
  "competitive",
  "customer",
  "technology",
  "market",
  "commercial",
  "regulatory",
  "ecosystem",
];
const POLARITIES = ["opportunity", "threat", "neutral"];
const DECISIONS = ["investigate", "positioning", "customer_research", "monitor", "no_action"];

describe("signal identity", () => {
  it("is stable for the same source + title across refreshes", () => {
    const a = buildSignalKey("Databricks", "Photon engine internals");
    const b = buildSignalKey("databricks", "Photon Engine Internals!");
    expect(a).toBe(b);
    expect(a).toBe("databricks:photon-engine-internals");
  });

  it("prefers the canonical URL path over the title", () => {
    const key = buildSignalKey(
      "AWS",
      "Any title",
      "https://www.aws.amazon.com/blogs/big-data/post-x/?utm=1#top"
    );
    expect(key).toBe("aws:aws-amazon-com-blogs-big-data-post-x");
  });

  it("falls back to the title for an invalid URL", () => {
    expect(buildSignalKey("google", "Agentic data cloud", "not a url")).toBe(
      "google:agentic-data-cloud"
    );
  });

  it("handles missing source and empty titles", () => {
    expect(buildSignalKey(null, "")).toBe("unknown:untitled");
  });

  it("canonicalUrlIdentity returns null for garbage", () => {
    expect(canonicalUrlIdentity("///")).toBeNull();
  });

  it("slugify strips punctuation", () => {
    expect(slugify("Iceberg v2 — What's new?")).toBe("iceberg-v2-what-s-new");
  });

  it("signalIdOf prefers signal_key and falls back to the UUID", () => {
    expect(signalIdOf({ signal_key: "aws:x", id: "uuid-1" })).toBe("aws:x");
    expect(signalIdOf({ signal_key: null, id: "uuid-1" })).toBe("uuid-1");
  });
});

describe("classification coverage", () => {
  it("covers all seven signal types and three polarities", () => {
    expect(new Set(SIGNAL_TYPES).size).toBe(7);
    expect(new Set(POLARITIES).size).toBe(3);
  });

  it("covers all five decision types", () => {
    expect(new Set(DECISIONS).size).toBe(5);
  });
});

describe("review state", () => {
  const today = new Date("2026-08-10T09:00:00Z");

  it("is none without a review date", () => {
    expect(reviewState(null, "investigating", today)).toBe("none");
  });

  it("is overdue when the date has passed and the decision is unresolved", () => {
    expect(reviewState("2026-08-09", "investigating", today)).toBe("overdue");
  });

  it("is scheduled on the review day itself", () => {
    expect(reviewState("2026-08-10", "investigating", today)).toBe("scheduled");
  });

  it("never flags resolved or dismissed decisions", () => {
    expect(reviewState("2026-01-01", "resolved", today)).toBe("none");
    expect(reviewState("2026-01-01", "dismissed", today)).toBe("none");
  });

  it("ignores malformed dates", () => {
    expect(reviewState("not-a-date", "investigating", today)).toBe("none");
  });
});

describe("extending a review date", () => {
  const today = new Date("2026-08-10T09:00:00Z");

  it("extends from today when the date is already past", () => {
    expect(addDays("2026-07-01", 14, today)).toBe("2026-08-24");
  });

  it("extends from the future date when it has not passed", () => {
    expect(addDays("2026-09-01", 14, today)).toBe("2026-09-15");
  });

  it("extends from today when there is no date", () => {
    expect(addDays(null, 14, today)).toBe("2026-08-24");
  });
});
