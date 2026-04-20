/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useRef, useState, useEffect } from "react";
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
  Search,
  Menu,
  X
} from "lucide-react";
import { cn } from "@/src/lib/utils";

const BRAND_CATALOGUE = [
  {
    id: "wellness",
    title: "Agro-Processing",
    icon: <Leaf className="w-5 h-5" />,
    description: "Transforming indigenous resources into world-class health products.",
    items: [
      { name: "Asili Flow Shots", desc: "Honey + MCT Oil + Caffeine. Performance fuel for athletes.", price: "Performance" },
      { name: "Moringa Superfood", desc: "Cold-pressed oils and nutrient-dense leaf powders.", price: "Essential" },
      { name: "Baobab Essence", desc: "Vitamin C rich fruit pulp and revitalizing seed oils.", price: "Luxury" },
      { name: "Bee-Venom Skincare", desc: "Natural 'Botox' serum using ethically harvested venom.", price: "Beauty" }
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
    id: "tech",
    title: "Agri-Tech Hub",
    icon: <Rocket className="w-5 h-5" />,
    description: "Scaling trust through blockchain-backed traceability and satellite forage mapping.",
    items: [
      { name: "Glass Hive Tech", desc: "Real-time hive monitoring and QR-linked batch data.", price: "Traceability" },
      { name: "Satellite mapping", desc: "AI-driven forage detection for optimal hive placement.", price: "Precision" },
      { name: "Blockchain Ledger", desc: "Immutable records of purity and farmer income data.", price: "Integrity" }
    ]
  }
];

const HONEY_CATALOGUE = [
  {
    id: "gold",
    title: "The Gold Collection",
    icon: <Award className="w-5 h-5" />,
    description: "Our flagship single-origin honeys, verified by KeBS with a Digital Certificate of Analysis.",
    items: [
      { name: "Single-Origin Makueni", desc: "Acacia nectar. KeBS Certified. Refractometer moisture < 17%.", price: "Premium" },
      { name: "The Glass Hive Batch", desc: "Batch-specific honey. Scan QR for time-lapse of your hive.", price: "Ultra-Premium" },
      { name: "Propolis Tincture", desc: "70% concentrated propolis extract. Nature's strongest antibiotic.", price: "Clinical" },
      { name: "Royal Jelly Essence", desc: "Freshly harvested cold-stored essence. The queen's fuel.", price: "Luxury" }
    ]
  },
  {
    id: "baas",
    title: "Bee-as-a-Service",
    icon: <Users className="w-5 h-5" />,
    description: "A hybrid subscription model creating predictable cash flow and direct social impact.",
    items: [
      { name: "Adopt-a-Hive (B2C)", desc: "Rent a hive in Makueni. Get 10kg/yr of your Private Reserve.", price: "Subscription" },
      { name: "Corporate Pollination", desc: "CSR-driven sponsorship for banks and tech companies.", price: "CSR Impact" },
      { name: "Private Reserve", desc: "Branded honey jars for gifts. Exclusive to hive adopters.", price: "Exclusive" }
    ]
  },
  {
    id: "industrial",
    title: "Industrial & Ecosystem",
    icon: <Droplets className="w-5 h-5" />,
    description: "High-value industrial supply and essential services for commercial orchards.",
    items: [
      { name: "Industrial Traceable", desc: "20L buckets for premium bakeries with Purity Certificates.", price: "B2B Supply" },
      { name: "Pollination Credits", desc: "Service for citrus and mango orchards across Eastern Kenya.", price: "Service" },
      { name: "White Labeling", desc: "Partner with Artcaffe or Java using our Quality Hub honey.", price: "Wholesale" }
    ]
  }
];

const IMPACT_METRICS = [
  { 
    title: "The Glass Hive", 
    subtitle: "Radical Transparency",
    icon: <Search className="w-10 h-10" />,
    description: "Transforming from honey sellers to trust providers. Eliminating fear of adulteration through real-time tech.",
    metrics: ["QR Traceability", "Purity Guarantees", "Batch Live-Stream"],
    color: "bg-[#f4f7f2] border-[#e1e8dc] text-asili-green"
  },
  { 
    title: "Hub & Spoke", 
    subtitle: "Aggregated Impact",
    icon: <Users className="w-10 h-10" />,
    description: "Scaling through a central Quality Hub that empowers local producers with 'Obadoni' protocols.",
    metrics: ["10+ Local Spokes", "KeBS Hub Testing", "Income Tracking"],
    color: "bg-[#fcf9f2] border-[#f2e7d5] text-asili-honey"
  },
  { 
    title: "Funding Magnet", 
    subtitle: "Grant-Worthy Tech",
    icon: <TrendingUp className="w-10 h-10" />,
    description: "Using blockchain and Satellite Forage Mapping to unlock international agri-tech grants.",
    metrics: ["USAID/KCIC Ready", "Blockchain Logs", "Impact Data API"],
    color: "bg-[#f9f7f2] border-[#eceae4] text-[#8b4513]"
  }
];

const PARTNERS_CONTENT = [
  { 
    title: "Investors", 
    value: "High-Growth Potential", 
    desc: "Join a scalable movement bridging 'Bee-as-a-Service' with the multi-billion dollar global wellness market." 
  },
  { 
    title: "Orchard Owners", 
    value: "Pollination Credits", 
    desc: "Partner with our mobile hives to increase your mango and citrus yields through precision pollination services." 
  },
  { 
    title: "Premium B2B", 
    value: "Traceable Supply", 
    desc: "Bespoke, large-scale supply for high-end bakeries and pharma brands requiring 'KeBS' purity certification." 
  }
];

const FUNDABILITY_CARDS = [
  { title: "Climate-Smart", icon: <Globe />, desc: "Qualifies for KCIC & ARAF due to climate resilience focus." },
  { title: "Youth Led", icon: <Users />, desc: "Fits Uwezo Fund & K-YES mandates for empowerment." },
  { title: "Innovation", icon: <Award />, desc: "Superfood blends eligible for health-innovation grants." }
];

const CatalogueTabs = ({ data, theme = "nature" }: { data: any[], theme?: "nature" | "luxury" }) => {
  const [activeTab, setActiveTab] = useState(data[0].id);

  return (
    <div className="space-y-16">
      {/* Tab Navigation */}
      <div className="flex flex-wrap justify-center gap-4 md:gap-8 border-b border-asili-honey/10 pb-8">
        {data.map((category) => (
          <button
            key={category.id}
            onClick={() => setActiveTab(category.id)}
            className={cn(
              "relative flex flex-col items-center gap-2 px-4 py-2 text-xs md:text-sm font-bold uppercase tracking-[0.2em] transition-all duration-300",
              activeTab === category.id
                ? theme === "luxury" 
                  ? "text-asili-gold"
                  : "text-asili-green"
                : "text-gray-400 hover:text-gray-600"
            )}
          >
            {category.title}
            {activeTab === category.id && (
              <motion.div 
                layoutId="activeTab"
                className={cn(
                  "absolute bottom-0 left-0 right-0 h-0.5",
                  theme === "luxury" ? "bg-asili-gold" : "bg-asili-green"
                )}
              />
            )}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="relative">
        <AnimatePresence mode="wait">
          {data.map((category) => (
            activeTab === category.id && (
              <motion.div
                key={category.id}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.5 }}
                className="grid lg:grid-cols-12 gap-12 items-start"
              >
                <div className="lg:col-span-5 space-y-8">
                  <div className={cn(
                    "p-10 rounded-[2.5rem] border backdrop-blur-sm",
                    theme === "luxury" ? "bg-asili-dark/50 border-asili-gold/20" : "bg-white/50 border-asili-honey/10"
                  )}>
                    <div className={cn(
                      "w-16 h-16 rounded-2xl flex items-center justify-center mb-8",
                      theme === "luxury" ? "bg-asili-gold/10 text-asili-gold" : "bg-asili-green/10 text-asili-green"
                    )}>
                      {category.icon}
                    </div>
                    <h3 className={cn(
                      "text-4xl font-bold mb-6 title-spacing",
                      theme === "luxury" ? "text-asili-gold" : "text-asili-green"
                    )}>{category.title}</h3>
                    <p className={cn(
                      "text-lg leading-relaxed opacity-80",
                      theme === "luxury" ? "text-asili-cream/70" : "text-asili-green/70"
                    )}>{category.description}</p>
                  </div>
                </div>

                <div className="lg:col-span-7 grid sm:grid-cols-2 gap-6">
                  {category.items.map((item, idx) => (
                    <motion.div
                      key={item.name}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.1 }}
                      className={cn(
                        "group p-8 rounded-3xl border transition-all duration-500 hover:-translate-y-2",
                        theme === "luxury" 
                          ? "bg-asili-dark border-asili-gold/10 hover:border-asili-gold hover:shadow-[0_20px_50px_rgba(212,175,55,0.1)]"
                          : "bg-white border-asili-honey/10 hover:border-asili-honey hover:shadow-[0_20px_50px_rgba(45,79,30,0.05)]"
                      )}
                    >
                      <div className="flex justify-between items-start mb-4">
                        <h4 className={cn(
                          "font-bold text-xl",
                          theme === "luxury" ? "text-asili-cream" : "text-asili-green"
                        )}>{item.name}</h4>
                        <span className={cn(
                          "text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-widest",
                          theme === "luxury" 
                            ? "bg-asili-gold/10 text-asili-gold"
                            : "bg-asili-cream text-asili-honey"
                        )}>{item.price}</span>
                      </div>
                      <p className={cn(
                        "text-sm leading-relaxed",
                        theme === "luxury" ? "text-asili-cream/40" : "text-asili-green/60"
                      )}>{item.desc}</p>
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

// Custom Visual Components to replace problematic images
const HoneyTechIllustration = () => (
  <div className="relative w-full h-full min-h-[400px] flex items-center justify-center p-8">
    <div className="absolute inset-0 bg-asili-honey/5 rounded-[5rem] overflow-hidden">
      <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'radial-gradient(#d4af37 1px, transparent 1px)', backgroundSize: '20px 20px' }}></div>
    </div>
    
    <div className="relative z-10 w-full max-w-lg aspect-square flex items-center justify-center">
      {/* Background circles */}
      <motion.div 
        animate={{ scale: [1, 1.1, 1], opacity: [0.3, 0.5, 0.3] }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        className="absolute w-4/5 h-4/5 rounded-full bg-asili-honey/10 blur-3xl"
      />
      
      {/* Main Illustration Structure */}
      <svg viewBox="0 0 400 400" className="w-full h-full drop-shadow-2xl">
        {/* Hexagonal Pattern */}
        <defs>
          <pattern id="hexagons" width="40" height="40" patternUnits="userSpaceOnUse" patternTransform="scale(0.5)">
            <path d="M20 0L37.32 10V30L20 40L2.68 30V10L20 0Z" fill="none" stroke="#d4af37" strokeWidth="0.5" opacity="0.3" />
          </pattern>
        </defs>
        
        {/* Abstract Leaf/Nature Pattern */}
        <motion.path 
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ pathLength: 1, opacity: 1 }}
          transition={{ duration: 2, ease: "easeInOut" }}
          d="M200 80C200 80 260 140 260 200C260 260 200 320 200 320C200 320 140 260 140 200C140 140 200 80 200 80Z" 
          fill="#2d4f1e" 
          opacity="0.1"
        />
        
        {/* Connected Nodes representing Traceability */}
        <g>
          {[
            { x: 120, y: 150 }, { x: 280, y: 150 }, 
            { x: 200, y: 120 }, { x: 200, y: 280 },
            { x: 150, y: 230 }, { x: 250, y: 230 }
          ].map((node, i) => (
            <motion.circle 
              key={i}
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.5 + i * 0.1 }}
              cx={node.x} cy={node.y} r="4" fill="#d4af37" 
            />
          ))}
          
          <motion.path 
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 1.5, delay: 1 }}
            d="M200 120 L120 150 L150 230 L200 280 L250 230 L280 150 Z" 
            fill="none" stroke="#d4af37" strokeWidth="1" strokeDasharray="4 4"
          />
        </g>
        
        {/* Central Icon */}
        <g transform="translate(180, 180) scale(0.8)">
          <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" fill="white" opacity="0.1" />
          <path d="M12 2v20M2 12h20M7 7l10 10M17 7L7 10" stroke="#d4af37" strokeWidth="2" strokeLinecap="round" />
        </g>
        
        {/* Golden Drops */}
        <motion.circle 
          animate={{ y: [0, 15, 0], opacity: [0.4, 0.8, 0.4] }}
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
          cx="200" cy="200" r="30" fill="url(#hexagons)" opacity="0.5"
        />
      </svg>
      
      {/* Floating Elements */}
      <div className="absolute top-10 right-10 p-4 glass rounded-2xl border border-asili-honey/20 shadow-xl backdrop-blur-md">
        <div className="flex items-center gap-2 mb-1">
          <div className="w-2 h-2 rounded-full bg-asili-honey"></div>
          <span className="text-[10px] font-bold uppercase tracking-widest text-asili-green">Origin Found</span>
        </div>
        <p className="text-[9px] font-mono text-asili-green/40 leading-none">MKW-254-HIVE7</p>
      </div>
    </div>
  </div>
);

const ResearchIllustration = () => (
  <div className="relative w-full h-[500px] flex items-center justify-center bg-asili-dark/50 rounded-[3.5rem] border border-asili-gold/10 overflow-hidden p-12">
    <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'linear-gradient(#d4af37 0.5px, transparent 0.5px), linear-gradient(90deg, #d4af37 0.5px, transparent 0.5px)', backgroundSize: '40px 40px' }}></div>
    
    <div className="relative z-10 w-full max-w-md h-full flex flex-col justify-center">
      <div className="flex items-center gap-4 mb-8">
        <div className="px-3 py-1 rounded bg-asili-gold text-asili-black text-[10px] font-bold uppercase tracking-wider">Analysis Active</div>
        <div className="h-px flex-1 bg-asili-gold/20"></div>
      </div>
      
      <div className="space-y-6">
        {[
          { label: "Purity Index", val: "99.8%", color: "text-asili-gold" },
          { label: "Moisture Content", val: "17.2%", color: "text-asili-gold" },
          { label: "Pollen Count", val: "High Density", color: "text-asili-cream" }
        ].map((item, i) => (
          <motion.div 
            key={i}
            initial={{ x: -20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: i * 0.2 }}
            className="flex flex-col gap-1"
          >
            <div className="flex justify-between text-[10px] uppercase tracking-widest opacity-40">
              <span>{item.label}</span>
              <span>Metric Verified</span>
            </div>
            <div className="flex items-end gap-4">
              <span className={`text-3xl font-mono font-bold ${item.color}`}>{item.val}</span>
              <div className="h-2 flex-1 bg-white/5 rounded-full overflow-hidden mb-2">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: "80%" }}
                  transition={{ duration: 1.5, delay: 0.5 }}
                  className="h-full bg-asili-gold/40"
                />
              </div>
            </div>
          </motion.div>
        ))}
      </div>
      
      {/* Schematic Hive SVG */}
      <div className="mt-12 w-full flex justify-center">
        <svg viewBox="0 0 200 100" className="w-full opacity-60">
          <path d="M40 20 L160 20 L160 80 L40 80 Z" fill="none" stroke="#d4af37" strokeWidth="1" />
          <path d="M40 40 L160 40 M40 60 L160 60" stroke="#d4af37" strokeWidth="1" opacity="0.3" />
          <circle cx="100" cy="50" r="15" fill="none" stroke="#d4af37" strokeWidth="1" strokeDasharray="3 3" />
          <path d="M100 35 L100 65 M85 50 L115 50" stroke="#d4af37" strokeWidth="1" opacity="0.5" />
        </svg>
      </div>
    </div>
  </div>
);

