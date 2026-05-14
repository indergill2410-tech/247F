import { usePageTitle } from "@/hooks/use-page-title";
import { CloudinaryUpload } from "@/components/cloudinary-upload";
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
import { AlertCircle, ChevronLeft, Star, LogOut, Camera, Check, MapPin, X, Plus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { SuburbInput } from "@/components/suburb-input";
import { searchSuburbs } from "@/data/au-suburbs";
import { AnimatePresence, motion } from "framer-motion";

const SERVICE_RADIUS_OPTIONS = [
  { label: "No preference (all areas)", value: null },
  { label: "10 km", value: 10 },
  { label: "25 km", value: 25 },
  { label: "50 km", value: 50 },
  { label: "100 km", value: 100 },
];

function ServiceSuburbTags({
  selected,
  onChange,
  inputCls,
}: {
  selected: string[];
  onChange: (suburbs: string[]) => void;
  inputCls: string;
}) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const suggestions = query.length >= 2 ? searchSuburbs(query, 8).filter((s) => !selected.includes(s.suburb)) : [];

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const add = (suburb: string) => {
    if (!selected.includes(suburb)) onChange([...selected, suburb]);
    setQuery("");
    setOpen(false);
  };

  const remove = (suburb: string) => onChange(selected.filter((s) => s !== suburb));

  return (
    <div className="space-y-2">
      {selected.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {selected.map((s) => (
            <span
              key={s}
              className="flex items-center gap-1.5 h-7 pl-3 pr-2 rounded-lg bg-primary/12 border border-primary/25 text-primary text-xs font-medium"
            >
              <MapPin className="h-3 w-3 flex-shrink-0" />
              {s}
              <button
                type="button"
                onClick={() => remove(s)}
                className="hover:text-white transition-colors ml-0.5"
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          ))}
        </div>
      )}
      <div ref={ref} className="relative">
        <MapPin className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/30" />
        <input
          type="text"
          value={query}
          placeholder={selected.length === 0 ? "Type a suburb name to add…" : "Add another suburb…"}
          autoComplete="off"
          className={`${inputCls} pl-9`}
          onChange={(e) => { setQuery(e.target.value); setOpen(true); }}
          onFocus={() => { if (suggestions.length > 0) setOpen(true); }}
        />
        <AnimatePresence>
          {open && suggestions.length > 0 && (
            <motion.ul
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.12 }}
              className="absolute z-50 top-full mt-1 w-full bg-[#1a1510] border border-white/15 rounded-xl shadow-xl overflow-hidden"
            >
              {suggestions.map((s) => (
                <li key={`${s.suburb}-${s.postcode}`}>
                  <button
                    type="button"
                    className="w-full text-left px-3 py-2.5 text-sm text-white/80 hover:bg-primary/10 hover:text-white transition-colors flex items-center justify-between gap-2"
                    onMouseDown={(e) => { e.preventDefault(); add(s.suburb); }}
                  >
                    <span className="flex items-center gap-2">
                      <MapPin className="h-3.5 w-3.5 text-primary shrink-0" />
                      <span>{s.suburb}</span>
                      <span className="text-white/35 text-xs">{s.state}</span>
                    </span>
                    <span className="flex items-center gap-1 text-primary/60 text-xs">
                      <Plus className="h-3 w-3" /> Add
                    </span>
                  </button>
                </li>
              ))}
            </motion.ul>
          )}
        </AnimatePresence>
      </div>
      {selected.length === 0 && (
        <p className="text-xs text-white/30">Leave empty to receive jobs from all areas.</p>
      )}
    </div>
  );
}

