import { Check } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useProductTour } from "@/hooks/useProductTour";

const CHECKLIST = [
  "Read today's executive brief in under two minutes",
  "See how the Executive Intelligence panel is derived",
  "Scan the scored news feed and bookmark what matters",
  "Track topic momentum and benchmark competitors",
  "Work the action radar and ask the copilot",
];

const TourWelcomeDialog = () => {
  const { showWelcome, start, dismissWelcome } = useProductTour();

  return (
    <Dialog open={showWelcome} onOpenChange={(open) => !open && dismissWelcome()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Welcome to Big Data Intelligence Hub</DialogTitle>
          <DialogDescription>
            A two-minute tour of everything the platform does for you.
          </DialogDescription>
        </DialogHeader>
        <ul className="space-y-2">
          {CHECKLIST.map((item) => (
            <li key={item} className="flex gap-2 text-sm text-secondary-foreground">
              <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
              <span>{item}</span>
            </li>
          ))}
        </ul>
        <DialogFooter className="gap-2 sm:gap-2">
          <Button variant="ghost" onClick={dismissWelcome}>
            Skip for now
          </Button>
          <Button onClick={start}>Start tour</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default TourWelcomeDialog;
