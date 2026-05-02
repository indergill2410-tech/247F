import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useGetUnreadNotificationCount } from "@workspace/api-client-react";
import { Wrench, Bell, User, LogOut, LayoutDashboard, Briefcase, ChevronDown, ShieldCheck } from "lucide-react";

export function Navbar() {
  const [, setLocation] = useLocation();
  const { user, isAuthenticated, logout } = useAuth();

  const { data: unreadData } = useGetUnreadNotificationCount({
    query: { enabled: isAuthenticated, refetchInterval: 30_000 },
  });

  const unreadCount = unreadData?.count ?? 0;

  const handleLogout = () => {
    logout();
    setLocation("/");
  };

  const dashboardHref =
    user?.role === "admin" ? "/admin" :
    user?.role === "tradie" ? "/dashboard/tradie" :
    "/dashboard";

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between gap-4">
        {/* Logo */}
        <Link href="/">
          <span className="flex items-center gap-2 font-extrabold text-xl tracking-tight cursor-pointer">
            <div className="w-8 h-8 bg-[hsl(222,47%,11%)] rounded-lg flex items-center justify-center">
              <Wrench className="h-4 w-4 text-[hsl(38,92%,50%)]" />
            </div>
            <span className="text-[hsl(222,47%,11%)]">Fixit</span>
            <span className="text-[hsl(38,92%,50%)]">24/7</span>
          </span>
        </Link>

        {/* Nav links — authenticated */}
        {isAuthenticated && (
          <nav className="hidden md:flex items-center gap-1">
            <Link href={dashboardHref}>
              <Button variant="ghost" size="sm" className="gap-1.5">
                <LayoutDashboard className="h-4 w-4" /> Dashboard
              </Button>
            </Link>
            <Link href="/jobs">
              <Button variant="ghost" size="sm" className="gap-1.5">
                <Briefcase className="h-4 w-4" />
                {user?.role === "homeowner" ? "My Jobs" : "Browse Jobs"}
              </Button>
            </Link>
            {user?.role === "admin" && (
              <Link href="/admin">
                <Button variant="ghost" size="sm" className="gap-1.5">
                  <ShieldCheck className="h-4 w-4" /> Admin
                </Button>
              </Link>
            )}
          </nav>
        )}

        {/* Right side */}
        <div className="flex items-center gap-2">
          {!isAuthenticated ? (
            <>
              <Link href="/login">
                <Button variant="ghost" size="sm">Log in</Button>
              </Link>
              <Link href="/register">
                <Button size="sm" className="bg-[hsl(222,47%,11%)] text-white hover:bg-[hsl(222,47%,17%)]">
                  Sign up
                </Button>
              </Link>
            </>
          ) : (
            <>
              {/* Notifications bell */}
              <Link href="/notifications">
                <Button variant="ghost" size="icon" className="relative h-9 w-9">
                  <Bell className="h-5 w-5" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] bg-[hsl(38,92%,50%)] text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1">
                      {unreadCount > 9 ? "9+" : unreadCount}
                    </span>
                  )}
                </Button>
              </Link>

              {/* User menu */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="flex items-center gap-2 h-9 px-2">
                    <Avatar className="h-7 w-7">
                      <AvatarFallback className="bg-[hsl(222,47%,11%)] text-white text-xs font-bold">
                        {user?.name?.charAt(0).toUpperCase() ?? "U"}
                      </AvatarFallback>
                    </Avatar>
                    <span className="hidden sm:block text-sm font-medium max-w-[120px] truncate">
                      {user?.name?.split(" ")[0]}
                    </span>
                    <Badge className="hidden sm:flex bg-[hsl(222,47%,11%)]/10 text-[hsl(222,47%,11%)] border-none text-[10px] capitalize px-1.5">
                      {user?.role}
                    </Badge>
                    <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuItem onClick={() => setLocation(dashboardHref)}>
                    <LayoutDashboard className="h-4 w-4 mr-2" /> Dashboard
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setLocation("/jobs")}>
                    <Briefcase className="h-4 w-4 mr-2" />
                    {user?.role === "homeowner" ? "My Jobs" : "Browse Jobs"}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setLocation("/notifications")}>
                    <Bell className="h-4 w-4 mr-2" /> Notifications
                    {unreadCount > 0 && (
                      <Badge className="ml-auto bg-[hsl(38,92%,50%)] text-white border-none text-[10px] px-1.5">
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
                    <LogOut className="h-4 w-4 mr-2" /> Sign Out
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
