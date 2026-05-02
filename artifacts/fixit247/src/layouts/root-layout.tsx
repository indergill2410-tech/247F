import { Link } from "wouter";

export function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <span className="font-bold text-xl tracking-tight text-primary">
              Fixit <span className="text-accent">24/7</span>
            </span>
          </Link>
          <nav className="flex items-center gap-4">
            <Link href="/login" className="text-sm font-medium hover:text-accent transition-colors" data-testid="link-login">
              Log in
            </Link>
            <Link href="/register" className="text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 h-9 px-4 py-2 rounded-md transition-colors" data-testid="link-register">
              Sign up
            </Link>
          </nav>
        </div>
      </header>
      <main className="flex-1 flex flex-col">{children}</main>
      <footer className="border-t py-6 md:py-0 bg-sidebar text-sidebar-foreground">
        <div className="container flex flex-col items-center justify-between gap-4 md:h-16 md:flex-row">
          <p className="text-sm text-sidebar-foreground/60">
            &copy; {new Date().getFullYear()} Fixit 24/7. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
