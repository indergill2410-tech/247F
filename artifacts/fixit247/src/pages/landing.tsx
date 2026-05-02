import { useState } from "react";
import { Link, useLocation } from "wouter";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useListCategories } from "@workspace/api-client-react";
import { Footer } from "@/components/footer";
import {
  Wrench, Zap, Droplets, Home, TreePine, Wind, Hammer,
  PaintbrushIcon, ShieldCheck, Star, MapPin, ChevronRight,
  CheckCircle2, Clock, Users, BadgeCheck, MessageSquare,
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
  "Free to join — sign up in minutes",
  "Pick the jobs that suit you",
  "Direct messaging with homeowners",
  "Verified profiles build trust",
];

const STATS = [
  { value: "12,400+", label: "Jobs completed" },
  { value: "850+", label: "Verified tradies" },
  { value: "< 2 hrs", label: "Avg response time" },
  { value: "4.8 ★", label: "Customer rating" },
];

const HOW_IT_WORKS = [
  {
    icon: Wrench,
    step: "01",
    title: "Post your job",
    desc: "Describe what needs fixing, set your urgency, and upload photos. Takes under 2 minutes.",
  },
  {
    icon: Users,
    step: "02",
    title: "Get matched",
    desc: "Our engine finds the top 5 local tradies with the right skills, availability, and ratings.",
  },
  {
    icon: BadgeCheck,
    step: "03",
    title: "Hire & done",
    desc: "Review offers, accept the best one, track progress, and pay securely when it's done.",
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

export default function LandingPage() {
  const [suburb, setSuburb] = useState("");
  const [, setLocation] = useLocation();
  const { data: categories } = useListCategories();

  const handleFindTradies = () => {
    setLocation(`/register?role=homeowner&suburb=${encodeURIComponent(suburb)}`);
  };

  return (
    <div className="flex flex-col min-h-screen bg-[#0b0904]">
      {/* ─── Hero ─── */}
      <section
        className="relative overflow-hidden text-white"
        style={{
          background:
            "radial-gradient(ellipse at 25% 55%, #251d08 0%, #120f06 45%, #070604 100%)",
          minHeight: "calc(100vh - 64px)",
        }}
      >
        {/* subtle texture */}
        <div
          className="absolute inset-0 opacity-[0.04] pointer-events-none"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23ffffff' fill-opacity='1' fill-rule='evenodd'%3E%3Ccircle cx='1' cy='1' r='1'/%3E%3C/g%3E%3C/svg%3E")`,
          }}
        />

        <div className="container relative flex flex-col lg:flex-row items-center gap-12 py-20 lg:py-28">
          {/* Left */}
          <motion.div
            className="flex-1 flex flex-col gap-7"
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
          >
            {/* Live badge */}
            <div className="inline-flex items-center gap-2 self-start bg-white/5 border border-white/10 rounded-full px-4 py-1.5 text-sm text-white/80 backdrop-blur-sm">
              <span className="w-2 h-2 rounded-full bg-[#f5c518] animate-pulse" />
              Urgent Fix 24/7 — tradies online now
            </div>

            {/* Headline */}
            <div>
              <h1 className="text-5xl md:text-6xl lg:text-7xl font-black leading-[1.05] tracking-tight">
                Emergency<br />repairs,<br />
                <span className="text-[#f5c518]">fixed fast.</span>
              </h1>
            </div>

            {/* Subtext */}
            <p className="text-lg text-white/60 max-w-md leading-relaxed">
              Plumbing, electrical, locksmith and more — get matched with verified local tradies, day or night, anywhere in Australia.
            </p>

            {/* Suburb search */}
            <div className="flex flex-col sm:flex-row gap-2 max-w-md">
              <div className="flex-1 relative">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/40" />
                <input
                  type="text"
                  value={suburb}
                  onChange={(e) => setSuburb(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleFindTradies()}
                  placeholder="Your suburb   e.g. Bondi, 2026"
                  className="w-full bg-white/8 border border-white/12 rounded-lg pl-10 pr-4 h-11 text-sm text-white placeholder:text-white/35 focus:outline-none focus:border-[#f5c518]/60 focus:bg-white/12 transition-all"
                  style={{ background: "rgba(255,255,255,0.07)" }}
                />
              </div>
              <button
                onClick={handleFindTradies}
                className="h-11 px-5 rounded-lg font-semibold text-sm text-black bg-[#f5c518] hover:bg-[#e6b800] transition-colors shrink-0"
              >
                Find tradies
              </button>
            </div>

            {/* CTA buttons */}
            <div className="flex flex-col sm:flex-row gap-3 max-w-md">
              <Link href="/signup?role=homeowner">
                <button className="w-full sm:w-auto inline-flex items-center justify-center gap-2 h-12 px-6 rounded-lg font-semibold text-[15px] text-black bg-[#f5c518] hover:bg-[#e6b800] transition-colors">
                  Create account &amp; post a job
                  <ChevronRight className="h-4 w-4" />
                </button>
              </Link>
              <Link href="/signup?role=tradie">
                <button className="w-full sm:w-auto inline-flex items-center justify-center h-12 px-6 rounded-lg font-semibold text-[15px] text-white border border-white/20 hover:bg-white/8 transition-colors">
                  Tradies — join FREE
                </button>
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
                <div className="flex items-start justify-between mb-1">
                  <h3 className="text-[22px] font-bold text-gray-900 leading-tight">
                    Tradies join free
                  </h3>
                  <span className="bg-[#f5c518]/15 text-[#b8920a] border border-[#f5c518]/30 text-xs font-bold px-2.5 py-1 rounded-md shrink-0 ml-3">
                    100% FREE
                  </span>
                </div>
                <p className="text-sm text-gray-500 mb-6">
                  Real Aussie jobs in your suburb. No credit card needed.
                </p>

                <ul className="flex flex-col gap-3 mb-7">
                  {TRADIE_PERKS.map((perk) => (
                    <li key={perk} className="flex items-center gap-3 text-[15px] text-gray-700">
                      <CheckCircle2 className="h-5 w-5 text-emerald-500 shrink-0" />
                      {perk}
                    </li>
                  ))}
                </ul>

                <Link href="/signup?role=tradie">
                  <button className="w-full h-12 rounded-xl font-bold text-[15px] text-white bg-[#1a1a1a] hover:bg-[#2d2d2d] transition-colors inline-flex items-center justify-center gap-2">
                    Sign up free
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </Link>

                <p className="text-center text-xs text-gray-400 mt-4">
                  Homeowner and tradie accounts are separate for a tailored experience.
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ─── Stats bar ─── */}
      <section className="bg-[#f5c518] py-6">
        <div className="container grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
          {STATS.map((s) => (
            <div key={s.label}>
              <p className="text-2xl md:text-3xl font-black text-black">{s.value}</p>
              <p className="text-black/60 text-sm mt-0.5 font-medium">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ─── How it works ─── */}
      <section id="how-it-works" className="py-24 bg-[#0b0904] text-white">
        <div className="container">
          <div className="text-center mb-14">
            <span className="text-[#f5c518] text-sm font-bold uppercase tracking-widest">Simple process</span>
            <h2 className="text-4xl font-black mt-3">How it works</h2>
            <p className="text-white/50 mt-3 max-w-md mx-auto">
              Three steps to get your home fixed by a verified local tradie.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {HOW_IT_WORKS.map((item, i) => (
              <motion.div
                key={item.step}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.12 }}
                viewport={{ once: true }}
                className="relative bg-white/5 border border-white/8 rounded-2xl p-8 hover:bg-white/8 transition-colors"
              >
                <span className="absolute top-6 right-6 text-5xl font-black text-white/5 select-none">
                  {item.step}
                </span>
                <div className="w-12 h-12 rounded-xl bg-[#f5c518]/15 border border-[#f5c518]/20 flex items-center justify-center mb-5">
                  <item.icon className="h-6 w-6 text-[#f5c518]" />
                </div>
                <h3 className="text-xl font-bold mb-2">{item.title}</h3>
                <p className="text-white/50 leading-relaxed">{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Categories ─── */}
      <section id="categories" className="py-24 bg-[#0e0c08] text-white">
        <div className="container">
          <div className="text-center mb-14">
            <span className="text-[#f5c518] text-sm font-bold uppercase tracking-widest">Services</span>
            <h2 className="text-4xl font-black mt-3">What do you need fixed?</h2>
            <p className="text-white/50 mt-3">Choose from 12+ trade categories</p>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {(categories ?? CATEGORIES_DISPLAY).map((cat) => {
              const Icon = "id" in cat ? (ICON_MAP[(cat as { icon: string }).icon ?? ""] ?? Wrench) : (cat as typeof CATEGORIES_DISPLAY[0]).icon;
              const label = "name" in cat ? cat.name : (cat as typeof CATEGORIES_DISPLAY[0]).label;
              return (
                <Link href="/signup?role=homeowner" key={label}>
                  <div className="group bg-white/5 border border-white/8 rounded-2xl p-6 flex flex-col items-center gap-3 hover:bg-white/10 hover:border-[#f5c518]/30 cursor-pointer transition-all">
                    <div className="w-14 h-14 rounded-xl bg-[#f5c518]/10 border border-[#f5c518]/15 flex items-center justify-center group-hover:bg-[#f5c518]/20 transition-colors">
                      <Icon className="h-7 w-7 text-[#f5c518]" />
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

      {/* ─── Emergency CTA ─── */}
      <section className="py-24 bg-[#f5c518]">
        <div className="container text-center max-w-2xl">
          <Clock className="h-14 w-14 text-black/30 mx-auto mb-6" />
          <h2 className="text-4xl font-black text-black">Emergency repair?<br />We're ready now.</h2>
          <p className="text-black/60 mt-5 text-lg">
            Burst pipe at 2am? Power outage on a Sunday? Our tradies are on call 24 hours a day, 7 days a week.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center mt-10">
            <Link href="/signup?role=homeowner">
              <button className="h-12 px-8 rounded-lg bg-black text-white font-bold text-[15px] hover:bg-[#1a1a1a] transition-colors">
                Post emergency job
              </button>
            </Link>
            <Link href="/login">
              <button className="h-12 px-8 rounded-lg border-2 border-black text-black font-bold text-[15px] hover:bg-black/10 transition-colors">
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
