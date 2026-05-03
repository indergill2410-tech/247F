import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MapPin } from "lucide-react";
import { searchSuburbs } from "@/data/au-suburbs";

interface SuburbInputProps {
  suburb: string;
  postcode: string;
  onSuburbChange: (suburb: string) => void;
  onPostcodeChange: (postcode: string) => void;
  suburbPlaceholder?: string;
  postcodePlaceholder?: string;
  suburbLabel?: string;
  postcodeLabel?: string;
  inputCls: string;
  labelCls?: string;
  required?: boolean;
  layout?: "grid" | "stacked";
}

export function SuburbInput({
  suburb,
  postcode,
  onSuburbChange,
  onPostcodeChange,
  suburbPlaceholder = "Bondi",
  postcodePlaceholder = "2026",
  suburbLabel = "Suburb",
  postcodeLabel = "Postcode",
  inputCls,
  labelCls,
  required,
  layout = "grid",
}: SuburbInputProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const suggestions = searchSuburbs(suburb, 8);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleSelect = (s: { suburb: string; postcode: string; state: string }) => {
    onSuburbChange(s.suburb);
    onPostcodeChange(s.postcode);
    setOpen(false);
  };

  const suburbField = (
    <div ref={ref} className="relative">
      {labelCls && <label className={labelCls}>{suburbLabel}{required && " *"}</label>}
      <div className="relative mt-1.5">
        <MapPin className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/30" />
        <input
          type="text"
          value={suburb}
          placeholder={suburbPlaceholder}
          required={required}
          autoComplete="off"
          className={`${inputCls} pl-9`}
          onChange={(e) => { onSuburbChange(e.target.value); setOpen(true); }}
          onFocus={() => { if (suggestions.length > 0) setOpen(true); }}
          aria-autocomplete="list"
          aria-expanded={open}
        />
      </div>
      <AnimatePresence>
        {open && suggestions.length > 0 && (
          <motion.ul
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.12 }}
            className="absolute z-50 top-full mt-1 w-full bg-[#1a1510] border border-white/15 rounded-xl shadow-xl overflow-hidden"
            role="listbox"
          >
            {suggestions.map((s) => (
              <li key={`${s.suburb}-${s.postcode}`} role="option">
                <button
                  type="button"
                  className="w-full text-left px-3 py-2.5 text-sm text-white/80 hover:bg-[#ffc800]/10 hover:text-white transition-colors flex items-center justify-between gap-2"
                  onMouseDown={(e) => { e.preventDefault(); handleSelect(s); }}
                >
                  <span className="flex items-center gap-2">
                    <MapPin className="h-3.5 w-3.5 text-[#ffc800] shrink-0" />
                    <span>{s.suburb}</span>
                    <span className="text-white/35 text-xs">{s.state}</span>
                  </span>
                  <span className="text-white/40 text-xs tabular-nums shrink-0">{s.postcode}</span>
                </button>
              </li>
            ))}
          </motion.ul>
        )}
      </AnimatePresence>
    </div>
  );

  const postcodeField = (
    <div>
      {labelCls && <label className={labelCls}>{postcodeLabel}</label>}
      <input
        type="text"
        value={postcode}
        placeholder={postcodePlaceholder}
        autoComplete="postal-code"
        maxLength={4}
        className={`${inputCls} mt-1.5`}
        onChange={(e) => onPostcodeChange(e.target.value.replace(/\D/g, ""))}
      />
    </div>
  );

  if (layout === "grid") {
    return (
      <div className="grid grid-cols-2 gap-4">
        {suburbField}
        {postcodeField}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {suburbField}
      {postcodeField}
    </div>
  );
}