export default function ProfilePage() {
  usePageTitle("My Profile");
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
  const [primaryTrade, setPrimaryTrade] = useState("");
  const [secondaryTrades, setSecondaryTrades] = useState<string[]>([]);
  const [serviceRadius, setServiceRadius] = useState<number | null>(null);
  const [serviceSuburbs, setServiceSuburbs] = useState<string[]>([]);
  const [workPhotoUrls, setWorkPhotoUrls] = useState<string[]>(["", "", "", "", "", ""]);
  const [abn, setAbn] = useState("");
  const [licenceNumber, setLicenceNumber] = useState("");
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
      setPrimaryTrade((me as { primaryTrade?: string | null }).primaryTrade ?? "");
      setSecondaryTrades((me as { secondaryTrades?: string[] | null }).secondaryTrades ?? []);
      setServiceRadius((me as { serviceRadius?: number | null }).serviceRadius ?? null);
      setServiceSuburbs((me as { serviceSuburbs?: string[] | null }).serviceSuburbs ?? []);
      const photos = (me as { workPhotoUrls?: string[] | null }).workPhotoUrls ?? [];
      const padded = [...photos, "", "", "", "", "", ""].slice(0, 6);
      setWorkPhotoUrls(padded);
      setAbn((me as { abn?: string | null }).abn ?? "");
      setLicenceNumber((me as { licenceNumber?: string | null }).licenceNumber ?? "");
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
    const filteredPhotos = workPhotoUrls.filter((u) => u.trim().startsWith("http"));
    updateMutation.mutate({
      data: {
        name: name || undefined,
        phone: phone || undefined,
        suburb: suburb || undefined,
        postcode: postcode || undefined,
        bio: bio || undefined,
        avatarUrl: avatarUrl || undefined,
        ...(isTradie ? {
          skills: selectedSkills,
          primaryTrade: primaryTrade || undefined,
          secondaryTrades: secondaryTrades.length > 0 ? secondaryTrades : [],
          serviceRadius: serviceRadius ?? null,
          serviceSuburbs: serviceSuburbs.length > 0 ? serviceSuburbs : null,
          workPhotoUrls: filteredPhotos.length > 0 ? filteredPhotos : null,
          abn: abn.trim() || undefined,
          licenceNumber: licenceNumber.trim() || undefined,
        } : {}),
      },
    });
  };

  const TRADES = [
    "Plumbing", "Electrical", "Carpentry", "Painting", "Tiling",
    "HVAC / Air conditioning", "Locksmith", "Roofing", "Landscaping & gardening",
    "Handyman / general repairs", "Glazier", "Plasterer", "Flooring",
    "Appliance repair", "Pest control",
  ];

  const toggleSecondaryTrade = (trade: string) => {
    if (trade === primaryTrade) return;
    setSecondaryTrades((prev) =>
      prev.includes(trade) ? prev.filter((t) => t !== trade) : [...prev, trade]
    );
  };

  const toggleSkill = (categoryId: number) => {
    setSelectedSkills((prev) =>
      prev.includes(categoryId) ? prev.filter((id) => id !== categoryId) : [...prev, categoryId]
    );
  };

  const handleLogout = () => { logout(); setLocation("/"); };

  const profile = me ?? user;
  const backHref = user?.role === "tradie" ? "/dashboard/tradie" : user?.role === "admin" ? "/admin" : "/dashboard";

  const inputCls = "w-full h-11 bg-white/6 border border-white/10 rounded-xl px-4 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-primary/50 focus:bg-white/8 transition-all";
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
                <div className="w-16 h-16 rounded-2xl bg-primary text-primary-foreground font-black text-2xl flex items-center justify-center flex-shrink-0">
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
                    <Star className="h-3 w-3 text-primary fill-primary" />
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
              <div className="flex items-center gap-2">
                <input
                  className={`${inputCls} flex-1`}
                  type="url"
                  value={avatarUrl}
                  onChange={(e) => { setAvatarUrl(e.target.value); setAvatarLoadFailed(false); }}
                  placeholder="https://example.com/your-photo.jpg"
                />
                <CloudinaryUpload
                  folder="fixit247/avatars"
                  label="Upload"
                  onUploaded={(url) => { setAvatarUrl(url); setAvatarLoadFailed(false); }}
                />
              </div>
              <p className="text-xs text-white/30">Paste a URL or upload directly from your device.</p>
            </div>
          </div>

          {/* Privacy legend (tradie only) */}
          {isTradie && (
            <div className="bg-[#130f07] border border-white/6 rounded-2xl px-5 py-4 space-y-2.5">
              <p className="text-xs font-bold text-white/50 uppercase tracking-wider">Privacy guide</p>
              <div className="flex flex-wrap gap-4">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-primary/10 text-primary border border-primary/20">Trust Card</span>
                  <span className="text-xs text-white/40">Visible on your Trust Card — shown to homeowners before they hire you</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-white/8 text-white/35 border border-white/10">After hire</span>
                  <span className="text-xs text-white/40">Visible only after a homeowner hires you</span>
                </div>
              </div>
            </div>
          )}

          {/* Personal */}
          <div className="bg-[#130f07] border border-white/6 rounded-2xl p-6 space-y-4">
            <div className="flex items-start justify-between gap-3">
              <h2 className="font-bold text-white">Personal Information</h2>
              {isTradie && (
                <span className="text-[10px] font-semibold px-2 py-1 rounded-lg bg-white/8 text-white/40 border border-white/10 flex-shrink-0">
                  After hire
                </span>
              )}
            </div>
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
            <div className="flex items-start justify-between gap-3">
              <h2 className="font-bold text-white">Location</h2>
              {isTradie && (
                <span className="text-[10px] font-semibold px-2 py-1 rounded-lg bg-primary/10 text-primary border border-primary/20 flex-shrink-0">
                  Trust Card
                </span>
              )}
            </div>
            <SuburbInput
              suburb={suburb}
              postcode={postcode}
              onSuburbChange={setSuburb}
              onPostcodeChange={setPostcode}
              suburbLabel="Suburb"
              postcodeLabel="Postcode"
              inputCls={inputCls}
              labelCls={labelCls}
              layout="grid"
            />
          </div>

          {/* Bio */}
          <div className="bg-[#130f07] border border-white/6 rounded-2xl p-6 space-y-4">
            <div className="flex items-start justify-between gap-3">
              <h2 className="font-bold text-white">{isTradie ? "Professional Bio" : "About Me"}</h2>
              {isTradie && (
                <span className="text-[10px] font-semibold px-2 py-1 rounded-lg bg-primary/10 text-primary border border-primary/20 flex-shrink-0">
                  Trust Card
                </span>
              )}
            </div>
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              rows={4}
              placeholder={
                isTradie
                  ? "Tell homeowners about your experience, qualifications, and what makes you stand out…"
                  : "Tell us a bit about yourself…"
              }
              className="w-full bg-white/6 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-primary/50 focus:bg-white/8 transition-all resize-none"
            />
          </div>

          {/* Trade Specialisation (tradie only) */}
          {isTradie && (
            <div className="bg-[#130f07] border border-white/6 rounded-2xl p-6 space-y-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="font-bold text-white">Trade Specialisation</h2>
                  <p className="text-xs text-white/40 mt-1">Shown on your Trust Card and used to match you to jobs.</p>
                </div>
                <span className="text-[10px] font-semibold px-2 py-1 rounded-lg bg-primary/10 text-primary border border-primary/20 flex-shrink-0">
                  Trust Card
                </span>
              </div>

              {/* Primary trade */}
              <div className="space-y-1.5">
                <label className={labelCls}>Primary Trade</label>
                <div className="relative">
                  <select
                    value={primaryTrade}
                    onChange={(e) => {
                      const val = e.target.value;
                      setPrimaryTrade(val);
                      setSecondaryTrades((prev) => prev.filter((t) => t !== val));
                    }}
                    className="w-full h-11 bg-white/6 border border-white/10 rounded-xl px-4 pr-10 text-sm text-white appearance-none focus:outline-none focus:border-primary/50 focus:bg-white/8 transition-all"
                  >
                    <option value="" className="bg-[#1a1509] text-white/50">Select primary trade…</option>
                    {TRADES.map((t) => (
                      <option key={t} value={t} className="bg-[#1a1509] text-white">{t}</option>
                    ))}
                  </select>
                  <svg className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/30 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                </div>
              </div>

              {/* Secondary trades */}
              <div className="space-y-2">
                <label className={labelCls}>Secondary Trades <span className="text-white/30">(optional)</span></label>
                <div className="flex flex-wrap gap-2">
                  {TRADES.filter((t) => t !== primaryTrade).map((trade) => {
                    const selected = secondaryTrades.includes(trade);
                    return (
                      <button
                        key={trade}
                        type="button"
                        onClick={() => toggleSecondaryTrade(trade)}
                        className={`h-8 px-3 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 border ${
                          selected
                            ? "bg-primary/15 border-primary/40 text-primary"
                            : "bg-white/4 border-white/8 text-white/45 hover:bg-white/8 hover:text-white/65"
                        }`}
                      >
                        {selected && <Check className="h-3 w-3 flex-shrink-0" />}
                        {trade}
                      </button>
                    );
                  })}
                </div>
                {secondaryTrades.length > 0 && (
                  <p className="text-xs text-white/35">{secondaryTrades.length} additional trade{secondaryTrades.length !== 1 ? "s" : ""}</p>
                )}
              </div>
            </div>
          )}

          {/* Service Area (tradie only) */}
          {isTradie && (
            <div className="bg-[#130f07] border border-white/6 rounded-2xl p-6 space-y-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="font-bold text-white">Service Area</h2>
                  <p className="text-xs text-white/40 mt-1">Only receive job notifications for suburbs you service. Leave empty to receive all jobs.</p>
                </div>
              </div>

              {/* Radius preference */}
              <div className="space-y-1.5">
                <label className={labelCls}>Preferred radius from your location</label>
                <div className="relative">
                  <select
                    value={serviceRadius ?? ""}
                    onChange={(e) => setServiceRadius(e.target.value === "" ? null : Number(e.target.value))}
                    className="w-full h-11 bg-white/6 border border-white/10 rounded-xl px-4 pr-10 text-sm text-white appearance-none focus:outline-none focus:border-primary/50 focus:bg-white/8 transition-all"
                  >
                    {SERVICE_RADIUS_OPTIONS.map((opt) => (
                      <option
                        key={opt.label}
                        value={opt.value ?? ""}
                        className="bg-[#1a1509] text-white"
                      >
                        {opt.label}
                      </option>
                    ))}
                  </select>
                  <svg className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/30 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                </div>
              </div>

              {/* Suburb tags */}
              <div className="space-y-1.5">
                <label className={labelCls}>Specific suburbs <span className="text-white/30">(overrides radius)</span></label>
                <ServiceSuburbTags
                  selected={serviceSuburbs}
                  onChange={setServiceSuburbs}
                  inputCls={inputCls}
                />
              </div>
            </div>
          )}

          {/* ABN + Licence Verification (tradie only) */}
          {isTradie && (
            <div className="bg-[#130f07] border border-white/6 rounded-2xl p-6 space-y-4">
              <div>
                <h2 className="font-bold text-white">Verification</h2>
                <p className="text-xs text-white/40 mt-1">Your ABN is required to claim any job. A trade licence is required for licensed trades (Plumbing, Electrical, HVAC, Roofing, Pest Control).</p>
              </div>
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className={labelCls}>ABN <span className="text-red-400">*</span></label>
                  <input
                    className={inputCls}
                    value={abn}
                    onChange={(e) => setAbn(e.target.value)}
                    placeholder="12 345 678 901"
                    maxLength={14}
                  />
                  {abn && <p className="text-[11px] text-emerald-400/80">ABN on file — unlocks job claiming</p>}
                </div>
                <div className="space-y-1.5">
                  <label className={labelCls}>Trade Licence Number</label>
                  <input
                    className={inputCls}
                    value={licenceNumber}
                    onChange={(e) => setLicenceNumber(e.target.value)}
                    placeholder="e.g. NSW-PL-001234"
                  />
                  {licenceNumber && <p className="text-[11px] text-emerald-400/80">Licence on file — required for licensed trades</p>}
                </div>
              </div>
            </div>
          )}

          {/* Skill categories (tradie only) */}
          {isTradie && (
            <div className="bg-[#130f07] border border-white/6 rounded-2xl p-6 space-y-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="font-bold text-white">Trade Skills</h2>
                  <p className="text-xs text-white/40 mt-1">Select the trades you offer — this helps match you to the right jobs.</p>
                </div>
                <span className="text-[10px] font-semibold px-2 py-1 rounded-lg bg-primary/10 text-primary border border-primary/20 flex-shrink-0">
                  Trust Card
                </span>
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
                            ? "bg-primary/15 border-primary/40 text-primary"
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

          {/* Work Photos (tradie only) */}
          {isTradie && (
            <div className="bg-[#130f07] border border-white/6 rounded-2xl p-6 space-y-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="font-bold text-white">Work Photos</h2>
                  <p className="text-xs text-white/40 mt-1">Show homeowners your past work — up to 6 photos. Paste image URLs (e.g. from Imgur).</p>
                </div>
                <span className="text-[10px] font-semibold px-2 py-1 rounded-lg bg-primary/10 text-primary border border-primary/20 flex-shrink-0">
                  Trust Card
                </span>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {workPhotoUrls.map((url, i) => (
                  <div key={i} className="space-y-1.5">
                    <label className={labelCls}>Photo {i + 1}</label>
                    <div className="flex items-center gap-1.5">
                      <input
                        type="url"
                        className={`${inputCls} flex-1`}
                        value={url}
                        onChange={(e) => {
                          const updated = [...workPhotoUrls];
                          updated[i] = e.target.value;
                          setWorkPhotoUrls(updated);
                        }}
                        placeholder="https://i.imgur.com/…"
                      />
                      <CloudinaryUpload
                        folder="fixit247/work-photos"
                        label=""
                        onUploaded={(uploadedUrl) => {
                          const updated = [...workPhotoUrls];
                          updated[i] = uploadedUrl;
                          setWorkPhotoUrls(updated);
                        }}
                      />
                    </div>
                    {url && url.startsWith("http") && (
                      <img
                        src={url}
                        alt={`Work sample ${i + 1}`}
                        className="w-full h-20 object-cover rounded-lg border border-white/8"
                        onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                      />
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={updateMutation.isPending}
            className="w-full h-11 rounded-xl bg-primary hover:opacity-90 text-primary-foreground font-bold text-[15px] transition-colors disabled:opacity-60"
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
