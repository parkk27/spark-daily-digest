import { useState } from "react";
import { Check, Copy, Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { toast } from "@/hooks/use-toast";
import TrendCard from "./TrendCard";
import { buildShareUrl, type ShareCardData } from "@/lib/shareCard";

interface Props {
  data: ShareCardData;
  label?: string;
}

/** Share button that previews the card and copies its public link. */
const ShareCardDialog = ({ data, label }: Props) => {
  const [copied, setCopied] = useState(false);
  const url = buildShareUrl(data);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast({ title: "Link copied", description: "Shareable card link is on your clipboard." });
    } catch {
      toast({
        title: "Copy failed",
        description: "Clipboard access was blocked.",
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="h-7 gap-1.5 px-2 text-xs text-muted-foreground"
          aria-label={`Share ${data.title}`}
        >
          <Share2 className="h-3.5 w-3.5" />
          {label ?? "Share"}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Share this signal</DialogTitle>
          <DialogDescription>
            A public card anyone can open — no account required.
          </DialogDescription>
        </DialogHeader>
        <TrendCard data={data} />
        <div className="flex flex-wrap items-center gap-2">
          <Button size="sm" className="gap-1.5" onClick={copy}>
            {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            {copied ? "Copied" : "Copy link"}
          </Button>
          <a
            href={url}
            target="_blank"
            rel="noreferrer noopener"
            className="text-xs text-muted-foreground hover:text-foreground"
          >
            Open card
          </a>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ShareCardDialog;
