/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from "react";
import { motion } from "motion/react";
import {
  ArrowRight,
  Check,
  ChevronDown,
  Droplets,
  Globe,
  Heart,
  Instagram,
  Leaf,
  Mail,
  MapPin,
  Menu,
  Package,
  ScanLine,
  ShieldCheck,
  Sparkles,
  Sprout,
  Store,
  Users,
  X,
} from "lucide-react";
import { cn } from "@/src/lib/utils";

const WHATSAPP_NUMBER = "254717578394";
const WHATSAPP_BASE = `https://wa.me/${WHATSAPP_NUMBER}`;

const whatsappUrl = (message: string) =>
  `${WHATSAPP_BASE}?text=${encodeURIComponent(message)}`;

type Theme = "nature" | "luxury";
type FormStatus = "idle" | "submitting" | "success" | "error";

interface FadeInProps {
  children: React.ReactNode;
  className?: string;
  delay?: number;
  key?: React.Key;
}

const FadeIn = ({ children, className, delay = 0 }: FadeInProps) => (
  <motion.div
    initial={{ opacity: 0, y: 28 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true, margin: "-80px" }}
    transition={{ duration: 0.65, delay, ease: [0.22, 1, 0.36, 1] }}
    className={className}
  >
    {children}
  </motion.div>
);

const Section = ({
  children,
  className,
  id,
}: {
  children: React.ReactNode;
  className?: string;
  id?: string;
}) => (
  <section id={id} className={cn("scroll-mt-24 px-6 py-20 md:px-12 lg:px-24 lg:py-28", className)}>
    <div className="mx-auto max-w-7xl">{children}</div>
  </section>
);

const Logo = ({ theme }: { theme: Theme }) => (
  <a href="/" className="group flex items-center gap-3" aria-label="Asili home">
    <span
      className={cn(
        "flex h-10 w-10 items-center justify-center rounded-2xl transition-transform group-hover:rotate-6",
        theme === "luxury" ? "bg-asili-gold text-asili-black" : "bg-asili-green text-white",
      )}
    >
      <Leaf className="h-5 w-5" aria-hidden="true" />
    </span>
    <span>
      <span
        className={cn(
          "block font-serif text-2xl font-bold leading-none",
          theme === "luxury" ? "text-asili-cream" : "text-asili-green",
        )}
      >
        Asili
      </span>
      <span
        className={cn(
          "mt-1 block text-[8px] font-bold uppercase tracking-[0.32em]",
          theme === "luxury" ? "text-asili-gold/80" : "text-asili-earth/70",
        )}
      >
        Origin · Wellness
      </span>
    </span>
  </a>
);

const Header = ({ theme, page }: { theme: Theme; page: "home" | "honey" }) => {
  const [isOpen, setIsOpen] = useState(false);

  const links =
    page === "home"
      ? [
          ["Honey", "#honey"],
          ["Our story", "#story"],
          ["Why Asili", "#why-asili"],
          ["Traceability", "#traceability"],
          ["Partners", "#partners"],
        ]
      : [
          ["The honey", "#the-honey"],
          ["Origin", "#origin"],
          ["Traceability", "#traceability"],
          ["FAQ", "#faq"],
        ];

  return (
    <header
      className={cn(
        "fixed inset-x-0 top-0 z-50 border-b backdrop-blur-xl",
        theme === "luxury"
          ? "border-asili-gold/10 bg-asili-black/90"
          : "border-asili-honey/10 bg-asili-cream/90",
      )}
    >
      <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-6 md:px-12">
        <Logo theme={theme} />

        <nav className="hidden items-center gap-7 lg:flex" aria-label="Main navigation">
          {links.map(([label, href]) => (
            <a
              key={href}
              href={href}
              className={cn(
                "text-[11px] font-bold uppercase tracking-[0.16em] transition-colors",
                theme === "luxury"
                  ? "text-asili-cream/65 hover:text-asili-gold"
                  : "text-asili-green/65 hover:text-asili-green",
              )}
            >
              {label}
            </a>
          ))}
        </nav>

        <div className="hidden items-center gap-3 lg:flex">
          <a
            href={page === "home" ? "/honey/" : "/"}
            className={cn(
              "rounded-full px-5 py-3 text-[10px] font-bold uppercase tracking-widest transition-colors",
              theme === "luxury"
                ? "border border-asili-gold/30 text-asili-gold hover:bg-asili-gold/10"
                : "border border-asili-green/15 text-asili-green hover:bg-asili-green/5",
            )}
          >
            {page === "home" ? "Explore honey" : "About Asili"}
          </a>
          <a
            href={whatsappUrl("Hello Asili, I would like to order your Makueni honey. Please share the available sizes, prices and delivery options.")}
            target="_blank"
            rel="noopener noreferrer"
            className={cn(
              "rounded-full px-5 py-3 text-[10px] font-black uppercase tracking-widest transition-transform hover:-translate-y-0.5",
              theme === "luxury" ? "bg-asili-gold text-asili-black" : "bg-asili-green text-white",
            )}
          >
            Buy our honey
          </a>
        </div>

        <button
          type="button"
          className={cn(
            "rounded-xl p-2 lg:hidden",
            theme === "luxury" ? "text-asili-gold" : "text-asili-green",
          )}
          aria-label={isOpen ? "Close menu" : "Open menu"}
          aria-expanded={isOpen}
          onClick={() => setIsOpen((current) => !current)}
        >
          {isOpen ? <X aria-hidden="true" /> : <Menu aria-hidden="true" />}
        </button>
      </div>

      {isOpen && (
        <nav
          className={cn(
            "border-t px-6 pb-7 pt-5 lg:hidden",
            theme === "luxury"
              ? "border-asili-gold/10 bg-asili-black"
              : "border-asili-honey/10 bg-asili-cream",
          )}
          aria-label="Mobile navigation"
        >
          <div className="mx-auto flex max-w-7xl flex-col gap-4">
            {links.map(([label, href]) => (
              <a
                key={href}
                href={href}
                onClick={() => setIsOpen(false)}
                className={cn(
                  "py-1 text-sm font-bold",
                  theme === "luxury" ? "text-asili-cream" : "text-asili-green",
                )}
              >
                {label}
              </a>
            ))}
            <div className="mt-2 grid grid-cols-2 gap-3">
              <a
                href={page === "home" ? "/honey/" : "/"}
                className={cn(
                  "rounded-full border px-4 py-3 text-center text-[10px] font-bold uppercase tracking-wider",
                  theme === "luxury"
                    ? "border-asili-gold/30 text-asili-gold"
                    : "border-asili-green/20 text-asili-green",
                )}
              >
                {page === "home" ? "Explore honey" : "About Asili"}
              </a>
              <a
                href={whatsappUrl("Hello Asili, I would like to order your Makueni honey. Please share the available sizes, prices and delivery options.")}
                target="_blank"
                rel="noopener noreferrer"
                className={cn(
                  "rounded-full px-4 py-3 text-center text-[10px] font-black uppercase tracking-wider",
                  theme === "luxury" ? "bg-asili-gold text-asili-black" : "bg-asili-green text-white",
                )}
              >
                Buy honey
              </a>
            </div>
          </div>
        </nav>
      )}
    </header>
  );
};

