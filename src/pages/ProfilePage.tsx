import { useEffect, useState } from "react";
import { UserRound } from "lucide-react";
import SeoHead from "@/components/SeoHead";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { useProfile, useUpdateProfile, ROLE_FOCUS_LABELS, type RoleFocus } from "@/hooks/useProfile";
import { cn } from "@/lib/utils";

const ROLES = Object.keys(ROLE_FOCUS_LABELS) as RoleFocus[];

const ProfilePage = () => {
  const { user } = useAuth();
  const { data: profile } = useProfile();
  const update = useUpdateProfile();
  const [name, setName] = useState("");
  const [role, setRole] = useState<RoleFocus>("product");

  useEffect(() => {
    if (profile) {
      setName(profile.display_name ?? "");
      setRole(profile.role_focus ?? "product");
    }
  }, [profile]);

  const save = async () => {
    try {
      await update.mutateAsync({ display_name: name, role_focus: role });
      toast.success("Profile updated");
    } catch {
      toast.error("Could not save your profile");
    }
  };

  return (
    <div className="container max-w-2xl py-10">
      <SeoHead
        title="Profile — Big Data Intelligence Hub"
        description="Your profile and role focus, used to personalize the Action Radar."
        path="/profile"
        noindex
      />
      <div className="flex items-center gap-2 text-primary">
        <UserRound className="h-5 w-5" />
        <span className="text-xs font-medium uppercase tracking-wide">Account</span>
      </div>
      <h1 className="mt-2 text-3xl font-semibold tracking-tight text-foreground">Profile</h1>

      <div className="mt-6 space-y-6 rounded-lg border border-border bg-card p-6">
        <div>
          <label className="text-xs uppercase tracking-wide text-muted-foreground">Email</label>
          <p className="mt-1 text-sm text-foreground">{user?.email}</p>
        </div>

        <div>
          <label htmlFor="display-name" className="text-xs uppercase tracking-wide text-muted-foreground">
            Display name
          </label>
          <Input
            id="display-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="mt-1.5"
            placeholder="Your name"
          />
        </div>

        <div>
          <p className="text-xs uppercase tracking-wide text-muted-foreground">Role focus</p>
          <p className="mt-1 text-xs text-muted-foreground">
            Personalizes which recommendations surface first on the Action Radar.
          </p>
          <div className="mt-2 flex flex-wrap gap-2">
            {ROLES.map((r) => (
              <button
                key={r}
                onClick={() => setRole(r)}
                aria-pressed={role === r}
                className={cn(
                  "rounded-md border px-3 py-1.5 text-sm transition-colors",
                  role === r
                    ? "border-primary/40 bg-primary/10 text-primary"
                    : "border-border text-muted-foreground hover:bg-secondary/50"
                )}
              >
                {ROLE_FOCUS_LABELS[r]}
              </button>
            ))}
          </div>
        </div>

        <Button onClick={save} disabled={update.isPending}>
          Save profile
        </Button>
      </div>
    </div>
  );
};

export default ProfilePage;
