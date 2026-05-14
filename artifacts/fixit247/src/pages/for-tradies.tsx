import { usePageTitle } from "@/hooks/use-page-title";
import { useState } from "react";
import { Link } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { Footer } from "@/components/footer";
import {
  HardHat, Zap, BadgeCheck, MessageSquare, Wrench, Clock,
  CheckCircle2, ChevronRight, ChevronDown, TrendingUp,
  DollarSign, Calendar, Star, Users, MapPin, ThumbsUp,
} from "lucide-react";

const WHY_JOIN = [
  {
    icon: DollarSign,
    title: "Stop relying only on ads and referrals",
    body: "Expensive lead-gen agencies and inconsistent word-of-mouth aren't a growth strategy. Fixit 24/7 puts you in front of homeowners who are actively looking for help right now.",
  },
  {
    icon: Calendar,
    title: "Fill the gaps in your calendar",
    body: "Slow weeks happen. Your monthly $111 AUD wallet credit gives you a steady way to pick up extra work without committing to anything or paying upfront for leads you might not win.",
  },
  {
    icon: TrendingUp,
    title: "Grow your business revenue on your terms",
    body: "You choose which jobs to accept, when to work, and how much to take on. There's no lock-in, no pressure, and no wasted spend — just more opportunities in your area.",
  },
];

const BENEFITS = [
  {
    icon: Zap,
    title: "$111 free wallet credit every month",
    desc: "Your $111 AUD wallet credit renews automatically each month so you always have something to work with. Use it to unlock and claim jobs that suit your trade and location.",
  },
  {
    icon: BadgeCheck,
    title: "A verified profile that builds trust",
    desc: "Add your licence, trade, and service area. Verified profiles stand out to homeowners and help you win more work without having to hard-sell yourself.",
  },
  {
    icon: MapPin,
    title: "Local jobs matched to your skills",
    desc: "See relevant jobs posted in your suburb and surrounding areas — filtered by trade type so you're not sifting through irrelevant listings.",
  },
  {
    icon: MessageSquare,
    title: "Direct messaging with homeowners",
    desc: "Communicate directly before committing. Understand the scope, ask questions, and build rapport — no middlemen, no call centres.",
  },
  {
    icon: Users,
    title: "You stay in full control",
    desc: "Accept only the jobs that fit your schedule and rates. Walk away from anything that doesn't suit you. No obligations, no penalties.",
  },
  {
    icon: Star,
    title: "Ratings that compound over time",
    desc: "Every completed job adds to your public rating. A strong track record on Fixit 24/7 becomes a long-term asset that keeps winning you work.",
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
    title: "Build your verified profile",
    desc: "Upload your licences, write a short bio, and set your service area. Verified profiles get more visibility and homeowner trust from day one.",
  },
  {
    step: "03",
    title: "Receive $111 wallet credit every month",
    desc: "Your $111 AUD wallet credit lands automatically each month. Use it to unlock and claim jobs posted by homeowners actively looking for someone like you.",
  },
  {
    step: "04",
    title: "Choose work that suits you",
    desc: "Browse available jobs, review the scope and location, and accept only what fits your schedule and skills. You're always in control.",
  },
];

const PROOF_QUOTES = [
  {
    quote: "I was sceptical at first, but within the first week I'd picked up two local jobs I wouldn't have found otherwise. The free $111 wallet credit makes it easy to try without any risk.",
    name: "James T.",
    trade: "Plumber · Sydney",
  },
  {
    quote: "Slow January? I used my monthly wallet credit and stayed busy. It's not magic, but it's a genuinely useful way to keep the pipeline moving when referrals dry up.",
    name: "Sarah M.",
    trade: "Electrician · Melbourne",
  },
  {
    quote: "The verified profile has been worth it on its own. Homeowners message me directly and they already trust me before we've even spoken.",
    name: "Dave K.",
    trade: "Locksmith · Brisbane",
  },
];