const HoneyJarIllustration = ({ dark = false }: { dark?: boolean }) => (
  <div className="relative mx-auto aspect-square w-full max-w-[560px]" aria-hidden="true">
    <motion.div
      animate={{ rotate: [0, 2, 0, -2, 0] }}
      transition={{ duration: 18, repeat: Infinity, ease: "easeInOut" }}
      className={cn(
        "absolute inset-[8%] rounded-[42%_58%_48%_52%/48%_38%_62%_52%]",
        dark ? "bg-asili-gold/10" : "bg-asili-honey/15",
      )}
    />
    <svg viewBox="0 0 520 520" className="relative h-full w-full drop-shadow-2xl">
      <defs>
        <linearGradient id={dark ? "jarGoldDark" : "jarGoldLight"} x1="0" x2="1" y1="0" y2="1">
          <stop offset="0" stopColor="#f4d03f" />
          <stop offset="0.55" stopColor="#c99524" />
          <stop offset="1" stopColor="#8b5d12" />
        </linearGradient>
        <linearGradient id={dark ? "glassDark" : "glassLight"} x1="0" x2="1">
          <stop offset="0" stopColor="#ffffff" stopOpacity="0.48" />
          <stop offset="0.35" stopColor="#ffffff" stopOpacity="0.08" />
          <stop offset="1" stopColor="#ffffff" stopOpacity="0.18" />
        </linearGradient>
      </defs>
      <motion.g
        initial={{ y: 8 }}
        animate={{ y: [-4, 6, -4] }}
        transition={{ duration: 7, repeat: Infinity, ease: "easeInOut" }}
      >
        <path d="M173 150h174l18 52v196c0 34-25 60-57 60h-96c-32 0-57-26-57-60V202l18-52Z" fill={`url(#${dark ? "jarGoldDark" : "jarGoldLight"})`} />
        <path d="M166 143c0-12 10-22 22-22h144c12 0 22 10 22 22v30H166v-30Z" fill={dark ? "#d4af37" : "#1a3a1e"} />
        <path d="M176 153h168" stroke={dark ? "#0a0a0a" : "#f9f7f2"} strokeOpacity="0.45" strokeWidth="3" />
        <path d="M190 209c-10 67-10 138 0 210" fill="none" stroke={`url(#${dark ? "glassDark" : "glassLight"})`} strokeWidth="14" strokeLinecap="round" />
        <rect x="194" y="254" width="132" height="112" rx="18" fill={dark ? "#0a0a0a" : "#f9f7f2"} />
        <path d="m260 277 25 15v29l-25 15-25-15v-29l25-15Z" fill="none" stroke={dark ? "#d4af37" : "#1a3a1e"} strokeWidth="3" />
        <path d="M248 308c11-20 28-15 29-31 11 20 3 39-17 46-16-5-22-20-12-35 1 9 6 13 12 15" fill={dark ? "#d4af37" : "#1a3a1e"} />
        <text x="260" y="350" textAnchor="middle" fontFamily="serif" fontSize="13" fontWeight="700" letterSpacing="4" fill={dark ? "#d4af37" : "#1a3a1e"}>ASILI</text>
      </motion.g>
      {[0, 1, 2, 3, 4].map((i) => (
        <motion.circle
          key={i}
          cx={82 + i * 88}
          cy={110 + (i % 2) * 24}
          r={4 + (i % 2) * 2}
          fill={dark ? "#d4af37" : "#c5a059"}
          animate={{ y: [0, -12, 0], opacity: [0.35, 0.9, 0.35] }}
          transition={{ duration: 3.5 + i * 0.35, repeat: Infinity, delay: i * 0.25 }}
        />
      ))}
    </svg>
    <div
      className={cn(
        "absolute bottom-[8%] left-[5%] rounded-2xl border px-4 py-3 shadow-xl backdrop-blur-md",
        dark
          ? "border-asili-gold/20 bg-asili-black/80 text-asili-gold"
          : "border-asili-honey/20 bg-white/80 text-asili-green",
      )}
    >
      <span className="block text-[8px] font-bold uppercase tracking-[0.25em] opacity-60">Origin</span>
      <span className="mt-1 flex items-center gap-1.5 text-xs font-bold">
        <MapPin className="h-3.5 w-3.5" /> Makueni, Kenya
      </span>
    </div>
  </div>
);

