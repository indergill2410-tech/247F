import { useState } from "react";
import { Link, useLocation, useSearch } from "wouter";
import { motion } from "framer-motion";
import { useRegisterUser } from "@workspace/api-client-react";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Wrench, AlertCircle, Home, HardHat } from "lucide-react";

type Role = "homeowner" | "tradie";

export default function RegisterPage() {
  const [, setLocation] = useLocation();
  const search = useSearch();
  const params = new URLSearchParams(search);
  const defaultRole = (params.get("role") as Role) ?? "homeowner";

  const { login } = useAuth();
  const [role, setRole] = useState<Role>(defaultRole);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [suburb, setSuburb] = useState("");
  const [postcode, setPostcode] = useState("");
  const [error, setError] = useState("");

  const registerMutation = useRegisterUser({
    mutation: {
      onSuccess: (data) => {
        login(data);
        if (data.user.role === "tradie") setLocation("/dashboard/tradie");
        else setLocation("/dashboard");
      },
      onError: (err) => {
        const msg = (err as { data?: { message?: string } })?.data?.message;
        setError(msg ?? "Registration failed. Please try again.");
      },
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    registerMutation.mutate({
      data: { name, email, password, role, phone: phone || undefined, suburb: suburb || undefined, postcode: postcode || undefined },
    });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/30 px-4 py-12">
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
            <CardTitle className="text-2xl">Create Account</CardTitle>
            <CardDescription>Join Australia's fastest-growing repair marketplace</CardDescription>
          </CardHeader>
          <CardContent>
            {/* Role toggle */}
            <div className="flex rounded-lg border p-1 mb-6 bg-muted/40">
              {(["homeowner", "tradie"] as Role[]).map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setRole(r)}
                  className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-md text-sm font-medium transition-all ${
                    role === r
                      ? "bg-[hsl(222,47%,11%)] text-white shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {r === "homeowner" ? <Home className="h-4 w-4" /> : <HardHat className="h-4 w-4" />}
                  {r === "homeowner" ? "Homeowner" : "Tradie"}
                </button>
              ))}
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="flex items-center gap-2 text-sm text-destructive bg-destructive/10 rounded-md px-3 py-2">
                  <AlertCircle className="h-4 w-4 flex-shrink-0" />
                  {error}
                </div>
              )}
              <div className="space-y-1.5">
                <Label htmlFor="name">Full Name</Label>
                <Input id="name" placeholder="Jane Smith" value={name} onChange={(e) => setName(e.target.value)} required />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="email" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="password">Password</Label>
                <Input id="password" type="password" placeholder="Min. 8 characters" value={password} onChange={(e) => setPassword(e.target.value)} required autoComplete="new-password" minLength={8} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="phone">Phone (optional)</Label>
                <Input id="phone" type="tel" placeholder="04xx xxx xxx" value={phone} onChange={(e) => setPhone(e.target.value)} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="suburb">Suburb</Label>
                  <Input id="suburb" placeholder="Bondi" value={suburb} onChange={(e) => setSuburb(e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="postcode">Postcode</Label>
                  <Input id="postcode" placeholder="2026" value={postcode} onChange={(e) => setPostcode(e.target.value)} />
                </div>
              </div>
              <Button
                type="submit"
                className="w-full bg-[hsl(38,92%,50%)] hover:bg-[hsl(38,92%,44%)] text-white font-semibold"
                disabled={registerMutation.isPending}
              >
                {registerMutation.isPending ? "Creating account…" : `Create ${role === "homeowner" ? "Homeowner" : "Tradie"} Account`}
              </Button>
            </form>
            <p className="mt-4 text-center text-sm text-muted-foreground">
              Already have an account?{" "}
              <Link href="/login" className="text-[hsl(38,92%,50%)] font-medium hover:underline">
                Sign in
              </Link>
            </p>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
