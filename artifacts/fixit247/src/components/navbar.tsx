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
    <header className="sticky top-0 z-50 w-full border-b border-white/8 bg-[#0b0904]/95 backdrop-blur supports-[backdrop-filter]:bg-[#0b0904]/80">
      <div className="container flex h-16 items-center justify-between gap-6">
        {/* Logo */}
        <Link href="/">
          <span className="flex items-center gap-2 cursor-pointer shrink-0">
            <Wrench className="h-5 w-5 text-[#f5c518]" />
            <span className="font-black text-xl text-white tracking-tight">
              Fixit <span className="text-[#f5c518]">24/7</span>
            </span>
          </span>
        </Link>

        {/* Centre nav */}
        {!isAuthenticated ? (
          <nav className="hidden md:flex items-center gap-1 mx-auto">
            {PUBLIC_NAV.map((item) => (
              <Link key={item.href} href={item.href}>
                <span
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer ${
                    location === item.href
                      ? "text-white"
                      : "text-white/55 hover:text-white"
                  }`}
                >
                  {item.label}
                </span>
              </Link>
            ))}
          </nav>
        ) : (
          <nav className="hidden md:flex items-center gap-1 mx-auto">
            <Link href={dashboardHref}>
              <span className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium text-white/55 hover:text-white transition-colors cursor-pointer">
                <LayoutDashboard className="h-4 w-4" /> Dashboard
              </span>
            </Link>
            <Link href="/jobs">
              <span className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium text-white/55 hover:text-white transition-colors cursor-pointer">
                <Briefcase className="h-4 w-4" />
                {user?.role === "homeowner" ? "My Jobs" : "Browse Jobs"}
              </span>
            </Link>
            <Link href="/messages">
              <span className="relative flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium text-white/55 hover:text-white transition-colors cursor-pointer">
                <MessageCircle className="h-4 w-4" /> Messages
                {unreadMessages > 0 && (
                  <span className="absolute top-1 right-1 min-w-[14px] h-3.5 bg-[#f5c518] text-black text-[8px] font-black rounded-full flex items-center justify-center px-1">
                    {unreadMessages > 9 ? "9+" : unreadMessages}
                  </span>
                )}
              </span>
            </Link>
            {user?.role === "admin" && (
              <Link href="/admin">
                <span className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium text-white/55 hover:text-white transition-colors cursor-pointer">
                  <ShieldCheck className="h-4 w-4" /> Admin
                </span>
              </Link>
            )}
          </nav>
        )}

        {/* Right */}
        <div className="flex items-center gap-3 shrink-0">
          {!isAuthenticated ? (
            <>
              <Link href="/login">
                <span className="text-sm font-medium text-white/70 hover:text-white transition-colors cursor-pointer px-2 py-1">
                  Sign in
                </span>
              </Link>
              <Link href="/signup">
                <button className="h-9 px-4 rounded-lg bg-[#f5c518] hover:bg-[#e6b800] text-black font-bold text-sm transition-colors">
                  Create account
                </button>
              </Link>
            </>
          ) : (
            <>
              {/* Bell */}
              <Link href="/notifications">
                <button className="relative h-9 w-9 rounded-lg text-white/60 hover:text-white hover:bg-white/8 flex items-center justify-center transition-colors">
                  <Bell className="h-5 w-5" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 bg-[#f5c518] text-black text-[9px] font-black rounded-full flex items-center justify-center px-1 leading-none">
                      {unreadCount > 9 ? "9+" : unreadCount}
                    </span>
                  )}
                </button>
              </Link>

              {/* User menu */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="flex items-center gap-2 h-9 px-2 rounded-lg hover:bg-white/8 transition-colors">
                    <Avatar className="h-7 w-7">
                      <AvatarFallback className="bg-[#f5c518] text-black text-xs font-black">
                        {user?.name?.charAt(0).toUpperCase() ?? "U"}
                      </AvatarFallback>
                    </Avatar>
                    <span className="hidden sm:block text-sm font-medium text-white max-w-[100px] truncate">
                      {user?.name?.split(" ")[0]}
                    </span>
                    <Badge className="hidden sm:flex bg-white/10 text-white/60 border-none text-[10px] capitalize px-1.5">
                      {user?.role}
                    </Badge>
                    <ChevronDown className="h-3.5 w-3.5 text-white/40" />
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
                      <Badge className="ml-auto bg-[#f5c518] text-black border-none text-[10px] px-1.5">
                        {unreadMessages}
                      </Badge>
                    )}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setLocation("/notifications")}>
                    <Bell className="h-4 w-4 mr-2" /> Notifications
                    {unreadCount > 0 && (
                      <Badge className="ml-auto bg-[#f5c518] text-black border-none text-[10px] px-1.5">
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
