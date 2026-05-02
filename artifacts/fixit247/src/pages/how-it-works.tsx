import { Link } from "wouter";
import { motion } from "framer-motion";
import { Footer } from "@/components/footer";
import { Wrench, Users, BadgeCheck, Clock, Star, ShieldCheck, ChevronRight } from "lucide-react";

const STEPS = [
  {
    icon: Wrench,
    number: "01",
    title: "Post your job",
    desc: "Describe what needs fixing, set the urgency level (standard, urgent, or emergency), and add any photos. It takes under 2 minutes and is completely free.",
    detail: "We ask for your suburb and category so we can find the right tradies nearby.",
  },
  {
    icon: Users,
    number: "02",
    title: "Get matched instantly",
    desc: "Our smart matching engine automatically contacts up to 5 local tradies who match your category, location, and timing needs.",
    detail: "Each tradie is pre-verified. You'll start seeing interest within minutes.",
  },
  {
    icon: BadgeCheck,
    number: "03",
    title: "Review & accept quotes",
    desc: "Tradies send you their quote and availability. Review their profile, ratings, and message them before accepting.",
    detail: "No pressure — take your time. Once you accept, the job is locked in.",
  },
  {
    icon: ShieldCheck,
    number: "04",
    title: "Job done, pay securely",
    desc: "Once the tradie marks the job complete, you confirm and release payment. Leave a review to help the community.",
    detail: "All work is backed by our satisfaction guarantee.",
  },
];

const FAQS = [
  {
    q: "Is it really free to post a job?",
    a: "Yes. Posting a job is always free for homeowners. We charge a small success fee only when a job is completed.",
  },
  {
    q: "How do I know tradies are trustworthy?",
    a: "Every tradie on Fixit 24/7 has a verified profile, licensing checks, and publicly visible ratings from past jobs.",
  },
  {
    q: "How quickly will I get a response?",
    a: "Most jobs receive their first tradie quote within 30 minutes. Urgent and emergency jobs are prioritised automatically.",
  },
  {
    q: "What if I'm not happy with the work?",
    a: "Contact our support team within 48 hours of job completion and we'll work to make it right.",
  },
];

export default function HowItWorksPage() {
  return (
    <div className="flex flex-col min-h-screen bg-[#0b0904] text-white">
      {/* Header */}
      <section
        className="py-24 text-center"
        style={{ background: "radial-gradient(ellipse at 50% 100%, #251d08 0%, #0e0c07 60%, #070604 100%)" }}
      >
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="container max-w-2xl"
        >
          <span className="text-[#f5c518] text-sm font-bold uppercase tracking-widest">Simple process</span>
          <h1 className="text-5xl font-black mt-4 mb-5">How Fixit 24/7 works</h1>
          <p className="text-white/55 text-lg leading-relaxed">
            Getting your home repaired has never been easier. Post a job, get matched, and hire a verified local tradie — all in minutes.
          </p>
        </motion.div>
      </section>

      {/* Steps */}
      <section className="py-20 bg-[#0b0904]">
        <div className="container max-w-3xl">
          <div className="flex flex-col gap-12">
            {STEPS.map((step, i) => (
              <motion.div
                key={step.number}
                initial={{ opacity: 0, x: i % 2 === 0 ? -20 : 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5 }}
                viewport={{ once: true }}
                className="flex gap-8 items-start"
              >
                <div className="shrink-0 flex flex-col items-center gap-3">
                  <div className="w-14 h-14 rounded-2xl bg-[#f5c518]/10 border border-[#f5c518]/20 flex items-center justify-center">
                    <step.icon className="h-7 w-7 text-[#f5c518]" />
                  </div>
                  {i < STEPS.length - 1 && (
                    <div className="w-px flex-1 bg-white/8 h-12" />
                  )}
                </div>
                <div className="pb-4">
                  <span className="text-[#f5c518] text-xs font-bold uppercase tracking-widest">{step.number}</span>
                  <h3 className="text-2xl font-black mt-1 mb-3">{step.title}</h3>
                  <p className="text-white/65 leading-relaxed mb-2">{step.desc}</p>
                  <p className="text-white/40 text-sm">{step.detail}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-20 bg-[#0e0c08]">
        <div className="container max-w-2xl">
          <h2 className="text-3xl font-black mb-10 text-center">Common questions</h2>
          <div className="flex flex-col gap-6">
            {FAQS.map((faq) => (
              <div key={faq.q} className="bg-white/5 border border-white/8 rounded-2xl p-6">
                <h4 className="font-bold text-white mb-2">{faq.q}</h4>
                <p className="text-white/55 text-sm leading-relaxed">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-[#f5c518] text-center">
        <div className="container max-w-xl">
          <Clock className="h-12 w-12 text-black/30 mx-auto mb-5" />
          <h2 className="text-3xl font-black text-black mb-4">Ready to get started?</h2>
          <p className="text-black/60 mb-8">Post your first job for free — tradies in your area are standing by.</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/signup?role=homeowner">
              <button className="h-12 px-8 rounded-lg bg-black text-white font-bold text-[15px] hover:bg-[#1a1a1a] transition-colors inline-flex items-center gap-2">
                Post a job <ChevronRight className="h-4 w-4" />
              </button>
            </Link>
            <Link href="/signup?role=tradie">
              <button className="h-12 px-8 rounded-lg border-2 border-black text-black font-bold text-[15px] hover:bg-black/10 transition-colors">
                Join as a tradie
              </button>
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
