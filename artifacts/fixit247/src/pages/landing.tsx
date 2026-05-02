import { Link } from "wouter";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { useListCategories } from "@workspace/api-client-react";
import { Wrench, Zap, Droplets, Home, TreePine, Wind, Hammer, PaintbrushIcon, ShieldCheck, Clock, Star, ChevronRight } from "lucide-react";

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

const STATS = [
  { label: "Jobs Completed", value: "12,400+" },
  { label: "Verified Tradies", value: "850+" },
  { label: "Avg Response Time", value: "< 2 hrs" },
  { label: "Customer Rating", value: "4.8 ★" },
];

const HOW_IT_WORKS = [
  {
    step: "1",
    title: "Post Your Job",
    desc: "Describe what needs fixing, set your urgency level, and upload photos. Takes under 2 minutes.",
    icon: Wrench,
  },
  {
    step: "2",
    title: "Get Matched",
    desc: "Our engine finds the top 5 local tradies with the right skills, availability, and ratings.",
    icon: Star,
  },
  {
    step: "3",
    title: "Hire & Done",
    desc: "Review offers, accept the best one, track progress, and pay securely when it's done.",
    icon: ShieldCheck,
  },
];

export default function LandingPage() {
  const { data: categories } = useListCategories();

  return (
    <div className="flex flex-col min-h-screen">
      {/* Hero */}
      <section className="relative bg-[hsl(222,47%,11%)] text-white overflow-hidden">
        <div className="absolute inset-0 opacity-10"
          style={{
            backgroundImage: "url(\"data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E\")",
          }}
        />
        <div className="container relative py-24 md:py-36 flex flex-col items-center text-center gap-6">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <Badge className="bg-[hsl(38,92%,50%)] text-white border-none mb-4 text-sm px-4 py-1">
              On-Demand Home Repair — Available 24/7
            </Badge>
            <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight leading-tight">
              Fix It Fast.<br />
              <span className="text-[hsl(38,92%,50%)]">Find Your Tradie.</span>
            </h1>
            <p className="mt-6 text-lg md:text-xl text-white/70 max-w-2xl mx-auto">
              Australia's #1 marketplace for on-demand home repairs. Post a job in minutes,
              get matched with top local tradies, and get it done — any time, any day.
            </p>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="flex flex-col sm:flex-row gap-4 mt-4"
          >
            <Link href="/register?role=homeowner">
              <Button size="lg" className="bg-[hsl(38,92%,50%)] hover:bg-[hsl(38,92%,44%)] text-white font-semibold px-8 h-12 text-base">
                Post a Job <ChevronRight className="ml-1 h-4 w-4" />
              </Button>
            </Link>
            <Link href="/register?role=tradie">
              <Button size="lg" variant="outline" className="border-white/30 text-white hover:bg-white/10 h-12 px-8 text-base">
                Join as a Tradie
              </Button>
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Stats */}
      <section className="bg-[hsl(38,92%,50%)] py-8">
        <div className="container grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
          {STATS.map((s) => (
            <div key={s.label}>
              <p className="text-2xl md:text-3xl font-bold text-white">{s.value}</p>
              <p className="text-white/80 text-sm mt-1">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Categories */}
      <section className="py-20 bg-background">
        <div className="container">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-foreground">What Do You Need Fixed?</h2>
            <p className="text-muted-foreground mt-3">Choose from 12+ trade categories</p>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {(categories ?? []).map((cat) => {
              const Icon = ICON_MAP[cat.icon ?? ""] ?? Wrench;
              return (
                <Link href={`/register?role=homeowner&category=${cat.id}`} key={cat.id}>
                  <Card className="hover:shadow-md hover:border-[hsl(38,92%,50%)] cursor-pointer transition-all group">
                    <CardContent className="flex flex-col items-center gap-2 py-6">
                      <div className="w-12 h-12 rounded-full bg-[hsl(222,47%,11%)] flex items-center justify-center group-hover:bg-[hsl(38,92%,50%)] transition-colors">
                        <Icon className="h-6 w-6 text-white" />
                      </div>
                      <span className="text-sm font-medium text-center leading-tight">{cat.name}</span>
                    </CardContent>
                  </Card>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-20 bg-muted/40">
        <div className="container">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold">How It Works</h2>
            <p className="text-muted-foreground mt-3">Three simple steps to get your home fixed</p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {HOW_IT_WORKS.map((step, i) => (
              <motion.div
                key={step.step}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.15 }}
                viewport={{ once: true }}
              >
                <Card className="text-center h-full">
                  <CardContent className="pt-8 pb-8 flex flex-col items-center gap-4">
                    <div className="w-16 h-16 rounded-full bg-[hsl(222,47%,11%)] flex items-center justify-center">
                      <step.icon className="h-8 w-8 text-[hsl(38,92%,50%)]" />
                    </div>
                    <div className="w-8 h-8 rounded-full bg-[hsl(38,92%,50%)] text-white text-sm font-bold flex items-center justify-center -mt-12 ml-12 self-start">
                      {step.step}
                    </div>
                    <h3 className="text-xl font-semibold">{step.title}</h3>
                    <p className="text-muted-foreground">{step.desc}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-[hsl(222,47%,11%)] text-white text-center">
        <div className="container max-w-2xl">
          <Clock className="h-12 w-12 text-[hsl(38,92%,50%)] mx-auto mb-4" />
          <h2 className="text-3xl font-bold">Emergency Repair? We're Ready Now.</h2>
          <p className="text-white/70 mt-4 text-lg">
            Burst pipe at 2am? Power outage on a Sunday? Our tradies are on call 24 hours a day, 7 days a week.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center mt-8">
            <Link href="/register?role=homeowner">
              <Button size="lg" className="bg-[hsl(38,92%,50%)] hover:bg-[hsl(38,92%,44%)] text-white font-semibold px-8 h-12">
                Post Emergency Job
              </Button>
            </Link>
            <Link href="/login">
              <Button size="lg" variant="outline" className="border-white/30 text-white hover:bg-white/10 h-12 px-8">
                Sign In
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
