import { usePageTitle } from "@/hooks/use-page-title";
import { useState, useEffect } from "react";
import { Link, useLocation, useSearch } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { motion, AnimatePresence } from "framer-motion";
import { useCreateEmergencyCheckout } from "@workspace/api-client-react";
import { Footer } from "@/components/footer";
import {
  Shield, Home, Car, Clock, Zap, Droplets, Lock, Flame, Wind,
  CheckCircle2, ChevronRight, ChevronDown, Users, Moon,
} from "lucide-react";

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

const FAQS = [
  {
    q: "What exactly is covered?",
    a: "Fixit 24/7 Plus covers urgent home emergencies that affect safety, security or essential services — plumbing, electrical, locksmith, gas, hot water, roof make-safe — plus car breakdown assistance. See the 'What's included' section above for the full breakdown.",
  },
  {
    q: "What isn't covered?",
    a: "Non-urgent or cosmetic work (dripping taps, painting, minor cracks), full system upgrades or major renovations, pre-existing or long-standing problems, and area-wide utility outages. Larger non-covered jobs can still be quoted through Fixit 24/7 as normal paid work.",
  },
  {
    q: "Is there a waiting period?",
    a: "A 72-hour waiting period applies from the moment you first activate your membership. After that, you can request emergency support at any time, day or night.",
  },
  {
    q: "Can I cancel?",
    a: "Fixit 24/7 Plus is a 12-month membership billed monthly. You can cancel at any time — please refer to the Membership Agreement for full details on cancellation terms.",
  },
  {
    q: "What about fair use?",
    a: "The membership is designed for genuine, sudden emergencies. Repeated claims for known ongoing issues, pre-existing problems, or events that are not true emergencies may be assessed under fair use policy. Full terms and exclusions are in the Membership Agreement.",
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

const RETURN_TO_PLUS = encodeURIComponent("/emergency?autoCheckout=1");

export default function EmergencyPage() {
  usePageTitle("Fixit 24/7 Plus — Wherever life happens, you're covered.");
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const searchString = useSearch();
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [coveredOpen, setCoveredOpen] = useState(false);
  const [notCoveredOpen, setNotCoveredOpen] = useState(false);
  const [agreementChecked, setAgreementChecked] = useState(false);

  const checkoutMutation = useCreateEmergencyCheckout({
    mutation: {
      onSuccess: (data) => {
        if (data.url) window.location.href = data.url;
      },
    },
  });

  // Auto-trigger checkout when redirected back from login with ?autoCheckout=1
  useEffect(() => {
    const params = new URLSearchParams(searchString);
    if (params.get("autoCheckout") === "1" && user && user.role === "homeowner") {
      // Clear the param from the URL without a navigation event
      window.history.replaceState({}, "", "/emergency");
      setAgreementChecked(true);
      checkoutMutation.mutate();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, searchString]);

  function handleJoin() {
    if (!user) {
      setLocation(`/login?returnTo=${RETURN_TO_PLUS}`);
      return;
    }
    if (user.role !== "homeowner") {
      setLocation(`/register?role=homeowner&returnTo=${RETURN_TO_PLUS}`);
      return;
    }
    if (!agreementChecked) {
      const el = document.getElementById("agreement-checkbox");
      el?.scrollIntoView({ behavior: "smooth", block: "center" });
      el?.focus();
      return;
    }
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
              Fixit 24/7 Plus
            </div>

            <h1 className="text-5xl md:text-6xl lg:text-7xl font-black leading-[1.05] tracking-tight">
              Wherever life happens,<br />
              <span className="text-[#ffc800]">you're covered.</span>
            </h1>

            <p className="text-xl text-white/60 max-w-2xl leading-relaxed">
              At home or on the road, at 2 AM or on a Sunday — one membership puts real, trusted tradies in motion the moment you need them.
            </p>

            <p className="text-white/35 text-[15px]">
              No panic. No scrambling. Just one tap and help is on its way.
            </p>
          </motion.div>
        </div>
      </section>

      {/* ─── Covered moments ─── */}
      <section className="py-20 bg-[#0d0a05]">
        <div className="container mx-auto px-4 sm:px-6 max-w-5xl">
          <div className="text-center mb-12">
            <span className="text-[#ffc800] text-sm font-bold uppercase tracking-widest">When you need it most</span>
            <h2 className="text-3xl sm:text-4xl font-black mt-3">Life doesn't wait for a good time</h2>
          </div>

          <div className="grid sm:grid-cols-3 gap-6">
            {[
              {
                icon: Home,
                label: "At home",
                desc: "Burst pipes. No power. Locked out. We dispatch a trusted tradie in under 30 minutes.",
              },
              {
                icon: Car,
                label: "On the road",
                desc: "Stranded with a car that won't start? We coordinate roadside support — same membership, same tap.",
              },
              {
                icon: Moon,
                label: "At 2 AM",
                desc: "Emergencies don't check the time. Neither do we. 24/7 dispatch, every day of the year.",
              },
            ].map((m, i) => (
              <motion.div
                key={m.label}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1, duration: 0.4 }}
                className="bg-white/4 border border-white/8 rounded-2xl p-7 flex flex-col gap-4 hover:bg-white/6 hover:border-[#ffc800]/20 transition-all"
              >
                <div className="w-12 h-12 rounded-xl bg-[#ffc800]/10 border border-[#ffc800]/15 flex items-center justify-center">
                  <m.icon className="h-6 w-6 text-[#ffc800]" aria-hidden="true" />
                </div>
                <h3 className="font-bold text-[18px]">{m.label}</h3>
                <p className="text-white/50 text-[14px] leading-relaxed">{m.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Pricing & signup ─── */}
      <section className="py-20 bg-[#0b0904]">
        <div className="container mx-auto px-4 sm:px-6 max-w-lg">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4 }}
            className="relative rounded-3xl"
          >
            <div className="absolute -inset-px rounded-3xl bg-gradient-to-b from-[#ffc800]/40 to-[#ffc800]/10" aria-hidden="true" />
            <div className="relative bg-[#130f07] rounded-3xl p-8 border border-[#ffc800]/20">
              <p className="text-[#ffc800] text-[11px] font-black uppercase tracking-widest mb-6 text-center">Fixit 24/7 Plus</p>

              <div className="flex items-end justify-center gap-1 mb-2">
                <span className="text-white/50 text-xl font-bold self-start mt-2">A$</span>
                <span className="text-6xl font-black text-white leading-none">49</span>
                <span className="text-white/50 text-base font-medium self-end mb-1">/mo</span>
              </div>
              <p className="text-center text-white/35 text-sm mb-7">12-month membership · billed monthly</p>

              <ul className="flex flex-col gap-3 mb-7" role="list">
                {[
                  "24/7 emergency dispatch — home and roadside",
                  "Priority support for eligible emergencies",
                  "Member-only rates on any extra work",
                  "Cancel anytime (see Membership Agreement)",
                ].map((perk) => (
                  <li key={perk} className="flex items-start gap-2.5 text-sm text-white/75">
                    <CheckCircle2 className="h-4 w-4 text-[#ffc800] shrink-0 mt-0.5" aria-hidden="true" />
                    {perk}
                  </li>
                ))}
              </ul>

              <label
                id="agreement-checkbox"
                className="flex items-start gap-3 cursor-pointer mb-5 p-3 rounded-xl bg-white/4 border border-white/8 hover:border-white/15 transition-colors"
              >
                <input
                  type="checkbox"
                  checked={agreementChecked}
                  onChange={(e) => setAgreementChecked(e.target.checked)}
                  className="mt-0.5 h-4 w-4 accent-[#ffc800] shrink-0"
                />
                <span className="text-[13px] text-white/55 leading-snug">
                  I have read and agree to the{" "}
                  <Link href="/terms">
                    <span className="text-[#ffc800]/80 hover:text-[#ffc800] underline underline-offset-2 cursor-pointer">Terms of Service</span>
                  </Link>
                  {" "}and{" "}
                  <Link href="/membership-agreement">
                    <span className="text-[#ffc800]/80 hover:text-[#ffc800] underline underline-offset-2 cursor-pointer">Membership Agreement</span>
                  </Link>
                  , including the 12-month commitment and cancellation terms.
                </span>
              </label>

              <button
                onClick={handleJoin}
                disabled={checkoutMutation.isPending}
                className="w-full h-12 rounded-xl font-black text-[15px] text-black bg-[#ffc800] hover:bg-[#e6b800] active:scale-[0.97] transition-all disabled:opacity-60 inline-flex items-center justify-center gap-2"
              >
                {checkoutMutation.isPending ? "Loading…" : "Add Plus to my account"}
                {!checkoutMutation.isPending && <ChevronRight className="h-4 w-4" aria-hidden="true" />}
              </button>

              <p className="text-center text-white/30 text-[12px] mt-4">
                Real people, real tradies, real help — whenever life needs it.
              </p>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ─── What's included ─── */}
      <section className="py-20 bg-[#0d0a05]">
        <div className="container mx-auto px-4 sm:px-6 max-w-5xl">
          <div className="text-center mb-14">
            <span className="text-[#ffc800] text-sm font-bold uppercase tracking-widest">Coverage</span>
            <h2 className="text-3xl sm:text-4xl font-black mt-3">What's included</h2>
            <p className="text-white/45 mt-3 text-[15px] max-w-md mx-auto">
              Genuine emergencies that affect safety, security, or essential services at home — plus car breakdown assistance.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5 mb-8">
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

          {/* What's not included accordion */}
          <div className="flex flex-col gap-2">
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
                    <div className="px-5 pb-5 text-white/55 text-sm leading-relaxed space-y-3">
                      <p>Your membership covers situations that affect <strong className="text-white/75">safety, security or essential services</strong> — sudden and unforeseen. Long-term or known issues are excluded.</p>
                      <p>A 72-hour waiting period applies from first activation before emergency support is available.</p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

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
                      <ul className="space-y-2">
                        {[
                          "Non-urgent or cosmetic issues (dripping taps, painting, minor cracks, routine upgrades).",
                          "Full system upgrades or major projects (full roof replacement, full switchboard upgrade, full bathroom/kitchen renovations).",
                          "Pre-existing or long-standing problems that were present before you joined.",
                          "Area-wide power outages managed by your energy provider.",
                          "Costs beyond the included cover amount — the tradie will quote any extras before proceeding.",
                        ].map((item) => (
                          <li key={item} className="flex items-start gap-2">
                            <span className="text-white/30 mt-0.5 shrink-0">–</span>
                            {item}
                          </li>
                        ))}
                      </ul>
                      <p className="mt-3 text-white/40 italic">Those jobs can still be booked through Fixit 24/7 as standard paid work — just not under the membership cover.</p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Do I need this? ─── */}
      <section className="py-20 bg-[#0b0904]">
        <div className="container mx-auto px-4 sm:px-6 max-w-4xl">
          <div className="text-center mb-12">
            <span className="text-[#ffc800] text-sm font-bold uppercase tracking-widest">Is it right for you?</span>
            <h2 className="text-3xl sm:text-4xl font-black mt-3">Do I need this?</h2>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-[#ffc800]/6 border border-[#ffc800]/20 rounded-2xl p-7">
              <div className="flex items-center gap-3 mb-5">
                <div className="w-9 h-9 rounded-xl bg-[#ffc800]/15 flex items-center justify-center">
                  <CheckCircle2 className="h-5 w-5 text-[#ffc800]" aria-hidden="true" />
                </div>
                <h3 className="font-bold text-[16px]">Plus is a great fit if you…</h3>
              </div>
              <ul className="space-y-3">
                {[
                  "Own or rent a home and want peace of mind for sudden breakdowns.",
                  "Hate the panic of finding a reliable tradie at midnight.",
                  "Drive regularly and want roadside cover in the same membership.",
                  "Want to avoid the unpredictable cost of an after-hours call-out.",
                ].map((item) => (
                  <li key={item} className="flex items-start gap-2.5 text-[13px] text-white/70">
                    <span className="text-[#ffc800] mt-0.5 shrink-0">–</span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            <div className="bg-white/3 border border-white/8 rounded-2xl p-7">
              <div className="flex items-center gap-3 mb-5">
                <div className="w-9 h-9 rounded-xl bg-white/8 flex items-center justify-center">
                  <Users className="h-5 w-5 text-white/40" aria-hidden="true" />
                </div>
                <h3 className="font-bold text-[16px] text-white/70">You might not need it if…</h3>
              </div>
              <ul className="space-y-3">
                {[
                  "You rent with a property manager who handles all maintenance.",
                  "You already have comprehensive home and roadside cover.",
                  "Your property is brand-new with full builder warranties in place.",
                ].map((item) => (
                  <li key={item} className="flex items-start gap-2.5 text-[13px] text-white/45">
                    <span className="text-white/25 mt-0.5 shrink-0">–</span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* ─── FAQ ─── */}
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
            <p>A$49/month, billed monthly. 12-month membership commitment applies — see the Membership Agreement for full cancellation and early-exit terms.</p>
            <p>If more time, parts, or additional work is needed, the tradie will present a clear quote before proceeding. You choose whether to approve and pay any extra through the app.</p>
            <p>Emergencies must be sudden and unforeseen. Long-term issues, known pre-existing faults, and non-urgent work are excluded. A 72-hour waiting period applies from first activation.</p>
            <p>Membership is for eligible emergencies only. Fair use, service limits, and full exclusions apply. Larger non-covered work can still be quoted through the Fixit 24/7 app as standard paid jobs.</p>
          </div>
        </div>
      </section>

      {/* ─── Closing ─── */}
      <section className="py-20 bg-[#0b0904]">
        <div className="container mx-auto px-4 sm:px-6 max-w-2xl text-center">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mb-12"
          >
            <p className="text-2xl sm:text-3xl font-bold text-white leading-snug mb-3">
              Most months, you won't need us.
            </p>
            <p className="text-2xl sm:text-3xl font-bold text-[#ffc800] leading-snug">
              You'll be glad you had us when you did.
            </p>
          </motion.div>

          <button
            onClick={handleJoin}
            disabled={checkoutMutation.isPending}
            className="inline-flex items-center gap-2 h-14 px-8 rounded-xl font-black text-[17px] text-black bg-[#ffc800] hover:bg-[#e6b800] active:scale-[0.97] transition-all disabled:opacity-60 mb-6"
          >
            {checkoutMutation.isPending ? "Loading…" : "Add Plus to my account"}
            {!checkoutMutation.isPending && <ChevronRight className="h-5 w-5" aria-hidden="true" />}
          </button>

          <p className="text-white/25 text-[12px] leading-relaxed">
            By joining you agree to our{" "}
            <Link href="/terms">
              <span className="text-white/40 hover:text-white/60 underline underline-offset-2 cursor-pointer">Terms of Service</span>
            </Link>
            {" "}and{" "}
            <Link href="/membership-agreement">
              <span className="text-white/40 hover:text-white/60 underline underline-offset-2 cursor-pointer">Membership Agreement</span>
            </Link>
            . A$49/mo · 12-month commitment · billed monthly · eligible emergencies only · fair use applies.
          </p>
        </div>
      </section>

      <Footer />
    </div>
  );
}
