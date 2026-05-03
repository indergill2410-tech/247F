import { usePageTitle } from "@/hooks/use-page-title";
import { Link } from "wouter";
import { motion } from "framer-motion";
import { Footer } from "@/components/footer";
import {
  Wrench, ShieldCheck, Clock, Star, Users, ChevronRight,
  Home, HardHat, CheckCircle2, TrendingUp, MessageCircle, MapPin,
} from "lucide-react";

const VALUES = [
  {
    icon: ShieldCheck,
    title: "Trust & safety first",
    desc: "Every tradie is verified with licence checks, insurance validation, and real identity confirmation before they can accept a single job.",
  },
  {
    icon: Clock,
    title: "Always available",
    desc: "Home emergencies don't keep business hours. Our platform and tradie network operate around the clock, every day of the year.",
  },
  {
    icon: Star,
    title: "Quality guaranteed",
    desc: "Transparent ratings and reviews mean only the best tradies rise to the top. We back all completed jobs with our satisfaction promise.",
  },
  {
    icon: Users,
    title: "Community-built",
    desc: "We started as tradies and homeowners ourselves. Every feature is designed around real experiences from both sides of the job.",
  },
];

const TEAM = [
  { name: "Matt Reynolds", role: "CEO & Co-founder", initials: "MR" },
  { name: "Priya Sharma", role: "CTO & Co-founder", initials: "PS" },
  { name: "Jake Thornton", role: "Head of Operations", initials: "JT" },
  { name: "Aisha Okoye", role: "Head of Product", initials: "AO" },
];

const HOMEOWNER_IMPACTS = [
  { icon: CheckCircle2, text: "Repairs sorted in hours, not days" },
  { icon: ShieldCheck, text: "Verified tradies — no stranger risk" },
  { icon: MessageCircle, text: "Direct communication — no middlemen" },
  { icon: Star, text: "Transparent reviews from real customers" },
];

const TRADIE_IMPACTS = [
  { icon: TrendingUp, text: "More local jobs, less chasing leads" },
  { icon: CheckCircle2, text: "Free to join — no upfront cost" },
  { icon: MapPin, text: "Jobs matched to your area and skills" },
  { icon: MessageCircle, text: "Direct contact with homeowners" },
];

