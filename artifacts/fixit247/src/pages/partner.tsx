import { usePageTitle } from "@/hooks/use-page-title";
import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Footer } from "@/components/footer";
import {
  MapPin, ChevronRight, ChevronDown, CheckCircle2, Star,
  MessageCircle, Phone, Search, Wrench, Zap,
  TrendingUp, HardHat, ShieldCheck, DollarSign, XCircle,
  BarChart3, Quote,
} from "lucide-react";

// ─── Data ────────────────────────────────────────────────────────────────────

const AU_SUBURBS = [
  "Sydney, NSW", "Melbourne, VIC", "Brisbane, QLD", "Perth, WA", "Adelaide, SA",
  "Canberra, ACT", "Hobart, TAS", "Darwin, NT", "Gold Coast, QLD", "Newcastle, NSW",
  "Wollongong, NSW", "Geelong, VIC", "Townsville, QLD", "Cairns, QLD", "Toowoomba, QLD",
  "Ballarat, VIC", "Bendigo, VIC", "Launceston, TAS", "Albury, NSW", "Mackay, QLD",
  "Rockhampton, QLD", "Bunbury, WA", "Bundaberg, QLD", "Coffs Harbour, NSW",
  "Wagga Wagga, NSW", "Sunshine Coast, QLD", "Hervey Bay, QLD", "Mildura, VIC",
  "Tamworth, NSW", "Gladstone, QLD", "Port Macquarie, NSW", "Orange, NSW",
  "Dubbo, NSW", "Geraldton, WA", "Nowra, NSW", "Shepparton, VIC",
  "Lismore, NSW", "Kalgoorlie, WA", "Armidale, NSW", "Maitland, NSW",
  "Devonport, TAS", "Mount Gambier, SA", "Bathurst, NSW", "Whyalla, SA",
  "Bondi, NSW", "Parramatta, NSW", "Manly, NSW", "Penrith, NSW", "Blacktown, NSW",
  "Campbelltown, NSW", "Liverpool, NSW", "Ryde, NSW", "Hornsby, NSW",
  "St Kilda, VIC", "Fitzroy, VIC", "Collingwood, VIC", "South Yarra, VIC",
  "Hawthorn, VIC", "Footscray, VIC", "Dandenong, VIC", "Frankston, VIC",
  "Fortitude Valley, QLD", "South Brisbane, QLD", "Chermside, QLD", "Springwood, QLD",
  "Fremantle, WA", "Joondalup, WA", "Mandurah, WA", "Midland, WA",
  "Glenelg, SA", "Prospect, SA", "Norwood, SA", "Tea Tree Gully, SA",
  "Karratha, WA", "Albany, WA", "Broken Hill, NSW", "Goulburn, NSW",
];

const TRADE_CATEGORIES = [
  "Plumbing", "Electrical", "Locksmith", "HVAC / Air Conditioning",
  "Roofing", "Carpentry", "Painting", "Handyman",
  "Pest Control", "Cleaning", "Appliance Repair", "Glazing / Windows",
  "Garage Doors", "Landscaping", "Tiling", "Plastering",
  "Emergency Repairs", "General Maintenance",
];

const REVENUE_RANGES = [
  "Under $100K per year", "$100K – $250K per year",
  "$250K – $500K per year", "$500K – $1M per year",
  "Over $1M per year", "Prefer not to say",
];

const MONTHLY_JOB_VOLUMES = [
  "Under 10 jobs / month", "10–30 jobs / month",
  "30–60 jobs / month", "60–100 jobs / month", "Over 100 jobs / month",
];

const TEAM_SIZES = [
  "Just me (sole operator)", "2–5 people",
  "6–10 people", "11–20 people", "Over 20 people",
];

const GROWTH_CHALLENGES = [
  "Not enough consistent enquiries",
  "Too much manual follow-up",
  "Hard to hire or manage a team",
  "Weak local visibility",
  "Poor conversion from enquiry to booked job",
  "Too dependent on referrals",
  "No clear systems",
  "Want to expand service area",
];

const AU_STATES = ["NSW", "VIC", "QLD", "WA", "SA", "TAS", "ACT", "NT"];

const SCALING_PILLARS = [
  {
    icon: BarChart3,
    title: "Better local visibility",
    desc: "We help trade businesses build stronger local presence so the right customers find you first — not your competitors.",
  },
  {
    icon: MessageCircle,
    title: "Growth-focused systems",
    desc: "Structure, onboarding, and repeatable systems to help tradies move beyond scattered daily operations.",
  },
  {
    icon: Phone,
    title: "Strategy calls with our team",
    desc: "Speak with the Fixit 24/7 growth team about your current business, bottlenecks, and what's next.",
  },
];

const TESTIMONIALS = [
  {
    name: "Dan K.",
    trade: "Electrician · Sydney, NSW",
    quote: "I was paying $120+ per lead on other platforms and still losing jobs I had no idea about. Fixit 24/7 shows me the job cost before I commit. Game changer.",
    rating: 5,
  },
  {
    name: "Marcus T.",
    trade: "Plumber · Brisbane, QLD",
    quote: "No commission on jobs I win. No mystery pricing. I started with the $111 free wallet and landed 4 jobs in my first 2 weeks. Stoked.",
    rating: 5,
  },
  {
    name: "Sarah L.",
    trade: "HVAC Technician · Melbourne, VIC",
    quote: "Other apps charge you whether you win the job or not. Here I only spend when I choose to claim a job — and I can see the cost upfront. Makes budgeting easy.",
    rating: 5,
  },
];

