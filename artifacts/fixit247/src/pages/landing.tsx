import { usePageTitle } from "@/hooks/use-page-title";
import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { useListCategories } from "@workspace/api-client-react";
import { Footer } from "@/components/footer";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import {
  Wrench, Zap, Droplets, Home, TreePine, Wind, Hammer,
  PaintbrushIcon, ShieldCheck, Star, MapPin, ChevronRight,
  CheckCircle2, Clock, Users, BadgeCheck, MessageSquare,
  ChevronDown, HardHat, Car, Shield, Lock, Flame, Thermometer, BatteryFull, Fuel,
  Quote,
} from "lucide-react";

const ICON_MAP: Record<string, React.ElementType> = {
  droplets: Droplets,
  zap: Zap,
  hammer: Hammer,
  paintbrush: PaintbrushIcon,
  home: Home,
  "tree-pine": TreePine,
  wind: Wind,
  "grid-2x2": Wrench,
  layers: Wrench,
  sparkles: Star,
  bug: ShieldCheck,
  lock: ShieldCheck,
};

const HOW_IT_WORKS_HOMEOWNER = [
  {
    icon: Wrench,
    step: "01",
    title: "Post your job",
    desc: "Describe what needs fixing, set your urgency, and upload photos. Completely free and takes under 2 minutes.",
  },
  {
    icon: Users,
    step: "02",
    title: "Get matched",
    desc: "Verified local tradies with the right skills and availability see your job. You'll hear back fast.",
  },
  {
    icon: BadgeCheck,
    step: "03",
    title: "Choose who suits you",
    desc: "Review profiles, ratings, and quotes. Message directly before committing. You stay in control.",
  },
  {
    icon: MessageSquare,
    step: "04",
    title: "Get it sorted",
    desc: "Chat in-app, agree on timing, and get the repair done. Pay only when you're satisfied.",
  },
];

const HOW_IT_WORKS_TRADIE = [
  {
    icon: HardHat,
    step: "01",
    title: "Sign up free",
    desc: "Create your profile in minutes and receive $111 AUD in free job leads every month for your first 6 months. No credit card, no commission, no lock-in.",
  },
  {
    icon: BadgeCheck,
    step: "02",
    title: "Build a verified profile",
    desc: "Add your trade, licences, and service area. Verified profiles build trust and win more jobs.",
  },
  {
    icon: Wrench,
    step: "03",
    title: "Receive local jobs",
    desc: "Get notified of relevant jobs in your area that match your skills and location.",
  },
  {
    icon: Clock,
    step: "04",
    title: "Choose your work",
    desc: "Accept only the jobs that suit your schedule. You're in full control of your workload.",
  },
];

const CATEGORIES_DISPLAY = [
  { icon: Droplets, label: "Plumbing" },
  { icon: Zap, label: "Electrical" },
  { icon: ShieldCheck, label: "Locksmith" },
  { icon: PaintbrushIcon, label: "Painting" },
  { icon: Wrench, label: "Handyman" },
  { icon: Home, label: "Roofing" },
  { icon: Wind, label: "HVAC" },
  { icon: Hammer, label: "Carpentry" },
];

const FAQS_LANDING = [
  {
    q: "Is it free to post a job?",
    a: "Yes. Posting a job is completely free for homeowners. You only pay the tradie directly for the repair itself.",
  },
  {
    q: "Are the tradies verified?",
    a: "All tradies complete our verification process — identity checks, licence verification, and trade confirmation — before they can claim jobs. You'll also see their public ratings from past work.",
  },
  {
    q: "How quickly will I hear back?",
    a: "Most jobs receive their first tradie response within 20 minutes. Emergency jobs are automatically prioritised and pushed to the top of the tradie feed.",
  },
  {
    q: "Can I choose which tradie I hire?",
    a: "Absolutely. You stay in control. Review profiles, ratings, and quotes, then choose the tradie that suits you best. No obligation until you accept.",
  },
  {
    q: "Is it free for tradies to join?",
    a: "Yes. Joining and building a profile is completely free for tradies. No credit card, no subscription, no monthly fee.",
  },
  {
    q: "What trades are covered?",
    a: "We cover plumbing, electrical, locksmith, HVAC, roofing, carpentry, handyman, painting, and more — 12+ categories across Australia.",
  },
];

