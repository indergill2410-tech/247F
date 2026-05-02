import { useState } from "react";
import { Link, useLocation } from "wouter";
import { motion } from "framer-motion";
import { useLoginUser } from "@workspace/api-client-react";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Wrench, AlertCircle } from "lucide-react";

export default function LoginPage() {
  const [, setLocation] = useLocation();
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const loginMutation = useLoginUser({
    mutation: {
      onSuccess: (data) => {
        login(data);
        const role = data.user.role;
        if (role === "admin") setLocation("/admin");
        else if (role === "tradie") setLocation("/dashboard/tradie");
        else setLocation("/dashboard");
      },
      onError: (err) => {
        const msg = (err as { data?: { message?: string } })?.data?.message;
        setError(msg ?? "Invalid email or password");
      },
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    loginMutation.mutate({ data: { email, password } });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/30 px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <div className="flex justify-center mb-8">
          <Link href="/">
            <span className="flex items-center gap-2 text-2xl font-extrabold text-[hsl(222,47%,11%)]">
              <Wrench className="h-7 w-7 text-[hsl(38,92%,50%)]" />
              Fixit <span className="text-[hsl(38,92%,50%)]">24/7</span>
            </span>
          </Link>
        </div>
        <Card>
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">Welcome back</CardTitle>
            <CardDescription>Sign in to your Fixit 24/7 account</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="flex items-center gap-2 text-sm text-destructive bg-destructive/10 rounded-md px-3 py-2">
                  <AlertCircle className="h-4 w-4 flex-shrink-0" />
                  {error}
                </div>
              )}
              <div className="space-y-1.5">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                />
              </div>
              <Button
                type="submit"
                className="w-full bg-[hsl(222,47%,11%)] text-white hover:bg-[hsl(222,47%,17%)]"
                disabled={loginMutation.isPending}
              >
                {loginMutation.isPending ? "Signing in…" : "Sign In"}
              </Button>
            </form>

            <div className="mt-6 text-center text-sm text-muted-foreground">
              <div className="border-t pt-4 mb-3">Demo accounts</div>
              <div className="grid grid-cols-3 gap-2 text-xs">
                {[
                  { label: "Homeowner", email: "homeowner@fixit247.com", pw: "password123" },
                  { label: "Tradie", email: "tradie@fixit247.com", pw: "password123" },
                  { label: "Admin", email: "admin@fixit247.com", pw: "admin123" },
                ].map((d) => (
                  <button
                    key={d.label}
                    type="button"
                    className="rounded border px-2 py-1.5 hover:bg-muted transition-colors"
                    onClick={() => { setEmail(d.email); setPassword(d.pw); }}
                  >
                    {d.label}
                  </button>
                ))}
              </div>
            </div>

            <p className="mt-4 text-center text-sm text-muted-foreground">
              Don't have an account?{" "}
              <Link href="/register" className="text-[hsl(38,92%,50%)] font-medium hover:underline">
                Sign up
              </Link>
            </p>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
