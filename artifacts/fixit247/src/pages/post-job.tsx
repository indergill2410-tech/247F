import { useState } from "react";
import { useLocation } from "wouter";
import { motion } from "framer-motion";
import { useCreateJob, useListCategories } from "@workspace/api-client-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertCircle, ChevronLeft, Zap, Clock, Briefcase } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const URGENCIES = [
  { value: "standard",  label: "Standard",  desc: "Non-urgent, flexible timing",        Icon: Briefcase, border: "border-white/10",         active: "border-white/30 bg-white/5" },
  { value: "urgent",    label: "Urgent",    desc: "Needed within 24 hours",             Icon: Clock,     border: "border-orange-500/15",    active: "border-orange-500/40 bg-orange-500/8" },
  { value: "emergency", label: "Emergency", desc: "Critical, needs immediate attention", Icon: Zap,       border: "border-red-500/15",       active: "border-red-500/40 bg-red-500/8" },
];

const inputCls = "w-full h-11 bg-white/6 border border-white/10 rounded-xl px-4 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-[#f5c518]/50 focus:bg-white/8 transition-all";
const textareaCls = "w-full bg-white/6 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-[#f5c518]/50 focus:bg-white/8 transition-all resize-none";
const labelCls = "text-sm font-medium text-white/65";

export default function PostJobPage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { data: categories } = useListCategories();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [urgency, setUrgency] = useState("standard");
  const [suburb, setSuburb] = useState("");
  const [postcode, setPostcode] = useState("");
  const [address, setAddress] = useState("");
  const [budget, setBudget] = useState("");
  const [error, setError] = useState("");

  const createMutation = useCreateJob({
    mutation: {
      onSuccess: (job) => {
        toast({ title: "Job posted!", description: "Your job is now live. Tradies will be notified." });
        setLocation(`/jobs/${job.id}`);
      },
      onError: (err) => {
        setError((err as { data?: { message?: string } })?.data?.message ?? "Failed to post job");
      },
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!categoryId) { setError("Please select a category"); return; }
    createMutation.mutate({
      data: { title, description, categoryId: Number(categoryId), urgency: urgency as "standard" | "urgent" | "emergency", suburb: suburb || undefined, postcode: postcode || undefined, address: address || undefined, budget: budget ? Number(budget) : undefined },
    });
  };

  return (
    <div className="min-h-screen bg-[#0b0904]">
      {/* Header */}
      <div className="border-b border-white/6 bg-[#0f0c06] py-8">
        <div className="container max-w-2xl mx-auto px-4 sm:px-6">
          <button onClick={() => setLocation("/dashboard")} className="flex items-center gap-1 text-white/40 hover:text-white text-sm mb-5 transition-colors">
            <ChevronLeft className="h-4 w-4" /> Back to Dashboard
          </button>
          <h1 className="text-2xl font-black text-white">Post a Job</h1>
          <p className="text-white/40 mt-1 text-sm">Tell us what needs fixing and we'll match you with the right tradie.</p>
        </div>
      </div>

      <div className="container max-w-2xl mx-auto px-4 sm:px-6 py-8">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
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
                <label className={labelCls}>Job Title *</label>
                <input className={inputCls} placeholder="e.g. Leaking kitchen tap needs fixing" value={title} onChange={(e) => setTitle(e.target.value)} required />
              </div>
              <div className="space-y-1.5">
                <label className={labelCls}>Description *</label>
                <textarea className={textareaCls} rows={4} placeholder="Describe the problem in detail. What needs to be done? Any special requirements?" value={description} onChange={(e) => setDescription(e.target.value)} required />
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
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${urgency === u.value ? "bg-[#f5c518]" : "bg-white/8"}`}>
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
                <label className={labelCls}>Street Address <span className="text-white/30">(optional)</span></label>
                <input className={inputCls} placeholder="123 Main St" value={address} onChange={(e) => setAddress(e.target.value)} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className={labelCls}>Suburb</label>
                  <input className={inputCls} placeholder="Bondi" value={suburb} onChange={(e) => setSuburb(e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <label className={labelCls}>Postcode</label>
                  <input className={inputCls} placeholder="2026" value={postcode} onChange={(e) => setPostcode(e.target.value)} />
                </div>
              </div>
            </div>

            {/* Budget */}
            <div className="bg-[#130f07] border border-white/6 rounded-2xl p-6 space-y-3">
              <h2 className="font-bold text-white">Budget <span className="text-white/35 font-normal text-sm">(optional)</span></h2>
              <div className="space-y-1.5">
                <label className={labelCls}>Estimated Budget (AUD)</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40 font-medium text-sm">$</span>
                  <input className={`${inputCls} pl-8`} type="number" placeholder="0" value={budget} onChange={(e) => setBudget(e.target.value)} min="0" />
                </div>
                <p className="text-xs text-white/30">Tradies will use this as a guide for their quotes.</p>
              </div>
            </div>

            <button
              type="submit"
              disabled={createMutation.isPending}
              className="w-full h-12 rounded-xl bg-[#f5c518] hover:bg-[#e6b800] text-black font-bold text-[15px] transition-colors disabled:opacity-60"
            >
              {createMutation.isPending ? "Posting job…" : "Post Job & Get Matched"}
            </button>
          </form>
        </motion.div>
      </div>
    </div>
  );
}