const PARTNER_FAQS = [
  {
    q: "How much does it cost to claim a job?",
    a: "Lead costs vary by job size and are always shown upfront before you commit — typically $22–$80 per lead. You only pay when you choose to claim. If you win the job, there is zero commission taken by Fixit 24/7.",
  },
  {
    q: "What is the $111 free wallet credit?",
    a: "Every new tradie receives $111 in wallet credit on signup — enough to claim several real jobs and test the platform properly. Starter and Pro subscribers receive ongoing monthly credits as part of their plan.",
  },
  {
    q: "Is there a commission on jobs I win?",
    a: "No. Fixit 24/7 charges a fair, transparent lead fee — that's it. There is no commission, no revenue share, and no hidden fees on jobs you complete.",
  },
  {
    q: "How is this different from other lead platforms?",
    a: "Most platforms charge $80–$200+ per lead whether you win the job or not, and multiple tradies are sent the same lead. On Fixit 24/7, you see the job cost before you commit, leads are fairly priced, and you keep 100% of what you earn.",
  },
  {
    q: "Can I choose which jobs I claim?",
    a: "Yes. You browse available jobs in your service area, see the lead cost upfront, and choose which ones to claim. You are in full control of your spending.",
  },
  {
    q: "What's included in the Starter and Pro plans?",
    a: "Starter ($49/mo) includes monthly wallet top-ups, priority job matching, and a verified tradie badge. Pro ($99/mo) adds boosted profile ranking, dedicated support, and higher monthly credit value — making it the best value for active tradies.",
  },
  {
    q: "Can I cancel my subscription anytime?",
    a: "Yes. Subscriptions are month-to-month with no lock-in. Cancel any time from your dashboard.",
  },
  {
    q: "Who can sign up as a tradie?",
    a: "Qualified tradies, licensed service professionals, and trade business owners operating in Australia. You'll need a valid licence or registration for regulated trades.",
  },
  {
    q: "Is submitting the growth enquiry form a commitment?",
    a: "No. It's an expression of interest only. There is no pressure and no commitment at this stage.",
  },
];

// ─── Shared styles ────────────────────────────────────────────────────────────

const INPUT_CLS =
  "w-full h-11 bg-white/6 border border-white/10 rounded-xl px-4 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-[#ffc800]/50 focus:bg-white/8 transition-all";
const LABEL_CLS = "block text-sm font-medium text-white/70 mb-1.5";
const ERROR_MSG = "text-red-400 text-xs mt-1";
const SECTION_HDR = "text-xs font-bold uppercase tracking-widest text-[#ffc800] mb-4 mt-8 first:mt-0";

// ─── SuburbInput ──────────────────────────────────────────────────────────────

