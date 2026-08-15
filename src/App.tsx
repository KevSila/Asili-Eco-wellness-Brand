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
type FlowMotifTone = "light" | "green" | "dark";
type FlowMotifSide = "left" | "right";

interface FlowMotifConfig {
  tone: FlowMotifTone;
  side?: FlowMotifSide;
  quiet?: boolean;
}

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

const FLOW_LINES = Array.from({ length: 15 }, (_, index) => index);

const FlowMotif = ({ tone, side = "right", quiet = false }: FlowMotifConfig) => {
  const palette = {
    light: { primary: "#1a3a1e", accent: "#c5a059" },
    green: { primary: "#ead8a9", accent: "#c5a059" },
    dark: { primary: "#d4af37", accent: "#4f754d" },
  }[tone];

  return (
    <div
      aria-hidden="true"
      className={cn(
        "flow-motif",
        `flow-motif--${side}`,
        `flow-motif--${tone}`,
        quiet && "flow-motif--quiet",
      )}
    >
      <svg className="flow-motif__art" viewBox="0 0 560 1000" preserveAspectRatio="none">
        <g fill="none" strokeLinecap="round">
          {FLOW_LINES.map((index) => (
            <path
              key={`flow-${index}`}
              d="M 640 -120 C 260 28 650 176 412 320 C 176 462 654 590 360 742 C 166 846 514 1018 220 1120"
              stroke={index % 4 === 0 ? palette.accent : palette.primary}
              strokeOpacity={0.42 + (index % 3) * 0.08}
              strokeWidth={index % 4 === 0 ? 1.35 : 0.9}
              vectorEffect="non-scaling-stroke"
              transform={`translate(${-index * 15} ${index * 4})`}
            />
          ))}
          {FLOW_LINES.slice(0, 8).map((index) => (
            <path
              key={`echo-${index}`}
              d="M 710 160 C 430 266 704 386 522 510 C 348 630 686 752 474 900"
              stroke={index % 3 === 0 ? palette.primary : palette.accent}
              strokeOpacity={0.28 + (index % 2) * 0.09}
              strokeWidth="0.8"
              vectorEffect="non-scaling-stroke"
              transform={`translate(${-index * 18} ${index * 6})`}
            />
          ))}
        </g>
      </svg>
    </div>
  );
};

