import { motion } from 'framer-motion';
import { 
  ArrowRight, Shield, Activity, Brain, Users, Calendar,
  ChevronDown, CheckCircle2, Heart, Sparkles
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { useState } from 'react';

const fadeIn = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.5 }
};

const staggerContainer = {
  animate: {
    transition: {
      staggerChildren: 0.1
    }
  }
};

function TopNav() {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b border-border/40">
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Heart className="w-6 h-6 text-indigo-500 fill-indigo-500" />
          <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-500 to-purple-500">
            PetVerse
          </span>
        </div>
        <div className="hidden md:flex items-center gap-8 text-sm font-medium text-muted">
          <a href="#features" className="hover:text-foreground transition-colors">Features</a>
          <a href="#ai" className="hover:text-foreground transition-colors">AI Assistant</a>
          <a href="#pricing" className="hover:text-foreground transition-colors">Pricing</a>
          <a href="#faq" className="hover:text-foreground transition-colors">FAQ</a>
        </div>
        <div className="flex items-center gap-4">
          <Link to="/auth/login" className="text-sm font-medium hover:text-indigo-500 transition-colors">
            Log in
          </Link>
          <Link 
            to="/auth/register" 
            className="text-sm font-medium px-4 py-2 bg-foreground text-background rounded-full hover:bg-foreground/90 transition-colors"
          >
            Get Started
          </Link>
        </div>
      </div>
    </nav>
  );
}

function HeroSection() {
  return (
    <section className="pt-32 pb-20 px-6 relative overflow-hidden">
      {/* Background gradients */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-indigo-500/20 rounded-full blur-[120px] -z-10" />
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-purple-500/10 rounded-full blur-[100px] -z-10" />

      <div className="max-w-4xl mx-auto text-center mt-10">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-indigo-500/10 text-indigo-500 text-sm font-medium mb-8 border border-indigo-500/20"
        >
          <Sparkles className="w-4 h-4" />
          Introducing PetVerse Enterprise 2.0
        </motion.div>
        
        <motion.h1 
          className="text-5xl md:text-7xl font-extrabold tracking-tight mb-8 text-balance leading-tight"
          initial="initial" animate="animate" variants={fadeIn}
        >
          The intelligent operating system for{' '}
          <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500">
            modern pet care.
          </span>
        </motion.h1>
        
        <motion.p 
          className="text-lg md:text-xl text-muted mb-10 max-w-2xl mx-auto text-balance"
          initial="initial" animate="animate" variants={fadeIn} transition={{ delay: 0.1 }}
        >
          Unify medical records, automate reminders, and leverage AI to give your pets the premium care they deserve. Beautifully designed. Intelligently built.
        </motion.p>
        
        <motion.div 
          className="flex flex-col sm:flex-row items-center justify-center gap-4"
          initial="initial" animate="animate" variants={fadeIn} transition={{ delay: 0.2 }}
        >
          <Link 
            to="/auth/register" 
            className="flex items-center justify-center gap-2 w-full sm:w-auto px-8 py-4 bg-indigo-600 text-white rounded-full font-medium hover:bg-indigo-700 hover:shadow-lg hover:shadow-indigo-500/25 transition-all"
          >
            Start for free
            <ArrowRight className="w-4 h-4" />
          </Link>
          <a 
            href="#demo"
            className="flex items-center justify-center gap-2 w-full sm:w-auto px-8 py-4 bg-secondary text-secondary-foreground rounded-full font-medium hover:bg-secondary/80 transition-colors"
          >
            Book a demo
          </a>
        </motion.div>
      </div>

      <motion.div 
        className="max-w-6xl mx-auto mt-20 rounded-2xl border border-border/50 bg-card/50 backdrop-blur-xl shadow-2xl overflow-hidden p-2"
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4, duration: 0.7 }}
      >
        <div className="aspect-[16/9] w-full bg-secondary/30 rounded-xl overflow-hidden relative flex items-center justify-center border border-border/50">
          <div className="absolute inset-0 bg-gradient-to-tr from-indigo-500/5 to-purple-500/10" />
          <div className="text-center space-y-4 relative z-10">
            <Activity className="w-16 h-16 text-indigo-400 mx-auto opacity-50" />
            <p className="text-muted font-medium">Dashboard Interface Visualization</p>
          </div>
        </div>
      </motion.div>
    </section>
  );
}

function FeatureCard({ icon: Icon, title, description }: any) {
  return (
    <div className="p-6 rounded-2xl bg-card border border-border/50 hover:border-indigo-500/30 transition-colors group">
      <div className="w-12 h-12 rounded-xl bg-indigo-500/10 flex items-center justify-center mb-6 group-hover:scale-110 group-hover:bg-indigo-500/20 transition-all">
        <Icon className="w-6 h-6 text-indigo-500" />
      </div>
      <h3 className="text-lg font-bold mb-2 text-foreground">{title}</h3>
      <p className="text-muted leading-relaxed">{description}</p>
    </div>
  );
}

