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
import { Wrench, Bell, User, LogOut, LayoutDashboard, Briefcase, ChevronDown, ShieldCheck, MessageCircle } from "lucide-react";

const PUBLIC_NAV = [
  { label: "How it works", href: "/how-it-works" },
  { label: "Categories", href: "/categories" },
  { label: "About", href: "/about" },
  { label: "We are hiring", href: "/careers" },
];

function publicNavCls(href: string, location: string) {
  const isActive = location === href;
  return `px-3 py-1.5 rounded-lg text-sm font-medium transition-all cursor-pointer whitespace-nowrap ${
    isActive
      ? "bg-white/8 text-white"
      : "text-white/55 hover:text-white/90 hover:bg-white/5"
  }`;
}

function authNavCls(basePath: string, location: string) {
  const isActive = location === basePath || location.startsWith(basePath + "/");
  return `flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all cursor-pointer whitespace-nowrap ${
    isActive
      ? "bg-white/8 text-white"
      : "text-white/55 hover:text-white/90 hover:bg-white/5"
  }`;
}

export function Navbar() {
  const [location, setLocation] = useLocation();
  const { user, isAuthenticated, logout } = useAuth();

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

  const handleLogout = () => {
    logout();
    setLocation("/");
  };

  const dashboardHref =
    user?.role === "admin" ? "/admin" :
    user?.role === "tradie" ? "/dashboard/tradie" :
    "/dashboard";

  return (
    <header className="sticky top-0 z-50 w-full border-b border-white/6 bg-[#0b0904]/95 backdrop-blur supports-[backdrop-filter]:bg-[#0b0904]/80">
      <div className="container mx-auto px-4 sm:px-6 flex h-16 items-center justify-between gap-6">
        {/* Logo */}
        <Link href="/">
          <span className="flex items-center gap-2 cursor-pointer shrink-0">
            <Wrench className="h-5 w-5 text-[#ffc800]" />
            <span className="font-black text-xl text-white tracking-tight whitespace-nowrap">
              Fixit <span className="text-[#ffc800]">24/7</span>
            </span>
          </span>
        </Link>

        {/* Centre nav */}
        {!isAuthenticated ? (
          <nav className="hidden md:flex items-center gap-0.5 mx-auto">
            {PUBLIC_NAV.map((item) => (
              <Link key={item.href} href={item.href}>
                <span className={publicNavCls(item.href, location)}>
                  {item.label}
                </span>
              </Link>
            ))}
          </nav>
        ) : (
          <nav className="hidden md:flex items-center gap-0.5 mx-auto">
            <Link href={dashboardHref}>
              <span className={authNavCls(dashboardHref, location)}>
                <LayoutDashboard className="h-4 w-4" /> Dashboard
              </span>
            </Link>
            <Link href="/jobs">
              <span className={authNavCls("/jobs", location)}>
                <Briefcase className="h-4 w-4" />
                {user?.role === "homeowner" ? "My Jobs" : "Browse Jobs"}
              </span>
            </Link>
            <Link href="/messages">
              <span className={`${authNavCls("/messages", location)} relative`}>
                <MessageCircle className="h-4 w-4" /> Messages
                {unreadMessages > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 min-w-[14px] h-3.5 bg-[#ffc800] text-black text-[8px] font-black rounded-full flex items-center justify-center px-1">
                    {unreadMessages > 9 ? "9+" : unreadMessages}
                  </span>
                )}
              </span>
            </Link>
            {user?.role === "admin" && (
              <Link href="/admin">
                <span className={authNavCls("/admin", location)}>
                  <ShieldCheck className="h-4 w-4" /> Admin
                </span>
              </Link>
            )}
          </nav>
        )}

        {/* Right */}
        <div className="flex items-center gap-2 shrink-0">
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
              {/* Bell */}
              <Link href="/notifications">
                <button className="relative h-9 w-9 rounded-lg text-white/55 hover:text-white hover:bg-white/8 flex items-center justify-center transition-all">
                  <Bell className="h-4.5 w-4.5" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 bg-[#ffc800] text-black text-[9px] font-black rounded-full flex items-center justify-center px-1 leading-none">
                      {unreadCount > 9 ? "9+" : unreadCount}
                    </span>
                  )}
                </button>
              </Link>

              {/* User menu */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="flex items-center gap-2 h-9 px-2 rounded-lg hover:bg-white/8 transition-all">
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
                    <ChevronDown className="h-3.5 w-3.5 text-white/35" />
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
                  <DropdownMenuItem onClick={() => setLocation("/messages")}>
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
      </div>
    </header>
  );
}