const TraceabilityCard = ({ compact = false }: { compact?: boolean }) => {
  const fields = [
    { label: "Source", value: "Makueni, Kenya", icon: <MapPin aria-hidden="true" /> },
    { label: "Quality check", value: "Moisture reading", icon: <Droplets aria-hidden="true" /> },
    { label: "Record", value: "Batch reference", icon: <ScanLine aria-hidden="true" /> },
    { label: "Handling", value: "Harvest notes", icon: <Leaf aria-hidden="true" /> },
  ];

  return (
    <div className="relative overflow-hidden rounded-[2.5rem] border border-asili-gold/20 bg-asili-black p-7 text-asili-cream shadow-2xl md:p-10 lg:rounded-[3.5rem] lg:p-12">
      <div className="absolute -right-24 -top-24 h-64 w-64 rounded-full bg-asili-gold/10 blur-3xl" />
      <div className="relative">
        <div className="mb-9 flex flex-col justify-between gap-5 sm:flex-row sm:items-start">
          <div>
            <div className="mb-3 flex items-center gap-2 text-asili-gold">
              <span className="h-2 w-2 rounded-full bg-asili-gold" />
              <span className="text-[9px] font-black uppercase tracking-[0.35em]">Traceability preview</span>
            </div>
            <h3 className="text-3xl font-bold sm:text-4xl">The Glass Hive</h3>
            <p className="mt-2 max-w-xl text-sm leading-relaxed text-asili-cream/65">
              Our batch-passport system is being built to connect eligible jars with clear origin and quality information.
            </p>
          </div>
          <div className="w-fit rounded-xl border border-asili-gold/20 bg-asili-gold/10 px-4 py-2 font-mono">
            <span className="block text-[7px] uppercase tracking-widest text-asili-gold/60">Sample record</span>
            <span className="text-xs font-bold text-asili-gold">DEMO-MAK-01</span>
          </div>
        </div>

        <div className={cn("grid gap-3", compact ? "sm:grid-cols-2" : "sm:grid-cols-2 lg:grid-cols-4")}>
          {fields.map((field) => (
            <div key={field.label} className="rounded-2xl border border-white/8 bg-white/[0.035] p-5">
              <div className="mb-5 h-5 w-5 text-asili-gold [&_svg]:h-5 [&_svg]:w-5">{field.icon}</div>
              <span className="block text-[8px] font-bold uppercase tracking-[0.2em] text-white/45">{field.label}</span>
              <span className="mt-2 block text-sm font-bold text-asili-cream">{field.value}</span>
            </div>
          ))}
        </div>

        <div className="mt-7 flex flex-col justify-between gap-4 border-t border-white/8 pt-6 sm:flex-row sm:items-center">
          <p className="max-w-2xl text-xs leading-relaxed text-asili-cream/50">
            Demo only. Actual records will vary by batch and will only display information that has been captured and reviewed.
          </p>
          <a
            href="/b/SAMPLE-2604-01.html"
            className="inline-flex shrink-0 items-center gap-2 text-[10px] font-black uppercase tracking-widest text-asili-gold hover:text-asili-gold-light"
          >
            View sample passport <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </a>
        </div>
      </div>
    </div>
  );
};

const ContactForm = ({ theme, type }: { theme: Theme; type: string }) => {
  const [status, setStatus] = useState<FormStatus>("idle");

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setStatus("submitting");
    const form = event.currentTarget;
    const payload = Object.fromEntries(new FormData(form).entries());

    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...payload, type }),
      });

      if (!response.ok) throw new Error("Request failed");
      setStatus("success");
      form.reset();
    } catch {
      setStatus("error");
    }
  };

  const inputClass = cn(
    "w-full rounded-2xl border px-5 py-4 text-sm outline-none transition-colors placeholder:opacity-50",
    theme === "luxury"
      ? "border-white/10 bg-white/[0.04] text-asili-cream focus:border-asili-gold/60"
      : "border-asili-green/10 bg-white text-asili-green focus:border-asili-honey",
  );

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <label className="sr-only" htmlFor={`${type}-name`}>Name</label>
        <input id={`${type}-name`} name="name" type="text" required autoComplete="name" placeholder="Your name" className={inputClass} />
        <label className="sr-only" htmlFor={`${type}-email`}>Email</label>
        <input id={`${type}-email`} name="email" type="email" required autoComplete="email" placeholder="Email address" className={inputClass} />
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <label className="sr-only" htmlFor={`${type}-phone`}>Phone number</label>
        <input id={`${type}-phone`} name="phone" type="tel" autoComplete="tel" placeholder="Phone number (optional)" className={inputClass} />
        <label className="sr-only" htmlFor={`${type}-interest`}>Area of interest</label>
        <select id={`${type}-interest`} name="interest" required defaultValue="" className={inputClass}>
          <option value="" disabled>What can we help with?</option>
          <option>Personal honey order</option>
          <option>Retail stocking</option>
          <option>Bulk honey</option>
          <option>Corporate gifting</option>
          <option>Distribution partnership</option>
          <option>Investment or grant partnership</option>
          <option>Other inquiry</option>
        </select>
      </div>
      <label className="sr-only" htmlFor={`${type}-message`}>Message</label>
      <textarea id={`${type}-message`} name="message" rows={4} required placeholder="Tell us what you need" className={inputClass} />
      <button
        type="submit"
        disabled={status === "submitting"}
        className={cn(
          "flex w-full items-center justify-center gap-2 rounded-full px-6 py-4 text-[11px] font-black uppercase tracking-widest transition-transform hover:-translate-y-0.5 disabled:cursor-wait disabled:opacity-60",
          theme === "luxury" ? "bg-asili-gold text-asili-black" : "bg-asili-green text-white",
        )}
      >
        {status === "submitting" ? "Sending…" : status === "success" ? "Message sent" : "Send inquiry"}
        {status === "success" ? <Check className="h-4 w-4" aria-hidden="true" /> : <ArrowRight className="h-4 w-4" aria-hidden="true" />}
      </button>
      {status === "error" && (
        <p role="alert" className="text-center text-xs text-red-500">
          We could not send that message. Please try WhatsApp or email us instead.
        </p>
      )}
      <p className={cn("text-center text-[10px] leading-relaxed", theme === "luxury" ? "text-white/40" : "text-asili-green/50")}>
        We use your details only to respond to this inquiry. We do not sell your information.
      </p>
    </form>
  );
};

