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
  "Read today's executive brief, written from the Microsoft Fabric Spark perspective",
  "Understand what “benchmarked against” means and which vendors are tracked",
  "Use Compare as a competitive intelligence workspace",
  "Work the Action Radar as your decision surface",
  "Ask the AI Copilot questions about the ingested corpus",
];

const TourWelcomeDialog = () => {
  const { showWelcome, start, dismissWelcome } = useProductTour();

  return (
    <Dialog open={showWelcome} onOpenChange={(open) => !open && dismissWelcome()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Welcome to Big Data Intelligence Hub</DialogTitle>
          <DialogDescription>
            A daily intelligence brief on the big data ecosystem for product, sales and strategy
            teams — every insight written from the Microsoft Fabric Spark point of view. Here's a
            two-minute tour.
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
            Skip tour
          </Button>
          <Button onClick={start}>Start tour</Button>
        </DialogFooter>

      </DialogContent>
    </Dialog>
  );
};

export default TourWelcomeDialog;
