import { usePageTitle } from "@/hooks/use-page-title";
import { track } from "@/lib/posthog";
import { CloudinaryUpload } from "@/components/cloudinary-upload";
import { useState, useEffect, useRef } from "react";
import { useLocation, useSearch } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { useCreateJob, useListCategories } from "@workspace/api-client-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertCircle, ChevronLeft, Zap, Clock, Briefcase, Wrench, Home, Building2, Star, UserPlus, CheckCircle, Shield } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { SuburbInput } from "@/components/suburb-input";
import { useAuth } from "@/hooks/use-auth";
import { Link } from "wouter";

const URGENCIES = [
  { value: "standard",  label: "Standard",  desc: "Non-urgent, flexible timing",        Icon: Briefcase, border: "border-white/10",         active: "border-white/30 bg-white/5" },
  { value: "urgent",    label: "Urgent",    desc: "Needed within 24 hours",             Icon: Clock,     border: "border-orange-500/15",    active: "border-orange-500/40 bg-orange-500/8" },
  { value: "emergency", label: "Emergency", desc: "Critical, needs immediate attention", Icon: Zap,       border: "border-red-500/15",       active: "border-red-500/40 bg-red-500/8" },
];

const SIZE_BANDS = [
  {
    value: "small",
    label: "Small",
    desc: "Minor repairs, quick fixes under 2 hours",
    examples: "Leaking tap, lock change, patch a hole",
    range: "$30–$60",
    Icon: Wrench,
    border: "border-white/10",
    active: "border-primary/50 bg-primary/6",
  },
  {
    value: "medium",
    label: "Medium",
    desc: "Standard jobs, 2–8 hours of work",
    examples: "Ceiling fan install, leaking pipe, paint a room",
    range: "$80–$150",
    Icon: Home,
    border: "border-white/10",
    active: "border-primary/50 bg-primary/6",
  },
  {
    value: "large",
    label: "Large",
    desc: "Complex jobs, multiple days or trades",
    examples: "Bathroom reno, re-roof, rewire circuits",
    range: "$200–$400",
    Icon: Building2,
    border: "border-white/10",
    active: "border-primary/50 bg-primary/6",
  },
  {
    value: "premium",
    label: "Premium",
    desc: "Major projects, extensive scope",
    examples: "Full kitchen reno, full house rewire, structural repair",
    range: "$500–$800",
    Icon: Star,
    border: "border-white/10",
    active: "border-primary/50 bg-primary/6",
  },
];

const inputCls = "w-full h-11 bg-white/6 border border-white/10 rounded-xl px-4 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-primary/50 focus:bg-white/8 transition-all";
const textareaCls = "w-full bg-white/6 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-primary/50 focus:bg-white/8 transition-all resize-none";
const labelCls = "text-sm font-medium text-white/65";

const STORAGE_KEY = "fixit247_pending_job";

interface PendingJob {
  title: string;
  description: string;
  categoryId: string;
  urgency: string;
  sizeBand: string;
  suburb: string;
  postcode: string;
  address: string;
  budget: string;
}