const HomePage = () => {
  return (
    <>
      <Header theme="nature" page="home" />
      <main id="main-content">
        <section className="relative overflow-hidden px-6 pb-20 pt-32 md:px-12 lg:min-h-screen lg:px-24 lg:pb-24 lg:pt-36">
          <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_78%_34%,rgba(197,160,89,0.16),transparent_34%),radial-gradient(circle_at_15%_15%,rgba(45,90,39,0.08),transparent_30%)]" />
          <div className="mx-auto grid max-w-7xl items-center gap-8 lg:grid-cols-[1.05fr_0.95fr] lg:gap-12">
            <div>
              <FadeIn>
                <div className="mb-6 flex items-center gap-3 text-asili-earth">
                  <span className="h-px w-10 bg-asili-honey" />
                  <span className="text-[10px] font-black uppercase tracking-[0.35em]">African roots · Makueni origin</span>
                </div>
                <h1 className="max-w-4xl text-5xl font-bold leading-[0.96] tracking-[-0.045em] text-asili-green sm:text-6xl lg:text-[5.4rem] xl:text-[6.2rem]">
                  Raw Makueni honey. <span className="italic text-asili-honey">Clear from the start.</span>
                </h1>
                <p className="mt-7 max-w-2xl text-base leading-relaxed text-asili-green/70 sm:text-lg">
                  Asili is a Kenyan eco-wellness brand starting with responsibly sourced honey from Makueni—and building clearer origin and batch-quality information around every jar.
                </p>
                <div className="mt-9 flex flex-col gap-3 sm:flex-row">
                  <a
                    href={whatsappUrl("Hello Asili, I would like to order your Makueni honey. Please share the available sizes, prices and delivery options.")}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group inline-flex items-center justify-center gap-3 rounded-full bg-asili-green px-8 py-4 text-sm font-bold text-white shadow-[0_18px_40px_rgba(26,58,30,0.18)] transition-transform hover:-translate-y-1"
                  >
                    Buy Asili honey <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" aria-hidden="true" />
                  </a>
                  <a
                    href="/honey/#traceability"
                    className="inline-flex items-center justify-center gap-3 rounded-full border border-asili-green/15 bg-white/60 px-8 py-4 text-sm font-bold text-asili-green backdrop-blur hover:border-asili-honey"
                  >
                    See how we verify it
                  </a>
                </div>
                <div className="mt-10 grid max-w-xl grid-cols-3 gap-4 border-t border-asili-green/10 pt-6">
                  {[
                    ["Makueni", "Sourced in Kenya"],
                    ["Honey first", "One focused offer"],
                    ["In rollout", "Batch passports"],
                  ].map(([value, label]) => (
                    <div key={value}>
                      <span className="block text-sm font-bold text-asili-green">{value}</span>
                      <span className="mt-1 block text-[9px] font-bold uppercase tracking-wider text-asili-green/45">{label}</span>
                    </div>
                  ))}
                </div>
              </FadeIn>
            </div>
            <FadeIn delay={0.15} className="lg:pl-4">
              <HoneyJarIllustration />
            </FadeIn>
          </div>
        </section>

        <Section id="honey" className="bg-white">
          <div className="grid items-center gap-12 lg:grid-cols-[0.9fr_1.1fr] lg:gap-20">
            <FadeIn>
              <div className="relative overflow-hidden rounded-[3rem] bg-asili-green p-8 text-white sm:p-12">
                <div className="absolute -right-20 -top-20 h-52 w-52 rounded-full border-[30px] border-asili-honey/10" />
                <span className="relative text-[9px] font-black uppercase tracking-[0.3em] text-asili-honey">Available now</span>
                <h2 className="relative mt-5 text-4xl font-bold sm:text-5xl">Asili Raw Makueni Honey</h2>
                <p className="relative mt-5 max-w-xl leading-relaxed text-white/70">
                  A honey-first beginning for Asili: locally rooted, carefully handled, and offered with a commitment to clearer origin information.
                </p>
                <div className="relative mt-8 flex flex-wrap gap-2">
                  {["Makueni origin", "Everyday pantry staple", "Order directly on WhatsApp"].map((item) => (
                    <span key={item} className="rounded-full border border-white/15 bg-white/5 px-4 py-2 text-[10px] font-bold uppercase tracking-wider text-white/80">
                      {item}
                    </span>
                  ))}
                </div>
              </div>
            </FadeIn>
            <FadeIn delay={0.1}>
              <div className="mb-5 flex items-center gap-3 text-asili-earth">
                <Package className="h-5 w-5 text-asili-honey" aria-hidden="true" />
                <span className="text-[10px] font-black uppercase tracking-[0.3em]">Our flagship product</span>
              </div>
              <h2 className="text-4xl font-bold leading-tight text-asili-green sm:text-6xl">
                One product, explained <span className="italic text-asili-honey">properly.</span>
              </h2>
              <p className="mt-6 max-w-2xl text-base leading-relaxed text-asili-green/65">
                We are starting with honey because focus builds trust. Ask us directly about current jar sizes, prices, availability and delivery—we will confirm what is ready before you order.
              </p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <a href="/honey/" className="group inline-flex items-center justify-center gap-2 rounded-full bg-asili-honey px-7 py-4 text-sm font-bold text-asili-green">
                  Explore the honey <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" aria-hidden="true" />
                </a>
                <a
                  href={whatsappUrl("Hello Asili, I would like to order your Makueni honey. Please share the available sizes, prices and delivery options.")}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center rounded-full border border-asili-green/15 px-7 py-4 text-sm font-bold text-asili-green"
                >
                  Ask about sizes & prices
                </a>
              </div>
            </FadeIn>
          </div>
        </Section>

        <Section id="story">
          <div className="grid gap-12 lg:grid-cols-2 lg:gap-20">
            <FadeIn>
              <span className="text-[10px] font-black uppercase tracking-[0.3em] text-asili-earth">The story behind Asili</span>
              <h2 className="mt-5 text-4xl font-bold leading-tight text-asili-green sm:text-6xl">Rooted in origin. Built for trust.</h2>
            </FadeIn>
            <FadeIn delay={0.1} className="space-y-5 text-base leading-relaxed text-asili-green/65">
              <p>
                “Asili” speaks to origin and essence. The brand was created around a simple belief: products rooted in African landscapes should reach people with their story, source and value intact.
              </p>
              <p>
                Our first chapter begins in Makueni with honey. We are building a focused route from source to customer, while developing practical batch records that can make quality information easier to understand.
              </p>
              <p className="border-l-2 border-asili-honey pl-5 font-serif text-xl italic text-asili-green">
                Start with one honest product. Learn from every batch. Grow without losing the origin.
              </p>
            </FadeIn>
          </div>
        </Section>

        <Section id="why-asili" className="bg-asili-green text-white">
          <FadeIn className="mx-auto max-w-3xl text-center">
            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-asili-honey">What makes Asili different</span>
            <h2 className="mt-5 text-4xl font-bold sm:text-6xl">Three commitments behind every next step.</h2>
          </FadeIn>
          <div className="mt-14 grid gap-5 md:grid-cols-3">
            {[
              {
                icon: <MapPin aria-hidden="true" />,
                title: "Origin you can name",
                text: "We lead with Makueni—not a vague ‘natural’ claim—because where a product comes from matters.",
              },
              {
                icon: <ShieldCheck aria-hidden="true" />,
                title: "Proof before promises",
                text: "Our traceability tools are presented as a system in rollout, with demo data clearly labelled until real batch records are available.",
              },
              {
                icon: <Users aria-hidden="true" />,
                title: "Growth that stays connected",
                text: "We want brand growth to strengthen the route between local producers, quality handling and the people buying each jar.",
              },
            ].map((item, index) => (
              <FadeIn key={item.title} delay={index * 0.08} className="h-full">
                <article className="h-full rounded-[2.25rem] border border-white/10 bg-white/[0.045] p-8">
                  <div className="mb-8 flex h-12 w-12 items-center justify-center rounded-2xl bg-asili-honey text-asili-green [&_svg]:h-5 [&_svg]:w-5">
                    {item.icon}
                  </div>
                  <h3 className="text-2xl font-bold">{item.title}</h3>
                  <p className="mt-4 text-sm leading-relaxed text-white/65">{item.text}</p>
                </article>
              </FadeIn>
            ))}
          </div>
        </Section>

        <Section id="origin">
          <div className="grid gap-12 lg:grid-cols-[0.82fr_1.18fr] lg:gap-20">
            <FadeIn>
              <span className="text-[10px] font-black uppercase tracking-[0.3em] text-asili-earth">From Makueni to your table</span>
              <h2 className="mt-5 text-4xl font-bold leading-tight text-asili-green sm:text-5xl">A clearer journey for every jar.</h2>
              <p className="mt-5 leading-relaxed text-asili-green/65">
                This is the process Asili is building around its honey. As the system develops, eligible batches can carry more of this information directly to the customer.
              </p>
            </FadeIn>
            <div className="grid gap-4 sm:grid-cols-2">
              {[
                ["01", "Source", "Honey is sourced from the Makueni ecosystem through producer relationships."],
                ["02", "Handle", "Each batch is received and handled with a consistent quality process."],
                ["03", "Record", "Origin and quality details are captured as the batch-passport system rolls out."],
                ["04", "Share", "Customers can ask questions, view available records and order directly."],
              ].map(([number, title, text], index) => (
                <FadeIn key={number} delay={index * 0.06}>
                  <article className="rounded-[2rem] border border-asili-green/10 bg-white p-7 shadow-[0_14px_40px_rgba(26,58,30,0.04)]">
                    <span className="font-mono text-xs font-bold text-asili-honey">{number}</span>
                    <h3 className="mt-5 text-2xl font-bold text-asili-green">{title}</h3>
                    <p className="mt-3 text-sm leading-relaxed text-asili-green/60">{text}</p>
                  </article>
                </FadeIn>
              ))}
            </div>
          </div>
        </Section>

        <Section id="traceability" className="bg-white">
          <FadeIn>
            <TraceabilityCard />
          </FadeIn>
        </Section>

        <Section id="partners">
          <div className="grid gap-12 lg:grid-cols-[0.85fr_1.15fr] lg:gap-20">
            <FadeIn>
              <span className="text-[10px] font-black uppercase tracking-[0.3em] text-asili-earth">For buyers, retailers & partners</span>
              <h2 className="mt-5 text-4xl font-bold leading-tight text-asili-green sm:text-5xl">Help the honey-first model grow.</h2>
              <p className="mt-5 leading-relaxed text-asili-green/65">
                Asili is early-stage and focused. We welcome conversations that help us improve distribution, quality systems and producer-linked growth without losing the clarity of the brand.
              </p>
              <a
                href={whatsappUrl("Hello Asili, I would like to discuss a retail, distribution or partnership opportunity.")}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-8 inline-flex items-center gap-2 rounded-full bg-asili-green px-7 py-4 text-sm font-bold text-white"
              >
                Start a conversation <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </a>
            </FadeIn>
            <div className="grid gap-4 sm:grid-cols-3">
              {[
                { icon: <Store aria-hidden="true" />, title: "Retail", text: "Stocking and distribution conversations for aligned shops and hospitality partners." },
                { icon: <Package aria-hidden="true" />, title: "Bulk & gifting", text: "Inquiries for larger honey orders and thoughtful corporate gifting." },
                { icon: <Sprout aria-hidden="true" />, title: "Growth partners", text: "Strategic support for traceability, processing, market access and producer development." },
              ].map((item, index) => (
                <FadeIn key={item.title} delay={index * 0.08} className="h-full">
                  <article className="h-full rounded-[2rem] border border-asili-green/10 bg-white p-6">
                    <div className="mb-6 h-6 w-6 text-asili-honey [&_svg]:h-6 [&_svg]:w-6">{item.icon}</div>
                    <h3 className="text-xl font-bold text-asili-green">{item.title}</h3>
                    <p className="mt-3 text-sm leading-relaxed text-asili-green/60">{item.text}</p>
                  </article>
                </FadeIn>
              ))}
            </div>
          </div>
        </Section>

        <Section id="faq" className="bg-[#f2efe7]">
          <div className="grid gap-12 lg:grid-cols-[0.7fr_1.3fr] lg:gap-20">
            <FadeIn>
              <span className="text-[10px] font-black uppercase tracking-[0.3em] text-asili-earth">Common questions</span>
              <h2 className="mt-5 text-4xl font-bold text-asili-green sm:text-5xl">A few clear answers.</h2>
            </FadeIn>
            <div className="divide-y divide-asili-green/10 border-y border-asili-green/10">
              {[
                ["What is Asili?", "Asili is a Kenyan eco-wellness brand beginning with Makueni honey and a long-term commitment to origin, responsible sourcing and practical traceability."],
                ["Where does the honey come from?", "Our current honey story is rooted in Makueni, Kenya. Ask us about the specific availability and source information attached to the jar you want to order."],
                ["How do I buy it?", "Use any ‘Buy honey’ button to open WhatsApp. We will confirm available sizes, current prices, collection or delivery, and payment details directly."],
                ["Is the batch passport already live for every jar?", "Not yet. The Glass Hive is being rolled out, so the website clearly labels demo records. Eligible jars will link to real batch information as it becomes available."],
              ].map(([question, answer]) => (
                <details key={question} className="group py-5">
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-bold text-asili-green">
                    {question}
                    <ChevronDown className="h-5 w-5 shrink-0 text-asili-honey transition-transform group-open:rotate-180" aria-hidden="true" />
                  </summary>
                  <p className="max-w-3xl pb-2 pt-4 text-sm leading-relaxed text-asili-green/65">{answer}</p>
                </details>
              ))}
            </div>
          </div>
        </Section>

        <Section id="contact" className="bg-white">
          <div className="grid overflow-hidden rounded-[3rem] border border-asili-green/10 bg-asili-cream shadow-xl lg:grid-cols-[0.85fr_1.15fr]">
            <div className="bg-asili-green p-8 text-white sm:p-12">
              <Mail className="h-8 w-8 text-asili-honey" aria-hidden="true" />
              <h2 className="mt-8 text-4xl font-bold">Let’s talk.</h2>
              <p className="mt-4 max-w-md text-sm leading-relaxed text-white/65">
                Tell us whether you want a jar, want to stock Asili honey, or see a way to strengthen the honey-first model.
              </p>
              <a
                href={whatsappUrl("Hello Asili, I would like to make an inquiry.")}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-8 inline-flex items-center gap-2 text-sm font-bold text-asili-honey"
              >
                Prefer WhatsApp? Message us <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </a>
            </div>
            <div className="p-8 sm:p-12">
              <ContactForm theme="nature" type="Website" />
            </div>
          </div>
        </Section>
      </main>
      <Footer theme="nature" page="home" />
    </>
  );
};