const TESTIMONIALS = [
  {
    name: "Sarah M.",
    suburb: "Bondi, NSW",
    role: "homeowner" as const,
    stars: 5,
    quote: "Had a burst pipe at 11pm on a Tuesday. Posted the job, got a plumber quoting within 20 minutes, fixed by midnight. Absolute lifesaver.",
  },
  {
    name: "Jake T.",
    suburb: "Fitzroy, VIC",
    role: "tradie" as const,
    stars: 5,
    quote: "Been using it for 4 months. The free $111 wallet credit gives me enough to pick up 3–4 jobs a week without spending a cent. Booked solid most weeks now.",
  },
  {
    name: "Priya K.",
    suburb: "Chermside, QLD",
    role: "homeowner" as const,
    stars: 5,
    quote: "I was nervous hiring a tradie online but the verified profiles and reviews made it easy. The electrician was professional, on time, and reasonably priced.",
  },
];

// Deterministic live-activity feed — rotates every few seconds to create social proof momentum.
const LIVE_ACTIVITY = [
  { trade: "Plumber", suburb: "Bondi", state: "NSW", mins: 4 },
  { trade: "Electrician", suburb: "Chatswood", state: "NSW", mins: 11 },
  { trade: "Locksmith", suburb: "Richmond", state: "VIC", mins: 3 },
  { trade: "HVAC tech", suburb: "Fortitude Valley", state: "QLD", mins: 18 },
  { trade: "Carpenter", suburb: "Fremantle", state: "WA", mins: 7 },
  { trade: "Painter", suburb: "Norwood", state: "SA", mins: 22 },
  { trade: "Plumber", suburb: "Pyrmont", state: "NSW", mins: 2 },
  { trade: "Roofer", suburb: "Docklands", state: "VIC", mins: 14 },
];

function LiveActivityTicker() {
  const [visibleIdx, setVisibleIdx] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setVisibleIdx((i) => (i + 1) % LIVE_ACTIVITY.length), 2800);
    return () => clearInterval(id);
  }, []);

  const items = [
    LIVE_ACTIVITY[(visibleIdx) % LIVE_ACTIVITY.length],
    LIVE_ACTIVITY[(visibleIdx + 1) % LIVE_ACTIVITY.length],
    LIVE_ACTIVITY[(visibleIdx + 2) % LIVE_ACTIVITY.length],
  ];

  return (
    <div className="hidden lg:flex flex-col gap-2 w-full max-w-xs" aria-live="polite" aria-label="Recent activity">
      <p className="text-[11px] font-semibold text-white/30 uppercase tracking-widest mb-1">Live activity</p>
      {items.map((item, i) => (
        <motion.div
          key={`${visibleIdx}-${i}`}
          initial={{ opacity: 0, x: 12 }}
          animate={{ opacity: 1 - i * 0.25, x: 0 }}
          transition={{ duration: 0.35, delay: i * 0.06 }}
          className="flex items-center gap-3 bg-white/6 border border-white/8 rounded-xl px-4 py-3"
        >
          <span className="h-2 w-2 rounded-full bg-emerald-400 shrink-0 animate-pulse" aria-hidden="true" />
          <span className="text-xs text-white/65 leading-snug">
            <span className="font-semibold text-white/85">{item.trade}</span> claimed in {item.suburb}, {item.state}
            <span className="block text-white/35">{item.mins} min ago</span>
          </span>
        </motion.div>
      ))}
      <div className="mt-1 flex items-center gap-2">
        <div className="h-px flex-1 bg-white/6" />
        <span className="text-[10px] text-white/25">updated in real-time</span>
        <div className="h-px flex-1 bg-white/6" />
      </div>
    </div>
  );
}

