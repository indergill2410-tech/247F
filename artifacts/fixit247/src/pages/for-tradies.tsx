import { usePageTitle } from "@/hooks/use-page-title";
import { useState } from "react";
import { Link } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { Footer } from "@/components/footer";
import {
  HardHat, Zap, BadgeCheck, MessageSquare, Clock,
  CheckCircle2, ChevronRight, ChevronDown, TrendingUp,
  DollarSign, Star, MapPin, XCircle, ShieldCheck, BarChart3,
  Quote, Users,
} from "lucide-react";

// ─── Data ────────────────────────────────────────────────────────────────────

const BENEFITS = [
  {
    icon: DollarSign,
    title: "See the lead cost before you commit",
    desc: "Every job shows the exact cost to claim — before you spend a cent. No surprises, no guessing.",
  },
  {
    icon: BadgeCheck,
    title: "A verified profile that builds trust",
    desc: "Add your licence, trade, and service area. Verified profiles stand out to homeowners and win more work without hard-selling yourself.",
  },
  {
    icon: MapPin,
    title: "Local jobs matched to your trade",
    desc: "See relevant jobs posted in your suburb and surrounding areas — filtered by trade type so you're not sifting through irrelevant listings.",
  },
  {
    icon: MessageSquare,
    title: "Direct messaging with homeowners",
    desc: "Communicate directly before committing. Understand the scope, ask questions, and build rapport — no middlemen, no call centres.",
  },
  {
    icon: Clock,
    title: "Real-time job notifications",
    desc: "Get notified the moment a matching job is posted in your service area. First movers win more work.",
  },
  {
    icon: Users,
    title: "You stay in full control",
    desc: "Accept only the jobs that fit your schedule and rates. Walk away from anything that doesn't suit you. No obligations, no penalties.",
  },
];

const HOW_IT_WORKS = [
  {
    step: "01",
    title: "Sign up free — done in minutes",
    desc: "Create your tradie account, add your trade, licence details, and service area. No credit card, no subscription, no fees to start.",
  },
  {
    step: "02",
    title: "Your $111 wallet is ready",
    desc: "Instantly receive $111 in wallet credit — real money toward real leads in your area. No strings attached.",
  },
  {
    step: "03",
    title: "Browse jobs, see the price first",
    desc: "View available jobs in your area with the lead cost shown upfront. You decide if it's worth claiming — nothing is charged automatically.",
  },
  {
    step: "04",
    title: "Win jobs, keep 100% of what you earn",
    desc: "Quote, win, complete. Fixit 24/7 takes zero commission. Your revenue is entirely yours.",
  },
];

const PROOF_QUOTES = [
  {
    quote: "I was paying $120+ per lead on other platforms and still losing jobs I had no idea about. Fixit 24/7 shows me the job cost before I commit. Game changer.",
    name: "Dan K.",
    trade: "Electrician · Sydney, NSW",
  },
  {
    quote: "No commission on jobs I win. No mystery pricing. I started with the $111 free wallet and landed 4 jobs in my first 2 weeks. Stoked.",
    name: "Marcus T.",
    trade: "Plumber · Brisbane, QLD",
  },
  {
    quote: "Other apps charge you whether you win the job or not. Here I only spend when I choose to claim — and I can see the cost upfront. Makes budgeting easy.",
    name: "Sarah L.",
    trade: "HVAC Technician · Melbourne, VIC",
  },
];

const FAQS = [
  {
    q: "How much does it cost to claim a job?",
    a: "Lead costs vary by job size and are always shown upfront before you commit — typically $22–$80 per lead. You only pay when you choose to claim.",
  },
  {
    q: "What is the $111 free wallet credit?",
    a: "Every new tradie receives $111 in wallet credit on signup — enough to claim several real jobs and test the platform without spending a cent of your own money.",
  },
  {
    q: "Is there a commission on jobs I win?",
    a: "No. Fixit 24/7 charges a fair, transparent lead fee — that's it. There is no commission, no revenue share, and no hidden fees on jobs you complete.",
  },
  {
    q: "How is this different from other lead platforms?",
    a: "Most platforms charge $80–$200+ per lead whether you win the job or not, and send the same lead to multiple tradies. On Fixit 24/7, you see the job cost before you commit and keep everything you earn.",
  },
  {
    q: "Can I choose which jobs I claim?",
    a: "Yes. You browse available jobs in your service area, see the lead cost upfront, and choose which ones to claim. You are in full control of your spending.",
  },
  {
    q: "Can I cancel my subscription anytime?",
    a: "Yes. Subscriptions are month-to-month with no lock-in. Cancel any time from your dashboard.",
  },
  {
    q: "What trades are on Fixit 24/7?",
    a: "Plumbing, electrical, locksmith, HVAC, roofing, carpentry, handyman, painting, pest control, and more — 12+ categories across Australia.",
  },
];