const HoneyPage = () => (
  <>
    <Header theme="luxury" page="honey" />
    <main id="main-content" className="bg-asili-black text-asili-cream">
      <section className="relative overflow-hidden px-6 pb-20 pt-32 md:px-12 lg:min-h-screen lg:px-24 lg:pb-24 lg:pt-36">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_75%_35%,rgba(212,175,55,0.13),transparent_35%),linear-gradient(to_bottom,#0a0a0a,#10100e)]" />
        <div className="relative mx-auto grid max-w-7xl items-center gap-8 lg:grid-cols-[1.05fr_0.95fr] lg:gap-12">
          <FadeIn>
            <div className="mb-6 flex items-center gap-3 text-asili-gold">
              <span className="h-px w-10 bg-asili-gold" />
              <span className="text-[10px] font-black uppercase tracking-[0.35em]">Asili’s flagship product</span>
            </div>
            <h1 className="max-w-4xl text-5xl font-bold leading-[0.96] tracking-[-0.045em] sm:text-6xl lg:text-[5.3rem] xl:text-[6rem]">
              Raw Makueni honey. <span className="gold-gradient italic">Order it directly.</span>
            </h1>
            <p className="mt-7 max-w-2xl text-base leading-relaxed text-asili-cream/65 sm:text-lg">
              A locally rooted honey for everyday tables, gifting and thoughtful retail—with origin information and batch records being built into the experience.
            </p>
            <div className="mt-9 flex flex-col gap-3 sm:flex-row">
              <a
                href={whatsappUrl("Hello Asili, I would like to order your Makueni honey. Please share the available sizes, prices and delivery options.")}
                target="_blank"
                rel="noopener noreferrer"
                className="group inline-flex items-center justify-center gap-3 rounded-full bg-asili-gold px-8 py-4 text-sm font-black text-asili-black shadow-[0_18px_50px_rgba(212,175,55,0.14)] transition-transform hover:-translate-y-1"
              >
                Buy our honey <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" aria-hidden="true" />
              </a>
              <a href="#origin" className="inline-flex items-center justify-center rounded-full border border-asili-gold/25 px-8 py-4 text-sm font-bold text-asili-gold hover:bg-asili-gold/5">
                See origin & handling
              </a>
            </div>
            <p className="mt-5 text-xs text-asili-cream/40">Available sizes, prices and delivery are confirmed on WhatsApp before purchase.</p>
          </FadeIn>
          <FadeIn delay={0.15}>
            <HoneyJarIllustration dark />
          </FadeIn>
        </div>
      </section>

      <Section id="the-honey" className="border-y border-asili-gold/10 bg-asili-dark">
        <div className="grid gap-12 lg:grid-cols-[0.9fr_1.1fr] lg:gap-20">
          <FadeIn>
            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-asili-gold">One flagship product</span>
            <h2 className="mt-5 text-4xl font-bold leading-tight sm:text-6xl">Honey with a place behind it.</h2>
            <p className="mt-6 max-w-xl leading-relaxed text-asili-cream/60">
              Asili begins with honey sourced from the Makueni ecosystem. We are choosing focus over a long catalogue: one product to understand, improve and connect more clearly to its origin.
            </p>
          </FadeIn>
          <div className="grid gap-4 sm:grid-cols-3">
            {[
              { icon: <MapPin aria-hidden="true" />, title: "Makueni origin", text: "A clear Kenyan source story—not anonymous ‘natural honey’." },
              { icon: <Heart aria-hidden="true" />, title: "Everyday use", text: "For tea, breakfast, simple recipes, gifting and the family table." },
              { icon: <ScanLine aria-hidden="true" />, title: "Traceability in rollout", text: "Batch records are being developed and demo information is labelled honestly." },
            ].map((item, index) => (
              <FadeIn key={item.title} delay={index * 0.08} className="h-full">
                <article className="h-full rounded-[2rem] border border-asili-gold/15 bg-white/[0.035] p-7">
                  <div className="mb-7 h-6 w-6 text-asili-gold [&_svg]:h-6 [&_svg]:w-6">{item.icon}</div>
                  <h3 className="text-xl font-bold text-asili-cream">{item.title}</h3>
                  <p className="mt-3 text-sm leading-relaxed text-asili-cream/55">{item.text}</p>
                </article>
              </FadeIn>
            ))}
          </div>
        </div>
      </Section>

      <Section id="origin">
        <FadeIn className="mx-auto max-w-3xl text-center">
          <span className="text-[10px] font-black uppercase tracking-[0.3em] text-asili-gold">From source to jar</span>
          <h2 className="mt-5 text-4xl font-bold sm:text-6xl">What we are working to make visible.</h2>
          <p className="mt-5 text-sm leading-relaxed text-asili-cream/55 sm:text-base">
            Good traceability starts with consistent habits. These are the practical information points Asili is developing around eligible honey batches.
          </p>
        </FadeIn>
        <div className="mt-14 grid gap-px overflow-hidden rounded-[2.5rem] border border-asili-gold/10 bg-asili-gold/10 md:grid-cols-4">
          {[
            ["01", "Source", "Where the honey was sourced in the Makueni ecosystem."],
            ["02", "Receive", "When the batch entered Asili’s handling process."],
            ["03", "Check", "Quality observations such as a moisture reading, where captured."],
            ["04", "Reference", "A batch ID that can connect an eligible jar to its record."],
          ].map(([number, title, text]) => (
            <article key={number} className="bg-asili-black p-7 sm:p-9">
              <span className="font-mono text-xs font-bold text-asili-gold">{number}</span>
              <h3 className="mt-8 text-2xl font-bold">{title}</h3>
              <p className="mt-3 text-sm leading-relaxed text-asili-cream/50">{text}</p>
            </article>
          ))}
        </div>
      </Section>

      <Section id="traceability" className="bg-asili-dark">
        <FadeIn>
          <TraceabilityCard />
        </FadeIn>
      </Section>

      <Section id="ways-to-enjoy">
        <div className="grid items-center gap-12 lg:grid-cols-[1fr_1fr] lg:gap-20">
          <FadeIn>
            <div className="relative overflow-hidden rounded-[3rem] border border-asili-gold/15 bg-[radial-gradient(circle_at_25%_20%,rgba(212,175,55,0.16),transparent_35%),#141414] p-9 sm:p-12">
              <Sparkles className="h-8 w-8 text-asili-gold" aria-hidden="true" />
              <p className="mt-12 font-serif text-3xl font-bold italic leading-snug text-asili-gold sm:text-4xl">
                Honey does not need a medical promise to earn a place at the table.
              </p>
              <p className="mt-5 text-sm leading-relaxed text-asili-cream/55">Its value begins with taste, origin, care and the people behind it.</p>
            </div>
          </FadeIn>
          <FadeIn delay={0.1}>
            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-asili-gold">Simple ways to enjoy it</span>
            <h2 className="mt-5 text-4xl font-bold sm:text-5xl">Made for real routines.</h2>
            <div className="mt-8 space-y-4">
              {[
                ["Morning", "Spoon over fruit, porridge, yoghurt or toast."],
                ["Drinks", "Stir into tea or warm water after it cools slightly."],
                ["Kitchen", "Use in dressings, marinades, baking or simple family recipes."],
                ["Gifting", "Ask about current options for personal and corporate gifts."],
              ].map(([title, text]) => (
                <div key={title} className="flex gap-4 border-b border-white/8 pb-4">
                  <Check className="mt-0.5 h-5 w-5 shrink-0 text-asili-gold" aria-hidden="true" />
                  <div>
                    <h3 className="font-bold text-asili-cream">{title}</h3>
                    <p className="mt-1 text-sm text-asili-cream/50">{text}</p>
                  </div>
                </div>
              ))}
            </div>
          </FadeIn>
        </div>
      </Section>

      <Section id="faq" className="border-y border-asili-gold/10 bg-asili-dark">
        <div className="grid gap-12 lg:grid-cols-[0.7fr_1.3fr] lg:gap-20">
          <FadeIn>
            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-asili-gold">Before you order</span>
            <h2 className="mt-5 text-4xl font-bold sm:text-5xl">Honey questions, plainly answered.</h2>
          </FadeIn>
          <div className="divide-y divide-white/10 border-y border-white/10">
            {[
              ["What sizes and prices are available?", "Availability can change as this honey-first offer develops. Message us on WhatsApp and we will confirm current jar sizes, prices and delivery before you pay."],
              ["Where is the honey sourced?", "The current Asili honey story is rooted in Makueni, Kenya. Specific source information will be shared where it has been captured for the batch."],
              ["Does crystallisation mean honey has spoiled?", "No. Crystallisation is a natural change that can happen in honey. Place the closed jar in warm—not boiling—water if you prefer a more liquid texture."],
              ["Can I buy for a shop or event?", "Yes—use the inquiry form or WhatsApp to discuss retail stocking, bulk orders, events and corporate gifts."],
            ].map(([question, answer]) => (
              <details key={question} className="group py-5">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-bold text-asili-cream">
                  {question}
                  <ChevronDown className="h-5 w-5 shrink-0 text-asili-gold transition-transform group-open:rotate-180" aria-hidden="true" />
                </summary>
                <p className="max-w-3xl pb-2 pt-4 text-sm leading-relaxed text-asili-cream/55">{answer}</p>
              </details>
            ))}
          </div>
        </div>
      </Section>

      <Section id="contact">
        <div className="grid overflow-hidden rounded-[3rem] border border-asili-gold/15 bg-asili-dark shadow-2xl lg:grid-cols-[0.85fr_1.15fr]">
          <div className="bg-asili-gold p-8 text-asili-black sm:p-12">
            <Package className="h-8 w-8" aria-hidden="true" />
            <h2 className="mt-8 text-4xl font-bold">Order or inquire.</h2>
            <p className="mt-4 max-w-md text-sm leading-relaxed text-asili-black/65">
              Tell us what you need. We will confirm availability and the next step directly.
            </p>
            <a
              href={whatsappUrl("Hello Asili, I would like to order your Makueni honey. Please share the available sizes, prices and delivery options.")}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-8 inline-flex items-center gap-2 text-sm font-black"
            >
              Order on WhatsApp <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </a>
          </div>
          <div className="p-8 sm:p-12">
            <ContactForm theme="luxury" type="Honey" />
          </div>
        </div>
      </Section>
    </main>
    <Footer theme="luxury" page="honey" />
  </>
);