const Section = ({
  children,
  className,
  id,
  motif,
}: {
  children: React.ReactNode;
  className?: string;
  id?: string;
  motif?: FlowMotifConfig;
}) => (
  <section id={id} className={cn("relative isolate scroll-mt-24 overflow-hidden px-6 py-20 md:px-12 lg:px-24 lg:py-28", className)}>
    {motif && <FlowMotif {...motif} />}
    <div className="relative z-10 mx-auto max-w-7xl">{children}</div>
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
          ["Ecosystem", "#ecosystem"],
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
  <div className={cn("product-stage relative mx-auto min-h-[550px] w-full max-w-[560px] sm:min-h-[500px]", dark && "product-stage-dark")}>
    <motion.div
      animate={{ rotate: [0, 2, 0, -2, 0] }}
      transition={{ duration: 18, repeat: Infinity, ease: "easeInOut" }}
      className={cn(
        "absolute inset-[9%] rounded-[42%_58%_48%_52%/48%_38%_62%_52%] blur-[1px]",
        dark ? "bg-asili-gold/[0.09]" : "bg-asili-honey/15",
      )}
      aria-hidden="true"
    />
    <motion.div
      initial={{ opacity: 0, y: 24, scale: 0.96 }}
      whileInView={{ opacity: 1, y: 0, scale: 1 }}
      whileHover={{ y: -10, rotate: 0.5 }}
      viewport={{ once: true }}
      transition={{ duration: 0.85, ease: [0.22, 1, 0.36, 1] }}
      className="relative z-10 flex min-h-[500px] items-center justify-center"
    >
      <img
        src="/images/asili-raw-honey-jar.webp"
        width="900"
        height="1350"
        alt="Asili raw honey from Makueni in a premium glass jar"
        decoding="async"
        fetchPriority="high"
        className="h-[500px] max-w-full object-contain drop-shadow-[0_35px_38px_rgba(55,35,8,0.28)] sm:h-[560px]"
      />
    </motion.div>
    {["left-[8%] top-[18%]", "right-[10%] top-[14%]", "right-[4%] top-[45%]"].map((position, index) => (
      <motion.span
        key={position}
        className={cn("absolute h-2 w-2 rounded-full", position, dark ? "bg-asili-gold" : "bg-asili-honey")}
        animate={{ y: [0, -14, 0], opacity: [0.25, 0.85, 0.25] }}
        transition={{ duration: 3.8 + index * 0.55, repeat: Infinity, delay: index * 0.4 }}
        aria-hidden="true"
      />
    ))}
    <div className="relative z-20 mt-1 grid grid-cols-[minmax(0,1fr)_auto] items-end gap-2 px-1 sm:contents">
      <div
        className={cn(
          "min-w-0 rounded-2xl border px-3 py-3 shadow-xl backdrop-blur-md sm:absolute sm:bottom-[8%] sm:left-[5%] sm:px-4",
          dark
            ? "border-asili-gold/20 bg-asili-black/80 text-asili-gold"
            : "border-asili-honey/20 bg-white/80 text-asili-green",
        )}
      >
        <span className="block text-[8px] font-bold uppercase tracking-[0.25em] opacity-60">Origin</span>
        <span className="mt-1 flex items-center gap-1.5 whitespace-nowrap text-xs font-bold">
          <MapPin className="h-3.5 w-3.5 shrink-0" aria-hidden="true" /> Makueni, Kenya
        </span>
      </div>
      <div
        className={cn(
          "justify-self-end whitespace-nowrap rounded-full border px-3 py-2 text-[8px] font-black uppercase tracking-[0.18em] shadow-lg backdrop-blur-md sm:absolute sm:right-[2%] sm:top-[14%] sm:px-4",
          dark
            ? "border-asili-gold/25 bg-asili-black/80 text-asili-gold"
            : "border-asili-honey/25 bg-white/80 text-asili-green",
        )}
      >
        Raw · Unheated
      </div>
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
              <span className="text-[9px] font-black uppercase tracking-[0.35em]">Glass Hive · Batch passport</span>
            </div>
            <h3 className="text-3xl font-bold sm:text-4xl">The Glass Hive</h3>
            <p className="mt-2 max-w-xl text-sm leading-relaxed text-asili-cream/65">
              Glass Hive is Asili’s digital batch-passport system. It connects eligible jars with captured and reviewed source, handling and quality information through a clear digital record.
            </p>
          </div>
          <div className="w-fit rounded-xl border border-asili-gold/20 bg-asili-gold/10 px-4 py-2 font-mono">
            <span className="block text-[7px] uppercase tracking-widest text-asili-gold/60">Sample record</span>
            <span className="text-xs font-bold text-asili-gold">DEMO-MAK-01</span>
          </div>
        </div>

        <div className={cn("grid gap-3", compact ? "sm:grid-cols-2" : "sm:grid-cols-2 lg:grid-cols-4")}>
          {fields.map((field) => (
            <div key={field.label} className="premium-card rounded-2xl border border-white/8 bg-white/[0.035] p-5">
              <div className="mb-5 h-5 w-5 text-asili-gold [&_svg]:h-5 [&_svg]:w-5">{field.icon}</div>
              <span className="block text-[8px] font-bold uppercase tracking-[0.2em] text-white/45">{field.label}</span>
              <span className="mt-2 block text-sm font-bold text-asili-cream">{field.value}</span>
            </div>
          ))}
        </div>

        <div className="mt-7 flex flex-col justify-between gap-4 border-t border-white/8 pt-6 sm:flex-row sm:items-center">
          <p className="max-w-2xl text-xs leading-relaxed text-asili-cream/50">
            This is an example record. A live passport displays the information captured and reviewed for its specific batch.
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
      ? "border-white/10 bg-white/[0.04] text-asili-cream placeholder:text-asili-cream/45 focus:border-asili-gold/60"
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
        <select
          id={`${type}-interest`}
          name="interest"
          required
          defaultValue=""
          className={cn(inputClass, theme === "luxury" ? "asili-select-luxury" : "asili-select-light")}
        >
          <option value="" disabled>What can we help with?</option>
          <option>Personal honey order</option>
          <option>Retail stocking</option>
          <option>Bulk honey</option>
          <option>Corporate gifting</option>
          <option>Distribution partnership</option>
          <option>Adopt or rent a hive</option>
          <option>Bee-as-a-Service partnership</option>
          <option>Corporate CSR partnership</option>
          <option>Pollination partnership</option>
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
        <section className="relative isolate overflow-hidden px-6 pb-20 pt-32 md:px-12 lg:min-h-screen lg:px-24 lg:pb-24 lg:pt-36">
          <div className="absolute inset-0 z-0 bg-[radial-gradient(circle_at_78%_34%,rgba(197,160,89,0.16),transparent_34%),radial-gradient(circle_at_15%_15%,rgba(45,90,39,0.08),transparent_30%)]" />
          <FlowMotif tone="light" side="right" />
          <div className="relative z-10 mx-auto grid max-w-7xl items-center gap-8 lg:grid-cols-[1.05fr_0.95fr] lg:gap-12">
            <div>
              <FadeIn>
                <div className="mb-6 flex items-center gap-3 text-asili-earth">
                  <span className="h-px w-10 bg-asili-honey" />
                  <span className="text-[10px] font-black uppercase tracking-[0.3em]">African Roots, Semi-Arid Products</span>
                </div>
                <h1 className="max-w-4xl text-5xl font-bold leading-[0.96] tracking-[-0.045em] text-asili-green sm:text-6xl lg:text-[5.4rem] xl:text-[6.2rem]">
                  Raw honey with a place, <span className="italic text-asili-honey">a purpose and a promise.</span>
                </h1>
                <p className="mt-7 max-w-2xl text-base leading-relaxed text-asili-green/70 sm:text-lg">
                  Asili brings you natural, raw and unheated honey from Makueni’s semi-arid landscapes—built around quality, visible origin and shared value for the communities behind every batch.
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
                    ["Raw & unheated", "Preserved without heat"],
                    ["Makueni origin", "Semi-arid landscape"],
                    ["Purpose-led", "Quality + community"],
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
              <div className="premium-card relative overflow-hidden rounded-[3rem] bg-asili-green p-8 text-white sm:p-12">
                <div className="absolute -right-20 -top-20 h-52 w-52 rounded-full border-[30px] border-asili-honey/10" />
                <span className="relative text-[9px] font-black uppercase tracking-[0.3em] text-asili-honey">Available now</span>
                <h2 className="relative mt-5 text-4xl font-bold sm:text-5xl">Asili Raw Makueni Honey</h2>
                <p className="relative mt-5 max-w-xl leading-relaxed text-white/70">
                  Natural honey kept raw and never heat-treated, so its character remains close to the landscape it came from. Colour, texture and crystallisation may naturally vary by batch.
                </p>
                <div className="relative mt-8 flex flex-wrap gap-2">
                  {["Raw & unheated", "Makueni origin", "Retail, bulk & gifting"].map((item) => (
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
                <span className="text-[10px] font-black uppercase tracking-[0.3em]">Inside the jar</span>
              </div>
              <h2 className="text-4xl font-bold leading-tight text-asili-green sm:text-6xl">
                Raw honey, kept <span className="italic text-asili-honey">close to nature.</span>
              </h2>
              <p className="mt-6 max-w-2xl text-base leading-relaxed text-asili-green/65">
                We do not heat-treat Asili honey. Each available batch is offered with clear purchasing information, and Glass Hive makes captured source and quality records visible for eligible jars. Current jar sizes, retail and bulk prices are confirmed per batch.
              </p>
              <div className="mt-7 grid gap-3 sm:grid-cols-3">
                {["Batch-based availability", "Bulk enquiries welcome", "Delivery at customer cost"].map((item) => (
                  <div key={item} className="rounded-2xl border border-asili-green/10 bg-asili-cream px-4 py-3 text-xs font-bold text-asili-green">
                    {item}
                  </div>
                ))}
              </div>
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

        <Section id="story" motif={{ tone: "light", side: "left", quiet: true }}>
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
                Our natural honey comes from Makueni and is kept raw and unheated. We are building a more connected route from source to customer, while developing practical batch records that make origin and quality information easier to understand.
              </p>
              <p className="border-l-2 border-asili-honey pl-5 font-serif text-xl italic text-asili-green">
                We are building a quality brand where every jar carries more than honey: it carries a visible origin, fairer opportunity and a reason to protect the landscape that produced it.
              </p>
            </FadeIn>
          </div>
        </Section>

        <Section id="mission" className="bg-white">
          <FadeIn className="mx-auto max-w-3xl text-center">
            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-asili-earth">What Asili is building</span>
            <h2 className="mt-5 text-4xl font-bold text-asili-green sm:text-6xl">A natural-products brand with a wider purpose.</h2>
          </FadeIn>
          <div className="mt-12 grid gap-5 lg:grid-cols-2">
            <FadeIn className="h-full">
              <article className="premium-card h-full rounded-[2.5rem] bg-asili-green p-8 text-white sm:p-10">
                <span className="text-[9px] font-black uppercase tracking-[0.3em] text-asili-honey">Our mission</span>
                <p className="mt-6 font-serif text-2xl font-bold leading-snug sm:text-3xl">
                  To deliver high-quality natural products from Africa’s semi-arid regions through ethical sourcing and responsible production—creating practical value for customers, beekeepers and communities.
                </p>
              </article>
            </FadeIn>
            <FadeIn delay={0.08} className="h-full">
              <article className="premium-card h-full rounded-[2.5rem] border border-asili-honey/25 bg-[#f1e6cf] p-8 text-asili-green sm:p-10">
                <span className="text-[9px] font-black uppercase tracking-[0.3em] text-asili-earth">Our vision</span>
                <p className="mt-6 font-serif text-2xl font-bold leading-snug sm:text-3xl">
                  To grow into a globally recognised African eco-wellness brand whose trusted products strengthen livelihoods, biodiversity and climate resilience.
                </p>
              </article>
            </FadeIn>
          </div>
          <div className="mt-5 grid gap-5 md:grid-cols-3">
            {[
              { icon: <Package aria-hidden="true" />, title: "Premium natural products", text: "Current focus: natural, raw and unheated Makueni honey for homes, retailers, bulk buyers and gifting." },
              { icon: <Sprout aria-hidden="true" />, title: "Sustainable agriculture", text: "Developing responsible beekeeping, pollination and biodiversity models suited to semi-arid landscapes." },
              { icon: <Users aria-hidden="true" />, title: "Community-linked growth", text: "Building toward beekeeper partnerships, practical training, clearer market access and stronger quality at source." },
            ].map((item, index) => (
              <FadeIn key={item.title} delay={index * 0.07} className="h-full">
                <article className="premium-card h-full rounded-[2rem] border border-asili-green/10 bg-asili-cream p-7">
                  <div className="h-6 w-6 text-asili-honey [&_svg]:h-6 [&_svg]:w-6">{item.icon}</div>
                  <h3 className="mt-6 text-xl font-bold text-asili-green">{item.title}</h3>
                  <p className="mt-3 text-sm leading-relaxed text-asili-green/60">{item.text}</p>
                </article>
              </FadeIn>
            ))}
          </div>
        </Section>

        <Section id="why-asili" className="bg-asili-green text-white" motif={{ tone: "green", side: "right" }}>
          <FadeIn className="mx-auto max-w-3xl text-center">
            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-asili-honey">The Asili standard</span>
            <h2 className="mt-5 text-4xl font-bold sm:text-6xl">Quality, origin and impact belong together.</h2>
          </FadeIn>
          <div className="mt-14 grid gap-5 md:grid-cols-3">
            {[
              {
                icon: <MapPin aria-hidden="true" />,
                title: "Origin made visible",
                text: "We name Makueni and use Glass Hive to make reviewed source and batch information easier to follow.",
              },
              {
                icon: <ShieldCheck aria-hidden="true" />,
                title: "Quality without shortcuts",
                text: "The honey is natural, raw and not heat-treated. Natural variation and crystallisation are part of the product—not defects to hide.",
              },
              {
                icon: <Users aria-hidden="true" />,
                title: "Shared value by design",
                text: "Asili is designed to connect commercial growth with stronger beekeeper opportunities, biodiversity and resilient semi-arid livelihoods.",
              },
            ].map((item, index) => (
              <FadeIn key={item.title} delay={index * 0.08} className="h-full">
                <article className="premium-card h-full rounded-[2.25rem] border border-white/10 bg-white/[0.045] p-8">
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
                This is the process Asili uses around its honey. Eligible batches carry captured and reviewed information directly to the customer through Glass Hive.
              </p>
            </FadeIn>
            <div className="grid gap-4 sm:grid-cols-2">
              {[
                ["01", "Source", "Honey is sourced from the Makueni ecosystem through producer relationships."],
                ["02", "Handle", "Each batch is received and handled with a consistent quality process."],
                ["03", "Record", "Origin and quality details are captured in the Glass Hive batch-passport record."],
                ["04", "Share", "Customers can ask questions, view available records and order directly."],
              ].map(([number, title, text], index) => (
                <FadeIn key={number} delay={index * 0.06}>
                  <article className="premium-card rounded-[2rem] border border-asili-green/10 bg-white p-7 shadow-[0_14px_40px_rgba(26,58,30,0.04)]">
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

        <Section id="partners" motif={{ tone: "light", side: "right", quiet: true }}>
          <div className="grid gap-12 lg:grid-cols-[0.85fr_1.15fr] lg:gap-20">
            <FadeIn>
              <span className="text-[10px] font-black uppercase tracking-[0.3em] text-asili-earth">For buyers, retailers & partners</span>
              <h2 className="mt-5 text-4xl font-bold leading-tight text-asili-green sm:text-5xl">There is more than one way to work with Asili.</h2>
              <p className="mt-5 leading-relaxed text-asili-green/65">
                Buy or stock the honey available now, ask about a bulk or gifting order, or help shape the traceability, beekeeping and community models being developed around it.
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
            <div className="grid gap-4 sm:grid-cols-2">
              {[
                { icon: <Store aria-hidden="true" />, title: "Retail & hospitality", text: "Stocking and distribution enquiries for aligned shops, hotels, cafés and hospitality partners." },
                { icon: <Package aria-hidden="true" />, title: "Bulk & corporate gifting", text: "Batch-priced larger orders and thoughtful gifts for teams, clients, events or special occasions." },
                { icon: <Sprout aria-hidden="true" />, title: "CSR & impact partnerships", text: "Explore hive sponsorship, pollination and community-linked programmes tailored to a partner’s goals." },
                { icon: <Globe aria-hidden="true" />, title: "Growth partnerships", text: "Strategic support for traceability, responsible processing, market access and producer development." },
              ].map((item, index) => (
                <FadeIn key={item.title} delay={index * 0.08} className="h-full">
                  <article className="premium-card h-full rounded-[2rem] border border-asili-green/10 bg-white p-6">
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
                ["What is Asili?", "Asili is a Kenyan eco-wellness brand creating high-quality products from Africa’s semi-arid regions. Natural, raw and unheated Makueni honey is the product currently available."],
                ["Is Asili honey raw and unheated?", "Yes. The honey is not heat-treated. Colour, texture and the speed of natural crystallisation can vary from one batch to another."],
                ["Where does the honey come from?", "Our current honey story is rooted in Makueni, Kenya. Ask us about the specific availability and source information attached to the jar you want to order."],
                ["How do I buy it?", "Use any ‘Buy honey’ button to open WhatsApp. We will confirm current jar sizes, batch price, availability and payment details. Delivery can be facilitated at the customer’s expense."],
                ["How does the Glass Hive batch passport work?", "Glass Hive connects an eligible jar with a digital batch record. Open the passport to view captured and reviewed information such as source, handling notes, batch reference and available quality checks."],
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
                Tell us whether you want a jar, want to stock Asili honey, need a bulk order, or see a way to build the wider ecosystem with us.
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
      <section className="relative isolate overflow-hidden px-6 pb-20 pt-32 md:px-12 lg:min-h-screen lg:px-24 lg:pb-24 lg:pt-36">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_75%_35%,rgba(212,175,55,0.13),transparent_35%),linear-gradient(to_bottom,#0a0a0a,#10100e)]" />
        <FlowMotif tone="dark" side="right" />
        <div className="relative z-10 mx-auto grid max-w-7xl items-center gap-8 lg:grid-cols-[1.05fr_0.95fr] lg:gap-12">
          <FadeIn>
            <div className="mb-6 flex items-center gap-3 text-asili-gold">
              <span className="h-px w-10 bg-asili-gold" />
              <span className="text-[10px] font-black uppercase tracking-[0.3em]">African Roots, Semi-Arid Products</span>
            </div>
            <h1 className="max-w-4xl text-5xl font-bold leading-[0.96] tracking-[-0.045em] sm:text-6xl lg:text-[5.3rem] xl:text-[6rem]">
              Raw. Unheated. <span className="gold-gradient italic">Rooted in Makueni.</span>
            </h1>
            <p className="mt-7 max-w-2xl text-base leading-relaxed text-asili-cream/65 sm:text-lg">
              Natural honey shaped by Makueni’s semi-arid flora and handled without heat—made for your table, thoughtful gifting, retail shelves and bulk orders.
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
            <p className="mt-5 max-w-xl text-xs leading-relaxed text-asili-cream/40">
              Current jar sizes, retail and bulk prices are confirmed per available batch. Delivery can be arranged at the customer’s expense.
            </p>
          </FadeIn>
          <FadeIn delay={0.15}>
            <HoneyJarIllustration dark />
          </FadeIn>
        </div>
      </section>

      <Section id="the-honey" className="border-y border-asili-gold/20 bg-[#f5ecdc] text-asili-green">
        <div className="grid gap-12 lg:grid-cols-[0.9fr_1.1fr] lg:gap-20">
          <FadeIn>
            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-asili-earth">The honey</span>
            <h2 className="mt-5 text-4xl font-bold leading-tight sm:text-6xl">Natural character, carefully preserved.</h2>
            <p className="mt-6 max-w-xl leading-relaxed text-asili-green/65">
              Asili honey is raw and never heat-treated. Its colour, aroma, texture and crystallisation can change naturally with the flora, season and batch—part of what makes origin meaningful.
            </p>
          </FadeIn>
          <div className="grid gap-4 sm:grid-cols-3">
            {[
              { icon: <Droplets aria-hidden="true" />, title: "Raw & unheated", text: "Handled without heat treatment to keep the honey close to its natural state." },
              { icon: <MapPin aria-hidden="true" />, title: "Makueni origin", text: "A clear Kenyan source story connected to a distinctive semi-arid landscape." },
              { icon: <Heart aria-hidden="true" />, title: "Made for real life", text: "For tea, breakfast, cooking, gifting, retail shelves and larger orders." },
            ].map((item, index) => (
              <FadeIn key={item.title} delay={index * 0.08} className="h-full">
                <article className="premium-card h-full rounded-[2rem] border border-asili-green/10 bg-white/70 p-7">
                  <div className="mb-7 h-6 w-6 text-asili-honey [&_svg]:h-6 [&_svg]:w-6">{item.icon}</div>
                  <h3 className="text-xl font-bold text-asili-green">{item.title}</h3>
                  <p className="mt-3 text-sm leading-relaxed text-asili-green/60">{item.text}</p>
                </article>
              </FadeIn>
            ))}
          </div>
        </div>
      </Section>

      <Section id="origin" motif={{ tone: "dark", side: "left", quiet: true }}>
        <FadeIn className="mx-auto max-w-3xl text-center">
          <span className="text-[10px] font-black uppercase tracking-[0.3em] text-asili-gold">From source to jar</span>
          <h2 className="mt-5 text-4xl font-bold sm:text-6xl">Origin should be more than a word on a label.</h2>
          <p className="mt-5 text-sm leading-relaxed text-asili-cream/55 sm:text-base">
            Asili records source, handling and batch references so customers can understand the honey they are buying—not just the brand selling it.
          </p>
        </FadeIn>
        <div className="mt-14 grid gap-px overflow-hidden rounded-[2.5rem] border border-asili-gold/10 bg-asili-gold/10 md:grid-cols-4">
          {[
            ["01", "Source", "Record where the honey was sourced within the Makueni ecosystem."],
            ["02", "Handle", "Keep honey raw, avoid heat treatment and record relevant handling notes."],
            ["03", "Review", "Capture quality observations such as moisture readings where available."],
            ["04", "Connect", "Use a batch reference to link eligible jars with reviewed information."],
          ].map(([number, title, text]) => (
            <article key={number} className="premium-card bg-asili-black p-7 sm:p-9">
              <span className="font-mono text-xs font-bold text-asili-gold">{number}</span>
              <h3 className="mt-8 text-2xl font-bold">{title}</h3>
              <p className="mt-3 text-sm leading-relaxed text-asili-cream/50">{text}</p>
            </article>
          ))}
        </div>
      </Section>

      <Section id="traceability" className="bg-[#eee4d2] text-asili-green" motif={{ tone: "light", side: "right", quiet: true }}>
        <FadeIn>
          <TraceabilityCard />
        </FadeIn>
        <FadeIn className="mx-auto mt-8 max-w-4xl text-center">
          <p className="text-sm leading-relaxed text-asili-green/60">
            Glass Hive is Asili’s digital batch-passport system. It connects an eligible jar to captured and reviewed information about its source, handling and quality checks, so customers can understand the honey beyond the label.
          </p>
        </FadeIn>
      </Section>

      <Section id="ecosystem" className="bg-[#f8f1e4] text-asili-green" motif={{ tone: "light", side: "left" }}>
        <div className="grid gap-10 lg:grid-cols-[0.75fr_1.25fr] lg:gap-16">
          <FadeIn>
            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-asili-earth">The Asili ecosystem</span>
            <h2 className="mt-5 text-4xl font-bold leading-tight sm:text-6xl">Beyond the jar: ways to build with Asili.</h2>
            <p className="mt-6 leading-relaxed text-asili-green/65">
              Some options are open for enquiries now; others are partnership models being developed. Each card tells you where the idea currently stands.
            </p>
          </FadeIn>
          <div className="grid gap-4 sm:grid-cols-2">
            {[
              {
                icon: <Package aria-hidden="true" />,
                status: "Available enquiry",
                title: "Honey orders",
                text: "Order for personal use, retail stocking, hospitality, events, bulk needs or corporate gifting. Sizes and prices are confirmed per batch.",
                message: "Hello Asili, I would like to discuss a honey order. Please share current sizes, prices and availability.",
              },
              {
                icon: <Store aria-hidden="true" />,
                status: "Available enquiry",
                title: "Retail & corporate gifting",
                text: "Discuss stocking, recurring supply or a considered honey gift for teams and clients. Packaging and quantities are confirmed for each order.",
                message: "Hello Asili, I would like to discuss retail stocking or a corporate honey gifting order.",
              },
              {
                icon: <Heart aria-hidden="true" />,
                status: "Register interest",
                title: "Adopt or rent a hive",
                text: "A developing way for individuals or organisations to support a managed hive, receive agreed updates and, where included, an agreed honey allocation.",
                message: "Hello Asili, I would like to register interest in adopting or renting a hive. Please tell me how the model is being developed.",
              },
              {
                icon: <Leaf aria-hidden="true" />,
                status: "Partnership model",
                title: "Bee-as-a-Service",
                text: "A tailored managed-hive relationship for organisations. Hive placement, husbandry, reporting and any honey allocation would be agreed for each partnership.",
                message: "Hello Asili, I would like to explore a Bee-as-a-Service partnership.",
              },
              {
                icon: <Users aria-hidden="true" />,
                status: "CSR concept",
                title: "Corporate Pollination Zones",
                text: "A proposed CSR model where companies support hive clusters linked to biodiversity, beekeeper opportunity and tailored impact updates or gifting.",
                message: "Hello Asili, I would like to explore a Corporate Pollination Zone or CSR partnership.",
              },
              {
                icon: <Sprout aria-hidden="true" />,
                status: "Future pilot",
                title: "Orchard pollination",
                text: "A planned service to explore managed pollination support with orchard and farm partners, subject to site assessment, capacity and pilot terms.",
                message: "Hello Asili, I would like to discuss interest in a future orchard pollination pilot.",
              },
            ].map((item, index) => (
              <FadeIn key={item.title} delay={index * 0.05} className="h-full">
                <article className="premium-card group flex h-full flex-col rounded-[2rem] border border-asili-green/10 bg-white/75 p-7">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-asili-green text-asili-honey [&_svg]:h-5 [&_svg]:w-5">{item.icon}</div>
                    <span className="rounded-full bg-asili-honey/15 px-3 py-1.5 text-[8px] font-black uppercase tracking-[0.16em] text-asili-earth">{item.status}</span>
                  </div>
                  <h3 className="mt-7 text-2xl font-bold">{item.title}</h3>
                  <p className="mt-3 flex-1 text-sm leading-relaxed text-asili-green/60">{item.text}</p>
                  <a href={whatsappUrl(item.message)} target="_blank" rel="noopener noreferrer" className="mt-6 inline-flex items-center gap-2 text-xs font-black uppercase tracking-wider text-asili-green">
                    Discuss this <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" aria-hidden="true" />
                  </a>
                </article>
              </FadeIn>
            ))}
          </div>
        </div>

        <FadeIn className="mt-16 overflow-hidden rounded-[3rem] bg-asili-green p-8 text-white sm:p-12">
          <div className="grid gap-8 lg:grid-cols-[0.8fr_1.2fr] lg:gap-14">
            <div>
              <span className="text-[9px] font-black uppercase tracking-[0.3em] text-asili-honey">Impact by design</span>
              <h2 className="mt-5 text-3xl font-bold sm:text-4xl">Commercial growth should strengthen the landscape behind it.</h2>
            </div>
            <div className="grid gap-4 sm:grid-cols-3">
              {[
                ["Community livelihoods", "Designed to support training, clearer off-take relationships and stronger market access for beekeepers as the network grows."],
                ["Biodiversity", "Bees and responsible hive placement can support pollination and healthier local ecosystems when programmes are well managed."],
                ["Climate resilience", "Beekeeping can diversify income in semi-arid areas while encouraging landscapes whose value extends beyond a single harvest."],
              ].map(([title, text]) => (
                <div key={title} className="rounded-2xl border border-white/10 bg-white/[0.05] p-5">
                  <h3 className="text-lg font-bold text-asili-honey">{title}</h3>
                  <p className="mt-3 text-xs leading-relaxed text-white/60">{text}</p>
                </div>
              ))}
            </div>
          </div>
        </FadeIn>
      </Section>

      <Section id="ways-to-enjoy" motif={{ tone: "dark", side: "right", quiet: true }}>
        <div className="grid items-center gap-12 lg:grid-cols-[1fr_1fr] lg:gap-20">
          <FadeIn>
            <div className="premium-card relative overflow-hidden rounded-[3rem] border border-asili-gold/15 bg-[radial-gradient(circle_at_25%_20%,rgba(212,175,55,0.16),transparent_35%),#141414] p-9 sm:p-12">
              <Sparkles className="h-8 w-8 text-asili-gold" aria-hidden="true" />
              <p className="mt-12 font-serif text-3xl font-bold italic leading-snug text-asili-gold sm:text-4xl">
                The difference is not a health claim. It is the quality, origin and responsibility behind the jar.
              </p>
              <p className="mt-5 text-sm leading-relaxed text-asili-cream/55">Natural variation is welcome. Unverified medical promises are not.</p>
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
                ["Gifting", "Ask about current personal, event and corporate gifting options."],
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

      <Section id="faq" className="border-y border-asili-gold/20 bg-[#f4ebda] text-asili-green">
        <div className="grid gap-12 lg:grid-cols-[0.7fr_1.3fr] lg:gap-20">
          <FadeIn>
            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-asili-earth">Before you order</span>
            <h2 className="mt-5 text-4xl font-bold sm:text-5xl">Honey questions, plainly answered.</h2>
          </FadeIn>
          <div className="divide-y divide-asili-green/10 border-y border-asili-green/10">
            {[
              ["Is Asili honey really raw and unheated?", "Yes. Asili honey is natural, raw and not heat-treated. Its appearance and texture can vary naturally by season, flora and batch."],
              ["What sizes and prices are available?", "Message us on WhatsApp and we will confirm current jar sizes, retail or bulk price, and available quantity for the batch before you pay."],
              ["How does delivery work?", "Collection or delivery details are agreed when your order is confirmed. Delivery can be facilitated at the customer’s expense."],
              ["Where is the honey sourced?", "The current Asili honey story is rooted in Makueni, Kenya. Specific source information will be shared where it has been captured and reviewed for the batch."],
              ["Does crystallisation mean honey has spoiled?", "No. Crystallisation is a natural change in honey. Place the closed jar in warm—not boiling—water if you prefer a more liquid texture."],
              ["Can I discuss a hive, CSR or pollination partnership?", "Yes. These models are at different stages of development, so use the inquiry form or WhatsApp and we will discuss the relevant concept, feasibility and next step honestly."],
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

      <Section id="contact" className="bg-asili-black">
        <div className="grid overflow-hidden rounded-[3rem] border border-asili-gold/20 bg-[#f8f1e4] shadow-2xl lg:grid-cols-[0.85fr_1.15fr]">
          <div className="bg-asili-gold p-8 text-asili-black sm:p-12">
            <Package className="h-8 w-8" aria-hidden="true" />
            <h2 className="mt-8 text-4xl font-bold">Order or inquire.</h2>
            <p className="mt-4 max-w-md text-sm leading-relaxed text-asili-black/65">
              Ask about honey, retail, bulk supply, gifting or a partnership model. We will confirm what is available now and what is still being developed.
            </p>
            <a
              href={whatsappUrl("Hello Asili, I would like to make an inquiry about your honey or partnership options.")}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-8 inline-flex items-center gap-2 text-sm font-black"
            >
              Message us on WhatsApp <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </a>
          </div>
          <div className="p-8 sm:p-12">
            <ContactForm theme="nature" type="Honey" />
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
          African Roots, Semi-Arid Products. Natural, raw and unheated Makueni honey shaped by quality, visible origin and shared value.
        </p>
      </div>
      <div>
        <h2 className={cn("text-[10px] font-black uppercase tracking-[0.25em]", theme === "luxury" ? "text-asili-gold" : "text-asili-honey")}>Navigate</h2>
        <div className="mt-5 flex flex-col gap-3 text-sm">
          <a href={page === "home" ? "#story" : "/#story"} className="opacity-60 hover:opacity-100">Our story</a>
          <a href={page === "home" ? "#mission" : "/#mission"} className="opacity-60 hover:opacity-100">Mission & vision</a>
          <a href="/honey/" className="opacity-60 hover:opacity-100">Our honey</a>
          <a href={page === "home" ? "#partners" : "#ecosystem"} className="opacity-60 hover:opacity-100">Partners</a>
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
