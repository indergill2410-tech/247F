import { usePageTitle } from "@/hooks/use-page-title";
import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Footer } from "@/components/footer";
import {
  MapPin, ChevronRight, ChevronDown, CheckCircle2, Star,
  MessageCircle, Layers, Phone, Search, Wrench, Users, Zap,
  TrendingUp, HardHat, BarChart3, Target, ShieldCheck,
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
    icon: MapPin,
    title: "Better local visibility",
    desc: "We help trade businesses build stronger local presence and trust in their service area — so the right customers find you first.",
  },
  {
    icon: MessageCircle,
    title: "Professional enquiry handling",
    desc: "Improve how customer enquiries are captured, followed up, and converted into booked jobs — without the chaos.",
  },
  {
    icon: Layers,
    title: "Growth-focused systems",
    desc: "We provide structure, onboarding, and repeatable systems to help tradies move beyond scattered daily operations.",
  },
  {
    icon: Star,
    title: "Brand and marketing support",
    desc: "Partners benefit from a trusted repair-focused brand, clearer positioning, and practical marketing direction.",
  },
  {
    icon: Zap,
    title: "Technology-enabled operations",
    desc: "The platform makes customer connection, messaging, service flow, and follow-up more organised and efficient.",
  },
  {
    icon: Users,
    title: "Team and service-area growth",
    desc: "We can help suitable tradies think through team growth, local coverage, and service category expansion.",
  },
  {
    icon: Phone,
    title: "Strategy calls with our experts",
    desc: "Speak with the Fixit 24/7 growth team about your current business, bottlenecks, service area, and next steps.",
  },
];

const BENEFIT_BADGES = [
  "Scale your local presence",
  "Improve enquiry conversion",
  "Build stronger systems",
  "Strengthen your brand positioning",
  "Use technology to stay organised",
  "Get growth guidance from experts",
];