const Footer = ({ theme, page }: { theme: Theme; page: "home" | "honey" }) => (
  <footer
    className={cn(
      "border-t px-6 py-14 md:px-12 lg:px-24",
      theme === "luxury"
        ? "border-asili-gold/10 bg-asili-black text-asili-cream"
        : "border-white/5 bg-asili-green text-white",
    )}
  >
    <div className="mx-auto grid max-w-7xl gap-10 md:grid-cols-[1.2fr_0.8fr_1fr]">
      <div>
        <Logo theme={theme === "nature" ? "luxury" : theme} />
        <p className={cn("mt-6 max-w-sm text-sm leading-relaxed", theme === "luxury" ? "text-asili-cream/50" : "text-white/60")}>
          A Kenyan eco-wellness brand beginning with Makueni honey and clearer traceability. Rooted in origin, focused on trust.
        </p>
      </div>
      <div>
        <h2 className={cn("text-[10px] font-black uppercase tracking-[0.25em]", theme === "luxury" ? "text-asili-gold" : "text-asili-honey")}>Navigate</h2>
        <div className="mt-5 flex flex-col gap-3 text-sm">
          <a href={page === "home" ? "#story" : "/#story"} className="opacity-60 hover:opacity-100">Our story</a>
          <a href="/honey/" className="opacity-60 hover:opacity-100">Our honey</a>
          <a href={page === "home" ? "#partners" : "/#partners"} className="opacity-60 hover:opacity-100">Partners</a>
          <a href="#contact" className="opacity-60 hover:opacity-100">Contact</a>
        </div>
      </div>
      <div>
        <h2 className={cn("text-[10px] font-black uppercase tracking-[0.25em]", theme === "luxury" ? "text-asili-gold" : "text-asili-honey")}>Connect</h2>
        <div className="mt-5 space-y-4 text-sm">
          <a href="mailto:kevinsila100@gmail.com" className="flex items-center gap-3 opacity-65 hover:opacity-100">
            <Mail className="h-4 w-4" aria-hidden="true" /> kevinsila100@gmail.com
          </a>
          <a href={WHATSAPP_BASE} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 opacity-65 hover:opacity-100">
            <Globe className="h-4 w-4" aria-hidden="true" /> +254 717 578 394
          </a>
          <a
            href="https://linktr.ee/kevinsila"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 opacity-65 hover:opacity-100"
          >
            <Instagram className="h-4 w-4" aria-hidden="true" /> Social links
          </a>
        </div>
      </div>
    </div>
    <div className={cn("mx-auto mt-12 flex max-w-7xl flex-col gap-2 border-t pt-6 text-[9px] uppercase tracking-widest sm:flex-row sm:justify-between", theme === "luxury" ? "border-white/8 text-white/35" : "border-white/10 text-white/40")}>
      <span>© {new Date().getFullYear()} Asili Eco-Wellness</span>
      <span>Makueni · Kenya</span>
    </div>
  </footer>
);

