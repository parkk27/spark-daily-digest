import { NavLink, useNavigate } from "react-router-dom";
import { Zap, LayoutDashboard, Newspaper, TrendingUp, BarChart3, Sparkles, Settings, LogOut, LogIn, Info, Home } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const authedLinks = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/news", label: "News", icon: Newspaper },
  { to: "/trends", label: "Trends", icon: TrendingUp },
  { to: "/compare", label: "Compare", icon: BarChart3 },
  { to: "/copilot", label: "Copilot", icon: Sparkles },
];

const publicLinks = [
  { to: "/", label: "Home", icon: Home },
  { to: "/about", label: "About", icon: Info },
];

const Navbar = () => {
  const { user, loading } = useAuth();
  const { signOut } = useAuth();
  const navigate = useNavigate();
  const links = user ? authedLinks : publicLinks;

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-xl">
      <div className="container flex h-14 items-center justify-between">
        <button
          onClick={() => navigate(user ? "/dashboard" : "/")}
          className="flex items-center gap-2"
          aria-label="Big Data Intelligence Hub home"
        >
          <Zap className="h-5 w-5 text-primary" />
          <span className="font-semibold tracking-tight text-foreground">
            Big Data Intelligence Hub
          </span>
        </button>
        <nav className="flex items-center gap-1">
          {links.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              end={to === "/"}
              className={({ isActive }) =>
                `flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-secondary text-foreground"
                    : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
                }`
              }
            >
              <Icon className="h-4 w-4" />
              <span className="hidden sm:inline">{label}</span>
            </NavLink>
          ))}

          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" aria-label="Account menu" className="ml-1 gap-1.5">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/15 text-xs font-semibold text-primary">
                    {(user.email ?? "?").charAt(0).toUpperCase()}
                  </span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuItem disabled className="truncate text-xs">{user.email}</DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate("/settings")}>
                  <Settings className="mr-2 h-4 w-4" /> Settings
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={async () => {
                    await signOut();
                    navigate("/");
                  }}
                >
                  <LogOut className="mr-2 h-4 w-4" /> Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            !loading && (
              <div className="ml-1 flex items-center gap-1.5">
                <Button variant="ghost" size="sm" className="gap-1.5" onClick={() => navigate("/signin")}>
                  <LogIn className="h-4 w-4" />
                  <span className="hidden sm:inline">Sign in</span>
                </Button>
                <Button size="sm" onClick={() => navigate("/signup")}>
                  Sign up
                </Button>
              </div>
            )
          )}
        </nav>
      </div>
    </header>
  );
};

export default Navbar;