function FaqItem({ q, a, isOpen, onToggle }: { q: string; a: string; isOpen: boolean; onToggle: () => void }) {
  return (
    <div className="border border-white/8 rounded-2xl overflow-hidden bg-white/3 hover:bg-white/4 transition-colors">
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

export default function ForTradiesPage() {
  usePageTitle("For Tradies — Start with $111 Free | Fixit 24/7");
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  return (
    <div className="flex flex-col min-h-screen bg-[#0b0904] text-white">

      {/* ─── Hero ─── */}
      <section
        className="relative overflow-hidden"
        style={{ background: "var(--app-hero-gradient)" }}
      >
        <div
          className="absolute inset-0 opacity-[0.035] pointer-events-none"
          style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23ffffff' fill-opacity='1' fill-rule='evenodd'%3E%3Ccircle cx='1' cy='1' r='1'/%3E%3C/g%3E%3C/svg%3E")` }}
          aria-hidden="true"
        />

        <div className="container mx-auto px-4 sm:px-6 max-w-5xl py-20 lg:py-28 relative">
          <div className="flex flex-col lg:flex-row items-center gap-14">

            {/* Left copy */}
            <motion.div
              className="flex-1"
              initial={{ opacity: 0, x: -28 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.55 }}
            >
              <div className="inline-flex items-center gap-2 bg-white/6 border border-white/12 rounded-full px-4 py-1.5 text-sm text-white/75 font-medium mb-6">
                <HardHat className="h-3.5 w-3.5 text-primary" aria-hidden="true" />
                For Australian Tradies
              </div>

              <h1 className="text-5xl md:text-6xl lg:text-7xl font-black leading-[1.05] tracking-tight mb-6">
                Stop chasing leads.<br />
                <span className="text-primary">Start choosing jobs.</span>
              </h1>

              <p className="text-lg text-white/60 max-w-md leading-relaxed mb-8">
                Get <span className="text-white font-semibold">$111 free</span> when you join — real money toward real jobs in your area.
                Fairly priced leads, zero commission on jobs you win, and no fortune spent on dead-end ads.
              </p>

              <div className="flex flex-col sm:flex-row gap-3 mb-8">
                <Link href="/signup?role=tradie">
                  <button className="inline-flex items-center justify-center gap-2 h-13 px-7 rounded-xl font-black text-[16px] text-primary-foreground bg-primary hover:opacity-90 active:scale-[0.97] transition-all">
                    Claim your $111 — join free
                    <ChevronRight className="h-4 w-4" aria-hidden="true" />
                  </button>
                </Link>
              </div>

              <div className="flex flex-wrap gap-3">
                {[
                  "$111 free to start",
                  "No commission on wins",
                  "See job cost before you claim",
                  "Cancel anytime",
                ].map((t) => (
                  <span key={t} className="inline-flex items-center gap-1.5 text-xs font-medium text-white/50 bg-white/5 border border-white/8 rounded-full px-3 py-1.5">
                    <CheckCircle2 className="h-3 w-3 text-primary" aria-hidden="true" /> {t}
                  </span>
                ))}
              </div>
            </motion.div>

            {/* Right: $111 wallet callout card */}
            <motion.div
              className="w-full lg:w-[310px] shrink-0"
              initial={{ opacity: 0, x: 28 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.55, delay: 0.12 }}
            >
              <div className="relative rounded-3xl">
                <div className="absolute -inset-px rounded-3xl bg-gradient-to-b from-primary/30 to-transparent" aria-hidden="true" />
                <div className="relative bg-[#111008] rounded-3xl p-8 border border-primary/15">
                  <p className="text-primary text-xs font-bold uppercase tracking-widest mb-5 text-center">Your welcome credit</p>

                  <div className="text-center mb-6">
                    <div className="text-6xl font-black text-white leading-none mb-1">$111</div>
                    <p className="text-white/40 text-sm">free wallet credit on signup</p>
                  </div>

                  <div className="space-y-3 mb-7">
                    {[
                      "Loaded instantly on signup",
                      "Use to claim local job leads",
                      "See cost before you commit",
                      "Zero commission on jobs won",
                    ].map((perk) => (
                      <div key={perk} className="flex items-center gap-2.5 text-[13px] text-white/65">
                        <CheckCircle2 className="h-4 w-4 text-primary shrink-0" aria-hidden="true" />
                        {perk}
                      </div>
                    ))}
                  </div>

                  <Link href="/signup?role=tradie">
                    <button className="w-full h-11 rounded-xl font-bold text-[14px] text-primary-foreground bg-primary hover:opacity-90 active:scale-[0.97] transition-all inline-flex items-center justify-center gap-1.5">
                      Claim $111 free
                      <ChevronRight className="h-4 w-4" aria-hidden="true" />
                    </button>
                  </Link>

                  <p className="text-center text-[11px] text-white/25 mt-3">
                    100% free to join — no commitment
                  </p>
                </div>
              </div>
            </motion.div>

          </div>
        </div>
      </section>

      {/* ─── Competitor comparison band ─── */}
      <section className="py-10 bg-[#110d06] border-y border-white/8">
        <div className="container max-w-4xl mx-auto px-4 sm:px-6">
          <p className="text-center text-xs font-bold uppercase tracking-widest text-white/30 mb-8">How we're different</p>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="bg-red-500/5 border border-red-500/15 rounded-2xl p-6">
              <p className="text-xs font-bold uppercase tracking-widest text-red-400/70 mb-4">Other lead platforms</p>
              <ul className="flex flex-col gap-3">
                {[
                  "Charge $80–$200+ per lead — win or lose",
                  "Same lead sent to multiple tradies",
                  "Take commission on every job you complete",
                  "Hidden fees you discover after the fact",
                ].map((t) => (
                  <li key={t} className="flex items-start gap-2.5 text-sm text-white/50">
                    <XCircle className="h-4 w-4 text-red-400/60 shrink-0 mt-0.5" aria-hidden="true" /> {t}
                  </li>
                ))}
              </ul>
            </div>
            <div className="bg-primary/5 border border-primary/20 rounded-2xl p-6">
              <p className="text-xs font-bold uppercase tracking-widest text-primary mb-4">Fixit 24/7</p>
              <ul className="flex flex-col gap-3">
                {[
                  "Fairly priced leads — typically $22–$80",
                  "See the exact cost before you claim",
                  "Zero commission on jobs you win — ever",
                  "No lock-in. Cancel anytime.",
                ].map((t) => (
                  <li key={t} className="flex items-start gap-2.5 text-sm text-white/75">
                    <CheckCircle2 className="h-4 w-4 text-primary shrink-0 mt-0.5" aria-hidden="true" /> {t}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* ─── What you get ─── */}
      <section className="py-20 bg-[#0b0904]">
        <div className="container mx-auto px-4 sm:px-6 max-w-5xl">
          <div className="text-center mb-14">
            <span className="text-primary text-sm font-bold uppercase tracking-widest">What you get</span>
            <h2 className="text-3xl sm:text-4xl font-black mt-3">Everything a tradie business needs</h2>
            <p className="text-white/45 mt-3 text-[15px] max-w-md mx-auto">
              Free to join. Real local jobs. A platform built around the way tradies actually work.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {BENEFITS.map((b, i) => (
              <motion.div
                key={b.title}
                initial={{ opacity: 0, y: 18 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.07, duration: 0.35 }}
                className="bg-white/4 border border-white/8 rounded-2xl p-6 hover:bg-white/6 hover:border-primary/20 transition-all"
              >
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/15 flex items-center justify-center shrink-0">
                    <b.icon className="h-5 w-5 text-primary" aria-hidden="true" />
                  </div>
                  <h3 className="font-bold text-[15px]">{b.title}</h3>
                </div>
                <p className="text-white/50 text-sm leading-relaxed">{b.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── How it works ─── */}
      <section className="py-20 bg-[#0d0a05]">
        <div className="container mx-auto px-4 sm:px-6 max-w-4xl">
          <div className="text-center mb-14">
            <span className="text-primary text-sm font-bold uppercase tracking-widest">Getting started</span>
            <h2 className="text-3xl sm:text-4xl font-black mt-3">How it works for tradies</h2>
            <p className="text-white/45 mt-3 text-[15px]">Up and running in minutes. No paperwork, no waiting.</p>
          </div>

          <div className="flex flex-col gap-4 mb-12">
            {HOW_IT_WORKS.map((s, i) => (
              <motion.div
                key={s.step}
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08, duration: 0.38 }}
                className="flex items-start gap-5 bg-white/4 border border-white/8 rounded-2xl px-6 py-5 hover:bg-white/6 transition-colors"
              >
                <span className="text-3xl font-black text-primary/30 shrink-0 leading-none mt-1 w-8">{s.step}</span>
                <div>
                  <h3 className="font-bold text-[15px] mb-1">{s.title}</h3>
                  <p className="text-white/50 text-sm leading-relaxed">{s.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>

          <div className="bg-primary/8 border border-primary/20 rounded-2xl px-6 py-5 text-center">
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
            <span className="text-primary text-xs font-bold uppercase tracking-widest">Plans for active tradies</span>
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
              <Link href="/signup?role=tradie">
                <button className="w-full h-10 rounded-xl border border-white/20 hover:bg-white/8 text-white font-semibold text-sm transition-all">
                  Get started free
                </button>
              </Link>
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
              <Link href="/signup?role=tradie">
                <button className="w-full h-10 rounded-xl border border-white/20 hover:bg-white/8 text-white font-semibold text-sm transition-all">
                  Start with Starter
                </button>
              </Link>
            </motion.div>

            {/* Pro — highlighted */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.16 }}
              viewport={{ once: true }}
              className="bg-primary/8 border-2 border-primary/40 rounded-2xl p-6 flex flex-col relative"
            >
              <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                <span className="inline-flex items-center gap-1 bg-primary text-primary-foreground text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full">
                  <Star className="h-2.5 w-2.5" aria-hidden="true" /> Most popular
                </span>
              </div>
              <p className="text-xs font-bold uppercase tracking-widest text-primary mb-2">Pro</p>
              <div className="mb-1">
                <span className="text-3xl font-black text-white">$99</span>
                <span className="text-white/40 text-sm">/mo</span>
              </div>
              <p className="text-primary/60 text-xs mb-5">Best value for busy tradies</p>
              <ul className="flex flex-col gap-2.5 mb-6 flex-1">
                {[
                  "Higher monthly wallet top-up",
                  "Boosted profile ranking",
                  "Early access to new jobs",
                  "Dedicated tradie support",
                  "Priority match notifications",
                ].map((f) => (
                  <li key={f} className="flex items-center gap-2 text-sm text-white/80">
                    <CheckCircle2 className="h-3.5 w-3.5 text-primary shrink-0" aria-hidden="true" /> {f}
                  </li>
                ))}
              </ul>
              <Link href="/signup?role=tradie">
                <button className="w-full h-10 rounded-xl bg-primary hover:opacity-90 text-primary-foreground font-bold text-sm transition-all active:scale-[0.97]">
                  Start with Pro
                </button>
              </Link>
            </motion.div>
          </div>

          <p className="text-center text-white/25 text-xs mt-6">
            All plans: zero commission on jobs you win. Cancel anytime.
          </p>
        </div>
      </section>

      {/* ─── What tradies say ─── */}
      <section className="py-20 bg-[#0d0a05]">
        <div className="container mx-auto px-4 sm:px-6 max-w-5xl">
          <div className="text-center mb-14">
            <span className="text-primary text-sm font-bold uppercase tracking-widest">Tradie stories</span>
            <h2 className="text-3xl sm:text-4xl font-black mt-3">What tradies say</h2>
          </div>

          <div className="grid sm:grid-cols-3 gap-6">
            {PROOF_QUOTES.map((q, i) => (
              <motion.div
                key={q.name}
                initial={{ opacity: 0, y: 18 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1, duration: 0.38 }}
                className="bg-white/4 border border-white/8 rounded-2xl p-6 flex flex-col gap-4"
              >
                <Quote className="h-5 w-5 text-primary/40" aria-hidden="true" />
                <p className="text-white/65 text-sm leading-relaxed flex-1">"{q.quote}"</p>
                <div className="flex gap-0.5 mb-1">
                  {[...Array(5)].map((_, s) => (
                    <Star key={s} className="h-3.5 w-3.5 fill-primary text-primary" aria-hidden="true" />
                  ))}
                </div>
                <div>
                  <p className="font-semibold text-white text-sm">{q.name}</p>
                  <p className="text-white/35 text-xs mt-0.5">{q.trade}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Partner With Us teaser ─── */}
      <section className="py-14 bg-[#0b0904] border-y border-white/5">
        <div className="container max-w-3xl mx-auto px-4 sm:px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45 }}
            viewport={{ once: true }}
            className="bg-white/4 border border-white/10 rounded-2xl p-8 sm:p-10 text-center"
          >
            <div className="inline-flex items-center gap-2 bg-primary/10 border border-primary/20 rounded-full px-4 py-1.5 text-xs font-bold text-primary uppercase tracking-widest mb-5">
              <TrendingUp className="h-3.5 w-3.5" aria-hidden="true" /> For ambitious tradies
            </div>
            <h2 className="text-2xl sm:text-3xl font-black mb-3">
              Want to grow beyond just picking up jobs?
            </h2>
            <p className="text-white/55 text-[15px] leading-relaxed max-w-xl mx-auto mb-6">
              Our Partner With Us programme is for trade business owners who want better systems, stronger local visibility, and a growth strategy — not just more leads.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link href="/partner">
                <button className="h-11 px-7 rounded-xl bg-primary hover:opacity-90 text-primary-foreground font-bold text-[14px] transition-all active:scale-[0.97] inline-flex items-center justify-center gap-2">
                  Learn about partnering <ChevronRight className="h-4 w-4" aria-hidden="true" />
                </button>
              </Link>
              <Link href="/signup?role=tradie">
                <button className="h-11 px-7 rounded-xl border border-white/20 hover:bg-white/8 text-white font-semibold text-[14px] transition-all">
                  Just get started for free
                </button>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ─── FAQ ─── */}
      <section className="py-20 bg-[#0d0a05]">
        <div className="container mx-auto px-4 sm:px-6 max-w-3xl">
          <div className="text-center mb-12">
            <span className="text-primary text-sm font-bold uppercase tracking-widest">Common questions</span>
            <h2 className="text-3xl sm:text-4xl font-black mt-3">Questions from tradies</h2>
            <p className="text-white/45 mt-3 text-[15px]">Everything you need to know before getting started.</p>
          </div>

          <div className="flex flex-col gap-2 mb-12">
            {FAQS.map((faq, i) => (
              <FaqItem
                key={faq.q}
                q={faq.q}
                a={faq.a}
                isOpen={openFaq === i}
                onToggle={() => setOpenFaq(openFaq === i ? null : i)}
              />
            ))}
          </div>

          {/* Final CTA */}
          <div className="text-center">
            <Link href="/signup?role=tradie">
              <button className="inline-flex items-center gap-2 h-14 px-8 rounded-xl font-black text-[17px] text-primary-foreground bg-primary hover:opacity-90 active:scale-[0.97] transition-all mb-4">
                Claim $111 free — join now
                <ChevronRight className="h-5 w-5" aria-hidden="true" />
              </button>
            </Link>
            <p className="text-white/35 text-sm">
              Already have an account?{" "}
              <Link href="/login">
                <span className="text-primary/60 hover:text-primary transition-colors cursor-pointer underline underline-offset-2">
                  Sign in
                </span>
              </Link>
            </p>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
