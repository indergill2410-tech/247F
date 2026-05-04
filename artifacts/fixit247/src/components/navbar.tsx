import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useGetUnreadNotificationCount, useListConversations } from "@workspace/api-client-react";
import {
  Wrench, Bell, User, LogOut, LayoutDashboard, Briefcase,
  ChevronDown, ShieldCheck, MessageCircle, Menu, X, Zap, Users, Shield,
} from "lucide-react";

const PUBLIC_NAV = [
  { label: "How it works", href: "/how-it-works" },
  { label: "Fixit 24/7 Emergency", href: "/emergency", highlight: true },
  { label: "About", href: "/about" },
  { label: "Partner with us", href: "/partner" },
];

// Shorter labels used in the desktop nav to prevent crowding at medium breakpoints
const DESKTOP_NAV_LABELS: Record<string, string> = {
  "/emergency": "Emergency",
};

function publicNavCls(href: string, location: string) {
  const isActive = location === href;
  return `px-3 py-1.5 rounded-lg text-sm font-medium transition-all cursor-pointer whitespace-nowrap ${
    isActive ? "bg-white/8 text-white" : "text-white/55 hover:text-white/90 hover:bg-white/5"
  }`;
}

function authNavCls(basePath: string, location: string) {
  const isActive = location === basePath || location.startsWith(basePath + "/");
  return `flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all cursor-pointer whitespace-nowrap ${
    isActive ? "bg-white/8 text-white" : "text-white/55 hover:text-white/90 hover:bg-white/5"
  }`;
}

function mobileLinkCls(href: string, location: string) {
  const isActive = location === href || (href !== "/" && location.startsWith(href));
  return `flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-medium transition-all cursor-pointer ${
    isActive ? "bg-white/8 text-white" : "text-white/60 hover:text-white hover:bg-white/5"
  }`;
}

