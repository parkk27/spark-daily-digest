import { Link } from "react-router-dom";
import { Zap } from "lucide-react";

const Footer = () => (
  <footer className="mt-16 border-t border-border py-8">
    <div className="container flex flex-col items-center justify-between gap-4 sm:flex-row">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Zap className="h-4 w-4 text-primary" aria-hidden="true" />
        <span>Big Data Intelligence Hub — Executive Intelligence for the Modern Data Ecosystem</span>
      </div>
      <nav className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
        <Link to="/about" className="hover:text-foreground">About</Link>
        <Link to="/contact" className="hover:text-foreground">Contact</Link>
        <Link to="/privacy" className="hover:text-foreground">Privacy</Link>
        <Link to="/terms" className="hover:text-foreground">Terms</Link>
      </nav>
    </div>
  </footer>
);

export default Footer;
