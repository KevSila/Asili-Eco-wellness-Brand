/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useRef, useState } from "react";
import { motion, useScroll, AnimatePresence } from "motion/react";
import { 
  Leaf, 
  Droplets, 
  Users, 
  Globe, 
  TrendingUp, 
  Award, 
  ArrowRight, 
  Sprout, 
  Zap,
  ChevronRight,
  Mail,
  Instagram,
  Facebook,
  Twitter,
  Package,
  Shirt,
  Home,
  Heart,
  Rocket,
  Search
} from "lucide-react";
import { cn } from "@/src/lib/utils";

const CATALOGUE_DATA = [
  {
    id: "wellness",
    title: "Agro-Processing",
    icon: <Leaf className="w-5 h-5" />,
    description: "Transforming indigenous resources into world-class health products.",
    items: [
      { name: "Raw Forest Honey", desc: "Unfiltered, nutrient-rich honey from our living laboratory.", price: "Premium" },
      { name: "Moringa Superfood", desc: "Cold-pressed oils and nutrient-dense leaf powders.", price: "Essential" },
      { name: "Baobab Essence", desc: "Vitamin C rich fruit pulp and revitalizing seed oils.", price: "Luxury" },
      { name: "Indigenous Oils", desc: "Artisanal essential oils from local flora.", price: "Artisanal" }
    ]
  },
  {
    id: "packaging",
    title: "Eco-Packaging",
    icon: <Package className="w-5 h-5" />,
    description: "Eliminating plastic through nature-inspired containment solutions.",
    items: [
      { name: "Beeswax Wraps", desc: "Reusable, antibacterial food storage made from local wax.", price: "Eco-Friendly" },
      { name: "Mycelium Boxes", desc: "Mushroom-based biodegradable shipping containers.", price: "Innovation" },
      { name: "Bamboo Containers", desc: "Durable, compostable jars for wellness products.", price: "Sustainable" }
    ]
  },
  {
    id: "fashion",
    title: "Afro-Eco Fashion",
    icon: <Shirt className="w-5 h-5" />,
    description: "Wearable sustainability rooted in African textile heritage.",
    items: [
      { name: "Organic Cotton Tees", desc: "Sustainably sourced cotton with natural plant dyes.", price: "Heritage" },
      { name: "Recycled Accessories", desc: "Jewelry crafted from upcycled farm materials.", price: "Unique" },
      { name: "Bark Cloth Accents", desc: "Traditional Ugandan bark cloth in modern silhouettes.", price: "Artisanal" }
    ]
  },
  {
    id: "home",
    title: "Sustainable Home",
    icon: <Home className="w-5 h-5" />,
    description: "Bringing the essence of nature into your living space.",
    items: [
      { name: "Natural Cleaners", desc: "Plant-based, non-toxic household solutions.", price: "Pure" },
      { name: "Bamboo Utensils", desc: "Hand-carved kitchenware from sustainable groves.", price: "Crafted" },
      { name: "Beeswax Candles", desc: "Pure, clean-burning candles with natural scents.", price: "Atmospheric" }
    ]
  },
  {
    id: "kits",
    title: "Wellness Kits",
    icon: <Heart className="w-5 h-5" />,
    description: "Curated experiences for holistic health and gifting.",
    items: [
      { name: "The Ritual Box", desc: "A complete morning wellness set with honey and moringa.", price: "Curated" },
      { name: "Traveler's Kit", desc: "Compact essentials for sustainable living on the go.", price: "Essential" },
      { name: "Eco-Gift Set", desc: "The perfect introduction to the Asili lifestyle.", price: "Giftable" }
    ]
  },
  {
    id: "tech",
    title: "Future Tech",
    icon: <Rocket className="w-5 h-5" />,
    description: "Scaling impact through innovation and smart systems.",
    items: [
      { name: "Smart Beehives", desc: "IoT-enabled hives for optimal colony health monitoring.", price: "R&D" },
      { name: "Circular Waste Hub", desc: "Modular systems for farm-to-fuel conversion.", price: "Infrastructure" },
      { name: "Digital Traceability", desc: "Blockchain-backed sourcing for every product.", price: "Transparency" }
    ]
  }
];

