import { Link } from "wouter";
import { motion } from "framer-motion";
import { Footer } from "@/components/footer";
import { Wrench, ShieldCheck, Clock, Star, Users, ChevronRight } from "lucide-react";

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

export default function AboutPage() {
  return (
    <div className="flex flex-col min-h-screen bg-[#0b0904] text-white">
      {/* Hero */}
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
            Fixit 24/7 was founded in 2022 with one mission: make it genuinely easy for Australians to find a trustworthy tradie whenever they need one — not tomorrow, not next week, but now.
          </p>
        </motion.div>
      </section>

      {/* Stats bar */}
      <section className="bg-[#ffc800] py-8">
        <div className="container mx-auto px-4 sm:px-6 grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          {[
            { value: "2022", label: "Founded" },
            { value: "12,400+", label: "Jobs completed" },
            { value: "850+", label: "Verified tradies" },
            { value: "6 states", label: "Coverage" },
          ].map((s) => (
            <div key={s.label}>
              <p className="text-3xl font-black text-black">{s.value}</p>
              <p className="text-black/60 text-sm mt-1 font-medium">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Mission */}
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

      {/* Values */}
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
                  <v.icon className="h-5 w-5 text-[#ffc800]" />
                </div>
                <h3 className="font-bold text-[15px] mb-2">{v.title}</h3>
                <p className="text-white/50 text-sm leading-relaxed">{v.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Team */}
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

      {/* CTA */}
      <section className="py-16 bg-[#ffc800] text-center">
        <div className="container max-w-xl mx-auto px-4 sm:px-6">
          <Wrench className="h-10 w-10 text-black/30 mx-auto mb-5" />
          <h2 className="text-3xl font-black text-black mb-3">Join the Fixit community</h2>
          <p className="text-black/60 mb-7 text-[15px]">Whether you're a homeowner or a tradie, there's a place for you.</p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/signup?role=homeowner">
              <button className="h-12 px-8 rounded-xl bg-black text-white font-bold text-[15px] hover:bg-[#1a1a1a] active:scale-[0.97] transition-all inline-flex items-center gap-2">
                Post a job <ChevronRight className="h-4 w-4" />
              </button>
            </Link>
            <Link href="/careers">
              <button className="h-12 px-8 rounded-xl border-2 border-black text-black font-bold text-[15px] hover:bg-black/10 active:scale-[0.97] transition-all">
                We're hiring →
              </button>
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