function FeaturesSection() {
  const features = [
    { icon: Activity, title: 'Health Tracking', description: 'Monitor vitals, track weight trends, and maintain a comprehensive medical history.' },
    { icon: Calendar, title: 'Smart Reminders', description: 'Automated alerts for vaccinations, medications, and vet appointments.' },
    { icon: Shield, title: 'Secure Identity', description: 'Digital Pet ID with QR technology for instant access to critical info if lost.' },
    { icon: Users, title: 'Care Network', description: 'Share profiles with family members, sitters, and veterinarians instantly.' }
  ];

  return (
    <section id="features" className="py-24 px-6 bg-secondary/30">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-5xl font-bold mb-4">Everything you need. Nothing you don't.</h2>
          <p className="text-xl text-muted max-w-2xl mx-auto">A complete suite of tools designed to remove the friction from pet care management.</p>
        </div>
        
        <motion.div 
          className="grid md:grid-cols-2 lg:grid-cols-4 gap-6"
          variants={staggerContainer}
          initial="initial"
          whileInView="animate"
          viewport={{ once: true }}
        >
          {features.map((f, i) => (
            <motion.div key={i} variants={fadeIn}>
              <FeatureCard {...f} />
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}

function AISection() {
  return (
    <section id="ai" className="py-24 px-6">
      <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-16 items-center">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/10 text-purple-500 text-sm font-medium mb-6">
            <Brain className="w-4 h-4" />
            AI-Powered
          </div>
          <h2 className="text-4xl md:text-5xl font-bold mb-6 leading-tight">
            Meet your personal <br/>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-500 to-pink-500">
              vet assistant.
            </span>
          </h2>
          <p className="text-lg text-muted mb-8">
            Analyze symptoms, get personalized diet recommendations, and identify breeds with our state-of-the-art vision models. Always on, always learning.
          </p>
          <ul className="space-y-4 mb-8">
            {['Symptom checker & triage guidance', 'Breed identification via photo', 'Customized nutritional planning'].map((item, i) => (
              <li key={i} className="flex items-center gap-3 text-foreground font-medium">
                <CheckCircle2 className="w-5 h-5 text-purple-500" />
                {item}
              </li>
            ))}
          </ul>
          <Link to="/auth/register" className="inline-flex items-center gap-2 text-purple-500 font-semibold hover:gap-3 transition-all">
            Explore AI Features <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
        <div className="relative">
          <div className="absolute inset-0 bg-gradient-to-tr from-purple-500/20 to-pink-500/20 blur-3xl -z-10 rounded-full" />
          <div className="bg-card border border-border/50 rounded-2xl p-6 shadow-2xl">
            <div className="space-y-4">
              <div className="flex gap-4 p-4 rounded-xl bg-secondary/50">
                <div className="w-8 h-8 rounded-full bg-primary/20 flex-shrink-0" />
                <div className="space-y-2 flex-1">
                  <div className="h-4 bg-muted/20 rounded w-3/4" />
                  <div className="h-4 bg-muted/20 rounded w-1/2" />
                </div>
              </div>
              <div className="flex gap-4 p-4 rounded-xl bg-purple-500/10 border border-purple-500/20 ml-8">
                <div className="w-8 h-8 rounded-full bg-purple-500/20 flex items-center justify-center flex-shrink-0">
                  <Brain className="w-4 h-4 text-purple-500" />
                </div>
                <div className="space-y-2 flex-1">
                  <div className="h-4 bg-purple-500/20 rounded w-5/6" />
                  <div className="h-4 bg-purple-500/20 rounded w-4/6" />
                  <div className="h-4 bg-purple-500/20 rounded w-3/4" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function PricingSection() {
  return (
    <section id="pricing" className="py-24 px-6 bg-secondary/30">
      <div className="max-w-7xl mx-auto text-center">
        <h2 className="text-3xl md:text-5xl font-bold mb-4">Simple, transparent pricing.</h2>
        <p className="text-xl text-muted max-w-2xl mx-auto mb-16">Start for free. Upgrade when your pack grows.</p>
        
        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {/* Free Tier */}
          <div className="p-8 rounded-3xl bg-card border border-border/50 text-left hover:border-indigo-500/30 transition-colors">
            <h3 className="text-2xl font-bold mb-2">Basic</h3>
            <div className="flex items-baseline gap-2 mb-6">
              <span className="text-4xl font-extrabold">₹0</span>
              <span className="text-muted">/ forever</span>
            </div>
            <p className="text-muted mb-8">Perfect for single pet owners.</p>
            <ul className="space-y-4 mb-8">
              {['1 Pet Profile', 'Basic Health Tracking', 'Standard Reminders', 'Community Access'].map((feat, i) => (
                <li key={i} className="flex items-center gap-3">
                  <CheckCircle2 className="w-5 h-5 text-indigo-500" />
                  <span>{feat}</span>
                </li>
              ))}
            </ul>
            <Link to="/auth/register" className="block w-full py-3 text-center rounded-xl bg-secondary text-secondary-foreground font-medium hover:bg-secondary/80 transition-colors">
              Get Started
            </Link>
          </div>

          {/* Pro Tier */}
          <div className="p-8 rounded-3xl bg-card border border-indigo-500/50 shadow-xl shadow-indigo-500/10 text-left relative overflow-hidden">
            <div className="absolute top-6 right-6 px-3 py-1 bg-indigo-500/10 text-indigo-500 text-xs font-bold rounded-full uppercase tracking-wider">
              Popular
            </div>
            <h3 className="text-2xl font-bold mb-2">Pro</h3>
            <div className="flex items-baseline gap-2 mb-6">
              <span className="text-4xl font-extrabold">₹499</span>
              <span className="text-muted">/ month</span>
            </div>
            <p className="text-muted mb-8">For the devoted multi-pet parent.</p>
            <ul className="space-y-4 mb-8">
              {['Unlimited Pets', 'Advanced AI Assistant', 'Medical Record Exports', 'Priority Reminders'].map((feat, i) => (
                <li key={i} className="flex items-center gap-3">
                  <CheckCircle2 className="w-5 h-5 text-indigo-500" />
                  <span>{feat}</span>
                </li>
              ))}
            </ul>
            <Link to="/auth/register" className="block w-full py-3 text-center rounded-xl bg-indigo-600 text-white font-medium hover:bg-indigo-700 transition-colors">
              Start Free Trial
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

function FAQSection() {
  const faqs = [
    { q: "Is PetVerse really free?", a: "Yes! Our core features for a single pet will always be free. We plan to introduce a Pro tier for multi-pet families and advanced AI features in the future." },
    { q: "How secure is my pet's medical data?", a: "We use enterprise-grade encryption for all data at rest and in transit. Your pet's records are private and only shared when you explicitly choose to." },
    { q: "Can I share my account with my partner?", a: "Family sharing is a feature we are actively developing and will be part of our upcoming release." },
    { q: "What kind of AI features are included?", a: "The AI Assistant can help suggest breed types from photos, provide dietary guidelines based on age/weight, and offer general care advice. (Note: Always consult a real vet for medical emergencies)." }
  ];

  return (
    <section id="faq" className="py-24 px-6">
      <div className="max-w-3xl mx-auto">
        <h2 className="text-3xl md:text-4xl font-bold mb-12 text-center">Frequently asked questions</h2>
        <div className="space-y-4">
          {faqs.map((faq, i) => (
            <FAQItem key={i} question={faq.q} answer={faq.a} />
          ))}
        </div>
      </div>
    </section>
  );
}

function FAQItem({ question, answer }: { question: string, answer: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border border-border/50 rounded-2xl bg-card overflow-hidden">
      <button 
        className="w-full px-6 py-4 flex items-center justify-between font-medium text-left hover:bg-secondary/50 transition-colors"
        onClick={() => setOpen(!open)}
      >
        {question}
        <ChevronDown className={`w-5 h-5 text-muted transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <div className="px-6 pb-4 text-muted border-t border-border/50 pt-4 bg-secondary/10">
          {answer}
        </div>
      )}
    </div>
  );
}

function Footer() {
  return (
    <footer className="border-t border-border/50 bg-card py-12 px-6">
      <div className="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8 mb-12">
        <div className="col-span-2">
          <div className="flex items-center gap-2 mb-4">
            <Heart className="w-6 h-6 text-indigo-500 fill-indigo-500" />
            <span className="text-xl font-bold">PetVerse</span>
          </div>
          <p className="text-muted max-w-sm mb-6">
            Building the operating system for modern pet care. Because they deserve the best.
          </p>
          <div className="flex gap-4 text-muted">
            {/* Social links removed because lucide-react deprecated brand icons */}
          </div>
        </div>
        <div>
          <h4 className="font-bold mb-4">Product</h4>
          <ul className="space-y-2 text-muted">
            <li><a href="#features" className="hover:text-foreground">Features</a></li>
            <li><a href="#pricing" className="hover:text-foreground">Pricing</a></li>
            <li><a href="#ai" className="hover:text-foreground">AI Assistant</a></li>
          </ul>
        </div>
        <div>
          <h4 className="font-bold mb-4">Company</h4>
          <ul className="space-y-2 text-muted">
            <li><a href="#" className="hover:text-foreground">About</a></li>
            <li><a href="#" className="hover:text-foreground">Blog</a></li>
            <li><a href="#" className="hover:text-foreground">Contact</a></li>
          </ul>
        </div>
      </div>
      <div className="max-w-7xl mx-auto pt-8 border-t border-border/50 flex flex-col md:flex-row items-center justify-between text-sm text-muted">
        <p>© {new Date().getFullYear()} PetVerse Inc. All rights reserved.</p>
        <div className="flex gap-6 mt-4 md:mt-0">
          <a href="#" className="hover:text-foreground">Privacy Policy</a>
          <a href="#" className="hover:text-foreground">Terms of Service</a>
        </div>
      </div>
    </footer>
  );
}

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background text-foreground selection:bg-indigo-500/30">
      <TopNav />
      <HeroSection />
      <FeaturesSection />
      <AISection />
      <PricingSection />
      <FAQSection />
      <Footer />
    </div>
  );
}