const FloatingWhatsApp = ({ theme }: { theme: Theme }) => (
  <a
    href={whatsappUrl("Hello Asili, I would like to order your Makueni honey. Please share the available sizes, prices and delivery options.")}
    target="_blank"
    rel="noopener noreferrer"
    aria-label="Order Asili honey on WhatsApp"
    className={cn(
      "fixed bottom-5 right-5 z-40 flex items-center gap-2 rounded-full px-5 py-3 text-[10px] font-black uppercase tracking-wider shadow-2xl transition-transform hover:-translate-y-1 sm:bottom-7 sm:right-7",
      theme === "luxury" ? "bg-asili-gold text-asili-black" : "bg-asili-green text-white",
    )}
  >
    <span className="h-2 w-2 rounded-full bg-emerald-400" /> Buy honey
  </a>
);

export default function App() {
  const isHoneyPage = window.location.pathname === "/honey" || window.location.pathname.startsWith("/honey/");
  const theme: Theme = isHoneyPage ? "luxury" : "nature";

  useEffect(() => {
    document.documentElement.style.colorScheme = isHoneyPage ? "dark" : "light";
  }, [isHoneyPage]);

  return (
    <div className={cn("min-h-screen", isHoneyPage ? "bg-asili-black" : "bg-asili-cream")}>
      <a href="#main-content" className="skip-link">Skip to content</a>
      {isHoneyPage ? <HoneyPage /> : <HomePage />}
      <FloatingWhatsApp theme={theme} />
    </div>
  );
}