export default function PostJobPage() {
  usePageTitle("Post a Job");
  const [, setLocation] = useLocation();
  const search = useSearch();
  const { toast } = useToast();
  const { data: categories } = useListCategories();
  const { isAuthenticated } = useAuth();

  const params = new URLSearchParams(search);
  const autosubmit = params.get("autosubmit") === "true";

  // Restore saved form data if returning from auth
  const saved: PendingJob | null = (() => {
    try {
      const raw = sessionStorage.getItem(STORAGE_KEY);
      return raw ? (JSON.parse(raw) as PendingJob) : null;
    } catch {
      return null;
    }
  })();

  const [title, setTitle] = useState(saved?.title ?? "");
  const [description, setDescription] = useState(saved?.description ?? "");
  const [categoryId, setCategoryId] = useState(saved?.categoryId ?? "");
  const [urgency, setUrgency] = useState(saved?.urgency ?? "standard");
  const [sizeBand, setSizeBand] = useState<"small" | "medium" | "large" | "premium" | "">(
    (saved?.sizeBand as "small" | "medium" | "large" | "premium" | "") ?? ""
  );
  const [suburb, setSuburb] = useState(saved?.suburb ?? "");
  const [postcode, setPostcode] = useState(saved?.postcode ?? "");
  const [address, setAddress] = useState(saved?.address ?? "");
  const [budget, setBudget] = useState(saved?.budget ?? "");
  const [jobPhotos, setJobPhotos] = useState<string[]>([]);
  const [error, setError] = useState("");
  const [successJobId, setSuccessJobId] = useState<number | null>(null);
  const [showEmergencyUpsell, setShowEmergencyUpsell] = useState(false);

  const createMutation = useCreateJob({
    mutation: {
      onSuccess: (job) => {
        sessionStorage.removeItem(STORAGE_KEY);
        track("job_posted", { jobId: job.id, urgency: job.urgency, categoryId: job.categoryId });
        setSuccessJobId(job.id);
        if (job.urgency === "emergency") setShowEmergencyUpsell(true);
      },
      onError: (err) => {
        setError((err as { data?: { message?: string } })?.data?.message ?? "Failed to post job");
      },
    },
  });

  // Auto-submit once authenticated and autosubmit flag is set
  const autosubmitFiredRef = useRef(false);
  useEffect(() => {
    if (autosubmit && isAuthenticated && saved && !autosubmitFiredRef.current) {
      autosubmitFiredRef.current = true;
      if (!saved.categoryId || !saved.sizeBand) return;
      createMutation.mutate({
        data: {
          title: saved.title,
          description: saved.description,
          categoryId: Number(saved.categoryId),
          urgency: saved.urgency as "standard" | "urgent" | "emergency",
          sizeBand: saved.sizeBand as "small" | "medium" | "large" | "premium",
          suburb: saved.suburb || undefined,
          postcode: saved.postcode || undefined,
          address: saved.address || undefined,
          budget: saved.budget ? Number(saved.budget) : undefined,
        },
      });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autosubmit, isAuthenticated]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!categoryId) { setError("Please select a category"); return; }
    if (!sizeBand) { setError("Please select a job size"); return; }

    // If not authenticated, save form and redirect to register
    if (!isAuthenticated) {
      const pending: PendingJob = { title, description, categoryId, urgency, sizeBand, suburb, postcode, address, budget };
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(pending));
      setLocation("/register?redirect=%2Fpost-job&autosubmit=true");
      return;
    }

    createMutation.mutate({
      data: {
        title,
        description,
        categoryId: Number(categoryId),
        urgency: urgency as "standard" | "urgent" | "emergency",
        sizeBand: sizeBand as "small" | "medium" | "large" | "premium",
        suburb: suburb || undefined,
        postcode: postcode || undefined,
        address: address || undefined,
        budget: budget ? Number(budget) : undefined,
        imageUrls: jobPhotos.length > 0 ? jobPhotos : undefined,
      },
    });
  };

  const backHref = isAuthenticated ? "/dashboard" : "/";

  // Post-job success screen
  if (successJobId !== null && !showEmergencyUpsell) {
    return (
      <div className="min-h-screen bg-[#0b0904] flex items-center justify-center px-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 16 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="bg-[#130f07] border border-white/10 rounded-2xl p-8 max-w-md w-full text-center shadow-2xl"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.15, type: "spring", stiffness: 260, damping: 20 }}
            className="flex items-center justify-center h-16 w-16 rounded-full bg-emerald-500/15 mx-auto mb-4"
          >
            <CheckCircle className="h-8 w-8 text-emerald-400" />
          </motion.div>
          <h2 className="text-2xl font-black text-white mb-2">Your job is live!</h2>
          <p className="text-white/55 text-sm mb-1">Tradies in your area are being notified now.</p>
          <p className="text-white/40 text-xs mb-6">First responses typically arrive within ~20 minutes.</p>
          {jobPhotos.length === 0 && (
            <div className="bg-primary/8 border border-primary/20 rounded-xl p-3 mb-6 text-left">
              <p className="text-primary text-xs font-semibold mb-0.5">Tip: Add photos</p>
              <p className="text-white/50 text-xs">Jobs with photos get 3× more responses. You can add them from the job detail page.</p>
            </div>
          )}
          <Link to={`/jobs/${successJobId}`}>
            <button className="w-full bg-primary text-black font-bold py-3 rounded-xl hover:bg-primary/90 transition-colors mb-3">
              View job & quotes →
            </button>
          </Link>
          <Link to="/post-job">
            <button
              onClick={() => { setSuccessJobId(null); setShowEmergencyUpsell(false); }}
              className="w-full text-white/40 text-sm py-2 hover:text-white/60 transition-colors"
            >
              Post another job
            </button>
          </Link>
        </motion.div>
      </div>
    );
  }

  return (
    <>
    <AnimatePresence>
      {showEmergencyUpsell && successJobId !== null && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-black/70 backdrop-blur-sm"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.25 }}
            className="bg-[#130f07] border border-white/10 rounded-2xl p-7 max-w-sm w-full shadow-2xl"
          >
            <div className="flex items-center justify-center h-14 w-14 rounded-2xl bg-red-500/15 mx-auto mb-4">
              <Shield className="h-7 w-7 text-red-400" />
            </div>
            <h2 className="text-xl font-black text-white text-center mb-1">Emergency job posted!</h2>
            <p className="text-white/55 text-sm text-center mb-4">
              Protect yourself with <span className="text-primary font-bold">Fixit 24/7 Plus</span> — unlimited emergency call-outs, 24/7 priority support, and $0 excess on urgent jobs.
            </p>
            <ul className="space-y-2 mb-5">
              {["Unlimited emergency call-outs per year", "Priority tradie matching (avg 8 min)", "Dedicated support hotline, 24/7", "$49 AUD/month — cancel anytime"].map((item) => (
                <li key={item} className="flex items-start gap-2 text-sm text-white/70">
                  <CheckCircle className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />
                  {item}
                </li>
              ))}
            </ul>
            <Link to="/emergency-membership">
              <button
                onClick={() => setShowEmergencyUpsell(false)}
                className="w-full bg-primary text-black font-bold py-3 rounded-xl hover:bg-primary/90 transition-colors mb-2"
              >
                Get Fixit 24/7 Plus — $49/mo
              </button>
            </Link>
            <button
              onClick={() => setShowEmergencyUpsell(false)}
              className="w-full text-white/40 text-sm py-2 hover:text-white/60 transition-colors"
            >
              No thanks, view my job
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
    <div className="min-h-screen bg-[#0b0904]">
      {/* Header */}
      <div className="border-b border-white/6 bg-[#0f0c06] py-8">
        <div className="container max-w-2xl mx-auto px-4 sm:px-6">
          <button onClick={() => setLocation(backHref)} className="flex items-center gap-1 text-white/40 hover:text-white text-sm mb-5 transition-colors">
            <ChevronLeft className="h-4 w-4" /> {isAuthenticated ? "Back to Dashboard" : "Back to Home"}
          </button>
          <h1 className="text-2xl font-black text-white">Post a Job</h1>
          <p className="text-white/40 mt-1 text-sm">Tell us what needs fixing and we'll match you with the right tradie.</p>
        </div>
      </div>

      <div className="container max-w-2xl mx-auto px-4 sm:px-6 py-8">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          {/* Auto-submitting indicator */}
          {autosubmit && isAuthenticated && (
            <div className="flex items-center gap-2 text-sm text-primary bg-primary/10 border border-primary/20 rounded-xl px-4 py-3 mb-5">
              <div className="w-3.5 h-3.5 border-2 border-primary border-t-transparent rounded-full animate-spin flex-shrink-0" />
              Submitting your job…
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="flex items-center gap-2 text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3">
                <AlertCircle className="h-4 w-4 flex-shrink-0" />{error}
              </div>
            )}

            {/* Job Details */}
            <div className="bg-[#130f07] border border-white/6 rounded-2xl p-6 space-y-5">
              <h2 className="font-bold text-white">Job Details</h2>
              <div className="space-y-1.5">
                <label htmlFor="job-title" className={labelCls}>Job Title *</label>
                <input id="job-title" className={inputCls} placeholder="e.g. Leaking kitchen tap needs fixing" value={title} onChange={(e) => setTitle(e.target.value)} required />
              </div>
              <div className="space-y-1.5">
                <label htmlFor="job-description" className={labelCls}>Description *</label>
                <textarea id="job-description" className={textareaCls} rows={4} placeholder="Describe the problem in detail. What needs to be done? Any special requirements?" value={description} onChange={(e) => setDescription(e.target.value)} required />
              </div>
              <div className="space-y-1.5">
                <label className={labelCls}>Category *</label>
                <Select value={categoryId} onValueChange={setCategoryId}>
                  <SelectTrigger className="h-11 bg-white/6 border-white/10 text-white rounded-xl">
                    <SelectValue placeholder="Select a trade category" />
                  </SelectTrigger>
                  <SelectContent className="bg-[#1a1509] border-white/10 text-white">
                    {(categories ?? []).map((c) => (
                      <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Job Size */}
            <div className="bg-[#130f07] border border-white/6 rounded-2xl p-6 space-y-4">
              <div>
                <h2 className="font-bold text-white">Job Size *</h2>
                <p className="text-xs text-white/40 mt-1">This sets the lead cost tradies see upfront. The actual cost is fine-tuned within your chosen range.</p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {SIZE_BANDS.map((band) => (
                  <label
                    key={band.value}
                    className={`flex flex-col gap-2 p-4 rounded-xl border-2 cursor-pointer transition-all ${
                      sizeBand === band.value ? band.active : `${band.border} hover:border-white/20`
                    }`}
                  >
                    <input
                      type="radio"
                      name="sizeBand"
                      value={band.value}
                      checked={sizeBand === band.value}
                      onChange={() => setSizeBand(band.value as typeof sizeBand)}
                      className="sr-only"
                    />
                    <div className="flex items-center gap-2">
                      <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 ${sizeBand === band.value ? "bg-primary" : "bg-white/8"}`}>
                        <band.Icon className={`h-3.5 w-3.5 ${sizeBand === band.value ? "text-black" : "text-white/40"}`} />
                      </div>
                      <span className={`font-bold text-sm ${sizeBand === band.value ? "text-white" : "text-white/70"}`}>{band.label}</span>
                    </div>
                    <p className="text-[11px] text-white/40 leading-relaxed">{band.desc}</p>
                    <p className="text-[10px] text-white/25 italic line-clamp-1">{band.examples}</p>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md self-start ${sizeBand === band.value ? "bg-primary/15 text-primary" : "bg-white/6 text-white/35"}`}>
                      {band.range}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            {/* Urgency */}
            <div className="bg-[#130f07] border border-white/6 rounded-2xl p-6 space-y-4">
              <h2 className="font-bold text-white">Urgency Level</h2>
              <div className="space-y-3">
                {URGENCIES.map((u) => (
                  <label
                    key={u.value}
                    className={`flex items-center gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all ${
                      urgency === u.value ? u.active : `${u.border} hover:border-white/20`
                    }`}
                  >
                    <input type="radio" name="urgency" value={u.value} checked={urgency === u.value} onChange={(e) => setUrgency(e.target.value)} className="sr-only" />
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${urgency === u.value ? "bg-primary" : "bg-white/8"}`}>
                      <u.Icon className={`h-5 w-5 ${urgency === u.value ? "text-black" : "text-white/40"}`} />
                    </div>
                    <div>
                      <p className="font-bold text-white text-sm">{u.label}</p>
                      <p className="text-xs text-white/40 mt-0.5">{u.desc}</p>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            {/* Location */}
            <div className="bg-[#130f07] border border-white/6 rounded-2xl p-6 space-y-4">
              <h2 className="font-bold text-white">Location</h2>
              <div className="space-y-1.5">
                <label htmlFor="job-address" className={labelCls}>Street Address <span className="text-white/30">(optional)</span></label>
                <input id="job-address" className={inputCls} placeholder="123 Main St" value={address} onChange={(e) => setAddress(e.target.value)} />
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

            {/* Budget */}
            <div className="bg-[#130f07] border border-white/6 rounded-2xl p-6 space-y-3">
              <h2 className="font-bold text-white">Budget <span className="text-white/35 font-normal text-sm">(optional)</span></h2>
              <div className="space-y-1.5">
                <label htmlFor="job-budget" className={labelCls}>Estimated Budget (AUD)</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40 font-medium text-sm" aria-hidden="true">$</span>
                  <input id="job-budget" className={`${inputCls} pl-8`} type="number" placeholder="0" value={budget} onChange={(e) => setBudget(e.target.value)} min="0" />
                </div>
                <p className="text-xs text-white/30">Tradies will use this as a guide for their quotes.</p>
              </div>
            </div>

            {/* Job Photos */}
            {isAuthenticated && (
              <div className="space-y-2">
                <label className={labelCls}>Job Photos <span className="text-white/30 font-normal">(optional)</span></label>
                <div className="flex flex-wrap gap-2">
                  {jobPhotos.map((url, i) => (
                    <div key={i} className="relative group">
                      <img src={url} alt={`Job photo ${i + 1}`} className="h-16 w-16 object-cover rounded-lg border border-white/10" />
                      <button
                        type="button"
                        aria-label={`Remove photo ${i + 1}`}
                        onClick={() => setJobPhotos((prev) => prev.filter((_, idx) => idx !== i))}
                        className="absolute -top-1.5 -right-1.5 w-6 h-6 bg-red-500 rounded-full text-white text-xs flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                      >×</button>
                    </div>
                  ))}
                  {jobPhotos.length < 4 && (
                    <CloudinaryUpload
                      folder="fixit247/jobs"
                      label="Add photo"
                      onUploaded={(url) => setJobPhotos((prev) => [...prev, url])}
                    />
                  )}
                </div>
                <p className="text-xs text-white/30">Upload up to 4 photos to help tradies understand the job.</p>
              </div>
            )}

            {/* CTA — changes based on auth state */}
            {!isAuthenticated && (
              <div className="flex items-start gap-3 text-sm text-white/50 bg-white/4 border border-white/8 rounded-xl px-4 py-3">
                <UserPlus className="h-4 w-4 flex-shrink-0 mt-0.5 text-primary" />
                <span>
                  Create a free account to post your job — takes 30 seconds. Your details will be saved automatically.
                </span>
              </div>
            )}

            <button
              type="submit"
              disabled={createMutation.isPending || !sizeBand}
              className="w-full h-12 rounded-xl bg-primary hover:opacity-90 text-primary-foreground font-bold text-[15px] transition-colors disabled:opacity-60"
            >
              {createMutation.isPending
                ? "Posting job…"
                : isAuthenticated
                  ? "Post Job & Get Matched"
                  : "Post Job — Create Free Account"}
            </button>
          </form>
        </motion.div>
      </div>
    </div>
    </>
  );
}
