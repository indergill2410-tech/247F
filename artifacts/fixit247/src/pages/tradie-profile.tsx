import { usePageTitle } from "@/hooks/use-page-title";
import { useRoute, useLocation } from "wouter";
import { motion } from "framer-motion";
import { useGetTradieProfile } from "@workspace/api-client-react";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ChevronLeft, MapPin, Star, ShieldCheck, MessageSquare, Briefcase, Calendar,
  Droplets, Zap, Hammer, Paintbrush, Home, TreePine, Wind, Grid2X2,
  Layers, Sparkles, Bug, Lock, Wrench,
} from "lucide-react";
import { useAuth } from "@/hooks/use-auth";

const ICON_MAP: Record<string, React.ElementType> = {
  droplets: Droplets, zap: Zap, hammer: Hammer, paintbrush: Paintbrush,
  home: Home, "tree-pine": TreePine, wind: Wind, "grid-2x2": Grid2X2,
  layers: Layers, sparkles: Sparkles, bug: Bug, lock: Lock,
};

function CatIcon({ icon, className }: { icon: string; className?: string }) {
  const Icon = ICON_MAP[icon] ?? Wrench;
  return <Icon className={className ?? "h-3.5 w-3.5"} aria-hidden="true" />;
}

function initials(name: string) {
  return name.split(" ").filter(Boolean).slice(0, 2).map((w) => w[0].toUpperCase()).join("");
}

function timeAgo(date: string | Date) {
  const s = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
  if (s < 60) return "just now";
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  if (s < 2592000) return `${Math.floor(s / 86400)}d ago`;
  return new Date(date).toLocaleDateString("en-AU", { month: "short", year: "numeric" });
}

function StarFull({ n }: { n: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          className={`h-4 w-4 ${i <= n ? "text-[#ffc800] fill-[#ffc800]" : "text-white/15"}`}
        />
      ))}
    </div>
  );
}

const container = { hidden: {}, show: { transition: { staggerChildren: 0.06 } } };
const item = { hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0, transition: { duration: 0.22 } } };

