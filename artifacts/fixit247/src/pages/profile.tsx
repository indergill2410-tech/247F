import { useState } from "react";
import { useLocation } from "wouter";
import { useUpdateMe, useGetMe } from "@workspace/api-client-react";
import { useAuth } from "@/hooks/use-auth";
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
      data: { name: name || undefined, phone: phone || undefined, suburb: suburb || undefined, postcode: postcode || undefined, bio: bio || undefined },
    });
  };

  const handleLogout = () => { logout(); setLocation("/"); };

  const profile = me ?? user;
  const backHref = user?.role === "tradie" ? "/dashboard/tradie" : user?.role === "admin" ? "/admin" : "/dashboard";

  const inputCls = "w-full h-11 bg-white/6 border border-white/10 rounded-xl px-4 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-[#f5c518]/50 focus:bg-white/8 transition-all";
  const labelCls = "text-sm font-medium text-white/65";

  return (
    <div className="min-h-screen bg-[#0b0904]">
      {/* Header */}
      <div className="border-b border-white/6 bg-[#0f0c06] py-8">
        <div className="container max-w-2xl mx-auto px-4 sm:px-6">
          <button
            onClick={() => setLocation(backHref)}
            className="flex items-center gap-1 text-white/40 hover:text-white text-sm mb-5 transition-colors"
          >
            <ChevronLeft className="h-4 w-4" /> Back
          </button>
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-[#f5c518] text-black font-black text-2xl flex items-center justify-center flex-shrink-0">
              {user?.name?.charAt(0).toUpperCase() ?? "U"}
            </div>
            <div>
              <h1 className="text-2xl font-black text-white">{user?.name}</h1>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-xs font-semibold px-2.5 py-1 rounded-md bg-white/10 text-white/60 capitalize">{user?.role}</span>
                {user?.rating && (
                  <span className="flex items-center gap-1 text-white/50 text-xs">
                    <Star className="h-3 w-3 text-[#f5c518] fill-[#f5c518]" />
                    {user.rating} ({user.reviewCount ?? 0} reviews)
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="container max-w-2xl mx-auto px-4 sm:px-6 py-8 space-y-5">
        {error && (
          <div className="flex items-center gap-2 text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3">
            <AlertCircle className="h-4 w-4 flex-shrink-0" />{error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Personal */}
          <div className="bg-[#130f07] border border-white/6 rounded-2xl p-6 space-y-4">
            <h2 className="font-bold text-white">Personal Information</h2>
            <div className="space-y-1.5">
              <label className={labelCls}>Full Name</label>
              <input className={inputCls} value={name} onChange={(e) => setName(e.target.value)} placeholder="Your full name" />
            </div>
            <div className="space-y-1.5">
              <label className={labelCls}>Email</label>
              <input className={`${inputCls} opacity-40 cursor-not-allowed`} value={profile?.email ?? ""} disabled />
              <p className="text-xs text-white/30">Email cannot be changed.</p>
            </div>
            <div className="space-y-1.5">
              <label className={labelCls}>Phone</label>
              <input className={inputCls} type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="04xx xxx xxx" />
            </div>
          </div>

          {/* Location */}
          <div className="bg-[#130f07] border border-white/6 rounded-2xl p-6 space-y-4">
            <h2 className="font-bold text-white">Location</h2>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className={labelCls}>Suburb</label>
                <input className={inputCls} value={suburb} onChange={(e) => setSuburb(e.target.value)} placeholder="Bondi" />
              </div>
              <div className="space-y-1.5">
                <label className={labelCls}>Postcode</label>
                <input className={inputCls} value={postcode} onChange={(e) => setPostcode(e.target.value)} placeholder="2026" />
              </div>
            </div>
          </div>

          {/* Bio (tradie only) */}
          {user?.role === "tradie" && (
            <div className="bg-[#130f07] border border-white/6 rounded-2xl p-6 space-y-4">
              <h2 className="font-bold text-white">Professional Bio</h2>
              <textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                rows={4}
                placeholder="Tell homeowners about your experience, qualifications, and what makes you stand out…"
                className="w-full bg-white/6 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-[#f5c518]/50 focus:bg-white/8 transition-all resize-none"
              />
            </div>
          )}

          <button
            type="submit"
            disabled={updateMutation.isPending}
            className="w-full h-11 rounded-xl bg-[#f5c518] hover:bg-[#e6b800] text-black font-bold text-[15px] transition-colors disabled:opacity-60"
          >
            {updateMutation.isPending ? "Saving…" : "Save Changes"}
          </button>
        </form>

        <div className="border-t border-white/6 pt-5">
          <button
            onClick={handleLogout}
            className="w-full h-11 rounded-xl border border-red-500/25 text-red-400 hover:bg-red-500/10 font-medium text-sm transition-all flex items-center justify-center gap-2"
          >
            <LogOut className="h-4 w-4" /> Sign Out
          </button>
        </div>
      </div>
    </div>
  );
}
