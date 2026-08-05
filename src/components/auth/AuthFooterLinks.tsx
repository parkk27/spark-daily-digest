import { Link } from "react-router-dom";

const AuthFooterLinks = () => (
  <nav aria-label="Authentication footer" className="mt-5 flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-[11px] text-muted-foreground">
    <Link to="/privacy" className="transition-colors hover:text-foreground">
      Privacy
    </Link>
    <Link to="/terms" className="transition-colors hover:text-foreground">
      Terms
    </Link>
    <Link to="/contact" className="transition-colors hover:text-foreground">
      Support
    </Link>
  </nav>
);

export default AuthFooterLinks;
