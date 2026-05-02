import { useState } from "react";
import { useLocation } from "wouter";
import { useUpdateMe, useGetMe } from "@workspace/api-client-react";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { AlertCircle, ChevronLeft, Star, LogOut } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function ProfilePage() {
  const [, setLocation] = useLocation();
  const { user, logout, updateUser } = useAuth();
  const { toast } = useToast();
  const { data: me } = useGetMe();

  const [name, setName] = useState(user?.name ?? "");
  const [phone, setPhone] = useState(user?.phone ?? "");
  const [suburb, setSuburb] = useState(user?.suburb ?? "");
  const [postcode, setPostcode] = useState(user?.postcode ?? "");
  const [bio, setBio] = useState(user?.bio ?? "");
  const [error, setError] = useState("");

  const updateMutation = useUpdateMe({
    mutation: {
      onSuccess: (updated) => {
        updateUser(updated);
        toast({ title: "Saved!", description: "Your profile has been updated." });
      },
      onError: (err) => {
        const msg = (err as { data?: { message?: string } })?.data?.message ?? "Failed to update profile";
        setError(msg);
      },
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    updateMutation.mutate({
      data: {
        name: name || undefined,
        phone: phone || undefined,
        suburb: suburb || undefined,
        postcode: postcode || undefined,
        bio: bio || undefined,
      },
    });
  };

  const handleLogout = () => {
    logout();
    setLocation("/");
  };

  const profile = me ?? user;

  return (
    <div className="min-h-screen bg-muted/30">
      <div className="bg-[hsl(222,47%,11%)] text-white px-6 py-6">
        <div className="container max-w-2xl">
          <button
            onClick={() => setLocation(user?.role === "tradie" ? "/dashboard/tradie" : user?.role === "admin" ? "/admin" : "/dashboard")}
            className="flex items-center gap-1 text-white/70 hover:text-white text-sm mb-4 transition-colors"
          >
            <ChevronLeft className="h-4 w-4" /> Back
          </button>
          <div className="flex items-center gap-4">
            <Avatar className="h-16 w-16 border-2 border-[hsl(38,92%,50%)]">
              <AvatarFallback className="bg-[hsl(38,92%,50%)] text-white text-xl font-bold">
                {user?.name?.charAt(0).toUpperCase() ?? "U"}
              </AvatarFallback>
            </Avatar>
            <div>
              <h1 className="text-2xl font-bold">{user?.name}</h1>
              <div className="flex items-center gap-2 mt-1">
                <Badge className="bg-white/20 text-white border-none capitalize">{user?.role}</Badge>
                {user?.rating && (
                  <span className="flex items-center gap-1 text-white/70 text-sm">
                    <Star className="h-3.5 w-3.5 text-yellow-400 fill-yellow-400" />
                    {user.rating} ({user.reviewCount ?? 0} reviews)
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="container max-w-2xl py-8 space-y-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="flex items-center gap-2 text-sm text-destructive bg-destructive/10 rounded-md px-3 py-2">
              <AlertCircle className="h-4 w-4" />{error}
            </div>
          )}

          <Card>
            <CardHeader><CardTitle>Personal Information</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="name">Full Name</Label>
                <Input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Your full name" />
              </div>
              <div className="space-y-1.5">
                <Label>Email</Label>
                <Input value={profile?.email ?? ""} disabled className="opacity-60" />
                <p className="text-xs text-muted-foreground">Email cannot be changed.</p>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="phone">Phone</Label>
                <Input id="phone" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="04xx xxx xxx" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Location</CardTitle></CardHeader>
            <CardContent className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="suburb">Suburb</Label>
                <Input id="suburb" value={suburb} onChange={(e) => setSuburb(e.target.value)} placeholder="Bondi" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="postcode">Postcode</Label>
                <Input id="postcode" value={postcode} onChange={(e) => setPostcode(e.target.value)} placeholder="2026" />
              </div>
            </CardContent>
          </Card>

          {user?.role === "tradie" && (
            <Card>
              <CardHeader><CardTitle>Professional Bio</CardTitle></CardHeader>
              <CardContent>
                <Textarea
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="Tell homeowners about your experience, qualifications, and what makes you stand out…"
                  rows={4}
                />
              </CardContent>
            </Card>
          )}

          <Button
            type="submit"
            className="w-full bg-[hsl(38,92%,50%)] hover:bg-[hsl(38,92%,44%)] text-white font-semibold h-11"
            disabled={updateMutation.isPending}
          >
            {updateMutation.isPending ? "Saving…" : "Save Changes"}
          </Button>
        </form>

        <Separator />

        <Button
          variant="outline"
          className="w-full border-destructive/30 text-destructive hover:bg-destructive/10"
          onClick={handleLogout}
        >
          <LogOut className="h-4 w-4 mr-2" /> Sign Out
        </Button>
      </div>
    </div>
  );
}
