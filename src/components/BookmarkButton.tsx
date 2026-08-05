import { Bookmark as BookmarkIcon } from "lucide-react";
import { useBookmarks, useBookmarkMutations } from "@/hooks/useBookmarks";
import { useAuth } from "@/hooks/useAuth";
import { useTrackEvent } from "@/hooks/useTrackEvent";
import { cn } from "@/lib/utils";

interface Props {
  kind: string;
  refId: string;
  title: string;
  url?: string | null;
  source?: string | null;
}

const BookmarkButton = ({ kind, refId, title, url, source }: Props) => {
  const { user } = useAuth();
  const { data } = useBookmarks();
  const { add, remove } = useBookmarkMutations();
  const track = useTrackEvent();

  if (!user) return null;
  const saved = (data ?? []).some((b) => b.ref_id === refId);

  return (
    <button
      type="button"
      aria-label={saved ? "Remove bookmark" : "Save to bookmarks"}
      aria-pressed={saved}
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        if (saved) {
          remove.mutate(refId);
        } else {
          add.mutate({ kind, ref_id: refId, title, url: url ?? null, source: source ?? null });
          track("bookmark_added", refId, { kind });
        }
      }}
      className={cn(
        "rounded-md p-1.5 transition-colors",
        saved ? "text-primary" : "text-muted-foreground hover:bg-secondary/60 hover:text-foreground"
      )}
    >
      <BookmarkIcon className={cn("h-4 w-4", saved && "fill-current")} />
    </button>
  );
};

export default BookmarkButton;