const CatalogueTabs = () => {
  const [activeTab, setActiveTab] = useState(CATALOGUE_DATA[0].id);

  return (
    <div className="space-y-12">
      {/* Tab Navigation */}
      <div className="flex flex-wrap justify-center gap-4">
        {CATALOGUE_DATA.map((category) => (
          <button
            key={category.id}
            onClick={() => setActiveTab(category.id)}
            className={cn(
              "flex items-center gap-2 px-6 py-3 rounded-full text-sm font-medium transition-all duration-300",
              activeTab === category.id
                ? "bg-asili-green text-white shadow-lg scale-105"
                : "bg-asili-cream text-asili-green/60 hover:bg-asili-honey/10 hover:text-asili-green"
            )}
          >
            {category.icon}
            {category.title}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="relative min-h-[400px]">
        <AnimatePresence mode="wait">
          {CATALOGUE_DATA.map((category) => (
            activeTab === category.id && (
              <motion.div
                key={category.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.4 }}
                className="grid md:grid-cols-2 gap-8 items-start"
              >
                <div className="space-y-6">
                  <div className="p-8 rounded-3xl bg-asili-cream border border-asili-honey/20">
                    <h3 className="text-3xl font-bold mb-4 text-asili-green">{category.title}</h3>
                    <p className="text-lg text-asili-green/70 leading-relaxed">{category.description}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-6 rounded-2xl bg-asili-leaf/10 border border-asili-leaf/20">
                      <span className="text-xs font-mono uppercase tracking-wider text-asili-leaf block mb-1">Impact</span>
                      <span className="font-bold text-asili-green">100% Sustainable</span>
                    </div>
                    <div className="p-6 rounded-2xl bg-asili-honey/10 border border-asili-honey/20">
                      <span className="text-xs font-mono uppercase tracking-wider text-asili-honey block mb-1">Source</span>
                      <span className="font-bold text-asili-green">Local Heritage</span>
                    </div>
                  </div>
                </div>

                <div className="grid gap-4">
                  {category.items.map((item, idx) => (
                    <motion.div
                      key={item.name}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.1 }}
                      className="group p-6 rounded-2xl bg-white border border-asili-honey/10 hover:border-asili-honey hover:shadow-xl transition-all duration-300"
                    >
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="font-bold text-xl text-asili-green group-hover:text-asili-honey transition-colors">{item.name}</h4>
                        <span className="text-xs font-mono px-2 py-1 rounded bg-asili-cream text-asili-honey uppercase tracking-tighter">{item.price}</span>
                      </div>
                      <p className="text-asili-green/60 text-sm leading-relaxed">{item.desc}</p>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            )
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
};

const Section = ({ children, className, id }: { children: React.ReactNode, className?: string, id?: string }) => (
  <section id={id} className={cn("py-20 px-6 md:px-12 lg:px-24", className)}>
    {children}
  </section>
);

interface FadeInProps {
  children: React.ReactNode;
  delay?: number;
  key?: React.Key;
}

const FadeIn = ({ children, delay = 0 }: FadeInProps) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true }}
    transition={{ duration: 0.8, delay }}
  >
    {children}
  </motion.div>
);

export default function App() {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"]
  });

  return (
    <div ref={containerRef} className="relative min-h-screen selection:bg-asili-honey selection:text-white">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 glass h-16 flex items-center justify-between px-6 md:px-12">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-asili-green rounded-full flex items-center justify-center">
            <Leaf className="text-asili-honey w-5 h-5" />
          </div>
          <span className="font-serif text-xl font-bold tracking-tight">ASILI</span>
        </div>
        <div className="hidden md:flex items-center gap-8 text-sm font-medium">
          <a href="#about" className="hover:text-asili-honey transition-colors">About</a>
          <a href="#foundation" className="hover:text-asili-honey transition-colors">Foundation</a>
          <a href="#catalogue" className="hover:text-asili-honey transition-colors">Catalogue</a>
          <a href="#honey" className="hover:text-asili-honey transition-colors">Honey Venture</a>
          <a href="#impact" className="hover:text-asili-honey transition-colors">Impact</a>
          <a href="#financials" className="hover:text-asili-honey transition-colors">Roadmap</a>
        </div>
        <a 
          href="https://linktr.ee/kevinsila" 
          target="_blank" 
          rel="noopener noreferrer"
          className="bg-asili-green text-white px-5 py-2 rounded-full text-sm font-medium hover:bg-asili-leaf transition-all"
        >
          Connect
        </a>
      </nav>

      {/* Hero Section */}
      <section className="relative h-screen flex items-center justify-center overflow-hidden pt-16">
        <div className="absolute inset-0 z-0">
          <img 
            src="https://images.unsplash.com/photo-1589615232296-115410c3f275?q=80&w=2070&auto=format&fit=crop" 
            alt="African Nature" 
            className="w-full h-full object-cover opacity-30 grayscale-[0.5]"
            referrerPolicy="no-referrer"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-asili-cream/50 via-transparent to-asili-cream"></div>
        </div>

        <div className="relative z-10 text-center max-w-4xl px-6">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1 }}
          >
            <span className="text-asili-honey font-mono text-sm tracking-[0.2em] uppercase mb-4 block">
              Africa's Eco-Wellness Movement
            </span>
            <h1 className="text-6xl md:text-8xl font-bold mb-6 leading-[0.9]">
              Healing People <br />
              <span className="italic text-asili-leaf">& the Planet</span>
            </h1>
            <p className="text-lg md:text-xl text-asili-green/80 max-w-2xl mx-auto mb-10 leading-relaxed">
              Asili bridges the gap between rich African heritage and modern sustainable living by transforming local, indigenous resources into world-class wellness products.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <button className="bg-asili-green text-white px-8 py-4 rounded-full font-medium flex items-center gap-2 hover:gap-4 transition-all group">
                Explore Our Vision <ArrowRight className="w-5 h-5" />
              </button>
              <button className="border border-asili-green text-asili-green px-8 py-4 rounded-full font-medium hover:bg-asili-green hover:text-white transition-all">
                The Pitch Deck
              </button>
            </div>
          </motion.div>
        </div>

        {/* Floating Elements */}
        <motion.div 
          animate={{ y: [0, -20, 0] }}
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
          className="absolute bottom-20 left-10 hidden lg:block"
        >
          <div className="glass p-4 rounded-2xl flex items-center gap-3">
            <div className="w-10 h-10 bg-asili-honey/20 rounded-full flex items-center justify-center">
              <Sprout className="text-asili-honey" />
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-wider">Sustainable</p>
              <p className="text-[10px] opacity-60">100% Organic Sourcing</p>
            </div>
          </div>
        </motion.div>
      </section>

      {/* Introduction */}
      <Section id="about" className="bg-white">
        <div className="grid md:grid-cols-2 gap-16 items-center">
          <FadeIn>
            <div className="relative">
              <div className="aspect-[4/5] rounded-[2rem] overflow-hidden">
                <img 
                  src="https://images.unsplash.com/photo-1473973266408-ed4e27abdd47?q=80&w=1974&auto=format&fit=crop" 
                  alt="Raw Honey" 
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
              </div>
              <div className="absolute -bottom-8 -right-8 w-48 h-48 bg-asili-honey rounded-full flex items-center justify-center text-white text-center p-6 border-8 border-white">
                <p className="font-serif italic text-lg leading-tight">"Asili" means origin, essence, and nature.</p>
              </div>
            </div>
          </FadeIn>
          <FadeIn delay={0.2}>
            <h2 className="text-4xl md:text-5xl font-bold mb-8">What is Asili?</h2>
            <div className="space-y-6 text-lg text-asili-green/80 leading-relaxed">
              <p>
                We are more than just a brand; we are a movement. Asili is dedicated to reclaiming the narrative of African wellness by utilizing indigenous resources like raw honey, moringa, and baobab.
              </p>
              <p>
                Our mission is to transform these local treasures into world-class products that promote health while restoring our ecosystems and empowering our communities.
              </p>
              <div className="grid grid-cols-2 gap-6 pt-6">
                <div className="border-l-2 border-asili-honey pl-4">
                  <h4 className="font-bold text-2xl">Indigenous</h4>
                  <p className="text-sm opacity-60 uppercase tracking-widest">Resources</p>
                </div>
                <div className="border-l-2 border-asili-honey pl-4">
                  <h4 className="font-bold text-2xl">Modern</h4>
                  <p className="text-sm opacity-60 uppercase tracking-widest">Sustainability</p>
                </div>
              </div>
            </div>
          </FadeIn>
        </div>
      </Section>

      {/* The Foundation */}
      <Section id="foundation" className="bg-asili-green text-asili-cream">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <FadeIn>
              <h2 className="text-4xl md:text-5xl font-bold mb-4">Our Living Laboratory</h2>
              <p className="text-asili-cream/60 max-w-2xl mx-auto">Rooted in a family farm that serves as the foundation for our circular systems.</p>
            </FadeIn>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              { 
                icon: <Zap className="w-6 h-6" />, 
                title: "Active Traction", 
                desc: "6 active beehives, seasonal mango and orange orchards, and a dairy unit of Friesian cows." 
              },
              { 
                icon: <Users className="w-6 h-6" />, 
                title: "Immediate Impact", 
                desc: "Direct employment for local youth and women, bringing value-addition to the community level." 
              },
              { 
                icon: <Droplets className="w-6 h-6" />, 
                title: "Circular Systems", 
                desc: "Farm waste (like dairy manure) is converted into organic compost, reducing our footprint." 
              }
            ].map((item, i) => (
              <FadeIn key={i} delay={i * 0.1}>
                <div className="bg-white/10 p-8 rounded-3xl border border-white/10 hover:bg-white/20 transition-all group">
                  <div className="w-12 h-12 bg-asili-honey rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                    {item.icon}
                  </div>
                  <h3 className="text-2xl font-bold mb-4">{item.title}</h3>
                  <p className="text-asili-cream/70 leading-relaxed">{item.desc}</p>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </Section>

      {/* Catalogue Section */}
      <Section id="catalogue" className="bg-white">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <FadeIn>
              <span className="text-asili-honey font-mono text-sm tracking-widest uppercase mb-4 block">Our Visionary Portfolio</span>
              <h2 className="text-4xl md:text-5xl font-bold mb-4">The Asili Catalogue</h2>
              <p className="text-asili-green/60 max-w-2xl mx-auto">A tiered ecosystem moving from immediate natural products to high-tech sustainable innovations.</p>
            </FadeIn>
          </div>

          <CatalogueTabs />
        </div>
      </Section>

      {/* Scaling the Honey Venture */}
      <Section id="honey">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          <FadeIn>
            <span className="text-asili-honey font-mono text-sm tracking-widest uppercase mb-4 block">Phase 1: The Entry Point</span>
            <h2 className="text-4xl md:text-5xl font-bold mb-8 leading-tight">The "Hub-and-Spoke" <br />Honey Model</h2>
            <p className="text-lg text-asili-green/80 mb-8 leading-relaxed">
              We are starting with Honey because it is a "High Feasibility" entry point with massive global demand in the $9 trillion wellness economy.
            </p>
            
            <div className="space-y-6">
              {[
                { title: "Training & Equipment", desc: "Providing farmers with modern, high-yield beehives and ethical harvesting training." },
                { title: "Off-take Agreement", desc: "Asili guarantees to buy 100% of production at fair-trade prices." },
                { title: "Cooperative Partnership", desc: "Working with local county cooperatives for aggregation and quality control." }
              ].map((step, i) => (
                <div key={i} className="flex gap-4">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-asili-honey/20 flex items-center justify-center text-asili-honey font-bold">
                    {i + 1}
                  </div>
                  <div>
                    <h4 className="font-bold text-xl mb-1">{step.title}</h4>
                    <p className="text-asili-green/60">{step.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </FadeIn>
          
          <FadeIn delay={0.3}>
            <div className="bg-asili-honey rounded-[3rem] p-12 text-white relative overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-20 -mt-20 blur-3xl"></div>
              <h3 className="text-3xl font-bold mb-6">Regional Powerhouse</h3>
              <p className="text-white/80 mb-8 leading-relaxed">
                Asili will act as the "Central Hub" for a network of smallholder beekeepers across Kitui, Makueni, and Machakos.
              </p>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-white/10 rounded-2xl">
                  <span>Target Farmers</span>
                  <span className="font-bold text-xl">500+</span>
                </div>
                <div className="flex items-center justify-between p-4 bg-white/10 rounded-2xl">
                  <span>Global Demand Growth</span>
                  <span className="font-bold text-xl">7.3%</span>
                </div>
              </div>
              <div className="mt-10">
                <img 
                  src="https://images.unsplash.com/photo-1558583055-d7ac00b1adca?q=80&w=1974&auto=format&fit=crop" 
                  alt="Beekeeping" 
                  className="rounded-2xl w-full h-48 object-cover shadow-2xl"
                  referrerPolicy="no-referrer"
                />
              </div>
            </div>
          </FadeIn>
        </div>
      </Section>

      {/* Impact Metrics */}
      <Section id="impact" className="bg-asili-cream border-y border-asili-green/10">
        <div className="text-center mb-16">
          <FadeIn>
            <h2 className="text-4xl md:text-5xl font-bold mb-4">People, Planet, and Profit</h2>
            <p className="text-asili-green/60 max-w-2xl mx-auto">Designed to maximize impact metrics, making Asili a magnet for climate-smart funding.</p>
          </FadeIn>
        </div>

        <div className="grid md:grid-cols-3 gap-12">
          {[
            { 
              title: "Social (People)", 
              icon: <Users className="w-8 h-8" />,
              metrics: ["500+ Smallholder Farmers", "Dozens of Youth Jobs", "Women Empowerment"],
              color: "bg-blue-50 text-blue-600"
            },
            { 
              title: "Environmental (Planet)", 
              icon: <Globe className="w-8 h-8" />,
              metrics: ["Biodiversity Protection", "Climate Resilience", "ASAL Region Restoration"],
              color: "bg-green-50 text-green-600"
            },
            { 
              title: "Economic (Profit)", 
              icon: <TrendingUp className="w-8 h-8" />,
              metrics: ["Branded Wellness Products", "Higher Profit Margins", "Export Potential"],
              color: "bg-amber-50 text-amber-600"
            }
          ].map((impact, i) => (
            <FadeIn key={i} delay={i * 0.1}>
              <div className="bg-white p-10 rounded-[2.5rem] shadow-sm hover:shadow-xl transition-all h-full flex flex-col">
                <div className={cn("w-16 h-16 rounded-2xl flex items-center justify-center mb-8", impact.color)}>
                  {impact.icon}
                </div>
                <h3 className="text-2xl font-bold mb-6">{impact.title}</h3>
                <ul className="space-y-4 flex-grow">
                  {impact.metrics.map((m, j) => (
                    <li key={j} className="flex items-center gap-3 text-asili-green/70">
                      <ChevronRight className="w-4 h-4 text-asili-honey" />
                      {m}
                    </li>
                  ))}
                </ul>
              </div>
            </FadeIn>
          ))}
        </div>
      </Section>

      {/* Financial Roadmap */}
      <Section id="financials">
        <div className="max-w-5xl mx-auto">
          <div className="grid md:grid-cols-2 gap-16">
            <FadeIn>
              <h2 className="text-4xl font-bold mb-8">Financial Roadmap</h2>
              <div className="space-y-8">
                <div className="p-6 bg-white rounded-3xl border border-asili-green/5">
                  <h4 className="text-asili-honey font-bold uppercase text-xs tracking-widest mb-2">Startup Estimate</h4>
                  <p className="text-3xl font-bold">KSh 400k – 1M</p>
                  <p className="text-sm text-asili-green/60 mt-2">Small-batch processing setup (filters, dryers, packaging).</p>
                </div>
                <div className="p-6 bg-asili-green text-white rounded-3xl">
                  <h4 className="text-asili-honey font-bold uppercase text-xs tracking-widest mb-2">The "Lean" Edge</h4>
                  <p className="text-lg leading-relaxed">Initially using a white-labeling strategy to launch branded honey jars with minimal upfront CAPEX.</p>
                </div>
              </div>
            </FadeIn>

            <FadeIn delay={0.2}>
              <h3 className="text-2xl font-bold mb-6 flex items-center gap-2">
                <TrendingUp className="text-asili-honey" /> Revenue Streams
              </h3>
              <div className="space-y-4">
                {[
                  { name: "B2C", desc: "Direct sales via e-commerce and premium organic shops (Carrefour, Quickmart)." },
                  { name: "B2B", desc: "Supplying bulk certified raw materials to cosmetic and pharma industries." },
                  { name: "Exports", desc: "Targeting high-margin diaspora markets in EU, US, and UAE within 36 months." }
                ].map((stream, i) => (
                  <div key={i} className="p-5 border border-asili-green/10 rounded-2xl hover:border-asili-honey transition-colors group">
                    <h4 className="font-bold text-lg group-hover:text-asili-honey transition-colors">{stream.name}</h4>
                    <p className="text-asili-green/60 text-sm">{stream.desc}</p>
                  </div>
                ))}
              </div>
            </FadeIn>
          </div>
        </div>
      </Section>

      {/* Why Fundable */}
      <Section className="bg-asili-honey/10 overflow-hidden relative">
        <div className="absolute top-0 right-0 opacity-10">
          <Leaf className="w-96 h-96 -mr-20 -mt-20 rotate-45" />
        </div>
        
        <div className="max-w-4xl mx-auto relative z-10">
          <div className="text-center mb-12">
            <FadeIn>
              <h2 className="text-4xl md:text-5xl font-bold mb-4">Why Asili is "Fundable" Today</h2>
              <p className="text-asili-green/60">Aligned with the exact criteria required by major impact investors.</p>
            </FadeIn>
          </div>

          <div className="grid sm:grid-cols-3 gap-6">
            {[
              { title: "Climate-Smart", icon: <Globe />, desc: "Qualifies for KCIC & ARAF due to climate resilience focus." },
              { title: "Youth Led", icon: <Users />, desc: "Fits Uwezo Fund & K-YES mandates for empowerment." },
              { title: "Innovation", icon: <Award />, desc: "Superfood blends eligible for health-innovation grants." }
            ].map((card, i) => (
              <FadeIn key={i} delay={i * 0.1}>
                <div className="bg-white p-8 rounded-3xl text-center shadow-sm">
                  <div className="w-12 h-12 bg-asili-honey/20 rounded-full flex items-center justify-center mx-auto mb-4 text-asili-honey">
                    {card.icon}
                  </div>
                  <h4 className="font-bold mb-2">{card.title}</h4>
                  <p className="text-xs text-asili-green/60">{card.desc}</p>
                </div>
              </FadeIn>
            ))}
          </div>

          <FadeIn delay={0.4}>
            <div className="mt-16 p-8 glass rounded-[2rem] text-center border-asili-honey/30">
              <p className="text-xl italic font-serif text-asili-green/80">
                "Asili is not just a farm; it is a scalable, tech-enabled ecosystem designed to heal people and the planet, one jar of honey at a time."
              </p>
              <p className="mt-4 font-bold uppercase tracking-widest text-sm">— Kevin Yumbya Sila, Founder</p>
            </div>
          </FadeIn>
        </div>
      </Section>

      {/* Footer */}
      <footer className="bg-asili-green text-asili-cream py-20 px-6 md:px-12 lg:px-24">
        <div className="max-w-6xl mx-auto grid md:grid-cols-4 gap-12">
          <div className="md:col-span-2">
            <div className="flex items-center gap-2 mb-6">
              <div className="w-8 h-8 bg-asili-honey rounded-full flex items-center justify-center">
                <Leaf className="text-asili-green w-5 h-5" />
              </div>
              <span className="font-serif text-2xl font-bold tracking-tight">ASILI</span>
            </div>
            <p className="text-asili-cream/60 max-w-sm mb-8 leading-relaxed">
              Africa's Eco-Wellness Movement. Bridging African heritage and modern sustainable living.
            </p>
          </div>
          
          <div>
            <h4 className="font-bold mb-6 uppercase tracking-widest text-xs text-asili-honey">Navigation</h4>
            <ul className="space-y-4 text-asili-cream/60">
              <li><a href="#about" className="hover:text-white transition-colors">About Us</a></li>
              <li><a href="#foundation" className="hover:text-white transition-colors">Our Foundation</a></li>
              <li><a href="#catalogue" className="hover:text-white transition-colors">Catalogue</a></li>
              <li><a href="#honey" className="hover:text-white transition-colors">Honey Venture</a></li>
              <li><a href="#impact" className="hover:text-white transition-colors">Impact Metrics</a></li>
            </ul>
          </div>

          <div>
            <h4 className="font-bold mb-6 uppercase tracking-widest text-xs text-asili-honey">Contact</h4>
            <ul className="space-y-4 text-asili-cream/60">
              <li className="flex items-center gap-3">
                <Mail className="w-4 h-4" /> 
                <a href="mailto:kevinsila100@gmail.com" className="hover:text-white transition-colors">kevinsila100@gmail.com</a>
              </li>
              <li className="flex items-center gap-3">
                <Zap className="w-4 h-4" /> 
                <a href="https://wa.me/254717578394" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">+254 717 578 394</a>
              </li>
              <li className="flex items-center gap-3">
                <Globe className="w-4 h-4" /> 
                <a href="https://linktr.ee/kevinsila" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">linktr.ee/kevinsila</a>
              </li>
            </ul>
          </div>
        </div>
        <div className="max-w-6xl mx-auto mt-20 pt-8 border-t border-white/10 flex flex-col md:row justify-between items-center gap-4 text-xs text-asili-cream/40">
          <p>© 2026 Asili Eco-Wellness. All rights reserved.</p>
          <div className="flex gap-8">
            <a href="#" className="hover:text-white transition-colors">Privacy Policy</a>
            <a href="#" className="hover:text-white transition-colors">Terms of Service</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