const FAQS = [
  {
    q: "Is it really free to join?",
    a: "Yes — 100% free to join and build a profile. No credit card, no monthly subscription, no upfront costs. You get $111 AUD wallet credit every month at no charge to use on jobs.",
  },
  {
    q: "How does the wallet credit work?",
    a: "Your wallet holds real dollar value in AUD. When you see a job you want, you spend from your wallet to unlock it and make contact with the homeowner. Each month you automatically receive a fresh $111 AUD — so you always have funds to work with.",
  },
  {
    q: "What happens if I run out of wallet funds?",
    a: "You can top up your wallet any time with a credit pack, or simply wait for your next monthly $111 renewal. There's no pressure — you decide how much you want to invest in growing your pipeline.",
  },
  {
    q: "Do I have to accept jobs I don't want?",
    a: "Never. You browse available jobs and choose only what suits your schedule, location, and trade. There are no penalties for passing on jobs.",
  },
  {
    q: "What trades are on Fixit 24/7?",
    a: "Plumbing, electrical, locksmith, HVAC, roofing, carpentry, handyman, painting, and more — 12+ categories across Australia.",
  },
  {
    q: "How do homeowners find me?",
    a: "When a homeowner posts a job in your service area that matches your trade, you'll be notified. Your verified profile is also searchable by homeowners browsing tradies directly.",
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

export default function ForTradiesPage() {
  usePageTitle("Why Join Fixit 24/7 — More Jobs, More Revenue, Join Free");
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  return (
    <div className="flex flex-col min-h-screen bg-[#0b0904] text-white">

      {/* ─── Hero ─── */}
      <section
        className="relative overflow-hidden"
        style={{ background: "radial-gradient(ellipse at 70% 55%, #1a1508 0%, #0e0b05 50%, #070604 100%)" }}
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
                <HardHat className="h-3.5 w-3.5 text-[#ffc800]" aria-hidden="true" />
                For Tradies
              </div>

              <h1 className="text-5xl md:text-6xl lg:text-7xl font-black leading-[1.05] tracking-tight mb-6">
                More jobs.<br />More revenue.<br />
                <span className="text-[#ffc800]">Join free.</span>
              </h1>

              <p className="text-lg text-white/60 max-w-md leading-relaxed mb-8">
                Partner with Fixit 24/7 to scale your trade business with brand support, systems, and technology. Stop relying only on expensive ads — build a scalable customer pipeline today.
              </p>

              <div className="flex flex-col sm:flex-row gap-3 mb-8">
                <Link to="/register?role=tradie">
                  <button className="inline-flex items-center justify-center gap-2 h-12 px-7 rounded-xl font-black text-[15px] text-black bg-[#ffc800] hover:bg-[#e6b800] active:scale-[0.97] transition-all">
                    Become a Trade Partner
                    <ChevronRight className="h-4 w-4" aria-hidden="true" />
                  </button>
                </Link>
              </div>

              <div className="flex flex-wrap gap-3">
                {[
                  "$111 AUD wallet credit every month",
                  "Pick the jobs that suit you",
                  "Free to join — no credit card",
                  "Grow revenue without ad spend",
                ].map((t) => (
                  <span key={t} className="inline-flex items-center gap-1.5 text-xs font-medium text-white/50 bg-white/5 border border-white/8 rounded-full px-3 py-1.5">
                    <CheckCircle2 className="h-3 w-3 text-[#ffc800]" aria-hidden="true" /> {t}
                  </span>
                ))}
              </div>
            </motion.div>

            {/* Right: credits callout card */}
            <motion.div
              className="w-full lg:w-[310px] shrink-0"
              initial={{ opacity: 0, x: 28 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.55, delay: 0.12 }}
            >
              <div className="relative rounded-3xl">
                <div className="absolute -inset-px rounded-3xl bg-gradient-to-b from-[#ffc800]/30 to-transparent" aria-hidden="true" />
                <div className="relative bg-[#111008] rounded-3xl p-8 border border-[#ffc800]/15">
                  <p className="text-[#ffc800] text-xs font-bold uppercase tracking-widest mb-5 text-center">Monthly wallet credit</p>

                  <div className="text-center mb-6">
                    <div className="text-7xl font-black text-white leading-none mb-1">$111</div>
                    <p className="text-white/40 text-sm">AUD free — every month</p>
                  </div>

                  <div className="space-y-3 mb-7">
                    {[
                      "Renew automatically each month",
                      "Use to unlock and claim jobs",
                      "No credit card to start",
                      "Top up any time if you need more",
                    ].map((perk) => (
                      <div key={perk} className="flex items-center gap-2.5 text-[13px] text-white/65">
                        <CheckCircle2 className="h-4 w-4 text-[#ffc800] shrink-0" aria-hidden="true" />
                        {perk}
                      </div>
                    ))}
                  </div>

                  <Link to="/signup?role=tradie">
                    <button className="w-full h-11 rounded-xl font-bold text-[14px] text-black bg-[#ffc800] hover:bg-[#e6b800] active:scale-[0.97] transition-all inline-flex items-center justify-center gap-1.5">
                      Sign up free
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

      {/* ─── Why tradies choose Fixit 24/7 ─── */}
      <section className="py-20 bg-[#0d0a05]">
        <div className="container mx-auto px-4 sm:px-6 max-w-5xl">
          <div className="text-center mb-14">
            <span className="text-[#ffc800] text-sm font-bold uppercase tracking-widest">Why tradies join</span>
            <h2 className="text-3xl sm:text-4xl font-black mt-3 max-w-xl mx-auto leading-tight">
              A smarter source of work — without the ad spend
            </h2>
          </div>

          <div className="grid sm:grid-cols-3 gap-6 mb-14">
            {WHY_JOIN.map((item, i) => (
              <motion.div
                key={item.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1, duration: 0.4 }}
                className="bg-white/4 border border-white/8 rounded-2xl p-6 flex flex-col gap-4"
              >
                <div className="w-12 h-12 rounded-xl bg-[#ffc800]/10 border border-[#ffc800]/15 flex items-center justify-center">
                  <item.icon className="h-6 w-6 text-[#ffc800]" aria-hidden="true" />
                </div>
                <h3 className="font-bold text-[17px] leading-snug">{item.title}</h3>
                <p className="text-white/50 text-sm leading-relaxed">{item.body}</p>
              </motion.div>
            ))}
          </div>

          {/* Quote block */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="bg-gradient-to-br from-[#1a1408] to-[#0e0b05] border border-[#ffc800]/20 rounded-3xl p-8 md:p-10 text-center max-w-3xl mx-auto"
          >
            <p className="text-xl md:text-2xl font-bold text-white leading-relaxed mb-4">
              "More jobs. More revenue. Zero pressure to start."
            </p>
            <p className="text-white/40 text-sm">Fixit 24/7 — built for trade businesses, not generic users.</p>
          </motion.div>
        </div>
      </section>

      {/* ─── What you get ─── */}
      <section className="py-20 bg-[#0b0904]">
        <div className="container mx-auto px-4 sm:px-6 max-w-5xl">
          <div className="text-center mb-14">
            <span className="text-[#ffc800] text-sm font-bold uppercase tracking-widest">What you get</span>
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
                className="bg-white/4 border border-white/8 rounded-2xl p-6 hover:bg-white/6 hover:border-[#ffc800]/20 transition-all"
              >
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-xl bg-[#ffc800]/10 border border-[#ffc800]/15 flex items-center justify-center shrink-0">
                    <b.icon className="h-5 w-5 text-[#ffc800]" aria-hidden="true" />
                  </div>
                  <h3 className="font-bold text-[15px]">{b.title}</h3>
                </div>
                <p className="text-white/50 text-sm leading-relaxed">{b.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── What tradies say ─── */}
      <section className="py-20 bg-[#0d0a05]">
        <div className="container mx-auto px-4 sm:px-6 max-w-5xl">
          <div className="text-center mb-14">
            <span className="text-[#ffc800] text-sm font-bold uppercase tracking-widest">Tradie stories</span>
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
                <div className="flex gap-0.5">
                  {[...Array(5)].map((_, s) => (
                    <Star key={s} className="h-3.5 w-3.5 fill-[#ffc800] text-[#ffc800]" aria-hidden="true" />
                  ))}
                </div>
                <p className="text-white/65 text-sm leading-relaxed flex-1">"{q.quote}"</p>
                <div>
                  <p className="font-semibold text-white text-sm">{q.name}</p>
                  <p className="text-white/35 text-xs mt-0.5">{q.trade}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── How it works ─── */}
      <section className="py-20 bg-[#0b0904]">
        <div className="container mx-auto px-4 sm:px-6 max-w-4xl">
          <div className="text-center mb-14">
            <span className="text-[#ffc800] text-sm font-bold uppercase tracking-widest">Getting started</span>
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
                <span className="text-3xl font-black text-[#ffc800]/30 shrink-0 leading-none mt-1 w-8">{s.step}</span>
                <div>
                  <h3 className="font-bold text-[15px] mb-1">{s.title}</h3>
                  <p className="text-white/50 text-sm leading-relaxed">{s.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Mid CTA */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center bg-gradient-to-b from-[#1a1408] to-[#0e0b05] border border-[#ffc800]/20 rounded-3xl p-8"
          >
            <div className="inline-flex items-center gap-2 bg-[#ffc800]/10 border border-[#ffc800]/20 rounded-full px-4 py-1.5 text-sm text-[#ffc800] font-semibold mb-5">
              <Zap className="h-3.5 w-3.5" aria-hidden="true" />
              $111 AUD wallet credit renewed every month
            </div>
            <h3 className="text-2xl md:text-3xl font-black mb-4">Start picking up jobs today</h3>
            <p className="text-white/50 text-[15px] mb-7 max-w-md mx-auto leading-relaxed">
              Join free and use your monthly wallet credit to get in front of homeowners already looking for a tradie in your area.
            </p>
            <Link to="/signup?role=tradie">
              <button className="inline-flex items-center gap-2 h-13 px-8 rounded-xl font-black text-[16px] text-black bg-[#ffc800] hover:bg-[#e6b800] active:scale-[0.97] transition-all">
                Join free and start picking up jobs
                <ChevronRight className="h-4 w-4" aria-hidden="true" />
              </button>
            </Link>
            <p className="text-white/30 text-xs mt-4">100% free to join · no credit card · no lock-in</p>
          </motion.div>
        </div>
      </section>

      {/* ─── FAQ ─── */}
      <section className="py-20 bg-[#0d0a05]">
        <div className="container mx-auto px-4 sm:px-6 max-w-3xl">
          <div className="text-center mb-12">
            <span className="text-[#ffc800] text-sm font-bold uppercase tracking-widest">Common questions</span>
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
            <Link to="/signup?role=tradie">
              <button className="inline-flex items-center gap-2 h-14 px-8 rounded-xl font-black text-[17px] text-black bg-[#ffc800] hover:bg-[#e6b800] active:scale-[0.97] transition-all mb-4">
                Join free and start picking up jobs
                <ChevronRight className="h-5 w-5" aria-hidden="true" />
              </button>
            </Link>
            <p className="text-white/35 text-sm">
              Already have an account?{" "}
              <Link to="/login">
                <span className="text-[#ffc800]/60 hover:text-[#ffc800] transition-colors cursor-pointer underline underline-offset-2">
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