function SuburbInput({
  id, value, onChange, placeholder = "e.g. Sydney, NSW", required,
}: {
  id?: string; value: string; onChange: (v: string) => void;
  placeholder?: string; required?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const filtered = value.length >= 2
    ? AU_SUBURBS.filter((s) => s.toLowerCase().includes(value.toLowerCase())).slice(0, 8)
    : [];

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div ref={ref} className="relative">
      <div className="relative">
        <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/30 pointer-events-none" aria-hidden="true" />
        <input
          id={id}
          type="text"
          value={value}
          required={required}
          placeholder={placeholder}
          autoComplete="off"
          className={`${INPUT_CLS} pl-9`}
          onChange={(e) => { onChange(e.target.value); setOpen(true); }}
          onFocus={() => { if (filtered.length > 0) setOpen(true); }}
          aria-autocomplete="list"
          aria-expanded={open}
        />
      </div>
      <AnimatePresence>
        {open && filtered.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.12 }}
            className="absolute z-30 top-full mt-1 w-full bg-[#1a1510] border border-white/15 rounded-xl shadow-xl overflow-hidden"
            role="listbox"
          >
            {filtered.map((s) => (
              <button
                key={s}
                type="button"
                role="option"
                aria-selected={value === s}
                className="w-full text-left px-4 py-2.5 text-sm text-white/80 hover:bg-[#ffc800]/10 hover:text-white transition-colors flex items-center gap-2"
                onMouseDown={(e) => { e.preventDefault(); onChange(s); setOpen(false); }}
              >
                <MapPin className="h-3.5 w-3.5 text-[#ffc800] shrink-0" aria-hidden="true" />
                {s}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── CategorySelect ───────────────────────────────────────────────────────────

function CategorySelect({
  value, onChange, required,
}: { value: string; onChange: (v: string) => void; required?: boolean }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState(value);
  const ref = useRef<HTMLDivElement>(null);

  const filtered = query.length === 0
    ? TRADE_CATEGORIES
    : TRADE_CATEGORIES.filter((c) => c.toLowerCase().includes(query.toLowerCase()));

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  useEffect(() => { setQuery(value); }, [value]);

  return (
    <div ref={ref} className="relative">
      <div className="relative">
        <input
          type="text"
          value={query}
          required={required}
          placeholder="Search trade category…"
          autoComplete="off"
          className={`${INPUT_CLS} pr-9`}
          onFocus={() => setOpen(true)}
          onChange={(e) => { setQuery(e.target.value); onChange(""); setOpen(true); }}
          aria-autocomplete="list"
          aria-expanded={open}
        />
        <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/30 pointer-events-none" aria-hidden="true" />
      </div>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.12 }}
            className="absolute z-30 top-full mt-1 w-full bg-[#1a1510] border border-white/15 rounded-xl shadow-xl overflow-hidden max-h-52 overflow-y-auto"
            role="listbox"
          >
            {filtered.length === 0 ? (
              <div className="px-4 py-3 text-sm text-white/40">No categories found</div>
            ) : filtered.map((c) => (
              <button
                key={c}
                type="button"
                role="option"
                aria-selected={value === c}
                className={`w-full text-left px-4 py-2.5 text-sm transition-colors flex items-center gap-2 ${
                  value === c ? "text-[#ffc800] bg-[#ffc800]/8" : "text-white/80 hover:bg-[#ffc800]/10 hover:text-white"
                }`}
                onMouseDown={(e) => { e.preventDefault(); onChange(c); setQuery(c); setOpen(false); }}
              >
                <Wrench className="h-3.5 w-3.5 text-[#ffc800] shrink-0" aria-hidden="true" />
                {c}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── AccordionItem ────────────────────────────────────────────────────────────

function AccordionItem({ q, a, isOpen, onToggle }: {
  q: string; a: string; isOpen: boolean; onToggle: () => void;
}) {
  return (
    <div className="border border-white/8 rounded-2xl overflow-hidden bg-white/3 hover:bg-white/5 transition-colors">
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between gap-4 px-5 py-4 text-left"
        aria-expanded={isOpen}
      >
        <span className="font-semibold text-white text-[15px] leading-snug">{q}</span>
        <ChevronDown
          className={`h-4 w-4 text-[#ffc800] shrink-0 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
          aria-hidden="true"
        />
      </button>
      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.22, ease: "easeInOut" }}
            className="overflow-hidden"
          >
            <p className="px-5 pb-5 text-white/55 text-sm leading-relaxed">{a}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── FieldError ───────────────────────────────────────────────────────────────

function FieldError({ msg }: { msg?: string }) {
  if (!msg) return null;
  return <p className={ERROR_MSG} role="alert">{msg}</p>;
}

// ─── Partner page ─────────────────────────────────────────────────────────────

type FormState = {
  name: string; email: string; phone: string;
  tradeName: string; category: string; licenceStatus: string; yearsExp: string;
  revenueRange: string; monthlyJobs: string; teamSize: string;
  suburb: string; state: string; serviceArea: string;
  growthChallenges: string[]; growthGoals: string; vision: string; message: string;
  consent: boolean;
};

const EMPTY_FORM: FormState = {
  name: "", email: "", phone: "", tradeName: "", category: "", licenceStatus: "",
  yearsExp: "", revenueRange: "", monthlyJobs: "", teamSize: "",
  suburb: "", state: "", serviceArea: "",
  growthChallenges: [], growthGoals: "", vision: "", message: "", consent: false,
};

export default function PartnerPage() {
  usePageTitle("For Tradies");
  const formRef = useRef<HTMLElement>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>({});
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const set = (key: keyof FormState) => (val: string) =>
    setForm((f) => ({ ...f, [key]: val }));

  const toggleChallenge = (c: string) =>
    setForm((f) => ({
      ...f,
      growthChallenges: f.growthChallenges.includes(c)
        ? f.growthChallenges.filter((x) => x !== c)
        : [...f.growthChallenges, c],
    }));

  const validate = (): Partial<Record<keyof FormState, string>> => {
    const e: Partial<Record<keyof FormState, string>> = {};
    if (!form.name.trim() || form.name.trim().length < 2) e.name = "Please enter your full name.";
    if (!form.email.trim() || !/\S+@\S+\.\S+/.test(form.email)) e.email = "Please enter a valid email address.";
    if (!form.phone.trim() || form.phone.replace(/\D/g, "").length < 10) e.phone = "Please enter a valid Australian phone number.";
    if (!form.tradeName.trim()) e.tradeName = "Please enter your business or trade name.";
    if (!form.category) e.category = "Please select your primary trade category.";
    if (!form.suburb.trim()) e.suburb = "Please enter your suburb or city.";
    if (!form.state) e.state = "Please select your state.";
    if (!form.consent) e.consent = "Please agree to be contacted before submitting.";
    return e;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs = validate();
    setErrors(errs);
    if (Object.keys(errs).length > 0) {
      const firstKey = Object.keys(errs)[0];
      document.getElementById(firstKey)?.focus();
      return;
    }
    setStatus("loading");
    try {
      const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");
      const resp = await fetch(`${BASE}/api/partner-enquiry`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!resp.ok) {
        const data = await resp.json().catch(() => ({})) as { message?: string };
        throw new Error(data?.message ?? "Server error");
      }
      setStatus("success");
    } catch {
      setStatus("error");
    }
  };

  const scrollToForm = () =>
    formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });

  return (
    <div className="flex flex-col min-h-screen bg-[#0b0904] text-white">

      {/* ─── Hero ─── */}
      <section
        className="py-20 sm:py-28 text-center relative overflow-hidden"
        style={{ background: "radial-gradient(ellipse at 50% 110%, #2e1f00 0%, #130f06 55%, #070604 100%)" }}
      >
        <div
          className="absolute inset-0 opacity-[0.03] pointer-events-none"
          style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23ffffff' fill-opacity='1' fill-rule='evenodd'%3E%3Ccircle cx='1' cy='1' r='1'/%3E%3C/g%3E%3C/svg%3E")` }}
          aria-hidden="true"
        />
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55 }}
          className="container max-w-3xl mx-auto px-4 sm:px-6 relative"
        >
          <div className="inline-flex items-center gap-2 bg-[#ffc800]/10 border border-[#ffc800]/25 rounded-full px-4 py-1.5 text-xs font-bold text-[#ffc800] uppercase tracking-widest mb-6">
            <HardHat className="h-3.5 w-3.5" aria-hidden="true" /> For Australian Tradies
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black leading-[1.05] tracking-tight mb-5">
            Stop chasing leads.<br />
            <span className="text-[#ffc800]">Start choosing jobs.</span>
          </h1>

          <p className="text-white/65 text-lg leading-relaxed max-w-2xl mx-auto mb-3">
            Fixit 24/7 connects qualified tradies with homeowners who need help — right now, in your area.
            Fairly priced leads, zero commission on jobs you win, and <strong className="text-white">$111 free</strong> to get started.
          </p>
          <p className="text-white/40 text-sm max-w-xl mx-auto mb-8">
            No fortune required. No commission taken. No guessing what a lead costs before you commit.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 justify-center mb-8">
            <a href="/signup?role=tradie">
              <button className="h-13 px-8 rounded-xl bg-[#ffc800] hover:bg-[#e6b800] active:scale-[0.97] text-black font-bold text-[15px] transition-all inline-flex items-center justify-center gap-2">
                Start free — claim your $111 <ChevronRight className="h-4 w-4" aria-hidden="true" />
              </button>
            </a>
            <button
              onClick={scrollToForm}
              className="h-13 px-8 rounded-xl border border-white/20 hover:bg-white/8 active:scale-[0.97] text-white font-bold text-[15px] transition-all"
            >
              Talk to our growth team
            </button>
          </div>

          <div className="flex flex-wrap justify-center gap-3">
            {["$111 free to start", "No commission on wins", "See job cost before you claim", "Cancel anytime"].map((t) => (
              <span key={t} className="inline-flex items-center gap-1.5 text-xs font-medium text-white/45 bg-white/5 rounded-full px-3 py-1">
                <CheckCircle2 className="h-3 w-3 text-[#ffc800]" aria-hidden="true" /> {t}
              </span>
            ))}
          </div>
        </motion.div>
      </section>

      {/* ─── Competitor comparison band ─── */}
      <section className="py-10 bg-[#110d06] border-y border-white/8">
        <div className="container max-w-4xl mx-auto px-4 sm:px-6">
          <p className="text-center text-xs font-bold uppercase tracking-widest text-white/30 mb-8">How we're different</p>
          <div className="grid md:grid-cols-2 gap-4">
            {/* Other platforms */}
            <div className="bg-red-500/5 border border-red-500/15 rounded-2xl p-6">
              <p className="text-xs font-bold uppercase tracking-widest text-red-400/70 mb-4">Other lead platforms</p>
              <ul className="flex flex-col gap-3">
                {[
                  "Charge $80–$200+ per lead — win or lose",
                  "Multiple tradies sent the same lead",
                  "Take commission on every job you complete",
                  "Hidden fees you discover after the fact",
                  "Leads go stale by the time you're notified",
                ].map((t) => (
                  <li key={t} className="flex items-start gap-2.5 text-sm text-white/50">
                    <XCircle className="h-4 w-4 text-red-400/60 shrink-0 mt-0.5" aria-hidden="true" /> {t}
                  </li>
                ))}
              </ul>
            </div>
            {/* Fixit 24/7 */}
            <div className="bg-[#ffc800]/5 border border-[#ffc800]/20 rounded-2xl p-6">
              <p className="text-xs font-bold uppercase tracking-widest text-[#ffc800] mb-4">Fixit 24/7</p>
              <ul className="flex flex-col gap-3">
                {[
                  "Fairly priced leads — typically $22–$80",
                  "See the exact cost before you claim",
                  "Zero commission on jobs you win — ever",
                  "No lock-in. Cancel anytime.",
                  "Real-time jobs matched to your service area",
                ].map((t) => (
                  <li key={t} className="flex items-start gap-2.5 text-sm text-white/75">
                    <CheckCircle2 className="h-4 w-4 text-[#ffc800] shrink-0 mt-0.5" aria-hidden="true" /> {t}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* ─── $111 free wallet card ─── */}
      <section className="py-14 sm:py-16 bg-[#0b0904] border-b border-white/8">
        <div className="container max-w-3xl mx-auto px-4 sm:px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            viewport={{ once: true }}
            className="bg-white/5 border border-[#ffc800]/20 rounded-2xl p-8 sm:p-10"
          >
            <p className="text-[11px] font-black uppercase tracking-widest text-[#ffc800] mb-4">Your welcome gift</p>

            <div className="flex items-center gap-2 mb-5">
              <span className="inline-flex items-center gap-1.5 bg-[#ffc800]/15 text-[#b8920a] border border-[#ffc800]/30 text-xs font-bold px-3 py-1.5 rounded-full">
                <Star className="h-3.5 w-3.5" aria-hidden="true" />
                $111 free — for your first 6 months
              </span>
            </div>

            <h2 className="text-2xl sm:text-3xl font-bold text-white leading-snug mb-2">
              Start picking up local jobs — no spend required upfront
            </h2>
            <p className="text-white/55 text-[15px] mb-7">
              Every new tradie gets <span className="text-white font-semibold">$111 in wallet credit</span> when they join — that's real money toward real job leads in your area, no strings attached.
            </p>

            <ul className="flex flex-col gap-3 mb-8" role="list">
              {[
                "$111 free credit loaded to your wallet on signup",
                "Browse available jobs in your suburb right away",
                "See the lead cost before you spend a cent",
                "Keep 100% of everything you earn — we take zero commission",
              ].map((perk) => (
                <li key={perk} className="flex items-center gap-3 text-[14px] text-white/75">
                  <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" aria-hidden="true" />
                  {perk}
                </li>
              ))}
            </ul>

            <div className="flex flex-col sm:flex-row gap-3">
              <a href="/signup?role=tradie">
                <button className="h-12 px-7 rounded-xl font-bold text-[15px] text-black bg-[#ffc800] hover:bg-[#e6b800] active:scale-[0.97] transition-all inline-flex items-center justify-center gap-2">
                  Claim your $111 — join free
                  <ChevronRight className="h-4 w-4" aria-hidden="true" />
                </button>
              </a>
              <a href="/#how-it-works">
                <span className="h-12 px-5 inline-flex items-center justify-center gap-1.5 text-sm font-medium text-white/55 hover:text-white transition-colors cursor-pointer">
                  See how it works
                  <ChevronRight className="h-3.5 w-3.5" aria-hidden="true" />
                </span>
              </a>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ─── How lead pricing works ─── */}
      <section className="py-16 sm:py-20 bg-[#0e0c08]">
        <div className="container max-w-4xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-12">
            <span className="text-[#ffc800] text-xs font-bold uppercase tracking-widest">Transparent pricing</span>
            <h2 className="text-3xl sm:text-4xl font-black mt-3 mb-3">
              You see the price. You decide. You win.
            </h2>
            <p className="text-white/50 text-[15px] max-w-2xl mx-auto">
              No surprises. No chasing invoices. No wondering if the lead was worth it. You choose which jobs to claim — and we never touch what you earn.
            </p>
          </div>

          <div className="grid sm:grid-cols-3 gap-5 mb-10">
            {[
              {
                icon: DollarSign,
                step: "01",
                title: "Browse jobs in your area",
                desc: "See new job requests matched to your trade and suburb — with the lead cost displayed right there.",
              },
              {
                icon: ShieldCheck,
                step: "02",
                title: "Claim only what you want",
                desc: "You decide if the job is worth it. Claim it from your wallet balance. Nothing charged until you choose.",
              },
              {
                icon: Zap,
                step: "03",
                title: "Win the job, keep it all",
                desc: "Quote, win, complete. Fixit 24/7 takes zero commission. Your revenue is entirely yours.",
              },
            ].map((item, i) => (
              <motion.div
                key={item.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                viewport={{ once: true }}
                className="bg-white/5 border border-white/8 rounded-2xl p-6 hover:bg-white/8 hover:border-[#ffc800]/20 transition-all"
              >
                <div className="flex items-start gap-4 mb-4">
                  <div className="w-11 h-11 rounded-xl bg-[#ffc800]/10 border border-[#ffc800]/20 flex items-center justify-center shrink-0">
                    <item.icon className="h-5 w-5 text-[#ffc800]" aria-hidden="true" />
                  </div>
                  <span className="text-4xl font-black text-white/8 leading-none mt-1">{item.step}</span>
                </div>
                <h3 className="font-bold text-[15px] mb-2">{item.title}</h3>
                <p className="text-white/50 text-sm leading-relaxed">{item.desc}</p>
              </motion.div>
            ))}
          </div>

          <div className="bg-[#ffc800]/8 border border-[#ffc800]/20 rounded-2xl px-6 py-5 text-center">
            <p className="text-white/70 text-[14px]">
              Typical lead cost: <span className="text-white font-bold">$22–$80</span> depending on job size — always shown upfront, always your choice.
              Compare that to platforms charging <span className="line-through text-white/35">$80–$200+</span> whether you win or not.
            </p>
          </div>
        </div>
      </section>

      {/* ─── Subscription tiers ─── */}
      <section className="py-16 sm:py-20 bg-[#0b0904] border-y border-white/5">
        <div className="container max-w-3xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-12">
            <span className="text-[#ffc800] text-xs font-bold uppercase tracking-widest">Plans for active tradies</span>
            <h2 className="text-3xl sm:text-4xl font-black mt-3 mb-3">
              Scale up as your business grows
            </h2>
            <p className="text-white/50 text-[15px] max-w-xl mx-auto">
              Start free. Upgrade when you're ready. No lock-in.
            </p>
          </div>

          <div className="grid sm:grid-cols-3 gap-5">
            {/* Free */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: 0 }}
              viewport={{ once: true }}
              className="bg-white/5 border border-white/10 rounded-2xl p-6 flex flex-col"
            >
              <p className="text-xs font-bold uppercase tracking-widest text-white/35 mb-2">Free</p>
              <div className="mb-1">
                <span className="text-3xl font-black text-white">$0</span>
                <span className="text-white/40 text-sm">/mo</span>
              </div>
              <p className="text-white/40 text-xs mb-5">$111 welcome credit included</p>
              <ul className="flex flex-col gap-2.5 mb-6 flex-1">
                {["$111 wallet on signup", "Browse all local jobs", "Claim at standard rates", "Basic tradie profile"].map((f) => (
                  <li key={f} className="flex items-center gap-2 text-sm text-white/60">
                    <CheckCircle2 className="h-3.5 w-3.5 text-white/25 shrink-0" aria-hidden="true" /> {f}
                  </li>
                ))}
              </ul>
              <a href="/signup?role=tradie">
                <button className="w-full h-10 rounded-xl border border-white/20 hover:bg-white/8 text-white font-semibold text-sm transition-all">
                  Get started free
                </button>
              </a>
            </motion.div>

            {/* Starter */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.08 }}
              viewport={{ once: true }}
              className="bg-white/5 border border-white/15 rounded-2xl p-6 flex flex-col"
            >
              <p className="text-xs font-bold uppercase tracking-widest text-white/40 mb-2">Starter</p>
              <div className="mb-1">
                <span className="text-3xl font-black text-white">$49</span>
                <span className="text-white/40 text-sm">/mo</span>
              </div>
              <p className="text-white/40 text-xs mb-5">Best for occasional job flow</p>
              <ul className="flex flex-col gap-2.5 mb-6 flex-1">
                {["Monthly wallet top-up", "Priority job matching", "Verified tradie badge", "Standard profile ranking"].map((f) => (
                  <li key={f} className="flex items-center gap-2 text-sm text-white/65">
                    <CheckCircle2 className="h-3.5 w-3.5 text-white/30 shrink-0" aria-hidden="true" /> {f}
                  </li>
                ))}
              </ul>
              <a href="/signup?role=tradie">
                <button className="w-full h-10 rounded-xl border border-white/20 hover:bg-white/8 text-white font-semibold text-sm transition-all">
                  Start with Starter
                </button>
              </a>
            </motion.div>

            {/* Pro — highlighted */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.16 }}
              viewport={{ once: true }}
              className="bg-[#ffc800]/8 border-2 border-[#ffc800]/40 rounded-2xl p-6 flex flex-col relative"
            >
              <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                <span className="inline-flex items-center gap-1 bg-[#ffc800] text-black text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full">
                  <Star className="h-2.5 w-2.5" aria-hidden="true" /> Most popular
                </span>
              </div>
              <p className="text-xs font-bold uppercase tracking-widest text-[#ffc800] mb-2">Pro</p>
              <div className="mb-1">
                <span className="text-3xl font-black text-white">$99</span>
                <span className="text-white/40 text-sm">/mo</span>
              </div>
              <p className="text-[#ffc800]/60 text-xs mb-5">Best value for busy tradies</p>
              <ul className="flex flex-col gap-2.5 mb-6 flex-1">
                {[
                  "Higher monthly wallet top-up",
                  "Boosted profile ranking",
                  "Early access to new jobs",
                  "Dedicated tradie support",
                  "Priority match notifications",
                ].map((f) => (
                  <li key={f} className="flex items-center gap-2 text-sm text-white/80">
                    <CheckCircle2 className="h-3.5 w-3.5 text-[#ffc800] shrink-0" aria-hidden="true" /> {f}
                  </li>
                ))}
              </ul>
              <a href="/signup?role=tradie">
                <button className="w-full h-10 rounded-xl bg-[#ffc800] hover:bg-[#e6b800] text-black font-bold text-sm transition-all active:scale-[0.97]">
                  Start with Pro
                </button>
              </a>
            </motion.div>
          </div>

          <p className="text-center text-white/25 text-xs mt-6">
            All plans: zero commission on jobs you win. Cancel anytime.
          </p>
        </div>
      </section>

      {/* ─── Testimonials ─── */}
      <section className="py-16 sm:py-20 bg-[#0e0c08]">
        <div className="container max-w-4xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-10">
            <span className="text-[#ffc800] text-xs font-bold uppercase tracking-widest">Tradies on Fixit 24/7</span>
            <h2 className="text-3xl font-black mt-3 mb-2">What tradies say</h2>
          </div>
          <div className="grid sm:grid-cols-3 gap-5">
            {TESTIMONIALS.map((t, i) => (
              <motion.div
                key={t.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.08 }}
                viewport={{ once: true }}
                className="bg-white/5 border border-white/8 rounded-2xl p-6"
              >
                <Quote className="h-5 w-5 text-[#ffc800]/40 mb-4" aria-hidden="true" />
                <p className="text-white/70 text-sm leading-relaxed mb-5">{t.quote}</p>
                <div className="flex items-center gap-0.5 mb-3" aria-label={`${t.rating} out of 5 stars`}>
                  {Array.from({ length: t.rating }).map((_, j) => (
                    <Star key={j} className="h-3.5 w-3.5 text-[#ffc800] fill-[#ffc800]" aria-hidden="true" />
                  ))}
                </div>
                <p className="font-bold text-[13px] text-white">{t.name}</p>
                <p className="text-white/35 text-xs">{t.trade}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Who this is for ─── */}
      <section className="py-12 bg-[#0b0904] border-y border-white/5">
        <div className="container max-w-4xl mx-auto px-4 sm:px-6">
          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-[#ffc800]/8 border border-[#ffc800]/20 rounded-2xl p-6">
              <p className="text-xs font-bold uppercase tracking-widest text-[#ffc800] mb-3">This is for you if…</p>
              <ul className="flex flex-col gap-2.5">
                {[
                  "You're a qualified tradie or licensed service professional",
                  "You want a steady flow of local jobs without big ad spend",
                  "You're tired of paying for leads that don't convert",
                  "You want to know the cost before you commit",
                  "You want to keep 100% of what you earn",
                ].map((t) => (
                  <li key={t} className="flex items-start gap-2.5 text-sm text-white/75">
                    <CheckCircle2 className="h-4 w-4 text-[#ffc800] shrink-0 mt-0.5" aria-hidden="true" /> {t}
                  </li>
                ))}
              </ul>
            </div>
            <div className="bg-white/5 border border-white/8 rounded-2xl p-6">
              <p className="text-xs font-bold uppercase tracking-widest text-white/35 mb-3">This is not for…</p>
              <ul className="flex flex-col gap-2.5">
                {[
                  "Passive investors with no trade or service experience",
                  "Anyone looking for guaranteed income or guaranteed leads",
                  "People not currently active in the trades or home services",
                ].map((t) => (
                  <li key={t} className="flex items-start gap-2.5 text-sm text-white/45">
                    <span className="text-white/20 shrink-0 mt-0.5 font-bold text-xs">✕</span> {t}
                  </li>
                ))}
              </ul>
              <p className="mt-5 text-xs text-white/30 leading-relaxed italic">
                Built for tradies who show up and do the work.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Scaling pillars (condensed) ─── */}
      <section className="py-16 sm:py-20 bg-[#0e0c08]">
        <div className="container max-w-4xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-10">
            <span className="text-[#ffc800] text-xs font-bold uppercase tracking-widest">For ambitious tradies</span>
            <h2 className="text-2xl sm:text-3xl font-black mt-3 mb-3">
              More than just leads
            </h2>
            <p className="text-white/50 text-[15px] max-w-2xl mx-auto">
              For tradies who want to grow a real business — not just fill their calendar.
            </p>
          </div>

          <div className="grid sm:grid-cols-3 gap-5">
            {SCALING_PILLARS.map((pillar, i) => (
              <motion.div
                key={pillar.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.09 }}
                viewport={{ once: true }}
                className="bg-white/5 border border-white/8 rounded-2xl p-6 hover:bg-white/8 hover:border-[#ffc800]/20 transition-all"
              >
                <div className="w-11 h-11 rounded-xl bg-[#ffc800]/10 border border-[#ffc800]/20 flex items-center justify-center mb-4">
                  <pillar.icon className="h-5 w-5 text-[#ffc800]" aria-hidden="true" />
                </div>
                <h3 className="font-bold text-[15px] mb-2">{pillar.title}</h3>
                <p className="text-white/50 text-sm leading-relaxed">{pillar.desc}</p>
              </motion.div>
            ))}
          </div>

          <div className="mt-8 text-center">
            <button
              onClick={scrollToForm}
              className="text-sm text-[#ffc800]/70 hover:text-[#ffc800] font-medium inline-flex items-center gap-1.5 transition-colors"
            >
              Want to discuss your growth strategy? Talk to our team <ChevronRight className="h-3.5 w-3.5" aria-hidden="true" />
            </button>
          </div>
        </div>
      </section>

      {/* ─── Enquiry form ─── */}
      <section ref={formRef} className="py-16 sm:py-20 bg-[#0b0904]" id="partner-form">
        <div className="container max-w-2xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-10">
            <span className="text-[#ffc800] text-xs font-bold uppercase tracking-widest">Growth discussion</span>
            <h2 className="text-3xl sm:text-4xl font-black mt-3 mb-3">
              Want to talk strategy<br />with our team?
            </h2>
            <p className="text-white/50 text-[15px] max-w-xl mx-auto">
              Tell us about your trade business and what you're trying to build. Our growth team will reach out for a free no-pressure call.
            </p>
          </div>

          {status === "success" ? (
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-emerald-500/10 border border-emerald-500/25 rounded-3xl p-10 text-center"
              role="alert"
              aria-live="polite"
            >
              <CheckCircle2 className="h-14 w-14 text-emerald-400 mx-auto mb-5" aria-hidden="true" />
              <h3 className="text-2xl font-black mb-3 text-white">Enquiry received</h3>
              <p className="text-white/60 text-[15px] leading-relaxed max-w-md mx-auto">
                Thanks — a Fixit 24/7 team member will contact you soon to discuss your trade business, goals, and how we can help.
              </p>
              <p className="text-white/30 text-xs mt-5 leading-relaxed">
                No pressure. No commitment. Just a conversation.
              </p>
            </motion.div>
          ) : (
            <form
              onSubmit={handleSubmit}
              noValidate
              className="bg-[#130f07] border border-white/8 rounded-3xl p-6 sm:p-8 shadow-2xl"
            >
              {/* Contact details */}
              <p className={SECTION_HDR}>Your contact details</p>
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="name" className={LABEL_CLS}>Full name <span className="text-red-400">*</span></label>
                  <input id="name" type="text" autoComplete="name" required placeholder="Jane Smith"
                    value={form.name} onChange={(e) => set("name")(e.target.value)}
                    className={INPUT_CLS} aria-describedby={errors.name ? "name-err" : undefined} />
                  <FieldError msg={errors.name} />
                </div>
                <div>
                  <label htmlFor="phone" className={LABEL_CLS}>Phone <span className="text-red-400">*</span></label>
                  <input id="phone" type="tel" autoComplete="tel" required placeholder="04xx xxx xxx"
                    value={form.phone} onChange={(e) => set("phone")(e.target.value)}
                    className={INPUT_CLS} aria-describedby={errors.phone ? "phone-err" : undefined} />
                  <FieldError msg={errors.phone} />
                </div>
              </div>
              <div className="mt-4">
                <label htmlFor="email" className={LABEL_CLS}>Email address <span className="text-red-400">*</span></label>
                <input id="email" type="email" autoComplete="email" required placeholder="you@example.com"
                  value={form.email} onChange={(e) => set("email")(e.target.value)}
                  className={INPUT_CLS} aria-describedby={errors.email ? "email-err" : undefined} />
                <FieldError msg={errors.email} />
              </div>

              {/* Trade business */}
              <p className={SECTION_HDR}>Your trade business</p>
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="tradeName" className={LABEL_CLS}>Business / trade name <span className="text-red-400">*</span></label>
                  <input id="tradeName" type="text" autoComplete="organization" required placeholder="Smith Plumbing Pty Ltd"
                    value={form.tradeName} onChange={(e) => set("tradeName")(e.target.value)}
                    className={INPUT_CLS} />
                  <FieldError msg={errors.tradeName} />
                </div>
                <div>
                  <label htmlFor="yearsExp" className={LABEL_CLS}>Years of trade experience</label>
                  <input id="yearsExp" type="number" min="0" max="60" placeholder="e.g. 8"
                    value={form.yearsExp} onChange={(e) => set("yearsExp")(e.target.value)}
                    className={INPUT_CLS} />
                </div>
              </div>
              <div className="mt-4">
                <label className={LABEL_CLS}>Primary trade category <span className="text-red-400">*</span></label>
                <CategorySelect value={form.category} onChange={set("category")} required />
                <FieldError msg={errors.category} />
              </div>
              <div className="mt-4">
                <label htmlFor="licenceStatus" className={LABEL_CLS}>Licence / qualification status</label>
                <select id="licenceStatus" value={form.licenceStatus}
                  onChange={(e) => set("licenceStatus")(e.target.value)}
                  className={`${INPUT_CLS} appearance-none`}>
                  <option value="">Select…</option>
                  <option>Fully licensed</option>
                  <option>Registered / certified</option>
                  <option>Apprentice / in-training</option>
                  <option>Other</option>
                </select>
              </div>

              {/* Business stage */}
              <p className={SECTION_HDR}>Business stage</p>
              <div className="grid sm:grid-cols-3 gap-4">
                <div>
                  <label htmlFor="revenueRange" className={LABEL_CLS}>Annual revenue <span className="text-white/30">(optional)</span></label>
                  <select id="revenueRange" value={form.revenueRange}
                    onChange={(e) => set("revenueRange")(e.target.value)}
                    className={`${INPUT_CLS} appearance-none`}>
                    <option value="">Select…</option>
                    {REVENUE_RANGES.map((r) => <option key={r}>{r}</option>)}
                  </select>
                </div>
                <div>
                  <label htmlFor="monthlyJobs" className={LABEL_CLS}>Monthly job volume</label>
                  <select id="monthlyJobs" value={form.monthlyJobs}
                    onChange={(e) => set("monthlyJobs")(e.target.value)}
                    className={`${INPUT_CLS} appearance-none`}>
                    <option value="">Select…</option>
                    {MONTHLY_JOB_VOLUMES.map((v) => <option key={v}>{v}</option>)}
                  </select>
                </div>
                <div>
                  <label htmlFor="teamSize" className={LABEL_CLS}>Team size</label>
                  <select id="teamSize" value={form.teamSize}
                    onChange={(e) => set("teamSize")(e.target.value)}
                    className={`${INPUT_CLS} appearance-none`}>
                    <option value="">Select…</option>
                    {TEAM_SIZES.map((t) => <option key={t}>{t}</option>)}
                  </select>
                </div>
              </div>

              {/* Location */}
              <p className={SECTION_HDR}>Your location</p>
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="suburb" className={LABEL_CLS}>Suburb / city <span className="text-red-400">*</span></label>
                  <SuburbInput id="suburb" value={form.suburb} onChange={set("suburb")} required />
                  <FieldError msg={errors.suburb} />
                </div>
                <div>
                  <label htmlFor="state" className={LABEL_CLS}>State <span className="text-red-400">*</span></label>
                  <select id="state" value={form.state}
                    onChange={(e) => set("state")(e.target.value)}
                    required className={`${INPUT_CLS} appearance-none`}>
                    <option value="">Select…</option>
                    {AU_STATES.map((s) => <option key={s}>{s}</option>)}
                  </select>
                  <FieldError msg={errors.state} />
                </div>
              </div>
              <div className="mt-4">
                <label className={LABEL_CLS}>Preferred service area <span className="text-white/30">(if different from above)</span></label>
                <SuburbInput value={form.serviceArea} onChange={set("serviceArea")} placeholder="e.g. Greater Sydney, NSW" />
              </div>

              {/* Growth & goals */}
              <p className={SECTION_HDR}>Growth & goals</p>
              <div>
                <label className={LABEL_CLS}>Biggest growth challenges <span className="text-white/30">(select all that apply)</span></label>
                <div className="flex flex-wrap gap-2 mt-1" role="group" aria-label="Growth challenges">
                  {GROWTH_CHALLENGES.map((c) => {
                    const active = form.growthChallenges.includes(c);
                    return (
                      <button
                        key={c}
                        type="button"
                        onClick={() => toggleChallenge(c)}
                        aria-pressed={active}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                          active
                            ? "bg-[#ffc800]/20 border-[#ffc800]/50 text-[#ffc800]"
                            : "border-white/12 text-white/50 hover:border-white/25 hover:text-white/75 bg-white/4"
                        }`}
                      >
                        {active && <span className="mr-1" aria-hidden="true">✓</span>}{c}
                      </button>
                    );
                  })}
                </div>
              </div>
              <div className="mt-4">
                <label htmlFor="growthGoals" className={LABEL_CLS}>Are you looking to grow revenue, team size, service area, systems, or all of these?</label>
                <textarea id="growthGoals" rows={2} value={form.growthGoals}
                  onChange={(e) => set("growthGoals")(e.target.value)}
                  placeholder="Tell us what growth looks like for you…"
                  className={`${INPUT_CLS} h-auto py-3 resize-none`} />
              </div>
              <div className="mt-4">
                <label htmlFor="vision" className={LABEL_CLS}>What would scaling successfully look like in the next 12 months?</label>
                <textarea id="vision" rows={3} value={form.vision}
                  onChange={(e) => set("vision")(e.target.value)}
                  placeholder="e.g. Double revenue, hire 3 staff, expand to new suburbs…"
                  className={`${INPUT_CLS} h-auto py-3 resize-none`} />
              </div>
              <div className="mt-4">
                <label htmlFor="message" className={LABEL_CLS}>Anything else you'd like to tell us?</label>
                <textarea id="message" rows={2} value={form.message}
                  onChange={(e) => set("message")(e.target.value)}
                  placeholder="Current situation, specific questions, etc."
                  className={`${INPUT_CLS} h-auto py-3 resize-none`} />
              </div>

              {/* Consent */}
              <div className="mt-6">
                <label className="flex items-start gap-3 cursor-pointer group">
                  <input
                    type="checkbox"
                    checked={form.consent}
                    onChange={(e) => setForm((f) => ({ ...f, consent: e.target.checked }))}
                    className="mt-0.5 h-4 w-4 rounded border-white/20 accent-[#ffc800] shrink-0"
                    aria-describedby={errors.consent ? "consent-err" : undefined}
                    required
                  />
                  <span className="text-sm text-white/60 group-hover:text-white/80 transition-colors leading-relaxed">
                    I agree to be contacted by Fixit 24/7 about tradie opportunities. <span className="text-red-400">*</span>
                  </span>
                </label>
                <FieldError msg={errors.consent} />
              </div>

              {/* Error banner */}
              {status === "error" && (
                <div className="mt-4 flex items-center gap-2 text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3" role="alert">
                  Something went wrong. Please try again or email us directly.
                </div>
              )}

              {/* Submit */}
              <button
                type="submit"
                disabled={status === "loading"}
                className="mt-6 w-full h-12 rounded-xl bg-[#ffc800] hover:bg-[#e6b800] active:scale-[0.97] text-black font-bold text-[15px] transition-all disabled:opacity-60 inline-flex items-center justify-center gap-2"
              >
                {status === "loading" ? (
                  <>
                    <span className="h-4 w-4 border-2 border-black/30 border-t-black rounded-full animate-spin" aria-hidden="true" />
                    Submitting…
                  </>
                ) : (
                  <>Book a growth discussion <ChevronRight className="h-4 w-4" aria-hidden="true" /></>
                )}
              </button>

              {/* Disclaimer */}
              <p className="text-white/25 text-xs text-center mt-5 leading-relaxed">
                Submitting this form is an expression of interest only. It does not guarantee approval, territory availability, income, leads, or business results. Growth outcomes depend on your market, experience, execution, team, service quality, and business readiness.
              </p>
            </form>
          )}
        </div>
      </section>

      {/* ─── FAQ ─── */}
      <section className="py-16 sm:py-20 bg-[#0e0c08]">
        <div className="container max-w-2xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-10">
            <span className="text-[#ffc800] text-xs font-bold uppercase tracking-widest">Common questions</span>
            <h2 className="text-3xl font-black mt-3 mb-3">Questions answered</h2>
            <p className="text-white/50 text-[15px]">Everything you need to know before getting started.</p>
          </div>
          <div className="flex flex-col gap-2">
            {PARTNER_FAQS.map((faq, i) => (
              <AccordionItem
                key={faq.q}
                q={faq.q}
                a={faq.a}
                isOpen={openFaq === i}
                onToggle={() => setOpenFaq(openFaq === i ? null : i)}
              />
            ))}
          </div>
        </div>
      </section>

      {/* ─── Final CTA ─── */}
      <section className="py-16 sm:py-20 bg-[#ffc800] text-center">
        <div className="container max-w-xl mx-auto px-4 sm:px-6">
          <TrendingUp className="h-10 w-10 text-black/25 mx-auto mb-5" aria-hidden="true" />
          <h2 className="text-3xl sm:text-4xl font-black text-black mb-3">
            Your $111 is waiting.
          </h2>
          <p className="text-black/65 mb-3 text-[15px] max-w-md mx-auto">
            Join free, claim your welcome credit, and start picking up jobs in your area today. No commission. No lock-in. Fairly priced leads, always.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-2 mb-8">
            {["$111 free to start", "No commission", "See cost before you claim", "Cancel anytime"].map((t) => (
              <span key={t} className="inline-flex items-center gap-1.5 text-xs font-semibold text-black/60 bg-black/8 rounded-full px-3 py-1">
                <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" /> {t}
              </span>
            ))}
          </div>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <a href="/signup?role=tradie">
              <button className="h-12 px-8 rounded-xl bg-black text-white font-bold text-[15px] hover:bg-[#1a1a1a] active:scale-[0.97] transition-all inline-flex items-center justify-center gap-2">
                Claim $111 free — join now <ChevronRight className="h-4 w-4" aria-hidden="true" />
              </button>
            </a>
            <button
              onClick={scrollToForm}
              className="h-12 px-8 rounded-xl border-2 border-black text-black font-bold text-[15px] hover:bg-black/10 active:scale-[0.97] transition-all"
            >
              Talk to our team first
            </button>
          </div>
          <p className="text-black/40 text-xs mt-6 leading-relaxed">
            Results are not guaranteed. Lead availability depends on your market and service area.
          </p>
        </div>
      </section>

      <Footer />
    </div>
  );
}