export default function TradieProfilePage() {
  usePageTitle("Tradie Profile");
  const [, params] = useRoute("/tradies/:id");
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const tradieId = params?.id ? parseInt(params.id) : 0;

  const { data: tradie, isLoading, isError } = useGetTradieProfile(tradieId, {
    query: { enabled: !!tradieId, queryKey: ["tradie-profile", tradieId] },
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0b0904]">
        <div className="border-b border-white/6 bg-[#0f0c06] py-8">
          <div className="container max-w-4xl mx-auto px-4 sm:px-6">
            <Skeleton className="h-4 w-24 mb-5 bg-white/8" />
            <div className="flex items-center gap-5">
              <Skeleton className="w-20 h-20 rounded-2xl bg-white/8" />
              <div className="space-y-2">
                <Skeleton className="h-6 w-48 bg-white/8" />
                <Skeleton className="h-4 w-32 bg-white/5" />
                <Skeleton className="h-4 w-40 bg-white/5" />
              </div>
            </div>
          </div>
        </div>
        <div className="container max-w-4xl mx-auto px-4 sm:px-6 py-8 space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-28 w-full rounded-2xl bg-white/5" />
          ))}
        </div>
      </div>
    );
  }

  if (isError || !tradie) {
    return (
      <div className="min-h-screen bg-[#0b0904] flex items-center justify-center">
        <div className="text-center">
          <p className="text-white font-bold text-lg">Tradie not found</p>
          <button onClick={() => setLocation("/tradies")} className="mt-4 text-[#ffc800] text-sm hover:underline">
            Back to directory
          </button>
        </div>
      </div>
    );
  }

  const memberSince = new Date(tradie.createdAt).toLocaleDateString("en-AU", { month: "long", year: "numeric" });

  return (
    <div className="min-h-screen bg-[#0b0904]">
      {/* Header */}
      <div className="border-b border-white/6 bg-[#0f0c06] py-8">
        <div className="container max-w-4xl mx-auto px-4 sm:px-6">
          <button
            onClick={() => setLocation("/tradies")}
            className="flex items-center gap-1 text-white/40 hover:text-white text-sm mb-5 transition-colors"
          >
            <ChevronLeft className="h-4 w-4" /> Back to directory
          </button>

          <div className="flex items-start gap-5 flex-wrap">
            {tradie.avatarUrl ? (
              <img src={tradie.avatarUrl} alt={tradie.name} className="w-20 h-20 rounded-2xl object-cover flex-shrink-0" />
            ) : (
              <div className="w-20 h-20 rounded-2xl bg-[#ffc800] text-black font-black text-3xl flex items-center justify-center flex-shrink-0">
                {initials(tradie.name)}
              </div>
            )}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3 flex-wrap">
                <h1 className="text-2xl font-black text-white">{tradie.name}</h1>
                {tradie.isVerified && (
                  <span className="flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-xl bg-emerald-500/15 text-emerald-400 border border-emerald-500/20">
                    <ShieldCheck className="h-3.5 w-3.5" /> Verified Tradie
                  </span>
                )}
              </div>

              <div className="flex flex-wrap gap-4 mt-2 text-sm text-white/50">
                {tradie.suburb && (
                  <span className="flex items-center gap-1.5">
                    <MapPin className="h-4 w-4" />
                    {tradie.suburb}{tradie.postcode ? ` ${tradie.postcode}` : ""}
                  </span>
                )}
                {tradie.rating ? (
                  <span className="flex items-center gap-1.5">
                    <Star className="h-4 w-4 text-[#ffc800] fill-[#ffc800]" />
                    <span className="font-semibold text-white">{tradie.rating.toFixed(1)}</span>
                    <span>({tradie.reviewCount} review{tradie.reviewCount !== 1 ? "s" : ""})</span>
                  </span>
                ) : (
                  <span className="text-white/30 text-xs">No reviews yet</span>
                )}
                <span className="flex items-center gap-1.5">
                  <Calendar className="h-4 w-4" /> Member since {memberSince}
                </span>
              </div>

              {/* Trade categories */}
              {tradie.categories.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-3">
                  {tradie.categories.map((cat) => (
                    <span
                      key={cat.id}
                      className="flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-xl bg-[#ffc800]/10 border border-[#ffc800]/20 text-[#ffc800]"
                    >
                      <CatIcon icon={cat.icon ?? ""} /> {cat.name}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Contact CTA */}
            {user && user.role === "homeowner" && (
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setLocation("/post-job")}
                className="flex items-center gap-2 px-5 py-3 rounded-xl bg-[#ffc800] text-black font-bold text-sm hover:bg-[#e6b800] transition-colors flex-shrink-0"
              >
                <Briefcase className="h-4 w-4" /> Post a Job
              </motion.button>
            )}
            {user && user.role === "homeowner" && (
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setLocation("/messages")}
                className="flex items-center gap-2 px-5 py-3 rounded-xl border border-white/15 text-white/70 hover:text-white hover:border-white/30 font-semibold text-sm transition-all flex-shrink-0"
              >
                <MessageSquare className="h-4 w-4" /> Message
              </motion.button>
            )}
          </div>
        </div>
      </div>

      <div className="container max-w-4xl mx-auto px-4 sm:px-6 py-8">
        <motion.div variants={container} initial="hidden" animate="show" className="space-y-6">

          {/* Bio */}
          {tradie.bio && (
            <motion.div variants={item} className="bg-[#130f07] border border-white/6 rounded-2xl p-6">
              <h2 className="font-bold text-white mb-3">About</h2>
              <p className="text-sm text-white/60 leading-relaxed">{tradie.bio}</p>
            </motion.div>
          )}

          {/* Stats row */}
          <motion.div variants={item} className="grid grid-cols-3 gap-3">
            {[
              { label: "Reviews", value: tradie.reviewCount, icon: Star },
              { label: "Rating", value: tradie.rating ? tradie.rating.toFixed(1) : "—", icon: Star },
              { label: "Trade skills", value: tradie.categories.length, icon: Briefcase },
            ].map((s) => (
              <div key={s.label} className="bg-[#130f07] border border-white/6 rounded-2xl p-4 text-center">
                <p className="text-2xl font-black text-[#ffc800]">{s.value}</p>
                <p className="text-xs text-white/40 mt-0.5">{s.label}</p>
              </div>
            ))}
          </motion.div>

          {/* Reviews */}
          <motion.div variants={item} className="bg-[#130f07] border border-white/6 rounded-2xl overflow-hidden">
            <div className="px-6 py-4 border-b border-white/6 flex items-center justify-between">
              <h2 className="font-bold text-white">Reviews</h2>
              {tradie.reviews.length > 0 && (
                <span className="text-xs text-white/35">{tradie.reviews.length} shown</span>
              )}
            </div>
            {tradie.reviews.length === 0 ? (
              <div className="px-6 py-12 text-center">
                <Star className="h-10 w-10 mx-auto mb-3 text-white/15" />
                <p className="text-white/45 font-semibold">No reviews yet</p>
                <p className="text-xs text-white/30 mt-1">Be the first to work with {tradie.name.split(" ")[0]}</p>
              </div>
            ) : (
              <div className="divide-y divide-white/5">
                {tradie.reviews.map((review) => {
                  const ini = review.reviewerName
                    ? review.reviewerName.split(" ").filter(Boolean).slice(0, 2).map((w: string) => w[0].toUpperCase()).join("")
                    : "?";
                  return (
                    <div key={review.id} className="px-6 py-5">
                      <div className="flex items-start gap-3">
                        {review.reviewerAvatarUrl ? (
                          <img src={review.reviewerAvatarUrl} alt={review.reviewerName ?? ""} className="w-9 h-9 rounded-xl object-cover flex-shrink-0" />
                        ) : (
                          <div className="w-9 h-9 rounded-xl bg-blue-500/20 text-blue-300 font-bold text-sm flex items-center justify-center flex-shrink-0">
                            {ini}
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2 flex-wrap">
                            <p className="font-semibold text-sm text-white">{review.reviewerName ?? "Anonymous"}</p>
                            <span className="text-xs text-white/30">{timeAgo(review.createdAt)}</span>
                          </div>
                          <div className="mt-1">
                            <StarFull n={review.rating} />
                          </div>
                          {review.comment && (
                            <p className="text-sm text-white/55 mt-2 leading-relaxed">{review.comment}</p>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </motion.div>

        </motion.div>
      </div>
    </div>
  );
}
