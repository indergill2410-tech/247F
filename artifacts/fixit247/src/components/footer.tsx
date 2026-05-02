import { Link } from "wouter";
import { Wrench } from "lucide-react";

const NAV_HOMEOWNERS = [
  { label: "Post a job", href: "/signup?role=homeowner" },
  { label: "How it works", href: "/how-it-works" },
  { label: "Browse trades", href: "/categories" },
  { label: "Sign in", href: "/login" },
];

const NAV_TRADIES = [
  { label: "Join free", href: "/signup?role=tradie" },
  { label: "How it works", href: "/how-it-works" },
  { label: "Sign in", href: "/login" },
];

const NAV_COMPANY = [
  { label: "About", href: "/about" },
  { label: "Careers", href: "/careers" },
  { label: "How it works", href: "/how-it-works" },
];

function FooterLinks({ items }: { items: { label: string; href: string }[] }) {
  return (
    <ul className="flex flex-col gap-2.5">
      {items.map((item) => (
        <li key={item.href}>
          <Link href={item.href}>
            <span className="text-sm text-white/40 hover:text-white/80 transition-colors cursor-pointer">
              {item.label}
            </span>
          </Link>
        </li>
      ))}
    </ul>
  );
}

export function Footer() {
  return (
    <footer className="bg-[#070604] border-t border-white/5 text-white">
      <div className="container py-14">
        {/* Top section — brand + link columns */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-10 pb-12 border-b border-white/5">
          {/* Brand */}
          <div className="col-span-2 md:col-span-1">
            <Link href="/">
              <span className="flex items-center gap-2 font-black text-white mb-4 cursor-pointer w-fit">
                <Wrench className="h-5 w-5 text-[#f5c518]" />
                <span>
                  Fixit <span className="text-[#f5c518]">24/7</span>
                </span>
              </span>
            </Link>
            <p className="text-sm text-white/35 leading-relaxed max-w-[200px]">
              Australia's on-demand home repair marketplace — verified tradies, 24/7.
            </p>
          </div>

          {/* Homeowners */}
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-white/30 mb-5">
              Homeowners
            </p>
            <FooterLinks items={NAV_HOMEOWNERS} />
          </div>

          {/* Tradies */}
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-white/30 mb-5">
              Tradies
            </p>
            <FooterLinks items={NAV_TRADIES} />
          </div>

          {/* Company */}
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-white/30 mb-5">
              Company
            </p>
            <FooterLinks items={NAV_COMPANY} />
          </div>
        </div>

        {/* Bottom row */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-white/30">
          <p>© {new Date().getFullYear()} Fixit 24/7. All rights reserved.</p>
          <div className="flex items-center gap-6">
            <span className="hover:text-white/60 transition-colors cursor-pointer">Privacy Policy</span>
            <span className="hover:text-white/60 transition-colors cursor-pointer">Terms of Service</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