const AlchemyIllustration = () => (
  <div className="relative w-full h-[600px] rounded-[4rem] bg-asili-dark/80 border border-white/5 overflow-hidden flex items-center justify-center p-12">
    <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,#d4af3710_0%,transparent_70%)]"></div>
    
    <div className="relative z-10 w-full h-full flex flex-col items-center justify-center text-center">
      {/* Abstract Molecular Gold */}
      <div className="relative mb-12">
        <motion.div 
          animate={{ rotate: 360 }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
          className="w-64 h-64 border border-asili-gold/20 rounded-full flex items-center justify-center"
        >
          <motion.div 
            animate={{ rotate: -360 }}
            transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
            className="w-48 h-48 border border-asili-gold/40 rounded-full flex items-center justify-center border-dashed"
          >
            <div className="w-24 h-24 bg-asili-gold/30 rounded-full blur-xl animate-pulse"></div>
          </motion.div>
        </motion.div>
        
        {/* Atoms/Nodes */}
        {[0, 60, 120, 180, 240, 300].map((deg, i) => (
          <motion.div 
            key={i}
            animate={{ transform: `rotate(${deg}deg) translateY(-120px) scale(${[1, 1.2, 1][i%3]})` }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
            className="absolute top-1/2 left-1/2 w-3 h-3 bg-asili-gold rounded-full shadow-[0_0_15px_#d4af37]"
            style={{ marginTop: '-6px', marginLeft: '-6px' }}
          />
        ))}
      </div>
      
      <div className="space-y-4">
        <h3 className="text-asili-gold font-bold text-4xl italic font-serif">Aqueous Gold™</h3>
        <p className="text-white/40 text-sm max-w-sm font-light leading-relaxed">
          The molecular signature of Makueni blossom nectar, captured and verified for maximum enzymatic activity.
        </p>
        <div className="flex gap-4 justify-center pt-4">
          <div className="text-center">
            <span className="block text-asili-gold font-mono text-lg font-bold">17.5%</span>
            <span className="text-[8px] uppercase tracking-widest opacity-40">Humidity</span>
          </div>
          <div className="w-px h-8 bg-white/10"></div>
          <div className="text-center">
            <span className="block text-asili-gold font-mono text-lg font-bold">8.4 PH</span>
            <span className="text-[8px] uppercase tracking-widest opacity-40">Alkalinity</span>
          </div>
        </div>
      </div>
    </div>
  </div>
);

const HeritageIllustration = () => (
  <div className="relative w-full h-[400px] lg:h-[600px] flex items-center justify-center bg-asili-honey/5 rounded-[3.5rem] border border-asili-honey/10 overflow-hidden group">
    <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'radial-gradient(#2d4f1e 1px, transparent 1px)', backgroundSize: '30px 30px' }}></div>
    
    <div className="relative z-10 w-full max-w-sm flex flex-col items-center">
      <div className="relative mb-8">
        <motion.div 
          animate={{ scale: [1, 1.05, 1] }}
          transition={{ duration: 6, repeat: Infinity }}
          className="w-48 h-48 rounded-full border border-asili-green/20 flex items-center justify-center"
        >
          <div className="w-40 h-40 rounded-full border border-asili-green/40 flex items-center justify-center border-dashed">
            <Leaf className="w-16 h-16 text-asili-green opacity-40" />
          </div>
        </motion.div>
        
        {/* Geographic coordinates or markers */}
        <div className="absolute -top-4 -right-4 p-3 bg-white rounded-xl shadow-lg border border-asili-honey/20">
          <p className="text-[10px] font-bold text-asili-green">LOCATION</p>
          <p className="text-[8px] font-mono opacity-50">1.8025° S, 37.6203° E</p>
        </div>
      </div>
      
      <div className="text-center space-y-4 px-8">
        <h4 className="text-2xl font-bold text-asili-green font-serif">Makueni Dry-Lands</h4>
        <p className="text-xs text-asili-green/60 leading-relaxed uppercase tracking-[0.2em]">High yield floral density • Indigenous Acacia • Community Verified</p>
        <div className="pt-4 flex gap-2 justify-center">
          {[1, 2, 3, 4, 5].map(i => (
            <div key={i} className="w-1.5 h-1.5 rounded-full bg-asili-honey/30"></div>
          ))}
        </div>
      </div>
    </div>
    
    {/* Abstract terrain lines */}
    <svg className="absolute bottom-0 left-0 w-full opacity-10" viewBox="0 0 400 100">
      <path d="M0 80 Q100 20 200 80 T400 80" fill="none" stroke="#2d4f1e" strokeWidth="2" />
      <path d="M0 90 Q100 30 200 90 T400 90" fill="none" stroke="#2d4f1e" strokeWidth="2" />
    </svg>
  </div>
);