const PARTNER_FAQS = [
  {
    q: "Who can partner with Fixit 24/7?",
    a: "Our partner model is designed for qualified tradies, licensed service professionals, and trade business owners who want to grow their local service business.",
  },
  {
    q: "Is this for passive investors?",
    a: "No. Fixit 24/7 is focused on active trade business owners and service professionals who understand the industry.",
  },
  {
    q: "How can Fixit 24/7 help my trade business scale?",
    a: "Fixit 24/7 can help suitable tradies with brand support, local visibility, technology, enquiry handling, marketing guidance, operating systems, and growth strategy discussions.",
  },
  {
    q: "Is this just about getting more leads?",
    a: "No. More enquiries are only one part of growth. Scaling also requires better systems, follow-up, customer experience, positioning, team structure, and service-area planning.",
  },
  {
    q: "Can Fixit 24/7 help me move toward seven-figure growth?",
    a: "The partner model is designed for ambitious tradies who want to build toward larger business growth. Results are not guaranteed and depend on your market, execution, team, service quality, and readiness to scale.",
  },
  {
    q: "What support does Fixit 24/7 provide?",
    a: "Support may include brand guidance, technology, marketing direction, customer enquiry systems, onboarding, and growth strategy discussions. Full details are explained during the partner call.",
  },
  {
    q: "Can I choose my service area?",
    a: "You can express interest in your preferred service area. Availability and suitability will be discussed with our team.",
  },
  {
    q: "What happens on the growth call?",
    a: "Our team will ask about your current business, trade category, service area, job volume, goals, bottlenecks, and whether the Fixit 24/7 partner model may be suitable.",
  },
  {
    q: "Is submitting the form a commitment?",
    a: "No. It is only an expression of interest. There is no pressure and no commitment at this stage.",
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
  usePageTitle("Partner With Us");
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
        className="py-20 sm:py-24 text-center relative overflow-hidden"
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
            <HardHat className="h-3.5 w-3.5" aria-hidden="true" /> For tradies ready to scale
          </div>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black leading-[1.05] tracking-tight mb-5">
            Partner With Fixit 24/7<br />
            <span className="text-[#ffc800]">and Grow Your Trade Business</span>
          </h1>
          <p className="text-white/60 text-lg leading-relaxed max-w-2xl mx-auto mb-4">
            Fixit 24/7 helps ambitious tradies and trade business owners build stronger local visibility, better systems, and a more scalable customer pipeline.
          </p>
          <p className="text-white/40 text-sm max-w-xl mx-auto mb-8">
            Whether you're running a strong six-figure trade business or aiming toward seven-figure growth, our partner model is designed to help you scale with more structure, confidence, and support.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 justify-center mb-8">
            <button
              onClick={scrollToForm}
              className="h-12 px-8 rounded-xl bg-[#ffc800] hover:bg-[#e6b800] active:scale-[0.97] text-black font-bold text-[15px] transition-all inline-flex items-center justify-center gap-2"
            >
              Book a growth discussion <ChevronRight className="h-4 w-4" aria-hidden="true" />
            </button>
            <button
              onClick={scrollToForm}
              className="h-12 px-8 rounded-xl border border-white/20 hover:bg-white/8 active:scale-[0.97] text-white font-bold text-[15px] transition-all"
            >
              Talk to our growth team
            </button>
          </div>

          <div className="flex flex-wrap justify-center gap-3">
            {["Built for serious tradies", "No pressure", "Expression of interest only", "Free growth call"].map((t) => (
              <span key={t} className="inline-flex items-center gap-1.5 text-xs font-medium text-white/45 bg-white/5 rounded-full px-3 py-1">
                <CheckCircle2 className="h-3 w-3 text-[#ffc800]" aria-hidden="true" /> {t}
              </span>
            ))}
          </div>
        </motion.div>
      </section>

      {/* ─── Scaling pillars ─── */}
      <section className="py-16 sm:py-20 bg-[#0e0c08]">
        <div className="container max-w-5xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-12">
            <span className="text-[#ffc800] text-xs font-bold uppercase tracking-widest">How it works</span>
            <h2 className="text-3xl sm:text-4xl font-black mt-3 mb-3">
              How Fixit 24/7 helps you scale
            </h2>
            <p className="text-white/50 text-[15px] max-w-2xl mx-auto">
              Scaling a trade business is not just about getting more calls. It's about building the right brand, systems, team, follow-up process, customer experience, and local positioning.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {SCALING_PILLARS.map((pillar, i) => (
              <motion.div
                key={pillar.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.07 }}
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

          {/* Benefit chips */}
          <div className="mt-10 flex flex-wrap gap-3 justify-center">
            {BENEFIT_BADGES.map((b) => (
              <span key={b} className="inline-flex items-center gap-2 text-sm font-medium text-white/70 bg-white/5 border border-white/8 rounded-full px-4 py-2">
                <CheckCircle2 className="h-4 w-4 text-[#ffc800] shrink-0" aria-hidden="true" /> {b}
              </span>
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
                  "You already have an active trade or service business",
                  "You want to build a more scalable local operation",
                  "You're serious about growth, not just more jobs",
                  "You're open to better systems, branding, and support",
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
                  "People looking for guaranteed income or guaranteed leads",
                  "Anyone not currently active in the trades or home services",
                ].map((t) => (
                  <li key={t} className="flex items-start gap-2.5 text-sm text-white/45">
                    <span className="text-white/20 shrink-0 mt-0.5 font-bold text-xs">✕</span> {t}
                  </li>
                ))}
              </ul>
              <p className="mt-5 text-xs text-white/30 leading-relaxed italic">
                Built for tradies, not passive investors.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Enquiry form ─── */}
      <section ref={formRef} className="py-16 sm:py-20 bg-[#0b0904]" id="partner-form">
        <div className="container max-w-2xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-10">
            <span className="text-[#ffc800] text-xs font-bold uppercase tracking-widest">Expression of interest</span>
            <h2 className="text-3xl sm:text-4xl font-black mt-3 mb-3">
              Interested in partnering<br />with Fixit 24/7?
            </h2>
            <p className="text-white/50 text-[15px] max-w-xl mx-auto">
              Tell us about your trade business, current stage, service area, and growth goals. Our team will call you to discuss where you are now, what's holding you back, and how Fixit 24/7 may help you scale.
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
                Thanks — a Fixit 24/7 expert will contact you soon to discuss your trade business, growth goals, current bottlenecks, and next steps.
              </p>
              <p className="text-white/30 text-xs mt-5 leading-relaxed">
                No pressure. No commitment. Just a conversation with our growth team.
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
                    I agree to be contacted by Fixit 24/7 about trade partner opportunities. <span className="text-red-400">*</span>
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

      {/* ─── Partner FAQ ─── */}
      <section className="py-16 sm:py-20 bg-[#0e0c08]">
        <div className="container max-w-2xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-10">
            <span className="text-[#ffc800] text-xs font-bold uppercase tracking-widest">Common questions</span>
            <h2 className="text-3xl font-black mt-3 mb-3">Partner questions answered</h2>
            <p className="text-white/50 text-[15px]">Everything you need to know before reaching out.</p>
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
            Stop just working more hours.
          </h2>
          <p className="text-black/65 mb-3 text-[15px] max-w-md mx-auto">
            Start building a scalable trade business. Talk to our growth team — no pressure, no commitment.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-2 mb-8">
            {["Built for serious tradies", "No credit card", "Expression of interest only", "Free growth call"].map((t) => (
              <span key={t} className="inline-flex items-center gap-1.5 text-xs font-semibold text-black/60 bg-black/8 rounded-full px-3 py-1">
                <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" /> {t}
              </span>
            ))}
          </div>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button
              onClick={scrollToForm}
              className="h-12 px-8 rounded-xl bg-black text-white font-bold text-[15px] hover:bg-[#1a1a1a] active:scale-[0.97] transition-all inline-flex items-center justify-center gap-2"
            >
              Book a growth discussion <ChevronRight className="h-4 w-4" aria-hidden="true" />
            </button>
            <button
              onClick={scrollToForm}
              className="h-12 px-8 rounded-xl border-2 border-black text-black font-bold text-[15px] hover:bg-black/10 active:scale-[0.97] transition-all"
            >
              Talk to our team
            </button>
          </div>
          <p className="text-black/40 text-xs mt-6 leading-relaxed">
            Results are not guaranteed. Growth depends on your market, execution, service quality, team, and business readiness.
          </p>
        </div>
      </section>

      <Footer />
    </div>
  );
}
