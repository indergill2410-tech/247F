"use client";

import { usePageTitle } from "@/hooks/use-page-title";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { motion, AnimatePresence } from "framer-motion";
import { useListCategories } from "@workspace/api-client-react";
import { Footer } from "@/components/footer";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import {
  Wrench, Zap, Droplets, Home, TreePine, Wind, Hammer,
  PaintbrushIcon, ShieldCheck, Star, MapPin, ChevronRight,
  CheckCircle2, Clock, Users, BadgeCheck, MessageSquare,
  ChevronDown, HardHat, Car, Shield, Lock, Flame, Thermometer, BatteryFull, Fuel,
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
    desc: "Create your profile in minutes and claim A$111/month in free job lead credits for your first 6 months. No credit card required.",
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
  const [suburb, setSuburb] = useState("");
  const router = useRouter();
  const [howRole, setHowRole] = useState<"homeowner" | "tradie">("homeowner");
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const { data: categories } = useListCategories();
  const { data: session } = useSession();
  const user = session?.user;

  const handleFindTradies = () => {
    router.push(`/register?role=homeowner&suburb=${encodeURIComponent(suburb)}`);
  };

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

        <div className="container mx-auto px-4 sm:px-6 relative flex flex-col lg:flex-row items-center gap-12 py-16 lg:py-28">
          {/* Left */}
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

            <div>
              <h1 className="text-5xl md:text-6xl lg:text-7xl font-black leading-[1.05] tracking-tight">
                From a leaky tap<br />
                <span className="text-primary">to a full reno.</span>
              </h1>
            </div>

            <p className="text-lg text-white/60 max-w-2xl leading-relaxed">
              From everyday repairs to after-hours emergencies — plumbing, electrical, lockouts, HVAC, carpentry and more. Fixit 24/7 connects you with verified local tradies for any job, 24/7.
            </p>

            <div className="flex gap-2 max-w-2xl w-full">
              <div className="flex-1 relative">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/30" aria-hidden="true" />
                <input
                  type="text"
                  value={suburb}
                  onChange={(e) => setSuburb(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleFindTradies()}
                  placeholder="Your suburb or postcode"
                  aria-label="Enter your suburb to find tradies"
                  className="w-full bg-white/5 border border-white/12 rounded-xl pl-10 pr-4 h-12 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-primary/50 focus:bg-white/8 transition-all"
                />
              </div>
              <button
                onClick={handleFindTradies}
                className="h-12 px-5 rounded-xl font-bold text-[15px] text-primary-foreground bg-primary hover:opacity-90 active:scale-[0.97] transition-all shrink-0 whitespace-nowrap"
              >
                Post your job for free
              </button>
            </div>

            <div className="flex flex-wrap gap-2.5 max-w-2xl">
              {[
                { icon: BadgeCheck, label: "Licensed & insured tradies" },
                { icon: CheckCircle2, label: "Free to post any job" },
                { icon: Shield, label: "Emergency jobs prioritised" },
                { icon: Star, label: "Rated & reviewed" },
              ].map(({ icon: Icon, label }) => (
                <span key={label} className="inline-flex items-center gap-1.5 text-xs font-medium text-white/55 bg-white/5 border border-white/8 rounded-full px-3 py-1.5">
                  <Icon className="h-3 w-3 text-primary shrink-0" aria-hidden="true" /> {label}
                </span>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* ─── Tradie nudge band ─── */}
      <div className="bg-[#0d0b07] border-b border-white/8">
        <div className="container mx-auto px-4 sm:px-6 py-3 flex items-center justify-center gap-2">
          <span className="text-sm text-white/45">Are you a tradie?</span>
          <Link href="/partner">
            <span className="inline-flex items-center gap-1 text-sm font-medium text-white/65 hover:text-[#ffc800] transition-colors cursor-pointer">
              Get verified jobs in your area
              <ChevronRight className="h-3.5 w-3.5" aria-hidden="true" />
            </span>
          </Link>
        </div>
      </div>

      {/* ─── Fixit 24/7 Plus teaser ─── */}
      <section className="relative overflow-hidden bg-[#0d0a05] border-y border-primary/12 py-12 text-white" aria-label="Fixit 24/7 Plus membership">
        <div className="container mx-auto px-4 sm:px-6 max-w-4xl">
          <div className="flex flex-col sm:flex-row items-center gap-6 justify-between">
            <div className="flex items-center gap-4">
              <div className="w-11 h-11 rounded-xl bg-primary/12 border border-primary/20 flex items-center justify-center shrink-0">
                <Shield className="h-5 w-5 text-primary" aria-hidden="true" />
              </div>
              <div>
                <p className="text-sm font-bold text-white">Fixit 24/7 Plus — A$49/mo</p>
                <p className="text-xs text-white/45 mt-0.5">Emergency cover at home and on the road, 24/7 dispatch, member rates.</p>
              </div>
            </div>
            <Link href="/emergency">
              <button className="shrink-0 inline-flex items-center gap-2 h-10 px-5 rounded-xl font-bold text-[13px] text-primary-foreground bg-primary hover:opacity-90 active:scale-[0.97] transition-all">
                Learn more <ChevronRight className="h-3.5 w-3.5" aria-hidden="true" />
              </button>
            </Link>
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
                  className="relative bg-white/5 border border-white/8 rounded-2xl p-6 hover:bg-white/8 transition-colors"
                >
                  <span className="absolute top-5 right-5 text-4xl font-black text-white/5 select-none" aria-hidden="true">
                    {item.step}
                  </span>
                  <div className="w-11 h-11 rounded-xl bg-primary/15 border border-primary/20 flex items-center justify-center mb-4">
                    <item.icon className="h-5 w-5 text-primary" aria-hidden="true" />
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
            <span className="text-primary text-sm font-bold uppercase tracking-widest">Services</span>
            <h2 className="text-3xl sm:text-4xl font-black mt-3">What do you need fixed?</h2>
            <p className="text-white/50 mt-3 text-[15px]">Choose from 12+ trade categories</p>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {(categories ?? CATEGORIES_DISPLAY).map((cat) => {
              const Icon = "id" in cat ? (ICON_MAP[(cat as { icon: string }).icon ?? ""] ?? Wrench) : (cat as typeof CATEGORIES_DISPLAY[0]).icon;
              const label = "name" in cat ? cat.name : (cat as typeof CATEGORIES_DISPLAY[0]).label;
              return (
                <Link href="/signup?role=homeowner" key={label}>
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
            <Link href="/categories">
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

              {/* Price + CTA */}
              <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                <div className="flex-1">
                  <span className="text-3xl font-black text-white">A$49</span>
                  <span className="text-sm text-white/40 ml-1">/month</span>
                  <p className="text-[11px] text-white/30 mt-0.5">Home + road cover in one plan</p>
                </div>
                <Link href="/emergency">
                  <button className="w-full sm:w-auto h-11 px-6 rounded-xl bg-primary hover:opacity-90 text-primary-foreground font-black text-sm transition-colors whitespace-nowrap">
                    Get Plus — A$49/month
                  </button>
                </Link>
              </div>

              <p className="text-[11px] text-white/25 mt-3">
                6-month minimum commitment · Cancel anytime after that
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
            <Link href="/how-it-works">
              <button className="h-11 px-6 rounded-lg border border-white/15 text-white/70 hover:text-white hover:border-white/30 text-sm font-medium transition-colors inline-flex items-center gap-2">
                See all questions <ChevronRight className="h-4 w-4" aria-hidden="true" />
              </button>
            </Link>
          </div>
        </div>
      </section>

      {/* ─── Emergency CTA ─── */}
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
