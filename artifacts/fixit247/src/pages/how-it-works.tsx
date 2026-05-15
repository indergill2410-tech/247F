import { usePageTitle } from "@/hooks/use-page-title";
import { useState } from "react";
import { Link } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { Footer } from "@/components/footer";
import {
  Wrench, Users, BadgeCheck, Clock, ShieldCheck, ChevronRight, ChevronDown,
  MessageCircle, Home, HardHat, CheckCircle2, Briefcase, Star, MapPin,
} from "lucide-react";

const HOMEOWNER_STEPS = [
  {
    icon: Wrench,
    number: "01",
    title: "Post your urgent repair job",
    desc: "Describe what needs fixing, set the urgency level — standard, urgent, or emergency — and add photos if you have them. It's completely free and takes under 2 minutes.",
    detail: "You stay in control of the details. No commitment until you choose a tradie.",
  },
  {
    icon: Users,
    number: "02",
    title: "Get matched with verified local tradies",
    desc: "Our matching engine finds verified local tradies with the right skills, availability, and ratings. You'll start seeing interest within minutes.",
    detail: "Every tradie has a verified profile, licence checks, and real ratings from past jobs.",
  },
  {
    icon: BadgeCheck,
    number: "03",
    title: "Compare responses and choose who suits you",
    desc: "Review tradie profiles, ratings, and quotes side-by-side. Message them directly before committing to anything.",
    detail: "No pressure — take your time. You choose who to hire based on what matters to you.",
  },
  {
    icon: MessageCircle,
    number: "04",
    title: "Message directly and get the repair sorted",
    desc: "Chat securely in-app, agree on timing, and get the job done. No call centres, no middlemen — just a direct conversation.",
    detail: "Pay only when you're satisfied. Leave a review to help the community.",
  },
];

const TRADIE_STEPS = [
  {
    icon: HardHat,
    number: "01",
    title: "Sign up free",
    desc: "Create your tradie account in minutes and claim A$111/month in free job lead credits for your first 6 months. No credit card required, no setup fee.",
    detail: "Takes under 3 minutes to get your profile live and your first month of credits ready.",
  },
  {
    icon: BadgeCheck,
    number: "02",
    title: "Build a verified profile",
    desc: "Add your trade categories, service areas, licences, and a short bio. Verified profiles build trust with homeowners and help you stand out.",
    detail: "The more complete your profile, the more job matches you receive.",
  },
  {
    icon: Briefcase,
    number: "03",
    title: "Receive local job opportunities",
    desc: "Get notified when relevant jobs are posted in your area. Only see opportunities that match your skills, location, and availability.",
    detail: "No chasing leads. Jobs come to you based on your profile.",
  },
  {
    icon: Clock,
    number: "04",
    title: "Choose the jobs that suit your schedule",
    desc: "Browse available jobs and accept only those that work for you. You're fully in control of your workload — accept as many or as few as you like.",
    detail: "No penalties for passing on jobs that don't suit you.",
  },
  {
    icon: MessageCircle,
    number: "05",
    title: "Message homeowners directly",
    desc: "Communicate directly with homeowners through our secure in-app messaging before and during the job. No middlemen involved.",
    detail: "Build relationships that lead to repeat business and referrals.",
  },
];

const FAQS = [
  {
    category: "For homeowners",
    items: [
      {
        q: "Is Fixit 24/7 available in my area?",
        a: "We're growing fast across Australia. Enter your suburb on the homepage to see verified tradies available near you. Most metro and regional areas are covered.",
      },
      {
        q: "Are the tradies verified?",
        a: "Yes. Every tradie on Fixit 24/7 has a verified profile, including identity checks and licence verification where applicable. Ratings from past jobs are publicly visible so you can make an informed choice.",
      },
      {
        q: "How quickly can I get help?",
        a: "Most jobs receive their first tradie response within 30 minutes. Emergency jobs are automatically prioritised — many homeowners hear back within minutes.",
      },
      {
        q: "Do I have to pay to post a job?",
        a: "No. Posting a job is completely free for homeowners. You only pay for the repair itself — directly to the tradie you choose.",
      },
      {
        q: "Can I choose which tradie to hire?",
        a: "Absolutely. You stay in control. Review tradie profiles, ratings, and quotes, then choose the person that suits you best. There's no obligation until you accept.",
      },
      {
        q: "Can I message tradies directly?",
        a: "Yes. Message any tradie directly through the app before committing to anything. Ask questions, confirm availability, and get a feel for who you're working with — no call centres involved.",
      },
      {
        q: "What types of urgent repairs are supported?",
        a: "We cover plumbing, electrical, locksmith, HVAC, roofing, carpentry, handyman, painting, and more — 12+ trade categories in total. If it needs fixing, we've got a tradie for it.",
      },
      {
        q: "Is this only for emergency repairs?",
        a: "No. While we specialise in urgent and emergency jobs, you can post standard or scheduled repairs too. Choose the urgency level that suits your situation when you post.",
      },
    ],
  },
  {
    category: "For tradies",
    items: [
      {
        q: "Is it free for tradies to join?",
        a: "Yes. Creating your profile and receiving job opportunities is completely free. No subscription, no monthly fee, no credit card required to get started.",
      },
      {
        q: "Do I need a credit card to sign up?",
        a: "No credit card required. Sign up, build your profile, and start receiving local job opportunities — all without any payment details.",
      },
      {
        q: "How do I receive jobs?",
        a: "You'll be notified when a relevant job is posted in your service area that matches your trade category and skills. Browse available jobs and respond to the ones that suit you.",
      },
      {
        q: "Can I choose which jobs I accept?",
        a: "Yes. You're fully in control of your workload. Browse jobs and accept only those that match your schedule and skills. There's no obligation to accept any particular job.",
      },
      {
        q: "How does verification work?",
        a: "We verify your identity and trade licences to give homeowners confidence in your profile. Verified profiles build trust and receive more job opportunities. The process is quick and straightforward.",
      },
      {
        q: "Can homeowners contact me directly?",
        a: "Yes. Homeowners can message you directly through the app before committing to a job. This means you can discuss the scope, timing, and price before anything is locked in.",
      },
      {
        q: "Is Fixit 24/7 suitable for plumbers, electricians, locksmiths, and other trades?",
        a: "Absolutely. We support 12+ trade categories including plumbing, electrical, locksmith, HVAC, carpentry, painting, roofing, handyman, and more. If you're a licensed tradie in Australia, there's a place for you.",
      },
    ],
  },
];