const LuxuryHeroIllustration = () => (
  <div className="absolute inset-0 overflow-hidden">
    <div className="absolute inset-0 bg-asili-black"></div>
    {/* Dynamic particles or light bokeh */}
    <div className="absolute inset-0 opacity-30">
      {Array.from({ length: 20 }).map((_, i) => (
        <motion.div
          key={i}
          animate={{
            y: [0, -100, 0],
            opacity: [0.2, 0.5, 0.2],
            scale: [1, 1.2, 1]
          }}
          transition={{
            duration: 5 + i * 2,
            repeat: Infinity,
            ease: "easeInOut"
          }}
          className="absolute bg-asili-gold rounded-full"
          style={{
            width: Math.random() * 4 + 1 + 'px',
            height: Math.random() * 4 + 1 + 'px',
            left: Math.random() * 100 + '%',
            top: Math.random() * 100 + '%',
            filter: 'blur(1px)'
          }}
        />
      ))}
    </div>
    
    {/* Large abstract glow */}
    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full max-w-4xl aspect-square bg-[radial-gradient(circle,rgba(212,175,55,0.15)_0%,transparent_70%)] blur-[100px]"></div>
    
    {/* Geometric structural lines */}
    <svg className="absolute inset-0 w-full h-full opacity-10" viewBox="0 0 1920 1080">
      <defs>
        <linearGradient id="gold-grad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#d4af37" />
          <stop offset="100%" stopColor="transparent" />
        </linearGradient>
      </defs>
      <g stroke="url(#gold-grad)" strokeWidth="0.5" fill="none">
        <circle cx="960" cy="540" r="400" />
        <circle cx="960" cy="540" r="600" />
        <path d="M0 540 L1920 540 M960 0 L960 1080" />
        <motion.path 
          animate={{ rotate: 360 }}
          transition={{ duration: 60, repeat: Infinity, ease: "linear" }}
          style={{ transformOrigin: 'center' }}
          d="M560 540 L1360 540 M960 140 L960 940" 
        />
      </g>
    </svg>
  </div>
);

const Section = ({ children, className, id }: { children: React.ReactNode, className?: string, id?: string }) => (
  <section id={id} className={cn("py-20 px-6 md:px-12 lg:px-24", className)}>
    {children}
  </section>
);

interface FadeInProps {
  children: React.ReactNode;
  delay?: number;
  className?: string;
  key?: React.Key;
}

const FadeIn = ({ children, delay = 0, className }: FadeInProps) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true }}
    transition={{ duration: 0.8, delay }}
    className={className}
  >
    {children}
  </motion.div>
);

