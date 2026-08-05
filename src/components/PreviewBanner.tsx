import { useState } from "react";
import { Link } from "react-router-dom";
import { Eye, X } from "lucide-react";

const KEY = "preview-banner-dismissed";

/** Sample-data notice shown across the public /preview surfaces. */
const PreviewBanner = () => {
  const [hidden, setHidden] = useState(() => sessionStorage.getItem(KEY) === "1");
  if (hidden) return null;

  return (
    <div className="border-b border-primary/25 bg-primary/10">
      <div className="container flex max-w-5xl items-center gap-3 py-2.5 text-xs text-secondary-foreground sm:text-sm">
        <Eye className="h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
        <p className="flex-1 leading-relaxed">
          You're viewing sample data.{" "}
          <Link to="/signin" className="font-medium text-primary underline underline-offset-2">
            Sign in
          </Link>{" "}
          for your personalized brief, watchlist, and Action Radar.
        </p>
        <button
          onClick={() => {
            sessionStorage.setItem(KEY, "1");
            setHidden(true);
          }}
          aria-label="Dismiss sample data notice"
          className="rounded-md p-1 text-muted-foreground transition-colors hover:bg-secondary/60 hover:text-foreground"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
};

export default PreviewBanner;
