import { usePageTitle } from "@/hooks/use-page-title";
import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { motion, AnimatePresence } from "framer-motion";
import { useListCategories, useCreateEmergencyCheckout } from "@workspace/api-client-react";
import { Footer } from "@/components/footer";
import {
  Wrench, Zap, Droplets, Home, TreePine, Wind, Hammer,
  PaintbrushIcon, ShieldCheck, Star, MapPin, ChevronRight,
  CheckCircle2, Clock, Users, BadgeCheck, MessageSquare,
  ChevronDown, HardHat, Car, Shield,
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

const TRADIE_PERKS = [
  "1111 credits renewed every month, automatically",
  "Use credits to unlock and pick up local jobs",
  "Grow revenue without heavy ad spend",
  "Get in front of homeowners already searching",
];


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
    desc: "Create your profile in minutes. No credit card required. Completely free to join.",
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
    a: "Every tradie on Fixit 24/7 has a verified profile with identity checks, licence verification, and publicly visible ratings from past jobs.",
  },
  {
    q: "How quickly will I hear back?",
    a: "Most jobs receive their first tradie response within 30 minutes. Emergency jobs are automatically prioritised.",
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

export default function LandingPage() {
  usePageTitle("Fixit 24/7 — Find Trusted Local Tradies, Fast");
  const [suburb, setSuburb] = useState("");
  const [, setLocation] = useLocation();
  const [howRole, setHowRole] = useState<"homeowner" | "tradie">("homeowner");
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [coveredOpen, setCoveredOpen] = useState(false);
  const [notCoveredOpen, setNotCoveredOpen] = useState(false);
  const { data: categories } = useListCategories();
  const { user } = useAuth();

  const checkoutMutation = useCreateEmergencyCheckout({
    mutation: {
      onSuccess: (data) => {
        if (data.url) window.location.href = data.url;
      },
    },
  });

  function handleEmergencyJoin() {
    if (!user) {
      setLocation("/login");
      return;
    }
    if (user.role !== "homeowner") {
      setLocation("/register?role=homeowner");
      return;
    }
    checkoutMutation.mutate();
  }

  const handleFindTradies = () => {
    setLocation(`/register?role=homeowner&suburb=${encodeURIComponent(suburb)}`);
  };

  const steps = howRole === "homeowner" ? HOW_IT_WORKS_HOMEOWNER : HOW_IT_WORKS_TRADIE;

  return (
    <div className="flex flex-col min-h-screen bg-[#0b0904]">

      {/* ─── Hero ─── */}
      <section
        className="relative overflow-hidden text-white"
        style={{
          background: "radial-gradient(ellipse at 25% 55%, #251d08 0%, #120f06 45%, #070604 100%)",
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

        <div className="container mx-auto px-4 sm:px-6 relative flex flex-col lg:flex-row items-center gap-12 py-16 lg:py-28">
          {/* Left */}
          <motion.div
            className="w-full lg:flex-1 flex flex-col gap-6"
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="inline-flex items-center gap-2 self-start bg-white/6 border border-white/12 rounded-full px-4 py-1.5 text-sm text-white/70 font-medium backdrop-blur-sm">
              <Clock className="h-3.5 w-3.5 text-[#ffc800]" aria-hidden="true" />
              Available 24/7 across Australia
            </div>

            <div>
              <h1 className="text-5xl md:text-6xl lg:text-7xl font-black leading-[1.05] tracking-tight">
                Emergency repairs,<br />
                <span className="text-[#ffc800]">fixed fast.</span>
              </h1>
            </div>

            <p className="text-lg text-white/60 max-w-md leading-relaxed">
              From burst pipes and power outages to lockouts, broken aircon, and everyday home repairs — Fixit 24/7 connects you with trusted local tradies for any job, any time of day.
            </p>

            <div className="flex gap-2 max-w-md w-full">
              <div className="flex-1 relative">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/30" aria-hidden="true" />
                <input
                  type="text"
                  value={suburb}
                  onChange={(e) => setSuburb(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleFindTradies()}
                  placeholder="Your suburb or postcode"
                  aria-label="Enter your suburb to find tradies"
                  className="w-full bg-white/5 border border-white/12 rounded-xl pl-10 pr-4 h-12 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-[#ffc800]/50 focus:bg-white/8 transition-all"
                />
              </div>
              <button
                onClick={handleFindTradies}
                className="h-12 px-5 rounded-xl font-bold text-[15px] text-black bg-[#ffc800] hover:bg-[#e6b800] active:scale-[0.97] transition-all shrink-0"
              >
                Find tradies
              </button>
            </div>

            <div className="flex flex-wrap gap-3 max-w-md">
              {[
                "Plumbing & electrical",
                "Lockouts & security",
                "HVAC & appliances",
                "All home repairs",
              ].map((t) => (
                <span key={t} className="inline-flex items-center gap-1.5 text-xs font-medium text-white/50 bg-white/5 rounded-full px-3 py-1">
                  <CheckCircle2 className="h-3 w-3 text-[#ffc800]" aria-hidden="true" /> {t}
                </span>
              ))}
            </div>

            <div className="pt-1">
              <Link href="/emergency">
                <span className="inline-flex items-center gap-1.5 text-sm text-white/40 hover:text-[#ffc800] transition-colors cursor-pointer">
                  <Shield className="h-3.5 w-3.5" aria-hidden="true" />
                  Fixit 24/7 Emergency membership — $49/month
                  <ChevronRight className="h-3.5 w-3.5" aria-hidden="true" />
                </span>
              </Link>
            </div>
          </motion.div>

          {/* Right — Tradie card */}
          <motion.div
            className="w-full lg:w-[380px] shrink-0"
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.15 }}
          >
            <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
              <div className="p-7">
                {/* Credits callout badge */}
                <div className="flex items-center gap-2 mb-4">
                  <span className="inline-flex items-center gap-1.5 bg-[#ffc800]/15 text-[#b8920a] border border-[#ffc800]/30 text-xs font-bold px-3 py-1.5 rounded-full">
                    <Star className="h-3.5 w-3.5" aria-hidden="true" />
                    1111 credits / month — free
                  </span>
                </div>

                <h2 className="text-[21px] font-bold text-gray-900 leading-snug mb-2">
                  Start picking up jobs and grow your business revenue — join free
                </h2>
                <p className="text-sm text-gray-500 mb-5">
                  Get 1111 free credits every month to unlock jobs and start winning new work.
                </p>

                <ul className="flex flex-col gap-3 mb-6" role="list">
                  {TRADIE_PERKS.map((perk) => (
                    <li key={perk} className="flex items-center gap-3 text-[14px] text-gray-700">
                      <CheckCircle2 className="h-4.5 w-4.5 text-emerald-500 shrink-0" aria-hidden="true" />
                      {perk}
                    </li>
                  ))}
                </ul>

                <Link href="/signup?role=tradie">
                  <button className="w-full h-12 rounded-xl font-bold text-[15px] text-white bg-[#1a1a1a] hover:bg-[#2d2d2d] active:scale-[0.97] transition-all inline-flex items-center justify-center gap-2">
                    Join free and start picking up jobs
                    <ChevronRight className="h-4 w-4" aria-hidden="true" />
                  </button>
                </Link>

                <Link href="#how-it-works">
                  <span className="mt-3 flex items-center justify-center gap-1.5 text-sm font-medium text-gray-500 hover:text-gray-800 transition-colors cursor-pointer">
                    See how tradie credits work
                    <ChevronRight className="h-3.5 w-3.5" aria-hidden="true" />
                  </span>
                </Link>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ─── Membership Conversion Section ─── */}
      <section className="relative overflow-hidden bg-[#0d0a05] border-y border-[#ffc800]/12 py-16 lg:py-20 text-white" aria-label="Emergency membership offer">
        {/* Warm glow */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{ background: "radial-gradient(ellipse at 50% 120%, rgba(255,200,0,0.07) 0%, transparent 65%)" }}
          aria-hidden="true"
        />

        <div className="container mx-auto px-4 sm:px-6 max-w-5xl relative">
          <div className="flex flex-col lg:flex-row items-center gap-12">

            {/* ── Left: copy ── */}
            <motion.div
              className="flex-1 flex flex-col"
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.45 }}
            >
              <div className="inline-flex items-center gap-2 self-start bg-[#ffc800]/10 border border-[#ffc800]/20 rounded-full px-4 py-1.5 text-sm text-[#ffc800] font-semibold mb-5">
                <Shield className="h-3.5 w-3.5" aria-hidden="true" />
                Fixit Emergency 24/7
              </div>

              <h2 className="text-4xl sm:text-5xl font-black leading-[1.08] tracking-tight mb-5">
                Peace of mind for just{" "}
                <span className="text-[#ffc800]">$49/month</span>
              </h2>

              <p className="text-white/55 text-[15px] leading-relaxed mb-8 max-w-lg">
                One membership for emergencies, whether in or out of home — giving you peace of mind and security. From burst pipes and lockouts to power failures and car breakdowns, Fixit Emergency 24/7 means you're always one tap away from trusted help, without the shock of paying full price every time.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-8">
                {[
                  { icon: Home, label: "Home emergency support" },
                  { icon: Car, label: "Car breakdown assistance" },
                  { icon: Clock, label: "24/7 access when things go wrong" },
                ].map(({ icon: Icon, label }) => (
                  <div key={label} className="flex items-center gap-3 text-sm text-white/70">
                    <div className="w-8 h-8 rounded-lg bg-[#ffc800]/10 border border-[#ffc800]/15 flex items-center justify-center shrink-0">
                      <Icon className="h-4 w-4 text-[#ffc800]" aria-hidden="true" />
                    </div>
                    {label}
                  </div>
                ))}
              </div>

              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  onClick={handleEmergencyJoin}
                  disabled={checkoutMutation.isPending}
                  className="inline-flex items-center justify-center gap-2 h-12 px-7 rounded-xl font-bold text-[15px] text-black bg-[#ffc800] hover:bg-[#e6b800] active:scale-[0.97] transition-all disabled:opacity-60"
                >
                  {checkoutMutation.isPending ? "Loading…" : "Get protected for $49/month"}
                  {!checkoutMutation.isPending && <ChevronRight className="h-4 w-4" aria-hidden="true" />}
                </button>
                <Link href="/emergency">
                  <button className="inline-flex items-center justify-center h-12 px-6 rounded-xl font-semibold text-[15px] text-white border border-white/18 hover:bg-white/6 active:scale-[0.97] transition-all">
                    See how the membership works
                  </button>
                </Link>
              </div>
            </motion.div>

            {/* ── Right: price card ── */}
            <motion.div
              className="w-full lg:w-[320px] shrink-0"
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.45, delay: 0.12 }}
            >
              <div className="relative rounded-3xl">
                <div className="absolute -inset-px rounded-3xl bg-gradient-to-b from-[#ffc800]/35 to-[#ffc800]/8" aria-hidden="true" />
                <div className="relative bg-gradient-to-b from-[#1c1508] to-[#110d05] rounded-3xl p-7 border border-[#ffc800]/18">
                  <p className="text-[#ffc800] text-xs font-bold uppercase tracking-widest mb-5 text-center">Choose your plan</p>

                  {/* Monthly option */}
                  <div className="bg-[#ffc800]/8 border border-[#ffc800]/30 rounded-2xl p-5 mb-3">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-[#ffc800] text-[11px] font-bold uppercase tracking-widest">Monthly</span>
                    </div>
                    <div className="flex items-end gap-1 mb-4">
                      <span className="text-white/50 text-base font-bold self-start mt-1">A$</span>
                      <span className="text-5xl font-black text-white leading-none">49</span>
                      <span className="text-white/50 text-sm font-medium self-end mb-0.5">/mo</span>
                    </div>
                    <button
                      onClick={handleEmergencyJoin}
                      disabled={checkoutMutation.isPending}
                      className="w-full h-10 rounded-xl font-bold text-[13px] text-black bg-[#ffc800] hover:bg-[#e6b800] active:scale-[0.97] transition-all disabled:opacity-60 inline-flex items-center justify-center gap-1.5"
                    >
                      {checkoutMutation.isPending ? "Loading…" : "Get protected"}
                      {!checkoutMutation.isPending && <ChevronRight className="h-3.5 w-3.5" aria-hidden="true" />}
                    </button>
                  </div>

                  {/* Annual option */}
                  <div className="bg-white/4 border border-white/10 rounded-2xl p-5 relative mb-5">
                    <span className="absolute -top-2.5 right-4 bg-[#ffc800] text-black text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-widest">Save 10%</span>
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-white/40 text-[11px] font-bold uppercase tracking-widest">Annual</span>
                      <span className="text-white/25 text-[10px]">Coming soon</span>
                    </div>
                    <div className="flex items-end gap-1">
                      <span className="text-white/35 text-base font-bold self-start mt-1">A$</span>
                      <span className="text-5xl font-black text-white/40 leading-none">529</span>
                      <span className="text-white/35 text-sm font-medium self-end mb-0.5">/yr</span>
                    </div>
                  </div>

                  <p className="text-[10px] text-white/25 text-center leading-snug">
                    Eligible emergencies only · fair use and exclusions apply
                  </p>
                </div>
              </div>
            </motion.div>

          </div>
        </div>
      </section>

      {/* ─── How it works ─── */}
      <section id="how-it-works" className="py-20 bg-[#0b0904] text-white">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="text-center mb-10">
            <span className="text-[#ffc800] text-sm font-bold uppercase tracking-widest">Simple process</span>
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
                  ? "bg-[#ffc800] text-black shadow-sm"
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
                  ? "bg-[#ffc800] text-black shadow-sm"
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
                  className="relative bg-white/5 border border-white/8 rounded-2xl p-6 hover:bg-white/8 transition-colors"
                >
                  <span className="absolute top-5 right-5 text-4xl font-black text-white/5 select-none" aria-hidden="true">
                    {item.step}
                  </span>
                  <div className="w-11 h-11 rounded-xl bg-[#ffc800]/15 border border-[#ffc800]/20 flex items-center justify-center mb-4">
                    <item.icon className="h-5 w-5 text-[#ffc800]" aria-hidden="true" />
                  </div>
                  <h3 className="text-[15px] font-bold mb-2">{item.title}</h3>
                  <p className="text-white/50 leading-relaxed text-sm">{item.desc}</p>
                </motion.div>
              ))}
            </motion.div>
          </AnimatePresence>

          <div className="text-center mt-10">
            <Link href="/how-it-works">
              <button className="h-11 px-6 rounded-lg border border-white/15 text-white/70 hover:text-white hover:border-white/30 text-sm font-medium transition-colors inline-flex items-center gap-2">
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
            <span className="text-[#ffc800] text-sm font-bold uppercase tracking-widest">Services</span>
            <h2 className="text-3xl sm:text-4xl font-black mt-3">What do you need fixed?</h2>
            <p className="text-white/50 mt-3 text-[15px]">Choose from 12+ trade categories</p>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {(categories ?? CATEGORIES_DISPLAY).map((cat) => {
              const Icon = "id" in cat ? (ICON_MAP[(cat as { icon: string }).icon ?? ""] ?? Wrench) : (cat as typeof CATEGORIES_DISPLAY[0]).icon;
              const label = "name" in cat ? cat.name : (cat as typeof CATEGORIES_DISPLAY[0]).label;
              return (
                <Link href="/signup?role=homeowner" key={label}>
                  <div className="group bg-white/5 border border-white/8 rounded-2xl p-6 flex flex-col items-center gap-3 hover:bg-white/10 hover:border-[#ffc800]/30 cursor-pointer transition-all">
                    <div className="w-14 h-14 rounded-xl bg-[#ffc800]/10 border border-[#ffc800]/15 flex items-center justify-center group-hover:bg-[#ffc800]/20 transition-colors">
                      <Icon className="h-7 w-7 text-[#ffc800]" aria-hidden="true" />
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
            <Link href="/categories">
              <button className="h-11 px-6 rounded-lg border border-white/15 text-white/70 hover:text-white hover:border-white/30 text-sm font-medium transition-colors">
                View all categories →
              </button>
            </Link>
          </div>
        </div>
      </section>

      {/* ─── Emergency 24/7 Membership ─── */}
      <section id="emergency-membership" className="py-20 bg-[#0b0904] text-white">
        <div className="container mx-auto px-4 sm:px-6 max-w-4xl">
          <div className="text-center mb-10">
            <span className="text-[#ffc800] text-sm font-bold uppercase tracking-widest">Homeowner Membership</span>
            <h2 className="text-3xl sm:text-4xl font-black mt-3">One membership for emergencies — whether in or out of home</h2>
            <p className="text-white/45 mt-3 text-[15px] max-w-lg mx-auto">Giving you peace of mind and security when life's worst-timed problems hit.</p>
          </div>

          {/* Main card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4 }}
            className="relative rounded-3xl mb-6"
          >
            <div className="absolute -inset-px rounded-3xl bg-gradient-to-b from-[#ffc800]/40 to-[#ffc800]/10" aria-hidden="true" />
            <div className="relative bg-[#130f07] rounded-3xl p-8 border border-[#ffc800]/20">
              <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                <span className="bg-[#ffc800] text-black text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest">
                  Homeowners Only
                </span>
              </div>

              <div className="flex flex-col lg:flex-row gap-8 pt-2">
                {/* Pricing + CTA column */}
                <div className="lg:w-72 flex-shrink-0">
                  <p className="text-white/40 text-sm font-medium mb-4">Choose your plan</p>

                  {/* Monthly */}
                  <div className="bg-[#ffc800]/8 border border-[#ffc800]/30 rounded-2xl p-4 mb-3">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[#ffc800] text-[11px] font-bold uppercase tracking-widest">Monthly</span>
                    </div>
                    <div className="flex items-end gap-1 mb-3">
                      <span className="text-white/50 text-base font-bold self-start mt-1">A$</span>
                      <span className="text-4xl font-black text-white leading-none">49</span>
                      <span className="text-white/50 text-sm font-medium self-end mb-0.5">/mo</span>
                    </div>
                    <button
                      onClick={handleEmergencyJoin}
                      disabled={checkoutMutation.isPending}
                      className="w-full h-10 rounded-xl font-bold text-[13px] text-black bg-[#ffc800] hover:bg-[#e6b800] active:scale-[0.97] transition-all inline-flex items-center justify-center gap-1.5 disabled:opacity-60"
                    >
                      {checkoutMutation.isPending ? "Loading…" : "Get protected"}
                      {!checkoutMutation.isPending && <ChevronRight className="h-3.5 w-3.5" aria-hidden="true" />}
                    </button>
                  </div>

                  {/* Annual */}
                  <div className="bg-white/4 border border-white/10 rounded-2xl p-4 relative mb-5">
                    <span className="absolute -top-2.5 right-3 bg-[#ffc800] text-black text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-widest">Save 10%</span>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-white/40 text-[11px] font-bold uppercase tracking-widest">Annual</span>
                      <span className="text-white/25 text-[10px]">Coming soon</span>
                    </div>
                    <div className="flex items-end gap-1">
                      <span className="text-white/35 text-base font-bold self-start mt-1">A$</span>
                      <span className="text-4xl font-black text-white/40 leading-none">529</span>
                      <span className="text-white/35 text-sm font-medium self-end mb-0.5">/yr</span>
                    </div>
                  </div>

                  <ul className="flex flex-col gap-2.5 mb-4" role="list">
                    {[
                      "24/7 access to trusted tradies",
                      "Priority dispatch — we find help fast",
                      "In or out of home — one membership",
                      "Member‑only rates on extra work",
                    ].map((perk) => (
                      <li key={perk} className="flex items-start gap-2.5 text-[13px] text-white/75">
                        <CheckCircle2 className="h-4 w-4 text-[#ffc800] shrink-0 mt-0.5" aria-hidden="true" />
                        {perk}
                      </li>
                    ))}
                  </ul>

                  <p className="text-[11px] text-white/30">
                    Eligible emergencies only · fair use applies
                  </p>
                </div>

                {/* Body copy */}
                <div className="flex-1 text-white/60 text-[14px] leading-relaxed space-y-3">
                  <p>
                    Whether you're at home or out and about — a burst pipe flooding the hallway, no power on a freezing night, locked out late, or stranded with a car that won't start — emergencies don't wait for a convenient moment.
                  </p>
                  <p>
                    Fixit Emergency 24/7 is <span className="text-white/85 font-semibold">one membership that covers you wherever you are</span>, turning those <span className="text-white/85 font-semibold">"how much is this going to cost me?"</span> moments into <span className="text-white/85 font-semibold">"it's sorted — just tap the app."</span>
                  </p>
                  <p className="text-white/40 text-xs italic border-l-2 border-[#ffc800]/30 pl-3">
                    One membership. Home emergencies and car breakdowns covered. <strong className="text-white/60 not-italic">Peace of mind and security — in or out of home.</strong>
                  </p>
                </div>
              </div>
            </div>
          </motion.div>

          {/* What's covered / What's not covered accordions */}
          <div className="flex flex-col gap-2 mb-6">
            {/* What's covered */}
            <div className="border border-white/8 rounded-2xl overflow-hidden bg-white/3">
              <button
                onClick={() => setCoveredOpen(!coveredOpen)}
                className="w-full flex items-center justify-between gap-4 px-5 py-4 text-left"
                aria-expanded={coveredOpen}
              >
                <span className="font-semibold text-white text-[15px]">What we treat as an emergency</span>
                <ChevronDown
                  className={`h-4 w-4 text-[#ffc800] shrink-0 transition-transform duration-200 ${coveredOpen ? "rotate-180" : ""}`}
                  aria-hidden="true"
                />
              </button>
              <AnimatePresence initial={false}>
                {coveredOpen && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.22, ease: "easeInOut" }}
                    className="overflow-hidden"
                  >
                    <div className="px-5 pb-5 text-white/55 text-sm leading-relaxed space-y-4">
                      <p>Your membership is for situations that affect <strong className="text-white/75">safety, security or essential services</strong> at home. We'll organise an emergency tradie for:</p>
                      <div className="space-y-3">
                        {[
                          {
                            title: "Plumbing",
                            items: [
                              "Burst pipes or serious leaks causing internal damage.",
                              "Blocked toilet, drain or sewer with overflow or no usable toilet in the home.",
                              "Fixtures that will not stop running and cannot be isolated.",
                            ],
                          },
                          {
                            title: "Electrical",
                            items: [
                              "Loss of power to your home that is not a wider network outage.",
                              "Dangerous faults: sparking outlets, burning smells, tripping switchboard or exposed live wiring.",
                            ],
                          },
                          {
                            title: "Locksmith & security",
                            items: [
                              "Locked out of your home and unable to gain entry.",
                              "Broken or jammed external door locks that stop you securing the property.",
                              "Broken external door or window leaving the home insecure (make‑safe only).",
                            ],
                          },
                          {
                            title: "Gas & hot water",
                            items: [
                              "Suspected gas leak inside or immediately around the home.",
                              "Complete failure of your main hot water system (no hot water at all).",
                            ],
                          },
                          {
                            title: "Roof & storm",
                            items: [
                              "Sudden roof or gutter damage causing water to enter the home (temporary make‑safe, for example tarping).",
                            ],
                          },
                        ].map((cat) => (
                          <div key={cat.title}>
                            <p className="font-semibold text-white/75 mb-1">{cat.title}</p>
                            <ul className="space-y-1">
                              {cat.items.map((item) => (
                                <li key={item} className="flex items-start gap-2">
                                  <span className="text-[#ffc800] mt-0.5 shrink-0">–</span>
                                  {item}
                                </li>
                              ))}
                            </ul>
                          </div>
                        ))}
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* What's not covered */}
            <div className="border border-white/8 rounded-2xl overflow-hidden bg-white/3">
              <button
                onClick={() => setNotCoveredOpen(!notCoveredOpen)}
                className="w-full flex items-center justify-between gap-4 px-5 py-4 text-left"
                aria-expanded={notCoveredOpen}
              >
                <span className="font-semibold text-white text-[15px]">What's not included</span>
                <ChevronDown
                  className={`h-4 w-4 text-[#ffc800] shrink-0 transition-transform duration-200 ${notCoveredOpen ? "rotate-180" : ""}`}
                  aria-hidden="true"
                />
              </button>
              <AnimatePresence initial={false}>
                {notCoveredOpen && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.22, ease: "easeInOut" }}
                    className="overflow-hidden"
                  >
                    <div className="px-5 pb-5 text-white/55 text-sm leading-relaxed">
                      <p className="mb-3">To keep the service fair and sustainable for everyone, Fixit Emergency 24/7 does <strong className="text-white/75">not</strong> cover:</p>
                      <ul className="space-y-2">
                        {[
                          "Non‑urgent or cosmetic issues (dripping taps, painting, minor cracks, routine upgrades).",
                          "Full system upgrades or major projects (full roof replacement, full switchboard upgrade, full bathroom/kitchen renovations).",
                          "Pre‑existing or long‑standing problems that were there before you joined.",
                          "Area‑wide power outages that sit with your energy provider.",
                          "Any costs beyond the included cover amount — you can still approve and pay extra through the app.",
                        ].map((item) => (
                          <li key={item} className="flex items-start gap-2">
                            <span className="text-white/30 mt-0.5 shrink-0">–</span>
                            {item}
                          </li>
                        ))}
                      </ul>
                      <p className="mt-3 text-white/40 italic">Those jobs can still be booked through Fixit 24/7 as normal paid jobs, just not as part of the membership cover.</p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Key details */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="bg-white/3 border border-white/8 rounded-2xl p-5"
          >
            <p className="font-bold text-white text-sm mb-3">Key details</p>
            <ul className="space-y-2 text-white/50 text-[13px] leading-relaxed">
              {[
                "$49/month billed monthly, or $529/year billed annually (save 10%).",
                "12-month membership — home emergencies and car breakdown support included.",
                "Cover applies whether you are at home or out — one membership for all eligible emergencies.",
                "If more time or parts are needed, the tradie will show a quote first — you choose whether to proceed and pay the extra in the app.",
                "Emergencies must be sudden and unforeseen. Long‑term issues and known faults are excluded.",
                "A short waiting period (72 hours) applies from when you first join before you can request an emergency.",
              ].map((detail) => (
                <li key={detail} className="flex items-start gap-2">
                  <span className="text-[#ffc800]/50 mt-0.5 shrink-0">–</span>
                  {detail}
                </li>
              ))}
            </ul>
          </motion.div>
        </div>
      </section>

      {/* ─── FAQ ─── */}
      <section className="py-20 bg-[#0b0904] text-white">
        <div className="container max-w-2xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-12">
            <span className="text-[#ffc800] text-sm font-bold uppercase tracking-widest">Questions answered</span>
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
            <Link href="/how-it-works">
              <button className="h-11 px-6 rounded-lg border border-white/15 text-white/70 hover:text-white hover:border-white/30 text-sm font-medium transition-colors inline-flex items-center gap-2">
                See all questions <ChevronRight className="h-4 w-4" aria-hidden="true" />
              </button>
            </Link>
          </div>
        </div>
      </section>

      {/* ─── Emergency CTA ─── */}
      <section className="py-20 bg-[#ffc800]">
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
            <Link href="/signup?role=homeowner">
              <button className="h-12 px-8 rounded-xl bg-black text-white font-bold text-[15px] hover:bg-[#1a1a1a] active:scale-[0.97] transition-all">
                Post emergency job
              </button>
            </Link>
            <Link href="/login">
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
