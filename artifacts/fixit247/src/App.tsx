import { Switch, Route, Router as WouterRouter, useLocation, Redirect } from "wouter";
import { QueryClient, QueryClientProvider, QueryErrorResetBoundary } from "@tanstack/react-query";
import { Component, type ReactNode } from "react";
import { Sentry } from "@/lib/sentry";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "next-themes";
import { useAuth } from "@/hooks/use-auth";
import { Navbar } from "@/components/navbar";
import LandingPage from "@/pages/landing";
import LoginPage from "@/pages/login";
import RegisterPage from "@/pages/register";
import HowItWorksPage from "@/pages/how-it-works";
import CategoriesPublicPage from "@/pages/categories";
import AboutPage from "@/pages/about";
import CareersPage from "@/pages/careers";
import PartnerPage from "@/pages/partner";
import HomeownerDashboard from "@/pages/dashboard-homeowner";
import TradieDashboard from "@/pages/dashboard-tradie";
import AdminDashboard from "@/pages/dashboard-admin";
import JobsPage from "@/pages/jobs";
import JobDetailPage from "@/pages/job-detail";
import PostJobPage from "@/pages/post-job";
import NotificationsPage from "@/pages/notifications";
import ProfilePage from "@/pages/profile";
import MessagesPage from "@/pages/messages";
import MessageThreadPage from "@/pages/message-thread";
import CreditsPage from "@/pages/credits";
import TradiesPage from "@/pages/tradies";
import TradieProfilePage from "@/pages/tradie-profile";
import EmergencyPage from "@/pages/emergency";
import ForTradiesPage from "@/pages/for-tradies";
import NotFound from "@/pages/not-found";

class QueryErrorBoundary extends Component<
  { children: ReactNode; onReset?: () => void },
  { hasError: boolean }
> {
  state = { hasError: false };
  static getDerivedStateFromError() { return { hasError: true }; }
  componentDidCatch(error: Error, info: React.ErrorInfo) {
    this.setState({ hasError: true });
    Sentry.captureException(error, { extra: { componentStack: info.componentStack } });
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center min-h-screen gap-4 text-center p-8">
          <p className="text-lg font-semibold">Something went wrong loading this page.</p>
          <button
            className="px-4 py-2 rounded bg-primary text-primary-foreground text-sm"
            onClick={() => { this.setState({ hasError: false }); this.props.onReset?.(); }}
          >
            Try again
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 30_000,
    },
  },
});

function ProtectedRoute({ component: Component, roles }: { component: React.ComponentType; roles?: string[] }) {
  const { isAuthenticated, user } = useAuth();
  const [location] = useLocation();
  if (!isAuthenticated) return <Redirect to={`/login?returnTo=${encodeURIComponent(location)}`} />;
  if (roles && user && !roles.includes(user.role)) {
    const dest = user.role === "tradie" ? "/dashboard/tradie" : user.role === "admin" ? "/dashboard/admin" : "/dashboard";
    return <Redirect to={dest} />;
  }
  return <Component />;
}

function TradieProfileRoute() {
  const { isAuthenticated, user } = useAuth();
  const [location] = useLocation();
  if (!isAuthenticated) return <Redirect to={`/login?returnTo=${encodeURIComponent(location)}`} />;
  if (user?.role === "admin") return <TradieProfilePage />;
  const dashHref =
    user?.role === "tradie" ? "/dashboard/tradie" : "/dashboard/homeowner";
  return <Redirect to={dashHref} />;
}

function RootRoute() {
  const { isAuthenticated, user } = useAuth();
  if (!isAuthenticated) return <LandingPage />;
  if (user?.role === "tradie") return <Redirect to="/dashboard/tradie" />;
  if (user?.role === "admin") return <Redirect to="/dashboard/admin" />;
  return <Redirect to="/dashboard/homeowner" />;
}

const HIDE_NAVBAR_PATHS = ["/login", "/register", "/signup"];