function FaqItem({ q, a, isOpen, onToggle }: { q: string; a: string; isOpen: boolean; onToggle: () => void }) {
  return (
    <div className="border border-white/8 rounded-2xl overflow-hidden bg-white/3 hover:bg-white/5 transition-colors">
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between gap-4 px-5 py-4 text-left"
        aria-expanded={isOpen}
      >
        <span className="font-semibold text-white text-[15px] leading-snug">{q}</span>
        <ChevronDown
          className={`h-4 w-4 text-primary shrink-0 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
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

export default function LandingPage() {
  usePageTitle("Fixit 24/7 — Find Trusted Local Tradies, Fast");
  const [, navigate] = useLocation();
  const [howRole, setHowRole] = useState<"homeowner" | "tradie">("homeowner");
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const { data: categories } = useListCategories();

  // Default the How It Works tab when arriving from a tradie-targeted link
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("role") === "tradie") setHowRole("tradie");
  }, []);

  const steps = howRole === "homeowner" ? HOW_IT_WORKS_HOMEOWNER : HOW_IT_WORKS_TRADIE;

  return (
    <div className="flex flex-col min-h-screen bg-background">

      {/* ─── Hero ─── */}
      <section
        className="relative overflow-hidden text-white"
        style={{
          background: "var(--app-hero-gradient)",
          minHeight: "calc(100vh - 64px)",
        }}
      >
        <div
          className="absolute inset-0 opacity-[0.04] pointer-events-none"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23ffffff' fill-opacity='1' fill-rule='evenodd'%3E%3Ccircle cx='1' cy='1' r='1'/%3E%3C/g%3E%3C/svg%3E")`,
          }}
          aria-hidden="true"
        />

        <div className="absolute right-4 top-4 z-20 sm:right-6 lg:right-10">
          <ThemeToggle variant="mini" />
        </div>

        <div className="container mx-auto px-4 sm:px-6 relative flex flex-col lg:flex-row items-center gap-12 lg:gap-16 py-16 lg:py-24">
          {/* Left — value prop + dual CTA */}
          <motion.div
            className="w-full lg:flex-1 flex flex-col gap-6"
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="inline-flex items-center gap-2 self-start bg-white/6 border border-white/12 rounded-full px-4 py-1.5 text-sm text-white/70 font-medium backdrop-blur-sm">
              <Clock className="h-3.5 w-3.5 text-primary" aria-hidden="true" />
              Available 24/7 across Australia
            </div>

            <h1 className="text-5xl md:text-6xl lg:text-7xl font-black leading-[1.05] tracking-tight">
              From a leaky tap<br />
              <span className="text-primary">to a full reno.</span>
            </h1>

            <p className="text-lg text-white/60 max-w-xl leading-relaxed">
              Plumbing, electrical, lockouts, HVAC, carpentry and more. Fixit 24/7 connects homeowners with verified local tradies — for any job, any time.
            </p>

            {/* Dual role CTA cards — primary conversion lever */}
            <div className="grid sm:grid-cols-2 gap-3 max-w-xl w-full mt-1">
              {/* Homeowner card */}
              <Link to="/register?role=homeowner">
                <div className="group flex flex-col gap-3 bg-primary hover:opacity-95 active:scale-[0.98] transition-all rounded-2xl p-5 cursor-pointer">
                  <div className="flex items-center justify-between">
                    <div className="w-9 h-9 rounded-xl bg-black/15 flex items-center justify-center">
                      <Home className="h-4.5 w-4.5 text-black/80" aria-hidden="true" />
                    </div>
                    <ChevronRight className="h-4 w-4 text-black/40 group-hover:translate-x-0.5 transition-transform" aria-hidden="true" />
                  </div>
                  <div>
                    <p className="font-black text-black text-[15px]">I need a tradie</p>
                    <p className="text-black/55 text-xs mt-0.5 leading-snug">Post any job free — get quotes in minutes</p>
                  </div>
                </div>
              </Link>

              {/* Tradie card */}
              <Link to="/register?role=tradie">
                <div className="group flex flex-col gap-3 bg-white/8 border border-white/15 hover:bg-white/12 active:scale-[0.98] transition-all rounded-2xl p-5 cursor-pointer">
                  <div className="flex items-center justify-between">
                    <div className="w-9 h-9 rounded-xl bg-primary/15 flex items-center justify-center">
                      <HardHat className="h-4.5 w-4.5 text-primary" aria-hidden="true" />
                    </div>
                    <ChevronRight className="h-4 w-4 text-white/30 group-hover:translate-x-0.5 transition-transform" aria-hidden="true" />
                  </div>
                  <div>
                    <p className="font-black text-white text-[15px]">I'm a tradie</p>
                    <p className="text-white/45 text-xs mt-0.5 leading-snug">$111 AUD in free job leads — every month for 6 months</p>
                  </div>
                </div>
              </Link>
            </div>

            {/* Trust pills with real numbers */}
            <div className="flex flex-wrap gap-2 max-w-xl">
              {[
                { icon: BadgeCheck, label: "4,800+ licence-verified tradies" },
                { icon: CheckCircle2, label: "Free to post — no commission" },
                { icon: Clock, label: "First response ~20 min" },
                { icon: Star, label: "4.8★ average rating" },
              ].map(({ icon: Icon, label }) => (
                <span key={label} className="inline-flex items-center gap-1.5 text-xs font-medium text-white/55 bg-white/5 border border-white/8 rounded-full px-3 py-1.5">
                  <Icon className="h-3 w-3 text-primary shrink-0" aria-hidden="true" /> {label}
                </span>
              ))}
            </div>
          </motion.div>

          {/* Right — live activity ticker */}
          <motion.div
            className="hidden lg:flex flex-col items-end gap-4 shrink-0 w-72"
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.15 }}
          >
            <LiveActivityTicker />
          </motion.div>
        </div>
      </section>

      {/* ─── Fixit 24/7 Plus teaser band ─── */}
      <div className="bg-[#0d0b07] border-b border-white/8">
        <div className="container mx-auto px-4 sm:px-6 py-3 flex items-center justify-center gap-2">
          <Shield className="h-3.5 w-3.5 text-primary shrink-0" aria-hidden="true" />
          <span className="text-sm text-white/45">Home &amp; road emergency cover from</span>
          <span className="text-sm font-bold text-white/70">A$49/month</span>
          <Link to="/emergency">
            <span className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:opacity-80 transition-colors cursor-pointer ml-1">
              Learn about Fixit Plus
              <ChevronRight className="h-3.5 w-3.5" aria-hidden="true" />
            </span>
          </Link>
        </div>
      </div>

      {/* ─── Testimonials ─── */}
      <section className="py-16 bg-[#0d0a05] text-white" aria-label="Customer reviews">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="text-center mb-10">
            <span className="text-primary text-sm font-bold uppercase tracking-widest">Real people, real results</span>
            <h2 className="text-2xl sm:text-3xl font-black mt-3">Trusted by homeowners &amp; tradies</h2>
          </div>
          <div className="grid sm:grid-cols-3 gap-5 max-w-4xl mx-auto">
            {TESTIMONIALS.map((t) => (
              <motion.div
                key={t.name}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.35 }}
                className="bg-white/4 border border-white/8 rounded-2xl p-6 flex flex-col gap-4"
              >
                <div className="flex items-center gap-0.5">
                  {Array.from({ length: t.stars }).map((_, i) => (
                    <Star key={i} className="h-3.5 w-3.5 fill-primary text-primary" aria-hidden="true" />
                  ))}
                </div>
                <Quote className="h-5 w-5 text-primary/30" aria-hidden="true" />
                <p className="text-white/65 text-sm leading-relaxed flex-1">{t.quote}</p>
                <div className="flex items-center gap-2 pt-1 border-t border-white/6">
                  <div className="w-8 h-8 rounded-full bg-primary/20 border border-primary/25 flex items-center justify-center shrink-0">
                    <span className="text-xs font-black text-primary">{t.name[0]}</span>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-white/80">{t.name}</p>
                    <p className="text-[10px] text-white/35 flex items-center gap-1">
                      <MapPin className="h-2.5 w-2.5" aria-hidden="true" />
                      {t.suburb}
                      <span className="ml-1 text-primary/60 capitalize">{t.role}</span>
                    </p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── How it works ─── */}
      <section id="how-it-works" className="py-20 bg-[#0b0904] text-white">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="text-center mb-10">
            <span className="text-primary text-sm font-bold uppercase tracking-widest">Simple process</span>
            <h2 className="text-3xl sm:text-4xl font-black mt-3">How it works</h2>
            <p className="text-white/50 mt-3 max-w-md mx-auto text-[15px]">
              Whether you need a repair sorted or you're a tradie looking for work — we make it simple.
            </p>
          </div>

          {/* Role toggle */}
          <div className="flex bg-white/5 border border-white/8 rounded-2xl p-1 mb-10 max-w-xs mx-auto" role="tablist" aria-label="Select your role">
            <button
              role="tab"
              aria-selected={howRole === "homeowner"}
              onClick={() => setHowRole("homeowner")}
              className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-xl text-sm font-bold transition-all ${
                howRole === "homeowner"
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-white/45 hover:text-white/70"
              }`}
            >
              <Home className="h-3.5 w-3.5" aria-hidden="true" /> Homeowners
            </button>
            <button
              role="tab"
              aria-selected={howRole === "tradie"}
              onClick={() => setHowRole("tradie")}
              className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-xl text-sm font-bold transition-all ${
                howRole === "tradie"
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-white/45 hover:text-white/70"
              }`}
            >
              <HardHat className="h-3.5 w-3.5" aria-hidden="true" /> Tradies
            </button>
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={howRole}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.25 }}
              className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5"
              role="tabpanel"
            >
              {steps.map((item, i) => (
                <motion.div
                  key={item.step}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.08 }}
                  viewport={{ once: true }}
                  className={`relative border rounded-2xl p-6 transition-colors ${
                    i === steps.length - 1
                      ? "bg-primary/8 border-primary/25 hover:bg-primary/12"
                      : "bg-white/5 border-white/8 hover:bg-white/8"
                  }`}
                >
                  <span className="absolute top-5 right-5 text-4xl font-black text-white/5 select-none" aria-hidden="true">
                    {item.step}
                  </span>
                  <div className={`w-11 h-11 rounded-xl flex items-center justify-center mb-4 ${
                    i === steps.length - 1
                      ? "bg-primary/20 border border-primary/35"
                      : "bg-primary/15 border border-primary/20"
                  }`}>
                    <item.icon className="h-5 w-5 text-primary" aria-hidden="true" />
                  </div>
                  <h3 className="text-[15px] font-bold mb-2">{item.title}</h3>
                  <p className="text-white/50 leading-relaxed text-sm">{item.desc}</p>
                  {i === steps.length - 1 && (
                    <span className="mt-3 inline-flex items-center gap-1 text-[11px] font-bold text-primary/70 uppercase tracking-wider">
                      <CheckCircle2 className="h-3 w-3" aria-hidden="true" /> Done
                    </span>
                  )}
                </motion.div>
              ))}
            </motion.div>
          </AnimatePresence>

          {/* Role-specific CTA at bottom of steps */}
          <div className="text-center mt-10 flex flex-col sm:flex-row gap-3 justify-center items-center">
            {howRole === "homeowner" ? (
              <Link to="/register?role=homeowner">
                <button className="h-11 px-6 rounded-xl bg-primary text-primary-foreground font-bold text-sm hover:opacity-90 active:scale-[0.97] transition-all inline-flex items-center gap-2">
                  Post your first job — it's free <ChevronRight className="h-4 w-4" aria-hidden="true" />
                </button>
              </Link>
            ) : (
              <Link to="/register?role=tradie">
                <button className="h-11 px-6 rounded-xl bg-primary text-primary-foreground font-bold text-sm hover:opacity-90 active:scale-[0.97] transition-all inline-flex items-center gap-2">
                  Get $111 in free job leads <ChevronRight className="h-4 w-4" aria-hidden="true" />
                </button>
              </Link>
            )}
            <Link to="/how-it-works">
              <button className="h-11 px-6 rounded-lg border border-white/15 text-white/60 hover:text-white hover:border-white/30 text-sm font-medium transition-colors inline-flex items-center gap-2">
                See the full process <ChevronRight className="h-4 w-4" aria-hidden="true" />
              </button>
            </Link>
          </div>
        </div>
      </section>

      {/* ─── Categories ─── */}
      <section id="categories" className="py-20 bg-[#0e0c08] text-white">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="text-center mb-14">
            <span className="text-primary text-sm font-bold uppercase tracking-widest">Services</span>
            <h2 className="text-3xl sm:text-4xl font-black mt-3">What do you need fixed?</h2>
            <p className="text-white/50 mt-3 text-[15px]">Choose from 12+ trade categories</p>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {(categories ?? CATEGORIES_DISPLAY).map((cat) => {
              const Icon = "id" in cat ? (ICON_MAP[(cat as { icon: string }).icon ?? ""] ?? Wrench) : (cat as typeof CATEGORIES_DISPLAY[0]).icon;
              const label = "name" in cat ? cat.name : (cat as typeof CATEGORIES_DISPLAY[0]).label;
              return (
                <Link to="/register?role=homeowner" key={label}>
                  <div className="group bg-white/5 border border-white/8 rounded-2xl p-6 flex flex-col items-center gap-3 hover:bg-white/10 hover:border-primary/30 cursor-pointer transition-all">
                    <div className="w-14 h-14 rounded-xl bg-primary/10 border border-primary/15 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                      <Icon className="h-7 w-7 text-primary" aria-hidden="true" />
                    </div>
                    <span className="text-sm font-semibold text-center text-white/80 group-hover:text-white transition-colors">
                      {label}
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
          <div className="text-center mt-10">
            <Link to="/categories">
              <button className="h-11 px-6 rounded-lg border border-white/15 text-white/70 hover:text-white hover:border-white/30 text-sm font-medium transition-colors">
                View all categories →
              </button>
            </Link>
          </div>
        </div>
      </section>

      {/* ─── Fixit 24/7 Plus CTA ─── */}
      <section id="emergency-membership" className="py-20 bg-[#0b0904] text-white">
        <div className="container mx-auto px-4 sm:px-6 max-w-2xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4 }}
            className="rounded-2xl border border-primary/20 overflow-hidden"
            style={{ background: "var(--app-hero-panel-gradient)" }}
          >
            <div className="p-7 sm:p-8">
              {/* Label row */}
              <div className="flex items-center gap-2 mb-5">
                <div className="w-7 h-7 rounded-lg bg-primary/15 flex items-center justify-center">
                  <ShieldCheck className="h-4 w-4 text-primary" />
                </div>
                <span className="text-xs font-bold text-primary uppercase tracking-wider">Fixit 24/7 Plus</span>
              </div>

              {/* Headline */}
              <h2 className="text-2xl sm:text-3xl font-black text-white leading-snug mb-2">
                Home emergency or car breakdown —{" "}
                <span className="text-primary">one membership covers both.</span>
              </h2>
              <p className="text-sm text-white/50 mb-6 leading-relaxed">
                Pipe burst at midnight. Car dead on the highway. One call sorts it — any time, any day.
              </p>

              {/* Two-pillar grid */}
              <div className="grid grid-cols-2 gap-3 mb-6">
                <div className="bg-white/4 border border-white/6 rounded-xl p-4">
                  <div className="flex items-center gap-1.5 mb-3">
                    <Home className="h-3.5 w-3.5 text-primary" />
                    <span className="text-[10px] font-bold text-white/60 uppercase tracking-wider">At Home</span>
                  </div>
                  <ul className="space-y-2">
                    {["Burst pipes", "Power outages", "Lockouts", "Gas leaks", "Storm damage"].map((i) => (
                      <li key={i} className="flex items-center gap-1.5">
                        <CheckCircle2 className="h-3 w-3 text-primary flex-shrink-0" />
                        <span className="text-[12px] text-white/55">{i}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="bg-white/4 border border-white/6 rounded-xl p-4">
                  <div className="flex items-center gap-1.5 mb-3">
                    <Car className="h-3.5 w-3.5 text-primary" />
                    <span className="text-[10px] font-bold text-white/60 uppercase tracking-wider">On the Road</span>
                  </div>
                  <ul className="space-y-2">
                    {["Car breakdown", "Flat tyres", "Battery jump-start", "Fuel delivery", "Keys locked in"].map((i) => (
                      <li key={i} className="flex items-center gap-1.5">
                        <CheckCircle2 className="h-3 w-3 text-primary flex-shrink-0" />
                        <span className="text-[12px] text-white/55">{i}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Price anchor + CTA */}
              <div className="flex flex-col sm:flex-row sm:items-end gap-4">
                <div className="flex-1">
                  <span className="text-3xl font-black text-white">A$49</span>
                  <span className="text-sm text-white/40 ml-1">/month</span>
                  {/* Price anchoring — shows value vs real cost of a single callout */}
                  <p className="text-xs text-white/40 mt-1 leading-snug">
                    One emergency callout typically costs <span className="text-white/60 font-semibold">A$350–$600</span>.<br />
                    This membership covers unlimited callouts.
                  </p>
                </div>
                <Link to="/emergency">
                  <button className="w-full sm:w-auto h-11 px-6 rounded-xl bg-primary hover:opacity-90 text-primary-foreground font-black text-sm transition-colors whitespace-nowrap">
                    Get Plus — A$49/month
                  </button>
                </Link>
              </div>

              {/* Disclaimer moved below the fold of the card, visually deemphasised */}
              <p className="text-[11px] text-white/20 mt-4 border-t border-white/6 pt-3">
                6-month minimum commitment · Cancel anytime after that · Subject to fair use policy
              </p>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ─── FAQ ─── */}
      <section className="py-20 bg-[#0b0904] text-white">
        <div className="container max-w-2xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-12">
            <span className="text-primary text-sm font-bold uppercase tracking-widest">Questions answered</span>
            <h2 className="text-3xl sm:text-4xl font-black mt-3 mb-3">Common questions</h2>
            <p className="text-white/50 text-[15px]">
              Everything you need to know before getting started.
            </p>
          </div>

          <div className="flex flex-col gap-2 mb-10">
            {FAQS_LANDING.map((faq, i) => (
              <FaqItem
                key={faq.q}
                q={faq.q}
                a={faq.a}
                isOpen={openFaq === i}
                onToggle={() => setOpenFaq(openFaq === i ? null : i)}
              />
            ))}
          </div>

          <div className="text-center">
            <Link to="/how-it-works">
              <button className="h-11 px-6 rounded-lg border border-white/15 text-white/70 hover:text-white hover:border-white/30 text-sm font-medium transition-colors inline-flex items-center gap-2">
                See all questions <ChevronRight className="h-4 w-4" aria-hidden="true" />
              </button>
            </Link>
          </div>
        </div>
      </section>

      {/* ─── Final CTA ─── */}
      <section className="py-20 bg-primary">
        <div className="container mx-auto max-w-2xl px-4 sm:px-6 text-center">
          <Clock className="h-14 w-14 text-black/30 mx-auto mb-6" aria-hidden="true" />
          <h2 className="text-3xl sm:text-4xl font-black text-black">Emergency repair?<br />We're ready now.</h2>
          <p className="text-black/60 mt-5 text-lg max-w-md mx-auto">
            Burst pipe at 2am? Power outage on a Sunday? Our tradies are on call 24 hours a day, 7 days a week.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-2 mt-6 mb-8">
            {["Free to post", "No commitment needed", "Verified local tradies", "Direct messaging"].map((t) => (
              <span key={t} className="inline-flex items-center gap-1.5 text-xs font-semibold text-black/60 bg-black/8 rounded-full px-3 py-1">
                <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" /> {t}
              </span>
            ))}
          </div>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/register?role=homeowner">
              <button className="h-12 px-8 rounded-xl bg-black text-white font-bold text-[15px] hover:bg-[#1a1a1a] active:scale-[0.97] transition-all">
                Post emergency job
              </button>
            </Link>
            <Link to="/login">
              <button className="h-12 px-8 rounded-xl border-2 border-black text-black font-bold text-[15px] hover:bg-black/10 active:scale-[0.97] transition-all">
                Sign in
              </button>
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