const TRUST_SIGNALS = [
  { icon: BadgeCheck, label: "Verified profiles" },
  { icon: Star, label: "Real ratings" },
  { icon: MessageCircle, label: "Direct messaging" },
  { icon: MapPin, label: "Local matching" },
  { icon: ShieldCheck, label: "Secure platform" },
  { icon: CheckCircle2, label: "No credit card needed" },
];

function AccordionItem({
  q, a, isOpen, onToggle,
}: { q: string; a: string; isOpen: boolean; onToggle: () => void }) {
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

export default function HowItWorksPage() {
  usePageTitle("How It Works");
  const [role, setRole] = useState<"homeowner" | "tradie">("homeowner");
  const [openFaq, setOpenFaq] = useState<string | null>(null);

  const steps = role === "homeowner" ? HOMEOWNER_STEPS : TRADIE_STEPS;

  const toggleFaq = (key: string) => setOpenFaq(openFaq === key ? null : key);

  return (
    <div className="flex flex-col min-h-screen bg-[#0b0904] text-white">

      {/* ─── Hero ─── */}
      <section
        className="py-16 sm:py-20 text-center"
        style={{ background: "var(--app-hero-gradient-bottom)" }}
      >
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="container max-w-2xl mx-auto px-4 sm:px-6"
        >
          <span className="text-primary text-xs font-bold uppercase tracking-widest">Simple process</span>
          <h1 className="text-4xl sm:text-5xl font-black mt-3 mb-4 leading-tight">
            How Fixit 24/7 works
          </h1>
          <p className="text-white/55 text-lg leading-relaxed max-w-xl mx-auto">
            Getting your home repaired has never been easier. Post a job, get matched with a verified local tradie, and get it sorted — all in minutes.
          </p>
        </motion.div>
      </section>

      {/* ─── Role Switcher + Steps ─── */}
      <section className="py-16 bg-[#0b0904]">
        <div className="container max-w-3xl mx-auto px-4 sm:px-6">

          {/* Role toggle */}
          <div className="flex bg-white/5 border border-white/8 rounded-2xl p-1 mb-12 max-w-sm mx-auto" role="tablist" aria-label="Select your role">
            <button
              role="tab"
              aria-selected={role === "homeowner"}
              onClick={() => setRole("homeowner")}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold transition-all ${
                role === "homeowner"
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-white/45 hover:text-white/70"
              }`}
            >
              <Home className="h-4 w-4" aria-hidden="true" /> Homeowners
            </button>
            <button
              role="tab"
              aria-selected={role === "tradie"}
              onClick={() => setRole("tradie")}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold transition-all ${
                role === "tradie"
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-white/45 hover:text-white/70"
              }`}
            >
              <HardHat className="h-4 w-4" aria-hidden="true" /> Tradies
            </button>
          </div>

          {/* Steps */}
          <AnimatePresence mode="wait">
            <motion.div
              key={role}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.3 }}
              className="flex flex-col gap-10"
              role="tabpanel"
              aria-label={`${role === "homeowner" ? "Homeowner" : "Tradie"} steps`}
            >
              {steps.map((step, i) => (
                <motion.div
                  key={step.number}
                  initial={{ opacity: 0, x: -16 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.4, delay: i * 0.07 }}
                  viewport={{ once: true }}
                  className="flex gap-5 sm:gap-6 items-start"
                >
                  {/* Icon + line */}
                  <div className="shrink-0 flex flex-col items-center gap-3">
                    <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center">
                      <step.icon className="h-5 w-5 sm:h-6 sm:w-6 text-primary" aria-hidden="true" />
                    </div>
                    {i < steps.length - 1 && (
                      <div className="w-px bg-white/8 flex-1 min-h-[32px]" aria-hidden="true" />
                    )}
                  </div>

                  {/* Content */}
                  <div className="pb-2 min-w-0">
                    <span className="text-primary text-xs font-bold uppercase tracking-widest">{step.number}</span>
                    <h3 className="text-lg sm:text-xl font-black mt-1 mb-2">{step.title}</h3>
                    <p className="text-white/60 leading-relaxed mb-2 text-[15px]">{step.desc}</p>
                    <p className="text-white/35 text-sm italic">{step.detail}</p>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          </AnimatePresence>

          {/* CTA after steps */}
          <div className="mt-12 flex flex-col sm:flex-row gap-3 justify-center items-center">
            {role === "homeowner" ? (
              <>
                <Link to="/signup?role=homeowner">
                  <button className="h-12 px-8 rounded-xl bg-[#ffc800] hover:bg-[#e6b800] active:scale-[0.97] text-black font-bold text-[15px] transition-all inline-flex items-center gap-2">
                    Post a job <ChevronRight className="h-4 w-4" aria-hidden="true" />
                  </button>
                </Link>
                <p className="text-white/35 text-sm">Free to post · No commitment needed</p>
              </>
            ) : (
              <>
                <Link to="/signup?role=tradie">
                  <button className="h-12 px-8 rounded-xl bg-[#ffc800] hover:bg-[#e6b800] active:scale-[0.97] text-black font-bold text-[15px] transition-all inline-flex items-center gap-2">
                    Join as a tradie <ChevronRight className="h-4 w-4" aria-hidden="true" />
                  </button>
                </Link>
                <p className="text-white/35 text-sm">Free to join · A$111/month lead credits for 6 months</p>
              </>
            )}
          </div>
        </div>
      </section>

      {/* ─── Trust signals ─── */}
      <section className="py-12 bg-[#0e0c08] border-y border-white/5">
        <div className="container max-w-4xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-6 text-center">
            {TRUST_SIGNALS.map(({ icon: Icon, label }) => (
              <div key={label} className="flex flex-col items-center gap-2">
                <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/15 flex items-center justify-center">
                  <Icon className="h-5 w-5 text-primary" aria-hidden="true" />
                </div>
                <span className="text-xs font-semibold text-white/60">{label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── FAQ ─── */}
      <section className="py-16 sm:py-20 bg-[#0b0904]">
        <div className="container max-w-2xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-12">
            <span className="text-primary text-xs font-bold uppercase tracking-widest">Questions answered</span>
            <h2 className="text-3xl sm:text-4xl font-black mt-3 mb-3">Common questions</h2>
            <p className="text-white/50 text-[15px]">
              Everything you need to know before getting started.
            </p>
          </div>

          <div className="flex flex-col gap-10">
            {FAQS.map((group) => (
              <div key={group.category}>
                <p className="text-xs font-bold uppercase tracking-widest text-primary mb-4 flex items-center gap-2">
                  {group.category === "For homeowners"
                    ? <><Home className="h-3.5 w-3.5" aria-hidden="true" /> {group.category}</>
                    : <><HardHat className="h-3.5 w-3.5" aria-hidden="true" /> {group.category}</>
                  }
                </p>
                <div className="flex flex-col gap-2">
                  {group.items.map((faq) => {
                    const key = `${group.category}:${faq.q}`;
                    return (
                      <AccordionItem
                        key={key}
                        q={faq.q}
                        a={faq.a}
                        isOpen={openFaq === key}
                        onToggle={() => toggleFaq(key)}
                      />
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Final CTA ─── */}
      <section className="py-16 sm:py-20 bg-primary text-center">
        <div className="container max-w-xl mx-auto px-4 sm:px-6">
          <Clock className="h-10 w-10 text-black/25 mx-auto mb-5" aria-hidden="true" />
          <h2 className="text-3xl sm:text-4xl font-black text-black mb-3">Ready to get started?</h2>
          <p className="text-black/65 mb-3 text-[15px]">
            Post your first job for free — verified tradies in your area are standing by.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-2 mb-8">
            {["Free to post", "No commitment", "Verified tradies", "Direct messaging"].map((t) => (
              <span key={t} className="inline-flex items-center gap-1.5 text-xs font-semibold text-black/60 bg-black/8 rounded-full px-3 py-1">
                <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" /> {t}
              </span>
            ))}
          </div>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link to="/signup?role=homeowner">
              <button className="h-12 px-8 rounded-xl bg-black dark:bg-white text-white dark:text-black font-bold text-[15px] hover:bg-[#1a1a1a] dark:hover:bg-white/90 active:scale-[0.97] transition-all inline-flex items-center gap-2">
                Post a job <ChevronRight className="h-4 w-4" aria-hidden="true" />
              </button>
            </Link>
            <Link to="/signup?role=tradie">
              <button className="h-12 px-8 rounded-xl border-2 border-black dark:border-black/70 text-black font-bold text-[15px] hover:bg-black/10 active:scale-[0.97] transition-all">
                Tradies — join free
              </button>
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
