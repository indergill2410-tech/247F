import { useState } from "react";
import { Link } from "wouter";
import { motion } from "framer-motion";
import { useListTradies, useListCategories } from "@workspace/api-client-react";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Search, MapPin, Star, ShieldCheck, Users, ChevronRight, X, SlidersHorizontal,
} from "lucide-react";

const container = { hidden: {}, show: { transition: { staggerChildren: 0.06 } } };
const item = { hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0, transition: { duration: 0.25 } } };

function initials(name: string) {
  return name.split(" ").filter(Boolean).slice(0, 2).map((w) => w[0].toUpperCase()).join("");
}

function StarRow({ rating, count }: { rating?: number | null; count: number }) {
  if (!rating) return <span className="text-xs text-white/30">No reviews yet</span>;
  return (
    <span className="flex items-center gap-1 text-xs text-white/55">
      <Star className="h-3 w-3 text-[#ffc800] fill-[#ffc800]" />
      <span className="font-semibold text-white/75">{rating.toFixed(1)}</span>
      <span className="text-white/35">({count} review{count !== 1 ? "s" : ""})</span>
    </span>
  );
}

export default function TradiesPage() {
  const [search, setSearch] = useState("");
  const [categoryId, setCategoryId] = useState<number | undefined>();
  const [suburb, setSuburb] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [searchTimer, setSearchTimer] = useState<ReturnType<typeof setTimeout> | null>(null);

  const { data: cats } = useListCategories();
  const { data, isLoading } = useListTradies({
    search: debouncedSearch || undefined,
    categoryId,
    suburb: suburb || undefined,
    limit: 24,
  });

  const tradies = data?.tradies ?? [];
  const total = data?.total ?? 0;

  function onSearchChange(val: string) {
    setSearch(val);
    if (searchTimer) clearTimeout(searchTimer);
    setSearchTimer(setTimeout(() => setDebouncedSearch(val), 350));
  }

  const activeFilters = [
    debouncedSearch && { label: `"${debouncedSearch}"`, clear: () => { setSearch(""); setDebouncedSearch(""); } },
    categoryId && { label: cats?.find((c) => c.id === categoryId)?.name ?? "Category", clear: () => setCategoryId(undefined) },
    suburb && { label: suburb, clear: () => setSuburb("") },
  ].filter(Boolean) as { label: string; clear: () => void }[];

  return (
    <div className="min-h-screen bg-[#0b0904]">
      {/* Header */}
      <div className="border-b border-white/6 bg-[#0f0c06] py-8">
        <div className="container max-w-6xl mx-auto px-4 sm:px-6">
          <div className="flex items-center gap-3 mb-1">
            <Users className="h-5 w-5 text-[#ffc800]" />
            <h1 className="text-2xl font-black text-white">Find a Tradie</h1>
          </div>
          <p className="text-white/40 text-sm ml-8">Browse {total > 0 ? `${total} ` : ""}verified local tradespeople</p>
        </div>
      </div>

      <div className="container max-w-6xl mx-auto px-4 sm:px-6 py-6 space-y-5">
        {/* Filters */}
        <div className="bg-[#130f07] border border-white/6 rounded-2xl p-4 space-y-3">
          <div className="flex gap-3 flex-wrap">
            {/* Search */}
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/30" />
              <input
                value={search}
                onChange={(e) => onSearchChange(e.target.value)}
                placeholder="Search by name or bio…"
                className="w-full pl-9 pr-4 py-2.5 bg-white/5 border border-white/8 rounded-xl text-sm text-white placeholder:text-white/25 focus:outline-none focus:border-[#ffc800]/50 transition-colors"
              />
              {search && (
                <button onClick={() => onSearchChange("")} className="absolute right-3 top-1/2 -translate-y-1/2">
                  <X className="h-3.5 w-3.5 text-white/30 hover:text-white/60" />
                </button>
              )}
            </div>

            {/* Suburb */}
            <div className="relative min-w-[150px]">
              <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/30" />
              <input
                value={suburb}
                onChange={(e) => setSuburb(e.target.value)}
                placeholder="Suburb…"
                className="w-full pl-9 pr-4 py-2.5 bg-white/5 border border-white/8 rounded-xl text-sm text-white placeholder:text-white/25 focus:outline-none focus:border-[#ffc800]/50 transition-colors"
              />
            </div>
          </div>

          {/* Category pills */}
          {cats && cats.length > 0 && (
            <div className="flex gap-2 flex-wrap">
              <button
                onClick={() => setCategoryId(undefined)}
                className={`h-8 px-3 rounded-xl text-xs font-semibold transition-all border ${
                  !categoryId ? "bg-[#ffc800] text-black border-[#ffc800]" : "bg-white/4 border-white/8 text-white/50 hover:bg-white/8"
                }`}
              >
                All trades
              </button>
              {cats.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setCategoryId(categoryId === cat.id ? undefined : cat.id)}
                  className={`h-8 px-3 rounded-xl text-xs font-semibold transition-all border flex items-center gap-1.5 ${
                    categoryId === cat.id
                      ? "bg-[#ffc800] text-black border-[#ffc800]"
                      : "bg-white/4 border-white/8 text-white/50 hover:bg-white/8"
                  }`}
                >
                  <span>{cat.icon}</span>
                  {cat.name}
                </button>
              ))}
            </div>
          )}

          {/* Active filter chips */}
          {activeFilters.length > 0 && (
            <div className="flex items-center gap-2 pt-1 flex-wrap">
              <SlidersHorizontal className="h-3.5 w-3.5 text-white/30" />
              {activeFilters.map((f, i) => (
                <motion.button
                  key={i}
                  initial={{ scale: 0.85, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  onClick={f.clear}
                  className="flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full bg-[#ffc800]/15 text-[#ffc800] border border-[#ffc800]/25 hover:bg-[#ffc800]/25 transition-all"
                >
                  {f.label} <X className="h-3 w-3" />
                </motion.button>
              ))}
              <button onClick={() => { onSearchChange(""); setCategoryId(undefined); setSuburb(""); }} className="text-xs text-white/30 hover:text-white/60 underline underline-offset-2 transition-colors">
                Clear all
              </button>
            </div>
          )}
        </div>

        {/* Results */}
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="bg-[#130f07] border border-white/6 rounded-2xl p-5 space-y-3">
                <div className="flex items-center gap-3">
                  <Skeleton className="w-14 h-14 rounded-2xl bg-white/8" />
                  <div className="space-y-2 flex-1">
                    <Skeleton className="h-4 w-32 bg-white/8" />
                    <Skeleton className="h-3 w-24 bg-white/5" />
                  </div>
                </div>
                <Skeleton className="h-3 w-full bg-white/5" />
                <Skeleton className="h-3 w-3/4 bg-white/5" />
              </div>
            ))}
          </div>
        ) : tradies.length === 0 ? (
          <div className="bg-[#130f07] border border-white/6 rounded-2xl p-16 text-center">
            <Users className="h-12 w-12 mx-auto mb-4 text-white/20" />
            <p className="font-bold text-white/60 text-lg">No tradies found</p>
            <p className="text-white/35 text-sm mt-1">Try adjusting your filters</p>
          </div>
        ) : (
          <motion.div
            variants={container}
            initial="hidden"
            animate="show"
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
          >
            {tradies.map((tradie) => (
              <motion.div key={tradie.id} variants={item} whileHover={{ y: -2 }}>
                <Link href={`/tradies/${tradie.id}`}>
                  <div className="bg-[#130f07] border border-white/6 hover:border-[#ffc800]/30 rounded-2xl p-5 cursor-pointer transition-all h-full flex flex-col group">
                    <div className="flex items-start gap-3 mb-3">
                      {tradie.avatarUrl ? (
                        <img src={tradie.avatarUrl} alt={tradie.name} className="w-14 h-14 rounded-2xl object-cover flex-shrink-0" />
                      ) : (
                        <div className="w-14 h-14 rounded-2xl bg-[#ffc800] text-black font-black text-xl flex items-center justify-center flex-shrink-0">
                          {initials(tradie.name)}
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="font-bold text-white text-sm group-hover:text-[#ffc800] transition-colors">{tradie.name}</p>
                          {tradie.isVerified && (
                            <span className="flex items-center gap-0.5 text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-emerald-500/15 text-emerald-400">
                              <ShieldCheck className="h-2.5 w-2.5" /> Verified
                            </span>
                          )}
                        </div>
                        {tradie.suburb && (
                          <span className="flex items-center gap-1 text-xs text-white/40 mt-0.5">
                            <MapPin className="h-3 w-3" /> {tradie.suburb}
                          </span>
                        )}
                        <div className="mt-1">
                          <StarRow rating={tradie.rating} count={tradie.reviewCount} />
                        </div>
                      </div>
                    </div>

                    {tradie.bio && (
                      <p className="text-xs text-white/45 leading-relaxed line-clamp-2 mb-3">{tradie.bio}</p>
                    )}

                    {tradie.categories.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mb-3">
                        {tradie.categories.slice(0, 4).map((cat) => (
                          <span key={cat.id} className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-white/6 border border-white/8 text-white/50 flex items-center gap-1">
                            <span>{cat.icon}</span> {cat.name}
                          </span>
                        ))}
                        {tradie.categories.length > 4 && (
                          <span className="text-[10px] text-white/30 py-0.5">+{tradie.categories.length - 4} more</span>
                        )}
                      </div>
                    )}

                    <div className="mt-auto pt-2 flex items-center justify-between">
                      <span className="text-xs text-white/30">
                        {tradie.reviewCount} job{tradie.reviewCount !== 1 ? "s" : ""} completed
                      </span>
                      <ChevronRight className="h-4 w-4 text-white/25 group-hover:text-[#ffc800] transition-colors" />
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </motion.div>
        )}
      </div>
    </div>
  );
}
