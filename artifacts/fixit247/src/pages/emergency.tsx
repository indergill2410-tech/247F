import { usePageTitle } from "@/hooks/use-page-title";
import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { motion, AnimatePresence } from "framer-motion";
import { useCreateEmergencyCheckout } from "@workspace/api-client-react";
import { Footer } from "@/components/footer";
import {
  Shield, Home, Car, Zap, Droplets, Lock, Flame, Wind,
  CheckCircle2, ChevronRight, ChevronDown, Clock, Heart,
  AlertTriangle, ArrowRight,
} from "lucide-react";

const PAIN_POINTS = [
  {
    icon: AlertTriangle,
    title: "The panic hits fast",
    body: "Water pouring through a ceiling. No power. Locked out at midnight. The worst moments always seem to happen at the worst times.",
  },
  {
    icon: Heart,
    title: "The real cost isn't just money",
    body: "It's the disruption, the stress, the scramble to find someone reliable at 11pm. It's your family unsettled and your routine broken.",
  },
  {
    icon: Shield,
    title: "You just want a plan in place",
    body: "Not paperwork. Not a policy number. Just a number to call and someone to trust that help is already organised.",
  },
];

const WHAT_INCLUDED = [
  {
    icon: Droplets,
    title: "Plumbing emergencies",
    items: [
      "Burst pipes or serious leaks causing internal damage",
      "Blocked toilet or drain with overflow, no usable toilet",
      "Fixtures that won't stop running and can't be isolated",
    ],
  },
  {
    icon: Zap,
    title: "Electrical emergencies",
    items: [
      "Loss of power not caused by a wider network outage",
      "Sparking outlets, burning smells, or exposed live wiring",
      "Tripping switchboard with safety risk",
    ],
  },
  {
    icon: Lock,
    title: "Locksmith & security",
    items: [
      "Locked out of your home and unable to gain entry",
      "Broken or jammed external door lock",
      "Broken external door or window leaving home insecure",
    ],
  },
  {
    icon: Flame,
    title: "Gas & hot water",
    items: [
      "Suspected gas leak inside or around the home",
      "Complete failure of your main hot water system",
    ],
  },
  {
    icon: Wind,
    title: "Roof & storm damage",
    items: [
      "Sudden damage causing water to enter the home (make-safe / temporary tarp)",
    ],
  },
  {
    icon: Car,
    title: "Car breakdown assistance",
    items: [
      "Roadside assistance support when your vehicle breaks down",
      "Included in the same membership — no separate policy",
    ],
  },
];

const HOW_IT_WORKS_STEPS = [
  { step: "01", title: "Join for $49/month", desc: "Sign up online in minutes. No long forms, no waiting period after your first 72 hours." },
  { step: "02", title: "Get instant membership access", desc: "Your membership is live. You're covered for eligible home emergencies and car breakdown support." },
  { step: "03", title: "Request help when you need it", desc: "Open the app, describe what's happened, and submit your emergency request — any time, day or night." },
  { step: "04", title: "We organise support fast", desc: "We match you with a verified local tradie or breakdown support and get them moving as fast as possible." },
  { step: "05", title: "Extra work is always quoted first", desc: "If anything falls outside the included scope, you'll see a clear quote before anything extra is approved or charged." },
];

