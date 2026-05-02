import { Link } from "wouter";
import { motion } from "framer-motion";
import { useListCategories } from "@workspace/api-client-react";
import { Footer } from "@/components/footer";
import {
  Wrench, Zap, Droplets, Home, TreePine, Wind, Hammer,
  PaintbrushIcon, ShieldCheck, Star, ChevronRight,
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

export default function CategoriesPage() {
  const { data: categories } = useListCategories();

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
          <span className="text-[#f5c518] text-sm font-bold uppercase tracking-widest">All services</span>
          <h1 className="text-5xl font-black mt-4 mb-5">Trade categories</h1>
          <p className="text-white/55 text-lg">
            Whatever needs fixing, we have a verified tradie for it. Browse all 12+ categories below.
          </p>
        </motion.div>
      </section>

      {/* Grid */}
      <section className="py-16 bg-[#0b0904]">
        <div className="container">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-5">
            {(categories ?? []).map((cat, i) => {
              const Icon = ICON_MAP[cat.icon ?? ""] ?? Wrench;
              return (
                <motion.div
                  key={cat.id}
                  initial={{ opacity: 0, y: 16 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.04 }}
                  viewport={{ once: true }}
                >
                  <Link href={`/signup?role=homeowner&category=${cat.id}`}>
                    <div className="group bg-white/5 border border-white/8 rounded-2xl p-7 flex flex-col items-center gap-4 hover:bg-white/10 hover:border-[#f5c518]/30 cursor-pointer transition-all">
                      <div className="w-16 h-16 rounded-2xl bg-[#f5c518]/10 border border-[#f5c518]/15 flex items-center justify-center group-hover:bg-[#f5c518]/20 transition-colors">
                        <Icon className="h-8 w-8 text-[#f5c518]" />
                      </div>
                      <div className="text-center">
                        <h3 className="font-bold text-white group-hover:text-[#f5c518] transition-colors">{cat.name}</h3>
                        {cat.description && (
                          <p className="text-white/40 text-xs mt-1 leading-snug line-clamp-2">{cat.description}</p>
                        )}
                      </div>
                      <span className="text-[#f5c518]/60 text-xs font-medium group-hover:text-[#f5c518] transition-colors flex items-center gap-1">
                        Post a job <ChevronRight className="h-3 w-3" />
                      </span>
                    </div>
                  </Link>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 bg-[#0e0c08] text-center border-t border-white/5">
        <div className="container max-w-xl">
          <h2 className="text-2xl font-black mb-3">Don't see your category?</h2>
          <p className="text-white/50 mb-7">Post a general handyman job and describe what you need — our tradies cover almost everything.</p>
          <Link href="/signup?role=homeowner">
            <button className="h-12 px-8 rounded-lg bg-[#f5c518] text-black font-bold text-[15px] hover:bg-[#e6b800] transition-colors">
              Post a job anyway →
            </button>
          </Link>
        </div>
      </section>

      <Footer />
    </div>
  );
}
