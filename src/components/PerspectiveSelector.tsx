import { Eye } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ACTIVE_PERSPECTIVES } from "@/lib/perspectives";
import { usePerspective } from "@/hooks/usePerspective";

/** Lightweight perspective switcher — no page redesign, no forced selection. */
const PerspectiveSelector = () => {
  const { perspectiveId, setPerspective } = usePerspective();
  const platforms = ACTIVE_PERSPECTIVES.filter((p) => p.type === "platform");
  const technologies = ACTIVE_PERSPECTIVES.filter((p) => p.type === "technology");

  return (
    <div className="flex items-center gap-2">
      <Eye className="h-3.5 w-3.5 text-muted-foreground" aria-hidden />
      <span className="hidden text-xs text-muted-foreground sm:inline">Viewing through:</span>
      <Select value={perspectiveId} onValueChange={(v) => void setPerspective(v)}>
        <SelectTrigger className="h-8 w-[190px] text-xs" aria-label="Select intelligence perspective">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            <SelectLabel>Platforms</SelectLabel>
            {platforms.map((p) => (
              <SelectItem key={p.id} value={p.id} className="text-xs">
                {p.display_name}
              </SelectItem>
            ))}
          </SelectGroup>
          <SelectGroup>
            <SelectLabel>Technologies</SelectLabel>
            {technologies.map((p) => (
              <SelectItem key={p.id} value={p.id} className="text-xs">
                {p.display_name}
              </SelectItem>
            ))}
          </SelectGroup>
        </SelectContent>
      </Select>
    </div>
  );
};

export default PerspectiveSelector;