const FAQS = [
  {
    q: "What exactly is covered?",
    a: "The membership covers urgent home emergencies that affect safety, security or essential services — plumbing, electrical, locksmith, gas, hot water, roof make-safe, and car breakdown assistance. See the 'What's included' section above for the full list.",
  },
  {
    q: "What isn't covered?",
    a: "Non-urgent or cosmetic work (dripping taps, painting, minor cracks), full system upgrades or major renovations, pre-existing or long-standing problems, and area-wide utility outages. Larger non-covered jobs can still be quoted through the Fixit 24/7 app as normal paid work.",
  },
  {
    q: "Is there a waiting period?",
    a: "A 72-hour waiting period applies from the moment you first activate your membership. After that, you can request emergency support at any time.",
  },
  {
    q: "Can I cancel?",
    a: "You can cancel your monthly membership at any time. Your membership stays active until the end of the current billing period.",
  },
  {
    q: "What about fair use?",
    a: "The membership is designed for genuine, sudden emergencies. Repeated claims for known ongoing issues, pre-existing problems, or events that are not true emergencies may be assessed under fair use policy. Detailed terms and exclusions are available on request.",
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

export default function EmergencyPage() {
  usePageTitle("Fixit 24/7 Emergency — Peace of Mind for $49/month");
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const checkoutMutation = useCreateEmergencyCheckout({
    mutation: {
      onSuccess: (data) => {
        if (data.url) window.location.href = data.url;
      },
    },
  });

  function handleJoin() {
    if (!user) { setLocation("/login"); return; }
    if (user.role !== "homeowner") { setLocation("/register?role=homeowner"); return; }
    checkoutMutation.mutate();
  }

  return (
    <div className="flex flex-col min-h-screen bg-[#0b0904] text-white">

      {/* ─── Hero ─── */}
      <section
        className="relative overflow-hidden"
        style={{ background: "radial-gradient(ellipse at 30% 60%, #1e1608 0%, #0e0b05 50%, #070604 100%)" }}
      >
        <div
          className="absolute inset-0 opacity-[0.035] pointer-events-none"
          style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23ffffff' fill-opacity='1' fill-rule='evenodd'%3E%3Ccircle cx='1' cy='1' r='1'/%3E%3C/g%3E%3C/svg%3E")` }}
          aria-hidden="true"
        />

        <div className="container mx-auto px-4 sm:px-6 max-w-4xl py-20 lg:py-28 text-center relative">
          <motion.div
            initial={{ opacity: 0, y: 28 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55 }}
            className="flex flex-col items-center gap-7"
          >
            <div className="inline-flex items-center gap-2 bg-[#ffc800]/10 border border-[#ffc800]/20 rounded-full px-4 py-1.5 text-sm text-[#ffc800] font-semibold">
              <Shield className="h-3.5 w-3.5" aria-hidden="true" />
              Homeowner Membership
            </div>

            <h1 className="text-5xl md:text-6xl lg:text-7xl font-black leading-[1.05] tracking-tight">
              Fixit 24/7<br />
              <span className="text-[#ffc800]">Emergency</span>
            </h1>

            <p className="text-xl text-white/60 max-w-2xl leading-relaxed">
              One membership for emergencies, whether in or out of home — giving you peace of mind and security. For <span className="text-white font-bold">$49/month</span>, get help fast when things go wrong: burst pipes, lockouts, power failures, car breakdowns and more.
            </p>

            <div className="flex flex-col sm:flex-row gap-3 items-center">
              <button
                onClick={handleJoin}
                disabled={checkoutMutation.isPending}
                className="inline-flex items-center gap-2 h-14 px-8 rounded-xl font-black text-[17px] text-black bg-[#ffc800] hover:bg-[#e6b800] active:scale-[0.97] transition-all disabled:opacity-60"
              >
                {checkoutMutation.isPending ? "Loading…" : "Get protected for $49/month"}
                {!checkoutMutation.isPending && <ChevronRight className="h-5 w-5" aria-hidden="true" />}
              </button>
              <p className="text-white/35 text-sm">or $529/yr — save 10%</p>
            </div>

            <div className="flex flex-wrap justify-center gap-3 pt-2">
              {["Home emergency support", "Car breakdown assistance", "24/7 access", "One monthly membership"].map((t) => (
                <span key={t} className="inline-flex items-center gap-1.5 text-xs font-medium text-white/50 bg-white/5 border border-white/8 rounded-full px-3 py-1.5">
                  <CheckCircle2 className="h-3 w-3 text-[#ffc800]" aria-hidden="true" /> {t}
                </span>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* ─── Why people join ─── */}
      <section className="py-20 bg-[#0d0a05]">
        <div className="container mx-auto px-4 sm:px-6 max-w-5xl">
          <div className="text-center mb-14">
            <span className="text-[#ffc800] text-sm font-bold uppercase tracking-widest">Why people join</span>
            <h2 className="text-3xl sm:text-4xl font-black mt-3 max-w-xl mx-auto leading-tight">
              When things go wrong, the stress hits fast
            </h2>
          </div>

          <div className="grid sm:grid-cols-3 gap-6 mb-14">
            {PAIN_POINTS.map((point, i) => (
              <motion.div
                key={point.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1, duration: 0.4 }}
                className="bg-white/4 border border-white/8 rounded-2xl p-6 flex flex-col gap-4"
              >
                <div className="w-12 h-12 rounded-xl bg-[#ffc800]/10 border border-[#ffc800]/15 flex items-center justify-center">
                  <point.icon className="h-6 w-6 text-[#ffc800]" aria-hidden="true" />
                </div>
                <h3 className="font-bold text-[17px] leading-snug">{point.title}</h3>
                <p className="text-white/50 text-sm leading-relaxed">{point.body}</p>
              </motion.div>
            ))}
          </div>

          {/* Emotional quote block */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="bg-gradient-to-br from-[#1a1408] to-[#0e0b05] border border-[#ffc800]/20 rounded-3xl p-8 md:p-10 text-center max-w-3xl mx-auto"
          >
            <p className="text-xl md:text-2xl font-bold text-white leading-relaxed mb-4">
              "Fixit 24/7 Emergency helps you stay calm, act faster, and feel more in control — because you already have a plan."
            </p>
            <p className="text-white/40 text-sm">One membership. Home emergencies and car breakdowns covered.</p>
          </motion.div>
        </div>
      </section>

      {/* ─── What's included ─── */}
      <section className="py-20 bg-[#0b0904]">
        <div className="container mx-auto px-4 sm:px-6 max-w-5xl">
          <div className="text-center mb-14">
            <span className="text-[#ffc800] text-sm font-bold uppercase tracking-widest">Coverage</span>
            <h2 className="text-3xl sm:text-4xl font-black mt-3">What's included</h2>
            <p className="text-white/45 mt-3 text-[15px] max-w-md mx-auto">
              Genuine emergencies that affect safety, security, or essential services at home — plus car breakdown assistance.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {WHAT_INCLUDED.map((cat, i) => (
              <motion.div
                key={cat.title}
                initial={{ opacity: 0, y: 18 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.07, duration: 0.35 }}
                className="bg-white/4 border border-white/8 rounded-2xl p-6 hover:bg-white/6 hover:border-[#ffc800]/20 transition-all"
              >
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-xl bg-[#ffc800]/10 border border-[#ffc800]/15 flex items-center justify-center shrink-0">
                    <cat.icon className="h-5 w-5 text-[#ffc800]" aria-hidden="true" />
                  </div>
                  <h3 className="font-bold text-[15px]">{cat.title}</h3>
                </div>
                <ul className="space-y-2">
                  {cat.items.map((item) => (
                    <li key={item} className="flex items-start gap-2 text-[13px] text-white/55 leading-relaxed">
                      <span className="text-[#ffc800]/60 mt-0.5 shrink-0">–</span>
                      {item}
                    </li>
                  ))}
                </ul>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Why it's worth it ─── */}
      <section className="py-20 bg-[#0d0a05]">
        <div className="container mx-auto px-4 sm:px-6 max-w-4xl">
          <div className="text-center mb-12">
            <span className="text-[#ffc800] text-sm font-bold uppercase tracking-widest">Value</span>
            <h2 className="text-3xl sm:text-4xl font-black mt-3 max-w-lg mx-auto leading-tight">
              Why it's worth it
            </h2>
          </div>

          <div className="grid md:grid-cols-2 gap-6 mb-10">
            {[
              {
                heading: "A single emergency can cost hundreds",
                body: "An after-hours plumber, locksmith, or electrician can easily charge a few hundred dollars just to show up — before parts or extra time. The stress is one thing. The bill is another.",
              },
              {
                heading: "Breakdowns come at the worst time",
                body: "Late at night. On the way to something important. With kids in the car. Car breakdowns don't wait for a convenient moment. Having support already in place makes a real difference.",
              },
              {
                heading: "For $49/month, you're not just paying for assistance",
                body: "You're paying for fewer panic moments. Faster decisions. The calm that comes from knowing you already have a plan when the worst happens.",
              },
              {
                heading: "You hope you never need it. You'll be relieved it's there.",
                body: "One membership can protect you from some of life's worst-timed surprises — for a fraction of what a single major incident can cost when you're caught without a plan.",
              },
            ].map((item, i) => (
              <motion.div
                key={item.heading}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.09, duration: 0.38 }}
                className="bg-white/4 border border-white/8 rounded-2xl p-6"
              >
                <h3 className="font-bold text-[16px] text-white mb-3 leading-snug">{item.heading}</h3>
                <p className="text-white/50 text-sm leading-relaxed">{item.body}</p>
              </motion.div>
            ))}
          </div>

          {/* Mid-page CTA */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center bg-gradient-to-b from-[#1a1408] to-[#0e0b05] border border-[#ffc800]/20 rounded-3xl p-8"
          >
            <p className="text-white/50 text-sm mb-4">Choose your plan</p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-6">
              {/* Monthly */}
              <div className="flex-1 max-w-[200px] mx-auto sm:mx-0 bg-[#ffc800]/8 border border-[#ffc800]/30 rounded-2xl px-5 py-4 text-center">
                <p className="text-[#ffc800] text-[10px] font-bold uppercase tracking-widest mb-2">Monthly</p>
                <div className="flex items-end justify-center gap-0.5">
                  <span className="text-white/50 text-base font-bold self-start mt-1.5">A$</span>
                  <span className="text-4xl font-black text-white leading-none">49</span>
                  <span className="text-white/50 text-sm font-medium self-end mb-0.5">/mo</span>
                </div>
                <button
                  onClick={handleJoin}
                  disabled={checkoutMutation.isPending}
                  className="mt-4 w-full h-10 rounded-xl font-bold text-[13px] text-black bg-[#ffc800] hover:bg-[#e6b800] active:scale-[0.97] transition-all disabled:opacity-60 inline-flex items-center justify-center gap-1"
                >
                  {checkoutMutation.isPending ? "Loading…" : "Get started"}
                  {!checkoutMutation.isPending && <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />}
                </button>
              </div>
              {/* Annual */}
              <div className="flex-1 max-w-[200px] mx-auto sm:mx-0 bg-white/4 border border-white/10 rounded-2xl px-5 py-4 text-center relative">
                <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 bg-[#ffc800] text-black text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-widest whitespace-nowrap">Save 10%</span>
                <p className="text-white/40 text-[10px] font-bold uppercase tracking-widest mb-2">Annual</p>
                <div className="flex items-end justify-center gap-0.5">
                  <span className="text-white/40 text-base font-bold self-start mt-1.5">A$</span>
                  <span className="text-4xl font-black text-white leading-none">529</span>
                  <span className="text-white/40 text-sm font-medium self-end mb-0.5">/yr</span>
                </div>
                <p className="text-white/30 text-[11px] mt-1">Coming soon</p>
                <div className="mt-4 w-full h-10 rounded-xl font-bold text-[13px] text-white/30 bg-white/5 border border-white/8 flex items-center justify-center cursor-not-allowed select-none">
                  Notify me
                </div>
              </div>
            </div>
            <p className="text-white/30 text-xs">Eligible emergencies only · fair use applies</p>
          </motion.div>
        </div>
      </section>

      {/* ─── How it works ─── */}
      <section className="py-20 bg-[#0b0904]">
        <div className="container mx-auto px-4 sm:px-6 max-w-4xl">
          <div className="text-center mb-14">
            <span className="text-[#ffc800] text-sm font-bold uppercase tracking-widest">Simple process</span>
            <h2 className="text-3xl sm:text-4xl font-black mt-3">How it works</h2>
          </div>

          <div className="flex flex-col gap-4">
            {HOW_IT_WORKS_STEPS.map((s, i) => (
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
        </div>
      </section>

      {/* ─── FAQ / Terms ─── */}
      <section className="py-20 bg-[#0d0a05]">
        <div className="container mx-auto px-4 sm:px-6 max-w-3xl">
          <div className="text-center mb-12">
            <span className="text-[#ffc800] text-sm font-bold uppercase tracking-widest">Details & terms</span>
            <h2 className="text-3xl sm:text-4xl font-black mt-3 mb-3">Common questions</h2>
            <p className="text-white/45 text-[15px]">
              Everything you need to know, including cover limits and exclusions.
            </p>
          </div>

          <div className="flex flex-col gap-2 mb-10">
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

          <div className="bg-white/3 border border-white/8 rounded-2xl p-6 text-white/40 text-[12px] leading-relaxed space-y-2">
            <p className="font-semibold text-white/55 text-[13px] mb-3">Membership details & fair use</p>
            <p>$49/month billed monthly, or $529/year billed annually (save 10%). Annual billing coming soon.</p>
            <p>Includes up to 2 covered emergency callouts per membership year. Each covered callout includes tradie attendance, up to 1 hour of labour and minor parts, capped at $300 inc. GST per callout (up to $600 inc. GST total per membership year).</p>
            <p>If more time, parts, or additional work is needed, the tradie will present a clear quote before proceeding. You choose whether to approve and pay any extra through the app.</p>
            <p>Emergencies must be sudden and unforeseen. Long-term issues, known pre-existing faults, and non-urgent work are excluded. A 72-hour waiting period applies from first activation.</p>
            <p>Membership is for eligible emergencies only. Fair use, service limits, and full exclusions apply. Larger non-covered work can still be quoted through the Fixit 24/7 app as standard paid jobs.</p>
          </div>

          {/* Final CTA */}
          <div className="mt-12 text-center">
            <button
              onClick={handleJoin}
              disabled={checkoutMutation.isPending}
              className="inline-flex items-center gap-2 h-14 px-8 rounded-xl font-black text-[17px] text-black bg-[#ffc800] hover:bg-[#e6b800] active:scale-[0.97] transition-all disabled:opacity-60 mb-4"
            >
              {checkoutMutation.isPending ? "Loading…" : "Get protected for $49/month"}
              {!checkoutMutation.isPending && <ChevronRight className="h-5 w-5" aria-hidden="true" />}
            </button>
            <p className="text-white/30 text-sm">
              Questions?{" "}
              <Link href="/about">
                <span className="text-[#ffc800]/60 hover:text-[#ffc800] transition-colors cursor-pointer underline underline-offset-2">
                  Contact the team
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