export function Navbar() {
  const [location, setLocation] = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const { user, isAuthenticated, logout } = useAuth();

  useEffect(() => { setMenuOpen(false); }, [location]);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: unreadData } = useGetUnreadNotificationCount({
    query: { enabled: isAuthenticated, refetchInterval: 30_000 } as any,
  });
  const unreadCount = unreadData?.count ?? 0;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: conversations } = useListConversations({
    query: { enabled: isAuthenticated, refetchInterval: 15_000 } as any,
  });
  const unreadMessages = conversations?.reduce((sum, c) => sum + (c.unreadCount ?? 0), 0) ?? 0;

  const handleLogout = () => { logout(); setLocation("/"); };

  const dashboardHref =
    user?.role === "admin" ? "/admin" :
    user?.role === "tradie" ? "/dashboard/tradie" : "/dashboard";

  return (
    <header className="sticky top-0 z-50 w-full border-b border-white/6 bg-[#0b0904]/95 backdrop-blur supports-[backdrop-filter]:bg-[#0b0904]/80">
      <div className="container mx-auto px-4 sm:px-6 flex h-16 items-center justify-between gap-4">

        {/* Logo */}
        <Link href="/">
          <span className="flex items-center gap-2 cursor-pointer shrink-0" aria-label="Fixit 24/7 — home">
            <Wrench className="h-5 w-5 text-[#ffc800]" aria-hidden="true" />
            <span className="font-black text-xl text-white tracking-tight whitespace-nowrap">
              Fixit <span className="text-[#ffc800]">24/7</span>
            </span>
          </span>
        </Link>

        {/* Desktop centre nav */}
        {!isAuthenticated ? (
          <nav className="hidden md:flex items-center gap-0.5 mx-auto" aria-label="Main navigation">
            {PUBLIC_NAV.map((item) => (
              <Link key={item.href} href={item.href}>
                {item.highlight ? (
                  <span className={`px-3 py-1.5 rounded-lg text-sm font-semibold transition-all cursor-pointer whitespace-nowrap inline-flex items-center gap-1.5 ${
                    location === item.href
                      ? "bg-[#ffc800]/15 text-[#ffc800]"
                      : "text-[#ffc800]/80 hover:text-[#ffc800] hover:bg-[#ffc800]/10"
                  }`}>
                    <Shield className="h-3 w-3" aria-hidden="true" />
                    {DESKTOP_NAV_LABELS[item.href] ?? item.label}
                  </span>
                ) : (
                  <span className={publicNavCls(item.href, location)}>
                    {DESKTOP_NAV_LABELS[item.href] ?? item.label}
                  </span>
                )}
              </Link>
            ))}
          </nav>
        ) : (
          <nav className="hidden md:flex items-center gap-0.5 mx-auto" aria-label="App navigation">
            <Link href={dashboardHref}>
              <span className={authNavCls(dashboardHref, location)}>
                <LayoutDashboard className="h-4 w-4" aria-hidden="true" /> Dashboard
              </span>
            </Link>
            <Link href="/jobs">
              <span className={authNavCls("/jobs", location)}>
                <Briefcase className="h-4 w-4" aria-hidden="true" />
                {user?.role === "homeowner" ? "My Jobs" : "Browse Jobs"}
              </span>
            </Link>
            {user?.role === "homeowner" && (
              <Link href="/tradies">
                <span className={authNavCls("/tradies", location)}>
                  <Users className="h-4 w-4" aria-hidden="true" /> Find Tradie
                </span>
              </Link>
            )}
            <Link href="/conversations">
              <span className={`${authNavCls("/conversations", location)} relative`}>
                <MessageCircle className="h-4 w-4" aria-hidden="true" /> Messages
                {unreadMessages > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 min-w-[14px] h-3.5 bg-[#ffc800] text-black text-[8px] font-black rounded-full flex items-center justify-center px-1">
                    {unreadMessages > 9 ? "9+" : unreadMessages}
                  </span>
                )}
              </span>
            </Link>
            {user?.role === "tradie" && (
              <Link href="/credits">
                <span className={authNavCls("/credits", location)}>
                  <Zap className="h-4 w-4" aria-hidden="true" /> Credits
                </span>
              </Link>
            )}
            {user?.role === "admin" && (
              <Link href="/admin">
                <span className={authNavCls("/admin", location)}>
                  <ShieldCheck className="h-4 w-4" aria-hidden="true" /> Admin
                </span>
              </Link>
            )}
          </nav>
        )}

        {/* Desktop right */}
        <div className="hidden md:flex items-center gap-2 shrink-0">
          {!isAuthenticated ? (
            <>
              <Link href="/login">
                <span className="text-sm font-medium text-white/60 hover:text-white transition-colors cursor-pointer px-3 py-1.5 rounded-lg hover:bg-white/5">
                  Sign in
                </span>
              </Link>
              <Link href="/signup">
                <button className="h-9 px-4 rounded-lg bg-[#ffc800] hover:bg-[#e6b800] active:scale-[0.97] text-black font-bold text-sm transition-all">
                  Create account
                </button>
              </Link>
            </>
          ) : (
            <>
              <Link href="/notifications">
                <button
                  className="relative h-9 w-9 rounded-lg text-white/55 hover:text-white hover:bg-white/8 flex items-center justify-center transition-all"
                  aria-label={`Notifications${unreadCount > 0 ? ` (${unreadCount} unread)` : ""}`}
                >
                  <Bell className="h-4.5 w-4.5" aria-hidden="true" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 bg-[#ffc800] text-black text-[9px] font-black rounded-full flex items-center justify-center px-1 leading-none">
                      {unreadCount > 9 ? "9+" : unreadCount}
                    </span>
                  )}
                </button>
              </Link>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="flex items-center gap-2 h-9 px-2 rounded-lg hover:bg-white/8 transition-all" aria-label="User menu">
                    <Avatar className="h-7 w-7">
                      <AvatarFallback className="bg-[#ffc800] text-black text-xs font-black">
                        {user?.name?.charAt(0).toUpperCase() ?? "U"}
                      </AvatarFallback>
                    </Avatar>
                    <span className="hidden sm:block text-sm font-medium text-white max-w-[100px] truncate">
                      {user?.name?.split(" ")[0]}
                    </span>
                    <Badge className="hidden sm:flex bg-white/8 text-white/55 border-none text-[10px] capitalize px-1.5">
                      {user?.role}
                    </Badge>
                    <ChevronDown className="h-3.5 w-3.5 text-white/35" aria-hidden="true" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-52">
                  <DropdownMenuItem onClick={() => setLocation(dashboardHref)}>
                    <LayoutDashboard className="h-4 w-4 mr-2" /> Dashboard
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setLocation("/jobs")}>
                    <Briefcase className="h-4 w-4 mr-2" />
                    {user?.role === "homeowner" ? "My Jobs" : "Browse Jobs"}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setLocation("/conversations")}>
                    <MessageCircle className="h-4 w-4 mr-2" /> Messages
                    {unreadMessages > 0 && (
                      <Badge className="ml-auto bg-[#ffc800] text-black border-none text-[10px] px-1.5">
                        {unreadMessages}
                      </Badge>
                    )}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setLocation("/notifications")}>
                    <Bell className="h-4 w-4 mr-2" /> Notifications
                    {unreadCount > 0 && (
                      <Badge className="ml-auto bg-[#ffc800] text-black border-none text-[10px] px-1.5">
                        {unreadCount}
                      </Badge>
                    )}
                  </DropdownMenuItem>
                  {user?.role === "tradie" && (
                    <DropdownMenuItem onClick={() => setLocation("/credits")}>
                      <Zap className="h-4 w-4 mr-2" /> Credits
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => setLocation("/profile")}>
                    <User className="h-4 w-4 mr-2" /> Profile
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem className="text-destructive" onClick={handleLogout}>
                    <LogOut className="h-4 w-4 mr-2" /> Sign out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          )}
        </div>

        {/* Mobile right: bell (if auth) + hamburger */}
        <div className="flex md:hidden items-center gap-1 shrink-0">
          {isAuthenticated && (
            <Link href="/notifications">
              <button
                className="relative h-9 w-9 rounded-lg text-white/55 hover:text-white hover:bg-white/8 flex items-center justify-center transition-all"
                aria-label={`Notifications${unreadCount > 0 ? ` (${unreadCount} unread)` : ""}`}
              >
                <Bell className="h-4.5 w-4.5" aria-hidden="true" />
                {unreadCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 bg-[#ffc800] text-black text-[9px] font-black rounded-full flex items-center justify-center px-1 leading-none">
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </span>
                )}
              </button>
            </Link>
          )}
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="h-9 w-9 rounded-lg text-white/55 hover:text-white hover:bg-white/8 flex items-center justify-center transition-all"
            aria-label={menuOpen ? "Close navigation menu" : "Open navigation menu"}
            aria-expanded={menuOpen}
            aria-controls="mobile-nav"
          >
            {menuOpen
              ? <X className="h-5 w-5" aria-hidden="true" />
              : <Menu className="h-5 w-5" aria-hidden="true" />
            }
          </button>
        </div>
      </div>

      {/* Mobile nav panel */}
      {menuOpen && (
        <nav
          id="mobile-nav"
          className="md:hidden border-t border-white/6 bg-[#0b0904]"
          aria-label="Mobile navigation"
        >
          <div className="container mx-auto px-4 py-4 flex flex-col gap-1">
            {!isAuthenticated ? (
              <>
                {PUBLIC_NAV.map((item) => (
                  <Link key={item.href} href={item.href}>
                    {item.highlight ? (
                      <span className={`flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-semibold transition-all cursor-pointer ${
                        location === item.href
                          ? "bg-[#ffc800]/12 text-[#ffc800]"
                          : "text-[#ffc800]/75 hover:text-[#ffc800] hover:bg-[#ffc800]/8"
                      }`}>
                        <Shield className="h-4 w-4" aria-hidden="true" />
                        {item.label}
                      </span>
                    ) : (
                      <span className={mobileLinkCls(item.href, location)}>{item.label}</span>
                    )}
                  </Link>
                ))}
                <div className="mt-3 pt-3 border-t border-white/8 flex flex-col gap-2">
                  <Link href="/login">
                    <span className="block w-full text-center px-4 py-2.5 rounded-lg text-sm font-medium text-white/70 border border-white/15 hover:bg-white/5 transition-all cursor-pointer">
                      Sign in
                    </span>
                  </Link>
                  <Link href="/signup">
                    <span className="block w-full text-center px-4 py-2.5 rounded-lg text-sm font-bold bg-[#ffc800] text-black hover:bg-[#e6b800] active:scale-[0.97] transition-all cursor-pointer">
                      Create account
                    </span>
                  </Link>
                </div>
              </>
            ) : (
              <>
                <Link href={dashboardHref}>
                  <span className={mobileLinkCls(dashboardHref, location)}>
                    <LayoutDashboard className="h-4 w-4" aria-hidden="true" /> Dashboard
                  </span>
                </Link>
                <Link href="/jobs">
                  <span className={mobileLinkCls("/jobs", location)}>
                    <Briefcase className="h-4 w-4" aria-hidden="true" />
                    {user?.role === "homeowner" ? "My Jobs" : "Browse Jobs"}
                  </span>
                </Link>
                {user?.role === "homeowner" && (
                  <Link href="/tradies">
                    <span className={mobileLinkCls("/tradies", location)}>
                      <Users className="h-4 w-4" aria-hidden="true" /> Find a Tradie
                    </span>
                  </Link>
                )}
                <Link href="/conversations">
                  <span className={`${mobileLinkCls("/conversations", location)} relative`}>
                    <MessageCircle className="h-4 w-4" aria-hidden="true" /> Messages
                    {unreadMessages > 0 && (
                      <Badge className="ml-auto bg-[#ffc800] text-black border-none text-[10px] px-1.5">
                        {unreadMessages}
                      </Badge>
                    )}
                  </span>
                </Link>
                {user?.role === "tradie" && (
                  <Link href="/credits">
                    <span className={mobileLinkCls("/credits", location)}>
                      <Zap className="h-4 w-4" aria-hidden="true" /> Credits
                    </span>
                  </Link>
                )}
                {user?.role === "admin" && (
                  <Link href="/admin">
                    <span className={mobileLinkCls("/admin", location)}>
                      <ShieldCheck className="h-4 w-4" aria-hidden="true" /> Admin
                    </span>
                  </Link>
                )}
                <div className="mt-3 pt-3 border-t border-white/8 flex flex-col gap-1">
                  <Link href="/profile">
                    <span className={mobileLinkCls("/profile", location)}>
                      <User className="h-4 w-4" aria-hidden="true" /> Profile
                    </span>
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="flex items-center gap-2.5 w-full px-3 py-2.5 rounded-lg text-sm font-medium text-red-400 hover:text-red-300 hover:bg-red-500/8 transition-all text-left"
                  >
                    <LogOut className="h-4 w-4" aria-hidden="true" /> Sign out
                  </button>
                </div>
              </>
            )}
          </div>
        </nav>
      )}
    </header>
  );
}