function AppLayout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const hideNav = HIDE_NAVBAR_PATHS.some((p) => location.startsWith(p));
  return (
    <div className="min-h-screen flex flex-col">
      {!hideNav && <Navbar />}
      <main className="flex-1 flex flex-col">{children}</main>
    </div>
  );
}

function Router() {
  return (
    <AppLayout>
      <Switch>
        {/* Public */}
        <Route path="/" component={RootRoute} />
        <Route path="/how-it-works" component={HowItWorksPage} />
        <Route path="/emergency" component={EmergencyPage} />
        <Route path="/for-tradies" component={ForTradiesPage} />
        <Route path="/categories" component={CategoriesPublicPage} />
        <Route path="/about" component={AboutPage} />
        <Route path="/careers" component={CareersPage} />
        <Route path="/partner" component={PartnerPage} />
        <Route path="/login" component={LoginPage} />
        <Route path="/register" component={RegisterPage} />
        <Route path="/signup" component={RegisterPage} />

        {/* Protected */}
        <Route path="/dashboard">
          {() => <ProtectedRoute component={HomeownerDashboard} roles={["homeowner", "admin"]} />}
        </Route>
        <Route path="/dashboard/homeowner">
          {() => <ProtectedRoute component={HomeownerDashboard} roles={["homeowner", "admin"]} />}
        </Route>
        <Route path="/dashboard/tradie">
          {() => <ProtectedRoute component={TradieDashboard} roles={["tradie", "admin"]} />}
        </Route>
        <Route path="/dashboard/admin">
          {() => <ProtectedRoute component={AdminDashboard} roles={["admin"]} />}
        </Route>
        <Route path="/admin">
          {() => <ProtectedRoute component={AdminDashboard} roles={["admin"]} />}
        </Route>
        <Route path="/jobs/new">
          {() => <ProtectedRoute component={PostJobPage} />}
        </Route>
        <Route path="/post-job">
          {() => <ProtectedRoute component={PostJobPage} />}
        </Route>
        <Route path="/my-jobs">
          {() => <ProtectedRoute component={JobsPage} />}
        </Route>
        <Route path="/jobs/:id">
          {() => <ProtectedRoute component={JobDetailPage} />}
        </Route>
        <Route path="/jobs">
          {() => <ProtectedRoute component={JobsPage} />}
        </Route>
        <Route path="/notifications">
          {() => <ProtectedRoute component={NotificationsPage} />}
        </Route>
        <Route path="/profile">
          {() => <ProtectedRoute component={ProfilePage} />}
        </Route>
        <Route path="/messages/:id">
          {() => <ProtectedRoute component={MessageThreadPage} />}
        </Route>
        <Route path="/messages">
          {() => <ProtectedRoute component={MessagesPage} />}
        </Route>
        <Route path="/conversations/:id">
          {() => <ProtectedRoute component={MessageThreadPage} />}
        </Route>
        <Route path="/conversations">
          {() => <ProtectedRoute component={MessagesPage} />}
        </Route>
        <Route path="/credits">
          {() => <ProtectedRoute component={CreditsPage} roles={["tradie"]} />}
        </Route>
        <Route path="/tradies/:id">
          {() => <TradieProfileRoute />}
        </Route>
        <Route path="/tradies">
          {() => <ProtectedRoute component={TradiesPage} />}
        </Route>
        <Route component={NotFound} />
      </Switch>
    </AppLayout>
  );
}

function App() {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="dark"
      enableSystem={false}
      themes={["dark", "warm"]}
    >
      <QueryClientProvider client={queryClient}>
        <QueryErrorResetBoundary>
          {({ reset }) => (
            <QueryErrorBoundary onReset={reset}>
              <TooltipProvider>
                <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
                  <Router />
                </WouterRouter>
                <Toaster />
              </TooltipProvider>
            </QueryErrorBoundary>
          )}
        </QueryErrorResetBoundary>
      </QueryClientProvider>
    </ThemeProvider>
  );
}

export default App;