export default function AboutPage() {
  usePageTitle("About Us");
  return (
    <div className="flex flex-col min-h-screen bg-[#0b0904] text-white">

      {/* ─── Hero ─── */}
      <section
        className="py-20 text-center"
        style={{ background: "radial-gradient(ellipse at 50% 100%, #251d08 0%, #0e0c07 60%, #070604 100%)" }}
      >
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="container max-w-2xl mx-auto px-4 sm:px-6"
        >
          <span className="text-[#ffc800] text-xs font-bold uppercase tracking-widest">Our story</span>
          <h1 className="text-4xl sm:text-5xl font-black mt-3 mb-4 leading-tight">Built for real Australians</h1>
          <p className="text-white/55 text-lg leading-relaxed">
            Fixit 24/7 was built with one mission: make it genuinely easy for Australians to find a trustworthy tradie whenever they need one — not tomorrow, not next week, but now.
          </p>
        </motion.div>
      </section>

      {/* ─── How we're helping ─── */}
      <section className="py-16 bg-[#0e0c08]">
        <div className="container max-w-4xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-12">
            <span className="text-[#ffc800] text-xs font-bold uppercase tracking-widest">Making a difference</span>
            <h2 className="text-3xl sm:text-4xl font-black mt-3 mb-3">How we're helping</h2>
            <p className="text-white/50 text-[15px] max-w-lg mx-auto">
              Fixit 24/7 connects two communities that depend on each other — and makes life genuinely better for both.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {/* Homeowners card */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.45 }}
              viewport={{ once: true }}
              className="bg-white/5 border border-white/8 rounded-3xl p-7 sm:p-8"
            >
              <div className="flex items-center gap-3 mb-5">
                <div className="w-11 h-11 rounded-2xl bg-[#ffc800]/15 border border-[#ffc800]/25 flex items-center justify-center shrink-0">
                  <Home className="h-5 w-5 text-[#ffc800]" aria-hidden="true" />
                </div>
                <div>
                  <p className="font-black text-[17px]">For homeowners</p>
                  <p className="text-white/40 text-xs">Peace of mind, fast</p>
                </div>
              </div>
              <p className="text-white/60 text-sm leading-relaxed mb-6">
                When something breaks at home — especially in an emergency — the last thing you need is stress. We give homeowners immediate access to verified, rated local tradies, 24 hours a day.
              </p>
              <ul className="flex flex-col gap-3">
                {HOMEOWNER_IMPACTS.map(({ icon: Icon, text }) => (
                  <li key={text} className="flex items-center gap-3 text-sm text-white/75">
                    <Icon className="h-4 w-4 text-[#ffc800] shrink-0" aria-hidden="true" />
                    {text}
                  </li>
                ))}
              </ul>
              <Link href="/signup?role=homeowner">
                <button className="mt-7 w-full h-11 rounded-xl bg-[#ffc800] hover:bg-[#e6b800] active:scale-[0.97] text-black font-bold text-sm transition-all inline-flex items-center justify-center gap-2">
                  Post a job free <ChevronRight className="h-4 w-4" aria-hidden="true" />
                </button>
              </Link>
            </motion.div>

            {/* Tradies card */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.45 }}
              viewport={{ once: true }}
              className="bg-white/5 border border-white/8 rounded-3xl p-7 sm:p-8"
            >
              <div className="flex items-center gap-3 mb-5">
                <div className="w-11 h-11 rounded-2xl bg-[#ffc800]/15 border border-[#ffc800]/25 flex items-center justify-center shrink-0">
                  <HardHat className="h-5 w-5 text-[#ffc800]" aria-hidden="true" />
                </div>
                <div>
                  <p className="font-black text-[17px]">For tradies</p>
                  <p className="text-white/40 text-xs">More work, less hassle</p>
                </div>
              </div>
              <p className="text-white/60 text-sm leading-relaxed mb-6">
                Finding steady local work shouldn't cost a fortune or require constant marketing. We give tradies a free, fair marketplace where the right jobs come to them — based on their skills and location.
              </p>
              <ul className="flex flex-col gap-3">
                {TRADIE_IMPACTS.map(({ icon: Icon, text }) => (
                  <li key={text} className="flex items-center gap-3 text-sm text-white/75">
                    <Icon className="h-4 w-4 text-[#ffc800] shrink-0" aria-hidden="true" />
                    {text}
                  </li>
                ))}
              </ul>
              <Link href="/signup?role=tradie">
                <button className="mt-7 w-full h-11 rounded-xl border border-white/15 hover:bg-white/8 active:scale-[0.97] text-white font-bold text-sm transition-all inline-flex items-center justify-center gap-2">
                  Join as a tradie <ChevronRight className="h-4 w-4" aria-hidden="true" />
                </button>
              </Link>
            </motion.div>
          </div>

          {/* Impact numbers strip */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 mt-10 bg-[#ffc800]/8 border border-[#ffc800]/15 rounded-3xl px-6 py-7 text-center">
            {[
              { value: "12,400+", label: "Repairs sorted" },
              { value: "850+", label: "Tradies earning" },
              { value: "< 2 hrs", label: "Avg. response time" },
              { value: "4.8 / 5", label: "Homeowner satisfaction" },
            ].map((s) => (
              <div key={s.label}>
                <p className="text-2xl sm:text-3xl font-black text-[#ffc800]">{s.value}</p>
                <p className="text-white/50 text-xs sm:text-sm mt-1 font-medium">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Mission ─── */}
      <section className="py-16 bg-[#0b0904]">
        <div className="container max-w-3xl mx-auto px-4 sm:px-6">
          <div className="bg-white/5 border border-white/8 rounded-3xl p-8 sm:p-10">
            <span className="text-[#ffc800] text-xs font-bold uppercase tracking-widest">Our mission</span>
            <p className="text-xl sm:text-2xl font-bold mt-4 leading-relaxed text-white/90">
              "To connect every Australian homeowner with a skilled, verified local tradie — in minutes, not days — while giving tradies a fair, transparent marketplace to grow their business."
            </p>
          </div>
        </div>
      </section>

      {/* ─── Values ─── */}
      <section className="py-16 bg-[#0e0c08]">
        <div className="container max-w-3xl mx-auto px-4 sm:px-6">
          <h2 className="text-2xl font-black text-center mb-10">What we stand for</h2>
          <div className="grid md:grid-cols-2 gap-5">
            {VALUES.map((v, i) => (
              <motion.div
                key={v.title}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                viewport={{ once: true }}
                className="bg-white/5 border border-white/8 rounded-2xl p-6"
              >
                <div className="w-10 h-10 rounded-xl bg-[#ffc800]/10 border border-[#ffc800]/20 flex items-center justify-center mb-4">
                  <v.icon className="h-5 w-5 text-[#ffc800]" aria-hidden="true" />
                </div>
                <h3 className="font-bold text-[15px] mb-2">{v.title}</h3>
                <p className="text-white/50 text-sm leading-relaxed">{v.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Team ─── */}
      <section className="py-16 bg-[#0b0904]">
        <div className="container max-w-3xl mx-auto px-4 sm:px-6">
          <h2 className="text-2xl font-black text-center mb-10">Meet the team</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {TEAM.map((member, i) => (
              <motion.div
                key={member.name}
                initial={{ opacity: 0, scale: 0.95 }}
                whileInView={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.08 }}
                viewport={{ once: true }}
                className="flex flex-col items-center gap-3 text-center"
              >
                <div className="w-16 h-16 rounded-2xl bg-[#ffc800] flex items-center justify-center text-black font-black text-lg">
                  {member.initials}
                </div>
                <div>
                  <p className="font-bold text-sm">{member.name}</p>
                  <p className="text-white/40 text-xs mt-0.5">{member.role}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── CTA ─── */}
      <section className="py-16 bg-[#ffc800] text-center">
        <div className="container max-w-xl mx-auto px-4 sm:px-6">
          <Wrench className="h-10 w-10 text-black/30 mx-auto mb-5" aria-hidden="true" />
          <h2 className="text-3xl font-black text-black mb-3">Join the Fixit community</h2>
          <p className="text-black/60 mb-7 text-[15px]">Whether you're a homeowner or a tradie, there's a place for you.</p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/signup?role=homeowner">
              <button className="h-12 px-8 rounded-xl bg-black text-white font-bold text-[15px] hover:bg-[#1a1a1a] active:scale-[0.97] transition-all inline-flex items-center gap-2">
                Post a job <ChevronRight className="h-4 w-4" aria-hidden="true" />
              </button>
            </Link>
            <Link href="/partner">
              <button className="h-12 px-8 rounded-xl border-2 border-black text-black font-bold text-[15px] hover:bg-black/10 active:scale-[0.97] transition-all">
                Partner with us →
              </button>
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
