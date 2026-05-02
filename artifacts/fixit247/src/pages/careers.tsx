import { Link } from "wouter";
import { motion } from "framer-motion";
import { MapPin, Clock, ChevronRight, Briefcase, Code, Megaphone, HeartHandshake } from "lucide-react";

const ROLES = [
  {
    icon: Code,
    title: "Senior Full-Stack Engineer",
    team: "Engineering",
    location: "Sydney / Remote",
    type: "Full-time",
    desc: "Help build the platform powering thousands of home repair jobs every month. React, Node.js, PostgreSQL.",
  },
  {
    icon: Megaphone,
    title: "Growth Marketing Manager",
    team: "Marketing",
    location: "Melbourne / Hybrid",
    type: "Full-time",
    desc: "Own our paid, organic, and referral channels. Drive homeowner and tradie acquisition across Australia.",
  },
  {
    icon: HeartHandshake,
    title: "Tradie Success Manager",
    team: "Operations",
    location: "Brisbane / Remote",
    type: "Full-time",
    desc: "Onboard and support our tradie community. Ensure they get the most out of the platform.",
  },
  {
    icon: Briefcase,
    title: "Product Manager",
    team: "Product",
    location: "Sydney / Hybrid",
    type: "Full-time",
    desc: "Drive the roadmap for our homeowner experience. Work closely with design and engineering.",
  },
];

const PERKS = [
  "Competitive salary + equity",
  "Flexible remote-first work",
  "Home office budget ($2,000)",
  "4 weeks annual leave + wellbeing days",
  "Learning & development budget",
  "Annual team retreat",
];

export default function CareersPage() {
  return (
    <div className="flex flex-col min-h-screen bg-[#0b0904] text-white">
      {/* Header */}
      <section
        className="py-28 text-center"
        style={{ background: "radial-gradient(ellipse at 50% 100%, #251d08 0%, #0e0c07 60%, #070604 100%)" }}
      >
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="container max-w-2xl"
        >
          <span className="text-[#f5c518] text-sm font-bold uppercase tracking-widest">We are hiring</span>
          <h1 className="text-5xl font-black mt-4 mb-5">Build something Australians rely on</h1>
          <p className="text-white/55 text-lg leading-relaxed">
            Join a small, high-output team making home repairs fast, fair, and stress-free for every Australian. Remote-first, mission-driven.
          </p>
        </motion.div>
      </section>

      {/* Open roles */}
      <section className="py-20 bg-[#0b0904]">
        <div className="container max-w-3xl">
          <h2 className="text-3xl font-black mb-10">Open roles</h2>
          <div className="flex flex-col gap-5">
            {ROLES.map((role, i) => (
              <motion.div
                key={role.title}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.08 }}
                viewport={{ once: true }}
                className="group bg-white/5 border border-white/8 rounded-2xl p-7 hover:bg-white/8 hover:border-[#f5c518]/20 transition-all cursor-pointer"
              >
                <div className="flex items-start gap-5">
                  <div className="w-12 h-12 rounded-xl bg-[#f5c518]/10 border border-[#f5c518]/15 flex items-center justify-center shrink-0 group-hover:bg-[#f5c518]/20 transition-colors">
                    <role.icon className="h-6 w-6 text-[#f5c518]" />
                  </div>
                  <div className="flex-1">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <h3 className="font-bold text-lg group-hover:text-[#f5c518] transition-colors">{role.title}</h3>
                        <p className="text-[#f5c518]/70 text-sm font-medium">{role.team}</p>
                      </div>
                      <div className="flex gap-2 shrink-0">
                        <span className="bg-white/8 text-white/60 text-xs font-medium px-3 py-1 rounded-full flex items-center gap-1">
                          <MapPin className="h-3 w-3" /> {role.location}
                        </span>
                        <span className="bg-white/8 text-white/60 text-xs font-medium px-3 py-1 rounded-full flex items-center gap-1">
                          <Clock className="h-3 w-3" /> {role.type}
                        </span>
                      </div>
                    </div>
                    <p className="text-white/50 text-sm mt-3 leading-relaxed">{role.desc}</p>
                    <p className="text-[#f5c518] text-sm font-medium mt-4 flex items-center gap-1 group-hover:gap-2 transition-all">
                      Apply for this role <ChevronRight className="h-4 w-4" />
                    </p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Perks */}
      <section className="py-20 bg-[#0e0c08]">
        <div className="container max-w-3xl">
          <h2 className="text-3xl font-black text-center mb-12">Why Fixit 24/7?</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {PERKS.map((perk, i) => (
              <motion.div
                key={perk}
                initial={{ opacity: 0, scale: 0.95 }}
                whileInView={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.06 }}
                viewport={{ once: true }}
                className="bg-white/5 border border-white/8 rounded-xl p-5 text-sm font-medium text-white/70 text-center"
              >
                <span className="text-[#f5c518] mr-2">✦</span>
                {perk}
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Contact */}
      <section className="py-20 bg-[#f5c518] text-center">
        <div className="container max-w-xl">
          <h2 className="text-3xl font-black text-black mb-4">Don't see your role?</h2>
          <p className="text-black/60 mb-8">
            We're always open to hearing from exceptional people. Send us your details and we'll keep you in mind.
          </p>
          <a href="mailto:careers@fixit247.com.au">
            <button className="h-12 px-8 rounded-lg bg-black text-white font-bold text-[15px] hover:bg-[#1a1a1a] transition-colors">
              careers@fixit247.com.au
            </button>
          </a>
        </div>
      </section>
    </div>
  );
}