export default function App() {
  const [view, setView] = useState<"brand" | "luxury">("brand");
  const [formStatus, setFormStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setIsMenuOpen(false);
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, [view]);

  // Disable scroll when mobile menu is open
  useEffect(() => {
    if (isMenuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
  }, [isMenuOpen]);

  const handleContactSubmit = async (e: React.FormEvent<HTMLFormElement>, type: string) => {
    e.preventDefault();
    const form = e.currentTarget;
    setFormStatus("submitting");
    const formData = new FormData(form);
    const data = Object.fromEntries(formData.entries());
    
    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...data, type }),
      });
      
      if (response.ok) {
        setFormStatus("success");
        form.reset();
        setTimeout(() => setFormStatus("idle"), 5000);
      } else {
        setFormStatus("error");
      }
    } catch (error) {
      console.error(error);
      setFormStatus("error");
    }
  };

  const openWhatsApp = (topic: string) => {
    const message = encodeURIComponent(`Hi Asili, I'm interested in ${topic}. Can we discuss further?`);
    window.open(`https://wa.me/254717578394?text=${message}`, '_blank');
  };
  
  return (
    <div ref={containerRef} className={cn(
      "relative min-h-screen selection:bg-asili-gold transition-colors duration-700",
      view === "luxury" ? "bg-asili-black text-asili-cream" : "bg-asili-cream text-asili-green"
    )}>
      {/* Floating WhatsApp CTA */}
      <motion.button
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={() => openWhatsApp("General Inquiry")}
        className={cn(
          "fixed bottom-8 right-8 z-[100] w-16 h-16 rounded-full flex items-center justify-center shadow-2xl transition-all",
          view === "luxury" ? "bg-asili-gold text-asili-black" : "bg-asili-green text-white"
        )}
      >
        <Zap className="w-8 h-8" />
        <span className="hidden sm:block absolute -top-12 right-0 bg-white text-black text-[10px] font-bold px-3 py-1 rounded-full whitespace-nowrap shadow-xl border border-black/5 animate-bounce">
          Chat with Founder
        </span>
      </motion.button>

      {/* Universal Navigation */}
      <nav className={cn(
        "fixed top-0 left-0 right-0 z-50 h-20 flex items-center justify-between px-6 md:px-12 transition-all duration-500",
        view === "luxury" ? "glass-dark" : "glass"
      )}>
        <div className="flex items-center gap-3">
          <button 
            onClick={() => {
              setView("brand");
              setIsMenuOpen(false);
            }}
            className="flex items-center gap-2 group"
          >
            <div className={cn(
              "w-10 h-10 rounded-full flex items-center justify-center transition-all",
              view === "luxury" ? "bg-asili-gold text-asili-black" : "bg-asili-green text-white"
            )}>
              <Leaf className="w-6 h-6" />
            </div>
            <span className={cn(
              "font-serif text-2xl font-bold tracking-tight transition-colors",
              view === "luxury" ? "text-asili-gold" : "text-asili-green"
            )}>ASILI</span>
          </button>
        </div>
        
        <div className="hidden lg:flex items-center gap-10 text-sm font-bold uppercase tracking-widest">
          {view === "brand" ? (
            <>
              <a href="#about" className="hover:text-asili-honey transition-colors">Vision</a>
              <a href="#foundation" className="hover:text-asili-honey transition-colors">Foundation</a>
              <a href="#catalogue" className="hover:text-asili-honey transition-colors">Portfolio</a>
              <a href="#impact" className="hover:text-asili-honey transition-colors">Impact</a>
              <a href="#roadmap" className="hover:text-asili-honey transition-colors">Roadmap</a>
            </>
          ) : (
            <>
              <a href="#manifesto" className="hover:text-asili-gold transition-colors">Vision</a>
              <a href="#glass-hive-concept" className="hover:text-asili-gold transition-colors">Traceability</a>
              <a href="#functional-alchemy" className="hover:text-asili-gold transition-colors">Alchemy</a>
              <a href="#honey-catalogue" className="hover:text-asili-gold transition-colors">Catalogue</a>
              <a href="#b2b" className="hover:text-asili-gold transition-colors">Partnerships</a>
            </>
          )}
        </div>

        <div className="flex items-center gap-4">
          <button
            onClick={() => setView(view === "brand" ? "luxury" : "brand")}
            className={cn(
              "hidden sm:block px-6 py-2.5 rounded-full text-xs font-black uppercase tracking-widest transition-all shadow-xl",
              view === "luxury" 
                ? "bg-asili-green text-white hover:bg-asili-leaf" 
                : "bg-asili-gold text-asili-black hover:bg-asili-gold-light"
            )}
          >
            {view === "brand" ? "Enter Honey Showroom" : "Back to Main Brand"}
          </button>
          
          <button 
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className={cn(
              "lg:hidden w-10 h-10 flex items-center justify-center rounded-full transition-colors",
              view === "luxury" ? "text-asili-gold hover:bg-asili-gold/10" : "text-asili-green hover:bg-asili-green/10"
            )}
          >
            {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </nav>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {isMenuOpen && (
          <motion.div
            initial={{ opacity: 0, x: "100%" }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className={cn(
              "fixed inset-0 z-[45] lg:hidden flex flex-col pt-32 px-10 gap-8",
              view === "luxury" ? "bg-asili-black text-asili-cream" : "bg-asili-cream text-asili-green"
            )}
          >
            <div className="flex flex-col gap-6 text-2xl font-bold font-serif">
              {view === "brand" ? (
                <>
                  <a href="#about" onClick={() => setIsMenuOpen(false)} className="hover:text-asili-honey">Vision</a>
                  <a href="#foundation" onClick={() => setIsMenuOpen(false)} className="hover:text-asili-honey">Foundation</a>
                  <a href="#catalogue" onClick={() => setIsMenuOpen(false)} className="hover:text-asili-honey">Portfolio</a>
                  <a href="#impact" onClick={() => setIsMenuOpen(false)} className="hover:text-asili-honey">Impact</a>
                  <a href="#roadmap" onClick={() => setIsMenuOpen(false)} className="hover:text-asili-honey">Roadmap</a>
                </>
              ) : (
                <>
                  <a href="#maturity" onClick={() => setIsMenuOpen(false)} className="hover:text-asili-gold">Maturity</a>
                  <a href="#honey-catalogue" onClick={() => setIsMenuOpen(false)} className="hover:text-asili-gold">Gold Label</a>
                  <a href="#traceability" onClick={() => setIsMenuOpen(false)} className="hover:text-asili-gold">Traceability</a>
                  <a href="#b2b" onClick={() => setIsMenuOpen(false)} className="hover:text-asili-gold">Partnerships</a>
                </>
              )}
            </div>
            
            <div className="mt-8 pt-8 border-t border-current opacity-10"></div>
            
            <button
              onClick={() => {
                setView(view === "brand" ? "luxury" : "brand");
                setIsMenuOpen(false);
              }}
              className={cn(
                "w-full py-5 rounded-2xl text-center font-black uppercase tracking-widest text-sm shadow-xl",
                view === "luxury" 
                  ? "bg-asili-green text-white" 
                  : "bg-asili-gold text-asili-black"
              )}
            >
              {view === "brand" ? "Enter Honey Showroom" : "Back to Main Brand"}
            </button>
            
            <div className="mt-auto pb-10 flex flex-col gap-2">
              <p className="text-[10px] uppercase tracking-widest opacity-40 font-bold">Inquiries</p>
              <a href="mailto:kevinsila100@gmail.com" className="text-sm font-bold">kevinsila100@gmail.com</a>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {view === "brand" ? (
        /* BRAND (NATURE) VIEW */
        <main className="pt-20">
          {/* Brand Hero */}
          <Section className="relative min-h-[80vh] lg:min-h-screen flex items-center pt-2 lg:pt-0 overflow-hidden bg-asili-cream">
            <div className="absolute inset-0 z-0">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_30%,#e1e8dc_0%,transparent_70%)] opacity-40"></div>
              <div className="absolute right-[-20%] lg:right-[-5%] top-[5%] lg:top-[10%] w-full lg:w-1/2 h-full lg:h-4/5 opacity-40 lg:opacity-100">
                <HoneyTechIllustration />
              </div>
            </div>
            <div className="relative z-10 max-w-7xl mx-auto grid lg:grid-cols-2 gap-12 items-center">
              <FadeIn>
                <div className="inline-flex items-center gap-3 px-4 py-2 rounded-full border border-asili-honey/30 bg-asili-honey/5 mb-4 lg:mb-6">
                  <span className="w-2 h-2 rounded-full bg-asili-honey animate-pulse"></span>
                  <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-asili-green mt-0.5">Healing People & The Planet</span>
                </div>
                <h1 className="text-4xl sm:text-7xl lg:text-8xl font-bold mb-4 lg:mb-6 leading-[1.1] md:leading-[1] text-asili-green title-spacing hero-text-shadow">
                  Trust & <br />
                  <span className="italic font-serif text-asili-honey">Traceability.</span>
                </h1>
                <p className="text-lg md:text-xl lg:text-2xl text-asili-green/70 mb-6 lg:mb-8 leading-relaxed font-light max-w-xl">
                  We don't just provide honey; we provide truth. Asili delivers absolute trust through real-time traceability systems deeply rooted in our Kenyan heritage.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 lg:gap-5">
                  <button onClick={() => setView("luxury")} className="group bg-asili-green text-white px-8 lg:px-10 py-4 lg:py-5 rounded-full font-bold flex items-center justify-center gap-3 hover:bg-asili-leaf transition-all shadow-[0_20px_40px_rgba(45,79,30,0.2)]">
                    Explore Honey Showroom <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </button>
                  <a href="#catalogue" className="bg-white border border-asili-honey/20 text-asili-green px-8 lg:px-10 py-4 lg:py-5 rounded-full font-bold hover:bg-asili-cream transition-all text-center">
                    View Portfolio
                  </a>
                </div>
              </FadeIn>
            </div>
          </Section>

          {/* The Glass Hive Section */}
          <Section id="traceability-info" className="bg-asili-green text-white overflow-hidden relative">
            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-5"></div>
            <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-20 items-center relative z-10">
              <div className="relative group">
                <div className="absolute -inset-10 bg-asili-honey/20 blur-[100px] rounded-full opacity-50 group-hover:opacity-100 transition-opacity"></div>
                <div className="relative bg-asili-dark/50 backdrop-blur-2xl p-8 lg:p-16 rounded-[4rem] border border-white/10 shadow-2xl overflow-hidden">
                  <div className="absolute top-0 right-0 p-10 opacity-10">
                    <Search className="w-40 h-40" />
                  </div>
                  <FadeIn>
                    <div className="flex items-center gap-4 mb-8">
                      <div className="w-12 h-12 rounded-xl bg-asili-honey/20 flex items-center justify-center text-asili-honey">
                        <TrendingUp className="w-6 h-6" />
                      </div>
                      <span className="text-xs font-bold uppercase tracking-widest text-asili-honey">Radical Real-Time Traceability</span>
                    </div>
                    <h2 className="text-3xl sm:text-5xl lg:text-6xl font-bold mb-8 leading-tight">The Glass <br /><span className="text-asili-honey">Hive.</span></h2>
                    <p className="text-xl text-white/70 mb-10 leading-relaxed font-light">
                      "Asili: The only honey you can watch being made."
                    </p>
                    <div className="space-y-6">
                      <div className="flex gap-5 items-start">
                        <div className="w-8 h-8 rounded-full bg-asili-honey/20 flex items-center justify-center text-asili-honey text-xs font-bold shrink-0">01</div>
                        <p className="text-white/60">Every jar features a unique QR code linking to a time-lapse or log sheet of its specific hive.</p>
                      </div>
                      <div className="flex gap-5 items-start">
                        <div className="w-8 h-8 rounded-full bg-asili-honey/20 flex items-center justify-center text-asili-honey text-xs font-bold shrink-0">02</div>
                        <p className="text-white/60">Digital "Certificate of Analysis" from our Quality Hub for every batch.</p>
                      </div>
                      <div className="flex gap-5 items-start">
                        <div className="w-8 h-8 rounded-full bg-asili-honey/20 flex items-center justify-center text-asili-honey text-xs font-bold shrink-0">03</div>
                        <p className="text-white/60">Blockchain-backed health logs ensuring zero adulteration from hive to home.</p>
                      </div>
                    </div>
                  </FadeIn>
                </div>
              </div>
              
              <FadeIn delay={0.2}>
                <div className="space-y-10">
                  <div className="inline-block px-4 py-1.5 rounded-full bg-asili-honey/10 border border-asili-honey/20 text-asili-honey text-[10px] font-bold uppercase tracking-widest">Tech as a Trust Provider</div>
                  <h3 className="text-2xl sm:text-4xl lg:text-5xl font-bold leading-tight">Eliminating the <br /><span className="text-asili-honey italic">"Is This Real?"</span> Doubt</h3>
                  <p className="text-lg text-white/60 leading-relaxed">
                    Most brands put a "100% Pure" sticker on a jar. We give you a window into the harvest. In a market where trust is the scarcest resource, Asili uses high-yield biology and transparency tech to create an unbreakable bond between the worker bee and the wellness shopper.
                  </p>
                  <div className="pt-8 grid sm:grid-cols-2 gap-8">
                    <div className="p-6 bg-white/5 rounded-3xl border border-white/10">
                      <Droplets className="text-asili-honey w-8 h-8 mb-4" />
                      <h4 className="font-bold mb-2">Purity Verified</h4>
                      <p className="text-xs text-white/40">KeBS & KePHIS integrated testing protocols at our Makueni Hub.</p>
                    </div>
                    <div className="p-6 bg-white/5 rounded-3xl border border-white/10">
                      <Rocket className="text-asili-honey w-8 h-8 mb-4" />
                      <h4 className="font-bold mb-2">High-Yield Tech</h4>
                      <p className="text-xs text-white/40">Langstroth Hive optimization for 3x the standard yield.</p>
                    </div>
                  </div>
                </div>
              </FadeIn>
            </div>
          </Section>

          {/* The Quest for Origin (Vision Section) */}
          <Section id="about" className="bg-white">
            <div className="max-w-7xl mx-auto">
              <FadeIn>
                <div className="text-center mb-20">
                  <span className="text-asili-honey font-bold uppercase tracking-widest text-xs mb-4 block underline decoration-asili-honey/20 underline-offset-8">Our Vision & Mission</span>
                  <h2 className="text-3xl sm:text-5xl lg:text-7xl font-bold text-asili-green uppercase tracking-tighter mb-8 leading-[0.9]">The Quest for <br /><span className="italic font-serif text-asili-honey">Origin.</span></h2>
                  <p className="text-xl text-asili-green/60 max-w-3xl mx-auto leading-relaxed">
                    "Asili" is Kiswahili for origin, essence, and core. We believe that true wellness isn't found in a laboratory, but in the untainted integrity of nature's first principles.
                  </p>
                </div>
              </FadeIn>

              <div className="grid md:grid-cols-3 gap-12">
                {[
                  { 
                    title: "The Problem", 
                    desc: "Adulteration is the norm. Sugar-syrup and diluted oils are sold as 'pure', eroding trust and health.",
                    icon: <X className="text-red-500/50 w-8 h-8" />
                  },
                  { 
                    title: "The Solution", 
                    desc: "Radical Traceability. We link every product back to its specific hive or harvest hub through technology.",
                    icon: <Zap className="text-asili-honey w-8 h-8" />
                  },
                  { 
                    title: "The Goal", 
                    desc: "A self-sustaining African ecosystem where indigenous gold fuels global health and local prosperity.",
                    icon: <Globe className="text-asili-green w-8 h-8" />
                  }
                ].map((pill, i) => (
                  <FadeIn key={i} delay={0.2 + (i * 0.1)}>
                    <div className="p-10 bg-asili-cream rounded-[3rem] border border-asili-honey/10 hover:shadow-xl transition-all">
                      <div className="mb-6">{pill.icon}</div>
                      <h4 className="text-2xl font-bold text-asili-green mb-4">{pill.title}</h4>
                      <p className="text-asili-green/60 leading-relaxed text-sm">{pill.desc}</p>
                    </div>
                  </FadeIn>
                ))}
              </div>
            </div>
          </Section>

          {/* Foundation Section */}
          <Section id="foundation" className="bg-white relative overflow-hidden">
            <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-20 items-center">
              <FadeIn>
                <div className="space-y-8">
                  <h2 className="text-3xl sm:text-5xl md:text-6xl font-bold text-asili-green leading-tight">Beyond <br /><span className="text-asili-honey italic font-serif">Purity</span></h2>
                  <div className="space-y-6 text-lg text-asili-green/70 leading-relaxed font-light">
                    <p>In a market where "purity" is a cliché, Asili defines a new standard through RADICAL TRACEABILITY. We don't just put a sticker on a jar; we provide a link to the life of the hive.</p>
                    <p>Our Hub-and-Spoke model scale impact by providing tech and high-yield 'Obadoni' protocols to local farmers in Makueni, buying back their gold and ensuring KeBS-certified integrity.</p>
                  </div>
                  <div className="grid grid-cols-2 gap-8 pt-6 border-t border-asili-honey/10">
                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 rounded-xl bg-asili-honey/10 flex items-center justify-center text-asili-honey"><Droplets className="w-5 h-5" /></div>
                      <div>
                        <p className="font-bold text-asili-green">Hub & Spoke</p>
                        <p className="text-xs opacity-50">Aggregated Scaling</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 rounded-xl bg-asili-honey/10 flex items-center justify-center text-asili-honey"><Search className="w-5 h-5" /></div>
                      <div>
                        <p className="font-bold text-asili-green">The Glass Hive</p>
                        <p className="text-xs opacity-50">Real-Time Integrity</p>
                      </div>
                    </div>
                  </div>
                </div>
              </FadeIn>
              <div className="relative group">
                <div className="absolute -inset-4 bg-asili-honey/10 rounded-[4rem] rotate-3 scale-95 group-hover:rotate-0 transition-transform duration-700"></div>
                <HeritageIllustration />
              </div>
            </div>
          </Section>

          {/* Brand Catalogue */}
          <Section id="catalogue" className="bg-asili-cream/50">
            <div className="max-w-6xl mx-auto">
              <div className="text-center mb-16">
                <FadeIn>
                  <span className="text-asili-honey font-bold uppercase tracking-widest mb-4 block">Visionary Portfolio</span>
                  <h2 className="text-3xl sm:text-5xl lg:text-6xl font-bold mb-6 text-asili-green uppercase break-words">The Asili Ecosystem</h2>
                  <p className="text-asili-green/60 max-w-2xl mx-auto text-xl">From superfoods to future tech—explore how we are building a sustainable future.</p>
                </FadeIn>
              </div>
              <CatalogueTabs data={BRAND_CATALOGUE} theme="nature" />
            </div>
          </Section>

          <Section id="baas-info" className="bg-asili-cream border-y border-asili-honey/10">
            <div className="max-w-7xl mx-auto">
              <div className="text-center mb-20">
                <FadeIn>
                  <span className="text-asili-honey font-bold uppercase tracking-widest text-xs mb-4 block">A New Business Model</span>
                  <h2 className="text-3xl sm:text-5xl lg:text-6xl font-bold mb-6 text-asili-green uppercase tracking-tighter">Bee-as-a-Service (BaaS)</h2>
                  <p className="text-asili-green/60 max-w-2xl mx-auto text-xl italic">"Predictable cash flow meeting radical direct impact."</p>
                </FadeIn>
              </div>
              
              <div className="grid lg:grid-cols-2 gap-8 lg:gap-12">
                <FadeIn>
                  <div className="h-full p-10 lg:p-16 rounded-[4rem] bg-white border border-asili-honey/10 hover:shadow-2xl transition-all duration-700">
                    <div className="w-16 h-16 rounded-2xl bg-asili-honey/10 flex items-center justify-center text-asili-honey mb-10">
                      <Heart className="w-8 h-8" />
                    </div>
                    <h3 className="text-3xl font-bold text-asili-green mb-6">Adopt-A-Hive (B2C)</h3>
                    <p className="text-lg text-asili-green/70 mb-10 leading-relaxed font-light">
                      Rent a hive in Makueni for a yearly fee. Enjoy 10kg of the finest harvest branded as your "Private Reserve," while receiving monthly digital updates on your colony's health.
                    </p>
                    <ul className="space-y-4">
                      {["10kg Guaranteed Harvest", "Monthly Bee Updates", "Branded Private Reserve", "Personalized Hive Plaque"].map((item, i) => (
                        <li key={i} className="flex items-center gap-3 text-sm font-bold text-asili-green/60">
                          <Leaf className="w-4 h-4 text-asili-honey" /> {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                </FadeIn>
                
                <FadeIn delay={0.2}>
                  <div className="h-full p-10 lg:p-16 rounded-[4rem] bg-asili-green text-white hover:shadow-2xl transition-all duration-700">
                    <div className="w-16 h-16 rounded-2xl bg-white/10 flex items-center justify-center text-asili-honey mb-10">
                      <Globe className="w-8 h-8" />
                    </div>
                    <h3 className="text-3xl font-bold mb-6">Corporate CSR (B2B)</h3>
                    <p className="text-lg text-white/70 mb-10 leading-relaxed font-light">
                      Sponsor "Pollination Zones" to meet your SDG targets. We provide branded, KeBS-certified honey for your VIP clients and impact data for your annual CSR reports.
                    </p>
                    <ul className="space-y-4">
                      {["SDG Impact Reporting", "Premium Client Gifting", "Pollination Area Brading", "Tax-Deductible CSR"].map((item, i) => (
                        <li key={i} className="flex items-center gap-3 text-sm font-bold text-white/40">
                          <Zap className="w-4 h-4 text-asili-honey" /> {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                </FadeIn>
              </div>
            </div>
          </Section>

          {/* Impact Metrics */}
          <Section id="impact" className="bg-[#fbfcfa]">
            <div className="max-w-7xl mx-auto">
              <div className="text-center mb-12 lg:mb-20">
                <FadeIn>
                  <span className="text-asili-green font-bold uppercase tracking-widest text-xs mb-4 block">The Asili Effect</span>
                  <h2 className="text-4xl lg:text-5xl font-bold mb-6 text-asili-green leading-tight">Empowering People, <br className="hidden md:block" /><span className="text-asili-honey italic">Restoring the Planet.</span></h2>
                </FadeIn>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8 md:gap-12">
                {IMPACT_METRICS.map((metric, i) => (
                  <FadeIn key={i} delay={i * 0.1}>
                    <div className={cn(
                      "group p-12 rounded-[3rem] h-full border flex flex-col items-center text-center transition-all duration-500 hover:shadow-[0_30px_60px_-15px_rgba(0,0,0,0.05)]", 
                      metric.color
                    )}>
                      <div className="mb-8 p-6 rounded-3xl bg-white shadow-sm group-hover:scale-110 transition-transform duration-500">
                        {metric.icon}
                      </div>
                      <h3 className="text-3xl font-bold mb-2">{metric.title}</h3>
                      <p className="text-xs font-bold uppercase tracking-widest mb-6 opacity-60 italic">{metric.subtitle}</p>
                      <p className="text-sm leading-relaxed mb-10 opacity-70 flex-grow">{metric.description}</p>
                      <div className="w-full space-y-3">
                        {metric.metrics.map((m, idx) => (
                          <div key={idx} className="flex items-center justify-between text-xs font-bold py-3 border-t border-current opacity-30 group-hover:opacity-100 transition-opacity">
                            <span>{m}</span>
                            <ChevronRight className="w-3 h-3" />
                          </div>
                        ))}
                      </div>
                    </div>
                  </FadeIn>
                ))}
              </div>
            </div>
          </Section>

          {/* Partnerships Section */}
          <Section id="partners" className="bg-asili-cream border-t border-asili-honey/10">
            <div className="max-w-7xl mx-auto">
              <div className="grid lg:grid-cols-2 gap-20 items-center">
                <FadeIn>
                  <h2 className="text-5xl font-bold mb-10 text-asili-green leading-tight">Join the <br /><span className="text-asili-honey underline decoration-asili-honey/30 underline-offset-8">Eco-Wellness Revolution</span></h2>
                  <p className="text-xl text-asili-green/70 mb-12 leading-relaxed">We are seeking strategic partners and visionary investors to scale our impact across the African continent and beyond.</p>
                  <div className="space-y-6">
                    {PARTNERS_CONTENT.map((item, i) => (
                      <div key={i} className="flex gap-6 items-start">
                        <div className="w-1.5 h-12 bg-asili-honey rounded-full mt-1"></div>
                        <div>
                          <h4 className="font-bold text-xl text-asili-green flex items-center gap-3">
                            {item.title} <span className="text-[10px] uppercase tracking-widest bg-asili-honey/10 px-2 py-1 rounded text-asili-honey">{item.value}</span>
                          </h4>
                          <p className="text-asili-green/60 text-sm mt-2">{item.desc}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </FadeIn>
                <div className="relative">
                  <div className="absolute -inset-4 bg-asili-honey/10 rounded-[3rem] blur-2xl"></div>
                  <div className="relative bg-white border border-asili-honey/10 p-12 rounded-[3.5rem] shadow-2xl">
                    <h3 className="text-2xl font-bold mb-8 text-asili-green">Partnership Inquiry</h3>
                    <form className="space-y-6" onSubmit={(e) => handleContactSubmit(e, "Partnership")}>
                      <div className="grid grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <label className="text-[10px] font-bold uppercase tracking-widest text-asili-green/40 ml-1">Full Name</label>
                          <input name="name" required type="text" className="w-full bg-asili-cream border border-asili-honey/10 rounded-2xl px-6 py-4 focus:border-asili-green outline-none transition-all" />
                        </div>
                        <div className="space-y-2">
                          <label className="text-[10px] font-bold uppercase tracking-widest text-asili-green/40 ml-1">Email Address</label>
                          <input name="email" required type="email" className="w-full bg-asili-cream border border-asili-honey/10 rounded-2xl px-6 py-4 focus:border-asili-green outline-none transition-all" />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-bold uppercase tracking-widest text-asili-green/40 ml-1">Organization</label>
                        <input name="company" type="text" className="w-full bg-asili-cream border border-asili-honey/10 rounded-2xl px-6 py-4 focus:border-asili-green outline-none transition-all" />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-bold uppercase tracking-widest text-asili-green/40 ml-1">Phone Number</label>
                        <input name="phone" type="tel" className="w-full bg-asili-cream border border-asili-honey/10 rounded-2xl px-6 py-4 focus:border-asili-green outline-none transition-all" placeholder="+254..." />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-bold uppercase tracking-widest text-asili-green/40 ml-1">Your Interest</label>
                        <select name="interest" className="w-full bg-asili-cream border border-asili-honey/10 rounded-2xl px-6 py-4 focus:border-asili-green outline-none transition-all appearance-none cursor-pointer">
                          <option>Equity Investment</option>
                          <option>International Distribution</option>
                          <option>R&D Collaboration</option>
                          <option>Bulk Supply</option>
                        </select>
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-bold uppercase tracking-widest text-asili-green/40 ml-1">Message / Requirements</label>
                        <textarea name="message" rows={4} className="w-full bg-asili-cream border border-asili-honey/10 rounded-2xl px-6 py-4 focus:border-asili-green outline-none transition-all resize-none" placeholder="Tell us more about your inquiry..."></textarea>
                      </div>
                      <button 
                        disabled={formStatus === "submitting"}
                        className="w-full bg-asili-green text-white font-bold py-5 rounded-2xl shadow-xl hover:bg-asili-leaf transition-all flex items-center justify-center gap-3 disabled:opacity-50"
                      >
                        {formStatus === "submitting" ? "Sending..." : formStatus === "success" ? "Message Sent!" : "Send Inquiry"}
                        {(formStatus === "idle" || formStatus === "error") && <ArrowRight className="w-5 h-5" />}
                      </button>
                      <button 
                        type="button"
                        onClick={() => openWhatsApp("Partnership Inquiry")}
                        className="w-full border border-asili-green/10 text-asili-green font-bold py-5 rounded-2xl hover:bg-asili-cream transition-all flex items-center justify-center gap-3"
                      >
                        Quick Connect on WhatsApp <Zap className="w-5 h-5 text-asili-honey" />
                      </button>
                      {formStatus === "error" && <p className="text-red-500 text-xs text-center">Failed to send message. Please try again.</p>}
                    </form>
                  </div>
                </div>
              </div>
            </div>
          </Section>

          {/* Roadmap & Fundability */}
          <Section id="roadmap" className="bg-asili-green text-white overflow-hidden relative">
            <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-asili-honey/10 blur-[150px] -mr-64 -mt-64 rounded-full"></div>
            <div className="grid lg:grid-cols-2 gap-20 items-center relative z-10">
              <FadeIn>
                <h2 className="text-3xl sm:text-5xl lg:text-6xl font-bold mb-10 leading-tight">Strategic <br /><span className="text-asili-honey">Roadmap</span></h2>
                <div className="space-y-8">
                  <div className="flex gap-6 items-start">
                    <div className="text-4xl font-serif text-asili-honey">01</div>
                    <div>
                      <h4 className="text-xl font-bold mb-2">Months 1-3: Data Alpha</h4>
                      <p className="text-white/60">Launching 6 'Alpha' hives in Makueni. High-precision data collection using refractometers and IoT health monitoring.</p>
                    </div>
                  </div>
                  <div className="flex gap-6 items-start">
                    <div className="text-4xl font-serif text-asili-honey">02</div>
                    <div>
                      <h4 className="text-xl font-bold mb-2">Months 4-6: BaaS Launch</h4>
                      <p className="text-white/60">Opening 'Adopt-a-Hive' pre-sales. Scaling from 6 to 20 hives through a direct-to-consumer and corporate CSR model.</p>
                    </div>
                  </div>
                  <div className="flex gap-6 items-start">
                    <div className="text-4xl font-serif text-asili-honey">03</div>
                    <div>
                      <h4 className="text-xl font-bold mb-2">Year 1+: Hub & Spoke</h4>
                      <p className="text-white/60">Expanding to local 'Spoke' farmers. Providing hives and tech in exchange for raw honey, processed at our Quality Hub.</p>
                    </div>
                  </div>
                  <div className="flex gap-6 items-start border-t border-white/10 pt-8 mt-10">
                    <Rocket className="text-asili-honey w-10 h-10" />
                    <div>
                      <h4 className="text-xl font-bold mb-2">Global Exports</h4>
                      <p className="text-white/60">Targeting premium wellness markets with KeBS-certified, blockchain-traceable functional food exports.</p>
                    </div>
                  </div>
                </div>
              </FadeIn>

              <FadeIn delay={0.2}>
                <div className="bg-white/5 backdrop-blur-xl p-12 rounded-[3.5rem] border border-white/10 shadow-2xl">
                  <h3 className="text-3xl font-bold mb-10 text-asili-honey text-center">Why Asili?</h3>
                  <div className="grid gap-6">
                    {FUNDABILITY_CARDS.map((card, i) => (
                      <div key={i} className="flex gap-6 items-center p-6 bg-white/5 rounded-2xl border border-white/10 hover:bg-white/10 transition-all">
                        <div className="text-asili-honey">{card.icon}</div>
                        <div>
                          <p className="font-bold text-lg mb-1">{card.title}</p>
                          <p className="text-sm text-white/50">{card.desc}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </FadeIn>
            </div>
          </Section>
        </main>
      ) : (
        /* LUXURY (HONEY) VIEW */
        <main className="pt-20">
          {/* Honey Hero */}
          <section className="relative h-screen flex items-center justify-center overflow-hidden pt-16">
            <div className="absolute inset-0 z-0">
              <LuxuryHeroIllustration />
              <div className="absolute inset-0 bg-gradient-to-b from-asili-black via-transparent to-asili-black"></div>
            </div>

            <div className="relative z-10 text-center max-w-5xl px-6">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 1.2, ease: "easeOut" }}
              >
                <div className="inline-block px-4 py-1 rounded-full border border-asili-gold/30 bg-asili-gold/5 mb-8 backdrop-blur-sm">
                  <span className="text-[10px] font-bold uppercase tracking-[0.4em] text-asili-gold">The Purest Gold Range</span>
                </div>
                <h1 className="text-4xl sm:text-8xl lg:text-[10rem] font-bold mb-10 leading-[1] md:leading-[0.85] gold-gradient title-spacing hero-text-shadow-gold text-center">
                  Glass <br />
                  <span className="italic font-serif text-asili-cream brightness-110 uppercase tracking-tighter">Hive™</span>
                </h1>
                <p className="text-lg md:text-2xl text-asili-cream/70 max-w-2xl mx-auto mb-14 leading-relaxed font-light text-center">
                  The only honey you can watch being made. <br className="hidden md:block" />
                  <span className="opacity-50 text-sm md:text-lg italic mt-4 block">Radical Traceability • Blockchain Verified • Pure Makueni Gold</span>
                </p>
                <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
                  <button 
                    onClick={() => openWhatsApp("Reserving a Batch")}
                    className="w-full sm:w-auto bg-asili-gold text-asili-black px-12 py-5 rounded-full font-black uppercase tracking-widest text-sm hover:scale-105 transition-all shadow-[0_0_50px_rgba(212,175,55,0.4)]"
                  >
                    Reserve Batch
                  </button>
                  <a 
                    href="#maturity"
                    className="w-full sm:w-auto border border-asili-gold/20 text-asili-gold px-12 py-5 rounded-full font-black uppercase tracking-widest text-sm hover:bg-asili-gold/5 transition-all backdrop-blur-md text-center"
                  >
                    Explore Standards
                  </a>
                </div>
              </motion.div>
            </div>
            
            {/* Scroll Indicator */}
            <motion.div 
              animate={{ y: [0, 10, 0] }}
              transition={{ repeat: Infinity, duration: 2 }}
              className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2"
            >
              <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-asili-gold/40">Scroll</span>
              <div className="w-px h-12 bg-gradient-to-b from-asili-gold/40 to-transparent"></div>
            </motion.div>
          </section>

          {/* The Asili Manifesto & Goal */}
          <Section id="manifesto" className="bg-asili-black border-y border-asili-gold/10">
            <div className="max-w-6xl mx-auto grid lg:grid-cols-2 gap-16 items-center">
              <FadeIn>
                <div className="space-y-8">
                  <div>
                    <span className="text-asili-gold font-mono text-xs uppercase tracking-[0.3em] mb-4 block underline decoration-asili-gold/30 underline-offset-8">Our Vision</span>
                    <h2 className="text-3xl sm:text-5xl font-bold gold-gradient leading-tight">From Sugar Scares to <br /><span className="text-asili-cream font-serif italic">Radical Trust.</span></h2>
                  </div>
                  <p className="text-xl text-asili-cream/70 leading-relaxed font-light">
                    In a market flooded with sugar-syrup and "cliché purity," Asili exists to prove that high-integrity honey isn't just a product—it's a technological commitment. 
                  </p>
                  <p className="text-asili-cream/50 leading-relaxed">
                    Our goal is to eliminate the 'Is this real?' doubt by providing every consumer with a digital window into the hive, a KeBS-certified COA, and a direct line to the dry-land beauty of Makueni.
                  </p>
                  <div className="grid grid-cols-2 gap-8 pt-8 border-t border-asili-gold/10">
                    <div>
                      <h4 className="text-asili-gold font-bold mb-2">The Mission</h4>
                      <p className="text-xs text-asili-cream/40 leading-relaxed uppercase tracking-tighter">Unlocking the medicinal potential of indigenous flora through rigorous scientific standards.</p>
                    </div>
                    <div>
                      <h4 className="text-asili-gold font-bold mb-2">The Goal</h4>
                      <p className="text-xs text-asili-cream/40 leading-relaxed uppercase tracking-tighter">Establishing the first blockchain-traceable Quality Hub for African gold exports.</p>
                    </div>
                  </div>
                </div>
              </FadeIn>
              <div className="relative group">
                <div className="absolute -inset-4 bg-asili-gold/10 rounded-[3rem] blur-2xl group-hover:bg-asili-gold/20 transition-all"></div>
                <ResearchIllustration />
              </div>
            </div>
          </Section>

          {/* The Glass Hive Interactive Concept */}
          <Section id="glass-hive-concept" className="bg-asili-dark text-white overflow-hidden relative">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,#d4af3715_0%,transparent_50%)]"></div>
            <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-20 items-center">
              <FadeIn className="order-2 lg:order-1">
                <div className="grid sm:grid-cols-2 gap-8">
                  {[
                    { title: "QR Evidence", desc: "Batch-specific QR codes on every gold-capped jar.", icon: <Search className="text-asili-gold" /> },
                    { title: "Hub Testing", desc: "KeBS & refractometer moisture checking at source.", icon: <Droplets className="text-asili-gold" /> },
                    { title: "Live Ledger", desc: "Digital records of farmer income & hive health.", icon: <TrendingUp className="text-asili-gold" /> },
                    { title: "Direct Connect", desc: "WhatsApp updates for Adopt-a-Hive partners.", icon: <Mail className="text-asili-gold" /> }
                  ].map((feature, i) => (
                    <div key={i} className="p-8 bg-asili-black border border-asili-gold/10 rounded-3xl hover:border-asili-gold/50 transition-all">
                      <div className="mb-4">{feature.icon}</div>
                      <h4 className="font-bold text-asili-cream mb-2">{feature.title}</h4>
                      <p className="text-xs text-asili-cream/40 leading-relaxed">{feature.desc}</p>
                    </div>
                  ))}
                </div>
              </FadeIn>
              <FadeIn className="order-1 lg:order-2">
                <div className="space-y-8">
                  <h2 className="text-3xl sm:text-5xl font-bold leading-tight gold-gradient italic">The Standards of <br />The Glass Hive™</h2>
                  <p className="text-xl text-asili-cream/70 font-light leading-relaxed">
                    "We don't sell honey; we sell the proof of its purity."
                  </p>
                  <p className="text-asili-cream/50 leading-relaxed">
                    By integrating IoT sensors and blockchain logs, Asili creates a 'Glass Hive' experience. You see the harvest date, the moisture content, and the specific reforestation effort your purchase supports in Makueni.
                  </p>
                </div>
              </FadeIn>
            </div>
          </Section>

          {/* Subscription Box UI */}
          <section className="py-12 bg-asili-gold/5 border-y border-asili-gold/10 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-asili-gold/10 blur-3xl -mr-16 -mt-16"></div>
            <div className="max-w-6xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-8 relative z-10">
              <div>
                <h3 className="text-2xl font-bold text-asili-gold mb-2 flex items-center gap-2">
                  <Package className="w-5 h-5" /> Bee-as-a-Service (BaaS)
                </h3>
                <p className="text-asili-cream/60">"Adopt-a-Hive" for guaranteed harvests and monthly digital 'Bee Updates'. Predictable impact, premium purity.</p>
              </div>
              <div className="flex gap-4">
                <div className="px-4 py-3 bg-asili-dark border border-asili-gold/20 rounded-xl text-sm flex flex-col">
                  <span className="text-asili-gold font-bold">10kg Harvest</span>
                  <span className="text-[10px] text-asili-cream/40 uppercase tracking-widest">Your Private Reserve</span>
                </div>
                <button 
                  onClick={() => openWhatsApp("Adopt a Hive / BaaS Subscription")}
                  className="bg-asili-gold text-asili-black px-8 py-3 rounded-xl font-bold text-sm shadow-[0_0_20px_rgba(212,175,55,0.2)] hover:bg-asili-gold-light transition-all"
                >
                  Adopt a Hive
                </button>
              </div>
            </div>
          </section>

          {/* Honey Maturity & Purity */}
          <Section id="maturity" className="bg-asili-black">
            <div className="grid md:grid-cols-2 gap-20 items-center">
              <FadeIn>
                <h2 className="text-3xl sm:text-5xl font-bold mb-8 gold-gradient">Scientific Purity. <br />Nature's Patience.</h2>
                <div className="space-y-8">
                  <div>
                    <h4 className="text-asili-gold font-bold text-xl mb-2 flex items-center gap-2">
                      <TrendingUp className="w-5 h-5" /> The Refractometer Test
                    </h4>
                    <p className="text-asili-cream/60 leading-relaxed">
                      We harvest only when the bees cap the honey, ensuring a moisture content below 17%. Every batch is tested with clinical refractometers to guarantee stability and prevent fermentation.
                    </p>
                  </div>
                  <div>
                    <h4 className="text-asili-gold font-bold text-xl mb-2 flex items-center gap-2">
                      <Droplets className="w-5 h-5" /> The Quality Hub
                    </h4>
                    <p className="text-asili-cream/60 leading-relaxed">
                      Asili acts as a central Quality Hub. We perform rigorous testing—from KeBS certification to internal refractometer analysis—for every drop of honey harvested from our 'Spoke' farmers in the Makueni ecosystem.
                    </p>
                  </div>
                  <div className="pt-8 grid grid-cols-3 gap-4">
                    <div className="text-center p-4 bg-asili-gold/5 border border-asili-gold/10 rounded-2xl">
                      <p className="text-asili-gold font-bold text-lg">17%</p>
                      <p className="text-[8px] uppercase tracking-widest text-asili-cream/40">Max Moisture</p>
                    </div>
                    <div className="text-center p-4 bg-asili-gold/5 border border-asili-gold/10 rounded-2xl">
                      <p className="text-asili-gold font-bold text-lg">KeBS</p>
                      <p className="text-[8px] uppercase tracking-widest text-asili-cream/40">Verified Batch</p>
                    </div>
                    <div className="text-center p-4 bg-asili-gold/5 border border-asili-gold/10 rounded-2xl">
                      <p className="text-asili-gold font-bold text-lg">QR</p>
                      <p className="text-[8px] uppercase tracking-widest text-asili-cream/40">Digital COA</p>
                    </div>
                  </div>
                  <p className="text-asili-cream/60 leading-relaxed pt-8 border-t border-asili-gold/10">
                    Unlike industrial honey that is "flash-heated," Asili honey is cold-settled. This preserves the natural enzymes, diastase, and floral notes that define truly mature honey.
                  </p>
                </div>
              </FadeIn>
              <FadeIn delay={0.2}>
                <div className="relative p-1 bg-gradient-to-br from-asili-gold/40 to-transparent rounded-[3rem]">
                  <div className="bg-asili-dark rounded-[3rem] p-12">
                    <div className="flex items-center gap-4 mb-8">
                      <div className="w-16 h-16 bg-asili-gold/10 rounded-2xl flex items-center justify-center">
                        <Search className="text-asili-gold w-8 h-8" />
                      </div>
                      <div>
                        <p className="text-xs text-asili-gold font-mono uppercase tracking-[0.2em]">Quality Report</p>
                        <p className="text-2xl font-bold">Batch #MK92</p>
                      </div>
                    </div>
                    <div className="space-y-6">
                      {[
                        { label: "Moisture Content", val: "16.4%", status: "Optimal" },
                        { label: "Floral Source", val: "Acacia / Wildflower", status: "Single Origin" },
                        { label: "Diastase Activity", val: "High", status: "Premium" },
                        { label: "HMF Levels", val: "Low", status: "Fresh" }
                      ].map((stat, i) => (
                        <div key={i} className="flex justify-between items-center pb-4 border-b border-asili-gold/10">
                          <div>
                            <p className="text-sm font-medium">{stat.label}</p>
                            <p className="text-xs text-asili-cream/40">{stat.status}</p>
                          </div>
                          <span className="text-asili-gold font-mono font-bold text-lg">{stat.val}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </FadeIn>
            </div>
          </Section>

          {/* Functional Alchemy Section */}
          <Section id="functional-alchemy" className="bg-asili-black text-white py-32">
            <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-20 items-center">
              <FadeIn>
                <div className="relative group">
                  <div className="absolute -inset-10 bg-asili-gold/10 blur-[120px] rounded-full opacity-30"></div>
                  <AlchemyIllustration />
                  <div className="absolute bottom-10 left-10 right-10 bg-asili-dark/80 backdrop-blur-xl p-8 rounded-3xl border border-white/10 z-20">
                    <p className="text-asili-gold font-bold mb-2">Asili Flow Shot™</p>
                    <p className="text-xs text-white/50 leading-relaxed font-light">The future of performance fuel. Makueni gold infused with MCT oil and caffeine for sustained mental focus.</p>
                  </div>
                </div>
              </FadeIn>
              
              <FadeIn delay={0.2}>
                <div className="space-y-10">
                  <span className="text-asili-gold font-mono text-xs uppercase tracking-widest block">Beyond Nutrition</span>
                  <h2 className="text-3xl sm:text-6xl font-bold leading-tight gold-gradient italic">Functional <br />Alchemy</h2>
                  <p className="text-xl text-asili-cream/70 font-light leading-relaxed">
                    We've shifted from being a honey seller to a "Functional Food" provider. Asili honey isn't just a sweetener—it's a performance fuel and a clinical healer.
                  </p>
                  <div className="space-y-6">
                    <div className="p-6 bg-white/5 rounded-2xl border border-white/10">
                      <h4 className="font-bold text-asili-gold mb-2 uppercase text-xs tracking-widest">Performance Fuel</h4>
                      <p className="text-sm text-asili-cream/50">Used by athletes for sustained energy release without the insulin spike of refined sugars.</p>
                    </div>
                    <div className="p-6 bg-white/5 rounded-2xl border border-white/10">
                      <h4 className="font-bold text-asili-gold mb-2 uppercase text-xs tracking-widest">Clinical Grade</h4>
                      <p className="text-sm text-asili-cream/50">High-diastase raw honey used for its potent antibacterial and digestive properties.</p>
                    </div>
                  </div>
                </div>
              </FadeIn>
            </div>
          </Section>

          {/* Luxury Catalogue */}
          <Section id="honey-catalogue" className="bg-asili-dark/50">
            <div className="max-w-6xl mx-auto">
              <div className="text-center mb-16">
                <FadeIn>
                  <span className="text-asili-gold font-mono text-sm tracking-widest uppercase mb-4 block underline decoration-asili-gold/40 underline-offset-8">The Gold Collection</span>
                  <h2 className="text-3xl sm:text-5xl md:text-6xl font-bold mb-4 gold-gradient italic text-center">Crafted with Intent</h2>
                  <p className="text-asili-cream/60 max-w-2xl mx-auto text-lg font-light">From clinical tinctures to artisanal infusions, explore the full depth of the Asili hive.</p>
                </FadeIn>
              </div>
              <CatalogueTabs data={HONEY_CATALOGUE} theme="luxury" />
            </div>
          </Section>

          {/* Traceability */}
          <Section id="traceability" className="bg-asili-black relative overflow-hidden">
            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-5"></div>
            <div className="max-w-6xl mx-auto relative z-10">
              <div className="text-center mb-20">
                <FadeIn>
                  <h2 className="text-3xl sm:text-5xl font-bold mb-4 gold-gradient">Farm-to-Jar DNA</h2>
                  <p className="text-asili-cream/60">Total transparency from the Makueni plains to your ritual.</p>
                </FadeIn>
              </div>
              
              <div className="grid md:grid-cols-4 gap-8">
                {[
                  { icon: <Home />, label: "Origin", val: "Makueni, Kenya", desc: "Arid Acacia flora for high medicinal potency." },
                  { icon: <Leaf />, label: "Harvested", val: "Seasonal Lots", desc: "Exact hive and date verified via your QR code." },
                  { icon: <Zap />, label: "Testing", val: "KeBS Certified", desc: "Batch tested for under 17% moisture content." },
                  { icon: <Users />, label: "Impact", val: "Direct Local Trade", desc: "Eliminating middlemen to support forest growth." }
                ].map((step, i) => (
                  <FadeIn key={i} delay={i * 0.1}>
                    <div className="text-center group">
                      <div className="w-16 h-16 bg-asili-gold/10 rounded-full flex items-center justify-center mx-auto mb-6 border border-asili-gold/20 group-hover:bg-asili-gold group-hover:text-asili-black transition-all">
                        {step.icon}
                      </div>
                      <h4 className="text-asili-gold font-bold mb-2 uppercase tracking-widest text-xs">{step.label}</h4>
                      <p className="text-xl font-bold mb-1">{step.val}</p>
                      <p className="text-sm text-asili-cream/40">{step.desc}</p>
                    </div>
                  </FadeIn>
                ))}
              </div>
            </div>
          </Section>

          {/* B2B / Bulk */}
          <Section id="b2b" className="bg-asili-dark border-t border-asili-gold/10">
            <div className="grid lg:grid-cols-2 gap-16 items-center">
              <FadeIn>
                <h2 className="text-5xl font-bold mb-8 gold-gradient italic">Enterprise Supply</h2>
                <p className="text-xl text-asili-cream/70 mb-10 leading-relaxed font-light">
                  Supplying certified raw materials—Bee Venom, Bee Pollen, and Bulk Honey—to the global pharmaceutical, cosmetic, and wellness sectors.
                </p>
                <div className="grid gap-6">
                  <div className="flex gap-4 p-6 bg-asili-gold/5 rounded-2xl border border-asili-gold/10">
                    <Rocket className="w-10 h-10 text-asili-gold flex-shrink-0" />
                    <div>
                      <h4 className="font-bold text-xl mb-1">Scalable Exports</h4>
                      <p className="text-asili-cream/50 text-sm">Targeting Diaspora markets in EU, US, and UAE with certified organic exports.</p>
                    </div>
                  </div>
                  <div className="flex gap-4 p-6 bg-asili-gold/5 rounded-2xl border border-asili-gold/10">
                    <Award className="w-10 h-10 text-asili-gold flex-shrink-0" />
                    <div>
                      <h4 className="font-bold text-xl mb-1">Quality Assurance</h4>
                      <p className="text-asili-cream/50 text-sm">Rigorous COA (Certificate of Analysis) provided for every bulk transaction.</p>
                    </div>
                  </div>
                </div>
              </FadeIn>

              <FadeIn delay={0.2}>
                <div className="bg-asili-black border border-asili-gold/20 p-10 rounded-[2rem] shadow-2xl">
                  <h3 className="text-2xl font-bold mb-6 text-asili-gold">B2B Inquiry Form</h3>
                  <form className="space-y-4" onSubmit={(e) => handleContactSubmit(e, "B2B Supply")}>
                    <div className="grid grid-cols-2 gap-4">
                      <input name="name" required type="text" placeholder="Name" className="bg-asili-dark border border-asili-gold/10 rounded-xl px-4 py-3 focus:border-asili-gold outline-none transition-all" />
                      <input name="email" required type="email" placeholder="Email" className="bg-asili-dark border border-asili-gold/10 rounded-xl px-4 py-3 focus:border-asili-gold outline-none transition-all" />
                    </div>
                    <input name="phone" type="tel" placeholder="Phone Number" className="w-full bg-asili-dark border border-asili-gold/10 rounded-xl px-4 py-3 focus:border-asili-gold outline-none transition-all" />
                    <input name="company" type="text" placeholder="Company / Institution" className="w-full bg-asili-dark border border-asili-gold/10 rounded-xl px-4 py-3 focus:border-asili-gold outline-none transition-all" />
                    <select name="interest" className="w-full bg-asili-dark border border-asili-gold/10 rounded-xl px-4 py-3 focus:border-asili-gold outline-none transition-all text-asili-cream/50">
                      <option>Bulk Honey</option>
                      <option>Medical Bee Venom</option>
                      <option>Bee Pollen (Pharma Grade)</option>
                      <option>White Labeling</option>
                    </select>
                    <textarea name="requirements" placeholder="Tell us about your requirements..." rows={4} className="w-full bg-asili-dark border border-asili-gold/10 rounded-xl px-4 py-3 focus:border-asili-gold outline-none transition-all"></textarea>
                    <button 
                      disabled={formStatus === "submitting"}
                      className="w-full bg-asili-gold text-asili-black font-bold py-4 rounded-xl shadow-lg hover:shadow-[0_0_30px_rgba(212,175,55,0.3)] transition-all disabled:opacity-50"
                    >
                      {formStatus === "submitting" ? "Sending..." : formStatus === "success" ? "Inquiry Sent!" : "Request Institutional Sample"}
                    </button>
                    {formStatus === "error" && <p className="text-red-500 text-xs text-center">Failed to send inquiry. Please try again.</p>}
                  </form>
                </div>
              </FadeIn>
            </div>
          </Section>
        </main>
      )}

      {/* Footer */}
      <footer className={cn(
        "py-32 px-6 md:px-12 lg:px-24 border-t relative overflow-hidden transition-colors duration-700",
        view === "luxury" ? "bg-asili-black text-asili-cream border-asili-gold/10" : "bg-asili-green text-white border-white/5"
      )}>
        <div className="max-w-7xl mx-auto relative z-10">
          <div className="grid lg:grid-cols-12 gap-16 md:gap-24 mb-20 text-center md:text-left">
            <div className="lg:col-span-5 space-y-10">
              <div className="flex items-center justify-center md:justify-start gap-3">
                <div className={cn(
                  "w-12 h-12 rounded-2xl flex items-center justify-center transition-all shadow-xl",
                  view === "luxury" ? "bg-asili-gold text-asili-black" : "bg-white text-asili-green"
                )}>
                  <Leaf className="w-7 h-7" />
                </div>
                <span className={cn(
                  "font-serif text-4xl font-bold tracking-tight transition-colors",
                  view === "luxury" ? "text-asili-gold" : "text-white"
                )}>ASILI</span>
              </div>
              <p className={cn(
                "text-lg leading-relaxed font-light opacity-60 max-w-md mx-auto md:mx-0",
                view === "luxury" ? "text-asili-cream" : "text-white"
              )}>
                {view === "luxury" 
                  ? "Bridging African heritage and scientific precision. Single-origin Makueni honey collection, crafted for the luxury wellness ritual."
                  : "Africa's Eco-Wellness Movement. Bridging African heritage and modern sustainable living through local, indigenous resources."
                }
              </p>
              
              <div className="pt-10 border-t border-white/10">
                <p className="italic text-xl font-serif leading-relaxed text-white">
                  "Healing people and the planet by returning to our origins is not just a mission—it is our essence."
                </p>
                <p className="mt-4 font-bold text-xs uppercase tracking-widest text-white/50">— Kevin Sila, Founder</p>
              </div>
            </div>

            <div className="lg:col-span-3 space-y-8">
              <h4 className={cn("text-xs font-bold uppercase tracking-widest", view === "luxury" ? "text-asili-gold" : "text-asili-honey")}>Navigate</h4>
              <nav className="flex flex-col gap-5 text-lg font-light opacity-60">
                {view === "brand" ? (
                  <>
                    <a href="#about" className="hover:opacity-100 transition-opacity">Our Vision</a>
                    <a href="#foundation" className="hover:opacity-100 transition-opacity">Laboratory</a>
                    <a href="#catalogue" className="hover:opacity-100 transition-opacity">Product Ecosystem</a>
                    <a href="#impact" className="hover:opacity-100 transition-opacity">Social Impact</a>
                  </>
                ) : (
                  <>
                    <a href="#maturity" className="hover:opacity-100 transition-opacity">Honey Maturity</a>
                    <a href="#honey-catalogue" className="hover:opacity-100 transition-opacity">Gold Label</a>
                    <a href="#traceability" className="hover:opacity-100 transition-opacity">Traceability Lab</a>
                    <a href="#b2b" className="hover:opacity-100 transition-opacity">B2B Supply</a>
                  </>
                )}
              </nav>
            </div>

            <div className="lg:col-span-4 space-y-8">
              <h4 className={cn("text-xs font-bold uppercase tracking-widest", view === "luxury" ? "text-asili-gold" : "text-asili-honey")}>Connect</h4>
              <div className="space-y-6">
                <a href="mailto:kevinsila100@gmail.com" className="group flex items-center justify-center md:justify-start gap-4 hover:translate-x-2 transition-transform">
                  <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center border border-white/10">
                    <Mail className={cn("w-5 h-5", view === "luxury" ? "text-asili-gold" : "text-asili-honey")} />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-widest opacity-40">Email Us</p>
                    <p className="font-bold opacity-80">kevinsila100@gmail.com</p>
                  </div>
                </a>
                <a href="https://wa.me/254717578394" target="_blank" rel="noopener noreferrer" className="group flex items-center justify-center md:justify-start gap-4 hover:translate-x-2 transition-transform">
                  <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center border border-white/10">
                    <Zap className={cn("w-5 h-5", view === "luxury" ? "text-asili-gold" : "text-asili-honey")} />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-widest opacity-40">WhatsApp</p>
                    <p className="font-bold opacity-80">+254 717 578 394</p>
                  </div>
                </a>
                <a href="https://linktr.ee/kevinsila" target="_blank" rel="noopener noreferrer" className="group flex items-center justify-center md:justify-start gap-4 hover:translate-x-2 transition-transform">
                  <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center border border-white/10">
                    <Globe className={cn("w-5 h-5", view === "luxury" ? "text-asili-gold" : "text-asili-honey")} />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-widest opacity-40">Connect</p>
                    <p className="font-bold opacity-80">linktr.ee/kevinsila</p>
                  </div>
                </a>
              </div>
            </div>
          </div>

          <div className="pt-10 border-t border-current opacity-20 flex flex-col md:flex-row justify-between items-center gap-6 text-[10px] font-bold uppercase tracking-[0.2em] font-sans">
            <p>© 2026 ASILI ECO-WELLNESS MOVEMENT. ALL RIGHTS RESERVED.</p>
            <p>ROOTED IN MAKUENI, KENYA</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
