import { Switch, Route, Router as WouterRouter, useLocation, Redirect } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
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
  if (!isAuthenticated) return <Redirect to="/login" />;
  if (roles && user && !roles.includes(user.role)) return <Redirect to="/" />;
  return <Component />;
}

function TradieProfileRoute() {
  const { isAuthenticated } = useAuth();
  if (!isAuthenticated) return <Redirect to="/login" />;
  return <TradieProfilePage />;
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
          {() => <ProtectedRoute component={PostJobPage} roles={["homeowner", "admin"]} />}
        </Route>
        <Route path="/post-job">
          {() => <ProtectedRoute component={PostJobPage} roles={["homeowner", "admin"]} />}
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
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          <Router />
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
