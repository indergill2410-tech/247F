import { useState, useEffect, useRef } from "react";
import { useLocation } from "wouter";
import { useQueryClient } from "@tanstack/react-query";
import {
  useUpdateMe,
  useGetMe,
  useListCategories,
  useGetTradiedashboard,
  getGetMeQueryKey,
  getGetTradiedashboardQueryKey,
} from "@workspace/api-client-react";
import { useAuth } from "@/hooks/use-auth";
import { AlertCircle, ChevronLeft, Star, LogOut, Camera, Check } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function ProfilePage() {
  const [, setLocation] = useLocation();
  const { user, logout, updateUser } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { data: me } = useGetMe();

  const [name, setName] = useState(user?.name ?? "");
  const [phone, setPhone] = useState(user?.phone ?? "");
  const [suburb, setSuburb] = useState(user?.suburb ?? "");
  const [postcode, setPostcode] = useState(user?.postcode ?? "");
  const [bio, setBio] = useState(user?.bio ?? "");
  const [avatarUrl, setAvatarUrl] = useState(user?.avatarUrl ?? "");
  const [selectedSkills, setSelectedSkills] = useState<number[]>([]);
  const [error, setError] = useState("");
  const [avatarLoadFailed, setAvatarLoadFailed] = useState(false);

  const initializedFromMe = useRef(false);
  const initializedSkills = useRef(false);

  const isTradie = user?.role === "tradie";

  const { data: categories, isLoading: categoriesLoading, isError: categoriesError } = useListCategories();
  const { data: dashboardData } = useGetTradiedashboard({
    query: { enabled: isTradie, queryKey: getGetTradiedashboardQueryKey() },
  });

  useEffect(() => {
    if (me && !initializedFromMe.current) {
      initializedFromMe.current = true;
      setName(me.name ?? "");
      setPhone(me.phone ?? "");
      setSuburb(me.suburb ?? "");
      setPostcode(me.postcode ?? "");
      setBio(me.bio ?? "");
      setAvatarUrl(me.avatarUrl ?? "");
    }
  }, [me]);

  useEffect(() => {
    if (dashboardData?.myCategories && !initializedSkills.current) {
      initializedSkills.current = true;
      setSelectedSkills(dashboardData.myCategories.map((c) => c.id));
    }
  }, [dashboardData]);

  const updateMutation = useUpdateMe({
    mutation: {
      onSuccess: (updated) => {
        updateUser(updated);
        queryClient.invalidateQueries({ queryKey: getGetMeQueryKey() });
        if (isTradie) {
          queryClient.invalidateQueries({ queryKey: getGetTradiedashboardQueryKey() });
        }
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
        avatarUrl: avatarUrl || undefined,
        ...(isTradie ? { skills: selectedSkills } : {}),
      },
    });
  };

  const toggleSkill = (categoryId: number) => {
    setSelectedSkills((prev) =>
      prev.includes(categoryId) ? prev.filter((id) => id !== categoryId) : [...prev, categoryId]
    );
  };

  const handleLogout = () => { logout(); setLocation("/"); };

  const profile = me ?? user;
  const backHref = user?.role === "tradie" ? "/dashboard/tradie" : user?.role === "admin" ? "/admin" : "/dashboard";

  const inputCls = "w-full h-11 bg-white/6 border border-white/10 rounded-xl px-4 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-[#ffc800]/50 focus:bg-white/8 transition-all";
  const labelCls = "text-sm font-medium text-white/65";

  const avatarInitial = (name?.charAt(0) ?? user?.name?.charAt(0) ?? "U").toUpperCase();
  const hasAvatar = avatarUrl && avatarUrl.startsWith("http") && !avatarLoadFailed;

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
            {/* Avatar preview */}
            <div className="relative flex-shrink-0">
              {hasAvatar ? (
                <img
                  src={avatarUrl}
                  alt={user?.name ?? "Avatar"}
                  className="w-16 h-16 rounded-2xl object-cover"
                  onError={() => setAvatarLoadFailed(true)}
                />
              ) : (
                <div className="w-16 h-16 rounded-2xl bg-[#ffc800] text-black font-black text-2xl flex items-center justify-center flex-shrink-0">
                  {avatarInitial}
                </div>
              )}
              <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-[#1a1508] border border-white/15 flex items-center justify-center">
                <Camera className="h-2.5 w-2.5 text-white/50" />
              </div>
            </div>
            <div>
              <h1 className="text-2xl font-black text-white">{name || user?.name}</h1>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-xs font-semibold px-2.5 py-1 rounded-md bg-white/10 text-white/60 capitalize">{user?.role}</span>
                {user?.rating && (
                  <span className="flex items-center gap-1 text-white/50 text-xs">
                    <Star className="h-3 w-3 text-[#ffc800] fill-[#ffc800]" />
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
          {/* Avatar */}
          <div className="bg-[#130f07] border border-white/6 rounded-2xl p-6 space-y-4">
            <h2 className="font-bold text-white">Profile Photo</h2>
            <div className="space-y-1.5">
              <label className={labelCls}>Avatar URL</label>
              <input
                className={inputCls}
                type="url"
                value={avatarUrl}
                onChange={(e) => { setAvatarUrl(e.target.value); setAvatarLoadFailed(false); }}
                placeholder="https://example.com/your-photo.jpg"
              />
              <p className="text-xs text-white/30">Paste a link to your profile photo (e.g. from Gravatar or LinkedIn).</p>
            </div>
          </div>

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

          {/* Bio */}
          <div className="bg-[#130f07] border border-white/6 rounded-2xl p-6 space-y-4">
            <h2 className="font-bold text-white">{isTradie ? "Professional Bio" : "About Me"}</h2>
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              rows={4}
              placeholder={
                isTradie
                  ? "Tell homeowners about your experience, qualifications, and what makes you stand out…"
                  : "Tell us a bit about yourself…"
              }
              className="w-full bg-white/6 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-[#ffc800]/50 focus:bg-white/8 transition-all resize-none"
            />
          </div>

          {/* Skill categories (tradie only) */}
          {isTradie && (
            <div className="bg-[#130f07] border border-white/6 rounded-2xl p-6 space-y-4">
              <div>
                <h2 className="font-bold text-white">Trade Skills</h2>
                <p className="text-xs text-white/40 mt-1">Select the trades you offer — this helps match you to the right jobs.</p>
              </div>
              {categoriesLoading ? (
                <div className="text-xs text-white/30 py-4 text-center">Loading trade categories…</div>
              ) : categoriesError ? (
                <div className="text-xs text-red-400/60 py-4 text-center">Failed to load categories. Please try again.</div>
              ) : !categories || categories.length === 0 ? (
                <div className="text-xs text-white/30 py-4 text-center">No categories available.</div>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {categories.map((cat) => {
                    const selected = selectedSkills.includes(cat.id);
                    return (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => toggleSkill(cat.id)}
                        className={`h-9 px-3.5 rounded-xl text-sm font-medium transition-all flex items-center gap-2 border ${
                          selected
                            ? "bg-[#ffc800]/15 border-[#ffc800]/40 text-[#ffc800]"
                            : "bg-white/4 border-white/8 text-white/50 hover:bg-white/8 hover:text-white/70 hover:border-white/15"
                        }`}
                      >
                        {selected && <Check className="h-3.5 w-3.5 flex-shrink-0" />}
                        <span>{cat.icon}</span>
                        <span>{cat.name}</span>
                      </button>
                    );
                  })}
                </div>
              )}
              {selectedSkills.length > 0 && (
                <p className="text-xs text-white/35">
                  {selectedSkills.length} service{selectedSkills.length !== 1 ? "s" : ""} selected
                </p>
              )}
            </div>
          )}

          <button
            type="submit"
            disabled={updateMutation.isPending}
            className="w-full h-11 rounded-xl bg-[#ffc800] hover:bg-[#e6b800] text-black font-bold text-[15px] transition-colors disabled:opacity-60"
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
